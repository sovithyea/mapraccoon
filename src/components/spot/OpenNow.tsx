"use client";

import { useNow } from "@/components/hooks/useNow";
import { clock } from "@/components/route/time";
import type { Dictionary } from "@/i18n/get-dictionary";
import { holidayOn } from "@/lib/hours/holidays";
import { isOpenAt, nextChangeAt, type OpenState } from "@/lib/hours/open";
import type { Hours } from "@/lib/hours/schema";

/**
 * The live open/closed line. A client island on an otherwise static page.
 *
 * It renders **nothing** until `useNow` returns — the page is statically
 * generated, so an open state baked into the HTML was computed at build time
 * and is a lie by the time anyone reads it. Reserving no space is deliberate:
 * a placeholder that says "checking…" is worse than a line that simply is not
 * there yet, because the first invites reading and the second does not.
 */

const TONE: Record<OpenState, string> = {
  open: "text-accent",
  "closing-soon": "text-foreground",
  closed: "text-muted",
  unknown: "text-muted",
};

export function OpenNow({ hours, dict }: { hours: Hours; dict: Dictionary }) {
  const now = useNow();
  if (!now) return null;

  const state = isOpenAt(hours, now);
  const next = nextChangeAt(hours, now);
  const holiday = holidayOn(now.isoDate);

  const label =
    state === "unknown"
      ? dict.spot.hoursUnknownLine
      : state === "open"
        ? next
          ? dict.spot.openUntil.replace("{time}", clock((now.mins + next.minsAway) % 1440))
          : dict.spot.openNow
        : state === "closing-soon"
          ? dict.spot.closingSoon.replace("{mins}", String(next?.minsAway ?? 0))
          : next
            ? dict.spot.closedUntil.replace("{time}", clock((now.mins + next.minsAway) % 1440))
            : dict.spot.closedNow;

  return (
    <div className="mt-2">
      <p className={`text-sm font-semibold ${TONE[state]}`} role="status">
        {label}
      </p>

      {/*
        One line, on the day, instead of a `closedOnPublicHolidays` boolean on
        eighty venues — several of these dates are lunar and move every year, so
        an author would be guessing about a date they also cannot predict.
      */}
      {holiday ? (
        <p className="mt-1 text-xs leading-relaxed text-muted">
          {dict.spot.holidayWarning.replace("{name}", holiday.name)}
        </p>
      ) : null}
    </div>
  );
}
