import { beforeEach, describe, expect, it } from "vitest";

import {
  costOfAdding,
  dayBudget,
  defaultFrame,
  fullThresholdMins,
  stopDwell,
  type RouteStop,
} from "@/lib/route/day";
import { makeMemorial, makeSpot, resetFixtures } from "@/lib/spots/fixture";
import type { Spot } from "@/lib/spots/schema";

/**
 * Built, not borrowed. These assertions are about scheduling arithmetic, and
 * coupling them to the seed file made fifteen of them break when D27 deleted
 * three neighbourhoods — none because the arithmetic was wrong.
 */
beforeEach(resetFixtures);

const asStop = (s: Spot): RouteStop => ({ spot: s, dwellMins: stopDwell(s) });

describe("dayBudget", () => {
  it("reports an empty day as empty, not as room", () => {
    const budget = dayBudget([]);
    expect(budget.state).toBe("empty");
    expect(budget.plannedMins).toBe(0);
    expect(budget.endMins).toBe(defaultFrame.start);
  });

  it("schedules the first stop at the start time with no leg", () => {
    const budget = dayBudget([asStop(makeSpot())]);
    const first = budget.stops[0];

    expect(first?.arrivalMins).toBe(defaultFrame.start);
    expect(first?.legFrom).toBeUndefined();
    expect(budget.travelMins).toBe(0);
  });

  it("pushes each later stop out by its travel leg", () => {
    const stops = [asStop(makeSpot()), asStop(makeSpot())];
    const budget = dayBudget(stops);
    const [first, second] = budget.stops;

    expect(second?.legFrom?.minutes).toBeGreaterThan(0);
    expect(second?.arrivalMins).toBe(
      (first?.departureMins ?? 0) + (second?.legFrom?.minutes ?? 0),
    );
    expect(budget.travelMins).toBe(second?.legFrom?.minutes);
  });

  it("goes over when the plan runs past the frame, and reports by how much", () => {
    // One absurd dwell is the cleanest way to force the state without
    // depending on how many real spots happen to fit.
    const budget = dayBudget([{ spot: makeSpot(), dwellMins: 10 * 60 }]);

    expect(budget.state).toBe("over");
    expect(budget.overrunMins).toBe(
      defaultFrame.start + 10 * 60 - defaultFrame.frameEnd,
    );
    expect(budget.remainingMins).toBe(0);
  });

  it("is full — not over — when less than the threshold remains", () => {
    const threshold = fullThresholdMins();
    const dwell = defaultFrame.frameEnd - defaultFrame.start - Math.floor(threshold / 2);
    const budget = dayBudget([{ spot: makeSpot(), dwellMins: dwell }]);

    expect(budget.overrunMins).toBe(0);
    expect(budget.remainingMins).toBeLessThan(threshold);
    expect(budget.state).toBe("full");
  });

  it("marks a memorial stop as sensitive in the schedule", () => {
    const budget = dayBudget([asStop(makeMemorial()), asStop(makeMemorial())]);
    expect(budget.stops.map((s) => s.isSensitive)).toEqual([true, true]);
  });

  it("does not mark an ordinary stop as sensitive", () => {
    const ordinary = makeSpot();
    expect(dayBudget([asStop(ordinary)]).stops[0]?.isSensitive).toBe(false);
  });
});

describe("fullThresholdMins", () => {
  it("is the shortest dwell plus the shortest same-city hop", () => {
    expect(fullThresholdMins()).toBeGreaterThan(0);
  });

  it("moves when a shorter spot enters the dataset", () => {
    // The point of D24: "full" is derived from the content, so writing a
    // 15-minute spot must change the threshold rather than leave a stale
    // constant behind.
    const dataset = [makeSpot(), makeSpot(), makeSpot()];
    const before = fullThresholdMins(dataset);

    const shortest = [...dataset].sort(
      (a, b) => stopDwell(a) - stopDwell(b),
    )[0] as Spot;

    const withShorter: Spot[] = [
      ...dataset,
      {
        ...shortest,
        id: "test-quick-stop",
        slug: "test-quick-stop",
        practical: { ...shortest.practical, typicalDurationMins: 15 },
      },
    ];

    expect(fullThresholdMins(withShorter)).toBeLessThan(before);
  });
});

