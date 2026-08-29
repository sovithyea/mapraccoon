import { z } from "zod";

/**
 * Every piece of content carries the same shape as the UI dictionaries: English
 * required, Khmer optional. That keeps seed data and interface copy on one
 * translation path instead of two.
 */
export const localizedTextSchema = z.object({
  en: z.string().min(1),
  km: z.string().min(1).optional(),
});

export const cityIdSchema = z.enum([
  "phnom-penh",
  "siem-reap",
  "kampot-kep",
  "battambang",
]);

export const categorySchema = z.enum(["temple", "nature", "food", "culture"]);

/** Rough bounding box for Cambodia: [west, south, east, north]. */
export const CAMBODIA_BBOX = [102.3, 9.8, 107.7, 14.8] as const;

const coordsSchema = z
  .tuple([
    z.number().min(CAMBODIA_BBOX[0]).max(CAMBODIA_BBOX[2]),
    z.number().min(CAMBODIA_BBOX[1]).max(CAMBODIA_BBOX[3]),
  ])
  .describe("[longitude, latitude] — GeoJSON order, not lat/lng");

export const spotSchema = z.object({
  id: z.string().min(1),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase kebab-case"),
  city: cityIdSchema,
  categories: z.array(categorySchema).min(1),
  name: localizedTextSchema,
  coords: coordsSchema,

  /** One line for cards and map popups. */
  blurb: localizedTextSchema,
  /** Two or three paragraphs for the destination page. */
  description: localizedTextSchema,

  /**
   * 0–100, where 100 is "almost nobody goes here". Editorial today. The brief
   * defers the XGBoost model until there is first-party visit data, so this
   * stays a hand-set number rather than pretending to be a model output.
   */
  offRadar: z.number().int().min(0).max(100),

  /**
   * Sites of mass killing or forced labour. R9: these are never written in the
   * product's voice — no off-radar meter, no pairing, no badge, no generated
   * blurb, no "escape the crowds" framing. Until D25 that rule was upheld only
   * by how the prose happened to be written, so nothing in the UI could branch
   * on it and any future generated copy would have broken it silently (C17).
   *
   * Marking a spot here is what makes the rule enforceable: components return
   * null for these, and the refinement below rejects a pairing at build time.
   */
  sensitive: z.literal("memorial").optional(),

  /**
   * The narrative pairing: the famous place this one is an alternative to.
   * Anchors (Angkor Wat, the Royal Palace) leave this empty — they are the
   * things other spots pair *to*.
   */
  pairedWith: z
    .object({
      spotId: z.string().min(1),
      hook: localizedTextSchema,
    })
    .optional(),

  /** Community-based tourism / conservation framing: where the money goes. */
  community: z
    .object({
      name: z.string().min(1),
      impact: localizedTextSchema,
      url: z.url().optional(),
    })
    .optional(),

  practical: z.object({
    bestTime: localizedTextSchema,
    entryFeeUsd: z.number().min(0),
    typicalDurationMins: z.number().int().positive(),
  }),

  /** Provenance for every claim above. Required — no unattributable spots. */
  sources: z.array(z.url()).min(1),
}).superRefine((spot, ctx) => {
  /**
   * R9, enforced at build time rather than trusted to editorial discipline.
   * "Instead of Angkor Wat, try this killing field" is the sentence this
   * exists to make impossible to write.
   */
  if (spot.sensitive && spot.pairedWith) {
    ctx.addIssue({
      code: "custom",
      path: ["pairedWith"],
      message:
        `"${spot.slug}" is marked sensitive and cannot carry a pairing — ` +
        "a memorial site is never an alternative to somewhere else (R9, D25)",
    });
  }
});

export type LocalizedText = z.infer<typeof localizedTextSchema>;
export type CityId = z.infer<typeof cityIdSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Spot = z.infer<typeof spotSchema>;

export const spotsSchema = z.array(spotSchema);
