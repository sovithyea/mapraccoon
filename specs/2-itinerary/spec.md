# Phase 2 — Itinerary builder

Design source: Claude Design project `13e3c613-0743-4945-ac14-f9407b6e17f0`, file `MapRaccoon Phase 2 - Direction.dc.html`, turn A (frames 1a–1f) and turn B (2a–2e). Read on 2026-08-29.

> **The design was produced against a stale commit.** It read `phase/1-foundation` at `0ffa5b7`, one commit before `d03ea4f` rebuilt the palette (D21). Its frames are toned with the pre-D21 tokens, and its own corrections 01 and 02 — "the token values differ" and "city fills flip, there is no `--city-*-ink`" — describe a state that no longer exists. Section 2e's contrast audit and both its "live failures" are measured against dead values and are void: `PairingRail.tsx:60` already uses `city.ink`, and all four inks measure 5.92–8.01:1 across both modes. **The layout survives; the colour values do not.** Everything below uses the shipped tokens.
>
> Its corrections 03 (no memorial flag in the schema) and 04 (only `PairingRail` is a rail) are genuine and match C17 and C16 independently.

## Context

Phase 1 ships 42 spots, off-radar sorted by default, statically generated, with no backend. Phase 2 is the first thing a visitor can *do* rather than read, and it is the half of the differentiator the competitor has no answer for: `themapcambodia.com` picks cities across 7/10/14 days and calls it a route. This builds a day.

The organising constraint is that **a day has fixed hours**. Each stop consumes dwell plus travel. The interesting design problem is not adding stops, it is making the budget legible before it is spent — which is the same shape as the product's other idea, an editorial judgement rendered as a thing you can read at a glance.

## Current state before this phase

- `phase/1-foundation` at `d03ea4f`. Build, lint, typecheck and 20 tests green.
- `sortSpots` / `offRadarBand` in `src/lib/scoring.ts` are the single ordering entry point.
- `practical.typicalDurationMins` and `practical.entryFeeUsd` already exist on every spot.
- `DiscoverView` is `lg:w-[26rem]` plus `flex-1`, with a mobile-only List/Map toggle in local component state.
- **No Mapbox account or token exists** (B1). `SpotMap` degrades to `MapPlaceholder` (D11).
- The content schema has **no field marking a memorial site** (C17, B7). R9 is enforced by editorial discipline alone.

## Proposed change

A single-day, single-city route builder held entirely client-side, with **no routing API**.

### Scope

One day, one city. No multi-day chaining, no dates, no accommodation, no booking. Start time is editable, default 08:30; the day frame defaults to 08:00–17:00.

### Travel time — no routing API (proposes D22)

`BUILD-PLAN.md` defines Phase 2 as "travel time via Mapbox Directions, stop reordering via Optimization API". **This spec departs from that.** Travel is a haversine distance × 1.4 detour factor at 22 km/h, surfaced as `est.` in every place it appears, never as a bare arrival time.

Rationale, in the repo's own terms: it removes B1 from the critical path, it keeps cost arriving as late as possible (the governing principle of the build order), and an unlabelled fake arrival time is worse than a labelled estimate. D10's argument for Mapbox over MapLibre is unaffected — the dependency still comes, behind `estimateLeg()`, which Phase 3 or a later swap replaces without touching a component.

### Where the route lives (proposes D23)

**The route is never a route you navigate to.** Adding a stop from a spot page must not cost you the spot page.

- On `/discover` at `lg`, the right pane gains a third state: `[Map | Route]` tabs in local component state, mirroring the existing mobile toggle. Route wins the default once a stop exists; Map wins when the route is empty *and* a token is present. With no token — today's real deployment — Route is the pane's default on first load.
- At `768`, the existing mobile toggle becomes three-way: `[List | Map | Route]`.
- At `390`, the toggle stays `[List | Map]` and the route is reached only through the dock bar.
- Everywhere else, at every width below `lg`, a **56px dock bar** carries day name, stop count, time left, and a 5px capacity bar. At `lg` and up it aligns its content to the 72rem column rather than the viewport edge. It appears on the first add and is absent when no day exists.
- Tapping the bar opens a full-height sheet with a URL (`?day=open`) and a back-button dismiss — a view, not a modal, and no focus trap, the same reasoning that kept cities out of a drawer (C9).
- `/plan/[id]` exists **only** as the shareable landing view for a URL-encoded day.

### The constraint, stated three times (proposes D24)

One computed `dayBudget()` result feeds three surfaces, the way `offRadarBand()` feeds both the meter label and the sort:

1. **The day frame** — 08:00–17:00 drawn before it is filled, hour ticks, two fixed end rules. Dwell solid, travel hatched.
2. **The add affordance** — every add is priced (`＋ Add · 1h 30m`), and an overrunning add is priced too (`＋ Add · 40m over`). **Nothing is ever disabled.** The cap is soft; a 75-minute overrun may be the trade you want.
3. **The tail row** — sits where the next stop would land, so the verdict is read at the moment of the decision.

"Full" is derived, not a magic number: `min(dwell) + min(leg)` over the dataset. Overflow renders as **geometry, not colour** — the end rule doubles to 3px, the overrun hatches past it, and the number appears in `--foreground` at weight 700. No `--over` token is added; the design's own alternative sits 12 ΔE from `--city-battambang` and 9 from `--cat-food`, which is the collision class D21 exists to prevent.

