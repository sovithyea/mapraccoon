import { CityPicks } from "@/components/home/CityPicks";
import { CommunityRail } from "@/components/home/CommunityRail";
import { Hero } from "@/components/home/Hero";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { sortSpots } from "@/lib/scoring";
import { getAllSpots, getSpotsByCity } from "@/lib/spots";
import { cities } from "@/lib/spots/cities";
import type { CityId, Spot } from "@/lib/spots/schema";

/**
 * The landing page is on borrowed time.
 *
 * It was built to state the old thesis in one screen: a constellation sized by
 * off-radar score, a rail of pairings, community-run places. The score and the
 * pairings are gone (D28, D29), so what is left here is a shell that compiles
 * rather than a page that argues anything. Step 9 of `specs/3-friends/plan.md`
 * replaces it.
 *
 * Ordering is by name until the hours model lands and `open-now` becomes the
 * default (D28). Deliberately not a stand-in for the old behaviour.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(isLocale(locale) ? locale : "en");

  const spots = [...getAllSpots()];

  const byCity = Object.fromEntries(
    cities.map((city) => [city.id, sortSpots(getSpotsByCity(city.id), "name")]),
  ) as Record<CityId, Spot[]>;

  const counts = Object.fromEntries(
    cities.map((city) => [city.id, byCity[city.id]?.length ?? 0]),
  ) as Record<CityId, number>;

  const community = sortSpots(
    spots.filter((s) => s.community),
    "name",
  ).slice(0, 4);

  return (
    <>
      <Hero
        spots={spots}
        locale={locale}
        dict={dict}
        sourcedCount={spots.filter((s) => s.sources.length > 0).length}
      />

      <CityPicks byCity={byCity} counts={counts} locale={locale} dict={dict} />

      <div id="community" className="scroll-mt-20">
        <CommunityRail spots={community} locale={locale} dict={dict} />
      </div>
    </>
  );
}
