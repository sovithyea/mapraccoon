import Link from "next/link";
import type { Metadata } from "next";

import { clock } from "@/components/route/time";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { projectCambodia } from "@/lib/geo/project";
import { dayBudget, dayOffRadarAverage } from "@/lib/route/day";
import { decodeDay } from "@/lib/route/share";
import { offRadarBand } from "@/lib/scoring";
import { getCity } from "@/lib/spots/cities";
import { notFound } from "next/navigation";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const fill = (t: string, v: Record<string, string | number>): string =>
  Object.entries(v).reduce((o, [k, val]) => o.replaceAll(`{${k}}`, String(val)), t);

const bandLabel: Record<string, string> = {
  famous: "Famous",
  known: "Well known",
  quiet: "Quiet",
  remote: "Off the radar",
};

/**
 * A shared day.
 *
 * With no backend (D1) the link carries the whole day, so this page is a pure
 * function of its URL — there is nothing to look up and nothing to go stale
 * except the spot content itself, which is deliberately read live from the seed
 * file rather than frozen into the link (R1).
 *
 * It is the one place the builder gets a hero, and the hero is Constellation
 * family: the same projection and the same graticule, dots sized by off-radar
 * score, legs as dashed hairlines. An argument about the data rather than about
 * the brand — and it needs no Mapbox token, so a shared day never renders as a
 * grey box (D11).
 *
 * `noindex`: these URLs are user-generated and there are unbounded numbers of
 * them.
 */
export default async function PlanPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const day = decodeDay(id);

  if (!day) {
    return (
      <article className="mx-auto w-full max-w-2xl px-5 py-16">
        <p className="eyebrow">{dict.route.sharedTitle}</p>
        <h1 className="mt-3 font-display text-3xl font-bold">
          {dict.route.sharedBadLink}
        </h1>
        <Link
          href={`/${locale}/discover`}
          className="mt-6 inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-contrast"
        >
          {dict.nav.backToDiscover}
        </Link>
      </article>
    );
  }

  const budget = dayBudget(day.stops, day.frame);
  const average = dayOffRadarAverage(day.stops);
  const first = day.stops[0];
  const city = first ? getCity(first.spot.city) : undefined;
  const points = day.stops.map((stop) => ({
    stop,
    ...projectCambodia(stop.spot.coords),
  }));

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-10">
      <p className="eyebrow">{dict.route.sharedTitle}</p>
      <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">
        {fill(dict.route.sharedSubtitle, {
          count: day.stops.length,
          city: city?.name ?? "",
          from: clock(day.frame.start),
          to: clock(budget.endMins),
        })}
      </h1>

      {/* Constellation family: same projection, same graticule, no token. */}
      <figure className="mt-8 m-0">
        <div className="relative aspect-[5/4] w-full overflow-hidden rounded-3xl border border-border bg-surface-sunk">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <g className="text-border" aria-hidden="true">
              {[20, 40, 60, 80].map((n) => (
                <line key={`h${n}`} x1="0" y1={n} x2="100" y2={n} stroke="currentColor" strokeWidth="0.2" />
              ))}
              {[20, 40, 60, 80].map((n) => (
                <line key={`v${n}`} x1={n} y1="0" x2={n} y2="100" stroke="currentColor" strokeWidth="0.2" />
              ))}
            </g>

            {points.slice(1).map((p, i) => {
              const prev = points[i];
              if (!prev) return null;
              return (
                <line
                  key={`leg-${p.stop.spot.id}`}
                  x1={prev.x}
                  y1={prev.y}
                  x2={p.x}
                  y2={p.y}
                  stroke="currentColor"
                  strokeWidth="0.35"
                  strokeDasharray="1.5 1.5"
                  className="text-muted"
                />
              );
            })}

            {points.map((p) => (
              <circle
                key={p.stop.spot.id}
                cx={p.x}
                cy={p.y}
                // Size from the off-radar score, as on the home page. A
                // memorial site carries no score, so it takes the base size
                // rather than being drawn as if it had one (D25).
                r={p.stop.spot.sensitive ? 1.1 : 0.9 + (p.stop.spot.offRadar / 100) * 1.4}
                fill={p.stop.spot.sensitive ? "var(--muted)" : "var(--accent)"}
              />
            ))}
          </svg>
        </div>
        <figcaption className="mt-3 text-[11px] text-muted">
          true coordinates · dot size = off-radar score · dashed = est. travel
        </figcaption>
      </figure>

      <ol className="mt-8 space-y-1">
        {budget.stops.map((stop) => (
          <li
            key={stop.spot.id}
            className={
              stop.isSensitive
                ? "border-y border-border bg-background px-4 py-4"
                : "rounded-2xl border border-border bg-surface px-4 py-4"
            }
          >
            <div className="flex items-start gap-3">
              <p className="w-[52px] shrink-0 text-[11px] leading-tight tabular-nums text-muted">
                {clock(stop.arrivalMins)}
                <br />
                {clock(stop.departureMins)}
              </p>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/${locale}/spot/${stop.spot.slug}`}
                  className="font-display text-[15px] font-semibold leading-snug hover:underline"
                >
                  {stop.spot.name.en}
                </Link>
                <p className="mt-1 text-[11px] text-muted">{stop.spot.blurb.en}</p>
              </div>
              {stop.isSensitive ? null : (
                <span className="shrink-0 text-sm font-semibold tabular-nums text-muted">
                  {stop.spot.offRadar}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>

      {average.average !== null ? (
        <p className="mt-6 text-sm text-muted">
          {fill(dict.route.dayAverage, {
            average: average.average,
            band: bandLabel[offRadarBand(average.average)] ?? "",
          })}
          {average.scoredCount !== average.totalCount
            ? ` ${dict.route.sharedMemorialNote}`
            : ""}
        </p>
      ) : null}

      <p className="mt-4 text-[11px] leading-relaxed text-muted">
        {dict.route.estimateNote}
      </p>

      <Link
        href={`/${locale}/discover`}
        className="mt-8 inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-contrast"
      >
        {dict.route.sharedOpen}
      </Link>
    </article>
  );
}
