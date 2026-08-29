"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import { useMemo } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";

import { MapPlaceholder } from "@/components/map/MapPlaceholder";
import { categoryColor } from "@/components/ui/category-style";
import { CAMBODIA_VIEW, getCity } from "@/lib/spots/cities";
import type { CityId, Spot } from "@/lib/spots/schema";

const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export type SpotMapProps = {
  spots: readonly Spot[];
  city?: CityId | null;
  selectedId?: string | null;
  hoveredId?: string | null;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  missingTokenTitle: string;
  missingTokenBody: string;
  /** Overrides the computed view — used by the single-spot map on a detail page. */
  view?: { longitude: number; latitude: number; zoom: number };
  interactive?: boolean;
};

export function SpotMap({
  spots,
  city,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  missingTokenTitle,
  missingTokenBody,
  view,
  interactive = true,
}: SpotMapProps) {
  const initialView = useMemo(() => {
    if (view) return view;
    if (city) {
      const { center, zoom } = getCity(city);
      return { longitude: center[0], latitude: center[1], zoom };
    }
    return { ...CAMBODIA_VIEW };
  }, [view, city]);

  if (!token) {
    return <MapPlaceholder title={missingTokenTitle} body={missingTokenBody} />;
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

      {spots.map((spot) => {
        const emphasised = spot.id === selectedId || spot.id === hoveredId;
        const color = categoryColor[spot.categories[0] ?? "culture"];

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
