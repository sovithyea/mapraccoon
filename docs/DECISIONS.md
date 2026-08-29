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

---

## D21 — Cut category colour to the map, and verify every colour instead of choosing it

**Date:** 2026-08-29 · **Status:** Accepted · Supersedes the palette in D16

The first palette was assembled by eye from the competitor's register. Measured, it was bad in ways that looking at it did not reveal:

- `--forest-mid` and `--cat-nature` were **the same colour** (ΔE 0), so the "nature" category read as the brand accent.
- `--gold` and `--cat-temple` were ΔE 11.6 apart, which broke D16's own rule that gold means "where your money goes" and appears nowhere else.
- Phnom Penh and Battambang were ΔE 24.1 apart — the four-city system read as two pairs.
- Twelve pairs collided in total, and two combinations failed WCAG AA.

The cause was structural rather than a matter of tints: four cities plus four categories plus an accent plus gold is **ten colours competing for meaning on one page**, and there is not room for ten.

**The fix is a rule, not a repaint.** Category colour exists only where it distinguishes items from one another — the map's pin layers — and nowhere else. Everywhere else a category is a text label in neutral chrome. That frees the category set from having to differ from the city set, and drops the on-page count from ten to seven.

City colours then moved off the brand's green and gold entirely, since those are role colours: clay red, indigo, ocean, plum. Each city gained a second `-ink` variant, because a large fill behind white text and a small mark on the page background have opposite requirements in dark mode.

**Consequence:** `tools/contrast.mjs` is checked in and both the palette and any change to it are verified by measurement — WCAG AA for text, ΔE > 25 between role colours. The current palette passes at ΔE 29.6 (light) and 29.2 (dark), 0 contrast failures across four routes in both modes.

**Also fixed here:** the picks list used a tinted grey swatch that carried no information and read as a broken image. It is now the item's rank in the off-radar order, which is the one number that list is sorted by.

**Rules out:** adding a colour to this design without measuring it against the existing roles first.

---

## D22 — Phase 2 ships with no routing API

**Date:** 2026-08-29 · **Status:** Accepted · Amends the Phase 2 row in `docs/BUILD-PLAN.md`

`BUILD-PLAN.md` defined Phase 2 as "travel time via Mapbox Directions, stop reordering via Optimization API". It ships instead with a **haversine distance × 1.4 detour factor at 22 km/h**, surfaced as `est.` in every place a duration or an arrival time appears.

Three reasons, all of them the repo's own:

- **B1 leaves the critical path.** No Mapbox account exists. Under the original definition the entire phase was blocked on the user creating one and accepting a billable dependency for an app with no users — which is precisely what D1 refuses.
- **Cost arrives as late as possible.** That is the governing principle of the build order, and a routing API in Phase 2 is the earliest possible moment for it rather than the latest necessary one.
- **A labelled estimate beats an unlabelled fake.** The alternative was not "accurate times", it was a hardcoded guess presented as a routed answer. This one says what it is on screen.

D10's argument for Mapbox over MapLibre is untouched — the Directions and Optimization APIs are still why the renderer choice was made. They arrive behind `estimateLeg()` in `src/lib/route/estimate.ts`, which is the entire swap surface: one function, no component changes.

**Consequence:** travel times will be visibly wrong on the Bokor road, on unsealed sections and at any river crossing. This is accepted and labelled, not hidden. The phase must be fully demonstrable with `NEXT_PUBLIC_MAPBOX_TOKEN` unset, which is acceptance criterion 2.

---

## D23 — The route is a pane and a dock bar, never a destination route

**Date:** 2026-08-29 · **Status:** Accepted

Adding a stop from a spot page must not cost you the spot page. That single requirement rules out a `/plan` route you navigate to, which is what the competitor's planner is.

