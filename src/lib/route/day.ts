import { estimateLeg, type Leg } from "@/lib/route/estimate";
import { offRadarBand } from "@/lib/scoring";
import { getAllSpots } from "@/lib/spots";
import type { Spot } from "@/lib/spots/schema";

/**
 * The day budget. D24: this is the single computation behind all three places
 * the constraint is stated — the day frame, the per-item add affordance, and
 * the tail row. They cannot disagree, for the same reason `offRadarBand()`
 * guarantees the meter label cannot drift from the sort.
 *
 * All times are minutes from local midnight. There is no timezone handling and
 * none is needed: a day here is a shape, not an instant.
 */

export const DEFAULT_START_MINS = 8 * 60 + 30; // 08:30
export const DEFAULT_FRAME_START_MINS = 8 * 60; // 08:00
export const DEFAULT_FRAME_END_MINS = 17 * 60; // 17:00

export type DayFrame = {
  start: number;
  frameStart: number;
  frameEnd: number;
};

export const defaultFrame: DayFrame = {
  start: DEFAULT_START_MINS,
  frameStart: DEFAULT_FRAME_START_MINS,
  frameEnd: DEFAULT_FRAME_END_MINS,
};

/** A spot in the day, with the dwell the traveller actually chose. */
export type RouteStop = {
  spot: Spot;
  /** Defaults to `practical.typicalDurationMins`; editable per stop. */
  dwellMins: number;
};

export type ScheduledStop = RouteStop & {
  arrivalMins: number;
  departureMins: number;
  /** The leg travelled to reach this stop. Undefined for the first. */
  legFrom?: Leg;
  /**
   * R9/D25: a memorial site's dwell is a floor, not a plan. The UI states it
   * as "2h here, as a minimum" and the optimiser must declare when it moves
   * one rather than silently reordering it.
   */
  isSensitive: boolean;
};

export type DayState = "empty" | "room" | "full" | "over";

export type DayBudget = {
  stops: ScheduledStop[];
  /** Dwell plus travel, from the start time to the last departure. */
  plannedMins: number;
  travelMins: number;
  /** Minutes left inside the frame. Zero once the day is over. */
  remainingMins: number;
  /** Minutes past `frameEnd`. Zero unless the state is "over". */
  overrunMins: number;
  endMins: number;
  state: DayState;
};

export const stopDwell = (spot: Spot): number => spot.practical.typicalDurationMins;

/**
 * "Full" is derived, never a constant. The threshold is the shortest thing
 * that could still be added — the smallest dwell in the dataset plus the
 * shortest hop between two spots someone might plausibly chain. Computed from
 * the content so it cannot go stale when a shorter spot is written (D24).
 */
let cachedThreshold: number | undefined;

export function fullThresholdMins(spots: readonly Spot[] = getAllSpots()): number {
  if (spots === getAllSpots() && cachedThreshold !== undefined) return cachedThreshold;

  let minDwell = Infinity;
  for (const spot of spots) minDwell = Math.min(minDwell, stopDwell(spot));

  // Shortest hop between two spots in the same city — a day is one city, so a
  // cross-country pair is not a leg anyone would actually add.
  let minLeg = Infinity;
  for (const a of spots) {
    for (const b of spots) {
      if (a.id === b.id || a.city !== b.city) continue;
      const { minutes } = estimateLeg(a, b);
      if (minutes > 0) minLeg = Math.min(minLeg, minutes);
    }
  }

  const threshold =
    (Number.isFinite(minDwell) ? minDwell : 0) + (Number.isFinite(minLeg) ? minLeg : 0);

  if (spots === getAllSpots()) cachedThreshold = threshold;
  return threshold;
}

/** Schedules the day and reports where it stands against the frame. */
export function dayBudget(
  stops: readonly RouteStop[],
  frame: DayFrame = defaultFrame,
  spotsForThreshold?: readonly Spot[],
): DayBudget {
  const scheduled: ScheduledStop[] = [];
  let cursor = frame.start;
  let travelMins = 0;

  for (const [index, stop] of stops.entries()) {
    const previous = stops[index - 1];
    const legFrom = previous ? estimateLeg(previous.spot, stop.spot) : undefined;

    if (legFrom) {
      cursor += legFrom.minutes;
      travelMins += legFrom.minutes;
    }

    const arrivalMins = cursor;
    const departureMins = arrivalMins + stop.dwellMins;
    cursor = departureMins;

    scheduled.push({
      ...stop,
      arrivalMins,
      departureMins,
      legFrom,
      isSensitive: stop.spot.sensitive !== undefined,
    });
  }

  const endMins = scheduled.length === 0 ? frame.start : cursor;
  const plannedMins = endMins - frame.start;
  const overrunMins = Math.max(0, endMins - frame.frameEnd);
  const remainingMins = Math.max(0, frame.frameEnd - endMins);

  const threshold = fullThresholdMins(spotsForThreshold ?? getAllSpots());

  const state: DayState =
    scheduled.length === 0
      ? "empty"
      : overrunMins > 0
        ? "over"
        : remainingMins < threshold
          ? "full"
          : "room";

  return { stops: scheduled, plannedMins, travelMins, remainingMins, overrunMins, endMins, state };
}

/** Whether a spot would fit, and what it would cost — the add affordance's label. */
export function costOfAdding(
  stops: readonly RouteStop[],
  candidate: Spot,
  frame: DayFrame = defaultFrame,
): { addedMins: number; legMins: number; dwellMins: number; overrunMins: number; fits: boolean } {
  const dwellMins = stopDwell(candidate);
  const last = stops[stops.length - 1];
  const legMins = last ? estimateLeg(last.spot, candidate).minutes : 0;

  const next = dayBudget([...stops, { spot: candidate, dwellMins }], frame);
  const current = dayBudget(stops, frame);

  return {
    addedMins: legMins + dwellMins,
    legMins,
    dwellMins,
    overrunMins: next.overrunMins - current.overrunMins,
    fits: next.overrunMins === 0,
  };
}

/**
 * The day's off-radar average, with an honest denominator. Memorial sites are
 * excluded from the mean but counted in the total, so the UI can say "2 of 3
 * stops scored" rather than quietly averaging over a smaller set (D25).
 */
export function dayOffRadarAverage(stops: readonly RouteStop[]): {
  average: number | null;
  band: ReturnType<typeof offRadarBand> | null;
  scoredCount: number;
  totalCount: number;
} {
  const scored = stops.filter((stop) => stop.spot.sensitive === undefined);

  if (scored.length === 0) {
    return { average: null, band: null, scoredCount: 0, totalCount: stops.length };
  }

  const total = scored.reduce((sum, stop) => sum + stop.spot.offRadar, 0);
  const average = Math.round(total / scored.length);

  return {
    average,
    band: offRadarBand(average),
    scoredCount: scored.length,
    totalCount: stops.length,
  };
}
