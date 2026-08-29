import { clock } from "@/components/route/time";
import type { Dictionary } from "@/i18n/get-dictionary";
import { DAYS, type Hours } from "@/lib/hours/schema";

/**
 * The weekly table. Server-rendered, because a schedule does not change between
 * the build and the read — only the *state* does, and that is `OpenNow`.
 *
 * Splitting them is what lets the page stay static while still telling the
 * truth about right now.
 */
export function WeeklyHours({ hours, dict }: { hours: Hours; dict: Dictionary }) {
  if (hours.kind === "unknown") {
    return <p className="text-sm text-muted">{dict.spot.hoursUnknownLine}</p>;
  }

  if (hours.kind === "always") {
    return <p className="text-sm">{dict.spot.openNow}</p>;
  }

  // An absent day is closed — the schema's convention, made visible here so a
  // reader is not left wondering whether a missing row means closed or unknown.
  const byDay = DAYS.map((day) => ({
    day,
    spans: hours.rules
      .filter((r) => r.days.includes(day))
      .map((r) => `${clock(r.openMins)}–${clock(r.closeMins % 1440)}`)
      .sort(),
  }));

  return (
    <dl className="space-y-1 text-sm">
      {byDay.map(({ day, spans }) => (
        <div key={day} className="flex justify-between gap-4">
          <dt className="w-12 shrink-0 capitalize text-muted">{day}</dt>
          <dd className="text-right tabular-nums">
            {spans.length === 0 ? (
              <span className="text-muted">{dict.spot.closedNow}</span>
            ) : (
              spans.join(", ")
            )}
          </dd>
        </div>
      ))}
      {hours.note ? (
        <p className="pt-2 text-xs leading-relaxed text-muted">{hours.note.en}</p>
      ) : null}
    </dl>
  );
}
