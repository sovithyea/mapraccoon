"use client";

import { clock, duration } from "@/components/route/time";
import { useRouteStops } from "@/components/route/useRouteStops";
import type { Dictionary } from "@/i18n/get-dictionary";
import { costOfAdding } from "@/lib/route/day";
import { getNeighbourhood } from "@/lib/spots/neighbourhoods";
import type { Spot } from "@/lib/spots/schema";
import { useRoute } from "@/store/route";

const fill = (template: string, values: Record<string, string | number>): string =>
  Object.entries(values).reduce(
    (out, [key, value]) => out.replaceAll(`{${key}}`, String(value)),
    template,
  );

/**
 * The add affordance, priced.
 *
 * D24: it states what it will cost before it is pressed, and it is never
 * disabled — the cap is soft, and a 40-minute overrun may be exactly the trade
 * the traveller wants. `aria-describedby` points at the line that explains the
 * cost, which is the association the competitor's disabled checkboxes lack.
 *
 * Three states, and only the third changes the button's job: fits, overruns,
 * already added.
 */
export function AddToDay({
  spot,
  dict,
  className = "",
}: {
  spot: Spot;
  dict: Dictionary;
  className?: string;
}) {
  const { stops, hydrated } = useRouteStops();
  const frame = useRoute((s) => s.frame);
  const add = useRoute((s) => s.add);
  const remove = useRoute((s) => s.remove);

  if (!hydrated) return null;

  // The cross-city guard that used to be here is gone with D27. Adding a BKK1
  // bar and a Riverside restaurant to the same night is the point of the
  // product, not a mistake to prevent — and inside one city the legs are short
  // enough that the day budget is the only constraint that matters.

  const index = stops.findIndex((s) => s.spot.id === spot.id);
  const describedBy = `add-cost-${spot.id}`;

  if (index !== -1) {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => remove(spot.id)}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-accent px-5 text-sm font-semibold text-accent"
        >
          ✓ {fill(dict.route.added, { index: index + 1 })}
        </button>
      </div>
    );
  }

  const cost = costOfAdding(stops, spot, frame);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => add(spot)}
        aria-describedby={describedBy}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-contrast"
      >
        <span aria-hidden="true">＋</span>
        {stops.length === 0
          ? fill(dict.route.addStartDay, {
              city: getNeighbourhood(spot.neighbourhood).name,
              duration: duration(cost.dwellMins),
            })
          : cost.fits
            ? fill(dict.route.addCost, { duration: duration(cost.addedMins) })
            : fill(dict.route.addOver, { over: duration(cost.overrunMins) })}
      </button>

      <p id={describedBy} className="mt-1.5 text-[11px] leading-relaxed text-muted">
        {cost.fits
          ? null
          : fill(dict.route.addOverExplain, {
              over: duration(cost.overrunMins),
              end: clock(frame.frameEnd),
            })}
      </p>
    </div>
  );
}
