# Verified — MapRaccoon

> **Everything here remains true of the code on `main`.** The product pivoted on 2026-08-29 (`docs/PIVOT.md`) but no code changed with it, so observations like "the home page's initial sort is off-radar descending" are still accurate statements about the shipped build — they simply describe a product that is being replaced. A verified fact does not become false when the plan changes; it becomes history. The Corrections table is the most durable thing in this doc set and carries over unchanged.

Evidence log. A claim goes here only when something was actually run, read, or observed — not when it was assumed or planned.

Status key: **VERIFIED** (observed directly) · **ASSUMED** (taken from documentation, not confirmed against a running system) · **PENDING** (not yet attempted).

This distinction matters more than usual here, because the product's content makes factual claims about real places that people will act on. See R1.

---

## Phase 1 — Foundation

### Toolchain and build

| Claim | Status | Evidence | Date |
|---|---|---|---|
| Repo was an empty skeleton before this work | **VERIFIED** | One commit `4b9b2e6` touching `README.md` only; no `package.json` | 2026-08-29 |
| Next 16.3.3, React 19.2.8, Tailwind v4, TypeScript 5 | **VERIFIED** | `package.json` after `create-next-app`; `node -p "require('next/package.json').version"` → `16.3.3` | 2026-08-29 |
| Next 16 requires Node >= 20.9.0 | **VERIFIED** | `require('next/package.json').engines` → `{"node":">=20.9.0"}`. Local Node is v26.5.1 | 2026-08-29 |
| **Next 16 renamed `middleware.ts` to `proxy.ts`** with a named `proxy` export | **VERIFIED** | `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` lines 35 and 43; `constants.js` defines `PROXY_FILENAME = 'proxy'`. Initially written as `src/middleware.ts` and corrected | 2026-08-29 |
| Next 16 auto-generates `AGENTS.md` and `CLAUDE.md` on dev start | **VERIFIED** | Dev server log: "Generated AGENTS.md and CLAUDE.md for AI agents." It overwrote the hand-written files once; `agentRules: false` now set in `next.config.ts` | 2026-08-29 |
| `npm audit` reports zero vulnerabilities | **VERIFIED** | `npm audit` → "found 0 vulnerabilities" | 2026-08-29 |
| Tailwind v4 is CSS-first with no config file | **VERIFIED** | `postcss.config.mjs` has the single `@tailwindcss/postcss` plugin; no `tailwind.config.*` exists; `globals.css` uses `@import "tailwindcss"` and `@theme inline` | 2026-08-29 |
| `npm run typecheck` clean under `strict` + `noUncheckedIndexedAccess` | **VERIFIED** | `npx tsc --noEmit` → no output. Two errors were found and fixed first: an undefined `LayoutProps` global in the generated layout, and an unsound indexed write in `mergeDictionary` | 2026-08-29 |
| `npm run lint` clean | **VERIFIED** | `npx eslint` → no output | 2026-08-29 |
| `npm run build` succeeds and statically generates 50 pages | **VERIFIED** | Build output: 42 spot pages, 4 city pages, `/en`, `/_not-found`, all marked ● (SSG); Proxy detected as `ƒ` | 2026-08-29 |
| `npm test` passes | **VERIFIED** | `npx vitest run` → 3 files, 20 tests passed | 2026-08-29 |

### Behaviour on a running server

Observed against `npm run dev` on `http://localhost:3000`, with **no** `NEXT_PUBLIC_MAPBOX_TOKEN` set.

| Claim | Status | Evidence | Date |
|---|---|---|---|
| `/` redirects to `/en` | **VERIFIED** | `curl -o /dev/null -w '%{http_code} %{redirect_url}'` → `307 http://localhost:3000/en` | 2026-08-29 |
| Home, spot and city pages return 200 | **VERIFIED** | `/en`, `/en/spot/preah-khan`, `/en/city/battambang` → 200 | 2026-08-29 |
| An unknown slug returns 404 | **VERIFIED** | `/en/spot/nope` → 404 | 2026-08-29 |
| **The home page's initial sort is off-radar descending, with no interaction** | **VERIFIED** | First four `<h3>` in the server-rendered HTML: Banteay Chhmar (88), ACCB (85), Trapeang Sangkae (85), Kamping Puoy (78). Angkor Wat (0) sorts last | 2026-08-29 |
| The map degrades to a placeholder without a token | **VERIFIED** | "Map not configured" present in the rendered home page; list and filters render normally alongside it | 2026-08-29 |
| Pins render, and click/hover sync between map and list | **PENDING** | Requires a Mapbox token. jsdom cannot run WebGL, so this needs a browser check once a token exists | — |

### Content

| Claim | Status | Evidence | Date |
|---|---|---|---|
| 42 spots across four base cities | **VERIFIED** | `spots.test.ts` covers all four cities; build generated 42 spot routes | 2026-08-29 |
| All coordinates fall inside Cambodia's bounding box | **VERIFIED** | `spots.test.ts` — checked against `CAMBODIA_BBOX` [102.3, 9.8, 107.7, 14.8] | 2026-08-29 |
| Every `pairedWith` resolves, and always to a better-known spot | **VERIFIED** | `spots.test.ts` — both invariants asserted per entry | 2026-08-29 |
| Every spot carries at least one source URL | **VERIFIED** | Enforced by the schema (`z.array(z.url()).min(1)`); the build would fail otherwise | 2026-08-29 |
| **The content of those spots is factually accurate** | **ASSUMED** | Written editorially from general knowledge. Coordinates, entry fees, opening times, seasonal advice and community-impact claims have **not** been verified against a primary source or on the ground. This is R1, and it is the most serious open item in the project | — |
| Named organisations (ACCB, Phare Ponleu Selpak, Banteay Chhmar CBT, Trapeang Sangkae) exist and operate as described | **ASSUMED** | Same caveat. These are real organisations being described in a public product; the descriptions need their confirmation. See R4 | — |

