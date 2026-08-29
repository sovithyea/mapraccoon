import { categoryGroup, type CategoryGroup } from "@/lib/spots/categories";
import type { Category } from "@/lib/spots/schema";

/**
 * Pin colour identifies a category GROUP on the map, and appears nowhere else
 * (D21).
 *
 * Eighteen categories cannot each have a colour — that is the ten-colours
 * problem D21 measured, more than doubled. Colouring by group keeps the count
 * at four, which is exactly what the old four-category system used, so the
 * existing tokens carry over with their measured separation intact.
 *
 * Everywhere off the map a category is a text label in neutral chrome.
 */
export const groupColor: Record<CategoryGroup, string> = {
  eat: "var(--cat-food)",
  drink: "var(--cat-temple)",
  do: "var(--cat-culture)",
  see: "var(--cat-nature)",
};

export function categoryColorFor(category: Category): string {
  return groupColor[categoryGroup[category] ?? "see"];
}

export const groupOrder: CategoryGroup[] = ["eat", "drink", "do", "see"];
