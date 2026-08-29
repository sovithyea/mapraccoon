"use client";

import Link from "next/link";
import { useState } from "react";

import type { Dictionary } from "@/i18n/get-dictionary";
import { cities } from "@/lib/spots/cities";
import type { CityId, Spot } from "@/lib/spots/schema";

/**
 * City chip tabs over per-city picks — the pattern themapcambodia.com uses for
 * its destination picks, with our inversion: the list is off-radar first, so
 * the four shown are the four least-visited places in that city.
 */
export function CityPicks({
  byCity,
  counts,
  locale,
  dict,
}: {
  byCity: Record<CityId, Spot[]>;
  counts: Record<CityId, number>;
  locale: string;
  dict: Dictionary;
}) {
  const [activeId, setActiveId] = useState<CityId>("siem-reap");
  const active = cities.find((c) => c.id === activeId) ?? cities[0]!;
  const picks = byCity[activeId] ?? [];
  const [lead, ...rest] = picks;

  return (
    <section className="border-t border-border py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl px-5">
        <p className="eyebrow text-center">{dict.picks.eyebrow}</p>
        <h2 className="mx-auto mt-3 max-w-2xl text-center font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {dict.picks.heading}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-muted">
          {dict.picks.lead}
        </p>

        <div
          className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2.5"
          role="group"
          aria-label={dict.picks.chooseCity}
        >
          {cities.map((city) => {
            const on = city.id === activeId;
            return (
              <button
                key={city.id}
                type="button"
                aria-pressed={on}
                onClick={() => setActiveId(city.id)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  on
                    ? "text-accent-contrast shadow-sm"
                    : "border border-border bg-surface text-foreground hover:border-muted"
                }`}
                style={on ? { background: city.fill } : undefined}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: on ? "rgba(255,255,255,0.85)" : city.ink }}
                  aria-hidden="true"
                />
                {city.name}
              </button>
            );
          })}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
          {lead ? (
            <Link
              href={`/${locale}/spot/${lead.slug}`}
              className="group relative order-2 flex min-h-[19rem] flex-col justify-end overflow-hidden rounded-3xl p-6 sm:p-7 text-white lg:order-1 lg:min-h-[28rem]"
              style={{ background: active.fill }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 -top-32 size-[26rem] rounded-full border border-white/15"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 -top-16 size-[18rem] rounded-full border border-white/15"
              />

              <p className="relative flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                <span className="rounded bg-white/20 px-1.5 py-0.5 font-display text-[13px] tracking-normal text-white">
                  01
                </span>
                {active.tagline}
              </p>
              <h3 className="relative mt-3 max-w-lg font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
                {lead.name.en}
              </h3>
              <p className="relative mt-4 max-w-md text-[15px] leading-relaxed text-white/80">
                {lead.blurb.en}
              </p>
              <div className="relative mt-5 flex flex-wrap gap-2">
                {lead.categories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium ring-1 ring-white/20"
                  >
                    {dict.categories[category]}
                  </span>
                ))}
                {lead.community ? (
                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium ring-1 ring-white/20">
                    {dict.spot.communityRun}
                  </span>
                ) : null}
              </div>
              <span className="relative mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-forest-deep">
                {dict.map.viewDetails}
                <span aria-hidden="true">→</span>
              </span>
            </Link>
          ) : null}

          <div className="order-1 flex flex-col rounded-3xl border border-border bg-surface p-4 lg:order-2">
            <h3 className="px-2 pt-2 font-display text-xl font-bold tracking-tight">
              {active.name}
            </h3>
            <p className="mt-1 px-2 text-sm text-muted">{dict.filters.sortOffRadar}</p>

            <ul className="mt-4 flex flex-1 flex-col gap-2">
              {rest.slice(0, 4).map((spot, i) => (
                <li key={spot.id} className="min-w-0 flex-1">
                  <Link
                    href={`/${locale}/spot/${spot.slug}`}
                    className="group flex h-full min-w-0 items-center gap-3 rounded-2xl border border-border p-3 transition-shadow hover:shadow-md"
                  >
                    <span
                      className="flex size-12 shrink-0 items-center justify-center rounded-xl border font-display text-base font-bold sm:size-14"
                      style={{
                        color: active.ink,
                        borderColor: active.ink,
                        background: "var(--surface-sunk)",
                      }}
                      aria-hidden="true"
                    >
                      {String(i + 2).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block line-clamp-1 font-display text-[15px] font-semibold">
                        {spot.name.en}
                      </span>
                      <span className="mt-1 block line-clamp-1 text-xs text-muted">
                        {spot.blurb.en}
                      </span>
                      <span className="mt-1.5 block">
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              href={`/${locale}/city/${active.id}`}
              className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: active.fill }}
            >
              {dict.picks.seeAll
                .replace("{count}", String(counts[activeId] ?? 0))
                .replace("{city}", active.name)}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
