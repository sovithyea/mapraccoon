# Decisions — MapRaccoon

Append-only log. Each entry records what was decided, when, why, and what it rules out. Reversals get a new entry that supersedes the old one rather than an edit in place.

---

## D1 — Build the static content layer first, with no backend at all

**Date:** 2026-08-29 · **Status:** Accepted

The brief's own build order puts a static curated map and destination pages ahead of everything else, to validate content and design before any backend exists. Adopted as written.

Phase 1 therefore touches exactly one paid service — Mapbox, on its free tier. No Supabase project, no Claude API key, no Google Cloud project. The cost-control surface on day one is a single item, which is the whole reason to sequence it this way.

**Consequence:** spot content lives in a typed TS module, not a database. Phase 3 migrates it.

**Rules out:** standing up Supabase "so it's ready", which would put a billable account behind an app with no users.

---

## D2 — Seed content is hand-curated, not bulk-pulled from OSM

**Date:** 2026-08-29 · **Status:** Accepted

The brief plans an OpenStreetMap Overpass bulk seed for baseline POI coverage, with editorial curation layered on top. For Phase 1 the order is reversed: 42 hand-written entries, no bulk pull.

OSM and Google Places both carry name, category and location well and carry nothing at all for `pairedWith`, `community`, `offRadar` or the descriptive copy. Those four fields are the product. A bulk pull would produce a large database of exactly the generic content this app exists not to be, and the curation backlog would then be measured in thousands of rows instead of dozens.

**Consequence:** coverage is deliberately shallow — four base cities, 42 places, all of them written.

**Rules out:** nothing permanently. The Overpass seed becomes useful in Phase 3, when there is a database to put it in and an editorial pipeline to process it through.

---

## D3 — Spot data is a typed TS module parsed by zod at import, not a JSON file

**Date:** 2026-08-29 · **Status:** Accepted

`src/data/spots.ts` exports `Spot[]`; `src/lib/spots/index.ts` runs it through the zod schema once at module load.

This makes invalid content a **build** failure rather than a runtime one. A malformed entry, a dangling `pairedWith` reference or a coordinate outside Cambodia cannot reach a deployed page. JSON would give the same data with none of that.

**Rules out:** editing content without running the build. That is an accepted cost while content is written by developers, and it is exactly what Phase 3 fixes by moving to a database with an admin path.

---

## D4 — `offRadar` is an editorial integer, and the UI says so

**Date:** 2026-08-29 · **Status:** Accepted

The brief defers the XGBoost hidden-gem model until there is first-party visit and review data, on the grounds that Google and OSM data is biased toward already-popular places. That reasoning is correct and load-bearing: a model trained on that data would reproduce the popularity ranking this product exists to invert.

So `offRadar` is a hand-set 0–100 integer, and the destination page labels it as editorial rather than presenting it as a computed score.

**Consequence:** `src/lib/scoring.ts` holds the sort as a named pure function so Phase 6 replaces one implementation instead of many call sites.

**Rules out:** describing the ranking as an algorithm in any user-facing copy before Phase 6 lands.

---

## D5 — `pairedWith` and `community` are required schema concepts, not optional metadata

**Date:** 2026-08-29 · **Status:** Accepted

Both fields are technically optional on a `Spot` — anchors like Angkor Wat have no pairing, because they are what other places pair *to*. But they are first-class in the schema and first-class in the destination page layout rather than being appended as tags.

Narrative pairing and community framing are the two mechanics the brief names as the actual conversion hooks. Modelling them as afterthoughts would produce a listings site with good copy.

**Consequence:** anchors must exist in the dataset even though they sort last. A pairing with nothing on the other end is just a listing.

---

## D6 — Every spot carries at least one source URL

**Date:** 2026-08-29 · **Status:** Accepted

`Spot.sources` is `z.array(z.url()).min(1)`. Each seed entry carries an OpenStreetMap link at its own coordinates plus a reference where a good one exists.

