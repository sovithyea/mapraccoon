# Progress — MapRaccoon

Running ledger. Updated at the end of every working session so state survives across sessions.

**Last updated:** 2026-08-29 (eighth session — real content, the landing page rebuilt, palettes, link previews)

## Where things stand

**The product pivoted on 2026-08-29, and Phase 3 has shipped it.** It was a discovery-first tourist guide to Cambodia; it is now a tool for friends who live in Phnom Penh to decide where to go out together. Read `docs/PIVOT.md` before this file makes sense.

**The loop works end to end and is on `main`.** Build a shortlist on `/discover`, press *Ask the others*, share the link, everyone marks yes/maybe/no, it settles. Verified with two browser tabs, one with every websocket blocked to prove the poll carries it.

**It has content now.** 87 places: 82 bars, restaurants and cafés imported from Google Places, the three markets, and the two memorials. **Nobody has used the thing for real** — that is still the gap, and it is the only one that matters.

**The landing page was still the old product until the eighth session, and that was not a copy problem.** It said "forty-two places across four cities, ranked by how far off the radar they are" above 84 places in one city with the score deleted; both maps rendered as empty grids because the projection was still framed on Cambodia; the legend under one of them was nine invisible colour chips; and the landing scatter plotted Choeung Ek under a headline about planning a hangout. Five shipped defects, C27–C31, none of which any test or type would have caught. See `docs/VERIFIED.md`.

**Phase 2 (Itinerary builder) is merged. Phase 1 (Foundation) is complete, and was executed out of order.** The scaffold, content schema, 42 curated spots, off-radar sorting, the map with its token-missing fallback, the i18n structure, the landing page and the test suite are all in and green. `npm run build`, `lint`, `typecheck` and `test` are clean; 50 pages generate statically; the dev server serves them.

**The process deviation is the thing to know about.** Code was written before `specs/1-foundation/spec.md` existed, which breaks this repo's core working rule. The user's call was to keep the work and back-fill the docs rather than revert. So the Phase 1 spec documents a phase already executed, and D14 records the deviation. **Phases 2 onward follow the rule.**

**What is genuinely not done in Phase 1:** the content is unverified (R1), the community claims are unconfirmed with the organisations named (R4), and the map has never been seen rendering pins because no Mapbox token exists yet. Those are tracked, not hidden.

## Phase status

**Claim a phase before starting it** — put your name in Owner and set Status to "In progress", then commit and push that on its own. See `docs/WORKFLOW.md`.

| # | Phase | Docs | Branch | Owner | Status |
|---|---|---|---|---|---|
| 1 | Foundation | ✅ spec + plan (back-filled) | merged to `main` | Vithyea | **Complete** and merged. The R1 content-verification pass is still outstanding and blocks any public launch (B2) |
| 2 | Itinerary builder | ✅ spec + plan | merged to `main` | Vithyea | **Complete** — merged via PR #1, then to `main` with Phase 1. Criterion 9 still open (needs a token, B1); the builder has not been driven click-by-click in a browser |
| 3 | Friends platform | ✅ spec + plan | merged to `main` | Vithyea | **Complete and merged** via PR #3, all 17 criteria closed. Venue content (B9) is outstanding and is the only thing between this and real use |
| 4 | Content + finish | — | `phase/4-content` | Vithyea | **In review.** 87 places, the landing page rebuilt around the actual product, four palettes (D38), the markets restored (D39), Open Graph previews. Not merged |
| 5 | Standing groups | — | `phase/5-groups` | — | Not started — needs Phase 4 merged and real use |
| 6 | Content at scale | — | `phase/6-content` | — | Not started — driven by R8 |

## Open blockers

