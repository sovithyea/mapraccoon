import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MiniMap } from "@/components/map/MiniMap";
import { AddToDay } from "@/components/route/AddToDay";
import { CommunityImpact } from "@/components/spot/CommunityImpact";
import { OffRadarMeter } from "@/components/spot/OffRadarMeter";
import { PairingCard } from "@/components/spot/PairingCard";
import { SpotCard } from "@/components/spot/SpotCard";
import { buildableLocales, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getAllSpots, getPairedSpot, getSpotBySlug, getSpotsByCity } from "@/lib/spots";
import { getCity } from "@/lib/spots/cities";

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
  const city = getCity(spot.city);
  const anchor = getPairedSpot(spot);
  const nearby = getSpotsByCity(spot.city)
    .filter((s) => s.id !== spot.id)
    .sort((a, b) => b.offRadar - a.offRadar)
    .slice(0, 3);

  return (
    <article className="mx-auto w-full max-w-5xl px-5 py-8">
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
            <span
              className="size-2 rounded-full"
              style={{ background: city.ink }}
              aria-hidden="true"
            />
            {city.name}
          </Link>
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{spot.name.en}</h1>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          {spot.blurb.en}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <ul className="flex gap-1.5">
            {spot.categories.map((category) => (
              <li
                key={category}
                className="rounded-full border border-border px-2.5 py-1 text-xs text-muted"
              >
                {dict.categories[category]}
              </li>
            ))}
          </ul>
          <OffRadarMeter score={spot.offRadar} showValue sensitive={spot.sensitive} />
        </div>
        {spot.sensitive ? (
          /*
            R9/D25. A reader who has seen five scored pages reads a missing
            score as a data gap; stated, it is an editorial position, which is
            the truth. The absence is the point, so it is written down.
          */
          <p className="mt-3 border-y border-border py-3 text-sm leading-relaxed text-muted">
            {dict.spot.sensitiveNote}
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted">{dict.spot.offRadarHint}</p>
        )}
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
        {anchor && spot.pairedWith ? (
          <div className="order-1 lg:order-1 lg:col-start-1">
            <PairingCard
              anchor={anchor}
              hook={spot.pairedWith.hook}
              dict={dict}
              locale={locale}
            />
          </div>
        ) : null}

        <div className="order-3 space-y-6 lg:order-3 lg:col-start-1">
          {spot.description.en.split("\n\n").map((para, i) => (
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
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
              {dict.spot.practical}
            </h2>
            {/*
              C18: this caveat used to live only in the footer, at 12px in the
              last of four columns. The numbers that actually go stale are the
              fee and the hours, so the warning belongs against them (R1).
            */}
            <p className="mt-3 border-l-2 border-gold pl-3 text-xs leading-relaxed text-muted">
              {dict.spot.unverifiedCaveat}
            </p>

            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-muted">{dict.spot.bestTime}</dt>
                <dd>{spot.practical.bestTime.en}</dd>
              </div>
              <div>
                <dt className="text-muted">{dict.spot.entryFee}</dt>
                <dd>
                  {spot.practical.entryFeeUsd === 0
                    ? dict.spot.free
                    : `$${spot.practical.entryFeeUsd}`}
                </dd>
              </div>
              <div>
                <dt className="text-muted">{dict.spot.duration}</dt>
                <dd>{formatDuration(spot.practical.typicalDurationMins, dict)}</dd>
              </div>
            </dl>

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
