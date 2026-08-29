# Phase 1 — Foundation: Execution Plan

Spec: `specs/1-foundation/spec.md`

> Back-filled after execution (D14). Steps are marked with what actually happened, including the two defects found along the way. Written in the normal step format so it is re-runnable from a clean checkout.

## Step 1 — Scaffold ✅

- [x] `create-next-app` — TypeScript, Tailwind v4, App Router, `src/`, `@/*` alias, ESLint
- [x] Confirm `postcss.config.mjs` is CSS-first Tailwind v4 with no `tailwind.config.*`
- [x] `tsconfig.json`: add `noUncheckedIndexedAccess` and `noImplicitOverride` on top of `strict`
- [x] Install `zustand`, `zod`, `mapbox-gl`, `react-map-gl`, `server-only`; dev: `vitest`, `@vitejs/plugin-react`, Testing Library, `jsdom`
- [x] `vitest.config.mts` with the `@` alias and a jsdom environment; `test`, `test:watch`, `typecheck` scripts
- [x] `npm audit` → 0 vulnerabilities

**Found:** the scaffold's `layout.tsx` referenced a `LayoutProps<"/">` global that only exists after a build, so `tsc --noEmit` failed on a clean checkout (C2).

## Step 2 — i18n structure ✅

- [x] `src/i18n/config.ts` — `locales`, `defaultLocale`, `buildableLocales`, `isLocale`
- [x] `en.json` populated, `km.json` a stub; `get-dictionary.ts` merges per key so a missing Khmer string renders English
- [x] Locale redirect in the proxy

**Found:** written first as `src/middleware.ts`. Next 16 renamed the convention to `src/proxy.ts` with a named `proxy` export — confirmed against `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` rather than assumed (C1).

## Step 3 — Content schema ✅

- [x] `src/lib/spots/schema.ts` — zod, with `CAMBODIA_BBOX` bounding the coordinate tuple
- [x] `src/lib/spots/cities.ts` — four base cities with centre, zoom, tagline and accent colour
- [x] `src/lib/spots/index.ts` — parse at import, throw on invalid; query helpers

## Step 4 — Seed content ✅

- [x] 42 spots across the four cities, anchors and hidden alternatives mixed
- [x] Each carries an OSM link at its own coordinates plus a reference where one exists

**Note:** the working plan said "~40"; it is 42 (C3).

## Step 5 — Sorting and state ✅

- [x] `src/lib/scoring.ts` — `sortByOffRadar` (default), `sortByPopularity`, `sortByName`, `sortSpots`, `offRadarBand`
- [x] `src/store/filters.ts` — Zustand, initial `sort: "off-radar"`

**Note:** the working plan implied the map would read the store directly. It takes props instead; only `DiscoverView` reads the store (C4).

## Step 6 — Map ✅

- [x] `SpotMap` — `react-map-gl`, markers coloured by first category, size emphasised on hover/selection
- [x] `MapPlaceholder` — rendered when `NEXT_PUBLIC_MAPBOX_TOKEN` is absent, naming the variable
- [x] `MiniMap` — single-spot framing for a destination page
- [x] Both dynamically imported with `ssr: false` — `mapbox-gl` touches `window` at import time

## Step 7 — Pages ✅

- [x] `DiscoverView` (client) — filters, list and map with hover/selection shared
- [x] `/[locale]/discover`, `/[locale]/city/[city]`, `/[locale]/spot/[slug]` with `generateStaticParams` and per-spot `generateMetadata`
- [x] `PairingCard`, `CommunityImpact`, `OffRadarMeter`, `SpotCard`

## Step 8 — Tests ✅

- [x] `spots.test.ts` — parse, uniqueness, bbox, pairing resolution, pairing direction, city coverage, anchor presence
- [x] `scoring.test.ts` — order, ties, immutability, empty input, bands, real content
- [x] `SpotMap.test.tsx` — the token-missing branch
- [x] 20 tests, 3 files, green

## Step 9 — Landing page and design system ✅

- [x] Read `themapcambodia.com`'s rendered HTML; record what to take and what not to (D16)
- [x] Laterite & Monsoon palette with per-city accents; Playfair Display + DM Sans; `.eyebrow` and `.rail` utilities
- [x] `Constellation` — 42 spots at true coordinates, dot size by off-radar score (D17)
- [x] `Hero`, `CityPicks`, `PairingRail`, `CommunityRail`; sticky nav and footer
- [x] Map and list moved to `/discover`

## Step 10 — Docs, env and verification ✅

- [x] `.env.example` with Mapbox setup and the cost-control note; `.gitignore` exception so it is tracked
- [x] `agentRules: false` in `next.config.ts` — Next 16 was overwriting the hand-written `AGENTS.md`/`CLAUDE.md` on dev start
- [x] Full `docs/` set and this spec pair back-filled (D13, D14)
- [x] Acceptance criteria recorded in `docs/VERIFIED.md` with evidence

## Step 11 — Pin rendering ⏳ BLOCKED

- [ ] Create a Mapbox public token, **restricted to your domains plus `http://localhost:3000` at creation** (R3)
- [ ] `npm run dev`, confirm pins render on `/discover` and on a spot page's mini-map
- [ ] Confirm clicking a pin selects the matching list row, and hovering a row emphasises its pin
- [ ] Close the PENDING row in `docs/VERIFIED.md`

Blocked on B1 — no Mapbox account exists. jsdom cannot run WebGL, so this needs a real browser.

## Verification

```bash
npm run build      # 50 static pages; invalid seed content fails here
npm run lint       # clean
npm run typecheck  # clean under strict + noUncheckedIndexedAccess
npm test           # 20 tests
npm run dev        # http://localhost:3000 — / redirects to /en
```

Then, by eye and without a token: the landing page leads with the pairing mechanic; the constellation shows 42 dots with the biggest ones least-visited; city chips switch picks and keep their colour; `/discover` lists Banteay Chhmar first and Angkor Wat last with no interaction; a spot page shows its pairing card, community block and sources; the map area shows the placeholder.
