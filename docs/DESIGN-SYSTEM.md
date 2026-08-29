# Design System — MapRaccoon

Derived from what shipped in Phase 1, not from intentions. If the code and this file disagree, the code is right and this file is a bug.

## Where it came from

The reference point is `themapcambodia.com`, the competitor named in the brief. Its rendered HTML was read directly on 2026-08-29 and the extracted structure is in the scratchpad notes. What was taken and what was deliberately not (D16):

**Taken — because it is the right register for Cambodian editorial content**
- Serif display over a geometric sans, with a small tracked-out uppercase eyebrow above every section heading
- Warm paper ground rather than the cool grey of most map apps
- Deep forest green as the institutional colour
- Per-city accent colours used systematically
- "Choose where to start" doors in the hero; horizontal card rails for browsable content
- City chip tabs over a feature card plus a short picks list

**Not taken**
- Their whole business is an editorial guide plus a printed map through 220+ distribution points, backed by 18.1k Instagram followers. Cloning that homepage would make this a worse version of a thing they already do well.
- They already run an "off the beaten path" section. So the differentiator is **not the phrase**. It is that off-radar is our *default sort* rather than one section, that every hidden place names the famous one it replaces, and that they have no itinerary builder.

## Palette — "Laterite & Monsoon"

Defined once in `src/app/globals.css` as CSS custom properties, exposed to Tailwind through `@theme inline`. Full light and dark sets; nothing is defined only inside the dark block.

**Every value is verified, not chosen by eye.** WCAG AA (4.5:1) for text, and CIELAB ΔE > 25 between any two colours that carry different meanings on the same page. The first palette failed both — see D21 and the measurements in `docs/VERIFIED.md`.

### Three colour roles, and nothing else may use them

| Role | Meaning |
|---|---|
| `--accent` | Institutional green. CTAs and links. |
| `--gold` | "Where your visitor money goes." Community blocks only. |
| `--city-*` | A city's identity, the same everywhere it appears. |

Category colour is deliberately **not** a page-level role — see below.

### Surfaces and text

| Token | Light | Dark | Role |
|---|---|---|---|
| `--background` | `#faf6ef` | `#101310` | Page ground, warm paper |
| `--surface` | `#fffdf8` | `#171b16` | Cards, raised panels |
| `--surface-sunk` | `#f1ead9` | `#1e231d` | Recessed bands, alternating sections |
| `--foreground` | `#1d2621` | `#ece5d8` | Body copy |
| `--muted` | `#655d51` | `#a1988a` | Secondary copy, labels |
| `--border` | `#e1d8c6` | `#2d342c` | Dividers, card outlines |
| `--accent` | `#123a31` | `#57b79c` | Primary actions |
| `--forest-mid` | `#276353` | `#6cc3aa` | Eyebrows |
| `--gold` | `#7e5a0c` | `#d9a83f` | Community impact only |

### Cities — two variants each, and why

One colour cannot do both jobs. A city fill is a large dark panel carrying white text; a city mark is a small dot or a line of text sitting on the page background. In dark mode those requirements move in opposite directions.

| City | `--city-*` (fill, both modes) | `--city-*-ink` dark |
|---|---|---|
| Phnom Penh | `#a83c22` clay red | `#e08a6c` |
| Siem Reap | `#2f5296` indigo | `#8fabec` |
| Kampot & Kep | `#0e6b8a` ocean | `#5cbcd9` |
| Battambang | `#7d3a5c` plum | `#dc93b8` |

`-ink` equals the fill in light mode. **Fills stay dark in both modes**, which has a consequence worth stating: anything sitting on a fill must also not flip with the theme. Using `--ink` on a white button over a city card produced 1.15:1 in dark mode, and `--accent-contrast` on a city fill produced 2.46:1. Both shipped briefly and were caught by measurement, not by eye.

Minimum separation across all seven on-page role colours is ΔE 29.6 (light) and 29.2 (dark).

### Categories — map pins only

| Category | Light | Dark |
|---|---|---|
| temple | `#b07a0f` | `#d9a441` |
| nature | `#2e7d48` | `#63c684` |
| food | `#c2410c` | `#f2915f` |
| culture | `#7c4dbd` | `#b6a0f2` |

