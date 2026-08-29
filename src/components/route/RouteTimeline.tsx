"use client";

import { Fragment } from "react";

import { DayFrameBar } from "@/components/route/DayFrameBar";
import { clock, duration } from "@/components/route/time";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { DayBudget, DayFrame, ScheduledStop } from "@/lib/route/day";
import { getNeighbourhood } from "@/lib/spots/neighbourhoods";

const fill = (template: string, values: Record<string, string | number>): string =>
  Object.entries(values).reduce(
    (out, [key, value]) => out.replaceAll(`{${key}}`, String(value)),
    template,
  );

/**
 * A stop in the day.
 *
 * D25: a memorial site is a different kind of row, not a styled variant of the
 * same one. Square corners on the page ground rather than a rounded surface
 * card, dwell stated as a floor rather than a plan, and no score at all — the
 * alternative is a killing site with a progress bar beside it.
 */
function StopRow({
  stop,
  index,
  total,
  dict,
  onMove,
  onRemove,
  onDwell,
}: {
  stop: ScheduledStop;
  index: number;
  total: number;
  dict: Dictionary;
  onMove?: (spotId: string, direction: -1 | 1) => void;
  onDwell?: (spotId: string, dwellMins: number) => void;
  onRemove?: (spotId: string) => void;
}) {
  const { spot } = stop;

  return (
    <li
      className={
        stop.isSensitive
          ? "border-y border-border bg-background px-4 py-4"
          : "rounded-2xl border border-border bg-surface px-4 py-4"
      }
    >
      <div className="flex items-start gap-3">
        <p className="w-[52px] shrink-0 pt-0.5 text-[11px] leading-tight tabular-nums text-muted">
          {clock(stop.arrivalMins)}
          <br />
          {clock(stop.departureMins)}
        </p>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[15px] font-semibold leading-snug">
            {spot.name.en}
          </h3>

          {stop.isSensitive ? (
            <>
              <p className="mt-1 text-xs leading-relaxed text-muted">{spot.blurb.en}</p>
              <p className="mt-1.5 text-[11px] text-muted">
                {fill(dict.route.dwellMinimum, { duration: duration(stop.dwellMins) })} ·{" "}
                {dict.route.notRanked}
              </p>
            </>
          ) : (
            <p className="mt-1 text-[11px] text-muted">
              {fill(dict.route.dwellHere, { duration: duration(stop.dwellMins) })}
              {` · ${"$".repeat(spot.priceLevel)}`}
                          </p>
          )}
        </div>

        {/*
          How long you stay, editable on the stop itself.

          This used to live only in the Reorder tab, which meant the number the
          whole schedule is computed from was two taps away from the schedule.
          Every change here retimes every arrival below it, which is the point
          — the day is a budget, and this is the part of it you control (D24).
        */}
        {onDwell && !stop.isSensitive ? (
          <div className="flex shrink-0 items-center">
            <button
              type="button"
              onClick={() => onDwell(spot.id, stop.dwellMins - 15)}
              disabled={stop.dwellMins <= 15}
              aria-disabled={stop.dwellMins <= 15}
              aria-label={fill(dict.route.shorterAt, { name: spot.name.en })}
              className="flex size-9 items-center justify-center rounded-full text-muted disabled:opacity-30"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => onDwell(spot.id, stop.dwellMins + 15)}
              aria-label={fill(dict.route.longerAt, { name: spot.name.en })}
              className="flex size-9 items-center justify-center rounded-full text-muted"
            >
              ＋
            </button>
          </div>
        ) : null}

        <div className="flex shrink-0 items-center gap-2">
          {stop.isSensitive ? (
            <span className="text-xs text-muted" aria-hidden="true">
              —
            </span>
          ) : (
            <span className="text-xs text-muted">
              {getNeighbourhood(spot.neighbourhood).name}
            </span>
          )}

          {onMove ? (
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => onMove(spot.id, -1)}
                disabled={index === 0}
                aria-disabled={index === 0}
                aria-label={fill(dict.route.moveUp, { name: spot.name.en })}
                className="flex h-[22px] w-11 items-center justify-center text-muted disabled:opacity-35"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => onMove(spot.id, 1)}
                disabled={index === total - 1}
                aria-disabled={index === total - 1}
                aria-label={fill(dict.route.moveDown, { name: spot.name.en })}
                className="flex h-[22px] w-11 items-center justify-center text-muted disabled:opacity-35"
              >
                ↓
              </button>
            </div>
          ) : null}

          {onRemove ? (
            <button
              type="button"
              onClick={() => onRemove(spot.id)}
              aria-label={fill(dict.route.remove, { name: spot.name.en })}
              className="flex size-11 items-center justify-center text-muted hover:text-foreground"
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

/** The travel leg. Every fact lives in type, so the builder needs no map (D22). */
function LegRow({ stop, dict }: { stop: ScheduledStop; dict: Dictionary }) {
  if (!stop.legFrom) return null;

  return (
    <li className="flex items-center gap-2 px-4 py-1.5 text-[11px] text-muted">
      <span aria-hidden="true">↓</span>
      {fill(dict.route.legEstimate, {
        minutes: duration(stop.legFrom.minutes),
        km: stop.legFrom.km.toFixed(1),
      })}
    </li>
  );
}

export function RouteTimeline({
  budget,
  frame,
  dict,
  onMove,
  onRemove,
  onDwell,
}: {
  budget: DayBudget;
  frame: DayFrame;
  dict: Dictionary;
  onMove?: (spotId: string, direction: -1 | 1) => void;
  onRemove?: (spotId: string) => void;
  onDwell?: (spotId: string, dwellMins: number) => void;
}) {
  return (
    <div>
      <DayFrameBar budget={budget} frame={frame} />

      <ol className="mt-4 space-y-1">
        {budget.stops.map((stop, index) => (
          // Fragment, not a wrapper element: <ol> may only contain <li>, and
          // both LegRow and StopRow render one.
          <Fragment key={stop.spot.id}>
            <LegRow stop={stop} dict={dict} />
            <StopRow
              stop={stop}
              index={index}
              total={budget.stops.length}
              dict={dict}
              onMove={onMove}
              onRemove={onRemove}
              onDwell={onDwell}
            />
          </Fragment>
        ))}
      </ol>

      <p className="mt-3 px-4 text-[11px] leading-relaxed text-muted">
        {dict.route.estimateNote}
      </p>
    </div>
  );
}
