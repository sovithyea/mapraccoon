"use client";

import { useCallback, useRef, useState } from "react";

import { clock, duration } from "@/components/route/time";
import type { DayBudget, DayFrame } from "@/lib/route/day";

/**
 * The day drawn as a fixed container, before it is filled.
 *
 * D24: the frame cannot stretch, so a plan that does not fit visibly sticks out
 * of it. That is the honest reading of "a day has fixed hours", and it is why
 * overflow here is geometry rather than colour — no fifth accent enters the
 * palette for it (D21).
 *
 * Dwell is solid, travel is hatched, so one glance says how much of the day is
 * transit. The hatch is drawn from theme tokens and therefore inverts correctly
 * in dark mode; a hardcoded hatch colour is how this class of bug shipped last
 * time.
 *
 * **The blocks are draggable (D44).** They used to be laid out with flex, one
 * after another, which encoded the old assumption that a day is packed: there
 * was no position a block could occupy except the next one. They are absolutely
 * positioned from their scheduled arrival now, so a gap is drawable — and a gap
 * being drawable is what makes "we're meeting them at nine" expressible.
 */

const HATCH =
  "repeating-linear-gradient(45deg, var(--muted) 0 1px, transparent 1px 4px)";

/** Drags land on five-minute marks. Finer is false precision on an estimate. */
const SNAP_MINS = 5;
/** Arrow keys move by a quarter hour, which is how people say times. */
const NUDGE_MINS = 15;

const snap = (mins: number) => Math.round(mins / SNAP_MINS) * SNAP_MINS;

