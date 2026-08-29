// Import Phnom Penh venues from Google Places into seed-file entries.
//
//   GOOGLE_PLACES_KEY=... node tools/import-places.mjs bkk1 bar
//
// Writes TypeScript to stdout. It is a TOOL, not a build step (D36): you run
// it, you read what it produced, and you paste in what you agree with. Nothing
// here runs in production and the key never enters the repo.
//
// It deliberately does not write to src/data/spots.ts. Imported content is a
// draft — the hours are fetched rather than checked, and a resident will judge
// this product on hours being right.

const KEY = process.env.GOOGLE_PLACES_KEY;
const [, , hood, kind = "restaurant"] = process.argv;

if (!KEY) {
  console.error("Set GOOGLE_PLACES_KEY. See docs/DECISIONS.md D36.");
  process.exit(1);
}

// Rough centres. Radius is small on purpose — a wide search returns the whole
// city and you lose the one thing the neighbourhood field is for.
const CENTRES = {
  bkk1:             [11.5449, 104.9224],
  riverside:        [11.5680, 104.9310],
  "daun-penh":      [11.5730, 104.9220],
  "toul-tom-poung": [11.5395, 104.9155],
  "toul-kork":      [11.5720, 104.8940],
  "chroy-changvar": [11.5860, 104.9420],
  "koh-pich":       [11.5530, 104.9430],
  "sen-sok":        [11.5990, 104.8830],
};

const centre = CENTRES[hood];
if (!centre) {
  console.error(`Unknown neighbourhood "${hood}". One of: ${Object.keys(CENTRES).join(", ")}`);
  process.exit(1);
}

// Places type → our category. Anything unmapped is reported rather than guessed.
const CATEGORY = {
  restaurant: "restaurant", cafe: "cafe", bakery: "bakery", bar: "bar",
  night_club: "bar", meal_takeaway: "street-food", market: "market",
  art_gallery: "gallery", movie_theater: "cinema", museum: "museum",
  tourist_attraction: "nature", park: "nature", hindu_temple: "temple",
  place_of_worship: "temple", gym: "sport", spa: "sport",
};

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const pad = (n) => String(n).padStart(2, "0");

/**
 * Places periods → our weekly rules.
 *
 * Google's `day` is 0 = Sunday; ours is 0 = Monday. Getting that wrong shifts
 * every venue by a day and looks entirely plausible, so it is done once here.
 */
function toHours(regular) {
  if (!regular?.periods?.length) {
    return { kind: "unknown", why: "Google had no opening hours for this place." };
  }

  const rules = [];
  for (const p of regular.periods) {
    if (!p.open || !p.close) {
      // A period with no close is 24h in Google's model.
      return { kind: "always" };
    }
    const day = DAYS[(p.open.day + 6) % 7];
    rules.push({
      days: [day],
      open: `${pad(p.open.hour)}:${pad(p.open.minute ?? 0)}`,
      close: `${pad(p.close.hour)}:${pad(p.close.minute ?? 0)}`,
    });
  }
  return { kind: "weekly", rules };
}

const slugify = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
   .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);

const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": KEY,
    "X-Goog-FieldMask": [
      "places.id", "places.displayName", "places.location", "places.types",
      "places.priceLevel", "places.regularOpeningHours", "places.websiteUri",
      "places.googleMapsUri", "places.nationalPhoneNumber",
    ].join(","),
  },
  body: JSON.stringify({
    includedTypes: [kind],
    maxResultCount: 20,
    locationRestriction: {
      circle: { center: { latitude: centre[0], longitude: centre[1] }, radius: 1200 },
    },
  }),
});

if (!res.ok) {
  console.error(`Places returned ${res.status}:`, (await res.text()).slice(0, 400));
  process.exit(1);
}

const { places = [] } = await res.json();
const today = new Date().toISOString().slice(0, 10);
const unmapped = new Set();

console.log(`  // ${places.length} × ${kind} near ${hood}, imported ${today} (D36).`);
console.log("  // Hours are FETCHED, not checked. Read before pasting.\n");

for (const p of places) {
  const name = p.displayName?.text ?? "Unnamed";
  const cats = [...new Set((p.types ?? []).map((t) => CATEGORY[t]).filter(Boolean))];
  if (cats.length === 0) {
    (p.types ?? []).forEach((t) => unmapped.add(t));
    cats.push(kind === "bar" ? "bar" : "restaurant");
  }

  const price = { PRICE_LEVEL_INEXPENSIVE: 1, PRICE_LEVEL_MODERATE: 2,
                  PRICE_LEVEL_EXPENSIVE: 3, PRICE_LEVEL_VERY_EXPENSIVE: 4 }[p.priceLevel] ?? 2;

  const hours = toHours(p.regularOpeningHours);
  const links = {};
  if (p.googleMapsUri) links.maps = p.googleMapsUri;
  if (p.nationalPhoneNumber) links.phone = p.nationalPhoneNumber;

  console.log(`  {
    id: ${JSON.stringify(slugify(name))},
    slug: ${JSON.stringify(slugify(name))},
    placeId: ${JSON.stringify(p.id)},
    neighbourhood: ${JSON.stringify(hood)},
    categories: ${JSON.stringify(cats)},
    name: { en: ${JSON.stringify(name)} },
    coords: [${p.location.longitude}, ${p.location.latitude}],
    blurb: { en: "TODO — one line, in your words." },
    hours: ${JSON.stringify(hours)},
    priceLevel: ${price},
    lastVerified: ${JSON.stringify(today)},
    hoursSource: "imported",
    links: ${JSON.stringify(links)},
    practical: { typicalDurationMins: 90 },
    sources: [${JSON.stringify(p.googleMapsUri ?? "https://maps.google.com")}],
  },`);
}

if (unmapped.size) {
  console.error(`\n  // Unmapped Places types (add to CATEGORY): ${[...unmapped].join(", ")}`);
}
console.error(`\n  // ${places.length} imported. Every blurb says TODO — that is the point.`);
