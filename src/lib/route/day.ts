import { estimateLeg, type Leg } from "@/lib/route/estimate";
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
/**
 * A stop, optionally pinned to a clock time (D44).
 *
 * Without `startMins` a day can only ever be packed: the first stop begins when
 * the day begins and everything else falls in behind it. That answers "how long
 * does this take" and never "we are meeting them at nine".
 */
export type RouteStop = {
  spot: Spot;
  /** Defaults to `practical.typicalDurationMins`; editable per stop. */
  dwellMins: number;
  /**
   * Pinned start, in minutes past midnight. Absent means "as soon as you can
   * get here", which is the old behaviour and stays the default.
   */
  startMins?: number;
};

export type ScheduledStop = RouteStop & {
  /** When you could get here if nothing were pinned. */
  earliestMins: number;
  /** `arrivalMins - earliestMins`. Positive is waiting, negative is a clash. */
  slackMins: number;
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
  /** Time spent waiting because a later stop is pinned. */
  waitMins: number;
  /** Minutes a pin overlaps the stop before it. Zero when the day is feasible. */
  clashMins: number;
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

  // Shortest hop between any two spots. The same-city filter that used to be
  // here went with the four-city model (D27) — every pair is now in Phnom Penh.
  let minLeg = Infinity;
  for (const a of spots) {
    for (const b of spots) {
      if (a.id === b.id) continue;
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
  let waitMins = 0;
  let clashMins = 0;

  for (const [index, stop] of stops.entries()) {
    const previous = stops[index - 1];
    const legFrom = previous ? estimateLeg(previous.spot, stop.spot) : undefined;

    if (legFrom) {
      cursor += legFrom.minutes;
      travelMins += legFrom.minutes;
    }

    /**
     * A pin wins over the packing, and the difference is reported rather than
     * absorbed.
     *
     * Clamping a pin to the earliest reachable time would be the tidy choice
     * and the wrong one: it would silently move a stop the group deliberately
     * placed, and the screen would then show a time nobody chose. So a pin is
     * honoured exactly, and `slackMins` carries the consequence — positive is
     * time to kill, negative means the previous stop has to be cut short.
     */
    const earliestMins = cursor;
    const arrivalMins = stop.startMins ?? earliestMins;
    const slackMins = arrivalMins - earliestMins;
    const departureMins = arrivalMins + stop.dwellMins;
    cursor = departureMins;

    if (slackMins > 0) waitMins += slackMins;
    else if (slackMins < 0) clashMins += -slackMins;

    scheduled.push({
      ...stop,
      arrivalMins,
      departureMins,
      earliestMins,
      slackMins,
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

  return {
    stops: scheduled,
    plannedMins,
    travelMins,
    waitMins,
    clashMins,
    remainingMins,
    overrunMins,
    endMins,
    state,
  };
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

