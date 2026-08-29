import { PHNOM_PENH_BBOX } from "@/lib/spots/schema";

/** `[west, south, east, north]`, in degrees. */
export type Bounds = readonly [number, number, number, number];

/**
 * Projects a coordinate into a 0–100 box, given the frame it should fill.
 *
 * The frame used to be hard-coded to `CAMBODIA_BBOX`, and after D27 that made
 * both maps in the product render as a single dot. Phnom Penh is 0.06° wide
 * against Cambodia's 5.4°, so all 84 places landed inside one percent of the
 * width — the graticule drew, the dots drew, and the result looked empty.
 * Nothing threw, no test failed, and it shipped.
 *
 * So the frame is now an argument. `boundsOf` derives it from whatever is
 * actually being plotted, which is right for both callers: the whole dataset on
 * the landing page, and one night's stops on a shared day.
 */
export function projectInto(
  bounds: Bounds,
): (coords: readonly [number, number]) => { x: number; y: number } {
  const [west, south, east, north] = bounds;
  return (coords) => ({
    x: ((coords[0] - west) / (east - west)) * 100,
    // SVG/CSS y grows downward, latitude grows upward.
    y: ((north - coords[1]) / (north - south)) * 100,
  });
}

/**
 * The square frame containing every coordinate given, with breathing room.
 *
 * Square on purpose. An equirectangular projection into a 5:4 box stretches the
 * scatter horizontally, and Phnom Penh's venues run north–south along the
 * river, so the distortion is exactly along the axis that carries the shape.
 * At 11.5°N a degree of longitude is 0.98 of a degree of latitude, so equating
 * the two costs about 2% — cheaper than the stretch, and it means the caller
 * only has to render a square.
 */
export function boundsOf(
  coords: readonly (readonly [number, number])[],
  { pad = 0.12, minSpan = 0.012 }: { pad?: number; minSpan?: number } = {},
): Bounds {
  if (coords.length === 0) return PHNOM_PENH_BBOX;

  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  for (const [lon, lat] of coords) {
    west = Math.min(west, lon);
    east = Math.max(east, lon);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  }

  // `minSpan` is ~1.3 km. Without it a single stop, or three bars on one
  // street, would zoom until the graticule was meaningless and a metre of GPS
  // error moved a dot across the frame.
  const span = Math.max(east - west, north - south, minSpan) * (1 + pad * 2);
  const half = span / 2;
  const cx = (west + east) / 2;
  const cy = (south + north) / 2;

  return [cx - half, cy - half, cx + half, cy + half];
}
