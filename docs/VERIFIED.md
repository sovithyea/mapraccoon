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
