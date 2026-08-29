import type { SpotInput } from "@/lib/spots/schema";

/**
 * Seed content — Phnom Penh only (D27).
 *
 * **These eleven are the tourist product's leftovers and are on their way out.**
 * Every one is a landmark: the palace, two markets, three temples, two
 * memorials and three day trips. There is not a restaurant, bar or café among
 * them, which is most of what someone deciding where to go on a Friday actually
 * needs (B9). Step 5 of `specs/3-friends/plan.md` replaces this file wholesale
 * rather than editing it — the voice here is aimed at someone who has never
 * been, and reconciling that is more work than rewriting.
 *
 * They are kept so the build stays green while the schema changes underneath.
 *
 * **The hours and prices below are editorial guesses, not checks.** They carry
 * `lastVerified: "2026-08-29"`, which is the date they were written rather than
 * the date anyone confirmed them — the first thing step 5 must fix (R1).
 *
 * Typed `SpotInput`, not `Spot`: times are authored as `"HH:MM"` and normalised
 * to minutes at parse.
 *
 * `sensitive: "memorial"` is not decoration. Tuol Sleng and Choeung Ek stay
 * (D33) and must never appear as a vote candidate, in a suggestion tray, or in
 * a match result. C19 is the record of what happens when that lives in prose.
 */
