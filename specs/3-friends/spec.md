# Phase 3 — Friends platform

The pivot, executed. Read [`docs/PIVOT.md`](../../docs/PIVOT.md) first; this spec assumes it.

## Context

Phases 1 and 2 shipped a discovery-first tourist guide to Cambodia with a single-day itinerary builder. Phase 3 turns it into a tool for **friends who live in Phnom Penh** deciding where to go out together.

The organising idea is not editorial. It is that the product **resolves an argument five people are having in a group chat**: someone shares a link, everyone votes on candidates for a slot, and it settles. The venue data is fuel for that (D29).

The competitor is the group chat — zero friction, already installed, and genuinely bad at converging on a decision (D31). The bar is *"better than someone typing where should we go tonight"*, and it has to be cleared on the first use.

## Current state before this phase

- `main` at `dffd5ee`. Build, lint, typecheck and 70 tests green; 51 static pages.
- 42 spots across four cities. **Eleven are in Phnom Penh and every one is a tourist landmark** — Royal Palace, Central Market, Wat Phnom, two memorials, four out-of-town temples. No restaurants, bars or cafés at all (B9).
- `dayBudget()`, `estimateLeg()`, the route store, the timeline and the shared-day encoder all exist and carry over.
- No Mapbox token (B1). No Khmer typeface (B4). No photographs (B8).
- D27–D34 are accepted and documented.

## Proposed change

### Scope

One city. One night. Ad-hoc groups with no accounts. Standing groups and history are Phase 4.

### The venue schema

`spotSchema` changes substantially. Every field added is a per-venue authoring cost across 80+ venues, so the list is deliberately short.

**Added**

- `neighbourhood` — required enum, ~9 members: `bkk1`, `riverside`, `daun-penh`, `toul-tom-poung`, `toul-kork`, `chroy-changvar`, `koh-pich`, `sen-sok`, `out-of-town`. Under ten, or the filter row is unusable. **No colour tokens** — 9 × 2 tones would be 18 role colours, and D21 is the record of that mistake at less than half the scale.
- `hours` — required. See below.
- `priceLevel` — required, `1 | 2 | 3 | 4`. Bands documented once in the module header, not per venue. Replaces `entryFeeUsd`, which is meaningless for a bar.
- `lastVerified` — required, `YYYY-MM-DD`. Hours rot faster than anything else here; without a date you cannot tell a check from last month from one from 2023, and "open now" degrades into fiction invisibly.
- `links` — all optional: `maps`, `facebook`, `instagram`, `phone`. Phnom Penh venues publish hours on Facebook, not websites.

**Removed**

- `offRadar` (D28), `pairedWith` (D29), `entryFeeUsd`, `practical.bestTime` (it mostly restates the hours), and `city` (replaced by `neighbourhood`).

**Changed**

- `description` becomes **optional**. This is the single most important line in this spec: 80 venues × 2–3 paragraphs is 15,000–25,000 hand-written words, and that is the schedule risk most likely to kill the phase. A venue with a name, coordinates, neighbourhood, category, hours, price and a one-line blurb is fully functional. Write prose for the twenty places that deserve it.
- `categories` widens. Authored as a **specific tag**; the group is derived in code, never authored:

  ```
  Category = restaurant | street-food | cafe | bakery | bar | rooftop | night-market
           | live-music | cinema | gallery | karaoke | sport | swimming | games
           | temple | museum | market | nature
  CategoryGroup = eat | drink | do | see          (derived)
  ```

  Five filter chips that expand, not eighteen in a scrolling rail.

**Kept**

- `sensitive: "memorial"` and its refinement (D33), `community` as a field but not a mechanic (D29), `sources` at `min(1)`, `blurb`, `practical.typicalDurationMins` (load-bearing for `dayBudget`).

**Bounding box.** `CAMBODIA_BBOX` is replaced by a conditional check: a tight `PHNOM_PENH_BBOX` when `neighbourhood !== "out-of-town"`, the country box otherwise. This is a real upgrade — the country box would happily accept a typo that lands a bar in Kandal province.

### Opening hours

A discriminated union, authored as `"HH:MM"` strings, normalised to minutes at parse so everything downstream sees integers only.

