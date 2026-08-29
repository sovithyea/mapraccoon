import type { Dictionary } from "@/i18n/get-dictionary";
import type { Spot } from "@/lib/spots/schema";

/**
 * Community-based tourism / conservation framing: where the visitor's money
 * actually goes. The brief's second conversion hook (D5).
 *
 * These blocks name real organisations. Getting an impact claim wrong is a
 * reputational problem for them, not just for us — see R4.
 */
export function CommunityImpact({
  community,
  dict,
}: {
  community: NonNullable<Spot["community"]>;
  dict: Dictionary;
}) {
  return (
    /*
      A full-width band with a gold rule, not a card in the prose column.
      Inside the text it reads as an aside; at 320px in the sidebar it is
      cramped. Full width makes it the third mechanic rather than a footnote.
      Gold appears nowhere else on the site, so the reader learns it means
      "this is about where the money goes" — and it never appears on a
      memorial page, where a ticket price is not an impact story (D25).
    */
    <section
      id="community"
      className="-mx-5 border-y border-border border-l-[3px] border-l-gold bg-surface-sunk px-5 py-5 sm:py-7"
    >
      <p className="eyebrow text-gold">{dict.community.heading}</p>

      <p className="mt-3 max-w-2xl font-display text-lg leading-[1.4] sm:text-xl">
        {community.impact.en}
      </p>

      <p className="mt-3 text-sm text-muted">
        {dict.community.runBy.replace("{name}", community.name)}
        {community.url ? (
          <>
            {" · "}
            <a
              href={community.url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-accent underline underline-offset-4"
            >
              {new URL(community.url).hostname}
            </a>
          </>
        ) : null}
      </p>
    </section>
  );
}
