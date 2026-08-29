# Cambodia Tourism Discovery App — Project Brief

Standalone project (separate from FoodRaccoon). A web app that showcases Cambodian
tourism, combining curated destination content, a route/itinerary planner, and a
collaborative "plan a day out with friends" feature.

## Core features (MVP)

1. **Curated destination database** — temples, nature, food, culture. Start with
   Phnom Penh, Siem Reap, Kampot/Kep, Battambang.
2. **Interactive Mapbox map** with layered pins. Default sort = "off-the-radar
   score" (inverse popularity), not "most popular" — discovery should be the
   default view, not an opt-in tab.
3. **Itinerary builder** — multi-stop route, travel time between stops via Mapbox
   Directions/Optimization API.
4. **Plan a day out with friends** — collaborative multi-stop planner:
   - Timeline view: arrival/departure per stop, computed from travel time +
     planned duration per stop
   - Tinder-style swipe voting between candidate options per time slot
     (`react-tinder-card` or Framer Motion drag), synced live via Supabase
     Realtime so everyone's swipes update for everyone
   - Match resolution: first candidate everyone swipes right on wins, or highest
     right-swipe ratio once a timer expires

## V2 / stretch features

- Multi-day / intercity itinerary chaining (bus/van travel time between cities)
- Budget split calculator across the group
- Offline itinerary export (cached map tiles + stop list) — genuinely useful for
  Mondulkiri/Ratanakiri/remote islands with real connectivity gaps
- Hidden-gem ML scoring model (XGBoost) — deferred until there's real
  visit/review data to train on; until then "hidden gem" is an editorial tag,
  not an algorithm output
- RAG trip assistant — Claude API + Voyage embeddings, retrieval constrained to
  the app's own verified spot database only (no hallucinated places)
- Crowd/season prediction — festival calendar + wet/dry season + visit-log data
- Menu/sign photo translator — camera + OCR + Khmer→English translation
- Grab/tuk-tuk fare estimator — distance × local per-km rate, no live API exists
  for this
- "Suggest a place" tip submissions — editorially curated at first, feeds an
  automated pipeline later

## Discovery/attraction design principles

- Default sort is the "off-the-radar score," not popularity
- Narrative pairing: every hidden spot links to the famous one it's an
  alternative to (e.g. "tired of Angkor Wat crowds? try this")
- Community-based tourism / conservation framing as the actual conversion hook
  ("your visit funds this village"), not just a map pin
- Exploration streaks/badges to push users past the top 5 obvious spots

## Tech stack

- **Frontend:** Next.js, Tailwind, Zustand
- **Map/routing:** Mapbox GL JS, Directions API, Optimization API
- **Backend:** Supabase (Postgres, Auth, Realtime, Storage, pgvector) — needed
  specifically once collaborative voting or accounts exist. Skip entirely for a
  static curated-content-only phase.
- **RAG:** Claude API (Sonnet 5) + Voyage AI embeddings; retrieval constrained
  to the verified spot DB
- **OCR/translation:** Google Cloud Vision + Translation API
- **Weather:** OpenWeatherMap

## Data sourcing

- Bulk seed: OpenStreetMap Overpass API (free) for baseline POI coverage
- Fill gaps: Google Places API (New) — minimal field mask only (name, location,
  category); avoid rating/photo/review fields, which silently reprice the call
  to a much more expensive SKU
- Hidden-gem layer: manual editorial curation initially, "suggest a place"
  submissions as the long-term growth engine
- ML scoring: deferred until there's enough first-party visit/review data —
  Google/OSM data is inherently biased toward already-popular spots

## Cost control (set these up on day one)

| Service | Cap mechanism | Notes |
|---|---|---|
| Claude API | Console → org-level monthly spend limit | Hard cap, blocks usage once hit. No free tier, so set this first. |
| Supabase | Free plan (auto-throttles, never bills) or Pro with **Spend Cap ON** (default) | Blocks overage instead of billing it. Don't turn the cap off. |
| Google Cloud (Places/Vision/Translation) | Per-API daily quota in Cloud Console | Requests 429 past quota instead of billing — true hard stop. |
| Mapbox | No native hard cap — restrict token to domain + check dashboard weekly | Free tier (50K map loads, 100K directions/mo) covers this project's scale easily. |
| Voyage / OpenWeatherMap | Free tier is generous enough (200M tokens / 1K calls-day) | No cap needed yet. |

## Suggested build order

1. Static curated map + destination pages, no backend — validate content and
   design first
2. Add Supabase once the itinerary builder needs persistence
3. Itinerary builder + travel-time calculation
4. Collaborative voting (this is what actually justifies Realtime)
5. RAG trip assistant, once the spot DB has real content
6. ML hidden-gem scoring, once there's real usage data

## Competitor reference

themapcambodia.com — editorial city-guide + curated picks + events/deals,
monetized via a physical map distributed at 220+ locations plus partner
placements. No interactive itinerary building or route planning — that's the
gap this project fills.
