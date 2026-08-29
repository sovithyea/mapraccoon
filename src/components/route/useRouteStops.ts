"use client";

import { useSyncExternalStore } from "react";

import { type RouteStop } from "@/lib/route/day";
import { getSpotById } from "@/lib/spots";
import { useRoute } from "@/store/route";

/**
 * Resolves persisted stop ids against the seed file, and reports whether the
 * store has rehydrated from localStorage yet.
 *
 * The `hydrated` flag matters: without it the server-matched first render shows
 * an empty day, and a returning traveller sees "a day with nothing in it" flash
 * over the day they actually have.
 *
 * useSyncExternalStore rather than an effect, because hydration is external
 * state that may already have finished before this component mounts — an effect
 * would both miss that case and set state during render-commit.
 */
const subscribeToHydration = (onChange: () => void): (() => void) =>
  useRoute.persist.onFinishHydration(onChange);

const hasHydrated = (): boolean => useRoute.persist.hasHydrated();

/** The server has no localStorage, so it always renders the pre-hydration view. */
const neverOnServer = (): boolean => false;

export function useRouteStops(): { stops: RouteStop[]; hydrated: boolean } {
  const hydrated = useSyncExternalStore(subscribeToHydration, hasHydrated, neverOnServer);
  const stored = useRoute((s) => s.stops);

  const stops: RouteStop[] = [];
  for (const entry of stored) {
    const spot = getSpotById(entry.spotId);
    // A spot removed from the seed file since the day was saved. Drop it rather
    // than rendering a hole — the same call decodeDay makes for shared links.
    if (spot) stops.push({ spot, dwellMins: entry.dwellMins });
  }

  return { stops, hydrated };
}