```
hours = { kind: "always" }
      | { kind: "unknown", why?: string }
      | { kind: "weekly", rules: Rule[], note?: LocalizedText }

Rule = { days: DayToken[], open: "HH:MM", close: "HH:MM" }
```

- **Absent day means closed.** Most venues close one day a week; stating it should cost zero keystrokes.
- **`close <= open` means past midnight**, normalised to `+1440` at parse. A rooftop bar is `{ days: ["fri","sat"], open: "17:00", close: "02:00" }`. No `crossesMidnight` flag — the flag is the thing authors get wrong.
- Split shifts are two rules with the same days.
- **`kind: "unknown"` is load-bearing.** Without it an author who cannot find hours will invent them, and the feature becomes a liar at exactly the moment it matters. It requires `links.facebook` or `links.maps` so the UI always has an escape hatch, and it lets thirty venues be added today and filled in later.
- Rejected at parse time: overlapping rules for one day, `open === close` (ambiguous between 24h and closed), and a rule spanning more than 24 hours.

**Public holidays are not modelled per venue.** Roughly fifteen Cambodian dates a year, several lunar and therefore moving, and a per-venue boolean is eighty guesses that go stale invisibly. One module-level list plus a global banner — *"It's Pchum Ben. A lot of these will be closed; check before you go."* One piece of copy, zero per-venue cost, honest.

### "Open now"

**The primitive is `isOpenAt(hours, instant)`, not `isOpenNow(hours)`.** Then "open now" is one call and "we're deciding for Friday 8pm" gets its filter free instead of a second code path.

- `src/lib/hours/open.ts` — pure and clock-free. `isOpenAt` returns `open | closing-soon | closed | unknown`. The past-midnight case is handled by checking *yesterday's* rules at `mins + 1440` as well as today's; that is four lines and the thing to test hardest.
- `src/lib/hours/now.ts` — the **only** module in the repo that reads the clock. Cambodia is UTC+7 with no DST, so a fixed offset is exact and cheaper than `Intl`, and it means a friend deciding from Bangkok still sees Phnom Penh hours (D34).
- `sortSpots(spots, mode, ctx?)` gains a context object rather than a bare parameter, so adding `distance` later does not churn the signature twice. It stays pure.
- Order within `open-now`: **open → closing-soon → unknown → closed**, then by name. `unknown` above `closed` matters — an unknown-hours venue is likelier open than a known-closed one, and burying it would punish exactly the entries not yet finished.

**Hydration.** The pages are statically generated, so any open/closed state in server HTML is computed at *build* time and will disagree with the client. Open state renders only after mount, behind a `useNow()` that returns `null` on first render. One frame of shift, which is honest. **Never `suppressHydrationWarning`; never `force-dynamic`** — the latter trades a free static site for a server bill and still gets the server's "now".

`useNow` re-ticks on a 60-second interval **and** on `visibilitychange`. A phone left open from 22:55 to 23:10 must stop saying "open".

### Voting

**A URL is one-way, so this needs a server** (D30). It is **Supabase with Realtime**, not a hand-rolled key-value store (D35) — Phase 4 needs Supabase regardless, and live votes are plausibly what clears D31's "better than the group chat" bar.

```
votes  ( room_id, voter, marks, created_at )

POST /api/room/:id   { voter, marks }   → insert, then broadcast
GET  /api/room/:id                      → { votes }        (load, and fallback)
Realtime Broadcast on channel `room:<id>`                   (live updates)
```

**The write path holds the service key server-side.** The route validates the room id and inserts; the key never reaches the browser and no RLS policy is in the write path.

**The read path uses Broadcast, not `postgres_changes`.** A `postgres_changes` subscription would need an RLS policy expressing "knows the room id", which is not an auth claim and is the shape of policy people get wrong. Broadcast keeps table reads away from the anon key entirely. The channel is named by the room id, which stays the secret — 128 bits, unguessable, the same model the share links use.

