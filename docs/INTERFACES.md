# Interfaces — MapRaccoon

The surfaces this project exposes. Thin at Phase 1 by nature: there are no API routes, no database and no auth. Written now so the shape exists before the risk does (D13).

Verified against the Phase 1 build output on 2026-08-29, not transcribed from intent.

> **Rewritten on 2026-08-29, after Phase 3 shipped.** It previously described the tourist product with the changes marked as forthcoming. They have happened.

## Routes

All routes live under a locale segment. Only `en` builds today (D7).

| Path | Rendering | Purpose |
|---|---|---|
| `/` | Proxy redirect (307) | Sends bare paths to `/en` |
| `/[locale]` | SSG | Landing page. A shell since D28/D29 removed what it argued — the constellation and a community rail. Step 9 of the next phase rebuilds it |
| `/[locale]/discover` | SSG | The map and the filterable list, off-radar sorted|
| `/[locale]/spot/[slug]` | SSG, 11 paths | A venue: live open state (client island), the weekly table (server), practical info, map, sources. Memorial sites render a sober variant (D25, D33) |
| `/[locale]/vote/[id]` | Dynamic, `noindex` | A ballot, opened from a link. Carries its candidates, slot and room secret |
| `/[locale]/plan/[id]` | Dynamic, `noindex` | A shared day |
| `/api/room/[id]` | Dynamic | The vote store. `POST` appends, `GET` reads. The only server-side thing here (D30, D35) |
| `/_not-found` | Static | 404 |

16 pages generated. `params` is a `Promise` in Next 16 and is awaited in every one.

`src/proxy.ts` is the Next 16 proxy (**not** `middleware.ts` — see the Corrections table in `VERIFIED.md`). It does exactly one job today: redirect a bare or unknown-locale path to `/{defaultLocale}`. Its matcher excludes `_next`, `api`, `favicon.ico` and anything with a file extension.

## The content contract

`src/lib/spots/schema.ts` is the interface everything else is written against. It is the closest thing this project has to an API today, and it is what the Phase 3 Postgres schema will be derived from.

```ts
Spot {
  id, slug, neighbourhood, categories[], name, coords: [lng, lat],
  blurb, description?,            // optional — see the schema for why
  hours,                          // always | unknown | weekly, minutes after parse
  priceLevel: 1 | 2 | 3 | 4,
  lastVerified: "YYYY-MM-DD",
  hoursSource: "imported" | "checked",
  placeId?, links?: { maps?, facebook?, instagram?, phone? },
  sensitive?: "memorial",
  community?: { name, impact, url? },
  practical: { typicalDurationMins },
  sources: url[]   // min 1
}
```

Authors write `SpotInput`, where hours are `"HH:MM"` strings. `Spot` is the
parsed output, where they are minutes.

Invariants beyond the schema, enforced by `src/lib/spots/spots.test.ts`:

- `id` and `slug` are unique
- every coordinate falls inside `CAMBODIA_BBOX` = `[102.3, 9.8, 107.7, 14.8]`
- every `pairedWith.spotId` resolves, and never to itself
- a pairing always points at a **better-known** spot (lower `offRadar`)
- every city has at least one spot and at least one anchor (`offRadar < 30`)
- a `sensitive: "memorial"` spot cannot carry a pairing, rejected at parse time (D25). **The field stays in Phase 3 and its exclusions get stronger** — memorial sites must never appear as a swipe candidate, in a suggestion tray, or in a match result (D33)

`coords` is `[longitude, latitude]` — GeoJSON order, matching Mapbox. Getting this backwards is the classic bug; the bbox check in the schema catches it at build time because Cambodia's longitude and latitude ranges do not overlap.

## Query surface

`src/lib/spots/index.ts` — `getAllSpots`, `getSpotBySlug`, `getSpotById`, `getSpotsByCity`, `getPairedSpot`, `getAlternativesTo`.

`src/lib/scoring.ts` — `sortSpots(spots, mode)` is the single entry point for ordering; `sortByOffRadar` is the default everywhere. `offRadarBand()` maps a score to the label the meter shows.


## Client state

`src/store/filters.ts` (Zustand): `city`, `categories[]`, `sort`, `selectedId`, `hoveredId`. Consumed only by `DiscoverView`; the map and cards take props. Initial `sort` is `"off-radar"`.

~~and must stay that way~~ — **this is the claim the pivot reverses.** It was the product's central rule, written here and in `CLAUDE.md` hard rule 3 as something that must never change. D28 changes it: the default becomes "open now". The reversal is recorded rather than edited away, because a reader who remembers the old rule needs to find out here that it is gone and why.

## Environment

| Variable | Required | Exposed to the browser | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | No | Yes, by design | Mapbox public token. Absent → the map renders a designed placeholder with real coordinates and everything else works (D11). Restrict it by domain; Mapbox has no hard spend cap (R3). |
| `NEXT_PUBLIC_SUPABASE_URL` | Phase 3 | Yes | The vote store's project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Phase 3 | Yes, by design | Safe in the browser only because the read path is Realtime Broadcast on a channel named by the unguessable room id — the anon key never reads the table directly (D35). |
| `SUPABASE_SERVICE_KEY` | Phase 3 | **Never** | Bypasses every row-level policy. Used in one place: the route that validates a room id and inserts a vote. A build shipping this is a total compromise, so acceptance criterion 13 greps the build output for it. |
| `GOOGLE_PLACES_KEY` | No | Never | Read only by `tools/import-places.mjs`, run by hand. Not read by the app at all (D36). Restrict to the Places API and set a daily quota — a Cloud quota 429s past the limit, which is a hard stop rather than a bill. |

Documented with setup and cost-control steps in `.env.example`.

## Not yet built

No API routes, no database, no auth, no realtime channels.

**Phase 3 adds exactly one**, and it is deliberately the smallest thing that makes voting exist (D30): a key-value store with two operations — append a vote, read the votes. No accounts, no user table, no schema. The room id is the secret, and a 24-hour TTL makes "v1 has no history" architectural rather than a policy. It belongs in this document when it lands, along with its spend cap.

Accounts, a real database and realtime channels move to Phase 4.
