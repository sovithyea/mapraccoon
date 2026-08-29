import type { Spot } from "@/lib/spots/schema";

export type SortMode = "off-radar" | "popularity" | "name";

/** The default, everywhere. Discovery is the default view, not an opt-in tab. */
export function sortByOffRadar(spots: readonly Spot[]): Spot[] {
  return [...spots].sort(
    (a, b) => b.offRadar - a.offRadar || a.name.en.localeCompare(b.name.en),
  );
}

/**
 * Available, but never the initial state. There is no separate popularity
 * field: being well known is simply the inverse of being off the radar.
 */
export function sortByPopularity(spots: readonly Spot[]): Spot[] {
  return [...spots].sort(
    (a, b) => a.offRadar - b.offRadar || a.name.en.localeCompare(b.name.en),
  );
}

export function sortByName(spots: readonly Spot[]): Spot[] {
  return [...spots].sort((a, b) => a.name.en.localeCompare(b.name.en));
}

/**
 * Single entry point for ordering. Phase 6 replaces the off-radar branch with a
 * trained score; keeping every call site behind this function is what makes
 * that a one-file change (D4).
 */
export function sortSpots(spots: readonly Spot[], mode: SortMode): Spot[] {
  switch (mode) {
    case "popularity":
      return sortByPopularity(spots);
    case "name":
      return sortByName(spots);
    case "off-radar":
    default:
      return sortByOffRadar(spots);
  }
}

/** Coarse band used for the meter label on cards and destination pages. */
export function offRadarBand(score: number): "famous" | "known" | "quiet" | "remote" {
  if (score < 20) return "famous";
  if (score < 45) return "known";
  if (score < 70) return "quiet";
  return "remote";
}