Two reasons. First, an unattributable claim about a place someone will travel four hours to reach is a defect. Second, Phase 5 constrains RAG retrieval to this database specifically so the assistant cannot invent places — that guarantee is only worth as much as the provenance behind the rows.

**Rules out:** adding a spot because it sounds right. See R1 — sources being present is not the same as the content being verified.

---

## D7 — i18n structure from day one; English-only content; no i18n library

**Date:** 2026-08-29 · **Status:** Accepted

Routes are `app/[locale]/…`. `LocalizedText` is `{ en: string; km?: string }`, used identically by seed content and UI dictionaries. Dictionaries are JSON loaded server-side with per-key fallback to English. `generateStaticParams` returns only `en` until `km.json` is filled.

Retrofitting a locale segment across every route later is a refactor; adding it now is a directory name. No library, because the requirement today is a route shape and a loader, and `next-intl` can slot in later as a loader change rather than a restructure.

**Rules out:** shipping a Khmer route that is 90% English. The build simply does not produce one.

---

## D8 — Next.js 16 App Router, TypeScript strict plus `noUncheckedIndexedAccess`

**Date:** 2026-08-29 · **Status:** Accepted

Matches the conventions in `ass-hub/foodraccoon`, with `noUncheckedIndexedAccess` and `noImplicitOverride` added on top of the scaffold default.

Next 16 note carried over from the sibling repo and confirmed here: `params` is a `Promise` and must be awaited. This is not the Next.js in most training data.

---

## D9 — `react-map-gl` over raw `mapbox-gl`

**Date:** 2026-08-29 · **Status:** Accepted

`react-map-gl` 8.x wraps `mapbox-gl` 3.x with React 19 support and declarative markers, which is most of what Phase 1 needs from a map. The underlying `mapbox-gl` instance stays reachable for the imperative work Phase 2 will need.

---

## D10 — Stay on Mapbox; do not follow foodraccoon v2 to MapLibre

**Date:** 2026-08-29 · **Status:** Accepted

`ass-hub/foodraccoon` moved off Mapbox to MapLibre to break renderer vendor lock-in. This project deliberately diverges.

The dependency here is not the renderer, it is the Directions and Optimization APIs — which are the itinerary builder, the feature the brief identifies as the gap in the market. MapLibre has no equivalent for multi-stop route optimisation. Swapping the renderer while keeping the routing APIs would be a partial escape bought at the price of running two vendors' conventions side by side.

**Consequence:** the lock-in is accepted and priced. Free tier is 50K map loads and 100K directions requests per month, comfortably above this project's scale.

**Rules out:** nothing about Phase 1, but it means R7 stays open rather than being mitigated.

---

## D11 — The map degrades to a placeholder when the Mapbox token is absent

**Date:** 2026-08-29 · **Status:** Accepted

No Mapbox account exists yet. Rather than block Phase 1 on one, `SpotMap` checks `NEXT_PUBLIC_MAPBOX_TOKEN` and renders an explanatory panel when it is missing.

The list, the filters and every destination page stay fully functional without a token, so the entire app is reviewable before an account exists. This also removes a whole class of confusing first-run failure for anyone cloning the repo.

---

## D12 — Vitest from the start; no Playwright yet

**Date:** 2026-08-29 · **Status:** Accepted

`ass-hub/foodraccoon` inherited a repo with `@playwright/test` installed, zero tests and no config, and recorded that as a gap. This repo starts with a configured runner and real tests instead.

Scope is deliberately narrow: the content-integrity checks over the seed data, the scoring functions, and the map's token-missing branch. Not E2E — there is no backend to run against and no user flow longer than a click-through yet. Playwright arrives with Phase 4, where a multi-user realtime flow genuinely needs it.

---

## D13 — Adopt the docs + specs convention from `rocket/athena` and `ass-hub/foodraccoon`

**Date:** 2026-08-29 · **Status:** Accepted

