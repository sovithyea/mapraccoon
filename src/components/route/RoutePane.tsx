"use client";

import { DayTail } from "@/components/route/DayTail";
import { RouteTimeline } from "@/components/route/RouteTimeline";
import { DayFrameBar } from "@/components/route/DayFrameBar";
import { clock, duration } from "@/components/route/time";
import type { Dictionary } from "@/i18n/get-dictionary";
import { dayBudget, dayOffRadarAverage } from "@/lib/route/day";
import { getCity } from "@/lib/spots/cities";
import type { Spot } from "@/lib/spots/schema";
import { useRouteStops } from "@/components/route/useRouteStops";
import { useRoute } from "@/store/route";

const fill = (template: string, values: Record<string, string | number>): string =>
  Object.entries(values).reduce(
    (out, [key, value]) => out.replaceAll(`{${key}}`, String(value)),
    template,
  );

const bandLabel: Record<string, string> = {
  famous: "Famous",
  known: "Well known",
  quiet: "Quiet",
  remote: "Off the radar",
};

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
  const city = useRoute((s) => s.city);
  const add = useRoute((s) => s.add);
  const move = useRoute((s) => s.move);
  const remove = useRoute((s) => s.remove);
  const setFrameEnd = useRoute((s) => s.setFrameEnd);

  // Rendering the empty state before localStorage has been read would flash
  // "a day with nothing in it" over a day that does exist.
  if (!hydrated) return <div className="min-h-[24rem]" aria-busy="true" />;

  const budget = dayBudget(stops, frame);
  const average = dayOffRadarAverage(stops);
  const cityName = city ? getCity(city).name : "";

  /**
   * A day is one city (D22 scope). Without this the tray offers whatever
   * /discover happens to be showing — which, unfiltered, is all 42 spots, and
   * a Battambang spot suggested for a Kampot day priced itself at "28h 20m
   * over". Found by running it, not by reading it.
   */
  const inCity = city
    ? candidates.filter((spot) => spot.city === city)
    : candidates;

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

      {average.average !== null ? (
        <p className="mt-1 text-[11px] text-muted">
          {fill(dict.route.dayAverage, {
            average: average.average,
            band: bandLabel[average.band ?? "quiet"] ?? "",
          })}{" "}
          {average.scoredCount !== average.totalCount
            ? fill(dict.route.dayAverageDenominator, {
                scored: average.scoredCount,
                total: average.totalCount,
              })
            : null}
        </p>
      ) : null}

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
    </section>
  );
}