Two named exits, never "OK": *Run the day to 18:30* and *Trim a stop — Bokor is 2h 30m*.

### Reordering

`↑ ↓` buttons at 44px, not drag handles: dragging inside a vertically scrolling sheet needs auto-scroll at the ends and is unusable with a screen reader. Disabled end arrows carry `aria-disabled` and a reason. Two named one-tap reorderings — *Reverse the day* and *Shortest driving order* — cover the real cases. **A reordering that moves a memorial site must say so** (`"It puts the Secret Lake at 09:15 — worth thinking about"`).

### Memorial sites become structural (proposes D25, closes B7)

Add `sensitive: z.literal("memorial").optional()` to `spotSchema`, plus a refinement rejecting `pairedWith` on a sensitive spot at build time. `OffRadarMeter`, `PairingCard` and every badge return `null` for those spots. Inside the builder: square corners, page ground instead of a surface card, dwell stated as a minimum, no score, no meter, no pairing. The day average footnotes its denominator (`2 of 3 stops scored`).

This converts R9 from editorial discipline any future generated blurb would break into a build-enforced rule.

### The spot page, reordered

The three things that carry the page are the three buried in it. `order-1` on the whole `<aside>` drags the map and sources above the pairing too — split the aside rather than flipping it.

Final order: **name → blurb → score → pairing → practical → description → community → map → sources.**

- The meter becomes a score panel in the header, with the editorial caveat attached to the number it qualifies rather than floating as a page footnote.
- Category colours leave the page entirely — neutral 12px text. Categories are a pin layer (D21); they were never a filter here.
- The pairing becomes a full-width sunk band above the split, quote in Playfair, anchor named as a green eyebrow.
- Community becomes a full-width gold band with a gold jump line from the header — a link, not a badge.
- **The unverified-content caveat moves to the practical card**, against the fee and the hours, which are the numbers that go stale. This is the R1/C18 fix.
- The no-map state becomes a designed graticule with real coordinates, distance to town and an outbound maps link — extracted from `Constellation`. It must never mention an environment variable to a traveller.

### Accessibility

Every add button carries `aria-describedby` to its own cost line; the capacity summary is `role="status"` so an overrun announces once on change; the capacity bar is `role="img"` with a text label, the pattern `OffRadarMeter` already uses. Nothing is disabled, so nothing is unreachable — this is deliberately the opposite of the competitor's disabled-checkbox cap, whose controls carry no `aria-describedby` at all.

## Acceptance criteria

Each closes in `docs/VERIFIED.md` with the evidence, not an assertion.

1. `npm run build`, `lint`, `typecheck` and `test` clean.
2. A day can be built, reordered and shared as a URL **with `NEXT_PUBLIC_MAPBOX_TOKEN` unset**, and no page mentions an environment variable.
3. The route pane is the default state of the `/discover` right pane when no token is present.
4. Every travel figure on screen is labelled `est.`
5. Adding a stop that overruns the day frame succeeds; the button is never disabled; the overrun is announced once via `role="status"`.
6. "Full" is computed from `min(dwell) + min(leg)`, and a test proves it moves when a shorter spot is added to the dataset.
7. A spot with `sensitive: "memorial"` renders with no score, no meter and no pairing on the spot page, in the `/discover` list, and in the route; a build-time refinement rejects `pairedWith` on such a spot; a test covers both.
8. `sortSpots(spots, "off-radar")` still orders the suggestion tray. No popularity ordering, no "featured".
9. `tools/probe.mjs` reports zero horizontal overflow at 390, 768 and 1280 with a day open, the dock bar excluded like the rails.
10. `tools/contrast.mjs` reports zero failures on `/discover` with the route open and on `/spot/[slug]`, in both colour modes, including the memorial variant.
11. Adding a stop from a spot page does not navigate away from it.

## Out of scope

Supabase and persistence beyond `localStorage`, auth, multi-day or intercity chaining, dates, accommodation, booking, collaborative voting (Phase 4), the Directions and Optimization APIs, photography, deployment.

## Known incomplete on delivery

- Travel times are estimates and will be visibly wrong on the Bokor road and any river crossing. Labelled, not hidden.
- Content remains unverified (R1) and community claims unconfirmed (R4). Nothing here changes that.
- The design frames are toned to the pre-D21 palette; implementation uses the shipped tokens, so the built result will not match the frames' colours. That is intended.
- Khmer remains unshipped (R6, B4). New strings land in `en.json` with `km` absent, as today.

## Decisions this phase proposes

Appended to `docs/DECISIONS.md` only on approval, never pre-emptively.

| ID | Decision |
|---|---|
| D22 | Phase 2 ships with no routing API; travel is a labelled estimate behind `estimateLeg()`. Departs from `BUILD-PLAN.md`'s Phase 2 definition and removes B1 from the critical path |
| D23 | The route is a pane on `/discover` plus a dock bar, never a destination route. `/plan/[id]` is the shared landing view only |
| D24 | The day budget is stated on three surfaces from one `dayBudget()` result; overflow is achromatic geometry; no fifth accent token |
| D25 | `sensitive: "memorial"` becomes a schema field, converting R9 from editorial discipline to a build-enforced rule |
