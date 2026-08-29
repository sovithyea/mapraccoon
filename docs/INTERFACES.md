# Interfaces — MapRaccoon

The surfaces this project exposes. Thin at Phase 1 by nature: there are no API routes, no database and no auth. Written now so the shape exists before the risk does (D13).

Verified against the Phase 1 build output on 2026-08-29, not transcribed from intent.

> **The contract below describes the tourist product, and Phase 3 changes most of it.** The pivot (`docs/PIVOT.md`, D27–D34) removes `offRadar` and `pairedWith`, swaps `city` for `neighbourhood`, adds `hours`, and makes "open now" the default sort. Every claim here marked **CHANGES IN PHASE 3** is true of the shipped code today and will not be after. This document is rewritten when `specs/3-friends/` is executed, not before — it records what is, not what is planned.

## Routes

All routes live under a locale segment. Only `en` builds today (D7).

| Path | Rendering | Purpose |
|---|---|---|
| `/` | Proxy redirect (307) | Sends bare paths to `/en` |
| `/[locale]` | SSG | Landing page: hero + constellation, city picks, pairing rail, community rail |
| `/[locale]/discover` | SSG | The map and the filterable list, off-radar sorted — **CHANGES IN PHASE 3**, becomes open-now sorted |
| `/[locale]/city/[city]` | SSG, 4 paths | One city, its spots off-radar first — **REMOVED IN PHASE 3**: with one city and ~9 neighbourhoods this is a filter, not a destination |
| `/[locale]/spot/[slug]` | SSG, 42 paths | Destination page: pairing card, community block, practical info, mini-map, sources |
| `/_not-found` | Static | 404 |

50 pages generated. `params` is a `Promise` in Next 16 and is awaited in every one.

`src/proxy.ts` is the Next 16 proxy (**not** `middleware.ts` — see the Corrections table in `VERIFIED.md`). It does exactly one job today: redirect a bare or unknown-locale path to `/{defaultLocale}`. Its matcher excludes `_next`, `api`, `favicon.ico` and anything with a file extension.

## The content contract

`src/lib/spots/schema.ts` is the interface everything else is written against. It is the closest thing this project has to an API today, and it is what the Phase 3 Postgres schema will be derived from.

```ts
Spot {
  id, slug, city, categories[], name, coords: [lng, lat],
  blurb, description, offRadar: 0–100,
  pairedWith?: { spotId, hook },
  community?: { name, impact, url? },
  practical: { bestTime, entryFeeUsd, typicalDurationMins },
  sources: url[]   // min 1
}
```

Invariants beyond the schema, enforced by `src/lib/spots/spots.test.ts`:

- `id` and `slug` are unique
- every coordinate falls inside `CAMBODIA_BBOX` = `[102.3, 9.8, 107.7, 14.8]`
- every `pairedWith.spotId` resolves, and never to itself
- a pairing always points at a **better-known** spot (lower `offRadar`) — **REMOVED IN PHASE 3** with `pairedWith` (D29)
- every city has at least one spot and at least one anchor (`offRadar < 30`) — **REMOVED IN PHASE 3** with the score (D28)
- a `sensitive: "memorial"` spot cannot carry a pairing, rejected at parse time (D25). **The field stays in Phase 3 and its exclusions get stronger** — memorial sites must never appear as a swipe candidate, in a suggestion tray, or in a match result (D33)

`coords` is `[longitude, latitude]` — GeoJSON order, matching Mapbox. Getting this backwards is the classic bug; the bbox check in the schema catches it at build time because Cambodia's longitude and latitude ranges do not overlap.

## Query surface

`src/lib/spots/index.ts` — `getAllSpots`, `getSpotBySlug`, `getSpotById`, `getSpotsByCity`, `getPairedSpot`, `getAlternativesTo`.

`src/lib/scoring.ts` — `sortSpots(spots, mode)` is the single entry point for ordering; `sortByOffRadar` is the default everywhere. `offRadarBand()` maps a score to the label the meter shows.

**CHANGES IN PHASE 3.** The entry point survives; what it sorts by does not. `sortByOffRadar`, `sortByPopularity` and `offRadarBand` are removed with the score (D28), and the signature gains an explicit instant so ordering stays a pure function of its inputs rather than reading the clock — `sortSpots(spots, mode, ctx?)`.

## Client state

`src/store/filters.ts` (Zustand): `city`, `categories[]`, `sort`, `selectedId`, `hoveredId`. Consumed only by `DiscoverView`; the map and cards take props. Initial `sort` is `"off-radar"`.

~~and must stay that way~~ — **this is the claim the pivot reverses.** It was the product's central rule, written here and in `CLAUDE.md` hard rule 3 as something that must never change. D28 changes it: the default becomes "open now". The reversal is recorded rather than edited away, because a reader who remembers the old rule needs to find out here that it is gone and why.

## Environment

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | No | Mapbox public token. Absent → the map renders an explanatory placeholder and everything else works (D11). |

Documented with setup and cost-control steps in `.env.example`.

## Not yet built

No API routes, no database, no auth, no realtime channels.

**Phase 3 adds exactly one**, and it is deliberately the smallest thing that makes voting exist (D30): a key-value store with two operations — append a vote, read the votes. No accounts, no user table, no schema. The room id is the secret, and a 24-hour TTL makes "v1 has no history" architectural rather than a policy. It belongs in this document when it lands, along with its spend cap.

Accounts, a real database and realtime channels move to Phase 4.