| # | Blocker | Blocks | Owner |
|---|---|---|---|
| B1 | No Mapbox account or token exists | Verifying pins render and click/hover sync. **No longer blocks Phase 2** (D22) | User |
| B2 | ~~Content unverified on the ground (R1)~~ | **Largely closed by the pivot.** Residents self-correct crossing their own city; what replaces it is staleness, tracked as R8 | — |
| B3 | ~~Community-impact claims unconfirmed (R4)~~ | **Closed by D27.** All five named organisations are outside Phnom Penh and leave with their cities | — |
| B4 | No Khmer typeface loaded; Playfair and DM Sans have no Khmer coverage (R6) | **Launch (D32).** Dropping Khmer support entirely was raised on 2026-08-29 and **deferred, not decided** — the plumbing (`{en, km?}`, the `[locale]` segment) stays until it is | Design |
| B5 | Nothing is deployed | First public URL. **In progress** — Vercel project exists, `phase/4-content` is pushed but not merged, and the environment variables are being set. Deploy readiness verified against a production build: `npm run start` serves, the vote API round-trips, no secret in the bundle. What remains is on Vercel, not in the repo — see *Before the first deploy* below | User |
| B10 | ~~Supabase votes table~~ | **Closed.** Table created, RLS verified denying the anon key both read and write, Realtime broadcast reaching an anon subscriber | — |
| B6 | ~~Design direction for Phase 2 was out with Claude Design~~ | **Closed.** Returned, implemented and merged. Note it was produced against a stale commit and its colours are pre-D21 — do not take hex values out of that file | — |
| B7 | ~~No schema field marks a memorial site (C17)~~ | **Closed in Phase 2 by D25.** But R9 got *worse* at the pivot, not better — see D33 | — |
| B8 | No photographs, and voting between four bars from text alone is untested (R11) | A real v1 with real friends. No solution chosen | User |
| B9 | ~~Eleven tourist landmarks, no venues~~ | **Partly closed.** 82 real bars, restaurants and cafés imported across six neighbourhoods. **The blurbs are derived, not written**, and every hour is `hoursSource: "imported"` — fetched, never checked. Replacing those one at a time is the remaining work | User |
| B11 | ~~No Google Places key~~ | **Closed.** Key works; a BKK1 bar import returned 20 venues that all parse | — |

### Before the first deploy

Verified locally on 2026-08-29 against a real production build (`npm run build && npm run start`): `/`, `/en`, `/en/discover` all 200; `POST /api/room/<malformed>` 404; `GET /api/room/<valid unused>` 200 `{"votes":[]}` — so Supabase is reachable from a production build; `npm run check:secrets` clean. Share links are built from `window.location.origin`, so they are correct on any host including a preview deployment; there is no hardcoded origin anywhere in `src/`.

Four things are **not** verified because they live on Vercel and Mapbox rather than in this repo, and none of them can be checked from here:

1. `phase/4-content` is pushed but not merged. Vercel builds a branch — if the project builds `main`, none of the eighth session's work is in the deployment.
2. Four environment variables. `NEXT_PUBLIC_MAPBOX_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_KEY` **without** the prefix. C24 is the record of what the last mix-up of those two Supabase keys cost.
3. The Mapbox token's URL restrictions must include the deployed host, or the map dies in production. Mapbox has no hard spend cap (R3), so an unrestricted token is also a billing exposure.
4. `supabase/migrations/0001_votes.sql` must have run on whichever Supabase project those keys point at. If Vercel points at a different project than the local one, every vote 502s.


## Next session should

1. **Write venue content (B9).** This is the only thing between a working product and using it. `GOOGLE_PLACES_KEY=... node tools/import-places.mjs bkk1 bar` drafts twenty entries; blurbs come out as `TODO` because that field has to be a person's. Twenty places you actually go beats eighty you cannot vouch for.
2. **Try it with real friends on a real Friday.** Everything below is verified mechanically and nothing is verified as *good*. D31 sets the bar at "better than someone typing where should we go tonight", and that is not a bar a test can clear.
3. Choose a Khmer face and check the layout at Khmer line heights **before** filling `km.json` (B4, D32). Phase 3 added more English strings, so the gap grew again.
4. Rebuild the landing page. It is a shell — D28 and D29 removed what it argued and nothing replaced it.
5. Decide on photographs (B8, R11). Voting from text works mechanically; whether people will do it is untested.
6. Trim the dictionary passed into client components — ~10.7 KB, including copy for pages the reader is not on.

## Session log

