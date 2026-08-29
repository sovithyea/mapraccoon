"use client";

import { useEffect, useSyncExternalStore } from "react";

const KEY = "mapraccoon:theme";
export type ThemeChoice = "auto" | "light" | "dark";

/**
 * Light and dark as an explicit choice, not only the OS preference.
 *
 * Three states rather than two, because a plain flip loses the ability to
 * follow the system again once it has been touched — and "auto" is the honest
 * default for a site with no account.
 *
 * The stored value is applied by an inline script in the layout before first
 * paint. Doing it here alone would flash the light palette on every load for
 * anyone who chose dark.
 */

const listeners = new Set<() => void>();

const read = (): ThemeChoice => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "auto";
  } catch {
    // Private browsing, or storage disabled. Follow the system.
    return "auto";
  }
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

/** The server has no localStorage, and the inline script has not run yet. */
const serverSnapshot = (): ThemeChoice => "auto";

function write(next: ThemeChoice): void {
  try {
    if (next === "auto") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, next);
  } catch {
    // The choice still applies to this page view via the effect below.
  }
  for (const l of listeners) l();
}

export function ThemeToggle({ label }: { label: string }) {
  const choice = useSyncExternalStore(subscribe, read, serverSnapshot);

  // Synchronising React state to a platform API is what effects are for.
  useEffect(() => {
    const root = document.documentElement;
    if (choice === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", choice);
  }, [choice]);

  return (
    <div
      className="flex shrink-0 rounded-full border border-border p-0.5"
      role="group"
      aria-label={label}
    >
      {(["auto", "light", "dark"] as const).map((c) => (
        <button
          key={c}
          type="button"
          aria-pressed={choice === c}
          onClick={() => write(c)}
          className={`min-h-8 rounded-full px-2.5 text-[11px] font-semibold capitalize transition-colors ${
            choice === c ? "bg-accent text-accent-contrast" : "text-muted hover:text-foreground"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
