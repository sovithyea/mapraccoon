import { describe, expect, it } from "vitest";

import { boundsOf, projectInto } from "@/lib/geo/project";
import { getAllSpots } from "@/lib/spots";

const RIVERSIDE: readonly [number, number] = [104.9315, 11.5687];
const BKK1: readonly [number, number] = [104.9218, 11.5443];

describe("projectInto", () => {
  it("puts the frame's corners at the box's corners", () => {
    const project = projectInto([104, 11, 105, 12]);
    expect(project([104, 12])).toEqual({ x: 0, y: 0 });
    expect(project([105, 11])).toEqual({ x: 100, y: 100 });
  });

  it("flips latitude, because y grows downward and north does not", () => {
    const project = projectInto([104, 11, 105, 12]);
    expect(project([104.5, 11.75]).y).toBeLessThan(project([104.5, 11.25]).y);
  });
});

describe("boundsOf", () => {
  it("returns a square frame, so the scatter is not stretched", () => {
    const [w, s, e, n] = boundsOf([RIVERSIDE, BKK1]);
    expect(e - w).toBeCloseTo(n - s, 10);
  });

  it("keeps every coordinate inside the box with room to spare", () => {
    const coords = getAllSpots().map((spot) => spot.coords);
    const project = projectInto(boundsOf(coords));
    for (const c of coords) {
      const { x, y } = project(c);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(100);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(100);
    }
  });

  /**
   * The regression that shipped. Framed on `CAMBODIA_BBOX`, the whole dataset
   * occupied about 1% of the width and the landing page looked like an empty
   * grid. Nothing threw — which is why this asserts on spread rather than on
   * bounds, and why the number is high enough that a country-sized frame could
   * never pass it.
   */
  it("spreads the real dataset across most of the box", () => {
    const coords = getAllSpots().map((spot) => spot.coords);
    const project = projectInto(boundsOf(coords));
    const xs = coords.map((c) => project(c).x);
    const ys = coords.map((c) => project(c).y);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(40);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(40);
  });

  it("does not zoom to infinity on a single stop", () => {
    const [w, , e] = boundsOf([BKK1]);
    expect(e - w).toBeGreaterThan(0.01);
  });

  it("falls back to the city frame when there is nothing to plot", () => {
    expect(boundsOf([])).toEqual([104.78, 11.42, 105.05, 11.64]);
  });
});