**2026-08-29** — Read the brief. Scaffolded Next 16 + TS strict + Tailwind v4 + Vitest. Wrote the zod content schema and 42 hand-curated spots across four base cities. Built off-radar sorting, the Zustand filter store, the Mapbox map with a token-missing fallback, destination and city pages, and the i18n structure. Found and fixed two scaffold defects (C1, C2 in `VERIFIED.md`). Adopted the `docs/` + `specs/` convention from `rocket/athena` and `ass-hub/foodraccoon` after the user asked why it was missing; back-filled this doc set. Read `themapcambodia.com`'s rendered HTML and rebuilt the landing page in its editorial register with our own identity and our own inversion (D16). 20 tests green, build clean, 50 pages static.

**2026-08-29 (second session)** — Read the competitor's homepage HTML the user supplied. Its inlined RSC payload carried their whole `en.common` bundle, including a ~250-place catalogue; two of the brief's V2 differentiators already ship on their site, and their trip planning is editorial rather than a tool (D18). Rebuilt the landing page in their editorial register with our own identity and inversion (D16, D17). Then ran a mobile pass over CDP: found and fixed a 630px-wide home page at a 390px viewport caused by a single `truncate` (C8), cities unreachable on mobile (C9), the map buried below 42 cards on `/discover` (C10), and undersized touch targets throughout. Checked in `tools/probe.mjs` and `tools/shot.mjs` so the check is repeatable (D19). Clean at 320/390/768; 20 tests, build and lint green.

**2026-08-29 (third session)** — User said the colouring was not good. Measured it: the first palette collided twelve ways, including `--forest-mid` and `--cat-nature` being literally the same colour, and failed WCAG AA twice. Root cause was structural — ten colours competing for meaning on one page — so category colour was cut to the map's pin layers only and the cities moved off the brand green and gold (D21). Each city gained a separate `-ink` variant for marks and text, since fills stay dark in both modes. Auditing dark mode for the first time found two near-invisible text defects (1.15:1 and 2.46:1). Added `tools/contrast.mjs`, which itself produced false failures twice before it was right (C15). Now 0 contrast failures across four routes in both modes, minimum role separation ΔE 29.2.

**2026-08-29 (fourth session)** — No application code. The user supplied the competitor's spot-page, city-hub and `/plan-my-trip` HTML, closing B6, and their footer was checked in a browser. The teardown is now `docs/COMPETITOR.md` rather than session context that evaporates. Wrote a design brief for Claude Design grounded in measured values rather than the doc set: the tokens read out of `globals.css`, and the responsive system read out of the components — no custom breakpoints, and in practice a two-breakpoint design (43 `sm:`, 32 `lg:`, 2 `md:`, 1 `xl:`, no `2xl:`). Scope was cut to the Phase 2 itinerary builder and the spot page; the Phase 4 collaborative screens were deferred, since designing them now means designing against a data model three phases out. Three corrections recorded: `DESIGN-SYSTEM.md` generalised the pairing rail's snap behaviour to all three rails (C16, doc fixed); R9's memorial rule has no schema field behind it and is enforced only by the prose (C17, now B7); and the footer's unverified-content caveat — the sentence R1 and R4 rest on — is the least prominent text in the footer at `text-xs text-muted` in the last of four columns (C18). Nobody softened the wording; the layout softened it.

**2026-08-29 (fifth session)** — Phase 2 built from a Claude Design direction document, spec first this time. The design had been produced against a stale commit (`0ffa5b7`, one before the palette rebuild), so its token values and its whole dark-mode audit measured colours that no longer exist; the layout survived and the colours were taken from the CSS instead. D22–D25 accepted, `BUILD-PLAN.md`'s Phase 2 row corrected to match D22.

Shipped: the memorial flag (`sensitive: "memorial"`) with a build-time refinement, travel estimates, the day budget, the Zustand route store with reordering and URL-encoded sharing, the timeline, the day frame bar, the tail row, the priced add affordance, the dock bar and sheet, the `[Map | Route]` pane on `/discover`, and the spot page's reading order plus the C18 caveat move.

Four defects found, three of them only by running it rather than reading it. The schema refinement caught a live R9 violation in Phase 1 content — Kamping Puoy was paired to Phnom Sampeau (C19). The flat 22 km/h speed constant turned a 40-minute drive into 1h 50m (C20). `MapPlaceholder` was printing `NEXT_PUBLIC_MAPBOX_TOKEN` to travellers in what is the site's default state (C21). The suggestion tray offered other cities' spots at "28h 20m over" (C22).