- **A dropped socket must degrade to the fetch path, not to a screen that silently stops updating.** A vote that lands and is never shown is worse than having no live updates at all.
- **24-hour expiry is a scheduled delete**, because Postgres has no TTL. It is what makes "v1 has no history" architectural rather than a policy someone has to remember, so it is built, not intended.
- **No auth, no accounts, no group membership, no RLS design.** Phase 4. A login before anyone has seen the thing work once is the wrong order.
- **The ballot stays in the URL.** The store holds only votes. The candidate list is never a row, the link is self-describing, and the store can be wiped without losing anything an organiser cannot regenerate by re-sending their link.
- **The spend cap goes in on day one**, per hard rule 6's own last sentence.
- **Free-tier projects pause after a stretch of inactivity.** Weekly use is fine; a longer gap means a cold start on the evening someone is trying to use it. Verify the current threshold.

`resolve(ballot, votes)` is a **pure function** in `src/lib/vote/resolve.ts` — no I/O, so it is testable without infrastructure and the zero-backend fallback stays viable.

- **Approval voting**, not ranked choice. Five friends and six options do not need IRV, and ranking six bars is more work than the decision is worth. Approval's failure mode is a bland consensus pick, which is exactly what a group deciding where to go actually wants.
- Marks are `yes | maybe | no`.
- **No hard veto.** One "no" must not kill an option, but the result surfaces it: *"Winner: X. 2 people said no."* A silent veto produces arguments; a visible dissent count produces a conversation.
- Tie-break: most yes → fewest no → open at the slot → lowest total travel.

### Memorial sites (D33)

They stay, so the exclusions must be enforced rather than remembered. A `sensitive` spot must never appear:

- as a swipe candidate on a ballot,
- in a suggestion tray,
- in a match result.

Each has its own acceptance criterion below. None may be upheld by prose — C19 is the record of what happens when this rule depends on care.

## Acceptance criteria

Seventeen. Each closes in `docs/VERIFIED.md` with the evidence, not an assertion.

1. `npm run build`, `lint`, `typecheck` and `test` clean.
2. The dataset is Phnom Penh only; the tight bbox rejects a coordinate outside it unless `neighbourhood` is `out-of-town`.
3. `isOpenAt` returns a defined state for every venue across a full 7 × 24 sweep, including every past-midnight rule.
4. The hours suite uses **no fake timers** — every assertion passes an explicit instant.
5. A venue with `hours.kind: "unknown"` fails to parse without a `links.facebook` or `links.maps`.
6. `lastVerified` is never in the future. A separate **warn-only** check flags entries older than six months — never fail the build on a calendar date with no code change.
7. `/discover` defaults to open-now ordering, and server and client agree at first paint (no hydration warning in the console).
8. `open → closing-soon → unknown → closed` ordering holds at a fixed test instant.
9. **A `sensitive` spot never appears as a ballot candidate** — test.
10. **A `sensitive` spot never appears in a suggestion tray** — test.
11. **A `sensitive` spot never appears in a match result** — test.
12. A ballot round-trips through a URL; three voters' marks resolve to one winner with a dissent count; `resolve` is called with no I/O in the test.
13. The room endpoint returns 404 for an unknown id and never enumerates ids, and the **service key is absent from the client bundle** — verified by grepping the build output, not by inspection.
14. A second browser sees a vote appear **without a refresh**; killing the socket degrades to the fetch path rather than to a screen that silently stops updating.
15. Rows older than 24 hours are deleted by the scheduled job — demonstrated, not asserted.
16. `tools/probe.mjs` reports zero horizontal overflow at 390 / 768 / 1280 on every route.
17. `tools/contrast.mjs` reports zero failures on every route, in light and dark, and under explicit `data-theme="dark"`.

## Out of scope

Accounts, authentication, group membership, history, "where haven't we been", RLS policy design, photographs, Khmer translation, moving venue content out of the seed file, and any deployment.

Supabase itself is **in** scope (D35), but only a `votes` table, one API route and a Broadcast channel. Everything else Supabase offers is Phase 4.

## Known incomplete on delivery

- **Khmer (R6, B4, D32) is a launch blocker and this phase does not fix it.** It adds more English strings.
- **Photographs (R11, B8).** Voting between four bars from text alone is untested and may not work. This phase will be the first evidence either way.
- Travel times remain estimates, labelled `est.` (D22).
- The seed file still requires a developer and a build to edit (R8). Phase 5.
- Venue hours are unverified editorial like everything else, now with a date attached so staleness is visible rather than silent.

## Decisions this phase proposes

None new. It executes D27–D34. Anything discovered along the way gets a fresh entry rather than an edit (rule 7).
