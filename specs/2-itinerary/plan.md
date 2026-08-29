# Phase 2 — Itinerary builder: Execution Plan

Spec: `specs/2-itinerary/spec.md`

Every step ends with `npm run build && npm run lint && npm run typecheck && npm test` green, so each is independently committable and the repo is never left broken. Steps 1–4 are pure logic with tests and touch no UI; the frames only start mattering at step 5.

## Step 0 — Claim and record

- [ ] `docs/PROGRESS.md`: Phase 2 owner and status "In progress", branch `phase/2-itinerary`. Commit and push alone.
- [ ] Append **D22–D25** to `docs/DECISIONS.md` — only these four, only after the spec is approved.
- [ ] `docs/BUILD-PLAN.md`: the Phase 2 row still says "Mapbox Directions / Optimization API". Correct it to point at D22. Leaving a wrong pointer is worse than the edit (rule 7).

## Step 1 — The memorial flag

- [ ] `sensitive: z.literal("memorial").optional()` on `spotSchema`, plus a `superRefine` rejecting `pairedWith` when `sensitive` is set.
- [ ] Mark the five sites in `src/data/spots.ts`: Tuol Sleng, Choeung Ek, the Phnom Sampeau killing caves, Kamping Puoy, the Secret Lake.
- [ ] `OffRadarMeter`, `PairingCard` and `SpotCard`'s score return `null` when `sensitive` is set.
- [ ] Tests: a sensitive spot with a `pairedWith` fails parsing; the three components render nothing for one.

Closes B7 and acceptance criterion 7. **Independently valuable — this one ships even if the rest of the phase is abandoned.**

## Step 2 — Geometry and estimates

- [ ] `src/lib/route/estimate.ts` — `haversineKm()`, and `estimateLeg(a, b)` returning `{ km, minutes, isEstimate: true }` at ×1.4 / 22 km/h.
- [ ] Tests against two known Kampot pairs and one degenerate zero-distance case.

The whole routing-API swap surface is this one function (D22).

## Step 3 — The day budget

- [ ] `src/lib/route/day.ts` — `dayBudget(stops, { start, frameStart, frameEnd })` returning per-stop arrival/departure, per-leg estimates, `plannedMins`, `remainingMins`, `overrunMins`, and a state of `room | full | over`.
- [ ] `fullThreshold()` computed as `min(typicalDurationMins) + min(leg)` over the dataset, not a constant.
- [ ] `dayOffRadarAverage(stops)` returning `{ average, band, scoredCount, totalCount }` — the honest denominator, band via `offRadarBand()`.
- [ ] Tests: the three states; the threshold moving when a shorter spot enters the dataset (criterion 6); memorial stops excluded from the average but counted in the denominator.

## Step 4 — Route state

- [ ] `src/store/route.ts` — Zustand, `localStorage`-persisted: `stops`, `startTime`, `frame`, `add`, `remove`, `move`, `setDwell`, `reverse`, `shortestDriving`.
- [ ] URL encode/decode for `/plan/[id]`.
- [ ] `shortestDriving` returns the reordering **and** a `movedSensitive` flag so the UI can declare it.
- [ ] Tests: reorder retimes; persistence round-trips; the encoder survives a memorial stop.

## Step 5 — The timeline component

- [ ] `RouteTimeline` — day frame with hour ticks and two fixed end rules, dwell solid, travel hatched, hatch token-driven so it inverts in dark.
- [ ] Stop rows, leg rows, the memorial row variant, the tail row.
- [ ] Overrun as geometry: doubled end rule, hatch past it, number in `--foreground` weight 700.
- [ ] `role="img"` with a text label on the bar; `role="status"` on the capacity summary.

## Step 6 — The panes and the dock bar

- [ ] `/discover` right pane gains the `[Map | Route]` third state; the mobile toggle goes three-way at `sm`.
- [ ] `RouteDock` — 56px, appears on first add, aligns to the 72rem column at `lg`, `line-clamp-1` on the day name (never `truncate` — C8).
- [ ] The sheet at `?day=open`, Timeline and Reorder tabs, back-button dismiss.
- [ ] Add `RouteDock` to `probe.mjs`'s exclusion list alongside the rails.

## Step 7 — The add affordance

- [ ] `AddToDay` — priced label, three states (`fits` / `over` / `in your day`), never disabled, `aria-describedby` to its own cost line.
- [ ] Placed on `SpotCard` (route mode only) and on the spot page.
- [ ] Verify criterion 11: adding from a spot page does not navigate.

## Step 8 — The empty state and the shared day

- [ ] Empty route draws the constraint container — nine hours, ticks, fixed end rules, "9h 00m free". Not a skeleton: the numeric label and ticks distinguish it.
- [ ] Suggestion tray = `sortSpots(cityspots, "off-radar")` filtered by what fits.
- [ ] `/plan/[id]` — the Constellation-family hero, dashed hairlines for legs, memorial stops drawn without a score.

## Step 9 — The spot page reorder

- [ ] Split the `<aside>`: practical moves early, map and sources stay late.
- [ ] Score panel into the header with the caveat attached to it; category colour out; pairing as a full-width band; community as a full-width gold band.
- [ ] **The unverified caveat moves onto the practical card** — closes C18.
- [ ] Extract the projection helper out of `Constellation` into the shared no-map graticule.
- [ ] The memorial variant: 596px measure, radii 0, hairlines, Playfair 400/33, "Not ranked, not paired…", no gold, no city colour.

## Step 10 — Verify and document

- [ ] `tools/probe.mjs` at 390 / 768 / 1280 with a day open (criterion 9).
- [ ] `tools/contrast.mjs` on `/discover` with the route open and on a spot page, both modes, memorial variant included (criterion 10).
- [ ] Close every criterion in `docs/VERIFIED.md` with its evidence; record any correction found on the way.
- [ ] Update `docs/DESIGN-SYSTEM.md` with what actually shipped, and `docs/PROGRESS.md`.
- [ ] PR per `.github/pull_request_template.md` — what changed, what was run and observed, what is **not** done, D/R IDs touched, where to pick up.

## Verification

Criterion 2 is the one to watch: the whole phase must be demonstrable with no Mapbox token, because that is the repo's actual state (B1, D11).
