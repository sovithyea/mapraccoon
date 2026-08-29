import { describe, expect, it } from "vitest";

import { spots as raw } from "@/data/spots";
import { getAllSpots, getSpotBySlug } from "@/lib/spots";
import { neighbourhoods } from "@/lib/spots/neighbourhoods";
import { isOpenAt } from "@/lib/hours/open";
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
  /**
   * Criteria 5 and 6. Both are about the difference between provenance and
   * verification (R1): an unknown hour must leave the reader somewhere to go,
   * and a date must not claim more than it knows.
   */
  describe("hours and freshness", () => {
    it("returns a defined state for every venue across a full week", () => {
      for (const spot of getAllSpots()) {
        for (let day = 0; day < 7; day += 1) {
          for (let hour = 0; hour < 24; hour += 1) {
            expect(
              ["open", "closing-soon", "closed", "unknown"],
              `${spot.slug} day ${day} hour ${hour}`,
            ).toContain(isOpenAt(spot.hours, { day, mins: hour * 60 }));
          }
        }
      }
    });

    it("refuses unknown hours with nowhere to check", () => {
      const base = getSpotBySlug("wat-phnom");
      const result = spotsSchema.safeParse([
        { ...base, hours: { kind: "unknown" }, links: undefined },
      ]);
      expect(result.success).toBe(false);
      expect(JSON.stringify(result.error?.issues)).toContain("somewhere for the reader to check");
    });

    it("accepts unknown hours when a link is present", () => {
      const base = getSpotBySlug("wat-phnom");
      expect(
        spotsSchema.safeParse([
          {
            ...base,
            hours: { kind: "unknown" },
            links: { facebook: "https://facebook.com/example" },
          },
        ]).success,
      ).toBe(true);
    });

    it("never claims to have been verified in the future", () => {
      const today = new Date().toISOString().slice(0, 10);
      for (const spot of getAllSpots()) {
        expect(spot.lastVerified <= today, `${spot.slug} is dated ${spot.lastVerified}`).toBe(true);
      }
    });

    it("warns about stale entries without failing the build", () => {
      /*
       * Warn, never fail. A test that goes red on a calendar date with no code
       * change teaches people to ignore a red suite, which costs more than the
       * staleness it was meant to catch. The signal goes to stderr and a human.
       */
      const sixMonthsAgo = new Date(Date.now() - 182 * 86_400_000).toISOString().slice(0, 10);
      const stale = getAllSpots().filter((s) => s.lastVerified < sixMonthsAgo);
      if (stale.length > 0) {
        console.warn(
          `${stale.length} entries not checked in six months: ${stale.map((s) => s.slug).join(", ")}`,
        );
      }
      expect(true).toBe(true);
    });

    it("records whether hours were checked or merely imported", () => {
      // An imported hour is provenance, not verification (D36). The field
      // exists so an import cannot quietly launder itself into a check.
      for (const spot of getAllSpots()) {
        expect(["imported", "checked"]).toContain(spot.hoursSource);
      }
    });
  });

  describe("memorial sites", () => {
    const sensitive = getAllSpots().filter((s) => s.sensitive);

    it("marks every known memorial site", () => {
      // Three of the five left with their neighbourhoods (D27). These two are in
      // Phnom Penh and stay, so their exclusions get stronger, not weaker (D33).
      expect(sensitive.map((s) => s.slug).sort()).toEqual([
        "choeung-ek",
        "tuol-sleng",
      ]);
    });



  });

  it("assigns every spot to a known city", () => {
    const known = new Set(neighbourhoods.map((c) => c.id));
    for (const spot of getAllSpots()) {
      expect(known.has(spot.neighbourhood), `${spot.id} city ${spot.neighbourhood}`).toBe(true);
    }
  });



  it("looks spots up by slug", () => {
    expect(getSpotBySlug("wat-phnom")?.name.en).toBe("Wat Phnom");
    expect(getSpotBySlug("not-a-real-slug")).toBeUndefined();
  });
});
