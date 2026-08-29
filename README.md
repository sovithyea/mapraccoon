# MapRaccoon

A discovery-first guide to Cambodia. The default sort is how far off the radar a place is, not how popular it is — the famous places are still here, at the bottom, each one paired with the quieter place that beats it.

Standalone project, separate from FoodRaccoon. Full brief in [`cambodia-tourism-app-brief.md`](cambodia-tourism-app-brief.md).

**Status: Phase 1 (Foundation) complete.** 42 hand-curated places across four base cities, statically generated, no backend. The content has **not** been verified on the ground — see [Content accuracy](#content-accuracy) below.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

No API keys are required to run it. Without a Mapbox token the map area shows an explanatory placeholder and everything else works normally.

```bash
npm run build      # production build; invalid content fails here, not at runtime
npm run lint
npm run typecheck
npm test           # Vitest — content integrity + scoring
```

Node >= 20.9.0 (Next 16's floor).

## Mapbox setup — optional

```bash
cp .env.example .env.local
```

1. Create a **public** token (`pk.*`) at <https://account.mapbox.com/access-tokens/>
2. **Restrict it to your domains, plus `http://localhost:3000` for development.** Do this at creation, not later.
3. Put it in `.env.local` as `NEXT_PUBLIC_MAPBOX_TOKEN`

### Cost control

Mapbox has **no native hard spend cap.** URL restriction on the token plus a weekly dashboard check are the only real controls. The token is exposed in the browser by design — that is what `NEXT_PUBLIC_` means, and there is no way around it for a client-side map — so it is not a secret and must not be treated as one. Never put a secret token (`sk.*`) in this repo.

The free tier is 50K map loads and 100K directions requests per month, far above this project's scale. Phase 1 uses no other paid service: no Supabase, no Claude API, no Google Cloud. See `docs/SECURITY.md` and R3 in `docs/RISKS.md`.

## What's here

| Route | What it is |
|---|---|
| `/en` | Landing — the constellation of all 42 places, city picks, the pairing rail, community-run places |
| `/en/discover` | The map and the filterable list, off-radar sorted |
| `/en/city/[city]` | One base city, least-visited first |
| `/en/spot/[slug]` | A place: what it is, what famous place it replaces, where your money goes, sources |

## Structure

```
src/
  app/[locale]/      routes — landing, discover, city, spot
  components/        home/ · map/ · spot/ · ui/
  data/spots.ts      the 42 curated places
  lib/spots/         zod schema, city metadata, query helpers
  lib/scoring.ts     off-radar sorting — the seam a trained model replaces later
  i18n/              locale config and JSON dictionaries
  store/filters.ts   Zustand: city, categories, sort, selection
  proxy.ts           Next 16 proxy (not middleware.ts) — locale redirect
docs/                architecture, build plan, decisions, risks, progress, …
specs/N-name/        spec.md + plan.md per phase
```

## Content accuracy

Every place carries at least one source, enforced by the schema. **That is provenance, not verification.** Entry fees, opening times, seasonal advice, transport times and community-impact claims were written editorially and have not been checked against a primary source or on the ground.

This matters because the product's whole proposition is telling people to travel somewhere less obvious. Several entries name real organisations — ACCB, Phare Ponleu Selpak, the Banteay Chhmar and Trapeang Sangkae community programmes — and describe what visitor money funds; those descriptions have not been confirmed with them. See R1 and R4 in `docs/RISKS.md`. Both block a public launch.

The "off-radar score" is an editorial 0–100 integer, not an algorithm output. The brief defers a trained model until there is first-party visit data, because Google and OSM data is biased toward already-popular places — training on it would reproduce the ranking this product exists to invert.

## Working here

**No application code before that phase's `specs/N-name/spec.md` and `plan.md` are written and reviewed.** Read `docs/WORKFLOW.md` before starting. Contributors and agents should start at `AGENTS.md` / `CLAUDE.md`.

| Doc | What it gives you |
|---|---|
| `docs/ARCHITECTURE.md` | What the product is and how the pieces fit |
| `docs/BUILD-PLAN.md` | Seven phases, dependency graph, sequencing reasoning |
| `docs/PROGRESS.md` | Where things actually stand, open blockers |
| `docs/DECISIONS.md` | Every settled call, D1–D17, with reasoning |
| `docs/VERIFIED.md` | Observed fact vs. assumption, and corrections |
| `docs/RISKS.md` | R1–R11, ordered by severity |
| `docs/DESIGN-SYSTEM.md` | Palette, type, the components that carry meaning |
| `docs/SECURITY.md` | Trust boundaries, the Mapbox token, what arrives with Phase 3 |
| `docs/WORKFLOW.md` | Branching, commits, definition of done |
| `docs/INTERFACES.md` | Routes, the content contract, environment |
