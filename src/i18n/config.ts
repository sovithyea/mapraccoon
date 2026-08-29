export const locales = ["en", "km"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/**
 * Locales whose dictionaries are complete enough to build routes for.
 * Khmer is structurally supported but not yet translated, so it stays out of
 * `generateStaticParams` until `dictionaries/km.json` is filled in.
 */
export const buildableLocales: readonly Locale[] = ["en"];

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
