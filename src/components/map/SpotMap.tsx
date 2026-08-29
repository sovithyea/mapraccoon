"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import { useMemo } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";

import { MapPlaceholder } from "@/components/map/MapPlaceholder";
import { groupColor, groupOrder } from "@/components/ui/category-style";
import { groupLabel, groupOf } from "@/lib/spots/categories";
import { PHNOM_PENH_VIEW } from "@/lib/spots/neighbourhoods";
import type { Category, NeighbourhoodId, Spot } from "@/lib/spots/schema";

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
}: SpotMapProps) {
  const initialView = useMemo(() => {
    if (view) return view;
    return { ...PHNOM_PENH_VIEW };
  }, [view]);

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
      key={`${initialView.longitude},${initialView.latitude},${initialView.zoom}`}
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
    </Map>
  );
}
