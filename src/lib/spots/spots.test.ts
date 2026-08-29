import { describe, expect, it } from "vitest";

import { spots as raw } from "@/data/spots";
import { getAllSpots, getPairedSpot, getSpotBySlug } from "@/lib/spots";
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

  it("resolves every pairedWith reference to a real spot", () => {
    for (const spot of getAllSpots()) {
      if (!spot.pairedWith) continue;
      expect(getPairedSpot(spot), `${spot.id} → ${spot.pairedWith.spotId}`).toBeDefined();
    }
  });

  it("never pairs a spot with itself", () => {
    for (const spot of getAllSpots()) {
      expect(spot.pairedWith?.spotId).not.toBe(spot.id);
    }
  });

  it("only pairs to a better-known spot", () => {
    // A pairing says "go here instead of there". If the anchor were the more
    // obscure of the two, the sentence would be backwards.
    for (const spot of getAllSpots()) {
      const anchor = getPairedSpot(spot);
      if (!anchor) continue;
      expect(anchor.offRadar, `${spot.id} vs anchor ${anchor.id}`).toBeLessThan(
        spot.offRadar,
      );
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
      expect(sensitive.map((s) => s.slug).sort()).toEqual([
        "choeung-ek",
        "kamping-puoy",
        "phnom-sampeau",
        "secret-lake",
        "tuol-sleng",
      ]);
    });

    it("never carries a pairing", () => {
      for (const spot of sensitive) {
        expect(spot.pairedWith, `${spot.slug} is paired`).toBeUndefined();
      }
    });

    it("is never the anchor another spot points at", () => {
      // The same failure read from the other end: "go here instead of Choeung
      // Ek". The per-spot schema cannot see across spots, so it is checked here.
      for (const spot of getAllSpots()) {
        const anchor = getPairedSpot(spot);
        if (!anchor) continue;
        expect(anchor.sensitive, `${spot.slug} points at ${anchor.slug}`).toBeUndefined();
      }
    });

    it("rejects a sensitive spot that carries a pairing, at parse time", () => {
      const base = getSpotBySlug("tuol-sleng");
      expect(base).toBeDefined();

      const result = spotsSchema.safeParse([
        {
          ...base,
          pairedWith: {
            spotId: "royal-palace",
            hook: { en: "Should never be writable." },
          },
        },
      ]);

      expect(result.success).toBe(false);
      expect(JSON.stringify(result.error?.issues)).toContain("cannot carry a pairing");
    });
  });

  it("assigns every spot to a known city", () => {
    const known = new Set(cities.map((c) => c.id));
    for (const spot of getAllSpots()) {
      expect(known.has(spot.city), `${spot.id} city ${spot.city}`).toBe(true);
    }
  });

  it("covers all four base cities", () => {
    for (const city of cities) {
      const count = getAllSpots().filter((s) => s.city === city.id).length;
      expect(count, `${city.id} has no spots`).toBeGreaterThan(0);
    }
  });

  it("keeps at least one anchor per city for pairings to point at", () => {
    // An off-radar-only dataset has nothing to contrast against.
    for (const city of cities) {
      const anchors = getAllSpots().filter(
        (s) => s.city === city.id && s.offRadar < 30,
      );
      expect(anchors.length, `${city.id} has no anchor spots`).toBeGreaterThan(0);
    }
  });

  it("looks spots up by slug", () => {
    expect(getSpotBySlug("angkor-wat")?.name.en).toBe("Angkor Wat");
    expect(getSpotBySlug("not-a-real-slug")).toBeUndefined();
  });
});
