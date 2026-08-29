import type { Metadata } from "next";

import { DiscoverView } from "@/components/DiscoverView";
import { buildableLocales, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getAllSpots } from "@/lib/spots";

export function generateStaticParams() {
  return buildableLocales.map((locale) => ({ locale }));
}

export const metadata: Metadata = { title: "Discover" };

export default async function DiscoverPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(isLocale(locale) ? locale : "en");

  return (
    <>
      <section className="border-b border-border px-5 py-6 sm:py-8">
        <h1 className="max-w-2xl font-display text-2xl font-bold leading-tight tracking-tight sm:text-4xl">
          {dict.home.heading}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          {dict.home.intro}
        </p>
      </section>

      <DiscoverView spots={[...getAllSpots()]} locale={locale} dict={dict} />
    </>
  );
}
