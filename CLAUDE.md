# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

Humans should start at [`README.md`](README.md).

## What this repo is

MapRaccoon — a tool for **friends who live in Phnom Penh** to decide where to go out together. Someone shares a link, everyone votes on candidates for a slot, and it settles. Standalone, separate from FoodRaccoon; shares conventions with `rocket/athena` and `ass-hub/foodraccoon` and nothing else.

**It was a discovery-first tourist guide to Cambodia until 2026-08-29.** Read [`docs/PIVOT.md`](docs/PIVOT.md) before anything else — the old thesis is still visible in the code and in older parts of the doc set, and mistaking it for current is the most likely way to get this repo wrong.

**Current state: Phases 1 and 2 are merged to `main`.** 42 places across four cities, statically generated, plus a single-day itinerary builder. Build, lint, typecheck and 70 tests are green. **The pivot is decided and documented (D27–D34) but not specced and not built** — `specs/3-friends/` does not exist yet. **Do not write feature code for a phase unless the user asks for that phase to be executed.**

## Commands

```bash
npm run dev        # next dev — http://localhost:3000, no API keys needed
npm run build      # production build; invalid seed content fails HERE, not at runtime
npm run lint       # eslint flat config; clean means zero output
npm run typecheck  # tsc --noEmit, strict + noUncheckedIndexedAccess
npm test           # vitest run — 20 tests across 3 files
```

Run `build` and `lint` after every step of a plan, not just at the end. Plan steps are ordered so each commit leaves the repo working.

## Read before doing anything

| File | What it gives you |
|---|---|
| `docs/ARCHITECTURE.md` | What the product is, and why Mapbox rather than MapLibre |
| `docs/BUILD-PLAN.md` | Seven phases, dependency graph, sequencing |
| `docs/PROGRESS.md` | Where things stand, who owns what, open blockers |
| `docs/PIVOT.md` | **Read first.** Why the product changed, and what it cost |
| `docs/DECISIONS.md` | Every settled call, D1–D34 |
| `docs/VERIFIED.md` | Observed fact vs. assumption, plus corrections |
| `docs/RISKS.md` | R1–R11, ordered by severity |
| `docs/WORKFLOW.md` | Branching, commits, definition of done |
| `docs/DESIGN-SYSTEM.md` | Palette, type, the components that carry meaning |
| `docs/COMPETITOR.md` | What `themapcambodia.com` actually does, what to take and what to reject |
| `specs/N-name/spec.md` | The spec for a given phase |

## Hard rules

**1. No application code before that phase's spec and plan are reviewed.** The core working agreement. It was broken once — Phase 1 was built before its spec existed, and D14 records that rather than hiding it. From Phase 2 it holds without exception. If asked to build something whose spec is a draft, write the spec and stop for review.

**2. Documentation is a lead, not evidence.** This repo's own docs and code have been wrong four times already (C1–C4 in `docs/VERIFIED.md`): the Next 15 middleware convention, a non-existent `LayoutProps` global, a wrong spot count, and a wrong claim about which component reads the filter store. Read the actual source. Record what you observe in `docs/VERIFIED.md` marked **VERIFIED**, with the command or file that showed it. Never promote a claim because a document said so, including a document in this repo.

**3. `src/lib/scoring.ts` is the single ordering entry point.** Never scatter `.sort()` calls across components — a change of default must be one branch.

~~Off-radar is the default sort, everywhere. It is the product, not a preference.~~ **That rule is reversed (D28).** The default is now what is open right now. The off-radar score is removed entirely, because for someone who lives in a city "almost nobody goes here" describes an empty bar rather than a find — the signal inverts rather than weakens. The old rule is struck through rather than deleted because it appears throughout the older docs and a reader needs to find out here that it is gone.

**4. The content is unverified, and after the pivot it goes stale rather than being merely unchecked.** Fees, times and community claims are editorial (R1, R4). The pivot lowers the stakes — a resident crossing their own city self-corrects where someone driving three hours could not — and raises the frequency, because bars and restaurants close, move and change their hours in a way temples do not (R8). Do not add a place you cannot source; `sources` is `min(1)` and the build enforces it. **Never invent opening hours**: the schema has an explicit unknown state for exactly that reason. Do not soften the caveats in the README or the footer.

**5. Memorial sites are not written in the product's voice, and this rule got STRONGER at the pivot, not weaker.** Tuol Sleng, Choeung Ek, the Phnom Sampeau killing caves, Kamping Puoy and the Secret Lake are sites of mass killing or forced labour. No "tired of the crowds? try this" framing, no badges, no generated blurbs.

Dropping Tuol Sleng and Choeung Ek from the dataset was recommended and rejected; they stay (D33). So the memorial share of the corpus **rises** as the other cities leave, at exactly the moment the voice becomes "swipe to pick a bar". A `sensitive` spot must never appear as a swipe candidate, in a suggestion tray, or in a match result — **each exclusion enforced by a schema rule or a test, never by prose.** C19 is what happens otherwise: Kamping Puoy shipped paired to Phnom Sampeau, one forced-labour site offered as the alternative to another, and it survived review because the rule lived only in how the copy happened to be written. See R9.

