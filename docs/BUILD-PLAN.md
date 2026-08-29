# Build Plan — MapRaccoon

Seven phases, each independently shippable, each specced before it is built. Every phase gets a directory under `specs/N-name/` holding `spec.md` (what and why) and `plan.md` (ordered execution steps).

**Working rule: no application code before that phase's spec and plan are written and reviewed.** This rule was broken once already, in Phase 1 — see D14 and `docs/PROGRESS.md`.

The sequencing comes from the project brief and has one governing principle: **cost arrives as late as possible.** Phase 1 touches one paid service on its free tier. Supabase enters only when persistence is genuinely required; the Claude API — which has no free tier — enters last but one.

## Phases

> **Re-phased on 2026-08-29 for the pivot.** Phases 1 and 2 shipped the tourist product and are merged. From Phase 3 this is a Phnom Penh going-out platform — see `docs/PIVOT.md` and D27–D34. The old Phases 3–7 are kept below the table as the plan that was replaced.

| # | Phase | Directory | Delivers | Depends on |
|---|---|---|---|---|
| 1 | Foundation | `specs/1-foundation/` | Next 16 + TS + Tailwind scaffold, spot schema, off-radar sort, Mapbox with token-missing fallback, city pages, i18n, Vitest | — |
| 2 | Itinerary builder | `specs/2-itinerary/` | Single-day route building, travel time as a **labelled estimate — no routing API (D22)**, stop reordering client-side, Zustand + localStorage | 1 |
| 3 | Friends platform | `specs/3-friends/` | **The pivot.** Phnom Penh only, venue schema with opening hours, "open now" as the default sort, ballot-in-a-link, voting, match resolution, and the one KV endpoint votes need (D27–D34) | 2 |
| 4 | Standing groups | `specs/4-groups/` | Accounts, a group you belong to, and the history that makes "where haven't we been" possible | 3, and real use |
| 5 | Content at scale | `specs/5-content/` | Moving venues out of the seed file. Friends adding places themselves — which D31 reclassifies from parity feature to core mechanic | 3 |

## Dependency graph

```
1 Foundation ──▶ 2 Itinerary ──▶ 3 Friends platform ──┬──▶ 4 Standing groups (also needs real use)
                                                      └──▶ 5 Content at scale
```

Phase 3 is the product. Everything before it turned out to be the foundation it needed, which is fortunate rather than planned — the day builder, the budget model and the travel estimates all carry over unchanged.

**The sequencing principle has changed.** It was *cost arrives as late as possible*, which assumed no users. A named friend group is users on day one, so the principle is now **the smallest thing that makes the feature exist** — which is why D30 accepts one 24-hour key-value store and nothing more, with the spend cap on the same day.

## The plan this replaced

Kept because a dozen decisions cite these phase numbers. Do not schedule from it.

| # | Phase | Delivered | Fate |
|---|---|---|---|
| 3 | Persistence | Supabase, spots → Postgres, auth, saved itineraries | Split. The minimum vote store is in Phase 3; real persistence is Phase 4 |
| 4 | Day out with friends | Collaborative planner, swipe voting, Realtime, match resolution | **Became the product.** Now Phase 3 |
| 5 | Trip assistant | RAG over the spot DB — Claude API, Voyage, pgvector | Dropped. It answered a visitor's questions |
| 6 | Hidden-gem scoring | A trained score replacing the editorial `offRadar` integer | Dropped with the score itself (D28) |
| 7 | Growth loops | Streaks, badges, "suggest a place" | "Suggest a place" is promoted into Phase 5; streaks and badges are unscheduled |

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
