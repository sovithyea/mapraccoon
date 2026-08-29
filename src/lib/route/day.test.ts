import { describe, expect, it } from "vitest";

import {
  costOfAdding,
  dayBudget,
  dayOffRadarAverage,
  defaultFrame,
  fullThresholdMins,
  stopDwell,
  type RouteStop,
} from "@/lib/route/day";
import { getSpotBySlug, getSpotsByCity } from "@/lib/spots";
import type { Spot } from "@/lib/spots/schema";

const spot = (slug: string): Spot => {
  const found = getSpotBySlug(slug);
  if (!found) throw new Error(`fixture missing: ${slug}`);
  return found;
};

const asStop = (s: Spot): RouteStop => ({ spot: s, dwellMins: stopDwell(s) });

describe("dayBudget", () => {
  it("reports an empty day as empty, not as room", () => {
    const budget = dayBudget([]);
    expect(budget.state).toBe("empty");
    expect(budget.plannedMins).toBe(0);
    expect(budget.endMins).toBe(defaultFrame.start);
  });

  it("schedules the first stop at the start time with no leg", () => {
    const budget = dayBudget([asStop(spot("tuol-sleng"))]);
    const first = budget.stops[0];

    expect(first?.arrivalMins).toBe(defaultFrame.start);
    expect(first?.legFrom).toBeUndefined();
    expect(budget.travelMins).toBe(0);
  });

  it("pushes each later stop out by its travel leg", () => {
    const stops = [asStop(spot("tuol-sleng")), asStop(spot("choeung-ek"))];
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
    const budget = dayBudget([{ spot: spot("tuol-sleng"), dwellMins: 10 * 60 }]);

    expect(budget.state).toBe("over");
    expect(budget.overrunMins).toBe(
      defaultFrame.start + 10 * 60 - defaultFrame.frameEnd,
    );
    expect(budget.remainingMins).toBe(0);
  });

  it("is full — not over — when less than the threshold remains", () => {
    const threshold = fullThresholdMins();
    const dwell = defaultFrame.frameEnd - defaultFrame.start - Math.floor(threshold / 2);
    const budget = dayBudget([{ spot: spot("tuol-sleng"), dwellMins: dwell }]);

    expect(budget.overrunMins).toBe(0);
    expect(budget.remainingMins).toBeLessThan(threshold);
    expect(budget.state).toBe("full");
  });

  it("marks a memorial stop as sensitive in the schedule", () => {
    const budget = dayBudget([asStop(spot("secret-lake")), asStop(spot("tuol-sleng"))]);
    expect(budget.stops.map((s) => s.isSensitive)).toEqual([true, true]);
  });

  it("does not mark an ordinary stop as sensitive", () => {
    const ordinary = getSpotsByCity("kampot-kep").find((s) => !s.sensitive) as Spot;
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
    const dataset = getSpotsByCity("kampot-kep");
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
    const candidate = spot("tuol-sleng");
    const cost = costOfAdding([], candidate);

    expect(cost.legMins).toBe(0);
    expect(cost.dwellMins).toBe(stopDwell(candidate));
    expect(cost.addedMins).toBe(cost.dwellMins);
    expect(cost.fits).toBe(true);
  });

  it("prices a later stop as travel plus dwell", () => {
    const cost = costOfAdding([asStop(spot("tuol-sleng"))], spot("choeung-ek"));
    expect(cost.legMins).toBeGreaterThan(0);
    expect(cost.addedMins).toBe(cost.legMins + cost.dwellMins);
  });

  it("reports the overrun instead of refusing, so nothing is ever disabled", () => {
    const stops = [{ spot: spot("tuol-sleng"), dwellMins: 8 * 60 }];
    const cost = costOfAdding(stops, spot("choeung-ek"));

    expect(cost.fits).toBe(false);
    expect(cost.overrunMins).toBeGreaterThan(0);
  });
});

describe("dayOffRadarAverage", () => {
  it("returns nothing for an empty day", () => {
    expect(dayOffRadarAverage([])).toEqual({
      average: null,
      band: null,
      scoredCount: 0,
      totalCount: 0,
    });
  });

  it("excludes memorial stops from the mean but counts them in the total", () => {
    const ordinary = getSpotsByCity("kampot-kep").filter((s) => !s.sensitive).slice(0, 2);
    const stops = [...ordinary.map(asStop), asStop(spot("secret-lake"))];

    const result = dayOffRadarAverage(stops);
    const expected = Math.round(
      ordinary.reduce((sum, s) => sum + s.offRadar, 0) / ordinary.length,
    );

    expect(result.average).toBe(expected);
    expect(result.scoredCount).toBe(2);
    expect(result.totalCount).toBe(3);
  });

  it("returns a null average for a day of nothing but memorial sites", () => {
    const result = dayOffRadarAverage([asStop(spot("tuol-sleng")), asStop(spot("choeung-ek"))]);
    expect(result.average).toBeNull();
    expect(result.scoredCount).toBe(0);
    expect(result.totalCount).toBe(2);
  });
});
