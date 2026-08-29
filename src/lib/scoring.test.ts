import { beforeEach, describe, expect, it } from "vitest";

import { sortByName, sortSpots } from "@/lib/scoring";
import type { DayToken } from "@/lib/hours/schema";
import { makeSpot, resetFixtures } from "@/lib/spots/fixture";

/**
 * What is left of this suite after D28.
 *
 * It used to assert that the famous places sort last — the product's central
 * claim, checked against the real dataset. That claim is gone, and those tests
 * went with it rather than being weakened into something that still passes.
 * `open-now` arrives in step 4 with its own table-driven suite at fixed
 * instants.
 *
 * Built spots, not seed content: ordering is a pure function, and the rule is
 * that only `spots.test.ts` asserts against the dataset.
 */
beforeEach(resetFixtures);

const named = (...names: string[]) =>
  names.map((en) => makeSpot({ name: { en } }));

describe("sortSpots", () => {
  it("orders by name", () => {
    const spots = named("Wat Phnom", "Central Market", "Romdeng");
    expect(sortSpots(spots, "name").map((s) => s.name.en)).toEqual([
      "Central Market",
      "Romdeng",
      "Wat Phnom",
    ]);
  });

  it("does not mutate its input", () => {
    const spots = named("Zed", "Alpha");
    const before = spots.map((s) => s.name.en);
    sortSpots(spots, "name");
    expect(spots.map((s) => s.name.en)).toEqual(before);
  });

  it("returns every spot exactly once", () => {
    const spots = named("A", "B", "C", "D");
    const sorted = sortByName(spots);
    expect(sorted).toHaveLength(4);
    expect(new Set(sorted.map((s) => s.id)).size).toBe(4);
  });

  it("uses locale comparison rather than code-point order", () => {
    // "École" sorts before "Zoo" for a reader, and after it by code point.
    const sorted = sortSpots(named("Zoo", "École"), "name");
    expect(sorted.map((s) => s.name.en)).toEqual(["École", "Zoo"]);
  });
});

describe("sortByOpenNow", () => {
  const hours = (
    rules: { days: DayToken[]; open: string; close: string }[],
  ) => ({
    kind: "weekly" as const,
    rules,
  });

  const spots = () => [
    makeSpot({ name: { en: "Closed bar" }, hours: hours([{ days: ["mon"], open: "18:00", close: "23:00" }]) }),
    makeSpot({ name: { en: "Unknown cafe" }, hours: { kind: "unknown" }, links: { facebook: "https://facebook.com/x" } }),
    makeSpot({ name: { en: "Open all hours" }, hours: { kind: "always" } }),
    makeSpot({ name: { en: "Closing soon" }, hours: hours([{ days: ["tue"], open: "08:00", close: "12:30" }]) }),
  ];

  // Tuesday at 12:00 — "always" is open, the Tuesday venue closes in 30
  // minutes, the unknown one is unknown, the Monday one is shut.
  const tuesdayNoon = { day: 1, mins: 12 * 60 };

  it("orders open, then closing-soon, then unknown, then closed", () => {
    const sorted = sortSpots(spots(), "open-now", { at: tuesdayNoon });
    expect(sorted.map((s) => s.name.en)).toEqual([
      "Open all hours",
      "Closing soon",
      "Unknown cafe",
      "Closed bar",
    ]);
  });

  it("puts unknown above closed, not below it", () => {
    // Deliberate: a venue nobody has found hours for is likelier open than one
    // known to be shut, and burying it would punish unfinished entries.
    const sorted = sortSpots(spots(), "open-now", { at: tuesdayNoon });
    const unknown = sorted.findIndex((s) => s.name.en === "Unknown cafe");
    const closed = sorted.findIndex((s) => s.name.en === "Closed bar");
    expect(unknown).toBeLessThan(closed);
  });

  it("falls back to name order with no instant — the server render", () => {
    const sorted = sortSpots(spots(), "open-now");
    expect(sorted.map((s) => s.name.en)).toEqual([
      "Closed bar",
      "Closing soon",
      "Open all hours",
      "Unknown cafe",
    ]);
  });

  it("breaks ties by name so the order is stable, not incidental", () => {
    const both = [
      makeSpot({ name: { en: "Zed" }, hours: { kind: "always" } }),
      makeSpot({ name: { en: "Alpha" }, hours: { kind: "always" } }),
    ];
    expect(sortSpots(both, "open-now", { at: tuesdayNoon }).map((s) => s.name.en))
      .toEqual(["Alpha", "Zed"]);
  });
});

describe("sortByPrice", () => {
  it("orders cheapest first, then by name", () => {
    const spots = [
      makeSpot({ name: { en: "Pricey" }, priceLevel: 4 }),
      makeSpot({ name: { en: "Zed cheap" }, priceLevel: 1 }),
      makeSpot({ name: { en: "Alpha cheap" }, priceLevel: 1 }),
    ];
    expect(sortSpots(spots, "price").map((s) => s.name.en)).toEqual([
      "Alpha cheap",
      "Zed cheap",
      "Pricey",
    ]);
  });
});
