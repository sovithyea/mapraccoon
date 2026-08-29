import type { Category } from "@/lib/spots/schema";

/**
 * Category colour identifies pin layers ON THE MAP and appears nowhere else
 * (D21). Elsewhere a category is a text label in neutral chrome.
 *
 * Four cities, four categories, an accent and a gold role is ten colours
 * competing on one page; measured, they collided twelve ways. Cutting category
 * colour to the one place it distinguishes items from each other fixed it.
 */
export const categoryColor: Record<Category, string> = {
  temple: "var(--cat-temple)",
  nature: "var(--cat-nature)",
  food: "var(--cat-food)",
  culture: "var(--cat-culture)",
};

export const categoryOrder: Category[] = ["temple", "nature", "food", "culture"];
