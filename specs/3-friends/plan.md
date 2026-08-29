# Phase 3 — Friends platform: Execution Plan

Spec: [`specs/3-friends/spec.md`](spec.md)

Every step ends with `npm run build && npm run lint && npm run typecheck && npm test` green, so each is independently committable and the repo is never left broken.

**The ordering principle here is different from Phase 2.** Steps 1–4 are pure logic with tests and no UI, as before — but step 0 deletes a great deal, and doing the deletion *first* means every later step is written against the real shape rather than around a corpse. The content (step 5) is the long pole and is deliberately started early and in parallel.

## Step 0 — Claim, and clear the ground

- [ ] `docs/PROGRESS.md`: Phase 3 owner and status "In progress", branch `phase/3-friends`. Commit and push alone.
- [ ] Delete the 31 spots outside Phnom Penh (D27).
- [ ] Delete `offRadar` and everything that reads it (D28): `sortByOffRadar`, `sortByPopularity`, `offRadarBand`, `OffRadarMeter`, `OffRadarPanel`, `dayOffRadarAverage`, the `Constellation` dot-sizing.
- [ ] Delete `pairedWith` and everything that reads it (D29): `PairingCard`, `PairingRail`, `getPairedSpot`, `getAlternativesTo`, the pairing refinement.
- [ ] Delete the tests that assert the removed invariants (~26 of 70). **Keep `estimate.test.ts`'s seven haversine and speed-band tests** even though those journeys leave product scope — they are the only thing pinning the speed calibration down (C20).

The build goes red partway through this step and comes back. That is expected; it is one commit.

## Step 1 — Fixtures first

- [ ] `src/lib/spots/fixture.ts` — a `makeSpot(overrides)` factory.
- [ ] Move every route, store and estimate test onto it.

**Do this before anything else touches the schema.** Roughly fifteen Phase 2 tests broke during that migration not because logic changed but because they reach into the live dataset (`getSpotsByCity("kampot-kep").slice(0, 2)`). Fixing that once here stops it recurring on every future content change. Dataset-coupled assertions stay confined to `spots.test.ts`.

## Step 2 — Hours

- [ ] `src/lib/hours/schema.ts` — the zod union, `"HH:MM"` → minutes, past-midnight → `+1440`, and the three parse-time rejections (overlapping rules, `open === close`, a rule over 24h).
- [ ] `src/lib/hours/open.ts` — `isOpenAt(hours, instant)`, `nextChangeAt`. Pure, clock-free.
- [ ] `src/lib/hours/now.ts` — `phnomPenhNow(date = new Date())`. The only clock read in the repo (D34).
- [ ] `src/lib/hours/holidays.ts` — the date list.
- [ ] Table-driven tests at literal instants. **No fake timers.** Hardest case first: a Friday 02:00 lookup against a rule that opened Thursday 17:00.

## Step 3 — Schema and neighbourhoods

- [ ] `spotSchema`: add `neighbourhood`, `hours`, `priceLevel`, `lastVerified`, `links`; remove `entryFeeUsd` and `practical.bestTime`; make `description` optional.
- [ ] Widen `categories`; add `src/lib/spots/categories.ts` with the derived `CategoryGroup` map.
- [ ] `PHNOM_PENH_BBOX` plus the conditional check.
- [ ] `cities.ts` → `neighbourhoods.ts`, `CityId` → `NeighbourhoodId`, `getSpotsByCity` → `getSpotsByNeighbourhood`. **Drop `ink` and `fill` from the type**, and remove the eight city colour tokens from *both* dark blocks in `globals.css` — `globals.test.ts` asserts parity and will catch a half-edit (D26).

## Step 4 — Ordering, and the day

- [ ] `sortSpots(spots, mode, ctx?)` with `SortMode = "open-now" | "price" | "name"`. Still pure, still the single entry point.
- [ ] `useNow()` — `null` on first render, 60s interval, re-tick on `visibilitychange`.
- [ ] Route store: delete the `city` field and the "a day is one city" guard. **Bump the persist key to `mapraccoon:day:v2`** with a migration that drops it, or old localStorage rehydrates a field that no longer exists.
- [ ] `AddToDay`'s cross-city guard goes away entirely — a BKK1 bar and a Riverside restaurant in one night is the point.
- [ ] `fullThresholdMins`: drop the `a.city !== b.city` filter. `CAMBODIA_VIEW` → `PHNOM_PENH_VIEW`.

