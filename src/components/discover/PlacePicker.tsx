"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useNow } from "@/components/hooks/useNow";
import { useRouteStops } from "@/components/route/useRouteStops";
import { groupOrder } from "@/components/ui/category-style";
import type { Dictionary } from "@/i18n/get-dictionary";
import { isOpenAt } from "@/lib/hours/open";
import { groupLabel, inGroup } from "@/lib/spots/categories";
import { getNeighbourhood, neighbourhoods } from "@/lib/spots/neighbourhoods";
import { plottableSpots } from "@/lib/spots/plottable";
import type { Spot } from "@/lib/spots/schema";
import { useRoute } from "@/store/route";

const fill = (t: string, v: Record<string, string | number>): string =>
  Object.entries(v).reduce((o, [k, val]) => o.replaceAll(`{${k}}`, String(val)), t);

/**
 * Browsing, taken off the planning page.
 *
 * `/discover` put all 87 places in a permanent left column, so finding a
 * restaurant meant scrolling past every bar and café on the way — and the list
 * occupied half the screen even once you had stopped looking. Searching was not
 * possible at all.
 *
 * So browsing becomes a place you *go*: open it, search and filter, add as many
 * as you want, and leave. The day you are building stays where it was, which is
 * the point — you come back to the timeline rather than to the top of a list.
 *
 * **Adds commit immediately, and there is no Cancel.** A picker that stages
 * changes needs an explicit save, and the one thing worse than choosing twice
 * is choosing twice and then losing it. "Done" closes; it does not confirm.
 */
export function PlacePicker({
  spots,
  dict,
  open,
  onClose,
}: {
  spots: readonly Spot[];
  dict: Dictionary;
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [hood, setHood] = useState<string | null>(null);
  const [group, setGroup] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { stops, hydrated } = useRouteStops();
  const add = useRoute((s) => s.add);
  const remove = useRoute((s) => s.remove);
  const at = useNow();

  const added = useMemo(() => new Set(stops.map((s) => s.spot.id)), [stops]);

  /**
   * Escape closes, and the page behind does not scroll.
   *
   * The scroll lock is not cosmetic: without it a touch drag inside the panel
   * scrolls the list underneath, so closing puts you somewhere you never
   * navigated to — which is exactly the "back to the top of the list" problem
   * this component exists to remove.
   */
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  /**
   * **No memorial site is ever offered here (R9, D33).**
   *
   * This surface is written in the product's voice — a list headed "Find places
   * to add", each row carrying an *Add* button beside a hotpot restaurant. The
   * first run of this component offered Tuol Sleng, because it matched a search
   * for its own neighbourhood. That is C19's shape on a new surface and C30's
   * cause: `sensitive` exists, and a component built after D33 simply did not
   * consult it.
   *
   * `plottableSpots` rather than a local `.filter`, so the rule lives in one
   * place and the next surface inherits it instead of re-deriving it.
   */
  const offerable = useMemo(() => plottableSpots(spots), [spots]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return offerable.filter((spot) => {
      if (hood && spot.neighbourhood !== hood) return false;
      if (group && !inGroup(spot.categories, group as never)) return false;
      if (q.length === 0) return true;
      // Neighbourhood and category are searched too, so "bkk1" and "coffee"
      // both work — people type where and what, not only names.
      const haystack = [
        spot.name.en,
        spot.blurb.en,
        getNeighbourhood(spot.neighbourhood).name,
        ...spot.categories,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [offerable, query, hood, group]);

  if (!open) return null;

  const occupied = neighbourhoods.filter((n) =>
    offerable.some((s) => s.neighbourhood === n.id),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={dict.picker.title}
    >
      {/* Backdrop. Clicking it closes, because a modal you cannot dismiss by
          tapping away reads as a page you are stuck on. */}
      <button
        type="button"
        aria-label={dict.picker.close}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink/45 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        className="relative flex h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-border bg-background shadow-2xl sm:h-[86dvh] sm:rounded-3xl"
      >
        {/* ── Search and filters. Fixed; only the results scroll. ─────────── */}
        <div className="shrink-0 border-b border-border p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <label className="relative flex-1">
              <span className="sr-only">{dict.picker.title}</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={dict.filters.searchPlaceholder}
                className="min-h-12 w-full rounded-2xl border border-border bg-surface pl-11 pr-4 text-base"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              >
                {/* Inline, not an icon font: one glyph is not worth a dependency. */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle
                    cx="7"
                    cy="7"
                    r="5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M11 11l3.2 3.2"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </label>

            <button
              type="button"
              onClick={onClose}
              className="min-h-12 shrink-0 rounded-full border border-border px-5 text-sm font-semibold"
            >
              {dict.picker.done}
            </button>
          </div>

          <div className="rail -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            <Chip active={hood === null && group === null} onClick={() => {
              setHood(null);
              setGroup(null);
            }}>
              {dict.filters.allCities}
            </Chip>
            {groupOrder.map((g) => (
              <Chip key={g} active={group === g} onClick={() => setGroup(group === g ? null : g)}>
                {groupLabel[g]}
              </Chip>
            ))}
            {occupied.map((n) => (
              <Chip
                key={n.id}
                active={hood === n.id}
                onClick={() => setHood(hood === n.id ? null : n.id)}
              >
                {n.name}
              </Chip>
            ))}
          </div>
        </div>

        {/* ── Results ──────────────────────────────────────────────────────── */}
        <ul className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {results.length === 0 ? (
            <li className="py-16 text-center text-sm text-muted">
              {fill(dict.picker.none, { query: query.trim() })}
            </li>
          ) : (
            results.map((spot) => {
              const isAdded = added.has(spot.id);
              const openState = at ? isOpenAt(spot.hours, at) : "unknown";

              return (
                <li
                  key={spot.id}
                  className="flex items-center gap-3 border-b border-border py-3 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{spot.name.en}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {getNeighbourhood(spot.neighbourhood).name}
                      {" · "}
                      {"$".repeat(spot.priceLevel)}
                      {openState === "open" ? ` · ${dict.picker.openNow}` : ""}
                    </p>
                  </div>

                  {/*
                    Never disabled, and the label says which it is. The day
                    budget is soft (D24) — a picker that refuses the ninth place
                    is deciding something the group is allowed to decide.
                  */}
                  <button
                    type="button"
                    disabled={!hydrated}
                    onClick={() => (isAdded ? remove(spot.id) : add(spot))}
                    aria-pressed={isAdded}
                    className={`min-h-10 shrink-0 rounded-full px-4 text-xs font-bold transition-colors ${
                      isAdded
                        ? "border border-accent text-accent"
                        : "bg-accent text-accent-contrast"
                    }`}
                  >
                    {isAdded ? `✓ ${dict.picker.addedOne}` : dict.picker.add}
                  </button>
                </li>
              );
            })
          )}
        </ul>

        {/* ── What you have so far, and the way out ────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border bg-surface px-4 py-3 sm:px-5">
          <p className="text-sm text-muted" role="status">
            {stops.length === 0
              ? dict.picker.nothingYet
              : stops.length === 1
                ? dict.picker.addedCountOne
                : fill(dict.picker.addedCount, { count: stops.length })}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-full bg-accent px-6 text-sm font-bold text-accent-contrast"
          >
            {stops.length > 0 ? dict.picker.backToDay : dict.picker.done}
          </button>
        </div>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-9 shrink-0 whitespace-nowrap rounded-full border px-3.5 text-xs font-semibold transition-colors ${
        active
          ? "border-accent bg-accent text-accent-contrast"
          : "border-border text-muted hover:border-muted"
      }`}
    >
      {children}
    </button>
  );
}
