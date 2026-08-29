import "server-only";

import type { Locale } from "@/i18n/config";
import { defaultLocale } from "@/i18n/config";
import en from "@/i18n/dictionaries/en.json";

export type Dictionary = typeof en;

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: async () => en,
  km: async () =>
    // Khmer is a partial dictionary today; fall back key-by-key to English so a
    // missing translation renders English rather than `undefined`.
    import("@/i18n/dictionaries/km.json").then((mod) =>
      mergeDictionary(en, mod.default as PartialDictionary),
    ),
};

type PartialDictionary = {
  [K in keyof Dictionary]?: Partial<Dictionary[K]>;
};

function mergeDictionary(base: Dictionary, override: PartialDictionary): Dictionary {
  const merged: Record<string, unknown> = {};
  for (const key of Object.keys(base) as (keyof Dictionary)[]) {
    merged[key] = { ...base[key], ...(override[key] ?? {}) };
  }
  return merged as Dictionary;
}

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return (dictionaries[locale] ?? dictionaries[defaultLocale])();
}
