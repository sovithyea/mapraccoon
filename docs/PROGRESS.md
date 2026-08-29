# Progress — MapRaccoon

Running ledger. Updated at the end of every working session so state survives across sessions.

**Last updated:** 2026-08-29 (second session)

## Where things stand

**Phase 1 (Foundation) is essentially complete, and was executed out of order.** The scaffold, content schema, 42 curated spots, off-radar sorting, the map with its token-missing fallback, the i18n structure, the landing page and the test suite are all in and green. `npm run build`, `lint`, `typecheck` and `test` are clean; 50 pages generate statically; the dev server serves them.

**The process deviation is the thing to know about.** Code was written before `specs/1-foundation/spec.md` existed, which breaks this repo's core working rule. The user's call was to keep the work and back-fill the docs rather than revert. So the Phase 1 spec documents a phase already executed, and D14 records the deviation. **Phases 2 onward follow the rule.**

**What is genuinely not done in Phase 1:** the content is unverified (R1), the community claims are unconfirmed with the organisations named (R4), and the map has never been seen rendering pins because no Mapbox token exists yet. Those are tracked, not hidden.

## Phase status

**Claim a phase before starting it** — put your name in Owner and set Status to "In progress", then commit and push that on its own. See `docs/WORKFLOW.md`.

| # | Phase | Docs | Branch | Owner | Status |
|---|---|---|---|---|---|
| 1 | Foundation | ✅ spec + plan (back-filled) | `main` | Vithyea | **Complete**, pending the R1 content-verification pass |
| 2 | Itinerary builder | — | `phase/2-itinerary` | — | Not started — needs spec + plan first |
| 3 | Persistence | — | `phase/3-persistence` | — | Not started |
| 4 | Day out with friends | — | `phase/4-collab` | — | Not started |
| 5 | Trip assistant | — | `phase/5-assistant` | — | Blocked: needs Phase 3 and real content |
| 6 | Hidden-gem scoring | — | `phase/6-scoring` | — | Blocked: needs first-party usage data (D4) |
| 7 | Growth loops | — | `phase/7-growth` | — | Not started |

## Open blockers

| # | Blocker | Blocks | Owner |
|---|---|---|---|
| B1 | No Mapbox account or token exists | Verifying pins render and click/hover sync; all of Phase 2 | User |
| B2 | Content is unverified on the ground (R1) | Any public launch | Editorial |
| B3 | Community-impact claims unconfirmed with the named organisations (R4) | Any public launch | Editorial |
| B4 | No Khmer typeface loaded; Playfair and DM Sans have no Khmer coverage (R6) | Filling `km.json` | Design |
| B5 | Nothing is deployed; no hosting decided | First public URL | User |
| B6 | Competitor detail-page, city-hub and `/plan-my-trip` HTML not yet seen | Confirming their spot-page layout and whether their itinerary offering is truly static | User |

## Next session should

1. Decide whether to run the R1 verification pass now or spec Phase 2 first.
2. If Phase 2: write `specs/2-itinerary/spec.md` and `plan.md` **before** any code. It needs a Mapbox token (B1) to be testable.
3. If a token arrives: check the PENDING row in `docs/VERIFIED.md` — pins render, click and hover sync between map and list — and restrict the token to its domains on creation (R3).
4. Continue the UI/UX pass. Still open, in rough priority order: no focus-visible styling audit; no `prefers-reduced-motion` handling (hover translate/scale are unconditional); the constellation's Angkor cluster is still dense at 320px; `/discover` has no empty-state illustration; no skip-to-content link; dark mode has never been reviewed by eye at any width.

## Session log

**2026-08-29** — Read the brief. Scaffolded Next 16 + TS strict + Tailwind v4 + Vitest. Wrote the zod content schema and 42 hand-curated spots across four base cities. Built off-radar sorting, the Zustand filter store, the Mapbox map with a token-missing fallback, destination and city pages, and the i18n structure. Found and fixed two scaffold defects (C1, C2 in `VERIFIED.md`). Adopted the `docs/` + `specs/` convention from `rocket/athena` and `ass-hub/foodraccoon` after the user asked why it was missing; back-filled this doc set. Read `themapcambodia.com`'s rendered HTML and rebuilt the landing page in its editorial register with our own identity and our own inversion (D16). 20 tests green, build clean, 50 pages static.

**2026-08-29 (second session)** — Read the competitor's homepage HTML the user supplied. Its inlined RSC payload carried their whole `en.common` bundle, including a ~250-place catalogue; two of the brief's V2 differentiators already ship on their site, and their trip planning is editorial rather than a tool (D18). Rebuilt the landing page in their editorial register with our own identity and inversion (D16, D17). Then ran a mobile pass over CDP: found and fixed a 630px-wide home page at a 390px viewport caused by a single `truncate` (C8), cities unreachable on mobile (C9), the map buried below 42 cards on `/discover` (C10), and undersized touch targets throughout. Checked in `tools/probe.mjs` and `tools/shot.mjs` so the check is repeatable (D19). Clean at 320/390/768; 20 tests, build and lint green.
