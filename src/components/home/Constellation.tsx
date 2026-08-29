"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { boundsOf, projectInto } from "@/lib/geo/project";
import { getNeighbourhood } from "@/lib/spots/neighbourhoods";
import type { Spot } from "@/lib/spots/schema";

/**
 * Every place plotted at its real longitude and latitude. Not an illustration —
 * a scatter of the actual dataset, which is honest, needs no Mapbox token, and
 * never fails to load.
 *
 * Framed on the data rather than on a fixed box (see `boundsOf`). Framed on
 * Cambodia, as it was until D27 landed, all 84 dots stacked inside one percent
 * of the width and the panel rendered as an empty grid.
 *
 * The legend below it used to be nine neighbourhoods each with a colour chip.
 * The chips had carried city colour, which D27 removed, so they had been
 * painting `background: undefined` — nine invisible circles under a caption
 * reading "colour marks the base city". Neighbourhood is a text label now, and
 * the label belongs on the plot where it orients you.
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

  const { points, areas } = useMemo(() => {
    /*
      Memorials are not dots on the going-out map (R9, D33).

      They stay in the dataset, in the list and on their own page — D33 is
      explicit about that. What they are not is a mark in the graphic sitting
      under "let's finally plan an actual hangout": that is the product's voice
      applied to a site of mass killing, which is the thing hard rule 5 forbids.

      It was also framing the plot. Choeung Ek is five kilometres south of
      everything else, so fitting the frame around it pushed all eighty-two
      venues into the top half and left one lone dot in the empty bottom.
      `constellation.test.ts` is what holds this, not this comment.
    */
    const plotted = spots.filter((spot) => !spot.sensitive);
    const project = projectInto(boundsOf(plotted.map((s) => s.coords)));

    // One label per neighbourhood, at the mean of its places. Below three it is
    // a label pointing at one dot, which is noise rather than orientation.
    const groups = new Map<string, Spot[]>();
    for (const spot of plotted) {
      const list = groups.get(spot.neighbourhood);
      if (list) list.push(spot);
      else groups.set(spot.neighbourhood, [spot]);
    }

    const areas = [...groups.entries()]
      .filter(([, list]) => list.length >= 3)
      .map(([id, list]) => ({
        id,
        name: getNeighbourhood(list[0]!.neighbourhood).name,
        ...project([
          list.reduce((sum, s) => sum + s.coords[0], 0) / list.length,
          list.reduce((sum, s) => sum + s.coords[1], 0) / list.length,
        ]),
      }))
      .sort((a, b) => a.y - b.y);

    // Daun Penh and Riverside are three percent apart and their labels landed
    // on top of each other, which is worse than no label at all. One pass down
    // the list pushing each label clear of the one above: the dots stay at
    // their real position, only the text moves, and it moves the minimum.
    const GAP = 6.5;
    for (let i = 1; i < areas.length; i += 1) {
      const above = areas[i - 1]!;
      const here = areas[i]!;
      if (here.y - above.y < GAP) here.y = above.y + GAP;
    }

    return { points: plotted.map((spot) => ({ spot, ...project(spot.coords) })), areas };
  }, [spots]);

  return (
    <figure className="m-0">
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-border bg-surface-sunk">
        {/* Graticule, so the scatter reads as a plot rather than a pattern. */}
        <svg
          className="absolute inset-0 h-full w-full text-border"
          aria-hidden="true"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <line
              key={`v${i}`}
              x1={i * (100 / 6)}
              y1="0"
              x2={i * (100 / 6)}
              y2="100"
              stroke="currentColor"
              strokeWidth="0.15"
            />
          ))}
          {[1, 2, 3, 4, 5].map((i) => (
            <line
              key={`h${i}`}
              x1="0"
              y1={i * (100 / 6)}
              x2="100"
              y2={i * (100 / 6)}
              stroke="currentColor"
              strokeWidth="0.15"
            />
          ))}
        </svg>

        {/* Under the dots, deliberately: orientation, not content. */}
        {areas.map((area) => (
          <span
            key={area.id}
            aria-hidden="true"
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.14em] text-muted/55"
            style={{ left: `${area.x}%`, top: `${area.y}%` }}
          >
            {area.name}
          </span>
        ))}

        {points.map(({ spot, x, y }) => {
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
              className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-1 ring-background transition-transform hover:scale-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                opacity: isActive ? 1 : 0.6,
                transform: isActive ? "translate(-50%,-50%) scale(1.6)" : undefined,
              }}
            />
          );
        })}

      </div>

      {/*
        Below the plot, not floating over it. Overlaid it covered the bottom
        thirteen percent of the frame, which is where the southernmost place in
        the dataset sits — a dot you could not see or click, hidden by the
        caption describing it.

        Fixed height so hovering a dot does not shift the page under the cursor.
      */}
      <figcaption className="mt-3 flex h-11 flex-col justify-center">
        {active ? (
          <>
            <p className="flex items-baseline justify-between gap-3">
              <span className="line-clamp-1 font-display text-sm font-semibold">
                {active.name.en}
              </span>
              <span className="shrink-0 text-xs text-muted">
                {getNeighbourhood(active.neighbourhood).name}
              </span>
            </p>
            <p className="line-clamp-1 text-xs text-muted">{active.blurb.en}</p>
          </>
        ) : (
          <>
            <p className="line-clamp-1 text-sm">
              {label.replaceAll("{count}", String(points.length))}
            </p>
            <p className="text-xs text-muted">{hint}</p>
          </>
        )}
      </figcaption>
    </figure>
  );
}
