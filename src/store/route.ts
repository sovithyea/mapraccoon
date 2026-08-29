"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  DEFAULT_FRAME_END_MINS,
  DEFAULT_FRAME_START_MINS,
  DEFAULT_START_MINS,
  stopDwell,
  type DayFrame,
} from "@/lib/route/day";
import { estimateLeg } from "@/lib/route/estimate";
import { getSpotById } from "@/lib/spots";
import type { CityId, Spot } from "@/lib/spots/schema";

/**
 * The day under construction. Client-side only — Phase 2 has no backend (D1),
 * and persistence beyond localStorage is Phase 3.
 *
 * Only ids and dwell are stored, never whole spots: the seed file is the single
 * source of truth (D3), and a persisted copy of a spot would go stale the
 * moment its content was edited.
 */

export type StoredStop = { spotId: string; dwellMins: number };

/** Minutes past 17:00 the frame may be pushed to, via "run the day later". */
const MAX_FRAME_END_MINS = 22 * 60;

type RouteState = {
  stops: StoredStop[];
  /** The day is one city (D22 scope). Set by the first add, cleared when empty. */
  city: CityId | null;
  frame: DayFrame;

  add: (spot: Spot) => void;
  remove: (spotId: string) => void;
  move: (spotId: string, direction: -1 | 1) => void;
  setDwell: (spotId: string, dwellMins: number) => void;
  setStart: (startMins: number) => void;
  setFrameEnd: (endMins: number) => void;
  reverse: () => void;
  shortestDriving: () => void;
  clear: () => void;
};

const initialFrame: DayFrame = {
  start: DEFAULT_START_MINS,
  frameStart: DEFAULT_FRAME_START_MINS,
  frameEnd: DEFAULT_FRAME_END_MINS,
};

const resolve = (stops: readonly StoredStop[]): Spot[] =>
  stops.map((s) => getSpotById(s.spotId)).filter((s): s is Spot => s !== undefined);

/** Total travel minutes for an ordering — the thing shortestDriving minimises. */
export function travelMinutesFor(spots: readonly Spot[]): number {
  let total = 0;
  for (let i = 1; i < spots.length; i += 1) {
    const from = spots[i - 1];
    const to = spots[i];
    if (from && to) total += estimateLeg(from, to).minutes;
  }
  return total;
}

/**
 * Nearest-neighbour from the first stop, then a 2-opt pass. Exact TSP is
 * pointless here — a day is realistically under eight stops — and this is an
 * estimate over estimated legs either way (D22).
 *
 * The first stop is held fixed: it is where the traveller starts, and moving it
 * is a different decision from reordering the middle of the day.
 */
export function shortestDrivingOrder(spots: readonly Spot[]): Spot[] {
  if (spots.length < 3) return [...spots];

  const [first, ...rest] = spots;
  if (!first) return [...spots];

  const order: Spot[] = [first];
  const pool = [...rest];

  while (pool.length > 0) {
    const from = order[order.length - 1] as Spot;
    let bestIndex = 0;
    let bestMinutes = Infinity;

    pool.forEach((candidate, index) => {
      const minutes = estimateLeg(from, candidate).minutes;
      if (minutes < bestMinutes) {
        bestMinutes = minutes;
        bestIndex = index;
      }
    });

    order.push(pool.splice(bestIndex, 1)[0] as Spot);
  }

  // 2-opt, first improvement, never moving index 0.
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < order.length - 1; i += 1) {
      for (let j = i + 1; j < order.length; j += 1) {
        const candidate = [
          ...order.slice(0, i),
          ...order.slice(i, j + 1).reverse(),
          ...order.slice(j + 1),
        ];
        if (travelMinutesFor(candidate) < travelMinutesFor(order)) {
          order.splice(0, order.length, ...candidate);
          improved = true;
        }
      }
    }
  }

  return order;
}

/**
 * What a proposed reordering would cost or save, and whether it moves a
 * memorial site. D25: an optimiser that silently reshuffles a day containing a
 * killing site is the wrong kind of clever, so the UI has to be able to say so.
 */
export function describeReorder(
  before: readonly Spot[],
  after: readonly Spot[],
): { savedMins: number; movedSensitive: Spot[] } {
  const savedMins = travelMinutesFor(before) - travelMinutesFor(after);

  const movedSensitive = after.filter(
    (spot, index) => spot.sensitive !== undefined && before[index]?.id !== spot.id,
  );

  return { savedMins, movedSensitive };
}

const reindex = (spots: readonly Spot[], stops: readonly StoredStop[]): StoredStop[] =>
  spots.map((spot) => ({
    spotId: spot.id,
    dwellMins: stops.find((s) => s.spotId === spot.id)?.dwellMins ?? stopDwell(spot),
  }));

export const useRoute = create<RouteState>()(
  persist(
    (set, get) => ({
      stops: [],
      city: null,
      frame: initialFrame,

      add: (spot) =>
        set((state) => {
          if (state.stops.some((s) => s.spotId === spot.id)) return state;
          return {
            stops: [...state.stops, { spotId: spot.id, dwellMins: stopDwell(spot) }],
            city: state.city ?? spot.city,
          };
        }),

      remove: (spotId) =>
        set((state) => {
          const stops = state.stops.filter((s) => s.spotId !== spotId);
          return { stops, city: stops.length === 0 ? null : state.city };
        }),

      move: (spotId, direction) =>
        set((state) => {
          const index = state.stops.findIndex((s) => s.spotId === spotId);
          const target = index + direction;
          if (index === -1 || target < 0 || target >= state.stops.length) return state;

          const stops = [...state.stops];
          const moved = stops[index] as StoredStop;
          stops[index] = stops[target] as StoredStop;
          stops[target] = moved;
          return { stops };
        }),

      setDwell: (spotId, dwellMins) =>
        set((state) => ({
          stops: state.stops.map((s) =>
            s.spotId === spotId ? { ...s, dwellMins: Math.max(15, dwellMins) } : s,
          ),
        })),

      setStart: (startMins) =>
        set((state) => ({ frame: { ...state.frame, start: startMins } })),

      setFrameEnd: (endMins) =>
        set((state) => ({
          frame: {
            ...state.frame,
            frameEnd: Math.min(MAX_FRAME_END_MINS, Math.max(state.frame.start, endMins)),
          },
        })),

      reverse: () => set((state) => ({ stops: [...state.stops].reverse() })),

      shortestDriving: () => {
        const { stops } = get();
        const ordered = shortestDrivingOrder(resolve(stops));
        set({ stops: reindex(ordered, stops) });
      },

      clear: () => set({ stops: [], city: null, frame: initialFrame }),
    }),
    {
      name: "mapraccoon:day:v1",
      version: 1,
      partialize: (state) => ({ stops: state.stops, city: state.city, frame: state.frame }),
    },
  ),
);