67 tests across 8 files, build/lint/typecheck clean, 51 static pages, 0 overflow at 390/768/1280 across four routes, 0 contrast failures in both modes.

**2026-08-29 (sixth session — the pivot)** — No code. The product changed: from a discovery-first tourist guide to Cambodia to a tool for friends who live in Phnom Penh deciding where to go out. Documented in `docs/PIVOT.md` and D27–D34, superseding ten earlier decisions.

The three calls that took the most argument. **The off-radar score is removed entirely** (D28) — not demoted, removed, because for a resident "almost nobody goes here" describes an empty bar rather than a find, so the signal inverts rather than weakens. That reverses `CLAUDE.md` hard rule 3 and `INTERFACES.md`'s "must stay that way", both of which said it could never change. **Voting cannot work client-only** (D30): a URL is one-way, so N voters produce N isolated states with no merge point, and the zero-backend fallback silently loses a vote whenever two people vote off the same link. One 24-hour KV store is the minimum that makes the feature exist. **The memorials stay** (D33), against a recommendation to drop them — so R9 gets worse, and every new surface needs an exclusion enforced by schema or test rather than by prose.

Risk re-scoring found the pivot trades two content risks for two harder product risks: R1 and R5 improve, R2 and R4 become moot, but R6 (Khmer) becomes a launch blocker because the audience is majority Khmer-speaking by construction, and R11 (photographs) becomes near-blocking because voting between bars from text alone is untested. R8 arrives much sooner: 80+ venues that close and change hours cannot live in a TypeScript module.

Also fixed two staleness bugs in `CLAUDE.md` that predate the pivot: the decision range said D1–D21 against 26, and the status line said Phases 2–7 had no docs against a merged Phase 2.

**2026-08-29 (seventh session — Phase 3 built)** — The pivot, executed. Spec first, then eleven steps: deleting the tourist model, fixtures, the hours system, the venue schema and neighbourhoods, open-now sorting, vote logic, the Supabase store, the voting screen, and the loop that joins them. All seventeen acceptance criteria closed with evidence in `VERIFIED.md`. 133 tests, up from 70.

**The product works end to end**: build a day on `/discover`, press *Ask the others*, share the link, everyone marks yes/maybe/no, and it settles — `DECIDED / Central Market / Nobody objected.` Verified with two independent browser tabs, one of them with every websocket blocked to prove the polling fallback carries it.

Six defects found, and five of them only by running the thing rather than reading it. C23: the theme toggle had been logging a hydration mismatch on every page since it shipped, and nobody had read the dev log. C24 is the worst — acceptance criterion 13 grepped the build for whatever `SUPABASE_SERVICE_KEY` contained, so when the two Supabase keys were swapped it passed while the real secret sat in a `NEXT_PUBLIC_` variable. A check that depends on the thing it checks is not a check. C25: `VoteScreen` read `localStorage` during render, and React recovered into a state where the button was disabled over an input that visibly showed a name — unusable, and perfect in a screenshot. C26: nine dead links in the chrome of every page, because a route and its inbound links were deleted in different steps.

What is not done is the half that matters now. The seed file still holds eleven tourist landmarks — no bars, no restaurants (B9) — so every flow above was exercised against markets and temples. The importer works and was checked against twenty real BKK1 bars, but nothing has been written in. Khmer is untouched and grew worse. Nothing is deployed.

**2026-08-30 (ninth session — the vote flow, checked with more than one person)** — The user asked whether the vote flow actually works *with friends*, and for the instructions to be shown rather than described. It works: a ballot built by hand, four voters POSTed to the live store, and the screens driven end to end in headless Chrome settled on a winner, a runner-up, a two-stop plan and a dissent count.

