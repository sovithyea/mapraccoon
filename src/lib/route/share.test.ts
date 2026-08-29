import { describe, expect, it } from "vitest";

import { defaultFrame, stopDwell, type RouteStop } from "@/lib/route/day";
import { decodeDay, encodeDay } from "@/lib/route/share";
import { getSpotBySlug } from "@/lib/spots";
import type { Spot } from "@/lib/spots/schema";

/**
 * This suite stays coupled to the seed file on purpose, and it is the exception
 * that proves the rule elsewhere.
 *
 * `decodeDay` resolves spot ids against the real dataset by design (D3) — a
 * shared link carries ids, not content, so a link picks up corrected copy
 * rather than freezing a stale copy of it. Feeding it built fixtures would test
 * a resolution path that does not exist: every id would miss and every stop
 * would be dropped.
 *
 * The cost is that these break when a slug is removed. That is correct: a
 * removed slug genuinely breaks every shared link that named it.
 */
const spot = (slug: string): Spot => {
  const found = getSpotBySlug(slug);
  if (!found) throw new Error(`fixture missing: ${slug}`);
  return found;
};

const asStop = (s: Spot): RouteStop => ({ spot: s, dwellMins: stopDwell(s) });

describe("shared day links", () => {
  const stops = [asStop(spot("choeung-ek")), asStop(spot("tuol-sleng"))];

  it("round-trips a day", () => {
    const decoded = decodeDay(encodeDay(stops));

    expect(decoded?.stops.map((s) => s.spot.id)).toEqual(stops.map((s) => s.spot.id));
    expect(decoded?.frame).toEqual(defaultFrame);
  });

  it("round-trips an edited dwell rather than resetting it", () => {
    const edited = [{ ...(stops[0] as RouteStop), dwellMins: 45 }];
    expect(decodeDay(encodeDay(edited))?.stops[0]?.dwellMins).toBe(45);
  });

  it("survives a memorial stop", () => {
    // The encoder must not choke on the one kind of spot with no score (D25).
    const decoded = decodeDay(encodeDay([asStop(spot("choeung-ek"))]));
    expect(decoded?.stops[0]?.spot.sensitive).toBe("memorial");
  });

  it("carries a human-readable prefix without depending on it", () => {
    const id = encodeDay(stops);
    // The prefix names the first stop's neighbourhood, not the city (D27).
    expect(id.startsWith("out-of-town-2-stops.")).toBe(true);
    // The prefix is cosmetic: mangling it must not break the payload.
    expect(decodeDay(`anything-at-all.${id.split(".")[1]}`)).not.toBeNull();
  });

  it("returns null for garbage rather than throwing", () => {
    expect(decodeDay("")).toBeNull();
    expect(decodeDay("not-base64!!!")).toBeNull();
    expect(decodeDay("prefix.")).toBeNull();
    expect(decodeDay(`prefix.${btoa("[1,2,3]")}`)).toBeNull();
  });

  it("drops a spot that no longer exists but keeps the rest of the day", () => {
    const id = encodeDay(stops);
    const payload = id.split(".")[1] as string;
    const decoded = JSON.parse(
      decodeURIComponent(escape(atob(payload.replace(/-/g, "+").replace(/_/g, "/")))),
    ) as { v: number; s: [string, number][]; f: number[] };

    decoded.s.push(["a-spot-that-was-deleted", 60]);
    const mangled = btoa(unescape(encodeURIComponent(JSON.stringify(decoded))))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    expect(decodeDay(`x.${mangled}`)?.stops).toHaveLength(2);
  });
});