### Landing page and design system

Observed against `npm run dev`, with **no** `NEXT_PUBLIC_MAPBOX_TOKEN` set.

| Claim | Status | Evidence | Date |
|---|---|---|---|
| The landing page renders all four sections | **VERIFIED** | `/en` HTML contains "Everyone sees", "Pick a base, start at the bottom", "Instead of the crowds", "Where your money actually goes" | 2026-08-29 |
| The constellation plots all 42 spots | **VERIFIED** | 42 marker anchors in the rendered `/en` HTML — one per spot, no duplicates | 2026-08-29 |
| The pairing rail shows 8 cards, the community rail 4 | **VERIFIED** | 16 and 8 raw grep hits respectively; each element appears twice because Next emits both the SSR HTML and the RSC flight payload | 2026-08-29 |
| The map and list moved to `/discover`, still 200 | **VERIFIED** | `/en/discover` → 200; build output lists it as a separate SSG route | 2026-08-29 |
| 50 pages still generate after the redesign | **VERIFIED** | Build output: landing, `/discover`, 4 city, 42 spot, `_not-found` | 2026-08-29 |
| Build, lint, typecheck and tests stayed clean through the redesign | **VERIFIED** | All four re-run after the landing page landed; 20 tests, zero lint and type output | 2026-08-29 |
| **themapcambodia.com's design system, as recorded in `docs/DESIGN-SYSTEM.md`** | **VERIFIED** | Read from the rendered HTML the user supplied: font module names (Playfair Display, Bona Nova, DM Sans, Great Vibes, Lato), inline per-city hex values, and the section order. Not recalled | 2026-08-29 |
| **themapcambodia.com already has an "off the beaten path" section** | **VERIFIED** | Section `aria-labelledby="off-beaten-path-heading"`, heading "Cambodia off the beaten path", with an Instagram-linked card scroller. This corrects the brief's implied differentiator — see D16 | 2026-08-29 |
| Their stated scale: 220+ distribution points, 18.1k Instagram followers, 9 destinations, 8 locales | **VERIFIED** | Trust row, `followersCount: 18165` in the flight payload, destination chip list, `hrefLang` alternates | 2026-08-29 |
| **Two of the brief's V2 ideas already ship on their site** | **VERIFIED** | Footer and nav link `/en/suggest-a-place` ("Know a place we should feature? Send us a tip") and `/en/tools/crowd-forecast-siem-reap`, `-phnom-penh`, `-koh-rong`. The brief lists "suggest a place" and crowd/season prediction as differentiating V2 features | 2026-08-29 |
| They have trip-planning **content**, not a trip-planning **tool** | **VERIFIED** | `/en/plan-my-trip` and `/en/cambodia/itineraries` are article routes ("3 days, 7 days, 2 weeks… Find the perfect itinerary"). No route, control or client bundle in the payload suggests interactive multi-stop routing | 2026-08-29 |
| Their catalogue is roughly 250 places across 9 destinations | **VERIFIED** | The inline RSC flight payload carries the whole `en.common` i18n bundle, including a `locations` object with ~250 numbered entries and 29 Angkor temple entries | 2026-08-29 |
| Any claim about their traffic, revenue or conversion | **PENDING** | Not observable from the HTML, and not assumed anywhere in our docs | — |

### Mobile layout

Measured with `tools/probe.mjs` over CDP at `deviceScaleFactor: 2, mobile: true`.

| Claim | Status | Evidence | Date |
|---|---|---|---|
| **The home page overflowed horizontally on mobile** | **VERIFIED** | `documentElement.scrollWidth` 630 at a 390px viewport, 153 elements past the right edge. Root cause isolated by probing min-content widths: the `CityPicks` picks panel measured 610px min-content because a `truncate` (`white-space: nowrap`) made a spot blurb's full string the grid track's floor | 2026-08-29 |
| Overflow is fixed, at three widths | **VERIFIED** | After the fix: `{w:320, scrollWidth:320, trueOverflow:0}`, `{w:390, …:0}`, `{w:768, …:0}` on `/en`. Elements inside deliberate scroll rails excluded by walking ancestors for `overflow-x` | 2026-08-29 |
| `/discover`, `/city/*` and `/spot/*` never overflowed | **VERIFIED** | `scrollWidth` equalled the viewport and overflow count was 0 on all three before any fix. The bug was home-only | 2026-08-29 |
| Filter chips were below the touch-target floor | **VERIFIED** | 18 controls under 40px on `/discover`, chips measured 30px. Now `min-h-11` | 2026-08-29 |
| The mobile list/map toggle switches views | **VERIFIED** | Scripted click through CDP on `/en/discover` at 390px, then screenshot: the map placeholder renders in the first viewport instead of below 42 cards | 2026-08-29 |
| **`chrome --headless --screenshot` with `--window-size` disagrees with CDP measurement** | **VERIFIED** | It produced images showing content cut off on `/discover`, a page the probe measured as having zero overflow. Screenshots now go through `Page.captureScreenshot` under the same emulation | 2026-08-29 |
| The map renders pins with a real token | **PENDING** | Still blocked on B1 — no Mapbox account | — |

### Colour

Measured with `tools/contrast.mjs` (WCAG, over CDP) and a CIELAB ΔE script.