## Step 5 — Content (start now, finish last)

- [ ] **Start `src/data/spots.ts` fresh.** Do not edit the 11 existing Phnom Penh entries — they are tourist-voiced against a schema that no longer exists, and rewriting is cheaper than reconciling. Keep Tuol Sleng and Choeung Ek, rewritten, with `sensitive` (D33).
- [ ] Twenty venues to unblock the UI work. Then grow toward eighty.
- [ ] `description` only where it earns itself. Everything else ships on blurb, hours, price and neighbourhood.

**This is the long pole and it is not code.** It should run alongside steps 6–9 rather than gate them.

## Step 6 — Voting logic

- [ ] `src/lib/vote/ballot.ts` — encode and decode a ballot into a URL, following `share.ts`.
- [ ] `src/lib/vote/resolve.ts` — `resolve(ballot, votes)`. Pure, no I/O. Approval voting, `yes | maybe | no`, no hard veto, dissent surfaced, the four-way tie-break.
- [ ] Tests including the one that matters: **a `sensitive` spot is never a candidate** (criteria 9–11).

## Step 7 — Supabase, the route, and Realtime

- [ ] Create the project. **Spend cap and budget alert on the same day** (hard rule 6). Add `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (server-only) and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.example` with setup notes, as `NEXT_PUBLIC_MAPBOX_TOKEN` already has.
- [ ] `votes` table: `room_id`, `voter`, `marks`, `created_at`.
- [ ] `POST /api/room/:id` — validate the id, insert with the **service key server-side**, then broadcast on `room:<id>`. `GET` returns the votes for load and for fallback.
- [ ] Client subscribes to the Broadcast channel. **Not `postgres_changes`** — that needs an RLS policy expressing "knows the room id", which is not an auth claim and is the policy shape people get wrong (D35).
- [ ] Reconnection, and degrade to polling the `GET` when the socket is down. **Test the failure, not just the happy path** — a vote that lands and is never shown is the worst outcome here.
- [ ] Scheduled delete for rows older than 24 hours. Postgres has no TTL, so the property D30 wanted has to be built rather than intended.
- [ ] Verify the service key is absent from the client bundle.
- [ ] `docs/SECURITY.md` gains its first real content — it has been written to be filled in since Phase 1, and its "current state: no user data, no authentication, no database" claim becomes false at this step.

## Step 8 — The voting UI

- [ ] Ballot creation from the day builder.
- [ ] The vote screen: candidates for a slot, the mark gesture, one card at a time on a phone.
- [ ] The result: winner, dissent count, and what to do next.

## Step 9 — Discover, and the open-now surfaces

- [ ] Neighbourhood filter replaces the city filter; five category-group chips.
- [ ] `OpenNowBadge` as a client island on the spot page; the weekly table stays server-rendered.
- [ ] Delete `/city/[city]`; strip city nav from the layout header, mobile rail and footer.
- [ ] The holiday banner.

## Step 10 — Verify and document

- [ ] `tools/probe.mjs` at 390 / 768 / 1280 on every route.
- [ ] `tools/contrast.mjs` on every route, both modes, plus explicit `data-theme="dark"`.
- [ ] **Drive the vote flow end to end in a browser with three tabs.** Phase 2 shipped without a click-through and it is still the largest gap in it; do not repeat that here.
- [ ] Close every criterion in `docs/VERIFIED.md` with its evidence. Record any correction found on the way.
- [ ] Update `INTERFACES.md` (it is marked "CHANGES IN PHASE 3" throughout), `DESIGN-SYSTEM.md` and `PROGRESS.md`.
- [ ] PR per `.github/pull_request_template.md`.

## Verification

Criterion 12 is the one to watch — a ballot round-tripping through a URL and three voters resolving to one winner, with `resolve` called with no I/O. If that cannot be demonstrated, the phase has not delivered its point regardless of what else works.

The second is criteria 9–11. They are three separate tests on purpose: the memorial exclusions are the thing most likely to be quietly forgotten on a surface added later, and C19 is the record of exactly that happening.
