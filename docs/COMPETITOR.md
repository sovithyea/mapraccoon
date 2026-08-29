# Competitor — The Map Cambodia

`themapcambodia.com`, the competitor named in the brief. This file records what was **observed in their rendered HTML**, not what their marketing claims. Read on 2026-08-29 across five pages: a village-tour spot page, the Sosoro Museum spot page, the Phnom Penh and Siem Reap city hubs, and `/plan-my-trip`. The footer was additionally checked in a browser at desktop width.

Source pages were pasted into the session and are gone; this file is what survives. The positioning call that came out of it is D16; the parity findings are D18 and C6.

## What their business actually is

An editorial guide plus a **printed fold-out map** distributed through **220+ physical points** (hotel front desks, guesthouses, restaurants), backed by ~18k Instagram followers, covering **9 destinations** in **9 languages**. The website is the digital companion to a paper product.

This matters for every design decision taken from them: their site is an acquisition and internal-linking surface for a distribution business. Ours is not. Cloning their page shapes copies the wrong incentive.

## Page anatomy

### Spot detail page

44–52vh hero image with a gradient scrim; a "Featured on The Map" sparkle badge; breadcrumb; "Why Visit" prose; a "This Place Offers" amenity checklist grid; a photo gallery with skeleton shimmer loaders; a **sticky 340px right sidebar** (Grab / Get Directions / Website / Phone / Share, social links, a `<dl>` of opening hours with a live open/closed badge, an entrance-fee table, address); a lazy "Show map" placeholder; a "You might also like" three-card rail; and a **fixed bottom action bar on mobile**.

### City hub

Breadcrumb band tinted with the city colour; hero gradient fading city colour into the warm ground; a "Featured on The Map" horizontal rail; a **sticky category filter bar** with PNG icons plus an "Open now" pill and cuisine sub-filters; a card grid; then a long editorial toolkit — live weather widget, "What's on" events and offers, a 12-month when-to-go planner with tier colours (great `#6E9E7E` / good `#D9A94E` / tough `#C67B5C`), a rainfall-and-heat bar chart, itinerary route cards, a "real prices" `<dl>`, a USD↔KHR converter, shortlist chips, journal cross-links — and finally a **plain-text A–Z list of every place in the city**.

### `/plan-my-trip`

A 3D CSS travel-book hero (book spine, page-edge gradients, `rotateY`, two flanking books), carrying its own scope disclaimer in plain sight: *"Free route draft: no booking or service promise."* Then a two-column compose form — length 7/10/14, pace slow/balanced/active, interest chips, destination checkboxes with a max-stops cap — beside a result panel.

The result panel **exists before there is a result**: full height, dark, with an icon, an eyebrow ("Your draft"), a heading ("Your route will appear here") and one instructional sentence. Nothing reflows on submit.

Their planner works at **city granularity** — pick up to 4 cities across 7/10/14 days. It is not a stop-level route builder. There is no map anywhere on the page.

*Not observed:* the generated result. The route renders client-side after submit and was never captured.

### Footer

Near-black `#121212` against the cream site, with a `#1B3022` Instagram banner above it and a five-image photo strip. A newsletter block with preference chips (topics, travel timing, traveller type). Then six columns — brand blurb and socials, Explore, Plan your trip, Siem Reap, Phnom Penh, Company — then a bottom bar of copyright · language + privacy choices · "Made in Cambodia 🇰🇭", then an agency credit.

Link labels are search queries used as navigation: "Best Time to Visit Koh Rong", "3 Days in Siem Reap", "Best Rooftop Bars". The footer is their internal-linking surface.

## Worth taking

| Pattern | Why it fits us |
|---|---|
| **Entrance fees cite an official source URL and a verification date** | This is `VERIFIED.md` discipline applied to user-facing content. It is the most direct available answer to R1. |
| **Lazy map behind a "Show map" button on a styled placeholder** | Their reason is performance; ours is that no Mapbox token exists (D11). Same component, and it makes the token-missing state a designed state rather than a fallback. |
| **Month-by-month planner with tier bands** | Crowd and season data rendered as a decision rather than a table — the same species of idea as `OffRadarMeter`. |
| **Plain-text index of every place at the bottom of a city page** | Cheap, ugly, works. 42 spots makes this trivial for us. |
| **Constraints shown as disabled state, not submit errors** | "Maximum 4 stops for this length and pace" sits *above* the checkboxes and over-cap options grey out the moment the choice makes them impossible. The rule is visible before it is violated. |
| **A designed empty state the same size as the filled one** | Nothing reflows on submit. |
| **A scope disclaimer in the hero, not the footer** | Directly relevant to how we surface R1. |

## Worth rejecting

- **"Featured on The Map" badges.** A partner/pay-to-play signal that would undercut a curation claim.
- **The 820px mega-dropdown.** Four image cards, a destination pill row and a six-item icon grid. Scale we do not have.
- **The eight-category coloured filter bar.** We already decided category colour cannot be a page-level role (D21).
- **A six-column SEO link footer.** Honest for 9 destinations; padding for 4 cities and 42 spots.
- **A near-black footer.** It is a fifth surface outside their own palette. Ours correctly uses `--surface-sunk`.
- **The trust strip** (220+ points / 9 destinations / 18k followers / 9 languages). Their moat as four numbers. Our honest equivalents — 42 spots, 4 cities — read as weaker unless the frame is curation rather than coverage. Better not to build the section than to lose that comparison.

## Defects observed in their implementation

- **Footer link labels wrap ambiguously.** Two-line items ("Best Time to Visit Koh Rong", "Festivals & Public Holidays") use the same leading as the gap between list items, so a column cannot be parsed at a glance.
- **The disabled destination checkboxes have no `aria-describedby`** pointing at the sentence that explains the cap. A screen reader reaches an unexplained disabled control.
- **Native constraint validation is unstyled** — the browser's "Please fill out this field" bubble appears over the newsletter block.

## Where we actually differ

Not the phrase "off the beaten path" — they already run a section by that name (C6). The differences that hold:

1. Off-radar is our **default sort everywhere**, not one section.
2. Every hidden place **names the famous one it replaces**. They have no equivalent.
3. They have **no stop-level itinerary builder** — theirs picks cities, ours will build a day.
4. Phase 4's collaborative planner has no counterpart on their site at all.
