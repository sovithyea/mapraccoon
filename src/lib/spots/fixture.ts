import { spotSchema, type Spot, type SpotInput } from "@/lib/spots/schema";

/**
 * Test spots, built rather than borrowed.
 *
 * Before this existed, roughly fifteen tests across the route, store and
 * estimate suites reached into the live dataset — `getSpotsByNeighbourhood("kampot-kep")
 * .slice(0, 2)` and friends. Every one of them broke when D27 deleted three
 * neighbourhoods, and none of them broke because their logic was wrong. They were
 * coupled to content that is expected to change constantly (R8), which is the
 * opposite of what a unit test should depend on.
 *
 * The rule this establishes: **only `spots.test.ts` may assert against the real
 * dataset.** It is the suite whose job is the content. Everything else builds
 * what it needs.
 *
 * Parsed through `spotSchema` on the way out, so a fixture cannot drift into
 * describing a shape the schema would reject — which would make the tests above
 * it pass against something that could never exist.
 */

let counter = 0;

/**
 * `Omit` rather than an intersection: `Partial<Spot> & { practical?: Partial<…> }`
 * intersects the two `practical` types, so a caller would have to pass a
 * complete one — which defeats the point of the partial.
 */
type Overrides = Omit<Partial<SpotInput>, "practical"> & {
  practical?: Partial<SpotInput["practical"]>;
};

export function makeSpot(overrides: Overrides = {}): Spot {
  counter += 1;
  const n = counter;

  // `practical` is built separately and applied last. Spreading a partial
  // `practical` through `...overrides` would drop `bestTime` and
  // `entryFeeUsd` and the schema would reject the result — which is exactly
  // what fixture.test.ts catches.
  const practical = {
    typicalDurationMins: 60,
    ...overrides.practical,
  };

  const merged = {
    id: `fixture-${n}`,
    slug: `fixture-${n}`,
    neighbourhood: "bkk1",
    categories: ["bar"],
    name: { en: `Fixture ${n}` },
    // Central Phnom Penh, nudged per fixture so distances are non-zero and
    // deterministic. A test that needs a real separation should set coords.
    coords: [104.92 + n * 0.005, 11.55 + n * 0.005],
    blurb: { en: `Blurb for fixture ${n}.` },
    description: { en: `Description for fixture ${n}.` },
    hours: { kind: "always" as const },
    priceLevel: 2 as const,
    lastVerified: "2026-08-29",
    sources: ["https://example.org/fixture"],
    ...overrides,
    practical,
  };

  const parsed = spotSchema.safeParse(merged);
  if (!parsed.success) {
    throw new Error(
      `makeSpot produced an invalid Spot: ${JSON.stringify(parsed.error.issues, null, 2)}`,
    );
  }
  return parsed.data;
}

/** A memorial fixture. Named because D33's exclusions are tested constantly. */
export function makeMemorial(overrides: Overrides = {}): Spot {
  return makeSpot({ sensitive: "memorial", ...overrides });
}

/** Resets the counter so ids are stable within a file. Call in `beforeEach`. */
export function resetFixtures(): void {
  counter = 0;
}
