"use client";

import { clock, duration } from "@/components/route/time";
import type { Dictionary } from "@/i18n/get-dictionary";
import {
  costOfAdding,
  type DayBudget,
  type DayFrame,
  type RouteStop,
} from "@/lib/route/day";
import { sortSpots } from "@/lib/scoring";
import type { Spot } from "@/lib/spots/schema";

const fill = (template: string, values: Record<string, string | number>): string =>
  Object.entries(values).reduce(
    (out, [key, value]) => out.replaceAll(`{${key}}`, String(value)),
    template,
  );

const ordinals = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth"];

/**
 * The tail row: the constraint's home.
 *
 * D24. This sits exactly where the next stop would land, so the verdict is read
 * at the moment of the decision rather than after it — which is why the phase
 * needs no modal. When the day is full the same row stops being an affordance
 * and becomes a statement, with two named exits rather than an "OK".
 *
 * Suggestions are off-radar sorted and filtered to what fits. Never popularity,
 * never "featured" — the default sort is the product, and it survives into
 * planning rather than being a browse-time nicety.
 */
export function DayTail({
  budget,
  frame,
  stops,
  candidates,
  dict,
  onAdd,
  onRunLater,
}: {
  budget: DayBudget;
  frame: DayFrame;
  stops: readonly RouteStop[];
  candidates: readonly Spot[];
  dict: Dictionary;
  onAdd: (spot: Spot) => void;
  onRunLater?: (endMins: number) => void;
}) {
  const chosen = new Set(stops.map((s) => s.spot.id));
  const suggestions = sortSpots(
    candidates.filter((spot) => !chosen.has(spot.id)),
    "name",
  ).slice(0, 6);

  const longest = [...stops].sort((a, b) => b.dwellMins - a.dwellMins)[0];

  if (budget.state === "full" || budget.state === "over") {
    return (
      <section className="mt-4 border-t border-border px-4 pt-4">
        <p className="font-display text-[15px] font-semibold">
          {budget.state === "over"
            ? fill(dict.route.overBy, {
                over: duration(budget.overrunMins),
                end: clock(frame.frameEnd),
              })
            : fill(dict.route.dayFull, {
                left: duration(budget.remainingMins),
                end: clock(frame.frameEnd),
              })}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          {dict.route.dayFullBody}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {onRunLater ? (
            <button
              type="button"
              onClick={() => onRunLater(Math.min(22 * 60, frame.frameEnd + 90))}
              className="min-h-11 rounded-full border border-border px-4 text-xs font-semibold hover:border-muted"
            >
              {fill(dict.route.runLater, { time: clock(Math.min(22 * 60, frame.frameEnd + 90)) })}
            </button>
          ) : null}

          {longest ? (
            <span className="flex min-h-11 items-center rounded-full border border-border px-4 text-xs text-muted">
              {fill(dict.route.trimStop, {
                name: longest.spot.name.en,
                duration: duration(longest.dwellMins),
              })}
            </span>
          ) : null}
        </div>
      </section>
    );
  }

  const ordinal = ordinals[stops.length] ?? "next";

  return (
    <section className="mt-4 border-t border-border px-4 pt-4">
      <p className="text-xs font-semibold">
        {stops.length === 0
          ? dict.route.addFirstNote
          : fill(dict.route.addNext, {
              ordinal,
              left: duration(budget.remainingMins),
              end: clock(budget.endMins),
            })}
      </p>
      <p className="mt-1 text-[11px] text-muted">{dict.route.suggestionsNote}</p>

      <ul className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((spot) => {
          const cost = costOfAdding(stops, spot, frame);
          const describedBy = `cost-${spot.id}`;

          return (
            <li key={spot.id}>
              <button
                type="button"
                onClick={() => onAdd(spot)}
                aria-describedby={describedBy}
                className="flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-xs hover:border-muted"
              >
                <span aria-hidden="true">＋</span>
                <span className="font-medium">{spot.name.en}</span>
                <span className="text-muted">
                  ·{" "}
                  {cost.fits
                    ? duration(cost.addedMins)
                    : fill(dict.route.addOver, { over: duration(cost.overrunMins) })}
                </span>
              </button>
              {/* Never disabled — the cost is stated instead, and the button is
                  described by it. D24. */}
              <span id={describedBy} className="sr-only">
                {cost.fits
                  ? fill(dict.route.addFits, {
                      left: duration(budget.remainingMins - cost.addedMins),
                    })
                  : fill(dict.route.addOverExplain, {
                      over: duration(cost.overrunMins),
                      end: clock(frame.frameEnd),
                    })}
              </span>
            </li>
          );
        })}
      </ul>

      {suggestions.length === 0 ? (
        <p className="mt-2 text-[11px] text-muted">
          {fill(dict.route.dayFull, {
            left: duration(budget.remainingMins),
            end: clock(frame.frameEnd),
          })}
        </p>
      ) : null}
    </section>
  );
}
