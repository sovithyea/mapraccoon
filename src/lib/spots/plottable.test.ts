import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getAllSpots } from "@/lib/spots";
import { plottableSpots } from "@/lib/spots/plottable";

describe("plottableSpots", () => {
  it("drops every memorial in the real dataset", () => {
    const sensitive = getAllSpots().filter((s) => s.sensitive);
    // If the seed file ever loses its memorials this test would pass for the
    // wrong reason, which is the failure mode C24 was about.
    expect(sensitive.length).toBeGreaterThan(0);

    const plotted = plottableSpots([...getAllSpots()]);
    expect(plotted.some((s) => s.sensitive)).toBe(false);
    expect(plotted).toHaveLength(getAllSpots().length - sensitive.length);
  });

  it("keeps everywhere else", () => {
    const ordinary = getAllSpots().filter((s) => !s.sensitive);
    expect(plottableSpots([...getAllSpots()])).toHaveLength(ordinary.length);
  });
});

/**
 * R9 and D33 require the exclusion on *every* surface written in the product's
 * voice, and the way that rule has failed twice is a new surface being built
 * that simply never consults `sensitive` (C30) — not an existing one regressing.
 *
 * So this asserts the population rather than the behaviour: any module that
 * draws places as marks must reach them through `plottableSpots`. A new one
 * with its own `.filter()` is the bug; a new one with no filter at all is the
 * bug C30 actually was.
 */
describe("every map surface goes through it", () => {
  const SURFACES = [
    "src/components/home/Constellation.tsx",
    "src/app/[locale]/opengraph-image.tsx",
  ];

  for (const file of SURFACES) {
    it(`${file} plots through plottableSpots`, () => {
      const src = readFileSync(file, "utf8");
      // The CALL, not the identifier. The first version of this asserted
      // `toContain("plottableSpots")`, which the import line satisfies on its
      // own — so removing the call and keeping the import passed it. Checked
      // by mutation, which is the only reason that was ever noticed.
      expect(src).toMatch(/plottableSpots\(/);
      expect(
        /\.filter\(\s*\(?\s*\w+\s*\)?\s*=>\s*!\w+\.sensitive/.test(src),
        "re-implements the rule instead of importing it",
      ).toBe(false);
    });
  }
});
