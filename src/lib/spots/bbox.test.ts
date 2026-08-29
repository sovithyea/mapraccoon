import { describe, expect, it } from "vitest";

import { spotsSchema, type SpotInput } from "@/lib/spots/schema";

/**
 * Acceptance criterion 2.
 *
 * The country-wide box would happily accept a coordinate typo that lands a
 * BKK1 bar in Siem Reap — inside Cambodia, and 300km from where it says it is.
 * The tight box catches that at build time, which is worth ten lines of
 * refinement.
 *
 * Built as `SpotInput`, not by spreading a parsed `Spot`: the schema
 * transforms hours from strings to minutes, so a round-tripped spot fails
 * parsing for an unrelated reason and the test passes for the wrong one.
 */
const base: SpotInput = {
  id: "t",
  slug: "t",
  neighbourhood: "bkk1",
  categories: ["bar"],
  name: { en: "Test" },
  coords: [104.92, 11.55],
  blurb: { en: "A test venue." },
  hours: { kind: "always" },
  priceLevel: 2,
  lastVerified: "2026-08-29",
  hoursSource: "imported",
  practical: { typicalDurationMins: 60 },
  sources: ["https://example.org/x"],
};

const parses = (s: SpotInput): boolean => spotsSchema.safeParse([s]).success;

describe("the conditional bounding box", () => {
  it("accepts a Phnom Penh venue at Phnom Penh coordinates", () => {
    expect(parses(base)).toBe(true);
  });

  it("rejects a typo that lands inside Cambodia but nowhere near the city", () => {
    // Siem Reap. The old country-wide box would have accepted this silently.
    expect(parses({ ...base, coords: [103.85, 13.36] })).toBe(false);
  });

  it("accepts those same coordinates for a day trip", () => {
    expect(parses({ ...base, neighbourhood: "out-of-town", coords: [103.85, 13.36] })).toBe(true);
  });

  it("rejects reversed lat/lng", () => {
    // The classic bug. Phnom Penh's longitude and latitude ranges do not
    // overlap, so swapping them always lands outside the box.
    expect(parses({ ...base, coords: [11.55, 104.92] })).toBe(false);
  });

  it("names the offending slug and the order in its message", () => {
    // Read the issue, not JSON.stringify of it — stringify escapes the quotes
    // around the slug and the substring check silently never matches.
    const r = spotsSchema.safeParse([{ ...base, coords: [103.85, 13.36] }]);
    const message = r.success ? "" : (r.error.issues[0]?.message ?? "");

    expect(message).toContain('"t" is at');
    expect(message).toContain("outside Phnom Penh");
    // The message says which order it wanted, because that is the actual bug
    // nine times out of ten.
    expect(message).toContain("longitude, latitude");
  });
});
