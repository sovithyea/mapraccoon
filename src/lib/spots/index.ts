import { spots as raw } from "@/data/spots";
import type { CityId, Spot } from "@/lib/spots/schema";
import { spotsSchema } from "@/lib/spots/schema";

/**
 * Parsed once, at module load. Invalid content fails the build rather than a
 * request — that is the whole reason the seed lives in a TS module behind a
 * schema instead of a JSON file (D3).
 */
const parsed = spotsSchema.safeParse(raw);

if (!parsed.success) {
  throw new Error(
    `Invalid spot data in src/data/spots.ts:\n${JSON.stringify(parsed.error.issues, null, 2)}`,
  );
}

export const allSpots: readonly Spot[] = parsed.data;

const bySlug = new Map(allSpots.map((spot) => [spot.slug, spot]));
const byId = new Map(allSpots.map((spot) => [spot.id, spot]));

export function getAllSpots(): readonly Spot[] {
  return allSpots;
}

export function getSpotBySlug(slug: string): Spot | undefined {
  return bySlug.get(slug);
}

export function getSpotById(id: string): Spot | undefined {
  return byId.get(id);
}

export function getSpotsByCity(city: CityId): Spot[] {
  return allSpots.filter((spot) => spot.city === city);
}

/** The famous place a spot is offered as an alternative to. */
export function getPairedSpot(spot: Spot): Spot | undefined {
  return spot.pairedWith ? byId.get(spot.pairedWith.spotId) : undefined;
}

/** Spots that name this one as the crowded thing they replace. */
export function getAlternativesTo(spot: Spot): Spot[] {
  return allSpots.filter((candidate) => candidate.pairedWith?.spotId === spot.id);
}