**6. There is almost no backend, and the exception is exact.** No Supabase, no Claude API, no Google Cloud, no auth, no database. Standing one up "so it's ready" puts a billable account behind an app with no users (D1).

~~There is no backend, deliberately.~~ **Phase 3 adds exactly one thing (D30):** a key-value store with two operations, append a vote and read the votes, keyed by an unguessable room id with a 24-hour TTL. That is not preparation — a URL is one-way, so without it several people cannot vote on the same ballot at all. Nothing else. **Spend caps go in on day one of the phase that needs them, which is now.**

**7. Append to `docs/DECISIONS.md`, never rewrite it.** Reversals get a new entry superseding the old one. Fixing a stale status or a wrong cross-reference is not a rewrite — leaving a wrong pointer is worse.

**8. Conventional Commits 1.0.0.** `<type>[scope]: <description>`, scope naming the phase directory. A commit carrying a decision, a reversal, a discovered defect or a non-obvious trade-off MUST have a body explaining *why*. `Refs:` footers name decision and risk IDs.

**9. Every PR carries a written description, following `.github/pull_request_template.md`.** Assume the next reader is an agent starting cold with none of your context — that is what the body is for. It MUST cover what changed, what you actually ran and observed, what is *not* done, which `D`/`R` IDs were touched, and where the next person should pick up. Never claim something was verified that you could not run; put it under *Not done* instead, or it becomes an assumed fact three sessions later. Add follow-up comments when things change after review rather than silently editing the body — reviewers read new comments, not bodies they have already read. Full rules in `docs/WORKFLOW.md`.

**Process docs use RFC 2119 keywords.** In `docs/WORKFLOW.md` and the specs, MUST is rejectable at review, SHOULD needs a stated reason to depart from, MAY is your call.

## This is not the Next.js in your training data

Version 16.3.3. Verified against `node_modules/next/dist/docs/`, not recalled:

- **`params` is a `Promise`** and must be awaited in every page, layout and `generateMetadata`.
- **`middleware.ts` is now `proxy.ts`**, at `src/proxy.ts`, exporting a named `proxy` function (or a default). Writing `middleware.ts` silently does nothing.
- **Next generates its own `AGENTS.md` and `CLAUDE.md` on dev start.** `agentRules: false` is set in `next.config.ts` because it overwrote the hand-written ones. Do not remove that.
- Tailwind v4 is CSS-first: `@import "tailwindcss"` and `@theme inline` in `globals.css`, no `tailwind.config.*` anywhere.

## Architecture

Content is a typed TS module parsed by zod **at import**, so invalid content fails the build rather than a request (D3). That is the point of not using a JSON file.

```
src/data/spots.ts → lib/spots/schema.ts (zod) → lib/spots/index.ts → lib/scoring.ts → pages
```

`coords` is `[longitude, latitude]` — GeoJSON order, matching Mapbox. The schema's `CAMBODIA_BBOX` check catches a reversed pair at build time because Cambodia's longitude and latitude ranges do not overlap.

`Spot.pairedWith` and `Spot.community` are the two mechanics the brief names as the actual conversion hooks, so they are first-class in the schema and get real layout on the page, not tags in a list (D5). A pairing must point at a *better-known* spot; the test suite enforces it, because the sentence is backwards otherwise.

**Mapbox, not MapLibre** (D10) — diverging from `ass-hub/foodraccoon` on purpose. The dependency here is not the renderer, it is the Directions and Optimization APIs, which *are* the Phase 2 itinerary builder. MapLibre has no equivalent for multi-stop route optimisation. The lock-in is accepted and priced (R7).

**The map degrades without a token** (D11) and that is the repo's default state — no Mapbox account exists yet. Keep it that way: `SpotMap` must stay renderable with `NEXT_PUBLIC_MAPBOX_TOKEN` unset.

## Design

Laterite & Monsoon palette, Playfair Display over DM Sans, eyebrow labels. The editorial register came from `themapcambodia.com`; that is now a former competitor (D31) but the register is fine and stays.

Colour is semantic here, not decoration: category colour identifies a map pin layer, and gold means "this is about where the money goes" and appears nowhere else. Tokens live once in `globals.css` with full light and dark sets — **never define a colour only inside the dark block**, and note there are now two dark blocks (OS preference and explicit toggle) which `globals.test.ts` asserts stay in step (D26).

**Per-city colour is removed at the pivot (D27).** One city, ~9 neighbourhoods, and 9 × 2 tones would be 18 role colours — D21 is the written record of that exact mistake at less than half the scale. Neighbourhoods get a text label and no colour. The upside: dropping four city colours frees four of the seven roles D21 was fighting to separate, so **the palette constraint reopens**.

`docs/DESIGN-SYSTEM.md` describes what shipped. If it disagrees with the CSS, the CSS is right and the doc is a bug.

## Working style expected here

- Say which claims you verified and which you assumed. The docs encode the distinction and the user asks about it.
- When you find a doc is wrong, fix it as part of whatever you are doing, and record the correction in `docs/VERIFIED.md`.
- Update `docs/PROGRESS.md` at the end of a working session so the next session can pick up.
- Do not invent effort estimates.
- Claim a phase in `docs/PROGRESS.md` before starting it.