- `/discover`'s right pane gains a third state, `[Map | Route]`, in local component state — mirroring the existing mobile List/Map toggle rather than the filter store, since it is view state and not a filter.
- Below `lg`, a **56px dock bar** carries the day summary and the capacity bar on every page. It appears on the first add; with no day there is no chrome.
- The bar opens a full-height sheet at `?day=open` — a **view with a URL and a back-button dismiss, not a modal**. Same reasoning that kept the mobile city list out of a drawer (C9): no focus trap to get wrong.
- `/plan/[id]` exists only as the landing view for a shared, URL-encoded day.

Splitting the `lg` remainder into route *and* map was considered and rejected: two panes at ~420px each costs the timeline its time column, and the map is absent by default anyway with no token. The mitigation is that leg rows carry distance, duration and road surface in type — the part of the map actually needed while sequencing.

**Consequence:** you cannot watch the map while reordering. Accepted.

---

## D24 — The day budget is stated three times, and overflow is achromatic

**Date:** 2026-08-29 · **Status:** Accepted

One `dayBudget()` result feeds three surfaces — the day frame, the per-item add affordance, and the tail row where the next stop would land. They cannot disagree, the same way `offRadarBand()` guarantees the meter label cannot drift from the sort. A modal would be a fourth surface repeating what the other three already say.

**Nothing is ever disabled.** The competitor greys out over-cap destinations because their cap is a hard rule; ours is soft, and a 75-minute overrun may be exactly the trade a traveller wants. So the affordance states its cost instead — `＋ Add · 40m over` — and stays pressable, with `aria-describedby` pointing at the line that explains it. Their disabled checkboxes carry no such association, which is the accessibility gap this deliberately avoids.

"Full" is **derived, not a constant**: `min(typicalDurationMins) + min(leg)` over the dataset, so it cannot go stale when a shorter spot is added.

Overflow renders as **geometry, not colour** — the frame's end rule doubles, the overrun hatches past it, and the figure sits in `--foreground` at weight 700. A `--over` accent was drawn and rejected: at `#8f3a1f` it measures ΔE 12 from `--city-battambang` and 9 from `--cat-food`, which is the collision class D21 exists to prevent. An overrun is a choice, not an error, and does not warrant the palette's first error colour.

**Rules out:** adding a fifth accent to this design without measuring it against the existing roles first — a restatement of D21.

---

## D25 — Memorial sites become a schema field

**Date:** 2026-08-29 · **Status:** Accepted · Enforces R9

R9 says memorial sites are never written in the product's voice. Until now that was true only because the prose was hand-written that way. There was no field in `spotSchema` marking them, so nothing in the UI could branch on it, and any future generated blurb, badge, score or pairing would have applied to Tuol Sleng silently (C17).

`sensitive: z.literal("memorial").optional()` is added to the schema, with a refinement that **rejects a `pairedWith` on a sensitive spot at build time**. `OffRadarMeter`, `PairingCard` and the card score return `null` for those spots. Inside the builder a memorial stop has square corners, sits on the page ground rather than a surface card, states dwell as a minimum rather than a duration, and carries no score — and any reordering that moves one must say so rather than optimising it silently.

The day's off-radar average footnotes its denominator (`2 of 3 stops scored`) rather than quietly averaging over a smaller set.

**Consequence:** R9 becomes a build error instead of a convention. This is the cheapest change in the phase and the one worth shipping even if nothing else does.

---

## D26 — Light and dark become a choice, not only an OS preference

**Date:** 2026-08-29 · **Status:** Accepted · Extends the dark-mode section of D21

Dark mode had one trigger, `@media (prefers-color-scheme: dark)`, and no user control. That is defensible for a site with no account, but it makes the palette impossible to *look at* deliberately — you had to change your operating system to see the other half of a design that was measured in both.

A three-state control — **auto / light / dark** — sits in the header. Three rather than two, because a plain flip permanently loses the ability to follow the system again, and "auto" is the honest default when there is nothing to remember a preference against.

**The palette now has two dark triggers and must have one set of values.** `@media (prefers-color-scheme: dark)` is scoped to `:root:not([data-theme="light"])` so an explicit choice wins in both directions, and `:root[data-theme="dark"]` repeats the same declarations. That duplication is a real hazard: a token defined in only one of them would appear broken solely for people who had touched the toggle, which is worse than the bug C13 caught, because it would survive every review done with the OS setting. `src/app/globals.test.ts` asserts the two blocks define identical token names, and that every dark token also exists in the light `:root`.

