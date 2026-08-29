"use client";

import { create } from "zustand";

import type { SortMode } from "@/lib/scoring";
import type { CategoryGroup } from "@/lib/spots/categories";
import type { NeighbourhoodId } from "@/lib/spots/schema";

type FilterState = {
  city: NeighbourhoodId | null;
  categories: CategoryGroup[];
  sort: SortMode;
  /** Shared between the list and the map so hover/selection stay in step. */
  selectedId: string | null;
  hoveredId: string | null;

  setCity: (city: NeighbourhoodId | null) => void;
  toggleCategory: (category: CategoryGroup) => void;
  setSort: (sort: SortMode) => void;
  setSelected: (id: string | null) => void;
  setHovered: (id: string | null) => void;
  reset: () => void;
};

const initial = {
  city: null,
  categories: [] as CategoryGroup[],
  /**
   * The default, and the reversal that defines this phase.
   *
   * It was "off-radar", described in CLAUDE.md as "the product, not a
   * preference" and in INTERFACES.md as something that must never change. It
   * is now "open-now": it is 7pm on a Thursday and the useful question is what
   * is actually open, not what is obscure (D28).
   */
  sort: "open-now" as SortMode,
  selectedId: null,
  hoveredId: null,
};

export const useFilters = create<FilterState>((set) => ({
  ...initial,
  setCity: (city) => set({ city, selectedId: null }),
  toggleCategory: (category) =>
    set((state) => ({
      categories: state.categories.includes(category)
        ? state.categories.filter((c) => c !== category)
        : [...state.categories, category],
      selectedId: null,
    })),
  setSort: (sort) => set({ sort }),
  setSelected: (selectedId) => set({ selectedId }),
  setHovered: (hoveredId) => set({ hoveredId }),
  reset: () => set(initial),
}));
