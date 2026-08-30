"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { PlacePicker } from "@/components/discover/PlacePicker";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Spot } from "@/lib/spots/schema";
import { RoutePane } from "@/components/route/RoutePane";
import { useRouteStops } from "@/components/route/useRouteStops";
import { useFilters } from "@/store/filters";

// mapbox-gl touches `window` at import time, so the map never server-renders.
const SpotMap = dynamic(
  () => import("@/components/map/SpotMap").then((m) => m.SpotMap),
  { ssr: false },
);

/**
 * The right pane's third state (D23). The route is never a page you navigate
 * to, because adding a stop from a spot page must not cost you the spot page.
 */
type Pane = "map" | "route";

export function DiscoverView({
  spots,
  locale,
  dict,
}: {
  spots: Spot[];
  locale: string;
  dict: Dictionary;
}) {
  // Only the map's selection survives the column's removal; the filter chips
  // and the sort now live in the picker, which is the only thing that lists.
  const { selectedId, hoveredId, setSelected, setHovered } = useFilters();

  const [picking, setPicking] = useState(false);
  const { stops } = useRouteStops();

  /**
   * Route wins the default once a stop exists, and also when there is no
   * Mapbox token — which is this repo's actual deployed state (D11). A map
   * pane that renders a placeholder is a worse default than a working route.
   */
  const hasToken = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
  const [pane, setPane] = useState<Pane | null>(null);
  const activePane: Pane = pane ?? (stops.length > 0 || !hasToken ? "route" : "map");

  return (
    /*
      One pane, full width (D45).

      `/discover` was a 26rem column of all 87 places beside a map that got what
      was left. The column was the reason the map built an 18,019px canvas
      (C37), the reason there was nowhere to put a search field, and — the
      user's words — the reason "you had to go all the way down just to find
      restaurants". Browsing lives in the picker now (D42), so the column had
      nothing left to do that the picker does not do better.

      What remains is the thing you came to build: the day, or the map of it.
    */
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
        {/*
          The way into browsing. It looks like a search field and behaves like a
          button, because what it opens IS the search field.
        */}
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="flex min-h-11 flex-1 items-center gap-3 rounded-full border border-border bg-surface px-4 text-left text-sm text-muted transition-colors hover:border-muted sm:max-w-sm"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M11 11l3.2 3.2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          {dict.filters.openPicker.replace("{count}", String(spots.length))}
        </button>

        <div
          className="ml-auto flex rounded-full border border-border p-0.5"
          role="group"
          aria-label={dict.filters.viewToggle}
        >
          {(["map", "route"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={activePane === mode}
              onClick={() => setPane(mode)}
              className={`min-h-9 rounded-full px-4 text-xs font-semibold transition-colors ${
                activePane === mode
                  ? "bg-accent text-accent-contrast"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {mode === "map" ? dict.route.tabMap : dict.route.tabRoute}
              {mode === "route" && stops.length > 0 ? ` ${stops.length}` : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-[62dvh] flex-1 flex-col p-5">
        {/*
          `relative` + `absolute inset-0`, not `h-full` (C41).

          The box is a flex item, so its height comes from `flex-grow` and its
          `height` property stays `auto` — and a percentage height against an
          indefinite parent resolves to auto, which for Mapbox's `height: 100%`
          div means **zero**. The pane measured 483px and the map inside it
          measured 0, so the tab worked and the map was simply invisible.

          Absolute positioning against a positioned ancestor sidesteps the
          question: the box is definite whatever the flex maths does.
        */}
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-border">
          {activePane === "route" ? (
            <div className="absolute inset-0 overflow-y-auto">
              <RoutePane candidates={spots} dict={dict} />
            </div>
          ) : (
            <div className="absolute inset-0">
              <SpotMap
                spots={spots}
                selectedId={selectedId}
                hoveredId={hoveredId}
                onSelect={setSelected}
                onHover={setHovered}
                missingTokenTitle={dict.map.missingTokenTitle}
                missingTokenBody={dict.map.missingTokenBody}
                legend={dict.categories}
                locale={locale}
                dict={dict}
              />
            </div>
          )}
        </div>
      </div>

      <PlacePicker
        spots={spots}
        dict={dict}
        open={picking}
        onClose={() => setPicking(false)}
      />
    </div>
  );
}