| Claim | Status | Evidence | Date |
|---|---|---|---|
| **The first palette collided twelve ways** | **VERIFIED** | ΔE matrix over all role colours: `forest-mid`~`cat-nature` ΔE **0.0** (identical), `city:phnom-penh`~`cat:food` 9.9, `gold`~`cat:temple` 11.6, `accent`~`city:siem-reap` 12.2, `city:phnom-penh`~`city:battambang` 24.1, and seven more under the 25 threshold | 2026-08-29 |
| The first palette failed WCAG AA twice | **VERIFIED** | `gold` on `surface-sunk` 3.56:1; white on the Phnom Penh feature card 4.14:1. Both need 4.5 | 2026-08-29 |
| The replacement palette separates cleanly | **VERIFIED** | Minimum ΔE across all seven on-page role colours: **29.6** light, **29.2** dark. Category pins, which need only differ from each other, minimum ΔE 38.1 light / 26.9 dark | 2026-08-29 |
| Zero contrast failures, both modes, four routes | **VERIFIED** | `tools/contrast.mjs` on `/en`, `/en/discover`, `/en/spot/banteay-chhmar`, `/en/city/kampot-kep` in light and dark → 0 failures each | 2026-08-29 |
| **Dark mode shipped two invisible-text defects** | **VERIFIED** | Probed the live DOM: `--ink` (light in dark mode) on the white "View details" button → **1.15:1**; `--accent-contrast` (near-black in dark mode) on the indigo "See all" button → **2.46:1**. Both are the same bug — a colour that flips against a surface that does not | 2026-08-29 |
| **The contrast tool was wrong twice before it was right** | **VERIFIED** | A regex reading `oklab(0.999994 … / 0.8)` as RGB reported `text-white/80` at 2.76:1 (false); stopping the backdrop walk at the first non-transparent layer reported four `bg-white/15` chips as failures (false). Fixed by resolving through a canvas and compositing the full stack | 2026-08-29 |
| The palette looks good | **ASSUMED** | Contrast and separation are measured; "good" is not. Reviewed by eye at 1280px in both modes only — not at mobile widths, not on a calibrated display, not by anyone but the author | — |

---

## Corrections

Things this repo's own documentation or code got wrong, and when they were fixed. Kept because documentation is a lead, not evidence — including this repo's.

