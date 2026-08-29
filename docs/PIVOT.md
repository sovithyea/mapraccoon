# The pivot — from a Cambodia tourist guide to a Phnom Penh going-out platform

**Date: 2026-08-29.** Written for someone reading this cold, months from now, wondering why the repo does not match the documents around it.

Phases 1 and 2 shipped a tourist product. This document explains what replaced it, what that gains, and — the part usually left out — what it costs. Decisions D27–D34 carry the individual calls; this is the argument they share.

## What the product was

A discovery-first guide to Cambodia. 42 hand-curated places across four cities, statically generated, no backend. Its organising idea was a single inversion: **the default sort was how far off the radar a place is, not how popular it is.** Two mechanics carried it — every hidden place named the famous one it replaced, and community framing told you where your money went.

That product is built. It works. `main` holds it.

## What it is now

A platform for **friends who live in Phnom Penh** deciding where to go out together.

One city. A resident audience. The collaborative planner that was Phase 4 becomes the product rather than a late feature, and everything else exists to serve it.

## Why the audience flip changes almost everything

A tourist is in Phnom Penh for three days and never returns. A friend group lives there and goes out every week. Nearly every consequence below follows from that one difference.

**"Off the radar" stops meaning what it meant.** For a visitor it means *not in the guidebook*. For someone who already knows the city it means *empty*, and an empty bar on a Friday is bad information, not a find. The score does not merely weaken — it **inverts**, and the new dataset is mostly the kind of place it inverts on. It is removed entirely (D28).

**Pairing has no resident meaning.** "Instead of Angkor Wat, go here" is a sentence you can only say to someone who has not been. `pairedWith` is removed (D29).

**Nothing replaces them.** This is the deliberate part. The product's hook is not editorial any more: it is that the thing **resolves an argument five people are having in a group chat**. The venue data is fuel. That puts the entire weight of the product on the voting flow being genuinely good, and that is a risk, not just a design.

**The competitor changes, and it is harder.** `themapcambodia.com` sells a printed map to visitors and is not a competitor at all now. The competitor is the group chat: zero friction, already installed, everyone is in it. Group chats are genuinely bad at converging on a decision, which is the opening — but the bar is "better than someone typing *where should we go tonight*", and you have to clear it on the first use or nobody opens it twice (D31).

## What this gains

- **R1 and R5 get better.** The content was unverified and described places people would drive three hours to reach. Residents crossing their own city self-correct at near-zero cost, and they are themselves the verification source.
- **R2 and R4 become moot.** Every place at risk of being overwhelmed by publicity, and all five community organisations whose impact claims were unconfirmed, are outside Phnom Penh. They leave with their cities.
- **R7 gets better.** The Mapbox lock-in existed to buy multi-stop route optimisation across a country. A night out in one city does not need it.
- **The palette constraint reopens.** D21 measured that four cities plus four categories plus accent plus gold was ten colours competing for meaning. One city removes four of them.

## What it costs

The honest half, and it is not a short list.

- **R6 — Khmer becomes a launch blocker, not a scheduled defect.** A tourist product can defend English-only; its users are inbound visitors. A product for people who *live in Phnom Penh* has a majority-Khmer-speaking user base by construction, and neither shipped typeface has Khmer coverage. Phase 2 made this worse by adding ~60 English-only strings.
- **R8 arrives much sooner.** `src/data/spots.ts` is 1,100 lines for 42 spots. Eighty-plus venues that close, move and change their hours cannot live in a TypeScript module that requires a developer and a build to edit.
- **R9 gets worse, which is the one to sit with.** Tuol Sleng and Choeung Ek are in Phnom Penh. The other cities' memorials leave with their cities, so the memorial share of the corpus *rises* — at exactly the moment the product's voice becomes "swipe to pick a bar". Dropping them was recommended and rejected; they stay, so every new surface needs an enforced exclusion (D33).
- **R11 stops being deferrable.** Choosing between four bars is far more image-driven than choosing a temple, and the design's existing crutches — the constellation, the display type — were built for the old thesis. Voting between candidates from text alone is untested and may simply not work.
- **The prose.** Eighty venues at two or three paragraphs each is 15,000–25,000 hand-written words. That, not the code, is the thing most likely to kill this.

**Net: two content risks traded for two harder product risks.** R6 and R11 both become things to solve rather than schedule.

## What was deliberately abandoned

Stated plainly, because it would otherwise look like drift:

**The inversion is gone.** `CLAUDE.md` hard rule 3 read *"Off-radar is the default sort, everywhere, with no user interaction required… It is the product, not a preference."* `INTERFACES.md` said it *"must stay that way."* Both were true of the old product and are false of this one. The default sort is now what is open right now.

That was the idea the whole thing was built around, and it is being given up on purpose, for a stated reason (D28). It is not a small change and this document exists partly so nobody later mistakes it for an accident.

## What survives

More than the above suggests. The day builder, the day-budget model, the travel estimates, the schema-parsed-at-import discipline, the design system, the measurement tooling and every process convention carry over untouched. The single-day, single-city scope chosen in D22 was a limitation for a tourist product and is exactly the right shape for this one.
