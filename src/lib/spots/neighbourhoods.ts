import type { NeighbourhoodId } from "@/lib/spots/schema";

/**
 * Phnom Penh neighbourhoods, replacing the four-city model (D27).
 *
 * **No colour.** The old `City` type carried `ink` and `fill`, because a city
 * was one of the product's semantic colour roles. Nine neighbourhoods times two
 * tones would be eighteen, and D21 records what happened at ten. A
 * neighbourhood is a text label; travel time is what makes it matter, not hue.
 */

export type Neighbourhood = {
  id: NeighbourhoodId;
  name: string;
  /** One line for the filter row and any heading. */
  tagline: string;
};

export const neighbourhoods: readonly Neighbourhood[] = [
  { id: "bkk1", name: "BKK1", tagline: "Expat central, and the bar streets off it" },
  { id: "riverside", name: "Riverside", tagline: "Sisowath Quay and the streets behind it" },
  { id: "daun-penh", name: "Daun Penh", tagline: "The old quarter, north of the palace" },
  { id: "toul-tom-poung", name: "Toul Tom Poung", tagline: "Russian Market and everything around it" },
  { id: "toul-kork", name: "Toul Kork", tagline: "Where the city eats away from the tourists" },
  { id: "chroy-changvar", name: "Chroy Changvar", tagline: "Across the bridge, along the water" },
  { id: "koh-pich", name: "Koh Pich", tagline: "Diamond Island — built, bright, and busy at night" },
  { id: "sen-sok", name: "Sen Sok", tagline: "North-west, and increasingly where people actually live" },
  { id: "out-of-town", name: "Out of town", tagline: "A day trip rather than an evening" },
];

export function getNeighbourhood(id: NeighbourhoodId): Neighbourhood {
  const found = neighbourhoods.find((n) => n.id === id);
  if (!found) throw new Error(`unknown neighbourhood: ${id}`);
  return found;
}

/** Central Phnom Penh, for the map's default framing. */
export const PHNOM_PENH_VIEW = {
  longitude: 104.9218,
  latitude: 11.5564,
  zoom: 12.5,
} as const;
