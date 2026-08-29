import { CityPicks } from "@/components/home/CityPicks";
import { CommunityRail } from "@/components/home/CommunityRail";
import { Hero } from "@/components/home/Hero";
import { PairingRail, type Pairing } from "@/components/home/PairingRail";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { sortByOffRadar } from "@/lib/scoring";
import { getAllSpots, getPairedSpot, getSpotsByCity } from "@/lib/spots";
import { cities } from "@/lib/spots/cities";
import type { CityId, Spot } from "@/lib/spots/schema";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(isLocale(locale) ? locale : "en");

  const spots = [...getAllSpots()];

  // Off-radar order everywhere, including the picks. See D4.
  const byCity = Object.fromEntries(
    cities.map((city) => [city.id, sortByOffRadar(getSpotsByCity(city.id))]),
  ) as Record<CityId, Spot[]>;

  const counts = Object.fromEntries(
    cities.map((city) => [city.id, byCity[city.id]?.length ?? 0]),
  ) as Record<CityId, number>;

  const pairings: Pairing[] = sortByOffRadar(spots)
    .flatMap((hidden) => {
      const anchor = getPairedSpot(hidden);
      return anchor ? [{ hidden, anchor }] : [];
    })
    .slice(0, 8);

  const community = sortByOffRadar(spots.filter((s) => s.community)).slice(0, 4);

  return (
    <>
      <Hero
        spots={spots}
        locale={locale}
        dict={dict}
        sourcedCount={spots.filter((s) => s.sources.length > 0).length}
      />

      <CityPicks byCity={byCity} counts={counts} locale={locale} dict={dict} />

      <div id="pairings" className="scroll-mt-20">
        <PairingRail pairings={pairings} locale={locale} dict={dict} />
      </div>

      <div id="community" className="scroll-mt-20">
        <CommunityRail spots={community} locale={locale} dict={dict} />
      </div>
    </>
  );
}