describe("costOfAdding", () => {
  it("prices a first stop as dwell only", () => {
    const candidate = makeSpot();
    const cost = costOfAdding([], candidate);

    expect(cost.legMins).toBe(0);
    expect(cost.dwellMins).toBe(stopDwell(candidate));
    expect(cost.addedMins).toBe(cost.dwellMins);
    expect(cost.fits).toBe(true);
  });

  it("prices a later stop as travel plus dwell", () => {
    const cost = costOfAdding([asStop(makeSpot())], makeSpot());
    expect(cost.legMins).toBeGreaterThan(0);
    expect(cost.addedMins).toBe(cost.legMins + cost.dwellMins);
  });

  it("reports the overrun instead of refusing, so nothing is ever disabled", () => {
    const stops = [{ spot: makeSpot(), dwellMins: 8 * 60 }];
    const cost = costOfAdding(stops, makeSpot());

    expect(cost.fits).toBe(false);
    expect(cost.overrunMins).toBeGreaterThan(0);
  });
});


/**
 * Pinned start times (D44).
 *
 * The day used to be packable and nothing else: stop one began when the day
 * began, and everything else fell in behind it. These cover the property that
 * replaced that — a pin is honoured *exactly*, and the consequence is reported
 * rather than absorbed.
 */
describe("pinning a stop to a time", () => {
  const a = makeSpot({ id: "a", coords: [104.92, 11.55] });
  const b = makeSpot({ id: "b", coords: [104.93, 11.56] });

  const frame = { start: 8 * 60, frameStart: 8 * 60, frameEnd: 22 * 60 };

  it("still packs when nothing is pinned", () => {
    const { stops } = dayBudget(
      [
        { spot: a, dwellMins: 60 },
        { spot: b, dwellMins: 60 },
      ],
      frame,
    );
    expect(stops[0]?.arrivalMins).toBe(8 * 60);
    expect(stops[0]?.slackMins).toBe(0);
    expect(stops[1]?.arrivalMins).toBeGreaterThan(9 * 60);
  });

  it("starts a pinned stop at exactly the time asked for", () => {
    const { stops } = dayBudget(
      [
        { spot: a, dwellMins: 60 },
        { spot: b, dwellMins: 60, startMins: 20 * 60 },
      ],
      frame,
    );
    // Not "as close as it could get". The group said 20:00.
    expect(stops[1]?.arrivalMins).toBe(20 * 60);
    expect(stops[1]?.departureMins).toBe(21 * 60);
  });

  it("reports the wait rather than hiding it", () => {
    const { stops, waitMins } = dayBudget(
      [
        { spot: a, dwellMins: 60 },
        { spot: b, dwellMins: 60, startMins: 20 * 60 },
      ],
      frame,
    );
    const gap = 20 * 60 - (stops[1]?.earliestMins ?? 0);
    expect(stops[1]?.slackMins).toBe(gap);
    expect(waitMins).toBe(gap);
  });

  it("reports a clash instead of quietly moving the pin", () => {
    // Pinned before it is reachable. Clamping would show a time nobody chose,
    // which is worse than showing an impossible one and saying so.
    const { stops, clashMins } = dayBudget(
      [
        { spot: a, dwellMins: 120 },
        { spot: b, dwellMins: 60, startMins: 8 * 60 + 30 },
      ],
      frame,
    );
    expect(stops[1]?.arrivalMins).toBe(8 * 60 + 30);
    expect(stops[1]?.slackMins).toBeLessThan(0);
    expect(clashMins).toBeGreaterThan(0);
  });

  it("lets a pin push the day past the frame, and counts it as overrun", () => {
    const { overrunMins, state } = dayBudget(
      [{ spot: a, dwellMins: 60, startMins: 21 * 60 + 30 }],
      frame,
    );
    expect(overrunMins).toBe(30);
    expect(state).toBe("over");
  });
});
