import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SpotCard } from "@/components/spot/SpotCard";
import { buildableLocales, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { sortSpots } from "@/lib/scoring";
import { getSpotsByCity } from "@/lib/spots";
import { cities } from "@/lib/spots/cities";
import { cityIdSchema } from "@/lib/spots/schema";

export function generateStaticParams() {
  // Only cities that still have content. The other three left with D27, and
  // generating their pages would ship three empty routes. This whole route is
  // deleted in step 3 of specs/3-friends/plan.md — neighbourhoods are a filter,
  // not a destination — so this guard is deliberately the cheapest correct
  // thing rather than a design.
  return buildableLocales.flatMap((locale) =>
    cities
      .filter((city) => getSpotsByCity(city.id).length > 0)
      .map((city) => ({ locale, city: city.id })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const parsed = cityIdSchema.safeParse(city);
  if (!parsed.success) return {};
  const match = cities.find((c) => c.id === parsed.data);
  return { title: match?.name };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ locale: string; city: string }>;
}) {
  const { locale, city } = await params;
  const parsed = cityIdSchema.safeParse(city);
  if (!parsed.success) notFound();

  const match = cities.find((c) => c.id === parsed.data);
  if (!match) notFound();

  const dict = await getDictionary(isLocale(locale) ? locale : "en");
  const spots = sortSpots(getSpotsByCity(parsed.data), "name");

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8">
      <Link
        href={`/${locale}`}
        className="inline-flex min-h-11 items-center text-sm text-muted hover:text-foreground"
      >
        ← {dict.nav.backToDiscover}
      </Link>

      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {dict.city.heading.replace("{name}", match.name)}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {spots.length === 1
          ? dict.home.resultCountOne
          : dict.home.resultCount.replace("{count}", String(spots.length))}
        {" · "}
        {dict.filters.sortOffRadar.toLowerCase()}
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {spots.map((spot) => (
          <SpotCard key={spot.id} spot={spot} locale={locale} />
        ))}
      </ul>
    </div>
  );
}
