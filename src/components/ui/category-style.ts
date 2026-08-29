import type { Category } from "@/lib/spots/schema";

/** Category colour is semantic — it identifies the pin layer on the map. */
export const categoryColor: Record<Category, string> = {
  temple: "var(--cat-temple)",
  nature: "var(--cat-nature)",
  food: "var(--cat-food)",
  culture: "var(--cat-culture)",
};

export const categoryOrder: Category[] = ["temple", "nature", "food", "culture"];
