import { describe, expect, it } from "vitest";

import { makeMemorial, makeSpot, resetFixtures } from "@/lib/spots/fixture";

/**
 * The fixture is a dependency of most other suites, so it gets its own.
 * A factory that silently produces an invalid shape would make every test
 * above it pass against something that could never exist.
 */
describe("makeSpot", () => {
  it("produces a spot that parses against the real schema", () => {
    expect(() => makeSpot()).not.toThrow();
  });

  it("gives each spot a distinct id, slug and position", () => {
    const a = makeSpot();
    const b = makeSpot();
    expect(a.id).not.toBe(b.id);
    expect(a.slug).not.toBe(b.slug);
    expect(a.coords).not.toEqual(b.coords);
  });

  it("applies overrides", () => {
    const s = makeSpot({ name: { en: "Named" }, categories: ["food"] });
    expect(s.name.en).toBe("Named");
    expect(s.categories).toEqual(["food"]);
  });

  it("merges into practical rather than replacing it", () => {
    // The trap this guards: spreading a partial `practical` over the default
    // would drop `bestTime` and `entryFeeUsd`, and the schema would reject it.
    const s = makeSpot({ practical: { typicalDurationMins: 30 } });
    expect(s.practical.typicalDurationMins).toBe(30);
    expect(s.practical.entryFeeUsd).toBe(0);
  });

  it("throws loudly rather than returning something invalid", () => {
    expect(() => makeSpot({ slug: "Not A Slug" })).toThrow(/invalid Spot/);
  });

  it("makeMemorial sets the sensitive flag", () => {
    expect(makeMemorial().sensitive).toBe("memorial");
  });

  it("resetFixtures makes ids stable across runs", () => {
    resetFixtures();
    const first = makeSpot().id;
    resetFixtures();
    expect(makeSpot().id).toBe(first);
  });
});
