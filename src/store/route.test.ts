import { beforeEach, describe, expect, it } from "vitest";

import { makeMemorial, makeSpot, resetFixtures } from "@/lib/spots/fixture";
import type { Spot } from "@/lib/spots/schema";
import { describeReorder, shortestDrivingOrder, travelMinutesFor } from "@/store/route";

/**
 * `shortestDrivingOrder` and `describeReorder` are pure functions over `Spot[]`
 * — they never look anything up — so they take built spots. The fixture spaces
 * coordinates apart deterministically, which is all these need.
 */
beforeEach(resetFixtures);

const someSpots = (n: number): Spot[] => Array.from({ length: n }, () => makeSpot());

describe("shortestDrivingOrder", () => {
  it("leaves a day of fewer than three stops alone", () => {
    const two = someSpots(2);
    expect(shortestDrivingOrder(two).map((s) => s.id)).toEqual(two.map((s) => s.id));
  });

  it("never moves the first stop — that is where the traveller starts", () => {
    const day = someSpots(5);
    expect(shortestDrivingOrder(day)[0]?.id).toBe(day[0]?.id);
  });

  it("keeps every stop exactly once", () => {
    const day = someSpots(5);
    const ordered = shortestDrivingOrder(day);
    expect([...ordered.map((s) => s.id)].sort()).toEqual([...day.map((s) => s.id)].sort());
  });

  it("never returns a longer drive than the order it was given", () => {
    const day = someSpots(6);
    expect(travelMinutesFor(shortestDrivingOrder(day))).toBeLessThanOrEqual(
      travelMinutesFor(day),
    );
  });
});

describe("describeReorder", () => {
  it("reports the minutes saved", () => {
    const day = someSpots(6);
    const { savedMins } = describeReorder(day, shortestDrivingOrder(day));
    expect(savedMins).toBeGreaterThanOrEqual(0);
  });

  it("names a memorial site the reordering moved", () => {
    // D25: an optimiser that silently reshuffles a day containing a killing
    // site is the wrong kind of clever, so the caller must be able to say so.
    const memorial = makeMemorial();
    const others = someSpots(2);

    const before = [others[0] as Spot, memorial, others[1] as Spot];
    const after = [others[0] as Spot, others[1] as Spot, memorial];

    expect(describeReorder(before, after).movedSensitive.map((s) => s.id)).toEqual([
      memorial.id,
    ]);
  });

  it("reports nothing moved when the order is unchanged", () => {
    const day = someSpots(4);
    expect(describeReorder(day, day).movedSensitive).toEqual([]);
  });
});
