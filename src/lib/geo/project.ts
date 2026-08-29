import { CAMBODIA_BBOX } from "@/lib/spots/schema";

const [WEST, SOUTH, EAST, NORTH] = CAMBODIA_BBOX;

/**
 * Equirectangular projection of a Cambodian coordinate into a 0–100 box.
 *
 * Extracted from `Constellation` so the shared-day view and any future no-map
 * state plot on exactly the same grid — the point of the Constellation is that
 * it is the real dataset at real coordinates, and a second projection that
 * drifted from it would quietly break that claim.
 */
export function projectCambodia(coords: readonly [number, number]): {
  x: number;
  y: number;
} {
  return {
    x: ((coords[0] - WEST) / (EAST - WEST)) * 100,
    // SVG/CSS y grows downward, latitude grows upward.
    y: ((NORTH - coords[1]) / (NORTH - SOUTH)) * 100,
  };
}
