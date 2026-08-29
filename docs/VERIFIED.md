# Verified — MapRaccoon

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
