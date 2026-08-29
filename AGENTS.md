# AGENTS.md

Instructions for AI agents live in [`CLAUDE.md`](CLAUDE.md). Read that file.

Short version, so you do not start on the wrong footing:

1. **No application code before that phase's `specs/N-name/spec.md` and `plan.md` are reviewed.** This was broken once, in Phase 1, and recorded as a deviation (D14). It applies from Phase 2 without exception.
2. **Documentation is a lead, not evidence.** This repo's docs have already been wrong four times. Read the source; record what you observe in `docs/VERIFIED.md`.
3. **This is Next.js 16.** `params` is a `Promise`. `middleware.ts` is now `proxy.ts` with a named `proxy` export. Check `node_modules/next/dist/docs/` rather than recalling conventions.
4. **The content makes factual claims about real places people will travel to, and it is unverified.** Do not add a spot you cannot source. Do not write memorial sites in the product's promotional voice. See R1, R4, R9.
5. **Off-radar is the default sort, everywhere, with no interaction.** Changing that breaks the product, not a preference.
6. **There is no backend.** No Supabase, no Claude API, no Google Cloud. Do not add one before Phase 3.
7. **Every PR gets a real description** — `.github/pull_request_template.md`. What changed, what you actually verified, what is *not* done, and where the next agent should pick up. You are writing it for someone with none of your context.

Start with [`README.md`](README.md), then [`docs/WORKFLOW.md`](docs/WORKFLOW.md).
