"use client";

import { useEffect, useState } from "react";

import { phnomPenhNow, type Now } from "@/lib/hours/now";
import type { Instant } from "@/lib/hours/open";

/**
 * The current moment in Phnom Penh, or `null` before the first client render.
 *
 * **The null is the point.** Pages here are statically generated, so anything
 * time-dependent baked into server HTML was computed at *build* time and will
 * disagree with the client — an "open now" badge rendered at build is a lie by
 * the time anyone reads it, and React warns about the mismatch on top.
 *
 * So: render a neutral state until `now` is non-null, then the real one. That
 * costs one frame of shift, which is honest. The alternatives are worse.
 * `suppressHydrationWarning` hides real bugs elsewhere, and `force-dynamic`
 * trades a free static site for a server bill and *still* returns the server's
 * clock, which a CDN then caches.
 *
 * Re-ticks every minute and on `visibilitychange`. The second matters more than
 * the first: a phone left open from 22:55 to 23:10 must stop saying "open", and
 * a backgrounded tab does not reliably run timers.
 */

const TICK_MS = 60_000;

export function useNow(): Now | null {
  const [now, setNow] = useState<Now | null>(null);

  useEffect(() => {
    const tick = () => setNow(phnomPenhNow());
    tick();

    const interval = setInterval(tick, TICK_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return now;
}

/** The instant alone, for passing into `sortSpots`. */
export function useInstant(): Instant | undefined {
  return useNow() ?? undefined;
}
