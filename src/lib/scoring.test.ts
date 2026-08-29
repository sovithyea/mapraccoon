import { beforeEach, describe, expect, it } from "vitest";

import { sortByName, sortSpots } from "@/lib/scoring";
import { makeSpot, resetFixtures } from "@/lib/spots/fixture";

/**
 * What is left of this suite after D28.
 *
 * It used to assert that the famous places sort last — the product's central
 * claim, checked against the real dataset. That claim is gone, and those tests
 * went with it rather than being weakened into something that still passes.
 * `open-now` arrives in step 4 with its own table-driven suite at fixed
 * instants.
 *
 * Built spots, not seed content: ordering is a pure function, and the rule is
 * that only `spots.test.ts` asserts against the dataset.
 */
beforeEach(resetFixtures);

const named = (...names: string[]) =>
  names.map((en) => makeSpot({ name: { en } }));

describe("sortSpots", () => {
  it("orders by name", () => {
    const spots = named("Wat Phnom", "Central Market", "Romdeng");
    expect(sortSpots(spots, "name").map((s) => s.name.en)).toEqual([
      "Central Market",
      "Romdeng",
      "Wat Phnom",
    ]);
  });

  it("does not mutate its input", () => {
    const spots = named("Zed", "Alpha");
    const before = spots.map((s) => s.name.en);
    sortSpots(spots, "name");
    expect(spots.map((s) => s.name.en)).toEqual(before);
  });

  it("returns every spot exactly once", () => {
    const spots = named("A", "B", "C", "D");
    const sorted = sortByName(spots);
    expect(sorted).toHaveLength(4);
    expect(new Set(sorted.map((s) => s.id)).size).toBe(4);
  });

  it("uses locale comparison rather than code-point order", () => {
    // "École" sorts before "Zoo" for a reader, and after it by code point.
    const sorted = sortSpots(named("Zoo", "École"), "name");
    expect(sorted.map((s) => s.name.en)).toEqual(["École", "Zoo"]);
  });
});
