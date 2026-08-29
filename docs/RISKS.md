# Risks — MapRaccoon

Ordered by severity. Each has a mitigation and an owner phase.

---

## R1 — The content is unverified, and the product's entire pitch is that you can trust it

**Severity: high. Open, and it is the most serious item in the project.**

All 42 entries were written editorially. Coordinates, entry fees, opening times, seasonal advice, transport times and community-impact claims have **not** been checked against a primary source or on the ground. The schema guarantees each spot carries at least one source URL (D6); it does not guarantee the prose matches those sources.

This matters more here than on a normal content site. The product tells people to drive two and a half hours to Koh Ker or three hours to Banteay Chhmar instead of going where everyone else goes. Being wrong about a fee is embarrassing. Being wrong about whether a site is open, reachable, or demined is not.

**Mitigation:** before anything is marketed as accurate — a verification pass per spot, recorded row by row in `docs/VERIFIED.md`. Until then the footer says the content is unverified and points at the per-spot sources, and every page shows its sources.

**Owner:** pre-launch, and a standing obligation thereafter.

---

## R2 — Publicising hidden places is self-defeating, and can be harmful

**Severity: high. Structural — it does not go away.**

The product's value is that these places are quiet. Succeeding at scale makes them not quiet. That is the ordinary version of the problem.

The serious version: several spots have real carrying-capacity limits. ACCB deliberately caps visitor numbers. Trapeang Sangkae and Banteay Chhmar run village-scale homestay programmes. Sending a large, sudden flow of visitors at a village-run operation is not a favour to it, and "your visit funds this village" becomes false the moment volume outstrips what the village agreed to host.

**Mitigation:** treat community-run listings as requiring the operator's consent, not just their existence (see R4). Keep booking-ahead guidance on the entries that need it. Take the question seriously in Phase 7 before any growth loop amplifies it.

**Owner:** editorial policy now, Phase 7 formally.

---

## R3 — Mapbox has no hard spend cap

**Severity: medium.** Carried directly from the brief's own cost-control table, which is right about this.

Every other service in the plan can be capped: Claude at the org level, Supabase via its spend cap, Google Cloud via per-API daily quota. Mapbox cannot. The public token is exposed in the browser by design, and the only controls are URL restriction and watching the dashboard.

Free tier is 50K map loads and 100K directions requests per month — far above this project's scale, so the realistic risk is a leaked unrestricted token being used elsewhere, not organic traffic.

**Mitigation:** restrict the token to your domains and `localhost` on creation; check the dashboard weekly; documented in `.env.example` and the README. Phase 2 adds Directions calls, which is when usage stops being trivial.

**Owner:** whoever creates the token. Today: nobody has, so exposure is zero.

---

## R4 — Community-impact claims name real organisations

**Severity: medium-high.**

ACCB, Phare Ponleu Selpak, the Banteay Chhmar CBT programme, Trapeang Sangkae and the Kampong Phluk boat association are named on the site with specific claims about what visitor money funds. Those descriptions were written from general knowledge, not supplied or approved by them.

Getting one wrong misrepresents a real organisation to prospective visitors, which is their reputational problem as much as ours. Overstating an impact claim is the failure mode that matters, and it is the exact claim the product uses to convert.

**Mitigation:** contact each named organisation before launch; treat their wording as authoritative; drop the block rather than guess. Part of the R1 verification pass and blocking on the same gate.

---

## R5 — Sources are leads, not primary sources

**Severity: medium.** Each spot carries an OpenStreetMap link at its own coordinates plus a reference where a good one exists — mostly Wikipedia.

OSM confirms a location exists at those coordinates. Wikipedia is a starting point, not a citation. Neither establishes an entry fee, an opening time, or that a community programme is currently running.

**Mitigation:** `sources` is a provenance trail, and `docs/VERIFIED.md` marks the content **ASSUMED** rather than pretending otherwise. Phase 5 constrains RAG retrieval to this database precisely so the assistant cannot invent places — which makes the quality of these rows a correctness property of that feature, not just an editorial one.

---

## R6 — An English-only guide to Cambodia, with fonts that cannot render Khmer

**Severity: medium, and it will read as worse than medium to a Cambodian user.**

The i18n structure is in place (D7) and `km.json` is a stub. Worse than the missing translation: the shipped typefaces, Playfair Display and DM Sans, have no Khmer coverage. Filling the dictionary today would render Khmer in a fallback face against a design tuned for Latin.

**Mitigation:** a Khmer face (Noto Serif Khmer / Noto Sans Khmer, or Kantumruy Pro) has to be added to `app/[locale]/layout.tsx` and the design checked at Khmer line heights **before** `km.json` is populated. `buildableLocales` already prevents a half-translated route from building.

---

## R7 — Mapbox vendor lock-in, accepted rather than mitigated

**Severity: low now, rising in Phase 2.**

D10 keeps Mapbox because the Directions and Optimization APIs *are* the itinerary builder and MapLibre has no equivalent. `ass-hub/foodraccoon` made the opposite call for its own good reasons.

**Mitigation:** none, deliberately. The renderer sits behind `SpotMap`, so swapping it is contained; the routing APIs are the part with no exit.

---

## R8 — The seed file does not scale

**Severity: low, and self-limiting.**

`src/data/spots.ts` is 1,100 lines for 42 spots. At a few hundred it becomes unpleasant; content edits require a developer and a build.

**Mitigation:** Phase 3 moves this to Postgres with an admin path. Until then the file's size is a useful forcing function against adding unwritten places.

---

## R9 — Genocide-memorial content sits in a discovery product

**Severity: low frequency, high consequence.**

Tuol Sleng, Choeung Ek, Phnom Sampeau's killing caves, Kamping Puoy and the Secret Lake are all sites of mass killing or forced labour. The product's voice is breezy — "tired of the crowds? try this" — and that voice must not be applied to them.

Today this is handled by writing those entries plainly and, at Kamping Puoy and the Secret Lake, saying outright what the visitor is looking at. It is unprotected by anything structural: a future generated summary, a badge, or an ML-written blurb could reintroduce the problem.

**Mitigation:** keep it editorial for now. Phase 5's RAG assistant and Phase 7's badges both need an explicit rule before they touch these spots.

---

## R10 — Claude API has no free tier

**Severity: low today, real at Phase 5.** The brief is right to put an org-level monthly spend limit in place before the first call.

---

## R11 — There are no photographs, and image rights are unresolved

**Severity: low today.** The design works without photography — the constellation, the colour system and the display type carry it. Adding images means sorting licensing for every one, which is a real cost the current design has deferred rather than solved.
