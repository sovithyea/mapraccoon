import { z } from "zod";

import { hoursSchema } from "@/lib/hours/schema";
import { localizedTextSchema } from "@/lib/localized-text";

export { localizedTextSchema };

/**
 * Phnom Penh neighbourhoods, replacing the four-city enum (D27).
 *
 * Kept under ten deliberately: this is the filter row, and going out in Phnom
 * Penh genuinely concentrates in about six areas. `out-of-town` is the
 * geographic escape hatch for a day trip — Koh Dach, Oudong, Kirirom — and is
 * what relaxes the bounding-box check below.
 *
 * Deliberately carries **no colour**. Nine neighbourhoods times two tones would
 * be eighteen role colours; D21 is the written record of that mistake at less
 * than half the scale.
 */
export const neighbourhoodIdSchema = z.enum([
  "bkk1",
  "riverside",
  "daun-penh",
  "toul-tom-poung",
  "toul-kork",
  "chroy-changvar",
  "koh-pich",
  "sen-sok",
  "out-of-town",
]);

/** Authored specific; the group is derived in `categories.ts`, never written. */
export const categorySchema = z.enum([
  "restaurant",
  "street-food",
  "cafe",
  "bakery",
  "bar",
  "rooftop",
  "night-market",
  "live-music",
  "cinema",
  "gallery",
  "karaoke",
  "sport",
  "swimming",
  "games",
  "temple",
  "museum",
  "market",
  "nature",
]);

/** Rough bounding box for Cambodia: [west, south, east, north]. */
export const CAMBODIA_BBOX = [102.3, 9.8, 107.7, 14.8] as const;

/**
 * Phnom Penh and its immediate surrounds. Tight on purpose: the country-wide
 * box would happily accept a coordinate typo that lands a bar in Kandal
 * province, and catching that at build time is worth ten lines.
 */
export const PHNOM_PENH_BBOX = [104.78, 11.42, 105.05, 11.64] as const;

const coordsSchema = z
  .tuple([z.number(), z.number()])
  .describe("[longitude, latitude] — GeoJSON order, not lat/lng");

/**
 * How much a night here costs per head, which is the thing a group actually
 * argues about. Bands are documented once here rather than per venue:
 *
 *   1  under $5     2  $5–12     3  $12–25     4  $25+
 */
const priceLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

export const spotSchema = z
  .object({
    id: z.string().min(1),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase kebab-case"),
    neighbourhood: neighbourhoodIdSchema,
    categories: z.array(categorySchema).min(1),
    name: localizedTextSchema,
    coords: coordsSchema,

    /** One line for cards and map popups. Required — it is what a card shows. */
    blurb: localizedTextSchema,

    /**
     * Optional, and that is a schedule decision rather than a style one. Eighty
     * venues at two or three paragraphs is 15,000–25,000 hand-written words,
     * which is the risk most likely to kill this phase. A venue with a name,
     * hours, price, neighbourhood and a blurb is fully functional; prose is for
     * the twenty places that earn it.
     */
    description: localizedTextSchema.optional(),

    hours: hoursSchema,
    priceLevel: priceLevelSchema,

    /**
     * Hours rot faster than anything else here. Without a date you cannot tell
     * a check from last month from one from two years ago, and "open now"
     * degrades into fiction with nothing on screen to say so.
     */
    lastVerified: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "lastVerified must be YYYY-MM-DD"),

    /**
     * Where the hours came from. An imported hour was *fetched*, not *checked* —
     * `lastVerified` records when, and this records by what. The distinction
     * matters because R1 is about the difference between provenance and
     * verification, and an import is provenance.
     */
    hoursSource: z.enum(["imported", "checked"]).default("imported"),

    /**
     * Google's place id, when the entry came from an import (D36).
     *
     * The one Places field with no retention limit, and the reason a later move
     * to runtime fetching would be a swap rather than a re-import. Optional:
     * hand-written venues have no place id and do not need one.
     */
    placeId: z.string().min(1).optional(),

    /**
     * Phnom Penh venues publish hours on Facebook, not websites. One paste, and
     * it is the required fallback when hours are unknown.
     */
    links: z
      .object({
        maps: z.url().optional(),
        facebook: z.url().optional(),
        instagram: z.url().optional(),
        phone: z.string().min(1).optional(),
      })
      .optional(),

    /**
     * Sites of mass killing or forced labour. R9: never written in the
     * product's voice — no badges, no generated blurbs, no "escape the crowds"
     * framing. D33 keeps these in a going-out product, which obliges more, not
     * less: a sensitive spot must never appear as a vote candidate, in a
     * suggestion tray, or in a match result, and each of those is enforced by a
     * test rather than by prose. C19 is what happens otherwise.
     */
    sensitive: z.literal("memorial").optional(),

    /** Where the money goes. A field, no longer one of the product's mechanics (D29). */
    community: z
      .object({
        name: z.string().min(1),
        impact: localizedTextSchema,
        url: z.url().optional(),
      })
      .optional(),

    practical: z.object({
      /** Load-bearing: this is the dwell `dayBudget()` schedules with. */
      typicalDurationMins: z.number().int().positive(),
    }),

    /** Provenance for every claim above. Required — no unattributable places. */
    sources: z.array(z.url()).min(1),
  })
  .superRefine((spot, ctx) => {
    // A coordinate typo inside Cambodia is invisible; inside Phnom Penh it is
    // not. Day trips get the loose box because that is what they are.
    const box = spot.neighbourhood === "out-of-town" ? CAMBODIA_BBOX : PHNOM_PENH_BBOX;
    const [lon, lat] = spot.coords;
    if (lon < box[0] || lon > box[2] || lat < box[1] || lat > box[3]) {
      ctx.addIssue({
        code: "custom",
        path: ["coords"],
        message:
          `"${spot.slug}" is at [${lon}, ${lat}], outside ` +
          `${spot.neighbourhood === "out-of-town" ? "Cambodia" : "Phnom Penh"}. ` +
          "Coordinates are [longitude, latitude] — GeoJSON order, not lat/lng",
      });
    }

    // Unknown hours must leave the reader somewhere to go, or the honest
    // "we don't know" becomes a dead end.
    if (spot.hours.kind === "unknown" && !spot.links?.facebook && !spot.links?.maps) {
      ctx.addIssue({
        code: "custom",
        path: ["links"],
        message:
          `"${spot.slug}" has unknown hours and no links.facebook or links.maps — ` +
          "an unknown state needs somewhere for the reader to check",
      });
    }
  });

export type { LocalizedText } from "@/lib/localized-text";
export type NeighbourhoodId = z.infer<typeof neighbourhoodIdSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Spot = z.output<typeof spotSchema>;
/** What content authors write — hours as `"HH:MM"` strings, not minutes. */
export type SpotInput = z.input<typeof spotSchema>;

export const spotsSchema = z.array(spotSchema);
