import { describe, expect, it } from "vitest";

import { DETOUR_FACTOR, estimateLeg, haversineKm, speedForKm } from "@/lib/route/estimate";
import { getSpotBySlug } from "@/lib/spots";
import type { Spot } from "@/lib/spots/schema";

const spot = (slug: string): Spot => {
  const found = getSpotBySlug(slug);
  if (!found) throw new Error(`fixture missing: ${slug}`);
  return found;
};

/**
 * These numbers are estimates by design (D22), so the tests check the shape of
 * the estimate rather than a precise duration: the distance is in the right
 * range against a known real-world separation, the rounding never understates,
 * and the degenerate case does not divide by zero.
 */
describe("haversineKm", () => {
  it("returns zero for a point against itself", () => {
    expect(haversineKm([104.9282, 11.5564], [104.9282, 11.5564])).toBe(0);
  });

  it("is symmetric", () => {
    const a = [104.9282, 11.5564] as const;
    const b = [103.8667, 13.3622] as const;
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 9);
  });

  it("matches the known Phnom Penh → Siem Reap separation", () => {
    // 232 km great-circle. A result near 314 would mean someone had confused
    // it with the road distance; a wildly different one means the coordinate
    // order is reversed — the failure CAMBODIA_BBOX catches elsewhere.
    const km = haversineKm([104.9282, 11.5564], [103.8597, 13.3633]);
    expect(km).toBeGreaterThan(225);
    expect(km).toBeLessThan(240);
  });

  it("calibrates the detour factor against a road distance we know", () => {
    // National Highway 6 runs Phnom Penh → Siem Reap in about 314 km. The
    // 232 km great line times DETOUR_FACTOR gives ~325: within 4%, and long
    // rather than short, which is the direction this module errs on purpose.
    const estimated = haversineKm([104.9282, 11.5564], [103.8597, 13.3633]) * DETOUR_FACTOR;
    const actualRoadKm = 314;

    expect(estimated).toBeGreaterThan(actualRoadKm);
    expect(estimated - actualRoadKm).toBeLessThan(actualRoadKm * 0.1);
  });
});

describe("estimateLeg", () => {
  it("applies the detour factor to the straight line", () => {
    const from = spot("tuol-sleng");
    const to = spot("choeung-ek");
    const straight = haversineKm(from.coords, to.coords);

    expect(estimateLeg(from, to).km).toBeCloseTo(
      Math.round(straight * DETOUR_FACTOR * 10) / 10,
      5,
    );
  });

  it("rounds minutes up to a 5-minute granularity, never down", () => {
    const from = spot("tuol-sleng");
    const to = spot("choeung-ek");
    const leg = estimateLeg(from, to);
    const exact = (leg.km / speedForKm(leg.km)) * 60;

    expect(leg.minutes % 5).toBe(0);
    expect(leg.minutes).toBeGreaterThanOrEqual(exact);
    expect(leg.minutes - exact).toBeLessThan(5);
  });

  it("gives a zero-length leg zero minutes rather than a floor of 5", () => {
    const s = spot("tuol-sleng");
    expect(estimateLeg(s, s)).toEqual({ km: 0, minutes: 0, isEstimate: true });
  });

  it("marks every leg as an estimate", () => {
    expect(estimateLeg(spot("tuol-sleng"), spot("secret-lake")).isEstimate).toBe(true);
  });
});

/**
 * The speed bands are the part most likely to be wrong, and the first version
 * was: a flat 22 km/h turned a 40-minute drive into 1h 50m. These check the
 * estimate against journeys with known real durations rather than restating
 * the formula.
 */
describe("speed calibration against real journeys", () => {
  const minutesFor = (a: readonly [number, number], b: readonly [number, number]): number => {
    const km = haversineKm(a, b) * DETOUR_FACTOR;
    return (km / speedForKm(km)) * 60;
  };

  it("puts Kep to Kampot near its real 40 minutes, and not under", () => {
    const minutes = minutesFor([104.3167, 10.4833], [104.1817, 10.5947]);
    expect(minutes).toBeGreaterThanOrEqual(40);
    expect(minutes).toBeLessThan(60);
  });

  it("puts Phnom Penh to Siem Reap near its real 5h 30m, and not under", () => {
    const minutes = minutesFor([104.9282, 11.5564], [103.8597, 13.3633]);
    expect(minutes).toBeGreaterThanOrEqual(330);
    expect(minutes).toBeLessThan(400);
  });

  it("moves slower in town than between towns", () => {
    expect(speedForKm(2)).toBeLessThan(speedForKm(30));
    expect(speedForKm(30)).toBeLessThan(speedForKm(200));
  });
});
