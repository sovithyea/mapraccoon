// Re-check every venue's opening hours against Google Places, in place.
//
//   GOOGLE_PLACES_KEY=... node tools/refresh-hours.mjs            # rewrites the seed file
//   GOOGLE_PLACES_KEY=... node tools/refresh-hours.mjs --check    # reports, changes nothing
//
// This is the answer to R8, which is the risk that actually ends this product:
// bars in Phnom Penh close, move and change their hours, the seed file is a
// TypeScript module, and until now NOTHING re-read it. A group turning up
// somewhere shut is the failure that loses them.
//
// It is NOT `import-places.mjs`. That one discovers venues with `searchNearby`
// and prints a draft to stdout for a human to paste (D36). This one takes the
// `placeId` each venue already carries and asks Google what changed. Discovery
// invents entries; this only ever refreshes them.
//
// ── What it will and will not touch ────────────────────────────────────────
//
// Only the volatile fields: `hours`, `priceLevel`, `links`, `lastVerified`.
//
// Never `name`, `slug`, `blurb`, `categories`, `neighbourhood` or `coords`.
// D39 records two entries edited by hand after import — the Russian Market's
// name and the Night Market's category — and a refresh that rewrote whole
// entries would silently undo that kind of work every week. The narrow field
// list is what makes this safe to run unattended.
//
// **`hoursSource: "checked"` is never overwritten.** That value means a person
// confirmed the hours, and a person outranks the API. Where Google now
// disagrees with one, the disagreement is reported for a human to settle.
//
// ── The rule that matters ──────────────────────────────────────────────────
//
// `lastVerified` advances ONLY when a source actually confirmed the venue this
// run. If Google has dropped its hours, the existing ones are kept — they were
// sourced once — but the date does NOT move, so `spots.test.ts`'s staleness
// check keeps counting and the venue eventually surfaces as needing a human.
// A script that stamped today's date on everything it looked at would turn the
// freshness guarantee into a lie that gets harder to detect every week.

const KEY = process.env.GOOGLE_PLACES_KEY;
const CHECK_ONLY = process.argv.includes("--check");
const SEED = "src/data/spots.ts";

if (!KEY) {
  console.error("Set GOOGLE_PLACES_KEY. See docs/DECISIONS.md D36.");
  process.exit(1);
}

const { readFileSync, writeFileSync } = await import("node:fs");

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const pad = (n) => String(n).padStart(2, "0");

/**
 * Places periods → our weekly rules.
 *
 * Copied deliberately rather than imported: `import-places.mjs` prints text and
 * this rewrites a file, and coupling two tools that run on different days for
 * different reasons buys nothing. **Google's `day` is 0 = Sunday and ours is
 * 0 = Monday** — getting that wrong shifts every venue by a day and looks
 * entirely plausible, so the conversion happens once, here.
 */
function toHours(regular) {
  if (!regular?.periods?.length) return null;

  const bySpan = new Map();
  for (const p of regular.periods) {
    // A period with no close is 24h in Google's model.
    if (!p.open || !p.close) return { kind: "always" };
    const open = `${pad(p.open.hour)}:${pad(p.open.minute ?? 0)}`;
    const close = `${pad(p.close.hour)}:${pad(p.close.minute ?? 0)}`;
    const key = `${open}-${close}`;
    if (!bySpan.has(key)) bySpan.set(key, { days: [], open, close });
    bySpan.get(key).days.push(DAYS[(p.open.day + 6) % 7]);
  }

  const rules = [...bySpan.values()]
    .map((r) => ({ ...r, days: r.days.sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b)) }))
    /*
      Sorted, because the comparison downstream is a string compare.

      Google returns periods in whatever order it likes, so `bySpan`'s
      insertion order varies between runs. The first live run reported the
      Russian Market's hours as changed when the only difference was
      `[weekdays, weekend]` becoming `[weekend, weekdays]` — identical hours,
      spurious diff. Left unfixed this would cry wolf most weeks, and a weekly
      report that is usually wrong is a weekly report nobody reads.
    */
    .sort((a, b) => {
      const day = DAYS.indexOf(a.days[0]) - DAYS.indexOf(b.days[0]);
      return day !== 0 ? day : a.open.localeCompare(b.open);
    });

  return { kind: "weekly", rules };
}

const PRICE = {
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

/** One entry's text, located by the `placeId` that is unique to it. */
function entries(source) {
  const found = [];
  const re = /\n {2}\{\n(?:[^]*?)\n {2}\},/g;
  let match;
  while ((match = re.exec(source)) !== null) {
    const text = match[0];
    const placeId = /placeId: "([^"]+)"/.exec(text)?.[1];
    const id = /\n {4}id: "([^"]+)"/.exec(text)?.[1];
    if (placeId && id) found.push({ id, placeId, start: match.index, end: re.lastIndex, text });
  }
  return found;
}

/** Replace one `field: value,` line inside a single entry. */
function setField(text, field, literal) {
  const re = new RegExp(`(\\n {4}${field}: )[^]*?(,\\n)`);
  if (!re.test(text)) return text;
  return text.replace(re, `$1${literal}$2`);
}

const today = new Date().toISOString().slice(0, 10);
let source = readFileSync(SEED, "utf8");
const all = entries(source);