The stored choice is applied by an inline script before first paint. Applying it from a component instead flashes the light palette on every load for anyone who chose dark.

**Consequence:** the contrast audit now has a third path to cover. Verified at 0 failures across `/discover` and two spot pages under explicit `data-theme="dark"`, in addition to the existing media-query runs.

**Rules out:** defining a colour in only one of the two dark blocks — the test fails.

---

> **Everything from D27 onward belongs to a different product.** The repo pivoted from a Cambodia tourist guide to a Phnom Penh going-out platform for friends who live there. `docs/PIVOT.md` explains the change and what it costs. D1–D26 are kept intact — several are superseded below, none are edited (rule 7).

## D27 — Phnom Penh only

**Date:** 2026-08-29 · **Status:** Accepted · Supersedes the coverage consequence of D2

The other three cities and their 31 spots are deleted. Coverage goes from four cities shallow to one city deep — the dataset grows to 80+ places, all of them in Phnom Penh.

D2 argued against bulk-pulling from OSM because `pairedWith`, `community`, `offRadar` and the descriptive copy "are the product". Two of those four are gone (D28, D29), so that reasoning no longer holds as written. The conclusion partly survives for a different reason: a going-out product lives or dies on opening hours and price being right, and OSM has neither reliably for Phnom Penh venues.

**Consequence, worth stating because it is easy to miss:** D21 measured that four cities plus four categories plus an accent plus gold was ten colours competing for meaning on one page. One city removes four of them. The palette constraint that made an earthier design direction impossible **reopens** — see the ΔE work recorded in PR #1.

---

## D28 — The default sort becomes "open now", and the off-radar score is removed entirely

**Date:** 2026-08-29 · **Status:** Accepted · Supersedes D4, and the sort half of D16, D17 and D18

`CLAUDE.md` hard rule 3 read *"Off-radar is the default sort, everywhere, with no user interaction required… **It is the product, not a preference.**"* `docs/INTERFACES.md` said the initial sort *"must stay that way"*. Both are now false. This is the single largest reversal in this repo's history and it is recorded here rather than allowed to happen by drift.

**The reason is not that the score became redundant. It is that it inverts.** For a jungle temple, "almost nobody goes here" means undiscovered — the thing the old product existed to surface. For a bar on a Friday night it means empty, which is bad information about a bad venue. Same number, opposite meaning, and the new dataset is overwhelmingly the second kind. A sort that ranks by it would actively surface the worst options first.

The secondary reason is authoring cost: keeping it means hand-typing a calibrated 0–100 integer for every venue, on a scale nobody would sort by.

**Removed:** `offRadar` from the schema, `sortByOffRadar`, `sortByPopularity`, `offRadarBand`, `OffRadarMeter`, `OffRadarPanel`, `dayOffRadarAverage`, the `Constellation` dot-sizing, and roughly fifteen tests.

**Not added:** a `staffPick` boolean replacement. If the list feels arbitrary in use, that is an afternoon's work; guessing now adds a field to author across eighty venues for a problem that may not exist.

**Consequence:** "open now" is time-dependent, and the pages are statically generated. The open state must render only after mount or server and client will disagree. See D34.

---

## D29 — Pairing and community stop being the two mechanics, and nothing replaces them

**Date:** 2026-08-29 · **Status:** Accepted · Supersedes D5

D5 made `pairedWith` and `community` first-class schema concepts because the brief named them as the conversion hooks. "Conversion" is a tourist-acquisition idea, and "instead of Angkor Wat, go here" is a sentence you can only say to someone who has not been.

`pairedWith` is removed outright. `community` survives as a *field* — Romdeng, Friends and Daughters of Cambodia are real, and a resident may choose a training restaurant deliberately — but not as a mechanic. `--gold` keeps its single exclusive meaning.

