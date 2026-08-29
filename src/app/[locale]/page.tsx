import { Hero, HowItWorks } from "@/components/home/Hero";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getAllSpots } from "@/lib/spots";

/**
 * The landing page, rebuilt around what the product now does.
 *
 * It used to state the old thesis in one screen: a constellation sized by
 * off-radar score, a rail of pairings, a picker for four cities. Those went
 * with D27/D28/D29 and what was left was scaffolding — a heading about
 * forty-two places across four cities above eighty-four places in one, and a
 * "choose where to start" grid holding a single card.
 *
 * Now: what it is, one button, and how the loop works, because someone opening
 * a shared link has never seen this and no single screen explains it alone.
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
      <HowItWorks dict={dict} />
    </>
  );
}
