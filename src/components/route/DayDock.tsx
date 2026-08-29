"use client";

import { useCallback, useEffect, useState } from "react";

import { DayFrameBar } from "@/components/route/DayFrameBar";
import { RoutePane } from "@/components/route/RoutePane";
import { RouteReorder } from "@/components/route/RouteReorder";
import { duration } from "@/components/route/time";
import { useRouteStops } from "@/components/route/useRouteStops";
import type { Dictionary } from "@/i18n/get-dictionary";
import { dayBudget } from "@/lib/route/day";
import { getNeighbourhood } from "@/lib/spots/neighbourhoods";
import type { Spot } from "@/lib/spots/schema";
import { useRoute } from "@/store/route";

const fill = (template: string, values: Record<string, string | number>): string =>
  Object.entries(values).reduce(
    (out, [key, value]) => out.replaceAll(`{${key}}`, String(value)),
    template,
  );

const SHEET_HASH = "#day";

/**
 * The permanent 56px summary of the day, on every page below `lg`.
 *
 * D23: the constraint is ambient without opening anything, which is why the
 * sheet is rarely needed. The bar appears on the first add and is absent when
 * no day exists — the feature is invisible until it is used.
 *
 * The sheet is a view, not a modal: it takes a history entry so the back button
 * dismisses it and there is no focus trap to get wrong. That is the same
 * reasoning that kept the mobile city list out of a drawer (C9).
 *
 * The history API is used directly rather than `useSearchParams`, which would
 * opt every page into dynamic rendering and cost the 51 static pages.
 */
export function DayDock({ spots, dict }: { spots: readonly Spot[]; dict: Dictionary }) {
  const { stops, hydrated } = useRouteStops();
  const frame = useRoute((s) => s.frame);
  const [open, setOpen] = useState(false);
  /** Reading and rearranging are different jobs, so they are different tabs. */
  const [tab, setTab] = useState<"timeline" | "reorder">("timeline");

  useEffect(() => {
    const sync = () => setOpen(window.location.hash === SHEET_HASH);
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  const openSheet = useCallback(() => {
    window.history.pushState(null, "", SHEET_HASH);
    setOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    if (window.location.hash === SHEET_HASH) window.history.back();
    else setOpen(false);
  }, []);

  if (!hydrated || stops.length === 0) return null;

  const budget = dayBudget(stops, frame);
  // Named by where it actually goes. A night that crosses neighbourhoods is
  // normal now, so the label lists them rather than picking one.
  const cityName = [...new Set(stops.map((s) => s.spot.neighbourhood))]
    .map((id) => getNeighbourhood(id).name)
    .join(" & ");

  const summary =
    budget.state === "over"
      ? fill(dict.route.overBy, {
          over: duration(budget.overrunMins),
          end: `${String(Math.floor(frame.frameEnd / 60)).padStart(2, "0")}:00`,
        })
      : budget.state === "full"
        ? fill(dict.route.dayFull, {
            left: duration(budget.remainingMins),
            end: `${String(Math.floor(frame.frameEnd / 60)).padStart(2, "0")}:00`,
          })
        : `${duration(budget.remainingMins)} left`;

  return (
    <>
      {/* Reserves the bar's height so a fixed bar never covers page content. */}
      <div className="h-[56px] lg:hidden" aria-hidden="true" />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface lg:hidden">
        <button
          type="button"
          onClick={openSheet}
          className="mx-auto flex h-[56px] w-full max-w-6xl items-center gap-3 px-5 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold">
              <span className="line-clamp-1">
                {fill(dict.route.dayIn, { city: cityName })}
              </span>
            </span>
            <span className="mt-0.5 block text-[11px] tabular-nums text-muted">
              {stops.length === 1 ? "1 stop" : `${stops.length} stops`} · {summary}
            </span>
          </span>

          <span className="w-24 shrink-0">
            <DayFrameBar budget={budget} frame={frame} compact />
          </span>
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-background lg:hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <p className="eyebrow">{dict.route.dayTitle}</p>
            <button
              type="button"
              onClick={closeSheet}
              aria-label={dict.route.closeDay}
              className="flex size-11 items-center justify-center text-muted"
            >
              ✕
            </button>
          </div>

          <div className="border-b border-border px-5 py-2">
            <div className="inline-flex rounded-full border border-border p-0.5" role="group">
              {(["timeline", "reorder"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={tab === t}
                  onClick={() => setTab(t)}
                  className={`min-h-9 rounded-full px-4 text-xs font-semibold transition-colors ${
                    tab === t
                      ? "bg-accent text-accent-contrast"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {t === "timeline" ? dict.route.tabTimeline : dict.route.tabReorder}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-10">
            {tab === "timeline" ? (
              <RoutePane candidates={spots} dict={dict} />
            ) : (
              <RouteReorder dict={dict} />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
