import Link from "next/link";

import { OffRadarMeter } from "@/components/spot/OffRadarMeter";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { LocalizedText, Spot } from "@/lib/spots/schema";

/**
 * The narrative pairing — "tired of Angkor Wat crowds? try this". One of the
 * two mechanics the brief names as the actual conversion hook (D5), so it is a
 * block on the page rather than a tag in a list.
 */
export function PairingCard({
  anchor,
  hook,
  dict,
  locale,
}: {
  anchor: Spot;
  hook: LocalizedText;
  dict: Dictionary;
  locale: string;
}) {
  return (
    <section className="rounded-lg border border-accent/40 bg-surface p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-accent">
        {dict.pairing.heading}
      </p>

      <p className="mt-3 text-base leading-relaxed">{hook.en}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div>
          <p className="text-xs text-muted">{dict.pairing.anchorLabel}</p>
          <p className="font-medium">{anchor.name.en}</p>
          <div className="mt-1.5">
            <OffRadarMeter score={anchor.offRadar} />
          </div>
        </div>

        <Link
          href={`/${locale}/spot/${anchor.slug}`}
          className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-muted"
        >
          {dict.pairing.seeAnchor.replace("{name}", anchor.name.en)}
        </Link>
      </div>
    </section>
  );
}