if (all.length === 0) {
  console.error(`No entries with a placeId found in ${SEED}. Refusing to write.`);
  process.exit(1);
}

const changed = [];
const closed = [];
const disputed = [];
const lostHours = [];
const failed = [];

for (const entry of all) {
  const url = `https://places.googleapis.com/v1/places/${entry.placeId}`;
  let place;
  try {
    const res = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": KEY,
        "X-Goog-FieldMask":
          "id,displayName,businessStatus,regularOpeningHours,priceLevel,nationalPhoneNumber,googleMapsUri",
      },
    });
    if (!res.ok) {
      failed.push(`${entry.id}: HTTP ${res.status}`);
      continue;
    }
    place = await res.json();
  } catch (error) {
    failed.push(`${entry.id}: ${error.message}`);
    continue;
  }

  // Reported, never acted on. Removing a venue is a content decision, and a
  // script that deleted rows on a Google flag would quietly shrink the dataset.
  if (place.businessStatus && place.businessStatus !== "OPERATIONAL") {
    closed.push(`${entry.id}: ${place.businessStatus}`);
  }

  const currentHours = /\n {4}hours: ([^]*?),\n/.exec(entry.text)?.[1] ?? "";
  const currentPrice = /\n {4}priceLevel: (\d)/.exec(entry.text)?.[1];
  const wasChecked = /hoursSource: "checked"/.test(entry.text);

  const fresh = toHours(place.regularOpeningHours);
  const freshJson = fresh ? JSON.stringify(fresh) : null;

  let text = entry.text;
  let touched = false;
  let confirmed = false;

  if (freshJson === null) {
    // Google no longer publishes hours. Keep what we have — it was sourced
    // once — but do not claim it was confirmed today.
    if (!/"kind":"unknown"/.test(currentHours)) lostHours.push(entry.id);
  } else if (wasChecked && freshJson !== currentHours) {
    // A person outranks the API. Surface the disagreement instead of resolving
    // it, and leave lastVerified alone so it stays visible.
    disputed.push(`${entry.id}: google says ${freshJson}`);
  } else {
    confirmed = true;
    if (freshJson !== currentHours) {
      text = setField(text, "hours", freshJson);
      touched = true;
      changed.push(`${entry.id}: hours`);
    }
  }

  const freshPrice = PRICE[place.priceLevel];
  if (freshPrice && currentPrice && String(freshPrice) !== currentPrice) {
    text = setField(text, "priceLevel", String(freshPrice));
    touched = true;
    changed.push(`${entry.id}: price ${currentPrice} → ${freshPrice}`);
  }

  /*
    Phone only. `links.maps` is deliberately left alone.

    The stored maps URI came from `searchNearby` and carries a `&g_mp=` tracking
    parameter; Place Details returns the same place with a different one. They
    address the identical venue, so rewriting it changes nothing a reader can
    see — but the first run of this tool reported "links" for all 85 venues,
    which would have meant an 85-entry diff of pure noise every week.

    That matters more than it sounds. This tool's whole value is that a human
    skims the weekly diff, and a diff nobody can skim is a diff nobody reads —
    which is how a real closure slips through in the noise. `sources` also
    quotes that URI, so leaving it alone keeps the two consistent.
  */
  const currentPhone = /"phone":"([^"]*)"/.exec(entry.text)?.[1];
  const freshPhone = place.nationalPhoneNumber;
  if (freshPhone && currentPhone && freshPhone !== currentPhone) {
    text = setField(
      text,
      "links",
      /\n {4}links: ([^]*?),\n/.exec(entry.text)[1].replace(
        `"phone":"${currentPhone}"`,
        `"phone":"${freshPhone}"`,
      ),
    );
    touched = true;
    changed.push(`${entry.id}: phone ${currentPhone} → ${freshPhone}`);
  }

  // The date moves only on a real confirmation, whether or not a field changed.
  if (confirmed) {
    text = setField(text, "lastVerified", JSON.stringify(today));
    touched = true;
  }

  if (touched) {
    source = source.slice(0, entry.start) + text + source.slice(entry.end);
    // Offsets after this entry shift by the length delta, so later entries are
    // re-located rather than trusted. Recomputing is cheaper than being wrong.
    const shift = text.length - entry.text.length;
    for (const later of all) {
      if (later.start > entry.start) {
        later.start += shift;
        later.end += shift;
      }
    }
  }
}

const report = [
  `${all.length} venues re-checked against Google Places on ${today}.`,
  "",
  changed.length ? `Updated (${changed.length}):\n  ${changed.join("\n  ")}` : "No field changed.",
  closed.length ? `\nNo longer operational — needs a human (${closed.length}):\n  ${closed.join("\n  ")}` : "",
  disputed.length ? `\nGoogle disagrees with a hand-checked entry (${disputed.length}):\n  ${disputed.join("\n  ")}` : "",
  lostHours.length ? `\nGoogle dropped its hours; ours kept, date not advanced (${lostHours.length}):\n  ${lostHours.join("\n  ")}` : "",
  failed.length ? `\nLookup failed (${failed.length}):\n  ${failed.join("\n  ")}` : "",
]
  .filter(Boolean)
  .join("\n");

console.log(report);

if (CHECK_ONLY) process.exit(0);

writeFileSync(SEED, source);
console.log(`\nWrote ${SEED}. Run \`npm run build\` — invalid content fails there, by design.`);
