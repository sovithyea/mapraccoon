# Architecture — MapRaccoon

> **This document was rewritten on 2026-08-29 for a different product.** It described a discovery-first tourist guide to Cambodia sorted by how far off the radar a place was. See `docs/PIVOT.md` and D27–D34.

## What the product is

A tool for **friends who live in Phnom Penh** deciding where to go out together. One city, a resident audience.

The organising idea is not editorial. It is that the product **resolves an argument five people are having in a group chat**: someone shares a link, everyone votes on candidates for a slot, and it settles. The venue data is fuel for that (D29).

What carries it:

| Mechanic | What it does | Where it lives |
|---|---|---|
| **The decision** | Ballot in a link, votes from several people, one resolved answer. This is the product. | `resolve(ballot, votes)` |
| **Open now** | The default sort. It is 7pm on a Thursday; here is what is actually open. | `Spot.hours` → `isOpenAt()` |
| **The day budget** | A night has fixed hours; each stop costs travel plus dwell, stated before it is spent. | `dayBudget()` |

The competitor is **the group chat** — zero friction, already installed, and genuinely bad at converging on a decision (D31). The old competitor, `themapcambodia.com`, sells a printed map to inbound visitors and is not a competitor to this at all; `docs/COMPETITOR.md` is kept as history.

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
        ├──▶ app/[locale]/page.tsx    home: map + list, open-now sorted
        └──▶ app/[locale]/spot/[slug] destination page, statically generated
```

Content invalid against the schema fails the **build**, not a request. That property is the point of parsing at import rather than trusting a JSON file.

## The seams that matter

**Time.** Exactly one module reads the clock. Everything above it takes an explicit instant, so the primitive is `isOpenAt(hours, instant)` rather than `isOpenNow(hours)` — "open now" is one call, and "we are deciding for Friday 8pm" gets its filter free instead of a second code path. Cambodia is UTC+7 with no DST, so a fixed offset is exact, and it means a friend deciding from Bangkok still sees Phnom Penh hours (D34).

The consequence to remember: the pages are statically generated, so an open/closed state baked into server HTML would be computed at *build* time and disagree with the client. Open state renders only after mount.

**Travel.** `estimateLeg()` is the whole swap surface for a routing API. It is a haversine distance with a detour factor and distance-banded speeds, labelled `est.` wherever it appears (D22, C20).

**Ordering.** `src/lib/scoring.ts` stays the single entry point, so a change of default is one branch rather than scattered `.sort()` calls. The off-radar score it used to serve is gone — for residents "almost nobody goes here" describes an empty bar, not a find, so the signal inverted rather than weakened (D28).

## i18n

Routes are `app/[locale]/…` with `locales = ['en', 'km']`. English ships; Khmer is structurally supported and untranslated.

Content and UI copy share one shape — `{ en: string; km?: string }` — so seed data and dictionaries sit on the same translation path. No i18n library: dictionaries are JSON, loaded server-side, with per-key fallback to English. `generateStaticParams` returns only `en` until `km.json` is filled, so no half-translated routes build (D7).

**English-only is now a launch blocker, not a scheduled defect.** A tourist product could defend shipping English-first; a product for people who *live in* Phnom Penh has a majority-Khmer-speaking user base by construction. Neither shipped typeface has Khmer coverage. See R6 and D32.
