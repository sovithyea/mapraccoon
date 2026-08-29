import { describe, expect, it } from "vitest";

import { spots as raw } from "@/data/spots";
import { getAllSpots, getSpotBySlug } from "@/lib/spots";
import { cities } from "@/lib/spots/cities";
import { CAMBODIA_BBOX, spotsSchema } from "@/lib/spots/schema";

/**
 * Content-integrity checks. These exist because the seed file is hand-written
 * prose: the schema catches shape errors, and these catch the referential and
 * editorial mistakes a schema cannot see (D3).
 */
describe("seed content", () => {
  it("parses cleanly against the schema", () => {
    const result = spotsSchema.safeParse(raw);
    expect(result.success, JSON.stringify(result.error?.issues, null, 2)).toBe(true);
  });

  it("has unique ids and slugs", () => {
    const spots = getAllSpots();
    expect(new Set(spots.map((s) => s.id)).size).toBe(spots.length);
    expect(new Set(spots.map((s) => s.slug)).size).toBe(spots.length);
  });

  it("places every coordinate inside Cambodia", () => {
    for (const spot of getAllSpots()) {
      const [lng, lat] = spot.coords;
      expect(lng, `${spot.id} longitude`).toBeGreaterThanOrEqual(CAMBODIA_BBOX[0]);
      expect(lng, `${spot.id} longitude`).toBeLessThanOrEqual(CAMBODIA_BBOX[2]);
      expect(lat, `${spot.id} latitude`).toBeGreaterThanOrEqual(CAMBODIA_BBOX[1]);
      expect(lat, `${spot.id} latitude`).toBeLessThanOrEqual(CAMBODIA_BBOX[3]);
    }
  });




  /**
   * R9 made mechanical (D25). Until the `sensitive` field existed these three
   * facts were true only because the prose happened to be written that way —
   * and one of them was not actually true: Kamping Puoy shipped paired to
   * Phnom Sampeau, framing one forced-labour site as the alternative to
   * another. The refinement below is what caught it.
   */
  describe("memorial sites", () => {
    const sensitive = getAllSpots().filter((s) => s.sensitive);

    it("marks every known memorial site", () => {
      // Three of the five left with their cities (D27). These two are in
      // Phnom Penh and stay, so their exclusions get stronger, not weaker (D33).
      expect(sensitive.map((s) => s.slug).sort()).toEqual([
        "choeung-ek",
        "tuol-sleng",
      ]);
    });



  });

  it("assigns every spot to a known city", () => {
    const known = new Set(cities.map((c) => c.id));
    for (const spot of getAllSpots()) {
      expect(known.has(spot.city), `${spot.id} city ${spot.city}`).toBe(true);
    }
  });



  it("looks spots up by slug", () => {
    expect(getSpotBySlug("wat-phnom")?.name.en).toBe("Wat Phnom");
    expect(getSpotBySlug("not-a-real-slug")).toBeUndefined();
  });
});