**What replaces them is nothing, and that is the decision.** The reason to open this product is not an editorial hook. It is that it **resolves an argument five people are having in a group chat**. The venue data is fuel for that.

**Consequence, and it is a risk rather than a feature:** the entire weight of the product now rests on the voting flow being genuinely good. There is no editorial layer to fall back on if the interaction is mediocre. Nothing else in the design compensates for a bad match resolution.

---

## D30 — V1 ships with no accounts, but it cannot ship with no server

**Date:** 2026-08-29 · **Status:** Accepted · Supersedes D1's sequencing and its no-backend absolute

`CLAUDE.md` hard rule 6 read *"There is no backend, deliberately."* That is no longer true, and softening the wording would be worse than reversing it openly.

**A URL is a one-way channel.** The organiser can push a ballot out to five friends; those five have no way to push their votes back into a shared place. With N voters you get N isolated client states and no merge point. This is a property of the medium, not a missing library.

Three workarounds were examined and rejected. A self-appending vote-chain URL silently loses a vote whenever two people vote off the same link — a tally that looks correct while being wrong is worse than no tally. `localStorage` and `BroadcastChannel` are same-device. WebRTC needs a signalling server, so it is not zero-backend, at ten times the work.

**The minimum is one key-value store with two operations:** append a vote, read the votes. No accounts, no user table, no schema, no Supabase. The room id *is* the secret — the same auth model the existing share links already use — and a **24-hour TTL** makes "v1 has no history" an architectural property rather than a policy anyone has to remember. Roughly sixty lines as a route handler.

The ballot stays in the URL even with the server. The store holds only votes, so it can be wiped without losing anything an organiser cannot regenerate by re-sending their link.

**D1's cost principle is kept, not abandoned.** This is not standing up a backend so it is ready; it is the smallest piece that makes the feature exist at all. Per hard rule 6's own last sentence, **the spend cap goes in on day one of the phase that needs it**, which is now.

**Recorded alternative:** a genuinely zero-backend version exists — each voter's app encodes their marks into a ~40-character code they paste into the group chat, and the organiser's device tallies. It works for four friends in one thread. It is also tedious enough that it is probably why people would stop using it.

**Consequence:** `resolve(ballot, votes)` is a pure function with no I/O, so it is testable without infrastructure and the fallback stays available.

---

## D31 — The competitor is the group chat

**Date:** 2026-08-29 · **Status:** Accepted · Supersedes D16's positioning and D18

`themapcambodia.com` is an editorial guide monetised through a printed map at 220+ distribution points, sold to inbound visitors. It is not a competitor to a tool for residents deciding where to go tonight. `docs/COMPETITOR.md` is kept as history; its interface observations remain useful and its differentiation analysis has no target.

**The competitor is the group chat.** Zero friction, already installed, everyone is already in it. The opening is that group chats are genuinely bad at converging on a decision. The bar is *"better than someone typing where should we go tonight"*, and it has to be cleared on the first use — nobody opens a second time out of politeness.

**Consequence:** D18 ranked the roadmap by what the tourist competitor lacked. That ranking is void. "Suggest a place", which D18 called parity rather than a differentiator, becomes a plausible core mechanic instead: friends adding the venues they already know is how the dataset stays alive (see R8).

---

## D32 — Khmer moves from a scheduled defect to a launch blocker

**Date:** 2026-08-29 · **Status:** Accepted · Escalates R6

A tourist product can defend shipping English-first: its users are inbound visitors and Khmer is a courtesy owed on a schedule. **A product for people who live in Phnom Penh has a majority-Khmer-speaking user base by construction**, so the same gap stops being a defect with a timeline and becomes a reason the product does not work for most of the people it is for.

Neither shipped typeface — Playfair Display or DM Sans — has Khmer coverage, and Phase 2 added roughly sixty English-only strings, so the gap grew rather than shrank.

