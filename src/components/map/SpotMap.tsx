"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import { useMemo } from "react";
import Link from "next/link";
import Map, { Marker, NavigationControl, Popup } from "react-map-gl/mapbox";

import { useNow } from "@/components/hooks/useNow";
import { isOpenAt } from "@/lib/hours/open";
import { getNeighbourhood } from "@/lib/spots/neighbourhoods";
import type { Dictionary } from "@/i18n/get-dictionary";

import { MapPlaceholder } from "@/components/map/MapPlaceholder";
import { groupColor, groupOrder } from "@/components/ui/category-style";
import { groupLabel, groupOf } from "@/lib/spots/categories";
import { PHNOM_PENH_VIEW } from "@/lib/spots/neighbourhoods";
import type { Category, Spot } from "@/lib/spots/schema";

const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export type SpotMapProps = {
  spots: readonly Spot[];
  selectedId?: string | null;
  hoveredId?: string | null;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  missingTokenTitle: string;
  missingTokenBody: string;
  /** Overrides the computed view — used by the single-spot map on a detail page. */
  view?: { longitude: number; latitude: number; zoom: number };
  interactive?: boolean;
  /** Localised category names. Omit to hide the pin legend. */
  legend?: Record<Category, string>;
  /**
   * Present on the browsable map, absent on the read-only one (a spot page's
   * own mini map, where a pin linking to the page you are on is a loop).
   */
  locale?: string;
  dict?: Dictionary;
};

