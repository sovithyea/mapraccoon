# Architecture — MapRaccoon

## What the product is

A discovery-first guide to Cambodia. The organising idea is a single inversion: **the default sort is how far off the radar a place is, not how popular it is.** Everything else follows from that.

Three mechanics carry it:

| Mechanic | What it does | Where it lives in the data |
|---|---|---|
| **Off-radar sort** | The famous places sort last. Discovery is the default view, not an opt-in tab. | `Spot.offRadar` (0–100) |
| **Narrative pairing** | Every hidden spot names the famous one it replaces — "tired of Angkor Wat crowds? try this". | `Spot.pairedWith` |
| **Community framing** | The conversion hook is where the money goes, not the pin on the map. | `Spot.community` |

The competitor reference, `themapcambodia.com`, does editorial city guides and curated picks monetised through a physical map. It has no interactive itinerary building or route planning. That is the gap.

## Stack

| Layer | Choice | Status |
|---|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript strict | Phase 1 |
| Styling | Tailwind v4, CSS-first (no `tailwind.config.*`) | Phase 1 |
| Content store | Typed TS module, zod-parsed at import | Phase 1 — replaced by Postgres in Phase 3 |
| Map renderer | Mapbox GL JS via `react-map-gl` | Phase 1 |
| Routing / travel time | Mapbox Directions + Optimization APIs | Phase 2 |
| Client state | Zustand | Phase 1 (filters, selection) |
| Backend | Supabase — Postgres, Auth, Realtime, Storage, pgvector | Phase 3 |
| Collaborative voting | Supabase Realtime | Phase 4 |
| Trip assistant | Claude API + Voyage embeddings, retrieval constrained to the spot DB | Phase 5 |
| Tests | Vitest | Phase 1 |

**There is no backend in Phase 1 and that is deliberate.** Supabase enters when the itinerary builder needs persistence, not before. See `docs/BUILD-PLAN.md`.

## Why Mapbox and not MapLibre

`ass-hub/foodraccoon` moved off Mapbox to MapLibre specifically to break vendor lock-in on the renderer. This project deliberately does not follow it (D10).

The reason is that here the Mapbox dependency is not the renderer — it is the Directions and Optimization APIs, which are the itinerary builder. There is no MapLibre equivalent for multi-stop route optimisation. Swapping the renderer while keeping the routing APIs would buy a partial escape at the cost of running two vendors' conventions side by side. The lock-in is accepted, priced (free tier: 50K map loads, 100K directions/month), and recorded as a risk (R7).

## Data flow, Phase 1

```
src/data/spots.ts          42 hand-curated entries, typed as Spot[]
        │
        ▼  parsed once at import, throws on invalid content
src/lib/spots/schema.ts    zod schema — the content contract
        │
        ▼
src/lib/spots/index.ts     getAllSpots / getSpotBySlug / getSpotsByCity / getPairedSpot
        │
        ├──▶ src/lib/scoring.ts       sortByOffRadar (the default), sortByPopularity
        │
        ├──▶ app/[locale]/page.tsx    home: map + list, off-radar sorted
        └──▶ app/[locale]/spot/[slug] destination page, statically generated
```

Content invalid against the schema fails the **build**, not a request. That property is the point of parsing at import rather than trusting a JSON file.

## The seam that matters

`Spot.offRadar` is an editorial integer today. The brief defers the XGBoost hidden-gem model until there is first-party visit data to train on, because Google and OSM data is inherently biased toward already-popular places — training on it would reproduce exactly the ranking this product exists to invert.

`src/lib/scoring.ts` exists so that deferral is cheap to reverse: when the model arrives it replaces one function, not scattered `.sort()` calls across components. Until then "hidden gem" is an editorial tag and the UI says so.

## i18n

Routes are `app/[locale]/…` with `locales = ['en', 'km']`. English ships; Khmer is structurally supported and untranslated.

Content and UI copy share one shape — `{ en: string; km?: string }` — so seed data and dictionaries sit on the same translation path. No i18n library: dictionaries are JSON, loaded server-side, with per-key fallback to English. `generateStaticParams` returns only `en` until `km.json` is filled, so no half-translated routes build (D7).

An English-only guide to Cambodia is a defect with a schedule, not a design choice. See R6.