**Consequence:** B4 is re-scored in `docs/PROGRESS.md` from "blocks filling `km.json`" to "blocks launch". The order is unchanged and still matters: choose a Khmer face and check the layout at Khmer line heights **before** populating `km.json`, or the translation renders in a fallback face against a design tuned for Latin.

---

## D33 — Memorial sites stay, and `sensitive` gets stronger

**Date:** 2026-08-29 · **Status:** Accepted · Extends D25

Tuol Sleng and Choeung Ek are in Phnom Penh, so D27 does not remove them. Dropping them was recommended — "where should we go out tonight" has no correct answer that is a genocide memorial — and the call was to keep them. They stay.

**R9 therefore gets worse, and must be actively managed rather than watched.** The other cities' memorials leave with their cities, so the memorial share of the corpus rises. It rises at exactly the moment the product's voice changes from a discovery listing to "swipe to pick a bar", which is a strictly worse context for them.

A `sensitive` spot must never appear as a swipe candidate, in a suggestion tray, or in a match result. **Each exclusion is enforced by a schema rule or a test, never by prose.** C19 is the record of what happens otherwise: Kamping Puoy shipped paired to Phnom Sampeau, one forced-labour site framed as the alternative to another, and it survived review because the rule lived only in how the copy happened to be written.

`specs/3-friends/spec.md` MUST carry an acceptance criterion per exclusion, not a general instruction to be careful.

**Interaction with D28:** removing the off-radar score also removes `dayOffRadarAverage`, so one of D25's existing exclusions disappears along with the thing it was excluding from. That is a reduction in surface area, not a relaxation of the rule.

---

## D34 — Opening hours use a fixed UTC+7 offset, not `Intl`

**Date:** 2026-08-29 · **Status:** Accepted

Cambodia is UTC+7 and has no daylight saving, so `new Date(t + 7 * 3600_000)` read through `getUTC*` is exactly correct, cheaper than `Intl.DateTimeFormat` with a `timeZone`, and returns numbers rather than strings that must be re-parsed.

Recorded because "just use `Intl`" will come up in review and the justification is not visible in the code.

**The consequence that actually matters is not performance.** The computation must be in Phnom Penh time *regardless of the viewer's device*. A friend deciding from Bangkok, or on a phone with a wrong clock, must still see Phnom Penh opening hours. A fixed offset gives that; `date.getHours()` would not.

**Consequence:** only one module reads the clock. Everything above it takes an explicit instant, so the hours test suite is table-driven with no fake timers and no midnight-boundary flakes. The primitive is `isOpenAt(hours, instant)` rather than `isOpenNow(hours)` — "open now" is then one call, and "we are deciding for Friday 8pm" gets its filter for free rather than needing a second code path.

---

## D35 — Supabase with Realtime, not a hand-rolled key-value store

**Date:** 2026-08-29 · **Status:** Accepted · Supersedes the storage choice inside D30; D30's argument stands

D30 established that voting needs a server — a URL is one-way, so N voters produce N isolated states with no merge point. That reasoning is untouched. What it got wrong was the storage.

D30 specified a key-value store with a 24-hour TTL, reasoning from "make the smallest possible hole in the no-backend rule". **That optimised the wrong thing.** Once a server exists at all, a slightly smaller one buys little, and it costs something real: **Phase 4 needs Supabase regardless** — standing groups, accounts, history. A throwaway KV now means doing the integration twice and deleting the first.

Three reasons it is better rather than merely equivalent:

- **Less code, not more.** A table insert through the client is fewer lines than a route handler plus a KV client. The "sixty lines" in D30 was the price of avoiding a real backend, not a saving.
- **Realtime may be what clears the bar.** D31 sets the test as "better than the group chat". Votes landing live as friends tap is materially better; a tally you refresh is the group chat with extra steps.
- **There is a dashboard.** When someone says their vote did not count, that is worth more than a KV you must write a script against.

### The security model, stated exactly

Realtime moves a read path into the browser, which is the part worth getting right.

**Writes go through an API route holding the service key server-side.** The route validates the room id and inserts. The service key never reaches the browser and no RLS policy is involved in the write path.

