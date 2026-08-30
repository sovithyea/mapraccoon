"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  GREEN,
  LAKES,
  ROADS_MAJOR,
  ROADS_MINOR,
  WATER_INNER,
  WATER_OUTER,
  type Ring,
} from "@/data/basemap";
import { boundsOf, projectInto } from "@/lib/geo/project";
import { getNeighbourhood } from "@/lib/spots/neighbourhoods";
import { plottableSpots } from "@/lib/spots/plottable";
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

  const { points, areas, base } = useMemo(() => {
    // Memorials are not dots on a going-out map — see `plottableSpots`, which
    // is where that rule lives now that two surfaces need it. Excluding
    // Choeung Ek also stops one place five kilometres south of everything else
    // from framing the whole plot.
    const plotted = plottableSpots(spots);
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

    /**
     * The rivers, through the same projection as the dots.
     *
     * That is the whole reason the geometry is stored as raw `[lon, lat]`
     * rather than as pre-baked path data: `boundsOf` frames on whatever is
     * actually plotted, so a frame that moves when the dataset changes moves
     * the water with it. Baked coordinates would silently slide out of
     * register the first time a venue was added outside the current frame.
     *
     * Outer rings and islands go into ONE path so `fill-rule: evenodd` can cut
     * the islands out. Two paths would paint Koh Pich over the channel either
     * side of it instead of through it.
     */
    const path = (r: Ring, close: boolean) =>
      r
        .map((c, i) => {
          const { x, y } = project(c);
          return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join("") + (close ? "Z" : "");

    const rings = (list: readonly Ring[]) => list.map((r) => path(r, true)).join("");
    const lines = (list: readonly Ring[]) => list.map((r) => path(r, false)).join("");

    const base = {
      // One path so `fill-rule: evenodd` can cut the islands out. Two paths
      // would paint Koh Pich over the channel either side of it.
      river: rings([...WATER_OUTER, ...WATER_INNER]),
      lakes: rings(LAKES),
      green: rings(GREEN),
      roadsMajor: lines(ROADS_MAJOR),
      roadsMinor: lines(ROADS_MINOR),
    };

    return { points: plotted.map((spot) => ({ spot, ...project(spot.coords) })), areas, base };
  }, [spots]);

  return (
    <figure className="m-0">
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-border bg-surface-sunk">
        {/*
          The rivers, replacing the graticule that used to sit here.

          The grid was there "so the scatter reads as a plot rather than a
          pattern", and it did that job badly — the panel read as an empty
          chart with dots on it, which is what the user called it. The
          Chaktomuk confluence does the same job properly: it is the shape that
          makes Phnom Penh recognisable, and it explains the dots. Riverside
          runs along the water, Chroy Changvar is the cluster across it, and
          neither is legible without this.

          `preserveAspectRatio="none"` is safe because `boundsOf` returns a
          SQUARE frame and the container is `aspect-square` — the scale is the
          same on both axes, so nothing is stretched.
        */}
        <svg
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          {/*
            Drawn in the order a real map is: ground cover, then water, then
            the road network on top. Every layer takes its colour from a token
            via `currentColor`, so all four palettes and both appearances are
            correct without a single new colour role entering the system (D21).
          */}
          <path d={base.green} className="text-brand" fill="currentColor" fillOpacity="0.11" />

          <g className="text-brand">
            <path
              d={base.river}
              fillRule="evenodd"
              fill="currentColor"
              fillOpacity="0.22"
              stroke="currentColor"
              strokeOpacity="0.45"
              strokeWidth="0.25"
            />
            <path d={base.lakes} fill="currentColor" fillOpacity="0.22" />
          </g>

          {/*
            Roads are the layer that turns water and parks into a city. Two
            weights only — a hierarchy finer than "big road / other road" is
            unreadable at this size and costs bundle for nothing.
          */}
          <g
            className="text-muted"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={base.roadsMinor} strokeWidth="0.18" strokeOpacity="0.28" />
            <path d={base.roadsMajor} strokeWidth="0.32" strokeOpacity="0.45" />
          </g>
        </svg>

        {/* Under the dots, deliberately: orientation, not content. */}
        {areas.map((area) => (
          <span
            key={area.id}
            aria-hidden="true"
            /*
              Full `--muted`, not `--muted/55`. At 55% these measured 2.25:1
              against the panel — the tint that made them sit behind the dots
              was the tint that made them unreadable, and 9px uppercase gets no
              large-text exemption.
            */
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.14em] text-muted"
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

        {/*
          ODbL attribution. Required wherever this geometry is drawn, so it
          lives with the drawing rather than in a footer someone may reuse the
          component without.
        */}
        <span className="pointer-events-none absolute bottom-1.5 right-2 text-[9px] text-muted/70">
          © OpenStreetMap
        </span>
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
