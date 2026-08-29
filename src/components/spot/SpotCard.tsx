"use client";

import Link from "next/link";

import { OffRadarMeter } from "@/components/spot/OffRadarMeter";
import { getCity } from "@/lib/spots/cities";
import type { Spot } from "@/lib/spots/schema";

export function SpotCard({
  spot,
  locale,
  active,
  onHover,
  onSelect,
}: {
  spot: Spot;
  locale: string;
  active?: boolean;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
}) {
  return (
    <li
      onMouseEnter={() => onHover?.(spot.id)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(spot.id)}
      onBlur={() => onHover?.(null)}
      className={`rounded-lg border bg-surface transition-colors ${
        active ? "border-accent" : "border-border hover:border-muted"
      }`}
    >
      <Link
        href={`/${locale}/spot/${spot.slug}`}
        onClick={() => onSelect?.(spot.id)}
        className="block p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-medium leading-snug">{spot.name.en}</h3>
          <span className="shrink-0 text-xs text-muted">{getCity(spot.city).name}</span>
        </div>

        <p className="mt-1.5 text-sm leading-relaxed text-muted">{spot.blurb.en}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <OffRadarMeter score={spot.offRadar} />
          <ul className="flex gap-1.5">
            {spot.categories.map((category) => (
              <li
                key={category}
                className="rounded-full border border-border px-2 py-0.5 text-[11px] capitalize text-muted"
              >
                {category}
              </li>
            ))}
          </ul>
        </div>

        {spot.community ? (
          <p className="mt-2 text-xs text-accent">Community-run</p>
        ) : null}
      </Link>
    </li>
  );
}
