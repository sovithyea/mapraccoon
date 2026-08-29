import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { VoteScreen } from "@/components/vote/VoteScreen";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { decodeBallot, resolveBallot } from "@/lib/vote/ballot";

/**
 * A ballot, opened from a link.
 *
 * `noindex` and dynamic: these URLs are user-generated, unbounded, and each one
 * is a shared secret. Nothing about them should be crawled or cached.
 *
 * The ballot decodes here on the server, so the page knows its candidates
 * without a round trip — but every vote it collects goes through /api/room,
 * which is the only thing holding a key.
 */
/*
  `noindex` and dynamic: these URLs are user-generated, unbounded, and each one
  is a shared secret. Nothing about them should be crawled or cached.

  It still gets Open Graph tags, because `noindex` stops search engines and does
  nothing to a chat app fetching a preview — and a preview is exactly what the
  five people in the group see before they tap.

  The copy is deliberately generic and does NOT decode the ballot. It could:
  the id carries the candidates and the page decodes them a few lines below. But
  naming the shortlist in the preview would hand it to whichever preview service
  fetched the link, cached on infrastructure nobody in the group chose. "Where
  are we going tonight?" gets them to tap, which is all the preview has to do.
*/
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(isLocale(locale) ? locale : "en");
  return {
    robots: { index: false, follow: false },
    title: dict.vote.shareTitle,
    description: dict.vote.shareDescription,
    openGraph: {
      title: dict.vote.shareTitle,
      description: dict.vote.shareDescription,
      /*
        Named explicitly. A child segment's `openGraph` REPLACES the parent's
        rather than merging into it, so defining a title here silently dropped
        the image the layout's `opengraph-image.tsx` contributes — on the two
        routes that are actually shared. Verified by reading the tags off the
        rendered page, which is the only way this is visible.

        The path, not a re-export: the image is prerendered once at
        /{locale}/opengraph-image, and giving these dynamic routes their own
        image file would make Satori run on every preview fetch.
      */
      images: [`/${locale}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.vote.shareTitle,
      description: dict.vote.shareDescription,
    },
  };
}
export const dynamic = "force-dynamic";

export default async function VotePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const ballot = decodeBallot(id);

  if (!ballot) {
    return (
      <section className="mx-auto w-full max-w-lg px-5 py-16">
        <p className="eyebrow">{dict.vote.eyebrow}</p>
        <h1 className="mt-3 font-display text-2xl font-bold">{dict.vote.badLink}</h1>
      </section>
    );
  }

  const resolved = resolveBallot(ballot);

  // Every candidate was a memorial site, or none survived in the seed file.
  if (resolved.candidates.length === 0) {
    return (
      <section className="mx-auto w-full max-w-lg px-5 py-16">
        <p className="eyebrow">{dict.vote.eyebrow}</p>
        <h1 className="mt-3 font-display text-2xl font-bold">{dict.vote.badLink}</h1>
      </section>
    );
  }

  return (
    <VoteScreen
      roomId={resolved.roomId}
      slot={resolved.slot}
      candidates={resolved.candidates}
      stops={resolved.stops}
      by={resolved.by}
      dict={dict}
      locale={locale}
    />
  );
}
