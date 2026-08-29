"use client";

import { create } from "zustand";

import type { SortMode } from "@/lib/scoring";
import type { Category, CityId } from "@/lib/spots/schema";

type FilterState = {
  city: CityId | null;
  categories: Category[];
  sort: SortMode;
  /** Shared between the list and the map so hover/selection stay in step. */
  selectedId: string | null;
  hoveredId: string | null;

  setCity: (city: CityId | null) => void;
  toggleCategory: (category: Category) => void;
  setSort: (sort: SortMode) => void;
  setSelected: (id: string | null) => void;
  setHovered: (id: string | null) => void;
  reset: () => void;
};

const initial = {
  city: null,
  categories: [] as Category[],
  // Off-radar is the initial state and stays that way. See D4.
  sort: "off-radar" as SortMode,
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
