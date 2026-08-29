import { Hero } from "@/components/home/Hero";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getAllSpots } from "@/lib/spots";

/**
 * A shell, and knowingly so.
 *
 * This page existed to state the old thesis in one screen — a constellation
 * sized by off-radar score, a rail of pairings, a picker for four cities. The
 * score and the pairings went in step 0; `CityPicks` went here, because
 * choosing between cities is not a decision this product offers any more.
 *
 * Step 9 of `specs/3-friends/plan.md` rebuilds it around the thing the product
 * is actually for: starting a night and getting other people to vote on it.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(isLocale(locale) ? locale : "en");

  const spots = [...getAllSpots()];

  return (
    <>
      <Hero
        spots={spots}
        locale={locale}
        dict={dict}
        sourcedCount={spots.filter((s) => s.sources.length > 0).length}
      />

    </>
  );
}
