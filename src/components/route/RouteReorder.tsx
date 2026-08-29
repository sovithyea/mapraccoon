"use client";

import { clock, duration } from "@/components/route/time";
import { useRouteStops } from "@/components/route/useRouteStops";
import type { Dictionary } from "@/i18n/get-dictionary";
import { dayBudget } from "@/lib/route/day";
import { describeReorder, shortestDrivingOrder, useRoute } from "@/store/route";

const fill = (template: string, values: Record<string, string | number>): string =>
  Object.entries(values).reduce(
    (out, [key, value]) => out.replaceAll(`{${key}}`, String(value)),
    template,
  );

const DWELL_STEP = 30;

/**
 * Rearranging, as a separate job from reading.
 *
 * ↑↓ buttons rather than drag handles (D23). Dragging inside a vertically
 * scrolling sheet needs auto-scroll at both ends, is the most frequently broken
 * interaction in trip planners, and is unusable with a screen reader. Explicit
 * moves are boring, correct, and accessible with no extra work. The two named
 * reorderings cover the cases where step-by-step moves would be tedious.
 */
export function RouteReorder({ dict }: { dict: Dictionary }) {
  const { stops } = useRouteStops();
  const frame = useRoute((s) => s.frame);
  const move = useRoute((s) => s.move);
  const setDwell = useRoute((s) => s.setDwell);
  const reverse = useRoute((s) => s.reverse);
  const shortestDriving = useRoute((s) => s.shortestDriving);

  if (stops.length === 0) return null;

  const spots = stops.map((s) => s.spot);
  const proposed = shortestDrivingOrder(spots);
  const { savedMins, movedSensitive } = describeReorder(spots, proposed);

  /**
   * D25: an optimiser that silently reshuffles a day containing a killing site
   * is the wrong kind of clever. If the shorter order moves one, the suggestion
   * says so and names the time it would land at — the traveller decides.
   */
  const movedFirst = movedSensitive[0];
  const movedArrival = movedFirst
    ? dayBudget(
        proposed.map((spot) => ({
          spot,
          dwellMins: stops.find((s) => s.spot.id === spot.id)?.dwellMins ?? 60,
        })),
        frame,
      ).stops.find((s) => s.spot.id === movedFirst.id)?.arrivalMins
    : undefined;

  return (
    <div className="p-4">
      <p className="text-xs leading-relaxed text-muted">{dict.route.reorderNote}</p>

      <ul className="mt-4 space-y-2">
        {stops.map((stop, index) => (
          <li
            key={stop.spot.id}
            className={
              stop.spot.sensitive
                ? "border-y border-border bg-background px-3 py-3"
                : "rounded-2xl border border-border bg-surface px-3 py-3"
            }
          >
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium">{stop.spot.name.en}</p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {fill(
                    stop.spot.sensitive ? dict.route.staysMinimum : dict.route.stays,
                    { duration: duration(stop.dwellMins) },
                  )}
                </p>
              </div>

              {/* Dwell is a floor on a memorial stop, so it is not editable down. */}
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => setDwell(stop.spot.id, stop.dwellMins - DWELL_STEP)}
                  disabled={stop.dwellMins <= DWELL_STEP}
                  aria-disabled={stop.dwellMins <= DWELL_STEP}
                  aria-label={`Shorten time at ${stop.spot.name.en}`}
                  className="flex size-11 items-center justify-center text-muted disabled:opacity-35"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => setDwell(stop.spot.id, stop.dwellMins + DWELL_STEP)}
                  aria-label={`Longer at ${stop.spot.name.en}`}
                  className="flex size-11 items-center justify-center text-muted"
                >
                  ＋
                </button>
              </div>

              <div className="flex shrink-0 flex-col">
                <button
                  type="button"
                  onClick={() => move(stop.spot.id, -1)}
                  disabled={index === 0}
                  aria-disabled={index === 0}
                  aria-label={fill(dict.route.moveUp, { name: stop.spot.name.en })}
                  className="flex h-[22px] w-11 items-center justify-center text-muted disabled:opacity-35"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(stop.spot.id, 1)}
                  disabled={index === stops.length - 1}
                  aria-disabled={index === stops.length - 1}
                  aria-label={fill(dict.route.moveDown, { name: stop.spot.name.en })}
                  className="flex h-[22px] w-11 items-center justify-center text-muted disabled:opacity-35"
                >
                  ↓
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={reverse}
          className="min-h-11 rounded-full border border-border px-4 text-xs font-semibold hover:border-muted"
        >
          {dict.route.reverseDay}
        </button>
        <button
          type="button"
          onClick={shortestDriving}
          disabled={savedMins <= 0}
          aria-disabled={savedMins <= 0}
          aria-describedby="shortest-consequence"
          className="min-h-11 rounded-full border border-border px-4 text-xs font-semibold hover:border-muted disabled:opacity-40"
        >
          {dict.route.shortestOrder}
        </button>
      </div>

      <p id="shortest-consequence" className="mt-2 text-[11px] leading-relaxed text-muted">
        {savedMins > 0
          ? fill(dict.route.shortestSaves, { minutes: duration(savedMins) })
          : ""}
        {savedMins > 0 && movedFirst && movedArrival !== undefined ? (
          <>
            {" "}
            {fill(dict.route.shortestMovesSensitive, {
              name: movedFirst.name.en,
              time: clock(movedArrival),
            })}
          </>
        ) : null}
      </p>
    </div>
  );
}
