"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const THEME_KEY = "mapraccoon:theme";
const PALETTE_KEY = "mapraccoon:palette";

export type ThemeChoice = "auto" | "light" | "dark";
export type PaletteId = "monsoon" | "laterite" | "neon" | "paper";

/**
 * Appearance and palette, in one control.
 *
 * Two axes, because they are genuinely independent: someone can want Laterite
 * and still want it to follow the OS at night. Three appearances rather than
 * two, because a plain flip loses the ability to follow the system again once
 * it has been touched, and "auto" is the honest default for a site with no
 * account.
 *
 * It is a disclosure rather than the old three-pill segmented control. That
 * control was 33px wider than a 390px viewport once the header CTA was beside
 * it — the page scrolled sideways on a phone — and adding a second axis to it
 * would have made that worse. One button, and the choices live in a panel.
 *
 * Both values are applied by an inline script in the layout before first paint.
 * Doing it here alone would flash Monsoon light on every load for anyone who
 * chose otherwise.
 */

export const PALETTES: readonly { id: PaletteId; name: string; note: string }[] = [
  { id: "monsoon", name: "Monsoon", note: "Bone, and forest green" },
  { id: "laterite", name: "Laterite", note: "Terracotta, like the stone" },
  { id: "neon", name: "Neon", note: "Pink, like a bar street" },
  { id: "paper", name: "Paper", note: "Cool grey, almost no colour" },
];

const listeners = new Set<() => void>();

const notify = () => {
  for (const l of listeners) l();
};

const subscribe = (onChange: () => void): (() => void) => {
  listeners.add(onChange);
  // Another tab changing the choice should move this one too.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
};

const readTheme = (): ThemeChoice => {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : "auto";
  } catch {
    // Private browsing, or storage disabled. Follow the system.
    return "auto";
  }
};

const readPalette = (): PaletteId => {
  try {
    const v = localStorage.getItem(PALETTE_KEY);
    return PALETTES.some((p) => p.id === v) ? (v as PaletteId) : "monsoon";
  } catch {
    return "monsoon";
  }
};

/** The server has no localStorage, and the inline script has not run yet. */
const serverTheme = (): ThemeChoice => "auto";
const serverPalette = (): PaletteId => "monsoon";

function write(key: string, value: string, isDefault: boolean): void {
  try {
    if (isDefault) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // The choice still applies to this page view via the effects below.
  }
  notify();
}

export function ThemeToggle({ label }: { label: string }) {
  const theme = useSyncExternalStore(subscribe, readTheme, serverTheme);
  const palette = useSyncExternalStore(subscribe, readPalette, serverPalette);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Synchronising React state to a platform API is what effects are for.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (palette === "monsoon") root.removeAttribute("data-palette");
    else root.setAttribute("data-palette", palette);
  }, [palette]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = PALETTES.find((p) => p.id === palette) ?? PALETTES[0]!;

  return (
    <div className="relative shrink-0" ref={box}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-10 items-center gap-2 rounded-full border border-border px-3 text-xs font-semibold text-muted transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span
          aria-hidden="true"
          className="size-3 rounded-full border border-border bg-accent"
        />
        <span className="hidden sm:inline">{current.name}</span>
        <span aria-hidden="true" className="text-[9px]">
          ▼
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-border bg-surface p-3 shadow-lg">
          <p className="eyebrow text-[10px]">Appearance</p>
          <div
            role="group"
            aria-label="Appearance"
            className="mt-2 flex rounded-full border border-border p-0.5"
          >
            {(["auto", "light", "dark"] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={theme === c}
                onClick={() => write(THEME_KEY, c, c === "auto")}
                className={`min-h-8 flex-1 rounded-full px-2 text-[11px] font-semibold capitalize transition-colors ${
                  theme === c
                    ? "bg-accent text-accent-contrast"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <p className="eyebrow mt-4 text-[10px]">Palette</p>
          <ul className="mt-2 space-y-0.5">
            {PALETTES.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={palette === p.id}
                  onClick={() => write(PALETTE_KEY, p.id, p.id === "monsoon")}
                  className={`flex w-full min-h-10 items-center gap-2.5 rounded-xl px-2.5 text-left transition-colors ${
                    palette === p.id ? "bg-surface-sunk" : "hover:bg-surface-sunk"
                  }`}
                >
                  {/*
                    No swatch. A hex here would be a second copy of the palette,
                    free to drift from the real one, and the tokens cannot be
                    scoped to a nested element without duplicating all eight
                    blocks. It would also be doing very little work: clicking
                    recolours the entire page under the open panel, which is a
                    better preview than sixteen pixels of it.
                  */}
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold">{p.name}</span>
                    <span className="block text-[10px] leading-tight text-muted">
                      {p.note}
                    </span>
                  </span>
                  {palette === p.id ? (
                    <span aria-hidden="true" className="text-xs text-accent">
                      ✓
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
