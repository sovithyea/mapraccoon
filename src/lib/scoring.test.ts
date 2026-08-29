import { describe, expect, it } from "vitest";

import { offRadarBand, sortByOffRadar, sortByPopularity, sortSpots } from "@/lib/scoring";
import { getAllSpots } from "@/lib/spots";
import type { Spot } from "@/lib/spots/schema";

function stub(id: string, offRadar: number, name = id): Spot {
  return {
    id,
    slug: id,
    city: "phnom-penh",
    categories: ["culture"],
    name: { en: name },
    coords: [104.9, 11.5],
    blurb: { en: "blurb" },
    description: { en: "description" },
    offRadar,
    practical: { bestTime: { en: "any" }, entryFeeUsd: 0, typicalDurationMins: 60 },
    sources: ["https://example.com/"],
  };
}

describe("sortByOffRadar", () => {
  it("puts the least-known first", () => {
    const sorted = sortByOffRadar([stub("a", 10), stub("c", 90), stub("b", 50)]);
    expect(sorted.map((s) => s.id)).toEqual(["c", "b", "a"]);
  });

  it("breaks ties by name so ordering is stable", () => {
    const sorted = sortByOffRadar([stub("z", 50, "Zebra"), stub("a", 50, "Apple")]);
    expect(sorted.map((s) => s.id)).toEqual(["a", "z"]);
  });

  it("does not mutate its input", () => {
    const input = [stub("a", 10), stub("b", 90)];
    sortByOffRadar(input);
    expect(input.map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("handles an empty list", () => {
    expect(sortByOffRadar([])).toEqual([]);
  });
});

describe("sortByPopularity", () => {
  it("is the exact inverse of the off-radar order", () => {
    const spots = [stub("a", 10), stub("b", 50), stub("c", 90)];
    expect(sortByPopularity(spots).map((s) => s.id)).toEqual(
      sortByOffRadar(spots).map((s) => s.id).reverse(),
    );
  });
});

describe("sortSpots", () => {
  it("defaults to off-radar for an unknown mode", () => {
    const spots = [stub("a", 10), stub("c", 90)];
    // @ts-expect-error — deliberately passing an invalid mode
    expect(sortSpots(spots, "nonsense").map((s) => s.id)).toEqual(["c", "a"]);
  });

  it("sorts real content so the famous places land last", () => {
    const sorted = sortSpots(getAllSpots(), "off-radar");
    expect(sorted.at(-1)?.id).toBe("angkor-wat");
  });
});

describe("offRadarBand", () => {
  it("bands the scale", () => {
    expect(offRadarBand(0)).toBe("famous");
    expect(offRadarBand(19)).toBe("famous");
    expect(offRadarBand(20)).toBe("known");
    expect(offRadarBand(44)).toBe("known");
    expect(offRadarBand(45)).toBe("quiet");
    expect(offRadarBand(69)).toBe("quiet");
    expect(offRadarBand(70)).toBe("remote");
    expect(offRadarBand(100)).toBe("remote");
  });
});
