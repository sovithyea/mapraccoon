import Link from "next/link";

import type { Dictionary } from "@/i18n/get-dictionary";
import { getCity } from "@/lib/spots/cities";
import type { Spot } from "@/lib/spots/schema";

export function CommunityRail({
  spots,
  locale,
  dict,
}: {
  spots: Spot[];
  locale: string;
  dict: Dictionary;
}) {
  return (
    <section className="border-t border-border py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl px-5">
        <div className="lg:flex lg:items-start lg:gap-14">
          <div className="lg:w-72 lg:shrink-0">
            <p className="eyebrow">{dict.communitySection.eyebrow}</p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              {dict.communitySection.heading}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {dict.communitySection.lead}
            </p>
          </div>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-0 lg:flex-1">
            {spots.map((spot) => {
              const city = getCity(spot.city);
              return (
                <li key={spot.id}>
                  <Link
                    href={`/${locale}/spot/${spot.slug}`}
                    className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5 transition-shadow hover:shadow-md"
                  >
                    <p className="text-xs" style={{ color: city.color }}>
                      {city.name}
                    </p>
                    <h3 className="mt-1 font-display text-lg font-semibold leading-snug">
                      {spot.name.en}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                      {spot.community?.impact.en}
                    </p>
                    <p className="mt-3 text-xs font-medium text-gold">
                      {dict.communitySection.runBy.replace(
                        "{name}",
                        spot.community?.name ?? "",
                      )}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
