import type { Spot } from "@/lib/spots/schema";

/**
 * Travel estimation for the day builder.
 *
 * D22: Phase 2 ships with no routing API. This is the entire swap surface —
 * when a Mapbox key exists, `estimateLeg` becomes async and calls Directions,
 * and nothing above it changes. Until then every number this produces is an
 * estimate and must be labelled as one everywhere it is shown.
 *
 * The numbers below are deliberately conservative rather than optimistic. A
 * day that runs long is a worse failure than one that finishes early.
 */

/** Mean Earth radius, kilometres. */
const EARTH_RADIUS_KM = 6371;

/**
 * Roads are not straight lines. 1.4 is the usual planning figure for a road
 * network's circuity, and it holds up badly around the Tonlé Sap and on the
 * Bokor road — which is exactly why the output is labelled an estimate.
 */
export const DETOUR_FACTOR = 1.4;

/**
 * Speed bands, in km/h, keyed on the estimated road distance.
 *
 * A single flat speed cannot cover both a two-kilometre hop across Kampot and
 * the run up National Highway 6. The first version of this used 22 km/h
 * throughout and was caught by running the builder rather than reading it: it
 * turned the 40-minute Kep-to-Kampot drive into 1h 50m, so three stops ate
 * seven hours of a nine-hour day in phantom travel.
 *
 * Calibrated against two journeys with known real durations:
 *   Kep → Kampot            25 km in ~40 min  → 37.5 km/h
 *   Phnom Penh → Siem Reap 314 km in ~5h 30m  → 57.1 km/h
 *
 * The bands sit just under both, so the estimate still errs long. Town speed
 * is lower again: short hops are traffic, parking and walking from wherever
 * the tuk-tuk actually stops.
 */
export const SPEED_BANDS: readonly { upToKm: number; kmh: number }[] = [
  { upToKm: 5, kmh: 16 },
  { upToKm: 60, kmh: 36 },
  { upToKm: Infinity, kmh: 55 },
];

export function speedForKm(km: number): number {
  return SPEED_BANDS.find((band) => km <= band.upToKm)?.kmh ?? 36;
}

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/** Great-circle distance between two [longitude, latitude] pairs, in km. */
export function haversineKm(
  [lonA, latA]: readonly [number, number],
  [lonB, latB]: readonly [number, number],
): number {
  const dLat = toRadians(latB - latA);
  const dLon = toRadians(lonB - lonA);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(latA)) * Math.cos(toRadians(latB)) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export type Leg = {
  /** Road distance estimate — straight line with the detour factor applied. */
  km: number;
  /** Minutes, rounded up to the next 5 so the UI never implies precision. */
  minutes: number;
  /**
   * Always true in Phase 2. Present so that the day of a real routing call,
   * every consumer already has somewhere to read the distinction from rather
   * than needing one added (D22).
   */
  isEstimate: true;
};

/**
 * The travel leg between two spots. Rounded up to a 5-minute granularity:
 * "est. 25 min" is honest about its own precision in a way "est. 23 min" is
 * not, and the rounding is upward for the same reason the speed is low.
 */
export function estimateLeg(from: Spot, to: Spot): Leg {
  const straightLineKm = haversineKm(from.coords, to.coords);
  const km = straightLineKm * DETOUR_FACTOR;
  const rawMinutes = (km / speedForKm(km)) * 60;

  return {
    km: Math.round(km * 10) / 10,
    minutes: Math.ceil(rawMinutes / 5) * 5,
    isEstimate: true,
  };
}
