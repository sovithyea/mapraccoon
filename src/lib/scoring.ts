import { isOpenAt, type Instant, type OpenState } from "@/lib/hours/open";
import type { Spot } from "@/lib/spots/schema";

/**
 * The single entry point for ordering. Never scatter `.sort()` calls across
 * components — a change of default must be one branch (CLAUDE.md rule 3).
 *
 * The off-radar sort that used to live here is gone (D28). It was the product's
 * central idea for a visitor audience and it inverts for a resident one: for a
 * jungle temple "almost nobody goes here" means undiscovered, for a bar on a
 * Friday it means empty.
 *
 * **`sortSpots` stays pure and never reads the clock.** The instant comes in
 * through the context, which is what lets "open now" and "open at 8pm on
 * Friday" be the same code path — and what keeps this testable at a fixed
 * instant with no fake timers.
 */

export type SortMode = "open-now" | "price" | "name";

/**
 * An object rather than a bare `at` parameter, so adding `from` for a distance
 * sort later does not churn the signature a second time.
 */
export type SortContext = {
  at?: Instant;
  /** [longitude, latitude], for a future distance sort. */
  from?: readonly [number, number];
};

export function sortByName(spots: readonly Spot[]): Spot[] {
  return [...spots].sort((a, b) => a.name.en.localeCompare(b.name.en));
}

export function sortByPrice(spots: readonly Spot[]): Spot[] {
  return [...spots].sort(
    (a, b) => a.priceLevel - b.priceLevel || a.name.en.localeCompare(b.name.en),
  );
}

/**
 * Open first, then closing soon, then unknown, then closed.
 *
 * `unknown` above `closed` is the deliberate call: a venue whose hours nobody
 * has found is likelier to be open than one known to be shut, and burying it
 * would punish exactly the entries that have not been finished yet. Ties break
 * by name so the order is stable rather than incidental.
 */
const OPEN_RANK: Record<OpenState, number> = {
  open: 0,
  "closing-soon": 1,
  unknown: 2,
  closed: 3,
};

export function sortByOpenNow(spots: readonly Spot[], at: Instant): Spot[] {
  return [...spots].sort((a, b) => {
    const rank = OPEN_RANK[isOpenAt(a.hours, at)] - OPEN_RANK[isOpenAt(b.hours, at)];
    return rank !== 0 ? rank : a.name.en.localeCompare(b.name.en);
  });
}

export function sortSpots(
  spots: readonly Spot[],
  mode: SortMode,
  ctx: SortContext = {},
): Spot[] {
  switch (mode) {
    case "open-now":
      // Without an instant there is nothing to be open *at*. Falling back to
      // name is right for the server render, which has no clock — see useNow().
      return ctx.at ? sortByOpenNow(spots, ctx.at) : sortByName(spots);
    case "price":
      return sortByPrice(spots);
    case "name":
      return sortByName(spots);
    default:
      return sortByName(spots);
  }
}
