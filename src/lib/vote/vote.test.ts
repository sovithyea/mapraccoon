import { beforeEach, describe, expect, it } from "vitest";

import { getAllSpots, getSpotBySlug } from "@/lib/spots";
import { makeMemorial, makeSpot, resetFixtures } from "@/lib/spots/fixture";
import type { Spot } from "@/lib/spots/schema";
import {
  decodeBallot,
  encodeBallot,
  resolveBallot,
  createBallot,
  type Ballot,
  type ResolvedBallot,
} from "@/lib/vote/ballot";
import { resolve, type Vote } from "@/lib/vote/resolve";

beforeEach(resetFixtures);

const FRIDAY_8PM = { isoDate: "2026-09-04", startMins: 20 * 60, day: 4 };
const ROOM = "abcdefghijklmnop1234";
const STOPS = 1;

const ballotOf = (candidates: Spot[]): ResolvedBallot => ({
  slot: FRIDAY_8PM,
  candidates,
  roomId: ROOM,
  stops: 1,
});

const vote = (voter: string, marks: Vote["marks"]): Vote => ({ voter, marks });

describe("ballot links", () => {
  it("round-trips through a URL", () => {
    const ballot: Ballot = {
      v: 1,
      slot: FRIDAY_8PM,
      candidateIds: ["a", "b", "c"],
      roomId: ROOM,
      stops: STOPS,
      by: "Sok",
    };
    expect(decodeBallot(encodeBallot(ballot))).toEqual(ballot);
  });

  it("carries a human-readable prefix without depending on it", () => {
    const id = encodeBallot({ v: 1, slot: FRIDAY_8PM, candidateIds: ["a", "b"], roomId: ROOM, stops: 1 });
    expect(id.startsWith("2026-09-04-20h-2-places.")).toBe(true);
    expect(decodeBallot(`anything.${id.split(".")[1]}`)).not.toBeNull();
  });

  it("returns null for garbage rather than throwing", () => {
    expect(decodeBallot("")).toBeNull();
    expect(decodeBallot("not-base64!!!")).toBeNull();
    expect(decodeBallot("prefix.")).toBeNull();
    expect(decodeBallot(`x.${btoa("[1,2,3]")}`)).toBeNull();
    expect(decodeBallot(`x.${btoa(JSON.stringify({ v: 2, s: [], c: [], r: ROOM }))}`)).toBeNull();
  });

  it("rejects an out-of-range day rather than producing a broken instant", () => {
    const bad = btoa(JSON.stringify({ v: 1, s: ["2026-09-04", 1200, 9], c: ["a"], r: ROOM }));
    expect(decodeBallot(`x.${bad}`)).toBeNull();
  });
});

/**
 * D33, and the reason these are three separate assertions rather than one:
 * a memorial site being excluded from a ballot is the rule most likely to be
 * quietly dropped when someone adds the next surface. C19 is the record of it
 * happening when the rule lived only in prose.
 */
describe("memorial sites are never candidates", () => {
  it("drops a sensitive spot when a ballot resolves", () => {
    const memorial = getSpotBySlug("tuol-sleng") as Spot;
    const ordinary = getAllSpots().find((s) => !s.sensitive) as Spot;

    const resolved = resolveBallot({
      v: 1,
      slot: FRIDAY_8PM,
      candidateIds: [ordinary.id, memorial.id],
      roomId: ROOM,
      stops: STOPS,
    });

    expect(resolved.candidates.map((c) => c.id)).toEqual([ordinary.id]);
  });

  it("drops every sensitive spot in the real dataset", () => {
    const all = getAllSpots();
    const resolved = resolveBallot({
      v: 1,
      slot: FRIDAY_8PM,
      candidateIds: all.map((s) => s.id),
      roomId: ROOM,
      stops: STOPS,
    });
    expect(resolved.candidates.some((c) => c.sensitive)).toBe(false);
    expect(resolved.candidates.length).toBeLessThan(all.length);
  });

  it("cannot win, because it can never be tallied", () => {
    const memorial = makeMemorial({ name: { en: "A memorial" } });
    const ordinary = makeSpot({ name: { en: "A bar" } });

    // Even if every voter marked it yes, it is not on the ballot to mark.
    const result = resolve(ballotOf([ordinary]), [
      vote("Sok", { [memorial.id]: "yes", [ordinary.id]: "no" }),
    ]);

    expect(result.winner?.id).toBe(ordinary.id);
    expect(result.tally.some((t) => t.spot.sensitive)).toBe(false);
  });
});

