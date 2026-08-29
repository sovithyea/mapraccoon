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
 */

const HATCH =
  "repeating-linear-gradient(45deg, var(--muted) 0 1px, transparent 1px 4px)";

export function DayFrameBar({
  budget,
  frame,
  compact = false,
}: {
  budget: DayBudget;
  frame: DayFrame;
  compact?: boolean;
}) {
  const frameMins = frame.frameEnd - frame.frameStart;
  const pct = (mins: number) => `${(mins / frameMins) * 100}%`;

  const hours: number[] = [];
  for (let m = frame.frameStart; m <= frame.frameEnd; m += 60) hours.push(m);

  const label =
    budget.state === "over"
      ? `Day plan runs ${duration(budget.overrunMins)} past ${clock(frame.frameEnd)}`
      : `${duration(budget.remainingMins)} of the day still free`;

  return (
    <div>
      <div className="relative">
        {/* The frame. Both end rules are fixed so overflow has somewhere to go. */}
        <div
          className="relative flex h-6 w-full items-stretch border-x-2 border-foreground bg-surface-sunk"
          role="img"
          aria-label={label}
        >
          {budget.stops.map((stop) => {
            const legWidth = stop.legFrom?.minutes ?? 0;
            return (
              <div key={stop.spot.id} className="contents">
                {legWidth > 0 ? (
                  <div
                    className="h-full shrink-0"
                    style={{ width: pct(legWidth), backgroundImage: HATCH }}
                  />
                ) : null}
                <div
                  className="h-full shrink-0 bg-accent"
                  style={{ width: pct(stop.dwellMins) }}
                />
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
        </ul>
      ) : null}
    </div>
  );
}
