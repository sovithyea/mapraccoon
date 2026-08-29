import Link from "next/link";

import { OffRadarMeter } from "@/components/spot/OffRadarMeter";
import type { Dictionary } from "@/i18n/get-dictionary";
import { getCity } from "@/lib/spots/cities";
import type { Spot } from "@/lib/spots/schema";

export type Pairing = { hidden: Spot; anchor: Spot };

/**
 * The narrative-pairing rail. themapcambodia.com has an "off the beaten path"
 * scroller too — the difference is that every card here names the famous place
 * it replaces and why, which is the mechanic the brief is actually built on.
 */
export function PairingRail({
  pairings,
  locale,
  dict,
}: {
  pairings: Pairing[];
  locale: string;
  dict: Dictionary;
}) {
  return (
    <section className="border-t border-border bg-surface-sunk py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl px-5">
        <p className="eyebrow text-center">{dict.pairings.eyebrow}</p>
        <h2 className="mx-auto mt-3 max-w-2xl text-center font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {dict.pairings.heading}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-muted">
          {dict.pairings.lead}
        </p>
      </div>

      <ul className="rail mt-9 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 lg:px-[max(1.25rem,calc((100vw-72rem)/2))]">
        {pairings.map(({ hidden, anchor }) => {
          const city = getCity(hidden.city);
          return (
            <li
              key={hidden.id}
              className="w-[85vw] max-w-[26rem] shrink-0 snap-start sm:w-[26rem]"
            >
              <article className="flex h-full flex-col rounded-3xl border border-border bg-surface p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  {dict.pairings.insteadOf}{" "}
                  <Link
                    href={`/${locale}/spot/${anchor.slug}`}
                    className="underline decoration-border underline-offset-4 hover:text-foreground"
                  >
                    {anchor.name.en}
                  </Link>
                </p>

                <blockquote className="mt-4 flex-1 font-display text-lg leading-snug">
                  “{hidden.pairedWith?.hook.en}”
                </blockquote>

                <div className="mt-6 border-t border-border pt-4">
                  <p className="text-xs" style={{ color: city.ink }}>
                    {city.name}
                  </p>
                  <div className="mt-1 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-xl font-bold tracking-tight">
                        {hidden.name.en}
                      </p>
                      <div className="mt-1.5">
                        <OffRadarMeter score={hidden.offRadar} showValue />
                      </div>
                    </div>
                    <Link
                      href={`/${locale}/spot/${hidden.slug}`}
                      className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-contrast"
                    >
                      {dict.pairings.go}
                    </Link>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      <div className="mx-auto mt-6 flex w-full max-w-6xl justify-center px-5">
        <Link
          href={`/${locale}/discover`}
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:border-muted"
        >
          {dict.pairings.seeAll}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
