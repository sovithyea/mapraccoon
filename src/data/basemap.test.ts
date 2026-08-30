import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  GREEN,
  LAKES,
  ROADS_MAJOR,
  ROADS_MINOR,
  WATER_INNER,
  WATER_OUTER,
} from "@/data/basemap";
import { PHNOM_PENH_BBOX } from "@/lib/spots/schema";

/**
 * The rivers are imported data, so what is worth testing is that they are
 * still *rivers in Phnom Penh* — not the shape, which only a person looking at
 * the plot can judge.
 */

const ALL = [...WATER_OUTER, ...WATER_INNER, ...LAKES, ...GREEN];
const LINES = [...ROADS_MAJOR, ...ROADS_MINOR];

describe("basemap geometry", () => {
  it("has every layer, so a failed import cannot pass silently", () => {
    /*
      A broken Overpass response, or a filter tuned too tight, yields zero rings
      for a layer; its path renders as "" and the map quietly loses a feature
      with every other test still green. That is not hypothetical — the first
      run of the importer reported "green 0 rings" because the minimum park
      area was set at nearly four hectares, which is larger than every park in
      Phnom Penh.
    */
    expect(WATER_OUTER.length).toBeGreaterThan(5);
    expect(WATER_INNER.length).toBeGreaterThan(0);
    expect(LAKES.length).toBeGreaterThan(0);
    expect(GREEN.length).toBeGreaterThan(0);
    expect(ROADS_MAJOR.length).toBeGreaterThan(20);
    expect(ROADS_MINOR.length).toBeGreaterThan(20);
  });

  it("is in Phnom Penh, in GeoJSON order", () => {
    /*
      The real target is a swapped pair. `[lon, lat]` and `[lat, lon]` are both
      plausible-looking numbers, and a swap would draw the rivers somewhere in
      the Indian Ocean while every type still checked — the same class of error
      `CAMBODIA_BBOX` exists to catch in the seed file.

      Latitude and longitude ranges here do not overlap, so one assertion
      catches it.
    */
    const [west, south, east, north] = PHNOM_PENH_BBOX;
    for (const ring of [...ALL, ...LINES]) {
      for (const [lon, lat] of ring) {
        expect(lon).toBeGreaterThan(west - 0.25);
        expect(lon).toBeLessThan(east + 0.25);
        expect(lat).toBeGreaterThan(south - 0.25);
        expect(lat).toBeLessThan(north + 0.25);
      }
    }
  });

  it("has closed rings, or the fill leaks", () => {
    // Roads are excluded on purpose: they are open polylines, and closing one
    // would fill a city block with road colour.
    for (const ring of ALL) {
      expect(ring.length).toBeGreaterThanOrEqual(4);
      expect(ring[0]).toEqual(ring[ring.length - 1]);
    }
  });

  it("is drawn as one evenodd path, so the islands are holes", () => {
    // Koh Pich and Koh Norea are inner rings. Painted as a separate path they
    // would sit ON the water rather than being cut out of it, and the channel
    // either side of them would fill in.
    const src = readFileSync("src/components/home/Constellation.tsx", "utf8");
    expect(src).toMatch(/WATER_INNER/);
    expect(src).toMatch(/fillRule=["']evenodd["']/);
  });
});
