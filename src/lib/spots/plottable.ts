import type { Spot } from "@/lib/spots/schema";

/**
 * The places that may be drawn as a mark on a map written in the product's
 * voice — the landing-page scatter and the Open Graph card.
 *
 * One function rather than a `.filter()` at each site, because R9 and D33
 * require every such surface to carry an enforced exclusion and there is now
 * more than one surface. Two copies of a rule is one copy and a future bug:
 * C19 shipped because the rule lived in how the copy happened to be written,
 * and C30 shipped because a new surface simply never consulted `sensitive`.
 *
 * This is deliberately NOT the rule for lists, filters or a spot's own page.
 * D33 keeps memorials in the dataset and findable; what it forbids is them
 * appearing as an option in the going-out flow. A dot in the graphic under
 * "let's finally plan an actual hangout" is that.
 */
export function plottableSpots(spots: readonly Spot[]): Spot[] {
  return spots.filter((spot) => !spot.sensitive);
}