export const spots: SpotInput[] = [
  {
    id: "royal-palace",
    slug: "royal-palace",
    neighbourhood: "daun-penh",
    categories: ["temple"],
    name: { en: "Royal Palace & Silver Pagoda" },
    coords: [104.9313, 11.5637],
    blurb: { en: "The working royal residence, and a pagoda floored with five tonnes of silver." },
    description: {
      en: "Built from 1866 when the capital moved back to Phnom Penh, and still the king's residence — which is why parts are closed and the dress code is enforced. The Silver Pagoda next door has 5,000 silver tiles underfoot and an emerald Buddha.\n\nThe city's number-one ticketed sight, and it feels like it by mid-morning.",
    },
    hours: {
      kind: "weekly",
      rules: [
        { days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], open: "08:00", close: "17:00" },
      ],
    },
    priceLevel: 3,
    lastVerified: "2026-08-29",
    practical: { typicalDurationMins: 90 },
    sources: [
      "https://en.wikipedia.org/wiki/Royal_Palace,_Phnom_Penh",
      "https://www.openstreetmap.org/#map=17/11.5637/104.9313",
    ],
  },
  {
    id: "tuol-sleng",
    slug: "tuol-sleng",
    neighbourhood: "bkk1",
    categories: ["museum"],
    name: { en: "Tuol Sleng Genocide Museum (S-21)" },
    coords: [104.9177, 11.5495],
    blurb: { en: "The school the Khmer Rouge turned into a prison. Take the audio guide." },
    description: {
      en: "A secondary school converted into Security Prison 21, where at least 12,000 people were interrogated and sent to Choeung Ek. The classrooms, the photographs of the detained, and the survivors' accounts are left largely as found.\n\nThe audio guide, narrated by a survivor, is what makes the visit comprehensible rather than merely harrowing. Allow time afterwards to sit down.",
    },
    sensitive: "memorial",
    hours: {
      kind: "weekly",
      rules: [
        { days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], open: "08:00", close: "17:00" },
      ],
    },
    priceLevel: 2,
    lastVerified: "2026-08-29",
    practical: { typicalDurationMins: 90 },
    sources: [
      "https://en.wikipedia.org/wiki/Tuol_Sleng_Genocide_Museum",
      "https://www.openstreetmap.org/#map=17/11.5495/104.9177",
    ],
  },
  {
    id: "choeung-ek",
    slug: "choeung-ek",
    neighbourhood: "out-of-town",
    categories: ["museum"],
    name: { en: "Choeung Ek Killing Fields" },
    coords: [104.9019, 11.4844],
    blurb: { en: "The memorial stupa and the mass graves, 15km south of the city." },
    description: {
      en: "The best known of several hundred killing fields, where those held at S-21 were executed. A memorial stupa holds thousands of skulls; the walking route passes excavated grave pits and the killing tree.\n\nThe audio guide is again essential. Fragments of cloth and bone still surface in the paths after heavy rain.",
    },
    sensitive: "memorial",
    hours: {
      kind: "weekly",
      rules: [
        { days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], open: "08:00", close: "17:30" },
      ],
    },
    priceLevel: 2,
    lastVerified: "2026-08-29",
    practical: { typicalDurationMins: 90 },
    sources: [
      "https://en.wikipedia.org/wiki/Choeung_Ek",
      "https://www.openstreetmap.org/#map=15/11.4844/104.9019",
    ],
  },
  {
    id: "central-market",
    slug: "central-market",
    neighbourhood: "daun-penh",
    categories: ["market"],
    name: { en: "Central Market (Phsar Thmei)" },
    coords: [104.9169, 11.5697],
    blurb: { en: "A 1937 art deco dome over watches, scarves and souvenirs." },
    description: {
      en: "The building is the reason to come: a vast ochre art deco cross-shaped hall from 1937, one of the largest domed markets in Asia, restored in 2011.\n\nThe goods under it are mostly tourist-grade — imported silk sold as Cambodian, phone cases, jewellery. Beautiful architecture, unremarkable shopping.",
    },
    hours: {
      kind: "weekly",
      rules: [
        { days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], open: "07:00", close: "18:00" },
      ],
    },
    priceLevel: 1,
    lastVerified: "2026-08-29",
    practical: { typicalDurationMins: 90 },
    sources: [
      "https://en.wikipedia.org/wiki/Phnom_Penh",
      "https://www.openstreetmap.org/#map=17/11.5697/104.9169",
    ],
  },
  {
    id: "russian-market",
    slug: "russian-market",
    neighbourhood: "toul-tom-poung",
    categories: ["market"],
    name: { en: "Russian Market (Toul Tom Poung)" },
    coords: [104.9178, 11.5419],
    blurb: { en: "Low tin roof, no air, and the best market food hall in the city." },
    description: {
      en: "Named for the Soviet expatriates who shopped here in the 1980s. Densely packed aisles of garment-factory overruns, motorbike parts, records and housewares, wrapped around a food court that locals actually eat in.\n\nHot, dark and genuinely functional — this is where the city shops, not where it sells to visitors.",
    },
    hours: {
      kind: "weekly",
      rules: [
        { days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], open: "06:00", close: "17:30" },
      ],
    },
    priceLevel: 1,
    lastVerified: "2026-08-29",
    practical: { typicalDurationMins: 90 },
    sources: [
      "https://en.wikipedia.org/wiki/Phnom_Penh",
      "https://www.openstreetmap.org/#map=17/11.5419/104.9178",
    ],
  },
  {
    id: "wat-phnom",
    slug: "wat-phnom",
    neighbourhood: "daun-penh",
    categories: ["temple"],
    name: { en: "Wat Phnom" },
    coords: [104.9297, 11.5766],
    blurb: { en: "The hill the city is named after, and a working temple on top of it." },
    description: {
      en: "Legend has Lady Penh finding four Buddha statues in a floating koki tree in 1372 and raising this hill to house them — hence Phnom Penh, 'Penh's hill'. The current stupa dates from 1926.\n\nA busy local shrine rather than a monument: people come to make offerings before exams and business deals. Twenty-seven metres of elevation, which in this city counts as a view.",
    },
    hours: {
      kind: "weekly",
      rules: [
        { days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], open: "07:00", close: "18:30" },
      ],
    },
    priceLevel: 1,
    lastVerified: "2026-08-29",
    practical: { typicalDurationMins: 90 },
    sources: [
      "https://en.wikipedia.org/wiki/Wat_Phnom",
      "https://www.openstreetmap.org/#map=17/11.5766/104.9297",
    ],
  },
  {
    id: "wat-langka",
    slug: "wat-langka",
    neighbourhood: "bkk1",
    categories: ["temple"],
    name: { en: "Wat Langka" },
    coords: [104.9219, 11.5502],
    blurb: { en: "One of the city's oldest pagodas, with public meditation sessions in English." },
    description: {
      en: "Founded in 1442 as a library for sacred texts and a meeting point for Khmer and Sri Lankan monks — hence the name. Rebuilt after the Khmer Rouge used it as a storehouse.\n\nIt runs open vipassana sessions several evenings a week, led by monks, free and open to anyone. Very few visitors know this is on offer.",
    },
    hours: {
      kind: "weekly",
      rules: [
        { days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], open: "06:00", close: "18:00" },
      ],
    },
    priceLevel: 1,
    lastVerified: "2026-08-29",
    practical: { typicalDurationMins: 90 },
    sources: [
      "https://en.wikipedia.org/wiki/Wat_Langka",
      "https://www.openstreetmap.org/#map=17/11.5502/104.9219",
    ],
  },
  {
    id: "koh-dach",
    slug: "koh-dach",
    neighbourhood: "out-of-town",
    categories: ["nature", "market"],
    name: { en: "Koh Dach (Silk Island)" },
    coords: [104.9558, 11.6386],
    blurb: { en: "A Mekong island of weaving households, twenty minutes and one ferry from the city." },
    description: {
      en: "A long sandy island in the Mekong where households still weave silk on wooden looms under their stilt houses. You can watch the whole chain — silkworms, reeling, dyeing, weaving — and buy directly from the family that made the piece.\n\nFlat, quiet and cyclable. The ferry from Prek Leap takes a few minutes and costs almost nothing.",
    },
    community: {
      name: "Koh Dach weaving households",
      impact: {
        en: "Buying at the loom keeps the full price with the weaving household instead of a market middleman, and sustains a craft that mass-produced imports have been steadily displacing.",
      },
    },
    hours: {
      kind: "unknown",
      why: "Village workshops keep their own hours; the ferry runs daylight only.",
    },
    links: { maps: "https://www.openstreetmap.org/#map=13/11.6167/104.9667" },
    priceLevel: 1,
    lastVerified: "2026-08-29",
    practical: { typicalDurationMins: 90 },
    sources: [
      "https://en.wikipedia.org/wiki/Koh_Dach",
      "https://www.openstreetmap.org/#map=14/11.6386/104.9558",
    ],
  },
  {
    id: "oudong",
    slug: "oudong",
    neighbourhood: "out-of-town",
    categories: ["temple"],
    name: { en: "Oudong" },
    coords: [104.7433, 11.8025],
    blurb: { en: "Royal capital for 250 years. A ridge of royal stupas above the plain." },
    description: {
      en: "Cambodia's capital from 1618 until 1866, abandoned when the court moved to Phnom Penh. A staircase climbs a low ridge past the tombs of kings — bombed by the US, dynamited by the Khmer Rouge, and rebuilt since.\n\nAn hour north of the city. Cambodian pilgrims at weekends, near-empty on weekdays, and a long view over rice fields from the top.",
    },
    hours: {
      kind: "weekly",
      rules: [
        { days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], open: "06:00", close: "18:00" },
      ],
    },
    priceLevel: 1,
    lastVerified: "2026-08-29",
    practical: { typicalDurationMins: 90 },
    sources: [
      "https://en.wikipedia.org/wiki/Oudong",
      "https://www.openstreetmap.org/#map=14/11.8025/104.7433",
    ],
  },
  {
    id: "tonle-bati",
    slug: "tonle-bati",
    neighbourhood: "out-of-town",
    categories: ["temple", "nature"],
    name: { en: "Tonlé Bati (Ta Prohm)" },
    coords: [104.8339, 11.2683],
    blurb: { en: "There is a second Ta Prohm. It is 30km from Phnom Penh and nobody is in it." },
    description: {
      en: "A late 12th-century laterite temple built by Jayavarman VII — the same king, the same period, and confusingly the same name as the famous one at Angkor. Intact lintels, a well-preserved central sanctuary, and a smaller temple, Yeay Peau, beside it.\n\nA lakeside picnic spot for Phnom Penh families at weekends. On a weekday you may be the only person there.",
    },
    hours: {
      kind: "weekly",
      rules: [
        { days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], open: "07:00", close: "17:00" },
      ],
    },
    priceLevel: 1,
    lastVerified: "2026-08-29",
    practical: { typicalDurationMins: 90 },
    sources: [
      "https://en.wikipedia.org/wiki/Tonle_Bati",
      "https://www.openstreetmap.org/#map=15/11.2683/104.8339",
    ],
  },
  {
    id: "phnom-chisor",
    slug: "phnom-chisor",
    neighbourhood: "out-of-town",
    categories: ["temple", "nature"],
    name: { en: "Phnom Chisor" },
    coords: [104.8494, 11.1444],
    blurb: { en: "An 11th-century hilltop temple, 400 steps up, with the plain laid out below." },
    description: {
      en: "Built under Suryavarman I in the early 11th century, on a hill rising straight out of flat Takeo rice country. The climb is a long unshaded staircase; the reward is a laterite and brick sanctuary and a view down the ancient processional causeway.\n\nAn hour and a half south of Phnom Penh, usually with a handful of visitors at most.",
    },
    hours: {
      kind: "weekly",
      rules: [
        { days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], open: "07:00", close: "17:00" },
      ],
    },
    priceLevel: 1,
    lastVerified: "2026-08-29",
    practical: { typicalDurationMins: 90 },
    sources: [
      "https://en.wikipedia.org/wiki/Phnom_Chisor",
      "https://www.openstreetmap.org/#map=15/11.1444/104.8494",
    ],
  },
];
