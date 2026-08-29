import { describe, expect, it } from "vitest";

import { sortByName, sortSpots } from "@/lib/scoring";
import { getAllSpots } from "@/lib/spots";

/**
 * What is left of this suite after D28.
 *
 * It used to assert that the famous places sort last — the product's central
 * claim. That claim is gone, and the tests that carried it went with it rather
 * than being weakened into something that passes. `open-now` arrives in step 4
 * and brings its own table-driven suite at fixed instants.
 */
describe("sortSpots", () => {
  it("orders by name", () => {
    const sorted = sortSpots(getAllSpots(), "name");
    const names = sorted.map((s) => s.name.en);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("does not mutate its input", () => {
    const original = getAllSpots();
    const before = original.map((s) => s.id);
    sortSpots(original, "name");
    expect(original.map((s) => s.id)).toEqual(before);
  });

  it("returns every spot exactly once", () => {
    const sorted = sortByName(getAllSpots());
    expect(sorted).toHaveLength(getAllSpots().length);
    expect(new Set(sorted.map((s) => s.id)).size).toBe(sorted.length);
  });
});
