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
export const metadata: Metadata = { robots: { index: false, follow: false } };
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
      by={resolved.by}
      dict={dict}
    />
  );
}
