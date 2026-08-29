# Phase 1 — Foundation

> **This spec was written after the phase was executed.** That inverts this repo's core working rule and is recorded as a deviation in D14, not concealed. It describes what was actually built, verified against the source and the build output. Do not read it as evidence that the process was followed. Phases 2 onward follow the rule.

## Context

MapRaccoon is a discovery-first guide to Cambodia, specified in `cambodia-tourism-app-brief.md`. Its organising idea is a single inversion: **the default sort is how far off the radar a place is, not how popular it is.** Two mechanics carry it — every hidden place names the famous one it replaces, and community-based-tourism framing is the conversion hook rather than decoration.

The brief's own build order puts a static curated map and destination pages first, to validate content and design before any backend cost exists. Phase 1 is that: **Next.js + Tailwind + Mapbox, spot content as a typed local module, no backend at all.** One paid service, on its free tier.

The competitor named in the brief, `themapcambodia.com`, is an editorial city-guide monetised through a printed map at 220+ distribution points. It has no itinerary building or route planning. That is the gap — but see D16: it *does* already have an off-the-beaten-path section, so the differentiator is the default sort and the pairing, not the theme.

## Current state before this phase

- One commit, `4b9b2e6`, touching `README.md` only. No `package.json`.
- No Mapbox account, no Supabase project, no Google Cloud project, no deployment target.
- Sibling repos `rocket/athena` and `ass-hub/foodraccoon` run a `docs/` + `specs/` convention this repo adopted mid-phase (D13).

## Proposed change

A statically generated Next.js 16 site over 42 hand-written spots, with no backend.

### Content model

`src/lib/spots/schema.ts` — a zod schema, types inferred from it. `src/data/spots.ts` exports `Spot[]`; `src/lib/spots/index.ts` parses it once at import so invalid content fails the **build**, not a request (D3).

Two fields carry the product and are first-class rather than optional metadata (D5): `pairedWith` (the famous place this one replaces, plus the hook) and `community` (who runs it and where the money goes). `sources` is `min(1)` — no unattributable spots (D6). `offRadar` is a hand-set 0–100 integer and the UI says it is editorial (D4).

`city` means the base city you would travel from, not strictly the province.

### Coverage

42 spots across Phnom Penh, Siem Reap, Kampot & Kep, Battambang. A deliberate mix of anchors (Angkor Wat, the Royal Palace, the Crab Market — low `offRadar`) and the hidden alternatives that pair to them. Anchors must exist even though they sort last: a pairing with nothing on the other end is a listing.

### Sorting

`src/lib/scoring.ts` — `sortSpots(spots, mode)` is the only ordering entry point. `sortByOffRadar` is the initial state everywhere and `"popularity"` is available but never the default. Phase 6 replaces one branch of one function (D4).

### Pages

- `/[locale]` — landing: hero with the constellation graphic and three doors, city picks with chip tabs, the pairing rail, the community rail
- `/[locale]/discover` — the Mapbox map and the filterable list, off-radar sorted
- `/[locale]/city/[city]` — one city, off-radar first
- `/[locale]/spot/[slug]` — destination page: pairing card, community block, practical info, mini-map, sources

### Map

`react-map-gl` over `mapbox-gl` (D9), staying on Mapbox rather than following foodraccoon v2 to MapLibre, because the Directions and Optimization APIs are the Phase 2 itinerary builder and MapLibre has no equivalent (D10).

**The token-missing path is the default state of this repo**, since no Mapbox account exists. `SpotMap` checks `NEXT_PUBLIC_MAPBOX_TOKEN` and renders an explanatory placeholder when absent; the list, the filters, the landing page and every destination page work fully without it (D11).

### i18n

`app/[locale]/…` with `locales = ['en','km']`, JSON dictionaries loaded server-side with per-key fallback to English, no i18n library. `buildableLocales` is `['en']` so no half-translated route can build (D7).

### Design

Laterite & Monsoon palette, Playfair Display over DM Sans, per-city accent colours, eyebrow labels, horizontal rails. Editorial register taken from the competitor, identity and inversion our own (D16). Full spec in `docs/DESIGN-SYSTEM.md`.

## Acceptance criteria

Each is checked off in `docs/VERIFIED.md` with the evidence that closed it.

1. `npm run build` succeeds and statically generates the landing page, `/discover`, 4 city pages and 42 spot pages ✅
2. `npm run lint` and `npm run typecheck` clean under `strict` + `noUncheckedIndexedAccess` ✅
3. `npm test` green ✅
4. `/` redirects to `/en`; an unknown slug 404s ✅
5. **The landing page and `/discover` are off-radar sorted with no user interaction** — the brief's central design principle ✅
6. Without a Mapbox token, every page renders and the map area shows the placeholder ✅
7. Every seed entry parses; ids and slugs unique; coordinates inside Cambodia; every `pairedWith` resolves to a better-known spot; every city has an anchor ✅
8. A destination page shows the pairing card linking to its anchor, the community block where present, and its sources ✅
9. With a token: pins render and click/hover syncs between map and list ⏳ **PENDING — no token exists**

## Out of scope

Itinerary builder, Supabase, auth, collaborative voting, RAG, ML scoring, streaks and badges, "suggest a place", photography, deployment. The content model must not block them; no code for them lands here.

## Known incomplete

- **Content is unverified** (R1). Fees, times, seasonal advice and community claims are editorial and unchecked. This blocks any public launch.
- **Community-impact claims name real organisations** without their confirmation (R4). Same gate.
- **Khmer is structurally supported but unshippable** — the loaded typefaces have no Khmer coverage (R6).