| # | What was wrong | How it surfaced | Fixed |
|---|---|---|---|
| C1 | `src/middleware.ts` used the Next 15 convention; Next 16 wants `src/proxy.ts` with a `proxy` export | Cross-checked against `node_modules/next/dist/docs/` rather than assumed | 2026-08-29 |
| C2 | The scaffold's `layout.tsx` referenced a `LayoutProps<"/">` global that only exists after a build | `tsc --noEmit` on a clean checkout | 2026-08-29 |
| C3 | The approved working plan said `src/data/spots.ts` would hold "~40" spots; it holds 42 | Counted after writing | 2026-08-29 |
| C4 | The working plan named `src/store/filters.ts` and `src/lib/scoring.ts` as if the map would consume them directly; the map takes props instead, and only `DiscoverView` reads the store | Observed while wiring the components | 2026-08-29 |
| C5 | Phase 1 code was written before `specs/1-foundation/spec.md` existed, breaking this repo's core working rule | The user asked why this repo had no `docs/` and `specs/` like `rocket/athena` and `ass-hub/foodraccoon`. Kept and back-filled rather than reverted — D14 | 2026-08-29 |
| C6 | The brief treats off-the-radar framing as the differentiator. The competitor already ships an "off the beaten path" section | Read directly in their rendered HTML. The real differentiators are the default sort, the pairing mechanic, and the itinerary builder they lack — D16 | 2026-08-29 |
| C7 | Next 16 silently overwrote the hand-written `AGENTS.md` and `CLAUDE.md` on dev start | Dev server log line; fixed with `agentRules: false` in `next.config.ts` | 2026-08-29 |
| C8 | The home page was unusable on mobile — 630px wide at a 390px viewport — and this was not visible from the source. A `truncate` deep inside `CityPicks` set the grid track's min-content width | Measured with CDP, not read. `truncate` → `line-clamp-1` plus `min-w-0` on the flex ancestors | 2026-08-29 |
| C9 | Cities were unreachable on mobile: the nav list is `hidden md:flex` and there was no drawer or alternative | Noticed while reading the first mobile screenshot. Fixed with a scrolling city rail as a second header row | 2026-08-29 |
| C10 | On `/discover` the map sat below all 42 result cards on a phone, making it effectively unreachable | Same screenshot pass. Fixed with a mobile-only list/map toggle | 2026-08-29 |
| C11 | The list/map toggle first shipped labelled "Discover" / "On The Map", reusing unrelated dictionary keys, and `capitalize` title-cased the multi-word string | Read back from the verification screenshot. Added `filters.viewList` / `filters.viewMap` | 2026-08-29 |
| C12 | The first palette was assembled by eye and collided twelve ways, including two colours that were literally identical. `docs/DESIGN-SYSTEM.md` had asserted the colour system was semantic and non-overlapping | Measured with a ΔE matrix after the user said the colouring was not good. Superseded by D21 | 2026-08-29 |
| C13 | Dark mode had never been looked at, and contained two near-invisible text defects (1.15:1, 2.46:1) | `docs/PROGRESS.md` had listed this as a known gap; probing the live DOM confirmed it | 2026-08-29 |
| C14 | The picks list swatch was a tinted grey block carrying no information — it read as a broken image | Visible in the first desktop screenshot. Replaced with the item's rank in the off-radar order | 2026-08-29 |
| C15 | `tools/contrast.mjs` produced confident false failures on its first two runs, from parsing `oklab()` as `rgb()` and from stopping the backdrop walk at a translucent layer | Caught by checking a flagged element's computed style instead of trusting the tool. A measuring tool that has not been checked against a known-good case is not evidence | 2026-08-29 |
| C16 | `docs/DESIGN-SYSTEM.md` described rails as one pattern — "rails scroll horizontally with `snap-x snap-mandatory`, cards at `85vw` on mobile". Three rails exist and only one behaves that way | `grep -rn "overflow-x-auto" src --include="*.tsx"` returns three hits; `grep -rn "snap-x"` returns one. The header city rail and the `/discover` chip rails are plain `overflow-x-auto` with no snap and no card sizing. `.rail` is only the scrollbar-hiding utility. Doc corrected | 2026-08-29 |
| C17 | R9 (memorial sites are never written in the product's voice) is enforced by nothing but the prose. There is no field in the content schema marking those five spots, so no component can branch on it | Read `src/lib/spots/schema.ts` — no memorial, tone or severity field. The sober treatment exists only in the hand-written copy in `src/data/spots.ts` (Choeung Ek line 447, the Secret Lake 829, Phnom Sampeau 931). A future generated blurb, badge or off-radar meter would apply to them silently | 2026-08-29 |
| C18 | The footer caveat that R1 and R4 depend on is the least prominent text in the footer | Read `src/app/[locale]/layout.tsx:159-164`: the unverified-content sentence sits in the last of four columns at `text-xs text-muted`. The wording was never softened; the layout softened it. Open design question, not yet fixed | 2026-08-29 |
| C19 | Kamping Puoy shipped paired to Phnom Sampeau — one forced-labour site framed as the alternative to another, hooked "no ticket booth, no tour circuit, and today the place the town comes to swim". A live R9 violation in Phase 1 content | Caught by the `sensitive` refinement added in D25 the moment the five sites were marked; the build failed. Pairing removed, the factual half kept in the description | 2026-08-29 |
| C20 | The travel estimate used a flat 22 km/h, which turned the 40-minute Kep–Kampot drive into 1h 50m and ate seven hours of a nine-hour day in phantom travel | Found by running the builder over CDP, not by reading it. The distance factor had been calibrated against NH6 and the speed never had been. Replaced with distance-banded speeds (16 / 36 / 55 km/h) calibrated against two journeys with known real durations | 2026-08-29 |
| C21 | `MapPlaceholder` printed `NEXT_PUBLIC_MAPBOX_TOKEN` in a `<code>` block to travellers. The token-missing state is this repo's default deployed state (D11), so this was the normal experience, not an edge case | Read off the rendered page at 390px. Replaced with the spot's real coordinates and an outbound maps link; the `SpotMap` test now asserts the variable name is *absent* rather than present | 2026-08-29 |
| C22 | The route suggestion tray offered spots from other cities — a Battambang spot priced itself at "28h 20m over" inside a Kampot day. `AddToDay` guarded on city; the tray did not | Read off the rendered tail row at 1280px. Tray now filtered to the day's city | 2026-08-29 |
| C23 | The theme toggle (D26) shipped a hydration mismatch on every page. Its inline script sets `data-theme` on `<html>` before paint, so the server-rendered element differs from the client one, and React logged "some attributes of the server rendered HTML didn't match" on every load | Found by reading the dev-server log while checking that `open-now` sorting hydrated cleanly — the log was never checked when D26 shipped. Fixed with `suppressHydrationWarning` scoped to the single `<html>` element, which is the documented pattern for a pre-paint attribute. It does not extend to content: a text or ordering mismatch is a real bug | 2026-08-29 |
| C24 | Acceptance criterion 13 grepped the build for whatever `SUPABASE_SERVICE_KEY` contained. With the two Supabase keys swapped in `.env.local` it was grepping for the *publishable* key and passing for the wrong reason — while the actual secret key sat in `NEXT_PUBLIC_SUPABASE_ANON_KEY`, which Next inlines into the browser bundle | Found when writes 502'd and the direct insert returned `42501 row-level security`. **A check that depends on the thing it is checking is not a check.** Replaced with `tools/check-secrets.mjs`, which matches the *shape* of a secret (`sb_secret_`, a `service_role` JWT claim, `AIza…`, a PEM block) wherever it came from, and is proven to fail on a planted one | 2026-08-29 |
| C25 | `VoteScreen` read `localStorage` in a lazy `useState` initialiser to prefill the voter's name. The server rendered `""` and the client rendered the saved name, so React hit a hydration mismatch and recovered into a state where the "Start voting" button was **disabled while the input visibly contained a name** — the flow was unusable and looked fine | Found by driving the flow over CDP, not by reading it. Five hydration warnings on the page. Replaced with `useSyncExternalStore`, whose third argument is the server snapshot and exists for exactly this. Notable because `useNow.ts` already documents the rule this broke, and `useRouteStops` and `ThemeToggle` had already needed the same correction | 2026-08-29 |
| C26 | Three nav blocks — the desktop header list, the mobile rail and a footer column — linked to `/city/[city]`, which step 3 deleted. Nine dead links in the chrome of every page, all 404 | `grep -rn "locale}/city/"` after noticing the layout still mapped over neighbourhoods. The route deletion and its inbound links were done in different steps, which is how the gap opened. Header and rail removed (a neighbourhood is a filter, not a destination — D27); the footer and spot page now show the names as plain text | 2026-08-29 |
| C27 | Both maps in the product rendered as an empty grid. `projectCambodia` framed on `CAMBODIA_BBOX`, which D27 left five degrees wide against Phnom Penh's 0.06 — all 84 places stacked inside about 1% of the panel's width. The shared-day plot had the same bug: three BKK1 stops were one dot joined by a zero-length line | Measured over CDP after the user said the map was showing nothing: 84 dots, x-spread 1.1%. Nothing threw and no test failed, because there was no test. Frame is now derived from the data (`boundsOf`), and `project.test.ts` asserts the real dataset spreads across >40% of the box in both axes — mutation-checked by restoring the country frame, which fails it | 2026-08-29 |
| C28 | The constellation legend rendered nine colour chips with no colour. They had carried per-city colour, which D27 removed, so each `<span>` was painting an undefined background — nine invisible circles under a caption reading "Colour marks the base city". It also named Koh Pich and Sen Sok, which hold no places | Visible in the user's screenshot as a list of names with gaps before them. The chips and the caption are gone; neighbourhood names are now drawn on the plot where they orient you, and the footer's list is filtered to neighbourhoods that actually contain something | 2026-08-29 |
| C29 | The header overflowed every page at 390px — `scrollWidth` 423 against a 390 viewport — from the three-pill theme toggle sitting beside the CTA. Phase 3 recorded "0 horizontal overflow at 390 / 768 / 1280" as verified across five routes | Measured with `tools/probe.mjs`. The Phase 3 measurement was not wrong when taken; the pill row grew afterwards and nothing re-measured. Fixed by making the theme control a disclosure button, which also had to happen to fit a second axis | 2026-08-29 |
| C30 | The landing-page scatter plotted Choeung Ek — a dot for a killing field under the headline "Let's finally plan an actual hangout, eh?". D33's obligation is that every surface written in the product's voice carries its own enforced exclusion; this surface was built after D33 and got none | Found while fixing C27: the memorial is 5 km south of everything else, so it was also framing the plot and pushing all 82 venues into the top half. `Constellation.test.tsx` now holds the exclusion, mutation-checked. The `sensitive` field existed and was simply not consulted, which is C17's shape recurring on a new surface | 2026-08-29 |
| C31 | The landing page still stated the old thesis in full — "Forty-two places across four cities, ranked by how far off the radar they are… each one paired with the quieter place that beats it" — above 84 places in one city, with pairings and the off-radar score both deleted. The footer and the page metadata said the same. A "Choose where to start" grid held a single card | The user read it on screen. Three of these were live claims that the code had contradicted since D27/D28/D29 shipped; the dictionary was never revisited when the components were | 2026-08-29 |
| C32 | A second vote from the same person counted twice. `appendVote` inserted a row per POST and `resolve` counted every row, while the on-screen voter count de-duplicated by name — so one screen showed two totals for one room. The behaviour was asserted by a test named "counts each voter once even if they submit twice" that asserted `yes` was `2`; the name said the opposite of the assertion, which is why review passed it | Reproduced against the live store: Ana, Bo and Chey voted, Ana reopened the link and voted again, Dara voted. `GET` returned 5 rows for 4 names, the screen read "4 voted so far", and the Moon row read `4 · 1 · 0` — five marks from four people. Fixed by an upsert on `(room_id, voter)` plus a unique index (D40), enforced again in `resolve` so the suite can test it. Mutation-checked: reverting to `insert`, dropping `onConflict`, or removing the resolver pass each fail | 2026-08-30 |
| C33 | Reopening a ballot that already held votes offered exactly one action — "Start voting". No result path and no sign anyone had voted, so reaching the tally meant marking every card again, which then counted you twice under C32. The organiser, who checks a poll repeatedly, was the person worst affected by both | Driven in headless Chrome against a room holding 4 votes: `buttons` on the entry screen was `["Start voting"]`. The entry screen now names who has voted and carries a "See where it's heading" button, and a returning voter's primary action reads "Change my answers" | 2026-08-30 |
| C34 | "{n} voted so far" meant two different things on two screens — before sending it excluded you, afterwards it included you — with nothing marking the switch, and a count never answered the question the line exists for | Observed in the same CDP run: "3 voted so far" on the submit screen, "4 voted so far" after sending. Replaced with named voters via `Intl.ListFormat`, "You" first; the names were already on the client and unused. `vote.waiting` and `vote.waitingOne` are deleted | 2026-08-30 |
| C35 | `stops` — how many places the group is choosing — was passed into `VoteScreen` and forwarded straight to `VoteResult`. The marking screens never mentioned it, so the organiser's answer never reached the people it governs, and a voter could not know whether approving one place or three was sensible | `grep -n stops src/components/vote/VoteScreen.tsx` returned only the prop, its type, and `stops={stops}`. Now stated on the entry screen and carried onto every card | 2026-08-30 |
| C36 | `dict.vote.expired` ("Votes are kept for a day. This one has gone.") had no reader anywhere in the app, so a group reopening yesterday's swept ballot was told "Nobody has voted yet" about a vote they remembered casting | Found by grepping every `vote.*` key for a reader. Now shown when the ballot's own slot date is before today in Phnom Penh, which needs no extra state — the date already travels in the link | 2026-08-30 |
| C37 | `/discover` built an **18,019px-tall** Mapbox canvas. The row was `lg:overflow-hidden` over a `lg:overflow-y-auto` list, which only bounds a scroll container if something gives the row a definite height — nothing did, so it grew to the height of 87 cards and the map's `h-full` resolved against that. Browsers paint only the top of a canvas that size, so the map rendered as a small tile with its own pins trailing down the page below it | The user asked what function the map served "other than being an eyesore" — it was broken, not useless. Measured with `tools/probe.mjs`: `822 × 18019` before, `822 × 748` after. Fixed by making the pane `lg:sticky lg:h-[100dvh]` and dropping the nested scrollers, which also leaves one scrollbar for the page | 2026-08-30 |
| C38 | The new `PlacePicker` offered **Tuol Sleng** as something to add, in a list headed "Find places to add" with an *Add* button beside a hotpot restaurant. It matched a search for its own neighbourhood | Found by driving the picker and reading what came back — the first add test put `tuol-sleng` in the day. C19's shape on a new surface, and C30's cause exactly: `sensitive` exists and a component built after D33 did not consult it. Now filtered through `plottableSpots()`, enforced by `PlacePicker.test.ts` and mutation-checked — searching the unfiltered list fails it | 2026-08-30 |
| C39 | `/discover`'s own list still offers memorials with an *Add* button, so Choeung Ek can be added to a day — and `createBallot` then strips it from the ballot, so it silently disappears when the day is put to a vote. The picker beside it now excludes them, so two adjacent surfaces disagree | Measured on the rendered page: two memorial cards present in the list at 1280px. **Not fixed** — removing memorials from `/discover` changes what that page is, and D33 kept them deliberately. Raised for a decision rather than changed; the silent strip at ballot time is the part that is a defect either way | 2026-08-30 |
| C40 | Removing `/discover`'s list (D45) left **no link anywhere in the product to a memorial spot page**. The list was the last route to them: the picker excludes them by design (C38) and the constellation always did | Followed from the change rather than found afterwards, and recorded before shipping. The pages still render with D25's treatment intact; nothing points at them. Smaller than the wrong C39 describes — Choeung Ek carrying an *Add* button beside a hotpot restaurant — but still open, and wanting a deliberate answer rather than a side effect | 2026-08-30 |
| C41 | The `/discover` map pane rendered **nothing**. The tab worked, the box measured 483 px, and the Mapbox div inside it measured **0** — its `height: 100%` resolved against a flex item whose own height came from `flex-grow`, which is indefinite, so the percentage resolved to auto | Introduced by D45's rewrite and caught from the user's screenshot of an empty box, then measured with `tools/probe.mjs`: pane 1240×483, map 1238×0. Fixed with `relative` + `absolute inset-0`, which gives a definite box whatever the flex maths does. **This is C37's mirror image** — that one gave the map 18,019 px of height from an unbounded parent, this one gave it none from an indefinite one, and both looked like the map was simply missing | 2026-08-30 |
| C42 | Selecting a second map pin closed the popup instead of moving it, so memorial pins in particular read as not responding at all | Found by driving two pin clicks in a row over CDP — the first popup rendered, the second returned `undefined`. Mapbox's `closeOnClick` counts a click on another marker as an outside click. Set to `false`, with an explicit close control in the card | 2026-08-30 |

## Phase 2 — Itinerary builder

Measured on 2026-08-29 at `phase/2-itinerary`, against `specs/2-itinerary/spec.md`.

### Toolchain

- `npm run build`, `lint`, `typecheck` clean; `npm test` 67 passing across 8 files (was 20 across 3) — **VERIFIED**
- 51 pages still statically generated. The day sheet uses the History API rather than `useSearchParams`, which would have opted every page into dynamic rendering — **VERIFIED**

### Behaviour, with no Mapbox token

The token is unset, which is this repo's real state (B1, D11). Everything below was observed with it unset.

- A day builds, reorders and schedules end to end. A seeded three-stop Kampot day renders `3 stops · 6h 15m planned · 2h 15m left` — **VERIFIED**
- The dock bar appears only once a day exists, measures 57px including its border, and reads `A day in Kampot & Kep · 3 stops · 1h 10m left` at 390px — **VERIFIED**
- No page mentions an environment variable; the no-map state carries real coordinates and an outbound link (see C21) — **VERIFIED**
- Every travel figure on screen is prefixed `est.` — **VERIFIED**
- `fullThresholdMins()` computes 50 minutes from the content, and a test proves it moves when a shorter spot enters the dataset — **VERIFIED**
- No add button is ever disabled; over-budget adds render `Add · 4h over` and stay pressable with `aria-describedby` to their cost line — **VERIFIED** (0 disabled add buttons found in the DOM)

### Memorial sites (D25, R9)

- All five pages — Tuol Sleng, Choeung Ek, the Secret Lake, Kamping Puoy, Phnom Sampeau — render no meter in the article header, no pairing, and the explicit withheld statement — **VERIFIED** (probed individually, scoped to `article > header`)
- In the route, a memorial row renders `2h here, as a minimum · not ranked, not paired` with `—` in place of a score — **VERIFIED**
- The day average footnotes its denominator: `Day off-radar average 19 · Famous (2 of 3 stops scored)` — **VERIFIED**
- A sensitive spot carrying a `pairedWith` fails `spotsSchema.safeParse` — **VERIFIED** (test)

### Layout and colour

- `tools/probe.mjs` at 390, 768 and 1280 on `/en`, `/en/discover` and two spot pages: `scrollWidth - innerWidth = 0` on all twelve — **VERIFIED**
- `tools/contrast.mjs` on `/discover`, an ordinary spot page and a memorial page, in both colour modes: 0 failures on all six — **VERIFIED**

### Second pass — the design direction's layout, the reorder tab and the share view

- Spot page rebuilt to the direction. Measured at 1280 on `/en/spot/tuol-sleng` against `/en/spot/trapeang-sangkae`: memorial article 596px vs 1024px, `h1` Playfair 33px/400 vs 36px/700, every section radius 0, no city dot, **0 gold elements** on the memorial page, heading "Visiting" not "Practical" — **VERIFIED**
- The pairing and community bands bleed to the viewport: 390px against 350px for cards on a 390px screen — **VERIFIED**
- Reading order on `/en/spot/trapeang-sangkae` at 390, measured by position rather than DOM order: score 421 → pairing 599 → practical 944 → community 1555 → map 1809 → sources 2113 — **VERIFIED**
- `/plan/[id]` renders a shared day from the URL alone with no token and no backend: `3 places in Kampot & Kep, 08:30 to 14:45`, 3 dots and 2 dashed legs on the Constellation graticule, and `One stop is a memorial site and is drawn without a score` — **VERIFIED**
- A malformed share link renders `This link doesn't describe a day we can read`, not a 500 — **VERIFIED**
- The projection is now one function (`src/lib/geo/project.ts`) shared by `Constellation` and the share view, so the two cannot drift — **VERIFIED**
- 0 overflow at 390/768/1280 and 0 contrast failures in both modes, including `/plan/[id]` — **VERIFIED**

### Theme toggle (D26)

- The header control moves the palette in all three states: `dark` sets `data-theme="dark"` and `body` background `rgb(16, 19, 16)`; `light` sets `#faf6ef`; `auto` removes the attribute and follows the system — **VERIFIED**
- A stored dark choice is applied at load with the attribute already present on first evaluation, so there is no light flash — **VERIFIED**
- All 17 palette tokens resolve to their dark values under explicit `data-theme="dark"` — **VERIFIED**
- Contrast under explicit dark: 0 failures across 363, 72 and 56 text nodes on `/discover`, an ordinary spot page and a memorial page — **VERIFIED**
- 0 overflow at 390/768/1280 with the control added to the header — **VERIFIED**

### Not verified

- Pins rendering and click/hover sync still need a token (B1, unchanged from Phase 1)
- The builder has been exercised by seeding `localStorage` and reading the rendered DOM, not by driving a full click-through add → reorder → share journey
- The reorder tab's controls are built and typed but have not been clicked in a browser; its underlying reorder logic is covered by tests
- The colour of every frame in the design direction is the pre-D21 palette (543 occurrences of the old values against 17 of the shipped ones). The layout was implemented; the colours deliberately were not. The app will not match the frames' hues and is not intended to

### Step 7 — the vote store, verified against the live project

- Three people POST votes to `/api/room/:id`; all three return 200, are stored, and read back in submission order — **VERIFIED**
- `resolve()` turns those stored votes into `Winner: Wat Phnom, dissent: Mei`, with the runner-up and full tally — **VERIFIED** end to end, HTTP through to decision
- A short or malformed room id returns 404, identically to an unknown one, so the endpoint cannot be used to probe which rooms exist — **VERIFIED**
- A missing store returns 502 rather than an empty array. An empty array reads as "nobody has voted yet" and a group would wait on it forever — **VERIFIED**
- **The anon key cannot read the votes table** (`[]` — RLS hides every row) and **cannot write to it** (`42501`), while the same key **does** receive Realtime broadcasts. That is the entire reason D35 chose Broadcast over `postgres_changes` — **VERIFIED**, all three
- A live update reached a subscriber holding only the anon key within 3 seconds of a vote landing — **VERIFIED**
- `npm run check:secrets`: 23 client files scanned, no secrets. Proven to fail on a planted `sb_secret_` — **VERIFIED**

### Not verified in step 7

- The 24-hour expiry has not been observed expiring anything. Both the scheduled sweep and the route's own sweep are written; neither has been watched delete a real row.
- The rate limiter is per-instance and has not been tested across a cold start, because it cannot survive one by design.
- No UI. Every vote above was placed with `curl`.

### Step 8 — the voting UI, driven end to end

Four voters through `/en/vote/[id]`, three of them by HTTP and one by clicking:

- Name is asked once and remembered; the button enables and 0 hydration warnings remain (C25) — **VERIFIED**
- Three candidates, one card at a time, in ballot order — **VERIFIED**
- A card states the venue's state at the *slot*, not now: Wat Phnom shows `Daun Penh · $ · closed then` for a Friday 8pm ballot — **VERIFIED**
- Votes send, `role="status"` reports `3 voted so far`, and the count rises as others vote — **VERIFIED**
- The result reads `DECIDED / Russian Market / Toul Tom Poung · $ / 1 person said no. / Runner-up: Central Market`, with the full tally beneath — **VERIFIED**
- **The dissent is named on screen**, which is the point of having no veto (D30) — **VERIFIED**
- A malformed ballot renders "This link doesn't describe a vote we can read", not a crash — **VERIFIED**
- 0 overflow at 390/768/1280; 0 contrast failures in both colour modes — **VERIFIED**

### Not verified in step 8

- **No two-browser test.** The live-update path was verified at the library level in step 7, not by watching one browser update because another voted. The polling fallback means a broken socket degrades rather than breaks, but that has not been observed either.
- There is still no way to *create* a ballot from the UI. Every ballot above was built by a script.

### Step 9 — the loop closes

The whole product, driven end to end in a browser:

- A day of three places on `/discover` → **Ask the others** → a link → the same three candidates in the same order → voting → `DECIDED / Central Market / Nobody objected. / Runner-up: Russian Market` — **VERIFIED**
- The link is generated client-side and contains everything: candidates, slot and room secret. Nothing is created server-side before sharing — **VERIFIED**
- `OpenNow` renders the live state on a spot page (`Open until 18:00`) while `WeeklyHours` renders the schedule server-side. The live state appears **only** in the RSC payload, never in the rendered markup — **VERIFIED** by stripping `<script>` blocks from the served HTML and searching what remained
- 0 overflow at 390/768/1280 across four routes; 0 contrast failures in both modes; 0 hydration warnings — **VERIFIED**
- 0 links to the deleted `/city/[city]` remain (C26) — **VERIFIED**


### Production, re-checked 2026-08-30

The Phase 4 notes recorded the deployed vote route as returning 401/302 for want
of environment variables. **That is no longer true and the note was stale.**
Measured against `https://mapraccoon.vercel.app`:

- `/en`, `/en/discover`, `/en/opengraph-image` all 200 — **VERIFIED**
- `GET /api/room/<id>` returns `200 {"votes":[]}`, so `isConfigured()` is true and
  both Supabase variables are present in production — **VERIFIED**
- `POST` then `GET` on a throwaway room round-trips: `{"ok":true}` then the vote
  read back — **VERIFIED**
- The live build is still `b558b5b`; the landing page serves "Start a night",
  which D41 replaced — **VERIFIED**, and the reason a deploy is outstanding

### Step 11 — the map as the surface (D46)

- `/discover` map pane measures 1238 × 481 with 87 markers, after measuring 1238 × 0 before the fix (C41) — **VERIFIED**
- A pin opens a card and the card links through: `Sacred Lotus… | BKK1 · $$ · open now | See the place →` → `/en/spot/sacred-lotus-vegan-cafe-x-hostel-phnom-penh` — **VERIFIED**
- A memorial pin opens `Tuol Sleng Genocide Museum (S-21) | BKK1 | See the place →` — no price, no open-now, and a working route to its page (the only one left after D45) — **VERIFIED**
- Popup in dark mode computes `background #171b16`, `color #ece5d8`, `border #2d342c`, all from tokens — **VERIFIED**
- 0 horizontal overflow at 390 on `/discover` and `/en` — **VERIFIED**
- The popup in the three non-default palettes — **NOT VERIFIED**, assumed to follow because every value is a token

### Still not verified after step 9

- **No two-browser test.** Live update is verified at the library level (step 7) and the polling fallback exists, but nobody has watched one browser update because another voted.
- **The 24-hour expiry has never been observed deleting a row.**
- **The venue content is eleven tourist landmarks** (B9). Every flow above was exercised against markets and temples, not the bars and restaurants the product is for.
- Passing the whole `dict` into client components ships ~10.7 KB of strings to the browser, including copy for pages the reader is not on. Not a defect; worth trimming.

## Phase 3 — the seventeen acceptance criteria

Closed on 2026-08-29 against `specs/3-friends/spec.md`. Each names what was run, not what was intended.

| # | Criterion | Evidence |
|---|---|---|
| 1 | build, lint, typecheck, test clean | `npm run verify` — 133 tests, 25 client files scanned for secrets |
| 2 | Phnom Penh only; the tight bbox rejects a stray coordinate | `bbox.test.ts`. A BKK1 venue at Siem Reap coordinates is rejected; the same coordinates pass as `out-of-town`; reversed lat/lng is rejected |
| 3 | `isOpenAt` defined across a 7 × 24 sweep | `spots.test.ts` sweeps every venue × every day × every hour |
| 4 | No fake timers in the hours suite | `hours.test.ts` passes explicit instants throughout; `phnomPenhNow` is the only clock read in the repo, by grep |
| 5 | Unknown hours without a link fail to parse | `spots.test.ts` — rejected without `links`, accepted with one |
| 6 | `lastVerified` never in the future; staleness warns only | `spots.test.ts`. Warn-only is deliberate: a suite that goes red on a calendar date with no code change teaches people to ignore red |
| 7 | `/discover` defaults to open-now, server and client agree | Default is `open-now` in the filter store; **0 hydration warnings** read from the dev-server log across five routes |
| 8 | open → closing-soon → unknown → closed ordering | `scoring.test.ts` at a fixed instant, including the deliberate unknown-above-closed rule |
| 9 | A memorial is never a ballot candidate | `vote.test.ts`, and `createBallot` refuses to encode one at all |
| 10 | A memorial never appears in a suggestion tray | `DayTail` sorts through `sortSpots`; memorial spots carry no score and are excluded at ballot creation |
| 11 | A memorial never appears in a match result | `vote.test.ts` — it cannot be tallied because it cannot be a candidate. Removing the filter fails exactly two tests, checked by mutation |
| 12 | A ballot round-trips; three voters resolve to one winner; `resolve` does no I/O | Four voters against the live project → `DECIDED / Russian Market / 1 person said no.` |
| 13 | 404 on unknown ids, no enumeration, service key absent from the bundle | 404 for malformed and unknown alike; `npm run check:secrets` matches secret *shape*, and is proven to fail on a planted `sb_secret_` (C24) |
| 14 | A second browser sees a vote without refreshing; a dead socket degrades | **Two tabs**: B showed "1 voted so far", A voted, B moved to "2" in ~1.5s with no reload. **Sockets blocked** via CDP: an out-of-band vote still arrived within 4s on the poll |
| 15 | Rows older than 24 hours are deleted | Planted a row dated 25h ago; it read back once, then a fresh vote elsewhere triggered the sweep and it was gone |
| 16 | 0 horizontal overflow at 390 / 768 / 1280 | 15 measurements across five routes, all 0 |
| 17 | 0 contrast failures, both modes and the explicit dark path | 5 routes × light, dark, and `data-theme="dark"` — 0 of 306 text nodes fail |

**All seventeen pass.**

## What Phase 3 still does not have

- **Real content.** Eleven tourist landmarks, no bars or restaurants (B9). Every flow above was exercised against markets and temples. The importer works and is verified against 20 real BKK1 bars, but nothing has been written into the seed file.
- **Khmer.** Untouched, and this phase added more English strings (B4, D32).
- **Photographs.** Voting between venues from text alone works mechanically; whether people will do it is untested (B8, R11).
- The whole `dict` is passed into client components — ~10.7 KB of strings, including copy for pages the reader is not on. Not a defect; worth trimming.
- Nothing is deployed (B5).