Four defects, all of which need a second person or a returning one, which is why a single pass through the flow read as fine. **C32 is the one that matters**: a second vote from the same person counted twice — 4 names, 5 rows, a candidate tallying `4 · 1 · 0` — and it was *known*, written into `SECURITY.md` as an accepted limit and asserted by a test called "counts each voter once even if they submit twice" that asserted `yes` was `2`. The name said the opposite of the assertion, and that is how it passed review. It compounded with C33: reopening a ballot offered only "Start voting", so checking the result meant re-marking every card, which meant re-voting. The person most likely to look was the person most likely to be counted four times. C34: "{n} voted so far" silently meant "the others" then "the others and me". C35: `stops` reached `VoteResult` and no screen a voter ever sees.

Fixed by D40 — upsert on `(room_id, voter)`, plus the same rule in `resolve` where the suite can test it without a database. **The migration is written and NOT applied**, so `appendVote` falls back to remove-then-insert on `42P10`; without that fallback the upsert 502s every write against a database still on 0001, which was verified by doing it.

Two things came from the user reading the screens. The `/discover` map was building an **18,019px-tall canvas** — `h-full` against a column sized by 87 cards — so it painted as a small tile with its own pins trailing down the page below it (C37). Now `822 × 748`. And ten strings presumed the group was going out at night, on a product whose dataset includes cafés and whose day frame opens at 08:00 (D41).

Also: the "How it works" section was three paragraphs asking a first-time reader to picture a link fanning out to four phones; each step now carries a drawing, token-driven so it follows all four palettes and both themes.

194 tests across 17 files, build/lint/typecheck clean, 0 overflow at 390/768/1280.

Then two more of the user's asks landed in the same session.

**The landing page has a real map** (D43). The constellation was a six-by-six graticule the user called "a blank nothing with dots on it"; it now draws the Chaktomuk confluence underneath the venues, so Riverside reads as the bank and Chroy Changvar as the cluster across the water. Imported from OpenStreetMap by `tools/import-water.mjs` rather than drawn from memory — 9.5 KB for 13 river rings and 5 islands, clipped to the query box so no force-closed chord crosses the frame, and projected at render time by the same `projectInto` the dots use so the two cannot drift apart. Not Mapbox: D11's token-less state is the repo's default, and a hero image that goes blank without an account is worse than no hero image.

**Browsing moved into a picker** (D42). Search matches name, blurb, neighbourhood and category, so "bkk1" and "coffee" both work. Driven end to end: autofocus, scroll lock, Escape, multi-add, and the day intact on the other side.

That surfaced C38, which is the one to read. **The picker offered Tuol Sleng** — a memorial with an *Add* button beside a hotpot restaurant — because it matched a search for its own neighbourhood. C19's shape on a new surface and C30's cause exactly: `sensitive` exists and a component written after D33 did not consult it. Now filtered through `plottableSpots()` and enforced by a mutation-checked test.

201 tests across 19 files, build/lint/typecheck clean, 0 overflow at 390/768/1280 including with the picker open.

**Where to pick up.**

1. **Migration `0002` still has to be run against the Supabase project.** The app works without it — `appendVote` falls back to remove-then-insert on `42P10` — but with two round trips and a race that the index closes.
2. **C39, which is a decision rather than a bug to fix quietly.** `/discover`'s own list still offers memorials with an *Add* button, so Choeung Ek can go into a day and then be silently stripped by `createBallot` at ballot time. The picker beside it now excludes them, so two adjacent surfaces disagree. Removing memorials from `/discover` changes what that page is, and D33 kept them on purpose — this needs a call, not a patch.
3. **Draggable timeline blocks**, still not built: the user wants to move a stop to a chosen time rather than accept the packing. The two evening-presuming defaults belong with it — `StartVote` fixes every ballot at 20:00 and the day frame opens at 08:00, and D41 deliberately left both alone because they are behaviour, not copy.

**2026-08-30 (tenth session — the map, the picker, the timeline)** — Three of the user's asks, in one pass.

**`/discover` is one pane** (D45). The 26 rem list column is gone; a toolbar carries the search trigger and the `[Map | Route]` tabs over a full-width pane. That column was the cause of C37 and the reason there was nowhere to put a search field. It took a consequence with it, recorded before shipping rather than found later: **C40 — nothing in the product now links to a memorial spot page.** The list was the last route to them. Smaller than the wrong C39 describes, but open.