Same structure: `docs/` carrying ARCHITECTURE, BUILD-PLAN, DECISIONS, PROGRESS, RISKS, VERIFIED, WORKFLOW, INTERFACES, DESIGN-SYSTEM and SECURITY; `specs/N-name/{spec.md,plan.md}`; `AGENTS.md` pointing at `CLAUDE.md`; `diagrams/`.

Two docs are thin at Phase 1 by nature and were written anyway rather than skipped: `INTERFACES.md` has no API routes to describe yet, and `SECURITY.md` has no user data to protect. Both were written for the boundary they will hold in Phase 3, so the shape exists before the risk does.

---

## D14 — Phase 1 code was written before its spec. Recorded, not concealed

**Date:** 2026-08-29 · **Status:** Accepted

The scaffold, schema, seed content and i18n layer were written from an approved working plan, before `specs/1-foundation/spec.md` existed. Under the working rule adopted in D13 that is out of order.

The user's call was to keep the work and back-fill the docs rather than revert. So `specs/1-foundation/spec.md` documents a phase already partly executed, `docs/PROGRESS.md` says so plainly, and `docs/VERIFIED.md` separates what was actually run from what is merely asserted.

**Consequence:** the deviation applies to Phase 1 only. Phases 2 onward follow the rule.

**Rules out:** treating the back-filled spec as evidence that the process was followed.

---

## D15 — The repo stays standalone at `~/Desktop/projects/mapraccoon`

**Date:** 2026-08-29 · **Status:** Accepted

Not moved under `ass-hub/` alongside foodraccoon v2, and not under `rocket/` alongside athena. The brief describes it as a standalone project separate from FoodRaccoon, and it shares no backend, no schema and no deployment with either.

It shares only conventions, which is what D13 covers.

---

## D16 — Take themapcambodia.com's editorial register, not its business model

**Date:** 2026-08-29 · **Status:** Accepted

The user supplied the competitor's rendered homepage HTML and asked for something similar. It was read directly rather than described from memory, and the extracted structure is recorded in `docs/DESIGN-SYSTEM.md`.

**Taken:** serif display over geometric sans, tracked-out eyebrow labels above section headings, a warm paper ground rather than the cool grey of most map apps, deep forest green as the institutional colour, per-city accent colours used systematically, hero "doors", horizontal card rails, and city chip tabs over a feature card plus a picks list. These are the right conventions for Cambodian editorial content and there is no reason to invent worse ones.

**Not taken:** their homepage as a whole. Their model is an editorial guide plus a printed map distributed through 220+ points, backed by an established audience. Cloning it produces a worse version of something they already do well.

**The correction this forced.** Their site already has an "off the beaten path" section. The brief treats off-radar framing as the differentiator; it is not, on its own. What actually differs is that off-radar is our **default sort** rather than one section down the page, that every hidden place names the famous one it replaces and why, and that they have no itinerary builder or route planning — which the brief correctly identifies as the real gap.

**Consequence:** the landing page leads with the pairing mechanic and a constellation of the whole dataset sized by off-radar score. The filterable map moved to `/discover`.

**Rules out:** competing with them on editorial breadth or distribution. Nine destinations and a print run are not the axis to fight on.

---

## D17 — The hero graphic is a scatter of the real dataset, not an illustrated map

**Date:** 2026-08-29 · **Status:** Accepted

The competitor's hero is a hand-illustrated map of Cambodia with animated palms and clickable city pins. It is lovely and it costs an illustrator.

`Constellation` instead plots all 42 spots at their true longitude and latitude inside `CAMBODIA_BBOX`, over a plain graticule, with dot size running 8px→20px with the off-radar score.

Three reasons it is better here, not just cheaper. It is honest — it is the actual data, not a drawing. It needs no Mapbox token, so the hero cannot fail to load (which matters today, when no token exists). And sizing dots by off-radar score states the product's whole thesis in one graphic: the biggest marks on the page are the places nobody goes.

**Consequence:** it grows with the dataset for free, and it will need rethinking if the dataset reaches a few hundred spots and the scatter turns to mush.

