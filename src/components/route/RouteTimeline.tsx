"use client";

import { Fragment, useState } from "react";

import { DayFrameBar } from "@/components/route/DayFrameBar";
import { clock, duration } from "@/components/route/time";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { DayBudget, DayFrame, ScheduledStop } from "@/lib/route/day";
import { getNeighbourhood } from "@/lib/spots/neighbourhoods";

/** `<input type="time">` speaks 24-hour HH:MM and nothing else. */
const hhmm = (mins: number): string =>
  `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

const fill = (template: string, values: Record<string, string | number>): string =>
  Object.entries(values).reduce(
    (out, [key, value]) => out.replaceAll(`{${key}}`, String(value)),
    template,
  );

/**
 * The arrival time, editable in place (D44).
 *
 * It shows `clock()` — the app's 24-hour format — and swaps to a native
 * `<input type="time">` only while it is being edited. Rendering the input
 * permanently was the first version and was wrong twice: it clipped to "08:3("
 * inside the column, and a browser set to en-US drew "01:15 PM" directly above
 * a departure time reading "14:45", so one row showed two clock conventions.
 *
 * The native control is still what does the editing — it brings the keyboard
 * path and the phone picker, and this component does not have to parse time.
 */
function TimeCell({
  stop,
  dict,
  onPin,
  onUnpin,
}: {
  stop: ScheduledStop;
  dict: Dictionary;
  onPin?: (spotId: string, startMins: number) => void;
  onUnpin?: (spotId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const pinned = stop.startMins !== undefined;

  if (!onPin) {
    return (
      <p className="w-[52px] shrink-0 pt-0.5 text-[11px] leading-tight tabular-nums text-muted">
        {clock(stop.arrivalMins)}
        <br />
        {clock(stop.departureMins)}
      </p>
    );
  }

  return (
    <div className="w-[68px] shrink-0 pt-0.5">
      {editing ? (
        <input
          type="time"
          autoFocus
          defaultValue={hhmm(stop.arrivalMins)}
          step={300}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") setEditing(false);
          }}
          onChange={(e) => {
            const [h, m] = e.target.value.split(":").map(Number);
            if (h === undefined || m === undefined || Number.isNaN(h) || Number.isNaN(m)) {
              return;
            }
            onPin(stop.spot.id, h * 60 + m);
          }}
          className="w-full rounded-md border border-accent bg-surface px-1 py-0.5 text-[11px] tabular-nums"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={fill(dict.route.pinLabel, { name: stop.spot.name.en })}
          className={`w-full rounded-md border px-1 py-0.5 text-left text-[11px] tabular-nums ${
            pinned
              ? "border-accent font-semibold text-accent"
              : "border-transparent text-muted hover:border-border"
          }`}
        >
          {clock(stop.arrivalMins)}
        </button>
      )}

      <p className="px-1 text-[11px] leading-tight tabular-nums text-muted">
        {clock(stop.departureMins)}
      </p>

      {/*
        Only once pinned. A day you can pin but not unpin is a trap: the only
        way back would be deleting the stop, which loses its dwell.
      */}
      {pinned ? (
        <button
          type="button"
          onClick={() => onUnpin?.(stop.spot.id)}
          className="mt-0.5 px-1 text-[10px] text-muted underline underline-offset-2"
        >
          {dict.route.unpin}
        </button>
      ) : null}
    </div>
  );
}

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
  onPin,
  onUnpin,
}: {
  stop: ScheduledStop;
  index: number;
  total: number;
  dict: Dictionary;
  onMove?: (spotId: string, direction: -1 | 1) => void;
  onDwell?: (spotId: string, dwellMins: number) => void;
  onRemove?: (spotId: string) => void;
  onPin?: (spotId: string, startMins: number) => void;
  onUnpin?: (spotId: string) => void;
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
        <TimeCell stop={stop} dict={dict} onPin={onPin} onUnpin={onUnpin} />

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
  if (!stop.legFrom && stop.slackMins === 0) return null;

  return (
    <li className="flex flex-wrap items-center gap-x-2 px-4 py-1.5 text-[11px] text-muted">
      {stop.legFrom ? (
        <>
          <span aria-hidden="true">↓</span>
          {fill(dict.route.legEstimate, {
            minutes: duration(stop.legFrom.minutes),
            km: stop.legFrom.km.toFixed(1),
          })}
        </>
      ) : null}

      {/*
        A pin's consequence, said out loud. `dayBudget` honours a pinned time
        exactly rather than clamping it, so the gap or the overlap has to be
        visible here — otherwise the day silently shows an arrival the group
        cannot make.
      */}
      {stop.slackMins > 0 ? (
        <span>· {fill(dict.route.waiting, { duration: duration(stop.slackMins) })}</span>
      ) : null}
      {stop.slackMins < 0 ? (
        <span className="font-semibold text-foreground">
          · {fill(dict.route.clash, { duration: duration(-stop.slackMins) })}
        </span>
      ) : null}
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
  onPin,
  onUnpin,
}: {
  budget: DayBudget;
  frame: DayFrame;
  dict: Dictionary;
  onMove?: (spotId: string, direction: -1 | 1) => void;
  onRemove?: (spotId: string) => void;
  onDwell?: (spotId: string, dwellMins: number) => void;
  onPin?: (spotId: string, startMins: number) => void;
  onUnpin?: (spotId: string) => void;
}) {
  return (
    <div>
      <DayFrameBar
        budget={budget}
        frame={frame}
        onPin={onPin}
        dragLabel={dict.route.dragHint}
      />

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
              onPin={onPin}
              onUnpin={onUnpin}
            />
          </Fragment>
        ))}
      </ol>

      <p className="mt-3 px-4 text-[11px] leading-relaxed text-muted">
        {onPin ? `${dict.route.dragHint} ` : ""}
        {dict.route.estimateNote}
      </p>
    </div>
  );
}
