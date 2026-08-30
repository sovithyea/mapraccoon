import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * Structural guards on the vote store.
 *
 * `room.ts` is `server-only`, so importing it here is a build error — which is
 * exactly the protection the service key needs and exactly what stops the
 * one-vote-per-person rule from being asserted by calling it. The source is
 * read as text instead, the same shape `plottable.test.ts` uses.
 *
 * These check the store's SIDE of D40. `vote.test.ts` checks the resolver's.
 * Both exist because either alone is removable without a failing test: a
 * resolver that de-duplicates hides a store that appends, and a store with a
 * unique index is undone by the first writer that is not this route.
 */

const ROOM_SRC = readFileSync("src/lib/vote/room.ts", "utf8");
const MIGRATION_SRC = readFileSync(
  "supabase/migrations/0002_one_vote_per_person.sql",
  "utf8",
);

describe("one vote per person (D40)", () => {
  it("writes votes with an upsert", () => {
    // The call, not the word — a mention of "upsert" in prose must not satisfy
    // this. C30 is the record of a structural test that passed on an import
    // line alone.
    expect(ROOM_SRC).toMatch(/\.upsert\(/);
  });

  it("only ever inserts after removing that voter's previous row", () => {
    // There IS an insert, on the 42P10 path taken when migration 0002 has not
    // been applied. It is only safe because a delete keyed on the same voter
    // runs first — an insert that lost that delete would restore the exact
    // double-count D40 removed, and would do it only on the un-migrated
    // deployments nobody tests.
    if (/\.insert\(/.test(ROOM_SRC)) {
      expect(ROOM_SRC).toMatch(/\.delete\(\)[\s\S]{0,120}?\.eq\(\s*["'`]voter["'`]/);
    }
  });

  it("names (room_id, voter) as the conflict target", () => {
    // Without this the upsert falls back to the primary key, which is a
    // generated identity and therefore never conflicts — it would behave
    // exactly like the insert it replaced, silently.
    expect(ROOM_SRC).toMatch(/onConflict:\s*["'`]room_id,\s*voter["'`]/);
  });

  it("refreshes created_at so a re-vote is not swept on the old clock", () => {
    expect(ROOM_SRC).toMatch(/created_at:/);
  });

  it("has the unique index the upsert infers from", () => {
    expect(MIGRATION_SRC).toMatch(
      /create\s+unique\s+index[\s\S]*?on\s+public\.votes\s*\(\s*room_id\s*,\s*voter\s*\)/i,
    );
  });

  it("clears existing duplicates first, or the index cannot be created", () => {
    // A migration that only adds the index fails on any room that already has
    // a re-vote in it — which is every room this defect has touched.
    expect(MIGRATION_SRC).toMatch(/delete\s+from\s+public\.votes/i);
  });
});
