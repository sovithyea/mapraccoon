"use client";

import Link from "next/link";
import { useState } from "react";

import { projectCambodia } from "@/lib/geo/project";
import { neighbourhoods } from "@/lib/spots/neighbourhoods";
import type { Spot } from "@/lib/spots/schema";

/**
 * Every spot plotted at its real longitude/latitude inside the Cambodia
 * bounding box. Not an illustration of the country — a scatter of the actual
 * dataset, which is honest, needs no Mapbox token, and never fails to load.
 *
 * Dot size carries the off-radar score: the least-visited places are the
 * largest, which is the whole product in one graphic.
 */
export function Constellation({
  spots,
  locale,
  label,
  hint,
}: {
  spots: Spot[];
  locale: string;
  label: string;
  hint: string;
}) {
  const [active, setActive] = useState<Spot | null>(null);

  const project = projectCambodia;

  return (
    <figure className="m-0">
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl sm:aspect-[5/4] border border-border bg-surface-sunk">
        {/* Graticule — one line per degree, so the scatter reads as a map. */}
        <svg
          className="absolute inset-0 h-full w-full text-border"
          aria-hidden="true"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          {Array.from({ length: 5 }, (_, i) => (
            <line
              key={`v${i}`}
              x1={(i + 1) * (100 / 6)}
              y1="0"
              x2={(i + 1) * (100 / 6)}
              y2="100"
              stroke="currentColor"
              strokeWidth="0.15"
            />
          ))}
          {Array.from({ length: 4 }, (_, i) => (
            <line
              key={`h${i}`}
              x1="0"
              y1={(i + 1) * 20}
              x2="100"
              y2={(i + 1) * 20}
              stroke="currentColor"
              strokeWidth="0.15"
            />
          ))}
        </svg>

        {spots.map((spot) => {
          const { x, y } = project(spot.coords);
          // Uniform. Dot size used to carry the off-radar score — the biggest
          // marks were the least-visited places, which was the old product's
          // whole thesis in one graphic. The score is gone (D28), and sizing
          // by nothing is more honest than sizing by a leftover.
          const size = 10;
          const isActive = active?.id === spot.id;

          return (
            <Link
              key={spot.id}
              href={`/${locale}/spot/${spot.slug}`}
              onMouseEnter={() => setActive(spot)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(spot)}
              onBlur={() => setActive(null)}
              aria-label={spot.name.en}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-background transition-transform hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size,
                background: "var(--accent)",
                opacity: isActive ? 1 : 0.55 + (0 / 100) * 0.35,
              }}
            />
          );
        })}

        <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-xl border border-border bg-surface/92 p-3 backdrop-blur-sm sm:inset-x-4 sm:bottom-4">
          {active ? (
            <>
              <p className="line-clamp-1 font-display text-sm font-semibold">
                {active.name.en}
              </p>
              <p className="mt-0.5 line-clamp-1 text-xs text-muted">{active.blurb.en}</p>
            </>
          ) : (
            <>
              <p className="line-clamp-2 text-xs text-muted">{label}</p>
              <p className="mt-0.5 text-xs text-muted sm:hidden">{hint}</p>
            </>
          )}
        </div>
      </div>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {neighbourhoods.map((city) => (
          <span key={city.id} className="flex items-center gap-1.5 text-xs text-muted">
            <span
              className="size-2.5 rounded-full"
              aria-hidden="true"
            />
            {city.name}
          </span>
        ))}
        <span className="hidden text-xs text-muted sm:inline">· {hint}</span>
      </figcaption>
    </figure>
  );
}