**Reads use Realtime Broadcast, not `postgres_changes`.** The channel is named by the room id. Broadcast avoids exposing table reads to the anon key entirely — a `postgres_changes` subscription would need an RLS policy expressing "knows the room id", which is not an auth claim and is the shape of policy people get wrong. The route broadcasts after a successful insert; clients subscribe to the channel and also fetch once on load through the route.

The room id remains the secret: 128 bits, unguessable, the same model the existing share links already use.

**Consequence — three things this obliges that a KV did not:**

1. **Reconnection and a poll fallback.** A dropped socket must degrade to the fetch-on-load path, not to a screen that silently stops updating. A vote that lands and is never shown is worse than no live updates.
2. **Expiry is now a scheduled job.** Postgres has no TTL. D30's 24-hour window was what made "v1 has no history" architectural rather than a policy, so it must be preserved deliberately — a scheduled delete, not an intention.
3. **Free-tier projects pause after a stretch of inactivity.** A group that goes out weekly is fine; a longer gap means a cold start on the exact evening someone is trying to use it. Verify the current threshold rather than trusting this sentence.

**Still out of scope:** auth, accounts, group membership, RLS policy design. Those are Phase 4. Adding a login before anyone has seen the thing work once is the wrong order.

**Unchanged from D30:** the ballot stays in the URL, the store holds only votes, `resolve(ballot, votes)` is a pure function with no I/O, and **the spend cap goes in on day one**.

---

## D36 — Venue content is imported once from Google Places, then owned

**Date:** 2026-08-29 · **Status:** Accepted · Supersedes D2

D2 ruled against bulk-pulling because OSM and Places "carry nothing at all for `pairedWith`, `community`, `offRadar` or the descriptive copy — those four fields are the product". Two of those four no longer exist (D28, D29) and a third is no longer a mechanic. **The argument does not hold, and its conclusion goes with it.**

What replaced it is a different problem. A going-out product for residents needs eighty venues with *correct opening hours*, and hours are the one thing hand-authoring is worst at: they change without notice, and a resident notices a wrong closing time immediately where a visitor would not (R8).

**The import is one-time.** Places supplies names, coordinates, hours and price level; from then on the seed file is ours and is maintained by hand. No API key in production, no runtime dependency, no per-request cost, and the site stays statically generated.

### The risk, stated rather than discovered later

**Google restricts caching Places content.** Place IDs may be stored indefinitely; most other fields generally may not be retained beyond a short window. Writing imported hours into a file committed to git is the part those terms restrict, and this decision accepts that risk knowingly rather than through ignorance of it.

Two alternatives were considered and rejected for this phase: fetching at runtime with a short cache, which is the clearly compliant shape but adds a key, a route and a per-view cost; and using Places for discovery only, writing hours by hand, which sidesteps the question but is slow.

**Mitigations that cost nothing and should be done anyway:**

- Keep `placeId` on every imported venue. It is the one field with no retention limit, and it is what makes a later move to runtime fetching a swap rather than a re-import.
- Carry Google attribution wherever imported data is shown.
- Keep `lastVerified` honest. An imported hour is *fetched*, not *checked* — the date records when it was pulled, and the aim is for a human to have confirmed the ones that matter.
- The import is a tool, not a build step. `tools/import-places.mjs` runs on demand with a key from the environment, so the key never enters the repo and the output is reviewed like any other content change.

**Consequence:** the seed file becomes machine-seeded and human-owned. Nothing in the schema changes — `hours`, `priceLevel` and `coords` are the same fields either way, which is what makes the provenance swappable.

**Rules out:** nothing permanently. If the retention terms turn out to prohibit this, the fix is the runtime route that was already designed, and the `placeId` field is what makes that a swap rather than starting again.

---

## D37 — Vote first, then plan. The group says how many places.

**Date:** 2026-08-29 · **Status:** Accepted · Refines D29 and D24

The day builder was doing two jobs. It was the shortlist you voted on *and* the itinerary you sequenced, which meant the vote resolved to a single winner and then had nowhere to go — the whole thing read as a poll rather than a plan.