Four cities plus four categories plus an accent plus gold is ten colours competing on one page. Measured, the first attempt collided twelve ways: `--forest-mid` and `--cat-nature` were *literally the same colour* (ΔE 0), gold collided with the temple category (ΔE 11.6) — breaking the rule that gold means one thing — and two of the four cities were indistinguishable (ΔE 24.1).

The fix was structural, not a tint adjustment: **category colour exists only where it distinguishes items from one another, which is the map's pin layers.** Everywhere else a category is a text label in neutral chrome. Because the pins are the only place these appear, they need to differ only from each other, not from the city set. `SpotMap` carries the legend, since it is now the only key to them.

## Type

| Role | Face | Where |
|---|---|---|
| Display | **Playfair Display** (`--font-display`) | h1/h2/h3, spot names, pull quotes |
| Body / UI | **DM Sans** (`--font-sans`) | everything else |

Loaded through `next/font/google` in `app/[locale]/layout.tsx` with `display: "swap"`. Khmer support is **not** yet handled — Playfair and DM Sans have no Khmer coverage, so a Khmer face has to be added before `km.json` is filled. See R6.

The `.eyebrow` utility (12px, 700, uppercase, `0.14em` tracking, `--forest-mid`) is defined in `globals.css` because it appears above every section heading.

## Components that carry meaning

**`OffRadarMeter`** — a 64px bar plus a band label (Famous / Well known / Quiet / Off the radar). Bands come from `offRadarBand()` in `src/lib/scoring.ts`, so the label and the sort can never drift apart. Carries an `aria-label` with the raw score.

**`Constellation`** (hero) — all 42 spots plotted at their real longitude/latitude inside `CAMBODIA_BBOX`, over a plain graticule. Dot size runs 8px→20px with the off-radar score, so the least-visited places are the largest marks on the page. It is a scatter of the actual dataset, not an illustration of the country: honest, needs no Mapbox token, and cannot fail to load. Colour is the base city.

**`PairingCard`** and the `PairingRail`** — the hook is set in display type as a quotation, with the anchor named above it and the off-radar meter below. The pairing is the product; it gets the typographic weight.

**`CommunityImpact`** — gold eyebrow, impact sentence, then "Run by {name}" with an optional outbound link. Gold appears nowhere else, so the reader learns it means "this is about where the money goes".

## The spot page, after Phase 2

Rebuilt from the Claude Design direction (turn B). The three things that carry the page were the three buried in it: the meter was an 18px artifact in a chip row, the pairing sat after three paragraphs, and `order-1` on the whole `<aside>` dragged the map and sources above the pairing so a phone reader met it fifth.

**Reading order, at every width:** name → blurb → score → pairing → practical → description → community → map → sources. The aside is split in two rather than flipped: practical early, reference material last.

**Score panel** (`OffRadarPanel`) — replaces the inline meter in the header. Playfair 34px (46px at `lg`), four `offRadarBand()` segments at 7px with the active one in `--accent`, and the editorial caveat attached to the number it qualifies rather than floating beneath as a page footnote.

**Two full-bleed bands** break the page's card rhythm, and nothing else does:
- **Pairing** — `-mx-5` onto `--surface-sunk`, eyebrow naming the anchor in `--accent`, hook in Playfair 20px rising to 33px at `lg`, the anchor's own meter and link in a 210px column.
- **Community** — same bleed, a 3px `--gold` left rule, impact sentence in Playfair. Gold appears nowhere else, and never on a memorial page.

**Categories are neutral text** on this page — `Nature · Food`, not outlined pills. Category colour is a pin layer (D21) and the chips put two more shapes beside the city dot.

**Practical** is three columns below `lg` and a stacked list inside the 320px aside above it. Same DOM, one grid class. The unverified-content caveat sits inside this card against the fee and the hours, which are the numbers that go stale (C18).

### The memorial variant (D25)

Subtraction driven by `sensitive: "memorial"`, never a judgement made at render time. Measured on `/en/spot/tuol-sleng` against `/en/spot/trapeang-sangkae`:

| | Memorial | Ordinary |
|---|---|---|
| Article width at 1280 | 596px | 1024px |
| `h1` | Playfair 33px / 400 | Playfair 36px / 700 |
| Section radii | 0 | 1rem / 1.5rem |
| City dot | absent | present |
| Gold on the page | 0 elements | community band |
| Score, meter, pairing | none | all three |
| Practical heading | "Visiting" | "Practical" |

The absence is stated rather than left silent — a reader who has seen five scored pages reads a missing score as a data gap, and it is not one.

