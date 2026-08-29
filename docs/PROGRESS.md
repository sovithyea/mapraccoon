# Progress — MapRaccoon

Running ledger. Updated at the end of every working session so state survives across sessions.

**Last updated:** 2026-08-29 (fifth session, Phase 2 merged)

## Where things stand

**Phase 2 (Itinerary builder) is merged. Phase 1 (Foundation) is complete, and was executed out of order.** The scaffold, content schema, 42 curated spots, off-radar sorting, the map with its token-missing fallback, the i18n structure, the landing page and the test suite are all in and green. `npm run build`, `lint`, `typecheck` and `test` are clean; 50 pages generate statically; the dev server serves them.

**The process deviation is the thing to know about.** Code was written before `specs/1-foundation/spec.md` existed, which breaks this repo's core working rule. The user's call was to keep the work and back-fill the docs rather than revert. So the Phase 1 spec documents a phase already executed, and D14 records the deviation. **Phases 2 onward follow the rule.**

**What is genuinely not done in Phase 1:** the content is unverified (R1), the community claims are unconfirmed with the organisations named (R4), and the map has never been seen rendering pins because no Mapbox token exists yet. Those are tracked, not hidden.

## Phase status

**Claim a phase before starting it** — put your name in Owner and set Status to "In progress", then commit and push that on its own. See `docs/WORKFLOW.md`.

| # | Phase | Docs | Branch | Owner | Status |
|---|---|---|---|---|---|
| 1 | Foundation | ✅ spec + plan (back-filled) | `phase/1-foundation` | Vithyea | **Complete** and committed, pending review, merge, and the R1 content-verification pass |
| 2 | Itinerary builder | ✅ spec + plan | `phase/2-itinerary` | Vithyea | **Complete** — merged into `phase/1-foundation` via PR #1. Criterion 9 still open (needs a token, B1); the builder has not been driven click-by-click in a browser |
| 3 | Persistence | — | `phase/3-persistence` | — | Not started |
| 4 | Day out with friends | — | `phase/4-collab` | — | Not started |
| 5 | Trip assistant | — | `phase/5-assistant` | — | Blocked: needs Phase 3 and real content |
| 6 | Hidden-gem scoring | — | `phase/6-scoring` | — | Blocked: needs first-party usage data (D4) |
| 7 | Growth loops | — | `phase/7-growth` | — | Not started |

## Open blockers

| # | Blocker | Blocks | Owner |
|---|---|---|---|
| B1 | No Mapbox account or token exists | Verifying pins render and click/hover sync. **No longer blocks Phase 2** (D22) | User |
| B2 | Content is unverified on the ground (R1) | Any public launch | Editorial |
| B3 | Community-impact claims unconfirmed with the named organisations (R4) | Any public launch | Editorial |
| B4 | No Khmer typeface loaded; Playfair and DM Sans have no Khmer coverage (R6). Now an explicit open question to Claude Design — which pairing, what line height, and what replaces the uppercase eyebrow in a script with no uppercase | Filling `km.json` | Design |
| B5 | Nothing is deployed; no hosting decided | First public URL | User |
| B6 | Design direction for the Phase 2 itinerary builder and the spot page is out with Claude Design; nothing decided yet | Writing `specs/2-itinerary/spec.md` with any layout in it | User |
| B7 | No field in the content schema marks a memorial site; R9 is enforced only by how the prose was written (C17) | — **closing in Phase 2 step 1** (D25) | Vithyea |

## Next session should

1. **Drive the builder through a real click-through** at 390 and 1280 — add, reorder, share. It has only been exercised by seeding `localStorage` and reading the rendered DOM, and the reorder tab's controls have never been clicked in a browser. This is the largest open gap in Phase 2.
2. Decide the palette question. It is genuinely open: the user prefers the design direction's earthier look, and a search over 400,000 combinations found no four-city set that keeps that character and separates by ΔE 25 against accent, gold and forest-mid. The interesting option is not a repaint but changing what carries city identity, so hue stops being one of seven competing roles — that wants a spec (see D21, D26).
3. Choose a Khmer face and check the design at Khmer line heights **before** filling `km.json` (R6, B4). Phase 2 added ~60 English-only strings, so this gap is larger than it was.
4. Decide whether to run the R1 content-verification pass before anything else ships publicly.
5. If a token arrives (B1): close acceptance criterion 9 in `docs/VERIFIED.md` — pins render, click and hover sync between map and list — and restrict the token to its domains on creation (R3).
6. Continue the UI/UX pass. Still open: no focus-visible audit; no `prefers-reduced-motion` handling (hover translate/scale are unconditional); the constellation's Angkor cluster is dense at 320px; `/discover` has no empty-state illustration; no skip-to-content link.