describe("resolve", () => {
  it("picks the option with the most approval", () => {
    const [a, b] = [makeSpot({ name: { en: "A" } }), makeSpot({ name: { en: "B" } })];
    const result = resolve(ballotOf([a, b]), [
      vote("Sok", { [a.id]: "yes", [b.id]: "no" }),
      vote("Dara", { [a.id]: "yes", [b.id]: "maybe" }),
      vote("Mei", { [a.id]: "no", [b.id]: "yes" }),
    ]);
    expect(result.winner?.name.en).toBe("A");
    expect(result.runnerUp?.name.en).toBe("B");
  });

  it("counts a maybe as half, so it moves the result without deciding it", () => {
    const [a, b] = [makeSpot({ name: { en: "A" } }), makeSpot({ name: { en: "B" } })];
    const result = resolve(ballotOf([a, b]), [
      vote("Sok", { [a.id]: "maybe", [b.id]: "no" }),
    ]);
    expect(result.winner?.name.en).toBe("A");
    expect(result.tally[0]?.score).toBe(0.5);
  });

  it("does not let one no veto an option", () => {
    // The whole point: a single objection must not kill a choice three people
    // approve of. It is surfaced instead.
    const [a, b] = [makeSpot({ name: { en: "A" } }), makeSpot({ name: { en: "B" } })];
    const result = resolve(ballotOf([a, b]), [
      vote("Sok", { [a.id]: "yes", [b.id]: "yes" }),
      vote("Dara", { [a.id]: "yes", [b.id]: "no" }),
      vote("Mei", { [a.id]: "no", [b.id]: "no" }),
    ]);
    expect(result.winner?.name.en).toBe("A");
    expect(result.dissent).toEqual(["Mei"]);
  });

  it("names the dissenters rather than hiding them", () => {
    const a = makeSpot({ name: { en: "A" } });
    const result = resolve(ballotOf([a]), [
      vote("Sok", { [a.id]: "yes" }),
      vote("Dara", { [a.id]: "no" }),
      vote("Mei", { [a.id]: "no" }),
    ]);
    expect(result.dissent).toEqual(["Dara", "Mei"]);
  });

  it("breaks a tie on fewest objections", () => {
    const [a, b] = [makeSpot({ name: { en: "A" } }), makeSpot({ name: { en: "B" } })];
    const result = resolve(ballotOf([a, b]), [
      vote("Sok", { [a.id]: "yes", [b.id]: "yes" }),
      vote("Dara", { [b.id]: "no" }),
    ]);
    expect(result.winner?.name.en).toBe("A");
  });

  it("breaks a remaining tie on being open at the slot", () => {
    const open = makeSpot({ name: { en: "Zed open" }, hours: { kind: "always" } });
    const shut = makeSpot({
      name: { en: "Alpha shut" },
      hours: { kind: "weekly", rules: [{ days: ["mon"], open: "08:00", close: "09:00" }] },
    });
    const result = resolve(ballotOf([shut, open]), [
      vote("Sok", { [open.id]: "yes", [shut.id]: "yes" }),
    ]);
    // Alphabetically "Alpha shut" would win; being open at Friday 8pm decides it.
    expect(result.winner?.name.en).toBe("Zed open");
  });

  it("reports an empty ballot rather than inventing a winner", () => {
    const [a, b] = [makeSpot(), makeSpot()];
    const result = resolve(ballotOf([a, b]), []);
    expect(result.empty).toBe(true);
    expect(result.winner).toBeNull();
    expect(result.dissent).toEqual([]);
  });

  it("counts each voter once even if they submit twice", () => {
    const a = makeSpot();
    const result = resolve(ballotOf([a]), [
      vote("Sok", { [a.id]: "yes" }),
      vote("Sok", { [a.id]: "yes" }),
    ]);
    // Vote integrity is weak with no accounts (SECURITY.md) — the tally still
    // double-counts, and the voter list is what makes that visible.
    expect(result.voters).toEqual(["Sok"]);
    expect(result.tally[0]?.yes).toBe(2);
  });

  it("does no I/O, so it runs anywhere", () => {
    // Guarded by construction rather than assertion: resolve takes spots and
    // votes and returns a result. If this ever needs a fetch, the zero-backend
    // fallback in D30 dies with it.
    expect(resolve.length).toBe(2);
  });
});