## Layout

- Content column caps at `max-w-6xl` (72rem); prose inside a spot page caps narrower.
- Sections separate with `border-t border-border`, alternating `--background` and `--surface-sunk`.
- Three horizontal rails exist, and they are not one pattern. `.rail` is only the scrollbar-hiding utility; the scroll behaviour is per-rail:
  - **Pairing rail** (`components/home/PairingRail.tsx`) — the only one that snaps: `snap-x snap-mandatory`, cards `85vw` on mobile and a fixed `26rem` from `sm` up, and on `lg` it aligns to the 72rem column while bleeding past it via `px-[max(1.25rem,calc((100vw-72rem)/2))]`.
  - **Header city rail** (`app/[locale]/layout.tsx`) — plain `flex overflow-x-auto`, no snap. A second header row below `md`, since the inline nav list is hidden there.
  - **Discover chip rails** (`components/DiscoverView.tsx`) — plain `flex overflow-x-auto` below `sm`, wrapping from `sm` up. Bleeds to the screen edge with `-mx-5 px-5`.
- Other multi-item sections are grids, not rails. `CommunityRail` is a `lg` sidebar beside an `sm:grid-cols-2` grid, despite the name.
- Radii: 2xl (1rem) for list cards, 3xl (1.5rem) for feature panels, full for chips and buttons.

## Dark mode

Every token is redefined under `@media (prefers-color-scheme: dark)`. Surfaces, text, accent, gold, city `-ink` variants and category pins all move; **city fills do not**, because they always carry white text.

That asymmetry is the trap. A colour that flips paired against a surface that does not is the one dark-mode bug this design can produce, and it produced two of them on first attempt. When putting text on a city fill, use a value that is dark in both modes (`--forest-deep`) or light in both (`white`) — never `--ink` or `--accent-contrast`.

Audited at 0 failures across four routes in both modes with `tools/contrast.mjs`. There is no manual theme toggle yet.

## Responsive behaviour

Verified with `tools/probe.mjs` at 320, 390 and 768 CSS px: `scrollWidth` equals the viewport and true horizontal overflow is 0 on every route. Elements inside deliberate scroll rails are excluded from that count — the city rail and the pairing rail are *meant* to extend past the viewport.

### Patterns

**Scroll rails instead of wrapping, on mobile.** Chip groups on `/discover` are `flex` + `overflow-x-auto` below `sm` and wrap from `sm` up. Wrapped, the three filter groups pushed the first result roughly 600px down a 844px viewport. The `.rail` utility hides the scrollbar without disabling scrolling; rails bleed to the screen edge with `-mx-5 px-5` so the cut-off card at the right edge reads as a scroll cue.

**A list/map toggle on mobile only.** `/discover` stacks the list above the map below `lg`, which put the map ~42 cards down the page — effectively unreachable. A segmented control switches between them. It is local component state, not the Zustand filter store: it is a display mode, not a filter.

**Cities are reachable without a drawer.** The inline nav list is `md:hidden` in reverse — a second header row holds a horizontally scrolling city rail below `md`. One row, no JavaScript, no focus trap to get wrong.

**Source order flips on the spot page.** Practical info, the mini-map and sources are `order-1` below `lg` and `order-2` above it, so a phone reader gets the fee, timing and duration before three paragraphs of description.

**Compact rows, not stacked cards.** The hero doors are horizontal rows below `sm` (dot · title · body · arrow) and become a three-column card grid above. As stacked cards they consumed about 400px of the first screen.

### Touch targets

Interactive controls are `min-h-11` (44px) for primary chips and buttons, `min-h-9` (36px) for secondary links in the footer and breadcrumbs. WCAG 2.5.8 sets 24×24 CSS px as the floor; 44px is the practical iOS target. Filter chips were 30px before this pass.

### The min-content trap

`truncate` expands to `overflow:hidden; text-overflow:ellipsis; white-space:nowrap`. Inside a grid or flex track sized `auto`, that nowrap makes the element's **full string** its min-content width, and the track grows to fit it. One `truncate` on a spot blurb in `CityPicks` widened the page to 630px at a 390px viewport.

**Use `line-clamp-1` instead** — it clamps visually while leaving `white-space` normal, so min-content stays the longest word. Where `truncate` is genuinely wanted, every ancestor up to the sized container needs `min-w-0`.