## Session log

**2026-08-29** — Read the brief. Scaffolded Next 16 + TS strict + Tailwind v4 + Vitest. Wrote the zod content schema and 42 hand-curated spots across four base cities. Built off-radar sorting, the Zustand filter store, the Mapbox map with a token-missing fallback, destination and city pages, and the i18n structure. Found and fixed two scaffold defects (C1, C2 in `VERIFIED.md`). Adopted the `docs/` + `specs/` convention from `rocket/athena` and `ass-hub/foodraccoon` after the user asked why it was missing; back-filled this doc set. Read `themapcambodia.com`'s rendered HTML and rebuilt the landing page in its editorial register with our own identity and our own inversion (D16). 20 tests green, build clean, 50 pages static.

**2026-08-29 (second session)** — Read the competitor's homepage HTML the user supplied. Its inlined RSC payload carried their whole `en.common` bundle, including a ~250-place catalogue; two of the brief's V2 differentiators already ship on their site, and their trip planning is editorial rather than a tool (D18). Rebuilt the landing page in their editorial register with our own identity and inversion (D16, D17). Then ran a mobile pass over CDP: found and fixed a 630px-wide home page at a 390px viewport caused by a single `truncate` (C8), cities unreachable on mobile (C9), the map buried below 42 cards on `/discover` (C10), and undersized touch targets throughout. Checked in `tools/probe.mjs` and `tools/shot.mjs` so the check is repeatable (D19). Clean at 320/390/768; 20 tests, build and lint green.

**2026-08-29 (third session)** — User said the colouring was not good. Measured it: the first palette collided twelve ways, including `--forest-mid` and `--cat-nature` being literally the same colour, and failed WCAG AA twice. Root cause was structural — ten colours competing for meaning on one page — so category colour was cut to the map's pin layers only and the cities moved off the brand green and gold (D21). Each city gained a separate `-ink` variant for marks and text, since fills stay dark in both modes. Auditing dark mode for the first time found two near-invisible text defects (1.15:1 and 2.46:1). Added `tools/contrast.mjs`, which itself produced false failures twice before it was right (C15). Now 0 contrast failures across four routes in both modes, minimum role separation ΔE 29.2.

**2026-08-29 (fourth session)** — No application code. The user supplied the competitor's spot-page, city-hub and `/plan-my-trip` HTML, closing B6, and their footer was checked in a browser. The teardown is now `docs/COMPETITOR.md` rather than session context that evaporates. Wrote a design brief for Claude Design grounded in measured values rather than the doc set: the tokens read out of `globals.css`, and the responsive system read out of the components — no custom breakpoints, and in practice a two-breakpoint design (43 `sm:`, 32 `lg:`, 2 `md:`, 1 `xl:`, no `2xl:`). Scope was cut to the Phase 2 itinerary builder and the spot page; the Phase 4 collaborative screens were deferred, since designing them now means designing against a data model three phases out. Three corrections recorded: `DESIGN-SYSTEM.md` generalised the pairing rail's snap behaviour to all three rails (C16, doc fixed); R9's memorial rule has no schema field behind it and is enforced only by the prose (C17, now B7); and the footer's unverified-content caveat — the sentence R1 and R4 rest on — is the least prominent text in the footer at `text-xs text-muted` in the last of four columns (C18). Nobody softened the wording; the layout softened it.

**2026-08-29 (fifth session)** — Phase 2 built from a Claude Design direction document, spec first this time. The design had been produced against a stale commit (`0ffa5b7`, one before the palette rebuild), so its token values and its whole dark-mode audit measured colours that no longer exist; the layout survived and the colours were taken from the CSS instead. D22–D25 accepted, `BUILD-PLAN.md`'s Phase 2 row corrected to match D22.

Shipped: the memorial flag (`sensitive: "memorial"`) with a build-time refinement, travel estimates, the day budget, the Zustand route store with reordering and URL-encoded sharing, the timeline, the day frame bar, the tail row, the priced add affordance, the dock bar and sheet, the `[Map | Route]` pane on `/discover`, and the spot page's reading order plus the C18 caveat move.

Four defects found, three of them only by running it rather than reading it. The schema refinement caught a live R9 violation in Phase 1 content — Kamping Puoy was paired to Phnom Sampeau (C19). The flat 22 km/h speed constant turned a 40-minute drive into 1h 50m (C20). `MapPlaceholder` was printing `NEXT_PUBLIC_MAPBOX_TOKEN` to travellers in what is the site's default state (C21). The suggestion tray offered other cities' spots at "28h 20m over" (C22).

67 tests across 8 files, build/lint/typecheck clean, 51 static pages, 0 overflow at 390/768/1280 across four routes, 0 contrast failures in both modes.
