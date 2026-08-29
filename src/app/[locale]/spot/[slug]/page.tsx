import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MiniMap } from "@/components/map/MiniMap";
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
          <OffRadarMeter score={spot.offRadar} showValue />
        </div>
        <p className="mt-1 text-xs text-muted">{dict.spot.offRadarHint}</p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="order-2 space-y-6 lg:order-1">
          {spot.description.en.split("\n\n").map((para, i) => (
            <p key={i} className="leading-relaxed">
              {para}
            </p>
          ))}

          {anchor && spot.pairedWith ? (
            <PairingCard
              anchor={anchor}
              hook={spot.pairedWith.hook}
              dict={dict}
              locale={locale}
            />
          ) : null}

          {spot.community ? (
            <CommunityImpact community={spot.community} dict={dict} />
          ) : null}
        </div>

        <aside className="order-1 space-y-6 lg:order-2">
          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
              {dict.spot.practical}
            </h2>
            <dl className="mt-3 space-y-3 text-sm">
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
          </section>

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