export function SpotMap({
  spots,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  missingTokenTitle,
  missingTokenBody,
  view,
  interactive = true,
  legend,
  locale,
  dict,
}: SpotMapProps) {
  const at = useNow();
  const selected = useMemo(
    () => spots.find((s) => s.id === selectedId) ?? null,
    [spots, selectedId],
  );

  /**
   * Framed on what is actually plotted, not on a fixed centre and zoom.
   *
   * `PHNOM_PENH_VIEW` was a guess that happened to be close; it is still the
   * fallback for a map with fewer than two pins, where there are no bounds to
   * fit. With the whole dataset on screen the user asked for "the whole map of
   * the city", and the honest way to get that is to fit the venues rather than
   * to hand-tune a zoom until it looks right at one window size.
   */
  const initialView = useMemo(() => {
    if (view) return view;
    /*
      Framed on the venues, NOT on every pin. Choeung Ek is 15 km south of
      everything else, so fitting all 87 zoomed out until the city was a small
      cluster in the top third of the frame with most of the view given to
      farmland. C30 is the same fact biting the landing-page scatter.

      Every pin is still drawn and still reachable; the memorial simply starts
      outside the initial viewport instead of dictating it.
    */
    const framing = spots.filter((spot) => spot.sensitive === undefined);
    const forBounds = framing.length >= 2 ? framing : spots;
    if (forBounds.length < 2) return { ...PHNOM_PENH_VIEW };

    let west = Infinity;
    let south = Infinity;
    let east = -Infinity;
    let north = -Infinity;
    for (const spot of forBounds) {
      west = Math.min(west, spot.coords[0]);
      east = Math.max(east, spot.coords[0]);
      south = Math.min(south, spot.coords[1]);
      north = Math.max(north, spot.coords[1]);
    }

    return {
      bounds: [
        [west, south],
        [east, north],
      ] as [[number, number], [number, number]],
      fitBoundsOptions: { padding: 48 },
    };
  }, [view, spots]);

  if (!token) {
    // With exactly one spot in view the placeholder can carry its real
    // coordinates and an outbound link — useful to a traveller, where an
    // environment variable name was not.
    const only = spots.length === 1 ? spots[0] : undefined;
    return (
      <MapPlaceholder
        title={missingTokenTitle}
        body={missingTokenBody}
        coords={only?.coords}
      />
    );
  }

  return (
    <Map
      mapboxAccessToken={token}
      // `key` remounts the map when the framing changes, which is simpler and
      // less glitchy than imperatively flying between city bounds.
      key={
        "bounds" in initialView
          ? `b:${initialView.bounds.flat().join(",")}`
          : `v:${initialView.longitude},${initialView.latitude},${initialView.zoom}`
      }
      initialViewState={initialView}
      mapStyle="mapbox://styles/mapbox/outdoors-v12"
      interactive={interactive}
      style={{ width: "100%", height: "100%" }}
    >
      {interactive ? <NavigationControl position="top-right" /> : null}

      {/*
        Category colour lives only on these pins (D21), so the map carries the
        only legend for it.
      */}
      {interactive && legend ? (
        <div className="pointer-events-none absolute bottom-2 left-2 z-10 flex flex-wrap gap-x-3 gap-y-1 rounded-lg border border-border bg-surface/92 px-2.5 py-1.5 backdrop-blur-sm">
          {groupOrder.map((group) => (
            <span
              key={group}
              className="flex items-center gap-1.5 text-[11px] text-muted"
            >
              <span
                className="size-2 rounded-full"
                style={{ background: groupColor[group] }}
                aria-hidden="true"
              />
              {groupLabel[group]}
            </span>
          ))}
        </div>
      ) : null}

      {spots.map((spot) => {
        const emphasised = spot.id === selectedId || spot.id === hoveredId;
        // Pins colour by group, not by category — eighteen categories cannot each
        // have a hue without recreating the collision D21 measured.
        const color = groupColor[groupOf(spot.categories)];

        return (
          <Marker
            key={spot.id}
            longitude={spot.coords[0]}
            latitude={spot.coords[1]}
            anchor="center"
          >
            <button
              type="button"
              aria-label={spot.name.en}
              onClick={() => onSelect?.(spot.id)}
              onMouseEnter={() => onHover?.(spot.id)}
              onMouseLeave={() => onHover?.(null)}
              className="block cursor-pointer rounded-full border-2 border-white shadow transition-transform"
              style={{
                background: color,
                width: emphasised ? 20 : 12,
                height: emphasised ? 20 : 12,
              }}
            />
          </Marker>
        );
      })}

      {/*
        Pressing a pin opens the place, rather than only tinting it (D46).
        Selection alone was a dead end: it highlighted a dot and there was
        nothing further to press.

        A card first, then the page. Name, where, price and whether it is open
        answer most of why someone pressed; the link is there for the rest.
      */}
      {selected && locale && dict ? (
        <Popup
          longitude={selected.coords[0]}
          latitude={selected.coords[1]}
          anchor="bottom"
          offset={16}
          closeButton={false}
          /*
            `closeOnClick` defaults to true, and Mapbox counts a click on
            ANOTHER marker as an outside click — so selecting a second pin
            closed the popup instead of moving it, and the map read as if
            memorial pins simply did not respond. Closing is an explicit
            control instead.
          */
          closeOnClick={false}
          onClose={() => onSelect?.("")}
          className="mapraccoon-popup"
          maxWidth="260px"
        >
          <div className="min-w-[190px] p-1">
            <div className="flex items-start gap-2">
              <p className="min-w-0 flex-1 font-display text-sm font-bold leading-snug text-ink">
                {selected.name.en}
              </p>
              <button
                type="button"
                onClick={() => onSelect?.("")}
                aria-label={dict.picker.close}
                className="-mr-1 -mt-1 flex size-6 shrink-0 items-center justify-center rounded-full text-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {/*
              R9/D33: a memorial gets the facts and nothing else — no price
              row, no "open now" badge, no invitation. The same rule that keeps
              it out of the picker governs how it reads when it is shown.
            */}
            {selected.sensitive ? (
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                {getNeighbourhood(selected.neighbourhood).name}
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-muted">
                {getNeighbourhood(selected.neighbourhood).name}
                {" · "}
                {"$".repeat(selected.priceLevel)}
                {at && isOpenAt(selected.hours, at) === "open"
                  ? ` · ${dict.picker.openNow}`
                  : ""}
              </p>
            )}

            <Link
              href={`/${locale}/spot/${selected.slug}`}
              className="mt-2 inline-flex text-[11px] font-semibold text-accent underline underline-offset-4"
            >
              {dict.map.seeDetails} →
            </Link>
          </div>
        </Popup>
      ) : null}
    </Map>
  );
}
