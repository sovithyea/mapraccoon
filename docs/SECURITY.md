# Security — MapRaccoon

Threat model and trust boundaries. Written at Phase 1, when there is very little to defend, so the shape exists before the risk does (D13).

**Current state on `main`: there is no user data, no authentication, no database and no server-side mutation.** Every page is statically generated at build time from a file in the repo. The attack surface is a static site plus one public Mapbox token.

> **Phase 3 makes the sentence above false, and it is the first time this document has real content to hold.** Voting needs a server (D30) and it is Supabase with Realtime (D35). Written before that phase is built, so the shape exists before the risk does — see *What Phase 3 introduces* below. It is still true of `main` today.

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

## Standing requirements, whenever the thing they guard arrives

Written at Phase 1 against the original phase order. The **pivot moved Phase 3 to voting**, so the two items that apply now are marked; the rest wait for Phase 4.

- **Spend caps, on day one of the phase that needs them. — APPLIES NOW.** Supabase free plan throttles rather than bills; Pro keeps **Spend Cap ON** (the default — do not turn it off). Claude API and Google Cloud are no longer scheduled.
- **Rate limiting on any mutation route. — APPLIES NOW.** The vote insert is the only mutation surface and has no auth in front of it.
- **Authentication.** Supabase Auth, session handling in `src/proxy.ts`, which today only redirects locales. **Phase 4** — Phase 3 has no accounts (D30).
- **Row-level security.** Every user-scoped table needs RLS, and any client bypassing PostgREST bypasses RLS with it. `ass-hub/foodraccoon`'s D16/R12 is the cautionary case. **Phase 4** — Phase 3 deliberately has no user-scoped tables, and uses Broadcast specifically to avoid needing a policy (see below).

## What Phase 3 introduces

Collaborative voting is the first feature where one person's action changes what another sees. It arrives in Phase 3 rather than Phase 4 (D30, D35), so this section is now near-term.

**The secret is the room id.** 128 bits, unguessable, the same model the shared-day links already use. There is no authentication in Phase 3, so possession of the link *is* the authorisation. That is a deliberate trade and its consequence should be stated rather than discovered: anyone the link reaches can vote, and a link forwarded outside the group is a vote from outside the group. For five friends in a thread that is acceptable; it stops being acceptable the moment anything is at stake beyond dinner.

**The service key never reaches the browser.** Writes go through an API route that validates the room id and inserts with the service key held server-side. A build that ships the service key is a total compromise of the project, so it is an acceptance criterion verified by grepping the build output rather than by inspection.

**Reads use Realtime Broadcast, not `postgres_changes`.** This is a security choice, not a performance one. `postgres_changes` would need an RLS policy expressing "knows the room id" — which is not an auth claim, and is exactly the policy shape that gets written permissively and reviewed as fine. Broadcast keeps table reads away from the anon key entirely.

**Realtime broadcasts are only as private as the channel policy makes them.** The channel is named by the room id, so channel names must never be logged, enumerated, or included in error messages or analytics.

**Vote integrity is weak in Phase 3, deliberately — but one vote per *name* is now enforced (D40).** With no accounts there is nothing to bind a voter to, so a determined participant can still vote twice by typing two names. That remains the right trade at this size: the failure mode is a friend being annoying, not a breach, and Phase 4's accounts are what make one-vote-per-*person* enforceable.

What changed is that the store no longer punishes honest use. Until 2026-08-30 every POST appended a row and every row was counted, so reopening a link and voting again counted twice — and since checking the result required marking every card again (C33), *looking at the poll was itself a second vote*. Votes now upsert on `(room_id, voter)`. The new cost is the mirror of the old one and is stated rather than left to be found: **two friends who both type "Sok" overwrite each other**, and nothing here can distinguish that from one person changing their mind.

**Rate limiting on the insert route** is required, not optional. It is the only mutation surface and there is no auth in front of it.

**Expiry is a scheduled delete.** Postgres has no TTL. The 24-hour window is what keeps the store near-empty and makes "no history" architectural, so a job that silently stops running is a data-retention problem nobody would notice.

## What still arrives with Phase 4

Accounts, group membership, and RLS policy design — including the row-level security notes above, which do not apply until there are user-scoped tables. One-vote-per-person becomes enforceable here.

## Reporting

Not yet applicable — nothing is deployed. A security contact and disclosure route are required before the first public deployment.
