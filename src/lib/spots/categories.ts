/**
 * Categories are authored specific and grouped in code.
 *
 * An author writes `bar` or `night-market`; nobody writes `drink`. The group is
 * derived from a static map, so it costs zero authoring and cannot drift out of
 * step with the tag.
 *
 * The reason for the split is the filter row. Eighteen chips in a horizontal
 * scroller is a row nobody reads — `DiscoverView` already had to become a
 * scroller at four categories. Five group chips that expand to specifics is the
 * shape that survives contact with a phone.
 */

export const CATEGORY_GROUPS = ["eat", "drink", "do", "see"] as const;
export type CategoryGroup = (typeof CATEGORY_GROUPS)[number];

export const categoryGroup: Record<string, CategoryGroup> = {
  restaurant: "eat",
  "street-food": "eat",
  cafe: "eat",
  bakery: "eat",

  bar: "drink",
  rooftop: "drink",
  "night-market": "drink",

  "live-music": "do",
  cinema: "do",
  gallery: "do",
  karaoke: "do",
  sport: "do",
  swimming: "do",
  games: "do",

  temple: "see",
  museum: "see",
  market: "see",
  nature: "see",
};

export const groupLabel: Record<CategoryGroup, string> = {
  eat: "Eat",
  drink: "Drink",
  do: "Do",
  see: "See",
};

/** The group a spot belongs to, from its first category. */
export function groupOf(categories: readonly string[]): CategoryGroup {
  const first = categories[0];
  return (first ? categoryGroup[first] : undefined) ?? "see";
}

/** Whether any of a spot's categories fall in a group. */
export function inGroup(categories: readonly string[], group: CategoryGroup): boolean {
  return categories.some((c) => categoryGroup[c] === group);
}