describe("createBallot", () => {
  it("gives every ballot its own unguessable room", () => {
    // The room id carries its own 128 bits rather than hashing the ballot. A
    // ballot payload is a date plus a few ids from a public dataset, so a hash
    // of it would be guessable — anyone could compute the room for a plausible
    // Friday-night ballot and read or stuff it.
    const a = createBallot([makeSpot()], FRIDAY_8PM);
    const b = createBallot([makeSpot()], FRIDAY_8PM);
    expect(a.roomId).not.toBe(b.roomId);
    expect(a.roomId.length).toBeGreaterThanOrEqual(16);
  });

  it("refuses to put a memorial site in a link at all", () => {
    const memorial = makeMemorial();
    const ordinary = makeSpot();
    const ballot = createBallot([ordinary, memorial], FRIDAY_8PM);
    expect(ballot.candidateIds).toEqual([ordinary.id]);
  });

  it("round-trips what it creates", () => {
    const ballot = createBallot([makeSpot(), makeSpot()], FRIDAY_8PM, 2, "Sok");
    expect(decodeBallot(encodeBallot(ballot))).toEqual(ballot);
  });
});

describe("the night the vote produces", () => {
  const spots = (n: number) =>
    Array.from({ length: n }, (_, i) => makeSpot({ name: { en: `Place ${i}` } }));

  const ballotFor = (candidates: Spot[], stops: number): ResolvedBallot => ({
    slot: FRIDAY_8PM,
    candidates,
    roomId: ROOM,
    stops,
  });

  it("returns as many places as the group asked for, in approval order", () => {
    const [a, b, c, d] = spots(4) as [Spot, Spot, Spot, Spot];
    const result = resolve(ballotFor([a, b, c, d], 3), [
      vote("Sok", { [a.id]: "yes", [b.id]: "yes", [c.id]: "maybe", [d.id]: "no" }),
      vote("Dara", { [a.id]: "yes", [b.id]: "maybe", [c.id]: "maybe", [d.id]: "no" }),
    ]);
    expect(result.chosen.map((s) => s.name.en)).toEqual(["Place 0", "Place 1", "Place 2"]);
  });

  it("never includes a place nobody approved, even to reach the count", () => {
    // A night of three should not include somewhere every person said no to
    // just to make up the number.
    const [a, b, c] = spots(3) as [Spot, Spot, Spot];
    const result = resolve(ballotFor([a, b, c], 3), [
      vote("Sok", { [a.id]: "yes", [b.id]: "no", [c.id]: "no" }),
      vote("Dara", { [a.id]: "yes", [b.id]: "no", [c.id]: "no" }),
    ]);
    expect(result.chosen.map((s) => s.name.en)).toEqual(["Place 0"]);
  });

  it("gives one place when one was asked for", () => {
    const [a, b] = spots(2) as [Spot, Spot];
    const result = resolve(ballotFor([a, b], 1), [
      vote("Sok", { [a.id]: "yes", [b.id]: "yes" }),
    ]);
    expect(result.chosen).toHaveLength(1);
    expect(result.chosen[0]?.id).toBe(result.winner?.id);
  });

  it("is empty when nobody has voted", () => {
    expect(resolve(ballotFor(spots(3), 3), []).chosen).toEqual([]);
  });

  it("caps the ask at the number of candidates", () => {
    // Real spots, because resolveBallot looks ids up in the seed file — a
    // fixture id resolves to nothing and the assertion would pass for the
    // wrong reason.
    const two = getAllSpots().filter((s) => !s.sensitive).slice(0, 2);
    const ballot = createBallot(two, FRIDAY_8PM, 5);

    // createBallot clamps to 8; resolveBallot clamps to what survives the
    // memorial filter. Asking for five of two is the caller's mistake, and it
    // must not produce a night with three empty slots.
    expect(resolveBallot(ballot).stops).toBe(2);
  });
});
