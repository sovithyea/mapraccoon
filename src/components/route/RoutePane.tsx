"use client";

import { useState } from "react";

import { DayTail } from "@/components/route/DayTail";
import { RouteTimeline } from "@/components/route/RouteTimeline";
import { DayFrameBar } from "@/components/route/DayFrameBar";
import { clock, duration } from "@/components/route/time";
import type { Dictionary } from "@/i18n/get-dictionary";
import { dayBudget } from "@/lib/route/day";
import { encodeDay } from "@/lib/route/share";
import { getNeighbourhood } from "@/lib/spots/neighbourhoods";
import type { Spot } from "@/lib/spots/schema";
import { useRouteStops } from "@/components/route/useRouteStops";
import { useRoute } from "@/store/route";

const fill = (template: string, values: Record<string, string | number>): string =>
  Object.entries(values).reduce(
    (out, [key, value]) => out.replaceAll(`{${key}}`, String(value)),
    template,
  );


/**
 * The route as a pane. D23: this is the third state of /discover's existing
 * right-hand pane and the body of the mobile sheet — the same component in both
 * places, because they are the same view at two widths.
 *
 * It needs no Mapbox token: every travel fact is type, which is the same
 * argument that makes Constellation the hero rather than a map (D11).
 */
export function RoutePane({
  candidates,
  dict,
}: {
  candidates: readonly Spot[];
  dict: Dictionary;
}) {
  const { stops, hydrated } = useRouteStops();
  const frame = useRoute((s) => s.frame);
  const add = useRoute((s) => s.add);
  const move = useRoute((s) => s.move);
  const remove = useRoute((s) => s.remove);
  const setFrameEnd = useRoute((s) => s.setFrameEnd);
  const [copied, setCopied] = useState(false);

  // Rendering the empty state before localStorage has been read would flash
  // "a day with nothing in it" over a day that does exist.
  if (!hydrated) return <div className="min-h-[24rem]" aria-busy="true" />;

  const budget = dayBudget(stops, frame);
  // Named by where it actually goes. A night that crosses neighbourhoods is
  // normal now, so the label lists them rather than picking one.
  const cityName = [...new Set(stops.map((s) => s.spot.neighbourhood))]
    .map((id) => getNeighbourhood(id).name)
    .join(" & ");

  // The tray used to be filtered to the day's city, because an unfiltered one
  // offered a Battambang spot for a Kampot day at "28h 20m over" (C22). With a
  // single city that filter is meaningless — every candidate is a short leg
  // away, and crossing neighbourhoods is the point (D27).
  const inCity = candidates;

  if (stops.length === 0) {
    return (
      <section className="p-4">
        <p className="eyebrow">{dict.route.dayTitle}</p>
        <h2 className="mt-2 font-display text-2xl font-bold leading-tight">
          {dict.route.emptyTitle}
        </h2>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          {fill(dict.route.emptyBody, { start: clock(frame.start) })}
        </p>

        <p className="mt-5 text-xs font-semibold tabular-nums">
          {fill(dict.route.emptyFree, {
            free: duration(frame.frameEnd - frame.frameStart),
          })}
        </p>

        {/* The empty state draws the constraint container rather than
            describing it — the rule the product is about, before a single
            stop exists (D24). */}
        <div className="mt-2">
          <DayFrameBar budget={budget} frame={frame} />
        </div>

        <DayTail
          budget={budget}
          frame={frame}
          stops={stops}
          candidates={candidates}
          dict={dict}
          onAdd={add}
        />
      </section>
    );
  }

  return (
    <section className="p-4">
      <p className="eyebrow">{dict.route.dayTitle}</p>
      <h2 className="mt-2 font-display text-xl font-bold leading-tight">
        {fill(dict.route.dayIn, { city: cityName })}
      </h2>

      <p className="mt-1.5 text-[11px] text-muted">
        {fill(dict.route.startsAt, {
          start: clock(frame.start),
          from: clock(frame.frameStart),
          to: clock(frame.frameEnd),
        })}
      </p>

      <p className="mt-2 text-xs tabular-nums" role="status">
        {budget.state === "over"
          ? fill(dict.route.summaryOver, {
              count: stops.length,
              planned: duration(budget.plannedMins),
              over: duration(budget.overrunMins),
              end: clock(frame.frameEnd),
            })
          : fill(stops.length === 1 ? dict.route.summaryOne : dict.route.summary, {
              count: stops.length,
              planned: duration(budget.plannedMins),
              left: duration(budget.remainingMins),
            })}
      </p>


      <div className="mt-4">
        <RouteTimeline
          budget={budget}
          frame={frame}
          dict={dict}
          onMove={move}
          onRemove={remove}
        />
      </div>

      <DayTail
        budget={budget}
        frame={frame}
        stops={stops}
        candidates={inCity}
        dict={dict}
        onAdd={add}
        onRunLater={setFrameEnd}
      />

      {/*
        The day travels in its own URL (D1: nothing to save it to), so sharing
        is a clipboard copy rather than a round trip to a server.
      */}
      <div className="mt-4 border-t border-border px-4 pt-4">
        <button
          type="button"
          onClick={() => {
            const url = `${window.location.origin}/en/plan/${encodeDay(stops, frame)}`;
            void navigator.clipboard?.writeText(url).then(() => setCopied(true));
          }}
          className="min-h-11 rounded-full border border-border px-4 text-xs font-semibold hover:border-muted"
        >
          {copied ? dict.route.shareCopied : dict.route.shareDay}
        </button>
      </div>
    </section>
  );
}
