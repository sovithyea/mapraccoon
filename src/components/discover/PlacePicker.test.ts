import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { getAllSpots } from "@/lib/spots";
import { plottableSpots } from "@/lib/spots/plottable";

/**
 * R9 on the picker.
 *
 * The picker is a surface written in the product's voice: a list headed "Find
 * places to add", each row an *Add* button. A memorial offered there sits
 * beside a hotpot restaurant as an equivalent option, which is exactly what
 * C19 shipped and what D33 obliges every new surface to prevent — by a rule a
 * test can see, never by how the copy happens to read.
 */
describe("the picker never offers a memorial", () => {
  it("has memorials to exclude in the first place", () => {
    // Without this the structural check below could pass because the dataset
    // lost its memorials — C24's shape, a check that cannot fail.
    expect(getAllSpots().filter((s) => s.sensitive).length).toBeGreaterThan(0);
  });

  it("filters through plottableSpots and searches only what it filtered", () => {
    const src = readFileSync("src/components/discover/PlacePicker.tsx", "utf8");

    // The CALL, not the import — C30 is the record of a structural test that an
    // import line alone satisfied.
    expect(src).toMatch(/plottableSpots\(/);

    // And the results must come from the filtered list. Filtering into a
    // variable and then searching the raw `spots` would pass a naive check
    // while offering every memorial in the dataset.
    expect(src).toMatch(/offerable\.filter\(/);
    expect(
      /return spots\.filter\(/.test(src),
      "searches the unfiltered list, so memorials are still offered",
    ).toBe(false);
  });

  it("drops exactly the memorials, and nothing else", () => {
    const all = getAllSpots();
    const offered = plottableSpots([...all]);
    expect(offered.some((s) => s.sensitive)).toBe(false);
    expect(offered).toHaveLength(all.length - all.filter((s) => s.sensitive).length);
  });
});
