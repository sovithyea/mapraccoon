"use client";

import dynamic from "next/dynamic";

import type { Spot } from "@/lib/spots/schema";

const SpotMap = dynamic(
  () => import("@/components/map/SpotMap").then((m) => m.SpotMap),
  { ssr: false },
);

/** Single-spot map for a destination page: framed on the spot, no controls. */
export function MiniMap({
  spot,
  missingTokenTitle,
  missingTokenBody,
}: {
  spot: Spot;
  missingTokenTitle: string;
  missingTokenBody: string;
}) {
  return (
    <div className="h-64 overflow-hidden rounded-lg border border-border">
      <SpotMap
        spots={[spot]}
        selectedId={spot.id}
        view={{ longitude: spot.coords[0], latitude: spot.coords[1], zoom: 12 }}
        missingTokenTitle={missingTokenTitle}
        missingTokenBody={missingTokenBody}
      />
    </div>
  );
}