**Voting answers *what*. The timeline answers *when and in what order*.** They are different questions and they now happen in that order.

The ballot carries **how many places the night needs**, chosen when it is created. That is the question the group is actually putting: "where should we go?" with one answer is a different evening from "where are the three places we're going", and a vote that does not know which it is has to guess afterwards. The top `stops` candidates by approval become the itinerary, in approval order, and the planner opens with them loaded.

**A place nobody approved is never included, even to reach the count.** A night of three should not contain somewhere every person said no to just to make up the number — the count is what the group asked for, not a quota to fill.

`setStops` replaces the day wholesale rather than adding in a loop. One intent, one write; and it discards the shortlist deliberately, because the losers should not still be sitting in the planner after the vote decided against them.

**Consequence:** dwell time moves onto the stop itself. It had lived only in the Reorder tab, which put the number the entire schedule is computed from two taps away from the schedule. Every change retimes every arrival below it, which is the point — the day is a budget and this is the part of it a person controls (D24).

**Rules out:** resolving a vote to a single winner. `Result.chosen` is the night; `Result.winner` survives as the headline of that set, not as the answer.

## D38 — Four palettes on two axes, and the backgrounds have to differ

**Decided 2026-08-29.** Extends D21 and D26; supersedes neither.

Appearance (`auto` / `light` / `dark`) and palette (`monsoon` / `laterite` /
`neon` / `paper`) are independent attributes on `<html>` — `data-theme` and
`data-palette` — because they are independent wants. Somebody can prefer
Laterite and still want it to follow the OS at night.

**The first attempt was wrong in a way worth recording.** All four palettes
passed AA and all four looked, at a glance, like the same page with a different
button colour: their backgrounds sat within ΔE 5 of one another. A menu offering
four choices a person cannot tell apart is worse than not offering them. The
backgrounds now carry the palette — cream, terracotta, pink, cool grey — and
`globals.test.ts` holds a floor on the separation so a fifth palette cannot
quietly land back in the same place. The floor is lower in dark (4) than in
light (6) because near-black colours are compressed in Lab, not as a concession.

**Every value is measured, and now the measurement runs.** `globals.test.ts`
reads the hexes back out of `globals.css`, resolves each palette the way a
browser would, and puts all eight through WCAG contrast and ΔE. D21 established
the rule; until now it was enforced by whoever remembered it. Thirteen text
pairs per palette per appearance, plus accent-versus-gold separation.

**Block order in `globals.css` is load bearing**, and there is a test for that
too: `:root[data-palette=x]` and `:root:not([data-theme=light])` have equal
specificity, so a light palette declared below the dark blocks wins in dark
mode. That bug is invisible to whichever half of reviewers use the other OS
setting — the same shape as the two-dark-blocks bug this file already guards.

`--forest`, `--forest-deep` and `--forest-mid` are gone. The first two had no
reader anywhere in the codebase; the third is now `--brand`, because a token
named `forest-mid` holding a rust red is the same class of lie as a token with
no job (D21).

The palette control is a disclosure button rather than the D26 pill row. The
pill row plus the header CTA overflowed a 390px viewport by 33px (C29), and
adding a second axis to it would only have been worse.

Refs: D21, D26, D27, C29

## D39 — The three markets come back, through the importer

**Decided 2026-08-29.** Extends D36.

Central Market, the Russian Market and the Night Market were dropped when the
seed file was rewritten around bars and restaurants. They are back, because a
resident's evening genuinely includes them and Toul Tom Poung is named after
one.

They came in through `tools/import-places.mjs` like the other 82 rather than
being typed from what anyone remembers. Rule 4 is that opening hours are never
invented, and "Central Market shuts about five" is memory, not a source. Two
fields were edited afterwards and both are commented at the entry, because a
re-import would silently undo them: the Russian Market's official name is Toul
Tompong Market and nobody calls it that, and Google types the Night Market
`tourist_attraction`, which the importer mapped to `nature`.

Refs: D36, R1
