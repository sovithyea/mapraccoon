import type { Spot } from "@/lib/spots/schema";

/**
 * The single entry point for ordering. Never scatter `.sort()` calls across
 * components — a change of default must be one branch (CLAUDE.md rule 3).
 *
 * The off-radar sort that used to live here is gone (D28). It was the product's
 * central idea for a visitor audience, and it inverts for a resident one: for a
 * jungle temple "almost nobody goes here" means undiscovered, for a bar on a
 * Friday it means empty. Sorting by it would have surfaced the worst options
 * first.
 *
 * `open-now` replaces it as the default and arrives with the hours model in
 * step 2 of `specs/3-friends/plan.md`. Until then `name` is the only mode, and
 * it is deliberately not a placeholder for the old behaviour.
 */
export type SortMode = "name";

export function sortByName(spots: readonly Spot[]): Spot[] {
  return [...spots].sort((a, b) => a.name.en.localeCompare(b.name.en));
}

export function sortSpots(spots: readonly Spot[], mode: SortMode): Spot[] {
  switch (mode) {
    case "name":
      return sortByName(spots);
    default:
      return sortByName(spots);
  }
}
