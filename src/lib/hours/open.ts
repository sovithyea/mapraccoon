import { DAYS, dayIndex, type Hours, type Rule } from "@/lib/hours/schema";

/**
 * Is a place open at a given moment?
 *
 * **The primitive is `isOpenAt(hours, instant)`, not `isOpenNow(hours)`.** That
 * is the whole design. "Open now" becomes one call with the current instant,
 * and "we're deciding for Friday at 8pm" gets the same filter for free instead
 * of needing a second code path. Nothing in this file reads the clock — see
 * `now.ts`, which is the only module that does.
 */

/** 0 = Monday, minutes from local midnight. */
export type Instant = { day: number; mins: number };

export type OpenState = "open" | "closing-soon" | "closed" | "unknown";

/** Minutes before closing at which a venue starts saying so. */
export const CLOSING_SOON_MINS = 45;

const MINS_PER_DAY = 1440;

/**
 * Every span covering an instant, expressed on that instant's axis.
 *
 * The one non-obvious case is a venue that opened yesterday and has not closed
 * yet — a bar open Friday 17:00 to 02:00 is open at Saturday 00:30. Yesterday's
 * rules are therefore checked with the instant shifted forward a day. This is
 * four lines and it is the thing to test hardest.
 */
function spansCovering(rules: readonly Rule[], at: Instant): number[] {
  const yesterday = (at.day + 6) % 7;
  const remaining: number[] = [];

  for (const rule of rules) {
    for (const day of rule.days) {
      const index = dayIndex(day);

      if (index === at.day && at.mins >= rule.openMins && at.mins < rule.closeMins) {
        remaining.push(rule.closeMins - at.mins);
      }

      if (index === yesterday) {
        const shifted = at.mins + MINS_PER_DAY;
        if (shifted >= rule.openMins && shifted < rule.closeMins) {
          remaining.push(rule.closeMins - shifted);
        }
      }
    }
  }

  return remaining;
}

export function isOpenAt(hours: Hours, at: Instant): OpenState {
  if (hours.kind === "unknown") return "unknown";
  if (hours.kind === "always") return "open";

  const remaining = spansCovering(hours.rules, at);
  if (remaining.length === 0) return "closed";

  // Overlapping spans are rejected at parse time, so there is at most one — but
  // taking the max is correct rather than merely defensive if that ever changes.
  const longest = Math.max(...remaining);
  return longest <= CLOSING_SOON_MINS ? "closing-soon" : "open";
}

/** Minutes until the state changes, and to what. Null when it never does. */
export function nextChangeAt(
  hours: Hours,
  at: Instant,
): { state: OpenState; minsAway: number } | null {
  if (hours.kind !== "weekly") return null;

  const current = isOpenAt(hours, at);

  if (current === "open" || current === "closing-soon") {
    const remaining = spansCovering(hours.rules, at);
    const longest = Math.max(...remaining);
    return { state: "closed", minsAway: longest };
  }

  // Closed: walk forward a week, minute-free, by checking each rule's opening.
  let best: number | null = null;
  for (const rule of hours.rules) {
    for (const day of rule.days) {
      const index = dayIndex(day);
      const dayDelta = (index - at.day + 7) % 7;
      const away = dayDelta * MINS_PER_DAY + rule.openMins - at.mins;
      const normalised = away <= 0 ? away + 7 * MINS_PER_DAY : away;
      if (best === null || normalised < best) best = normalised;
    }
  }

  return best === null ? null : { state: "open", minsAway: best };
}

/** `"Mon"`, for the weekly table. Not localised — Khmer is B4. */
export const dayLabel = (index: number): string =>
  (DAYS[index] ?? "mon").charAt(0).toUpperCase() + (DAYS[index] ?? "mon").slice(1);
