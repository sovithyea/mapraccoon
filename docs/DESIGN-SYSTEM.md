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

| Token | Light | Role |
|---|---|---|
| `--background` | `#faf6ef` | Page ground, warm paper |
| `--surface` | `#fffdf8` | Cards, raised panels |
| `--surface-sunk` | `#f0e9dc` | Recessed bands, alternating sections |
| `--foreground` | `#1f2a23` | Body copy |
| `--muted` | `#6b6558` | Secondary copy, labels |
| `--border` | `#e0d7c7` | Dividers, card outlines |
| `--forest` / `--accent` | `#16453a` | Primary actions, institutional colour |
| `--forest-mid` | `#2f6b5b` | Eyebrows, the third hero heading line |
| `--gold` | `#9a7415` | Community-impact accent only |

### Category colours — semantic, not decoration

They identify the pin layer on the map and the tag on a card. Do not restyle without a product decision.

| Category | Light |
|---|---|
| temple | `#9a6b12` |
| nature | `#2f6b5b` |
| food | `#b3491d` |
| culture | `#6d4aa8` |

### City accents — also semantic

A city keeps its colour on the nav dot, the chip tab, the feature card, the constellation dot and the city label. Same idea as the competitor's system; different values.

| City | Light |
|---|---|
| Phnom Penh | `#c2622a` |
| Siem Reap | `#3c4a39` |
| Kampot & Kep | `#6e7a33` |
| Battambang | `#9e4b3b` |

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

## Layout

- Content column caps at `max-w-6xl` (72rem); prose inside a spot page caps narrower.
- Sections separate with `border-t border-border`, alternating `--background` and `--surface-sunk`.
- Rails scroll horizontally with `snap-x snap-mandatory`, cards at `85vw` on mobile and a fixed rem width above. `.rail` hides the scrollbar without disabling scrolling.
- Radii: 2xl (1rem) for list cards, 3xl (1.5rem) for feature panels, full for chips and buttons.

## Dark mode

Every token is redefined under `@media (prefers-color-scheme: dark)`. Accent flips from deep forest to a light jade (`#4fae94`) so it stays legible on a dark ground, and `--accent-contrast` flips with it. City and category accents lighten. There is no manual theme toggle yet.

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