export function DayFrameBar({
  budget,
  frame,
  compact = false,
  onPin,
  dragLabel,
}: {
  budget: DayBudget;
  frame: DayFrame;
  compact?: boolean;
  /** Absent on read-only surfaces (the dock, a shared day), which stay static. */
  onPin?: (spotId: string, startMins: number) => void;
  dragLabel?: string;
}) {
  const frameMins = frame.frameEnd - frame.frameStart;
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const pct = (mins: number) => `${(mins / frameMins) * 100}%`;
  const at = (mins: number) => `${((mins - frame.frameStart) / frameMins) * 100}%`;

  const hours: number[] = [];
  for (let m = frame.frameStart; m <= frame.frameEnd; m += 60) hours.push(m);

  const label =
    budget.state === "over"
      ? `Day plan runs ${duration(budget.overrunMins)} past ${clock(frame.frameEnd)}`
      : `${duration(budget.remainingMins)} of the day still free`;

  /**
   * Pointer events, not mouse events, and capture on the element being dragged.
   *
   * Capture is what keeps a fast drag attached to the block when the pointer
   * leaves the 24px-tall track — without it the block sticks and the day jumps
   * back, which reads as the drag having failed rather than as a lost pointer.
   */
  const startDrag = useCallback(
    (spotId: string, dwellMins: number) => (event: React.PointerEvent<HTMLElement>) => {
      if (!onPin) return;
      const track = trackRef.current;
      if (!track) return;

      event.preventDefault();
      const element = event.currentTarget;
      element.setPointerCapture(event.pointerId);
      setDragging(spotId);

      const rect = track.getBoundingClientRect();
      const grabOffsetPx = event.clientX - element.getBoundingClientRect().left;

      const minsAt = (clientX: number) => {
        const x = clientX - grabOffsetPx - rect.left;
        const mins = frame.frameStart + (x / rect.width) * frameMins;
        // A stop may not start before the frame opens, and must still fit
        // inside it — a block dragged off the right end would be unreachable.
        return Math.max(
          frame.frameStart,
          Math.min(frame.frameEnd - dwellMins, snap(mins)),
        );
      };

      const onMove = (e: PointerEvent) => onPin(spotId, minsAt(e.clientX));
      const onUp = (e: PointerEvent) => {
        onPin(spotId, minsAt(e.clientX));
        setDragging(null);
        element.releasePointerCapture(e.pointerId);
        element.removeEventListener("pointermove", onMove);
        element.removeEventListener("pointerup", onUp);
        element.removeEventListener("pointercancel", onUp);
      };

      element.addEventListener("pointermove", onMove);
      element.addEventListener("pointerup", onUp);
      element.addEventListener("pointercancel", onUp);
    },
    [onPin, frame.frameStart, frame.frameEnd, frameMins],
  );

  return (
    <div>
      <div className="relative">
        {/* The frame. Both end rules are fixed so overflow has somewhere to go. */}
        <div
          ref={trackRef}
          className="relative h-6 w-full border-x-2 border-foreground bg-surface-sunk"
          role="img"
          aria-label={label}
        >
          {budget.stops.map((stop) => {
            const legMins = stop.legFrom?.minutes ?? 0;
            const draggable = Boolean(onPin);
            const isDragging = dragging === stop.spot.id;

            return (
              <div key={stop.spot.id} className="contents">
                {/* Travel, drawn from the moment you leave to the moment you
                    arrive — so a pinned stop shows the wait as bare track
                    rather than as more travelling. */}
                {legMins > 0 ? (
                  <div
                    aria-hidden="true"
                    className="absolute inset-y-0"
                    style={{
                      left: at(stop.earliestMins - legMins),
                      width: pct(legMins),
                      backgroundImage: HATCH,
                    }}
                  />
                ) : null}

                {draggable ? (
                  <button
                    type="button"
                    aria-label={`${stop.spot.name.en} — ${clock(stop.arrivalMins)}. ${dragLabel ?? ""}`}
                    onPointerDown={startDrag(stop.spot.id, stop.dwellMins)}
                    onKeyDown={(e) => {
                      // Keyboard parity, not an afterthought: a drag-only
                      // control is unusable without a pointer, and this is the
                      // only way to set a time on the bar.
                      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                        e.preventDefault();
                        const delta = e.key === "ArrowLeft" ? -NUDGE_MINS : NUDGE_MINS;
                        onPin?.(
                          stop.spot.id,
                          Math.max(
                            frame.frameStart,
                            Math.min(
                              frame.frameEnd - stop.dwellMins,
                              snap(stop.arrivalMins + delta),
                            ),
                          ),
                        );
                      }
                    }}
                    className={`absolute inset-y-0 touch-none rounded-[2px] bg-accent transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 ${
                      isDragging ? "cursor-grabbing shadow-lg" : "cursor-grab"
                    }`}
                    style={{ left: at(stop.arrivalMins), width: pct(stop.dwellMins) }}
                  >
                    {/* A grip, so the block reads as movable before it is moved.
                        Hidden under ~20px of width, where it would be noise. */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-1.5 left-1/2 hidden w-[3px] -translate-x-1/2 rounded-full bg-accent-contrast/50 sm:block"
                    />
                  </button>
                ) : (
                  <div
                    aria-hidden="true"
                    className="absolute inset-y-0 bg-accent"
                    style={{ left: at(stop.arrivalMins), width: pct(stop.dwellMins) }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* The overrun, drawn outside the frame past a doubled end rule. */}
        {budget.overrunMins > 0 ? (
          <div
            className="absolute inset-y-0 left-full flex items-stretch border-l-[3px] border-foreground"
            style={{ width: pct(budget.overrunMins) }}
            aria-hidden="true"
          >
            <div className="h-full w-full" style={{ backgroundImage: HATCH }} />
          </div>
        ) : null}
      </div>

      {!compact ? (
        <div className="mt-1 flex justify-between text-[10px] tabular-nums text-muted">
          {hours.map((m) => (
            <span key={m}>{String(Math.floor(m / 60)).padStart(2, "0")}</span>
          ))}
        </div>
      ) : null}

      {!compact ? (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
          <li className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-[1px] bg-accent" aria-hidden="true" />
            at a stop
          </li>
          <li className="flex items-center gap-1.5">
            <span
              className="h-2 w-4 rounded-[1px] border border-border"
              style={{ backgroundImage: HATCH }}
              aria-hidden="true"
            />
            travelling, est.
          </li>
          {/*
            Only when the day actually contains one. The day average already
            footnotes its denominator; this explains the other consequence —
            that a memorial stop's dwell is a floor, not a plan (D25).
          */}
          {budget.stops.some((stop) => stop.isSensitive) ? (
            <li className="flex items-center gap-1.5">
              <span
                className="h-2 w-4 rounded-[1px] border border-foreground"
                aria-hidden="true"
              />
              memorial site — dwell is a minimum
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