---

## D18 — The itinerary builder is the differentiator; "suggest a place" and crowd forecasting are not

**Date:** 2026-08-29 · **Status:** Accepted

Reading the competitor's inlined RSC payload (see `docs/VERIFIED.md`) turned up two things the brief did not account for.

**They already ship two of the brief's V2 ideas.** `/en/suggest-a-place` is linked from their nav and footer — the brief lists "suggest a place" tip submissions as the long-term growth engine. `/en/tools/crowd-forecast-siem-reap`, `-phnom-penh` and `-koh-rong` exist — the brief lists crowd/season prediction as a V2 differentiator. Neither is novel ground.

**Their trip planning is articles, not a tool.** `/en/plan-my-trip` and `/en/cambodia/itineraries` are editorial routes — "3 days, 7 days, 2 weeks… Find the perfect itinerary". Nothing in the payload suggests interactive multi-stop routing or travel-time computation. The brief's central claim — that route planning is the gap — holds, and it is the *only* one of the differentiators that clearly holds.

Their catalogue is roughly 250 places across 9 destinations against our 42 across 4. Competing on breadth is not available.

**Consequence:** Phase 2 (itinerary builder) and Phase 4 (collaborative day-out planner) are the phases that matter. Phase 7's "suggest a place" is a parity feature, not a growth engine, and should be planned as such. Crowd/season prediction stays unscheduled and loses its claim to being differentiating.

**Rules out:** positioning "suggest a place" or crowd forecasting as reasons this product exists.

---

## D19 — Measure the layout over CDP rather than reading the JSX

**Date:** 2026-08-29 · **Status:** Accepted

The home page rendered at 630px inside a 390px viewport. Nothing in the source looked wrong: no fixed widths, no `100vw`, no oversized images. The cause was a `truncate` class on a spot blurb four levels down in `CityPicks` — it expands to `white-space: nowrap`, which made the blurb's full string the min-content width of its grid track.

That class is idiomatic Tailwind and reads as harmless. It was found by cloning each grid child into a `width: min-content` probe and measuring, not by reading.

**Consequence:** `tools/probe.mjs` and `tools/shot.mjs` are checked in — zero-dependency CDP drivers, since Node 26 has a global `WebSocket`. The standing check is `scrollWidth === viewport` and zero true overflow at 320, 390 and 768, with elements inside deliberate scroll rails excluded by walking ancestors for `overflow-x`.

**Also recorded:** `chrome --headless --screenshot` with `--window-size` does **not** agree with CDP measurement — it showed content cut off on a page measured as clean. Screenshots go through `Page.captureScreenshot` under the same emulation as the probe, so image and measurement cannot diverge.

**Rules out:** signing off responsive work from a desktop browser window or from reading the source.

---

## D20 — Every PR carries a handover description written for an agent starting cold

**Date:** 2026-08-29 · **Status:** Accepted

`.github/pull_request_template.md` is required on every PR, and `docs/WORKFLOW.md` gives the rules.

The reasoning is specific to how this repo is worked on. Much of the work is done by agents in separate sessions with no shared memory, and the sibling repos already show what happens without a handover: `ass-hub/foodraccoon` records that its predecessor's documentation was wrong in eight places, and this repo's own `docs/VERIFIED.md` logs eleven corrections in a single phase. Commit bodies carry the *why* of one change; nothing was carrying the state of the work as a whole.

The template's load-bearing sections are the ones usually skipped: **Not done / known gaps** and **For whoever picks this up next**. A PR that lists only what works hands the next reader a false picture, and in this repo a false picture becomes an assumed fact — which is the exact failure `VERIFIED.md` exists to prevent.

Two rules attach to it. A PR must never claim something was verified that could not be run; unrunnable checks go under *Not done*. And changes after review go in follow-up comments rather than silent body edits, because reviewers read new comments and not bodies they have already read.

**Consequence:** a PR body is a truthful log of what happened, not a snapshot of what was intended when it opened.
