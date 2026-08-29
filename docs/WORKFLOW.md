# Workflow

How work gets picked up, branched, reviewed and landed. Written down because multiple people and multiple AI agents work in this repo.

Process docs use RFC 2119 keywords: MUST is rejectable at review, SHOULD needs a stated reason to depart from, MAY is your call.

## The core rule

**No application code before that phase's `spec.md` and `plan.md` are written and reviewed.**

This rule was broken once, in Phase 1, and the deviation is recorded in D14 and `docs/PROGRESS.md` rather than concealed. It applies from Phase 2 onward without exception. If you find yourself writing code for a phase whose spec is a draft, stop and finish the spec.

## Branching

```
main                      always green, always reviewed
  phase/N-name            one branch per phase, matching specs/N-name/
  docs/<topic>            docs-only changes that are not a phase
  fix/<short-description> corrections to landed work
```

Branch naming maps to the `specs/` directory: Phase 2's branch is `phase/2-itinerary` because its spec is `specs/2-itinerary/spec.md`.

## Picking up a phase

1. Read `docs/PROGRESS.md`. Claim the phase there — your name in Owner, Status to "In progress" — and push that on its own commit. It is the only thing preventing two people building the same phase twice.
2. Read `docs/ARCHITECTURE.md`, `docs/DECISIONS.md` and the phase's `spec.md`.
3. Work through `plan.md` in order. Its steps are sequenced so each commit leaves the repo working.
4. Run `npm run build`, `npm run lint`, `npm run typecheck` and `npm test` **after every step**, not only at the end.
5. Check acceptance criteria off in `docs/VERIFIED.md` with the evidence that closed them — the command you ran, the file you read, the thing you observed. Not an assertion.
6. Append any decision made along the way to `docs/DECISIONS.md`.
7. Update `docs/PROGRESS.md` at the end of every working session.

## Commits

Conventional Commits 1.0.0: `<type>[scope][!]: <description>`, scope naming the phase directory — `feat(foundation)`, `docs(design-system)`, `fix(spots)`.

A commit carrying a decision, a reversal, a discovered defect or a non-obvious trade-off MUST have a body explaining *why*. The diff already says what. `Refs:` footers name decision and risk IDs so `git log --grep='D10'` works.

## Documentation rules

**Documentation is a lead, not evidence.** This repo's own docs have already been wrong four times — see the Corrections table in `docs/VERIFIED.md`. Read the actual source. Record what you observe in `VERIFIED.md`, marked **VERIFIED**, with the command or file that showed it. Never promote a claim because a document said so, including a document in this repo.

**`docs/DECISIONS.md` is append-only.** Reversals get a new entry that supersedes the old one. Correcting a stale status header or a wrong cross-reference is not a rewrite — leaving a wrong pointer in place is worse.

**`docs/DESIGN-SYSTEM.md` describes what shipped, not what was intended.** If it disagrees with the CSS, the CSS is right and the doc is a bug.

## Content changes

Spot content is code until Phase 3: it lives in `src/data/spots.ts` and is parsed by zod at import (D3). So a content edit MUST pass `npm run build` and `npm test`, and:

- Adding a hidden spot without a `pairedWith` anchor SHOULD be justified. A pairing is the product; a spot without one is a listing.
- `pairedWith` MUST point at a better-known spot. The test suite enforces this — the sentence is backwards otherwise.
- Every spot MUST carry at least one source (the schema enforces it), and the claim in the prose SHOULD be traceable to one of them. See R1.
- A `community` block naming a real organisation MUST NOT overstate impact. See R4.
- Memorial and mass-atrocity sites MUST NOT be written in the product's promotional voice. See R9.

## Definition of done for a phase

1. Every acceptance criterion in `spec.md` is checked off in `VERIFIED.md` with evidence.
2. `npm run build`, `npm run lint`, `npm run typecheck`, `npm test` all clean.
3. `docs/PROGRESS.md` updated; decisions appended.
