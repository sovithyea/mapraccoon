# Progress — MapRaccoon

Running ledger. Updated at the end of every working session so state survives across sessions.

**Last updated:** 2026-08-29 (seventh session — Phase 3 built)

## Where things stand

**The product pivoted on 2026-08-29.** It was a discovery-first tourist guide to Cambodia; it is now a tool for friends who live in Phnom Penh to decide where to go out together. Read `docs/PIVOT.md` before this file makes sense. The decisions are D27–D34; the docs are updated; **no code has changed and `specs/3-friends/` does not exist yet.**

**Phase 2 (Itinerary builder) is merged. Phase 1 (Foundation) is complete, and was executed out of order.** The scaffold, content schema, 42 curated spots, off-radar sorting, the map with its token-missing fallback, the i18n structure, the landing page and the test suite are all in and green. `npm run build`, `lint`, `typecheck` and `test` are clean; 50 pages generate statically; the dev server serves them.

**The process deviation is the thing to know about.** Code was written before `specs/1-foundation/spec.md` existed, which breaks this repo's core working rule. The user's call was to keep the work and back-fill the docs rather than revert. So the Phase 1 spec documents a phase already executed, and D14 records the deviation. **Phases 2 onward follow the rule.**

**What is genuinely not done in Phase 1:** the content is unverified (R1), the community claims are unconfirmed with the organisations named (R4), and the map has never been seen rendering pins because no Mapbox token exists yet. Those are tracked, not hidden.

## Phase status

**Claim a phase before starting it** — put your name in Owner and set Status to "In progress", then commit and push that on its own. See `docs/WORKFLOW.md`.

| # | Phase | Docs | Branch | Owner | Status |
|---|---|---|---|---|---|
| 1 | Foundation | ✅ spec + plan (back-filled) | merged to `main` | Vithyea | **Complete** and merged. The R1 content-verification pass is still outstanding and blocks any public launch (B2) |
| 2 | Itinerary builder | ✅ spec + plan | merged to `main` | Vithyea | **Complete** — merged via PR #1, then to `main` with Phase 1. Criterion 9 still open (needs a token, B1); the builder has not been driven click-by-click in a browser |
| 3 | Friends platform | ✅ spec + plan | `phase/3-friends` | Vithyea | **Code complete, all 17 criteria closed.** Step 5 (venue content) is outstanding and is the only thing between this and real use (B9) |
| 4 | Standing groups | — | `phase/4-groups` | — | Not started — needs Phase 3 and real use |
| 5 | Content at scale | — | `phase/5-content` | — | Not started — driven by R8 |

## Open blockers

| # | Blocker | Blocks | Owner |
|---|---|---|---|
| B1 | No Mapbox account or token exists | Verifying pins render and click/hover sync. **No longer blocks Phase 2** (D22) | User |
| B2 | ~~Content unverified on the ground (R1)~~ | **Largely closed by the pivot.** Residents self-correct crossing their own city; what replaces it is staleness, tracked as R8 | — |
| B3 | ~~Community-impact claims unconfirmed (R4)~~ | **Closed by D27.** All five named organisations are outside Phnom Penh and leave with their cities | — |
| B4 | No Khmer typeface loaded; Playfair and DM Sans have no Khmer coverage (R6) | **Launch (D32).** The audience is majority Khmer-speaking by construction, so this stopped being a scheduled defect. Phase 2 added ~60 English-only strings, so it grew | Design |
| B5 | Nothing is deployed; no hosting decided | First public URL | User |
| B10 | ~~Supabase votes table~~ | **Closed.** Table created, RLS verified denying the anon key both read and write, Realtime broadcast reaching an anon subscriber | — |
| B6 | ~~Design direction for Phase 2 was out with Claude Design~~ | **Closed.** Returned, implemented and merged. Note it was produced against a stale commit and its colours are pre-D21 — do not take hex values out of that file | — |
| B7 | ~~No schema field marks a memorial site (C17)~~ | **Closed in Phase 2 by D25.** But R9 got *worse* at the pivot, not better — see D33 | — |
| B8 | No photographs, and voting between four bars from text alone is untested (R11) | A real v1 with real friends. No solution chosen | User |
| B9 | `src/data/spots.ts` has 11 Phnom Penh places and every one is a tourist landmark — no restaurants, bars or cafés at all | All of Phase 3. `tools/import-places.mjs` drafts entries from Google Places (D36); blurbs and the hours that matter still need a person | User |
| B11 | ~~No Google Places key~~ | **Closed.** Key works; a BKK1 bar import returned 20 venues that all parse | — |

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
