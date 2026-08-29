import { defaultFrame, stopDwell, type DayFrame, type RouteStop } from "@/lib/route/day";
import { getSpotById } from "@/lib/spots";
import type { Spot } from "@/lib/spots/schema";

/**
 * A shared day travels entirely in its own URL.
 *
 * There is no backend in Phase 2 (D1), so a short opaque id like /plan/a91f is
 * impossible — nothing exists to resolve it against. The link therefore carries
 * the day itself. The human-readable prefix is cosmetic; the payload after the
 * last dot is the only authoritative part.
 *
 * Only spot ids and dwell are encoded. The content stays in the seed file (D3),
 * so a shared link picks up corrected copy rather than freezing a stale copy of
 * it — which matters when the content is explicitly unverified (R1).
 */

export type SharedDay = { stops: RouteStop[]; frame: DayFrame };

const base64urlEncode = (input: string): string =>
  btoa(unescape(encodeURIComponent(input)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const base64urlDecode = (input: string): string => {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return decodeURIComponent(escape(atob(padded)));
};

/** `kampot-kep-3-stops.<payload>` — prefix for humans, payload for the app. */
export function encodeDay(stops: readonly RouteStop[], frame: DayFrame = defaultFrame): string {
  const payload = base64urlEncode(
    JSON.stringify({
      v: 1,
      s: stops.map((stop) => [stop.spot.id, stop.dwellMins]),
      f: [frame.start, frame.frameStart, frame.frameEnd],
    }),
  );

  const city = stops[0]?.spot.city ?? "day";
  const count = stops.length;

  return `${city}-${count}-${count === 1 ? "stop" : "stops"}.${payload}`;
}

/**
 * Returns null rather than throwing on anything malformed. A shared link is
 * user input arriving from outside the app: a truncated paste, an old version,
 * or a spot that has since been removed from the seed file all have to render
 * as "this link doesn't work" and not as a 500.
 */
export function decodeDay(id: string): SharedDay | null {
  const payload = id.slice(id.lastIndexOf(".") + 1);
  if (payload.length === 0) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(base64urlDecode(payload));
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;
  const { v, s, f } = parsed as { v?: unknown; s?: unknown; f?: unknown };
  if (v !== 1 || !Array.isArray(s)) return null;

  const stops: RouteStop[] = [];
  for (const entry of s) {
    if (!Array.isArray(entry)) return null;
    const [spotId, dwellMins] = entry as [unknown, unknown];
    if (typeof spotId !== "string") return null;

    const spot: Spot | undefined = getSpotById(spotId);
    // A spot removed from the seed file since the link was made. Drop it and
    // keep the rest — a partly-valid day is more use than nothing.
    if (!spot) continue;

    stops.push({
      spot,
      dwellMins:
        typeof dwellMins === "number" && dwellMins > 0 ? dwellMins : stopDwell(spot),
    });
  }

  if (stops.length === 0) return null;

  const frame: DayFrame =
    Array.isArray(f) && f.length === 3 && f.every((n) => typeof n === "number")
      ? { start: f[0] as number, frameStart: f[1] as number, frameEnd: f[2] as number }
      : defaultFrame;

  return { stops, frame };
}
