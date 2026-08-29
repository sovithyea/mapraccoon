# Security — MapRaccoon

Threat model and trust boundaries. Written at Phase 1, when there is very little to defend, so the shape exists before the risk does (D13).

**Current state: there is no user data, no authentication, no database and no server-side mutation.** Every page is statically generated at build time from a file in the repo. The attack surface is a static site plus one public Mapbox token.

That will not be true after Phase 3. This document is written to be filled in, not to look complete.

## Trust boundaries today

| Boundary | Status |
|---|---|
| Browser ↔ static pages | The only one that exists. All content is public and build-time generated. |
| Browser ↔ Mapbox tile API | Direct, authenticated by a public token the browser holds. |
| Server ↔ database | **Does not exist.** No database. |
| User ↔ user | **Does not exist.** No accounts, no user content. |

## The Mapbox token

`NEXT_PUBLIC_MAPBOX_TOKEN` is exposed in the browser **by design**. That is what `NEXT_PUBLIC_` means and there is no way around it for a client-side map: the browser has to authenticate to the tile API itself.

So the token is not a secret and must not be treated as one. The controls are:

1. **URL restriction on the token** — set at creation on the Mapbox token page, scoped to your domains plus `http://localhost:3000` for development. This is the only thing that stops a copied token being used elsewhere.
2. **Public scopes only** (`pk.*`). A secret token (`sk.*`) must never be placed in a `NEXT_PUBLIC_` variable, or in this repo at all.
3. **Weekly dashboard check.** Mapbox has no hard spend cap — see R3. There is no mechanism that stops usage, so watching is the mitigation.

`.gitignore` covers `.env*` with a single exception for `.env.example`, which contains variable names and instructions only, never values.

## Supply chain

`npm audit` reports **0 vulnerabilities** as of 2026-08-29. Dependencies are Next 16.3.3, React 19.2.8, Tailwind v4, Zustand, zod, mapbox-gl / react-map-gl, plus Vitest and Testing Library in dev.

Policy carried from `ass-hub/foodraccoon` (its D19), which is worth repeating because it was learned the hard way there: **where a pinned version has a named advisory and a patched release exists in the same major and minor line, take the patched version and record the deviation.** `npm audit` output is read, not dismissed.

## Content integrity — the security-adjacent risk that is live now

The one thing this site can currently do to a user is tell them something false about a real place they then travel to. That is R1, and it is tracked as a risk rather than a vulnerability, but the mitigations are the same shape: provenance on every claim (`sources`, min 1, enforced by the schema), an honest **ASSUMED** marking in `docs/VERIFIED.md`, and a footer that says the content is unverified.

This becomes a genuine security property in Phase 5. The brief constrains RAG retrieval to the app's own verified spot database specifically so the assistant cannot hallucinate places. That guarantee is worth exactly as much as the integrity of these rows, and prompt injection through user-submitted content (Phase 7's "suggest a place") would attack it directly.

## What arrives with Phase 3, and must be specced before any code

- **Authentication.** Supabase Auth. Session handling belongs in `src/proxy.ts`, which today only redirects locales.
- **Row-level security.** Every user-scoped table needs RLS, and any client that bypasses PostgREST bypasses RLS with it. `ass-hub/foodraccoon`'s D16/R12 is the cautionary case: adding a user-scoped query to a direct-Postgres layer is a security defect even when the query is correct.
- **Spend caps, on day one of that phase.** Supabase Pro with **Spend Cap ON** (the default — do not turn it off), or the free plan, which throttles rather than bills. Claude API: an org-level monthly spend limit in the Console before the first call, since there is no free tier. Google Cloud: per-API daily quota, which 429s past the limit and is a true hard stop.
- **Rate limiting** on any mutation route.

## What arrives with Phase 4

Collaborative voting is the first feature where one user's action changes what another user sees. That needs its own threat model: channel authorisation (who may join a session), vote integrity (one vote per person per candidate), and the fact that Realtime broadcasts are only as private as the channel policy makes them.

## Reporting

Not yet applicable — nothing is deployed. A security contact and disclosure route are required before the first public deployment.