**The landing page draws a real map** (D43, extended). `tools/import-basemap.mjs` pulls five layers from OpenStreetMap in one query — rivers and their islands, lakes, parks, and roads in two weights — 37 KB after clipping, sliver-dropping, per-layer simplification and rounding to four decimals. Not Mapbox, deliberately: D11's token-less state is the repo's default and a hero that goes blank without an account is worse than no hero. Two importer bugs found by looking at the output rather than the code — Overpass 406s a request with no User-Agent, and the first park threshold was set at nearly four hectares, which is larger than every park in Phnom Penh and silently emitted an empty layer. The basemap test now asserts every layer is non-empty for exactly that reason.

**Stops can be pinned to a time** (D44). Drag the block on the day bar, or type into the time cell. A pin is honoured *exactly* rather than clamped, and the schedule reports the consequence — `slackMins` positive is time to kill, negative is an overlap, and the leg row says which. Unpinning is a visible control. This forced the day bar off flex: contiguous blocks *encoded* the packing assumption, and a drawable gap is what makes a pin expressible. Verified by driving a real drag over CDP — a block moved 10:05 → 11:30, only that stop pinned, the one after it reflowed to 13:15, and the leg row read "1h 25m spare before this".

Two defects in my own first attempt, both found by looking at the rendered page: the time cell clipped `<input type="time">` to "08:3(", and a browser set to en-US drew "01:15 PM" directly above a departure reading "14:45" — one row, two clock conventions. The cell now shows `clock()` and swaps to the native input only while editing.

206 tests across 19 files, build/lint/typecheck clean, 0 overflow at 390.

**Where to pick up.**

1. **Migration `0002` still has to be run against Supabase.** Voting works without it via the `42P10` fallback, with two round trips and a race.
2. **C39 and C40 together are one decision, not two patches.** Memorials are excluded from every going-out surface and now unlinked entirely, while `/discover`'s map still draws their pins. Someone should decide what a memorial's place in this product is, post-pivot, and make every surface follow it.
3. The day frame still opens at 08:00 and `StartVote` still fixes ballots at 20:00. Pinning makes both editable per stop, but the *defaults* are still the evening-presuming ones D41 left alone.

**2026-08-30 (eleventh session — the map is the surface)** — The user sent a screenshot of an empty box where the map should be, and a reference: FoodRaccoon's full-bleed Mapbox with pins.

**The blank pane was a regression I had just shipped (C41).** The tab worked, the box measured 483 px, and the Mapbox div inside it measured **0** — `height: 100%` against a flex item whose height comes from `flex-grow`, which is indefinite, so the percentage resolved to auto. It is C37's mirror image: that one gave the map 18,019 px from an unbounded parent, this one gave it none from an indefinite one, and both looked to a reader like the map was simply missing. Fixed with `relative` + `absolute inset-0`.

**Pins now open the place** (D46). A card with name, neighbourhood, price and open-now, and a link through to the spot page. Bounds are fitted to the venues rather than every pin — Choeung Ek is 15 km south and fitting all 87 squeezed the city into the top third of the frame, which is C30 biting a second surface. A second defect found by driving two clicks in a row: Mapbox counts a click on another marker as an outside click, so selecting a second pin closed the popup rather than moving it (C42).

**D46 is the answer to the C39/C40 question** rather than another patch. The line is **offer versus show**. Offering — the picker, the tray, a ballot — never includes a memorial, enforced by tests. Showing is the map, which draws every pin because it is a map and not an invitation, and which is now the only route to a memorial's page. How a memorial reads in that card is part of the decision: name, neighbourhood, link, and no price row or open-now badge, because the card is exactly where the two registers would collide. Mutation-checked — adding a price row to the memorial branch fails the suite.

209 tests across 19 files, build/lint/typecheck clean, 0 overflow at 390.

**Where to pick up.**

1. **Migration `0002` still has to be run against Supabase.** Everything else on this list is code; this one is not, and it is the only outstanding item that needs an account.
2. The day frame still opens at 08:00 and `StartVote` still fixes ballots at 20:00 — the last two evening-presuming defaults D41 left alone.
3. The map popup was checked in dark mode — computed `#171b16` on `#ece5d8`, straight from the tokens. It has **not** been checked in the three non-default palettes; the CSS is token-driven so it should follow, but that is an expectation rather than an observation.
