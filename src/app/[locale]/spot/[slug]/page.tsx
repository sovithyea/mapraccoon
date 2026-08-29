import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MiniMap } from "@/components/map/MiniMap";
import { AddToDay } from "@/components/route/AddToDay";
import { CommunityImpact } from "@/components/spot/CommunityImpact";
import { SpotCard } from "@/components/spot/SpotCard";
import { buildableLocales, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { sortSpots } from "@/lib/scoring";
import { getAllSpots, getSpotBySlug, getSpotsByNeighbourhood } from "@/lib/spots";
import { getNeighbourhood } from "@/lib/spots/neighbourhoods";

export function generateStaticParams() {
  return buildableLocales.flatMap((locale) =>
    getAllSpots().map((spot) => ({ locale, slug: spot.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const spot = getSpotBySlug(slug);
  if (!spot) return {};
  return { title: spot.name.en, description: spot.blurb.en };
}

export default async function SpotPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const spot = getSpotBySlug(slug);
  if (!spot) notFound();

  const dict = await getDictionary(isLocale(locale) ? locale : "en");
  const city = getNeighbourhood(spot.neighbourhood);
  // Was ordered by off-radar score, which is gone (D28). Name order until the
  // hours model lands and this becomes "what else is open near here".
  const nearby = sortSpots(
    getSpotsByNeighbourhood(spot.neighbourhood).filter((s) => s.id !== spot.id),
    "name",
  ).slice(0, 3);

  return (
    /*
      D25/R9. A memorial page is a different page, expressed structurally:
      a single narrow measure with nothing beside the text, so it is quiet
      because there is only one thing on it. The variant is driven by a
      schema field, never by a judgement made at render time.
    */
    <article
      className={
        spot.sensitive
          ? "mx-auto w-full max-w-[596px] px-5 py-8 [&_section]:rounded-none"
          : "mx-auto w-full max-w-5xl px-5 py-8"
      }
    >
      <Link
        href={`/${locale}`}
        className="inline-flex min-h-11 items-center text-sm text-muted hover:text-foreground"
      >
        ← {dict.nav.backToDiscover}
      </Link>

      <header className="mt-4">
        <p className="text-sm text-muted">
          <Link
            href={`/${locale}/city/${city.id}`}
            className="inline-flex min-h-9 items-center gap-2 hover:text-foreground"
          >
            {/* No city dot here: wayfinding decoration this page carries none of. */}
            {spot.sensitive ? null : (
              <span
                className="size-2 rounded-full"
                aria-hidden="true"
              />
            )}
            {city.name}
          </Link>
        </p>
        <h1
          className={
            spot.sensitive
              ? "mt-1 font-display text-[28px] font-normal leading-tight sm:text-[33px]"
              : "mt-1 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl"
          }
        >
          {spot.name.en}
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          {spot.blurb.en}
        </p>

        {/*
          Categories as neutral text, not outlined pills. Category colour is a
          map pin layer and nothing else (D21); as bordered chips they put two
          more shapes next to the city dot and the accent button, and they were
          never a filter here — that is /discover's job.
        */}
        <p className="mt-3 text-xs text-muted">
          {spot.categories.map((c) => dict.categories[c] ?? c).join(" · ")}
          {spot.community ? (
            <>
              {" · "}
              <a href="#community" className="text-gold underline underline-offset-4">
                community-run ↓
              </a>
            </>
          ) : null}
        </p>

        {spot.sensitive ? (
          /*
            R9/D25. A reader who has seen five scored pages reads a missing
            score as a data gap; stated, it is an editorial position, which is
            the truth. The absence is the point, so it is written down.
          */
          <p className="mt-3 border-y border-border py-3 text-sm leading-relaxed text-muted">
            {dict.spot.sensitiveNote}
          </p>
        ) : null}
      </header>

      {/*
        Reading order, fixed. `order-1` on the whole aside put practical info
        first but dragged the map and the sources list above the pairing with
        it, so a phone reader met the product's central mechanic fifth. The
        aside is split instead: the pairing and the practical card come early,
        the reference material stays late.

        Final order on a phone: name → blurb → score → pairing → practical →
        description → community → map → sources.
      */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">

        <div className="order-3 space-y-6 lg:order-3 lg:col-start-1">
          {/* Optional now — most venues ship on a blurb alone (D27 note in the schema). */}
          {spot.description?.en.split("\n\n").map((para, i) => (
            <p key={i} className="leading-relaxed">
              {para}
            </p>
          ))}

          {spot.community ? (
            <CommunityImpact community={spot.community} dict={dict} />
          ) : null}
        </div>

        {/* Practical comes early — it is the reason to keep reading. */}
        <aside className="order-2 lg:order-2 lg:col-start-2 lg:row-start-1">
          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="eyebrow">
              {spot.sensitive ? dict.spot.visiting : dict.spot.practical}
            </h2>
            {/*
              C18: this caveat used to live only in the footer, at 12px in the
              last of four columns. The numbers that actually go stale are the
              fee and the hours, so the warning belongs against them (R1).

              The gold rule ties it to provenance — except on a memorial page,
              which carries no gold at all. Gold means "where your money goes",
              and a $5 museum ticket is not a community-impact story (D25).
              There the caveat also moves below the rows: quieter, and the
              rows are what a visitor came for.
            */}
            {spot.sensitive ? null : (
              <p className="mt-3 border-l-2 border-gold pl-3 text-xs leading-relaxed text-muted">
                {dict.spot.unverifiedCaveat}
              </p>
            )}

            {/*
              Three across below `lg`, stacked inside the 320px aside above it.
              "Morning / Free / 1.5 hr" reads in one glance where the stacked
              list takes three. Same DOM in both; one grid class.
            */}
            <dl className="mt-4 grid grid-cols-3 gap-3 text-sm lg:grid-cols-1 lg:gap-0 lg:space-y-3">
              <div>
                <dt className="text-[11px] text-muted">{dict.spot.priceLevel}</dt>
                <dd className="mt-0.5 leading-snug">{"$".repeat(spot.priceLevel)}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted">{dict.spot.lastVerified}</dt>
                <dd className="mt-0.5 leading-snug tabular-nums">{spot.lastVerified}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted">{dict.spot.duration}</dt>
                <dd className="mt-0.5 leading-snug">
                  {formatDuration(spot.practical.typicalDurationMins, dict)}
                </dd>
              </div>
            </dl>

            {spot.sensitive ? (
              <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted">
                {dict.spot.unverifiedCaveat}
              </p>
            ) : null}

            {/*
              The practical card is where the planning decision happens, so the
              add affordance lives here rather than in the header (D23/D24).
            */}
            <AddToDay spot={spot} dict={dict} className="mt-4" />
          </section>

        </aside>

        {/*
          Reference material, deliberately last on a phone. Flipping the whole
          aside used to drag these above the pairing, which is what put the
          product's central mechanic fifth in the reading order.
        */}
        <aside className="order-4 space-y-6 lg:order-4 lg:col-start-2 lg:row-start-2">
          <section>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              {dict.spot.onTheMap}
            </h2>
            <MiniMap
              spot={spot}
              missingTokenTitle={dict.map.missingTokenTitle}
              missingTokenBody={dict.map.missingTokenBody}
            />
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
              {dict.spot.sources}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {dict.spot.sourcesHint}
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {spot.sources.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex min-h-9 items-center text-accent underline underline-offset-4"
                  >
                    {new URL(url).hostname}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {nearby.length ? (
        <section className="mt-12">
          <h2 className="mb-4 font-display text-xl font-bold tracking-tight">
            {dict.spot.nearby.replace("{city}", city.name)}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {nearby.map((s) => (
              <SpotCard key={s.id} spot={s} locale={locale} />
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

function formatDuration(
  mins: number,
  dict: Awaited<ReturnType<typeof getDictionary>>,
): string {
  if (mins < 60) return dict.spot.minutes.replace("{count}", String(mins));
  const hours = Math.round((mins / 60) * 10) / 10;
  return dict.spot.hours.replace("{count}", String(hours));
}
