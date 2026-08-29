# Build Plan — MapRaccoon

Seven phases, each independently shippable, each specced before it is built. Every phase gets a directory under `specs/N-name/` holding `spec.md` (what and why) and `plan.md` (ordered execution steps).

**Working rule: no application code before that phase's spec and plan are written and reviewed.** This rule was broken once already, in Phase 1 — see D14 and `docs/PROGRESS.md`.

The sequencing comes from the project brief and has one governing principle: **cost arrives as late as possible.** Phase 1 touches one paid service on its free tier. Supabase enters only when persistence is genuinely required; the Claude API — which has no free tier — enters last but one.

## Phases

| # | Phase | Directory | Delivers | Depends on |
|---|---|---|---|---|
| 1 | Foundation | `specs/1-foundation/` | Next 16 + TS + Tailwind scaffold, spot schema + 42 curated entries, off-radar sort, Mapbox map with token-missing fallback, destination/city pages, i18n structure, Vitest | — |
| 2 | Itinerary builder | `specs/2-itinerary/` | Single-day route building, travel time as a **labelled estimate — no routing API (D22)**, stop reordering client-side, held in Zustand + localStorage. Mapbox Directions and Optimization move behind `estimateLeg()` for a later phase | 1 |
| 3 | Persistence | `specs/3-persistence/` | Supabase project, spot data migrated from the seed file to Postgres, auth, saved itineraries, admin path for editing content | 2 |
| 4 | Day out with friends | `specs/4-collab/` | Collaborative multi-stop planner: timeline view with computed arrival/departure, swipe voting between candidates per slot, Supabase Realtime sync, match resolution | 3 |
| 5 | Trip assistant | `specs/5-assistant/` | RAG over the verified spot DB only — Claude API + Voyage embeddings + pgvector. No open-web retrieval, no invented places | 3 |
| 6 | Hidden-gem scoring | `specs/6-scoring/` | Replaces the editorial `offRadar` integer with a trained score, once first-party visit data exists | 3, and real usage data |
| 7 | Growth loops | `specs/7-growth/` | Exploration streaks and badges, "suggest a place" submissions with editorial review — the latter is parity with the competitor, not a differentiator (D18) | 3 |

## Dependency graph

```
1 Foundation ──▶ 2 Itinerary ──▶ 3 Persistence ──┬──▶ 4 Day out with friends
                                                 ├──▶ 5 Trip assistant
                                                 ├──▶ 6 Hidden-gem scoring  (also needs usage data)
                                                 └──▶ 7 Growth loops
```

Phase 4 is the one that actually justifies Realtime, and it is the product's differentiator. Everything before it is the foundation it needs; nothing before it should be built in a way that blocks it.

## Not scheduled

From the brief's V2 list. These are real ideas with no phase number until something above them lands:

| Idea | Why it is waiting |
|---|---|
| Multi-day / intercity chaining | Needs Phase 2's travel-time model working within a city first |
| Budget split calculator | Trivial once Phase 4 has a group |
| Offline itinerary export | Genuinely useful for Mondulkiri, Ratanakiri and the remote islands, where connectivity gaps are real. Needs cached tiles — check the Mapbox terms before scoping |
| Crowd / season prediction | Festival calendar and wet/dry season are available now; the visit-log half needs Phase 6's data. **Note: the competitor already ships crowd-forecast pages — this is parity, not differentiation (D18)** |
| Menu / sign photo translator | Google Cloud Vision + Translation. Standalone; no dependency on anything above |
| Grab / tuk-tuk fare estimator | Distance × local per-km rate. No live API exists for this, so it is an estimate presented as one |

## What "done" means for a phase

1. Its `spec.md` acceptance criteria are all checked off in `docs/VERIFIED.md` with evidence — a command run, a file read, an observation — not an assertion.
2. `npm run build`, `npm run lint`, `npm run typecheck` and `npm test` are clean.
3. `docs/PROGRESS.md` is updated.
4. Any decision made along the way is appended to `docs/DECISIONS.md`.
