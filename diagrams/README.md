# Diagrams

Same convention as `rocket/athena` and `ass-hub/foodraccoon`. Each diagram is a triplet plus source:

| File | Purpose |
|---|---|
| `<name>.mmd` | Mermaid source. **The single source of truth** — edit this and re-render |
| `<name>.excalidraw` | Editable scene. Open at excalidraw.com via File → Open |
| `<name>.svg` | Vector, for docs |
| `<name>.png` | Raster at 300dpi of a 6.5in placement, for chat and READMEs |

## Current diagrams

**None yet.** Two are worth drawing and neither has been:

- **`mapraccoon-build-phases`** — the seven-phase dependency graph from `docs/BUILD-PLAN.md`. Solid border for the active phase, dashed for blocked, thin for not started.
- **`mapraccoon-content-flow`** — `src/data/spots.ts` → zod schema → query helpers → scoring → pages, showing where the build fails on invalid content, and marking `scoring.ts` as the seam the Phase 6 model replaces.

Both should use the Laterite & Monsoon palette from `docs/DESIGN-SYSTEM.md`.

## Re-rendering

Run `/diagram` and point it at the `.mmd` file.

One gotcha carried over from the sibling repos: the default base64 transport decodes as Latin-1, which mangles `·` separators in labels. The render must use `decodeURIComponent(escape(atob(b64)))` rather than bare `atob(b64)`.
