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
    <section className="rounded-lg border border-border bg-surface-sunk p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-gold">
        {dict.community.heading}
      </p>

      <p className="mt-3 leading-relaxed">{community.impact.en}</p>

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
