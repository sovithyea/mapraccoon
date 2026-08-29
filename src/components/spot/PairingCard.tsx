import Link from "next/link";

import { OffRadarMeter } from "@/components/spot/OffRadarMeter";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { LocalizedText, Spot } from "@/lib/spots/schema";

/**
 * The narrative pairing: the famous place this one replaces.
 *
 * One of the two mechanics the brief names as the actual conversion hook (D5),
 * so it is the page's widest measure and its largest non-h1 type — a band that
 * bleeds past the content column onto the sunk ground, not a card. It is the
 * only element on the page that breaks the card rhythm, deliberately.
 *
 * R9/D25: renders nothing when the anchor is a memorial. "Go here instead of
 * Choeung Ek" is the same failure the schema refinement catches from the other
 * end, and a per-spot schema cannot see across spots.
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
  if (anchor.sensitive) return null;

  return (
    <section className="-mx-5 border-y border-border bg-surface-sunk px-5 py-5 sm:py-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-accent">
            {dict.pairing.heading.replace("{name}", anchor.name.en)}
          </p>
          <p className="mt-3 font-display text-xl font-normal leading-[1.35] sm:text-2xl lg:text-[33px] lg:leading-[1.28]">
            &ldquo;{hook.en}&rdquo;
          </p>
        </div>

        <div className="shrink-0 lg:w-[210px]">
          <p className="text-[11px] text-muted">{dict.pairing.anchorLabel}</p>
          <p className="mt-0.5 font-medium">{anchor.name.en}</p>
          <div className="mt-1.5">
            <OffRadarMeter score={anchor.offRadar} showValue sensitive={anchor.sensitive} />
          </div>
          <Link
            href={`/${locale}/spot/${anchor.slug}`}
            className="mt-3 inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 text-sm hover:border-muted"
          >
            {dict.pairing.seeAnchor.replace("{name}", anchor.name.en)}
          </Link>
        </div>
      </div>
    </section>
  );
}
