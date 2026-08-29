"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import { SpotCard } from "@/components/spot/SpotCard";
import { groupOrder } from "@/components/ui/category-style";
import { groupLabel, inGroup } from "@/lib/spots/categories";
import type { Dictionary } from "@/i18n/get-dictionary";
import { sortSpots, type SortMode } from "@/lib/scoring";
import { neighbourhoods } from "@/lib/spots/neighbourhoods";
import type { Spot } from "@/lib/spots/schema";
import { useNow } from "@/components/hooks/useNow";
import { RoutePane } from "@/components/route/RoutePane";
import { useRouteStops } from "@/components/route/useRouteStops";
import { useFilters } from "@/store/filters";

// mapbox-gl touches `window` at import time, so the map never server-renders.
const SpotMap = dynamic(
  () => import("@/components/map/SpotMap").then((m) => m.SpotMap),
  { ssr: false },
);

const sortModes: SortMode[] = ["open-now", "price", "name"];

/** Display state, not filter state — deliberately not in the filter store. */
type MobileView = "list" | "map" | "route";

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
  const {
    city,
    categories,
    sort,
    selectedId,
    hoveredId,
    setCity,
    toggleCategory,
    setSort,
    setSelected,
    setHovered,
    reset,
  } = useFilters();

  const [view, setView] = useState<MobileView>("list");
  const { stops } = useRouteStops();
  const at = useNow();

  /**
   * Route wins the default once a stop exists, and also when there is no
   * Mapbox token — which is this repo's actual deployed state (D11). A map
   * pane that renders a placeholder is a worse default than a working route.
   */
  const hasToken = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
  const [pane, setPane] = useState<Pane | null>(null);
  const activePane: Pane = pane ?? (stops.length > 0 || !hasToken ? "route" : "map");

  /*
    Only the neighbourhoods that hold something. The enum has nine members and
    the dataset covers seven, so Koh Pich and Sen Sok were offering a filter
    that could only ever return "no places match these filters" — the footer had
    the same bug, from the same cause: a constant describing the content without
    reading it.
  */
  const occupied = useMemo(() => {
    const ids = new Set(spots.map((spot) => spot.neighbourhood));
    return neighbourhoods.filter((n) => ids.has(n.id));
  }, [spots]);

  const visible = useMemo(() => {
    const filtered = spots.filter((spot) => {
      if (city && spot.neighbourhood !== city) return false;
      if (categories.length && !categories.some((g) => inGroup(spot.categories, g)))
        return false;
      return true;
    });
    // `at` is undefined until after mount, so the first paint orders by name
    // and the client re-sorts once it has a clock. See useNow().
    return sortSpots(filtered, sort, { at: at ?? undefined });
  }, [spots, city, categories, sort, at]);

  const sortLabel: Record<SortMode, string> = {
    "open-now": dict.filters.sortOpenNow,
    price: dict.filters.sortPrice,
    name: dict.filters.sortName,
  };

  const count =
    visible.length === 1
      ? dict.home.resultCountOne
      : dict.home.resultCount.replace("{count}", String(visible.length));

  return (
    <div className="flex flex-1 flex-col lg:flex-row lg:overflow-hidden">
      <div className="flex flex-col border-border lg:w-[26rem] lg:shrink-0 lg:overflow-y-auto lg:border-r">
        <div className="space-y-3.5 border-b border-border p-5">
          {/*
            Each group is a single scrolling line on mobile. Wrapped, these
            three groups pushed the first result ~600px down the page.
          */}
          <Group label={dict.filters.city}>
            <Chip active={city === null} onClick={() => setCity(null)}>
              {dict.filters.allCities}
            </Chip>
            {occupied.map((c) => (
              <Chip key={c.id} active={city === c.id} onClick={() => setCity(c.id)}>
                {c.name}
              </Chip>
            ))}
          </Group>

          <Group label={dict.filters.category}>
            {/* Four group chips, not eighteen category chips (see categories.ts). */}
            {groupOrder.map((group) => (
              <Chip
                key={group}
                active={categories.includes(group)}
                onClick={() => toggleCategory(group)}
              >
                {groupLabel[group]}
              </Chip>
            ))}
          </Group>

          <Group label={dict.filters.sort}>
            {sortModes.map((mode) => (
              <Chip key={mode} active={sort === mode} onClick={() => setSort(mode)}>
                {sortLabel[mode]}
              </Chip>
            ))}
          </Group>

          <div className="flex items-center justify-between gap-3 pt-0.5">
            <p className="text-xs text-muted">{count}</p>

            {/*
              Without this the map sits below all 42 cards on a phone, which
              makes it effectively unreachable. Desktop shows both at once.
            */}
            <div
              className="flex rounded-full border border-border p-0.5 lg:hidden"
              role="group"
              aria-label={dict.filters.viewToggle}
            >
              {(["list", "map", "route"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={view === mode}
                  onClick={() => setView(mode)}
                  className={`min-h-9 rounded-full px-3.5 text-xs font-semibold transition-colors ${
                    view === mode
                      ? "bg-accent text-accent-contrast"
                      : "text-muted hover:text-foreground"
                  } ${
                    // Three buttons plus the result count do not fit legibly at
                    // 390. Below sm the route is reached through the dock bar
                    // instead — two ways in to one view, by width (D23).
                    mode === "route" ? "hidden sm:block" : ""
                  }`}
                >
                  {mode === "list"
                    ? dict.filters.viewList
                    : mode === "map"
                      ? dict.filters.viewMap
                      : dict.route.tabRoute}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={view === "list" ? undefined : "hidden lg:block"}>
          {visible.length === 0 ? (
            <div className="p-5">
              <p className="text-sm text-muted">{dict.home.empty}</p>
              <button
                type="button"
                onClick={reset}
                className="mt-3 min-h-11 text-sm text-accent underline underline-offset-4"
              >
                {dict.home.clearFilters}
              </button>
            </div>
          ) : (
            <ul className="space-y-3 p-5">
              {visible.map((spot) => (
                <SpotCard
                  key={spot.id}
                  spot={spot}
                  locale={locale}
                  active={spot.id === hoveredId || spot.id === selectedId}
                  onHover={setHovered}
                  onSelect={setSelected}
                  dict={dict}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      <div
        className={`flex-1 p-5 lg:block lg:h-auto ${
          view === "map" || view === "route" ? "min-h-[70vh]" : "hidden lg:block"
        }`}
      >
        {/* Tabs, not a third column: splitting the lg remainder in two costs
            the timeline its time column, and the map is absent by default
            with no token anyway (D23). */}
        <div
          className="mb-3 hidden rounded-full border border-border p-0.5 lg:inline-flex"
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

        <div className="h-full min-h-64 overflow-hidden rounded-lg border border-border">
          {/*
            Two independent visibility rules, not one: below `lg` the pane
            follows the mobile `view` toggle, and at `lg` it follows the pane
            tabs. Written out rather than composed, because the composed
            version was unreadable and this is the kind of thing that ships a
            layout bug nobody notices until the probe runs.
          */}
          <div
            className={`${view === "route" ? "block" : "hidden"} ${
              activePane === "route" ? "lg:block" : "lg:hidden"
            }`}
          >
            <RoutePane candidates={visible} dict={dict} />
          </div>

          <div
            className={`h-full ${view === "map" ? "block" : "hidden"} ${
              activePane === "map" ? "lg:block" : "lg:hidden"
            }`}
          >
            <SpotMap
              spots={visible}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onSelect={setSelected}
              onHover={setHovered}
              missingTokenTitle={dict.map.missingTokenTitle}
              missingTokenBody={dict.map.missingTokenBody}
              legend={dict.categories}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      {/* Scrolls on mobile, wraps from sm up. */}
      <div className="rail -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {children}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-sm transition-colors ${
        active
          ? "border-accent bg-accent text-accent-contrast"
          : "border-border bg-surface text-foreground hover:border-muted"
      }`}
    >
      {children}
    </button>
  );
}
