import type { Spot } from "@/lib/spots/schema";

/**
 * Hand-curated seed content. ~40 places across four base cities.
 *
 * Two rules this file follows, because they are the product:
 *
 * 1. Anchors earn their place. Angkor Wat and the Royal Palace sort near the
 *    bottom, but they have to exist so the hidden spots have something to pair
 *    against. A pairing with nothing on the other end is just a listing.
 * 2. `sources` is never empty. Each entry carries an OpenStreetMap link at its
 *    own coordinates (verifiable, and the same source the brief plans to bulk
 *    seed from later) plus a reference where a good one exists. Editorial
 *    claims — fees, timings, community impact — still need first-party
 *    verification on the ground before this content is marketed as accurate.
 *
 * `city` is the base city you would travel from, not strictly the province.
 * Banteay Chhmar is in Banteay Meanchey; you get there from Siem Reap.
 */
export const spots: Spot[] = [
  // ─── Siem Reap ────────────────────────────────────────────────────────────
  {
    id: "angkor-wat",
    slug: "angkor-wat",
    city: "siem-reap",
    categories: ["temple", "culture"],
    name: { en: "Angkor Wat" },
    coords: [103.8670, 13.4125],
    blurb: {
      en: "The largest religious monument on earth, and the reason most people book the flight.",
    },
    description: {
      en: "A 12th-century Hindu-then-Buddhist temple city built for Suryavarman II, and the single most visited site in Cambodia. It is genuinely extraordinary and it is genuinely crowded: sunrise at the reflecting pool means several thousand people standing in the same forty metres.\n\nGo, but go knowing the rest of this site exists to tell you where to go afterwards. The Angkor pass covers dozens of temples that almost nobody walks to.",
    },
    offRadar: 0,
    practical: {
      bestTime: { en: "Sunrise, or 2pm when the tour buses have gone" },
      entryFeeUsd: 37,
      typicalDurationMins: 180,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Angkor_Wat",
      "https://www.openstreetmap.org/#map=16/13.4125/103.8670",
    ],
  },
  {
    id: "bayon",
    slug: "bayon",
    city: "siem-reap",
    categories: ["temple", "culture"],
    name: { en: "Bayon" },
    coords: [103.8586, 13.4413],
    blurb: { en: "Two hundred stone faces at the centre of Angkor Thom." },
    description: {
      en: "Jayavarman VII's state temple, at the exact centre of the walled city of Angkor Thom. The serene faces on its towers are the image most people carry away from Cambodia.\n\nIt is compact, which is why it feels busier than Angkor Wat even with fewer visitors in it.",
    },
    offRadar: 10,
    practical: {
      bestTime: { en: "Early morning, before the Angkor Wat crowd moves north" },
      entryFeeUsd: 37,
      typicalDurationMins: 90,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Bayon",
      "https://www.openstreetmap.org/#map=16/13.4413/103.8586",
    ],
  },
  {
    id: "ta-prohm",
    slug: "ta-prohm",
    city: "siem-reap",
    categories: ["temple", "nature"],
    name: { en: "Ta Prohm" },
    coords: [103.8891, 13.4348],
    blurb: { en: "The one with the trees growing through it. Queue for the photo." },
    description: {
      en: "Left deliberately unrestored so the silk-cotton and strangler fig roots still hold the masonry together. It is the most photographed ruin in the country after Angkor Wat.\n\nThe famous root doorways now have marked queues and a boardwalk. The atmosphere the photographs promise is real — it just isn't available at 9am.",
    },
    offRadar: 8,
    practical: {
      bestTime: { en: "First entry at 7:30am, or late afternoon" },
      entryFeeUsd: 37,
      typicalDurationMins: 75,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Ta_Prohm",
      "https://www.openstreetmap.org/#map=16/13.4348/103.8891",
    ],
  },
  {
    id: "chong-kneas",
    slug: "chong-kneas",
    city: "siem-reap",
    categories: ["nature", "culture"],
    name: { en: "Chong Kneas floating village" },
    coords: [103.8378, 13.2333],
    blurb: { en: "The closest Tonlé Sap floating village to town, and it shows." },
    description: {
      en: "Twenty minutes from Siem Reap, which made it the default Tonlé Sap boat trip and then made it a hard-sell operation: inflated boat prices, a scripted orphanage stop, a crocodile farm gift shop.\n\nThe lake itself is remarkable and worth seeing. This is simply the wrong door into it.",
    },
    offRadar: 15,
    practical: {
      bestTime: { en: "Late afternoon; water is highest Sep–Nov" },
      entryFeeUsd: 20,
      typicalDurationMins: 150,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Tonl%C3%A9_Sap",
      "https://www.openstreetmap.org/#map=14/13.2333/103.8378",
    ],
  },
  {
    id: "phare-circus",
    slug: "phare-the-cambodian-circus",
    city: "siem-reap",
    categories: ["culture"],
    name: { en: "Phare, The Cambodian Circus" },
    coords: [103.8397, 13.3475],
    blurb: { en: "Nightly circus theatre in Siem Reap. Ticket money funds the school in Battambang." },
    description: {
      en: "A nightly big-top show of acrobatics, live music and physical theatre, performed by graduates of Phare Ponleu Selpak. Consistently the best-reviewed evening in Siem Reap.\n\nIt is a social enterprise rather than a resort attraction: profits go back to the arts school that trained the performers.",
    },
    offRadar: 22,
    community: {
      name: "Phare Performing Social Enterprise",
      impact: {
        en: "Ticket revenue funds Phare Ponleu Selpak's free arts, music and general education programmes in Battambang, and pays the performers professional wages.",
      },
      url: "https://pharecircus.org/",
    },
    practical: {
      bestTime: { en: "Nightly, 8pm" },
      entryFeeUsd: 18,
      typicalDurationMins: 75,
    },
    sources: [
      "https://pharecircus.org/",
      "https://www.openstreetmap.org/#map=16/13.3475/103.8397",
    ],
  },
  {
    id: "banteay-srei",
    slug: "banteay-srei",
    city: "siem-reap",
    categories: ["temple", "culture"],
    name: { en: "Banteay Srei" },
    coords: [103.9633, 13.5987],
    blurb: { en: "Pink sandstone carved like woodwork, 25km north of the main circuit." },
    description: {
      en: "A small 10th-century temple to Shiva, built from rose-coloured sandstone that holds detail no other Angkorian stone does. The carving here is the finest in Cambodia and it is not close.\n\nFar enough out that the crowd thins, close enough that it has a car park. Pair it with Kbal Spean an hour further up the same road.",
    },
    offRadar: 30,
    practical: {
      bestTime: { en: "7:30–9am, when low sun rakes across the carvings" },
      entryFeeUsd: 37,
      typicalDurationMins: 75,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Banteay_Srei",
      "https://www.openstreetmap.org/#map=15/13.5987/103.9633",
    ],
  },
  {
    id: "preah-khan-angkor",
    slug: "preah-khan",
    city: "siem-reap",
    categories: ["temple", "nature"],
    name: { en: "Preah Khan" },
    coords: [103.8725, 13.4617],
    blurb: { en: "Ta Prohm's scale and its trees, twenty minutes' walk from Ta Prohm's queue." },
    description: {
      en: "A sprawling 12th-century monastery-university that once housed nearly a thousand teachers. Long collapsed corridors, a strange two-storey Greek-looking pavilion, and the same fig roots prising apart the same sandstone.\n\nIt is on the grand circuit and it is still, most mornings, close to empty.",
    },
    offRadar: 45,
    pairedWith: {
      spotId: "ta-prohm",
      hook: {
        en: "Tired of queueing for the tree photo? Preah Khan is four times the size, has the same roots through the same stone, and you can walk its central axis alone.",
      },
    },
    practical: {
      bestTime: { en: "Early morning; enter from the north gate and walk through" },
      entryFeeUsd: 37,
      typicalDurationMins: 90,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Preah_Khan",
      "https://www.openstreetmap.org/#map=16/13.4617/103.8725",
    ],
  },
  {
    id: "phnom-kulen",
    slug: "phnom-kulen",
    city: "siem-reap",
    categories: ["nature", "temple"],
    name: { en: "Phnom Kulen" },
    coords: [104.0333, 13.5769],
    blurb: { en: "The mountain where the Khmer Empire was declared. Waterfall, reclining Buddha, forest." },
    description: {
      en: "Jayavarman II proclaimed himself universal monarch here in 802 CE, which is where the Angkorian period starts. Today it is a national park with a two-tier waterfall, a large reclining Buddha carved into the summit rock, and riverbed carvings underwater.\n\nBusy with Cambodian families at weekends, quiet midweek. Separate ticket, not covered by the Angkor pass.",
    },
    offRadar: 55,
    practical: {
      bestTime: { en: "Weekday mornings; waterfall strongest Aug–Nov" },
      entryFeeUsd: 20,
      typicalDurationMins: 300,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Phnom_Kulen",
      "https://www.openstreetmap.org/#map=13/13.5769/104.0333",
    ],
  },
  {
    id: "kbal-spean",
    slug: "kbal-spean",
    city: "siem-reap",
    categories: ["nature", "temple"],
    name: { en: "Kbal Spean" },
    coords: [104.0272, 13.5772],
    blurb: { en: "A thousand lingas carved into a riverbed, up a 1.5km jungle trail." },
    description: {
      en: "An 11th-century riverbed of carved lingas and reliefs of Vishnu and Shiva, meant to sanctify the water flowing down to Angkor. You reach it by a rocky forty-minute climb through forest, which filters out most of the tour circuit.\n\nBest when there is enough water to run over the carvings but not enough to hide them.",
    },
    offRadar: 58,
    pairedWith: {
      spotId: "banteay-srei",
      hook: {
        en: "Already driven the hour north to Banteay Srei? Keep going twenty minutes. The carvings here are underwater and there is no car park at the top.",
      },
    },
    practical: {
      bestTime: { en: "Morning, Nov–Jan; the trail closes at 3pm" },
      entryFeeUsd: 37,
      typicalDurationMins: 150,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Kbal_Spean",
      "https://www.openstreetmap.org/#map=15/13.5772/104.0272",
    ],
  },
  {
    id: "kampong-phluk",
    slug: "kampong-phluk",
    city: "siem-reap",
    categories: ["nature", "culture"],
    name: { en: "Kampong Phluk" },
    coords: [103.9622, 13.1747],
    blurb: { en: "Stilt houses ten metres up, a flooded forest you paddle through, community-run boats." },
    description: {
      en: "A village of houses on ten-metre stilts, because that is how far the Tonlé Sap rises between dry and wet season. In high water you transfer to a small paddled boat and go through the flooded mangrove forest, which is silent in a way the motorboats are not.\n\nCommunity-managed boat rotation rather than a ticket-tout scrum. Further from town than Chong Kneas, and better in every respect.",
    },
    offRadar: 60,
    pairedWith: {
      spotId: "chong-kneas",
      hook: {
        en: "Skip Chong Kneas. Forty minutes further out, the boats are community-run, the stilt houses are real, and nobody will steer you into a gift shop.",
      },
    },
    community: {
      name: "Kampong Phluk community boat association",
      impact: {
        en: "Boats run on a village rotation so income is shared between families rather than captured by an operator, and the paddle boats through the flooded forest are run by women from the village.",
      },
    },
    practical: {
      bestTime: { en: "Sep–Dec for high water and the flooded forest" },
      entryFeeUsd: 25,
      typicalDurationMins: 240,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Tonl%C3%A9_Sap",
      "https://www.openstreetmap.org/#map=14/13.1747/103.9622",
    ],
  },
  {
    id: "beng-mealea",
    slug: "beng-mealea",
    city: "siem-reap",
    categories: ["temple", "nature"],
    name: { en: "Beng Mealea" },
    coords: [104.2286, 13.4747],
    blurb: { en: "An Angkor-sized temple left as a collapsed field of stone in the forest." },
    description: {
      en: "Roughly the footprint of Angkor Wat, built in the same period, and almost entirely unrestored — galleries down, blocks in heaps, trees straight through the middle. A raised boardwalk runs across it; scrambling off it is how most people actually see the place.\n\nAn hour and a half east of Siem Reap on a good road. Demined in the 2000s; stay on cleared paths.",
    },
    offRadar: 62,
    pairedWith: {
      spotId: "ta-prohm",
      hook: {
        en: "Ta Prohm with the crowd deleted and the scale multiplied. Nothing has been tidied here — you climb over the temple rather than filing past it.",
      },
    },
    practical: {
      bestTime: { en: "Mid-morning; overcast days are better for photos" },
      entryFeeUsd: 5,
      typicalDurationMins: 120,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Beng_Mealea",
      "https://www.openstreetmap.org/#map=15/13.4747/104.2286",
    ],
  },
  {
    id: "koh-ker",
    slug: "koh-ker",
    city: "siem-reap",
    categories: ["temple", "nature"],
    name: { en: "Koh Ker" },
    coords: [104.5406, 13.7841],
    blurb: { en: "The capital that replaced Angkor for twenty years. A seven-tier pyramid in the forest." },
    description: {
      en: "For two decades in the 10th century the empire's capital was here, not at Angkor, and Jayavarman IV built Prasat Thom — a 36-metre stepped pyramid that looks nothing like anything else in Khmer architecture. You can climb it.\n\nTwo and a half hours from Siem Reap over ground that was mined until recently. Dozens of satellite temples, and often nobody else at any of them.",
    },
    offRadar: 78,
    pairedWith: {
      spotId: "angkor-wat",
      hook: {
        en: "You came for the imperial capital. This was also the imperial capital — and you will likely climb its pyramid alone.",
      },
    },
    practical: {
      bestTime: { en: "Full day; leave Siem Reap by 7am" },
      entryFeeUsd: 15,
      typicalDurationMins: 240,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Koh_Ker",
      "https://www.openstreetmap.org/#map=13/13.7841/104.5406",
    ],
  },
  {
    id: "accb",
    slug: "accb-wildlife-centre",
    city: "siem-reap",
    categories: ["nature"],
    name: { en: "Angkor Centre for Conservation of Biodiversity" },
    coords: [104.0092, 13.5794],
    blurb: { en: "A rescue and breeding centre for Cambodia's most trafficked wildlife. Two tours a day." },
    description: {
      en: "A working conservation station near Kbal Spean that rescues confiscated wildlife — pangolins, slow lorises, otters, critically endangered turtles and storks — rehabilitates what can go back, and breeds what can't.\n\nIt is not a zoo and does not behave like one: two guided tours daily, small groups, no handling. Visitor numbers are deliberately capped.",
    },
    offRadar: 85,
    community: {
      name: "Angkor Centre for Conservation of Biodiversity",
      impact: {
        en: "Tour fees fund rescue, veterinary care and release programmes for species confiscated from the illegal wildlife trade, and the centre employs and trains Cambodian conservation staff.",
      },
      url: "https://www.accb-cambodia.org/",
    },
    practical: {
      bestTime: { en: "Book ahead; tours at 9am and 1pm" },
      entryFeeUsd: 12,
      typicalDurationMins: 90,
    },
    sources: [
      "https://www.accb-cambodia.org/",
      "https://www.openstreetmap.org/#map=15/13.5794/104.0092",
    ],
  },
  {
    id: "banteay-chhmar",
    slug: "banteay-chhmar",
    city: "siem-reap",
    categories: ["temple", "culture"],
    name: { en: "Banteay Chhmar" },
    coords: [103.0836, 14.0333],
    blurb: { en: "Face towers like Bayon's, a village homestay programme, and almost no visitors." },
    description: {
      en: "A vast Jayavarman VII temple near the Thai border, with the same enigmatic face towers as the Bayon and a gallery of multi-armed Avalokiteshvara reliefs found nowhere else. Much of it is collapsed and unrestored.\n\nThree hours from Siem Reap. The village runs a community homestay and guide programme, which is the reason to stay overnight rather than day-trip it.",
    },
    offRadar: 88,
    pairedWith: {
      spotId: "bayon",
      hook: {
        en: "You wanted the stone faces without three coach parties in the frame. These are those faces, and you will have the gallery to yourself.",
      },
    },
    community: {
      name: "Banteay Chhmar Community-Based Tourism",
      impact: {
        en: "Homestays, guides, ox-cart rides and meals are booked through a village-run cooperative; a share of every booking goes to a community fund for the temple and village projects.",
      },
    },
    practical: {
      bestTime: { en: "Overnight trip; Nov–Feb for cooler weather" },
      entryFeeUsd: 5,
      typicalDurationMins: 240,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Banteay_Chhmar",
      "https://www.openstreetmap.org/#map=14/14.0333/103.0836",
    ],
  },

  // ─── Phnom Penh ───────────────────────────────────────────────────────────
  {
    id: "royal-palace",
    slug: "royal-palace",
    city: "phnom-penh",
    categories: ["culture", "temple"],
    name: { en: "Royal Palace & Silver Pagoda" },
    coords: [104.9313, 11.5637],
    blurb: { en: "The working royal residence, and a pagoda floored with five tonnes of silver." },
    description: {
      en: "Built from 1866 when the capital moved back to Phnom Penh, and still the king's residence — which is why parts are closed and the dress code is enforced. The Silver Pagoda next door has 5,000 silver tiles underfoot and an emerald Buddha.\n\nThe city's number-one ticketed sight, and it feels like it by mid-morning.",
    },
    offRadar: 3,
    practical: {
      bestTime: { en: "8am opening; closed 11am–2pm" },
      entryFeeUsd: 10,
      typicalDurationMins: 90,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Royal_Palace,_Phnom_Penh",
      "https://www.openstreetmap.org/#map=17/11.5637/104.9313",
    ],
  },
  {
    id: "tuol-sleng",
    slug: "tuol-sleng",
    city: "phnom-penh",
    categories: ["culture"],
    name: { en: "Tuol Sleng Genocide Museum (S-21)" },
    coords: [104.9177, 11.5495],
    blurb: { en: "The school the Khmer Rouge turned into a prison. Take the audio guide." },
    description: {
      en: "A secondary school converted into Security Prison 21, where at least 12,000 people were interrogated and sent to Choeung Ek. The classrooms, the photographs of the detained, and the survivors' accounts are left largely as found.\n\nThe audio guide, narrated by a survivor, is what makes the visit comprehensible rather than merely harrowing. Allow time afterwards to sit down.",
    },
    offRadar: 5,
    practical: {
      bestTime: { en: "Open 8am–5pm; go early, and go before Choeung Ek" },
      entryFeeUsd: 10,
      typicalDurationMins: 120,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Tuol_Sleng_Genocide_Museum",
      "https://www.openstreetmap.org/#map=17/11.5495/104.9177",
    ],
  },
  {
    id: "choeung-ek",
    slug: "choeung-ek",
    city: "phnom-penh",
    categories: ["culture"],
    name: { en: "Choeung Ek Killing Fields" },
    coords: [104.9019, 11.4844],
    blurb: { en: "The memorial stupa and the mass graves, 15km south of the city." },
    description: {
      en: "The best known of several hundred killing fields, where those held at S-21 were executed. A memorial stupa holds thousands of skulls; the walking route passes excavated grave pits and the killing tree.\n\nThe audio guide is again essential. Fragments of cloth and bone still surface in the paths after heavy rain.",
    },
    offRadar: 6,
    practical: {
      bestTime: { en: "Afternoon, after Tuol Sleng; open 8am–5:30pm" },
      entryFeeUsd: 6,
      typicalDurationMins: 120,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Choeung_Ek",
      "https://www.openstreetmap.org/#map=15/11.4844/104.9019",
    ],
  },
  {
    id: "central-market",
    slug: "central-market",
    city: "phnom-penh",
    categories: ["culture", "food"],
    name: { en: "Central Market (Phsar Thmei)" },
    coords: [104.9169, 11.5697],
    blurb: { en: "A 1937 art deco dome over watches, scarves and souvenirs." },
    description: {
      en: "The building is the reason to come: a vast ochre art deco cross-shaped hall from 1937, one of the largest domed markets in Asia, restored in 2011.\n\nThe goods under it are mostly tourist-grade — imported silk sold as Cambodian, phone cases, jewellery. Beautiful architecture, unremarkable shopping.",
    },
    offRadar: 8,
    practical: {
      bestTime: { en: "7–9am for the food aisles, before the heat" },
      entryFeeUsd: 0,
      typicalDurationMins: 60,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Phnom_Penh",
      "https://www.openstreetmap.org/#map=17/11.5697/104.9169",
    ],
  },
  {
    id: "russian-market",
    slug: "russian-market",
    city: "phnom-penh",
    categories: ["food", "culture"],
    name: { en: "Russian Market (Toul Tom Poung)" },
    coords: [104.9178, 11.5419],
    blurb: { en: "Low tin roof, no air, and the best market food hall in the city." },
    description: {
      en: "Named for the Soviet expatriates who shopped here in the 1980s. Densely packed aisles of garment-factory overruns, motorbike parts, records and housewares, wrapped around a food court that locals actually eat in.\n\nHot, dark and genuinely functional — this is where the city shops, not where it sells to visitors.",
    },
    offRadar: 20,
    pairedWith: {
      spotId: "central-market",
      hook: {
        en: "Admire Central Market's dome, then buy things here instead. Same city, half the price, and the food aisles are a destination in themselves.",
      },
    },
    practical: {
      bestTime: { en: "7–10am; unbearable by 1pm" },
      entryFeeUsd: 0,
      typicalDurationMins: 90,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Phnom_Penh",
      "https://www.openstreetmap.org/#map=17/11.5419/104.9178",
    ],
  },
  {
    id: "wat-phnom",
    slug: "wat-phnom",
    city: "phnom-penh",
    categories: ["temple"],
    name: { en: "Wat Phnom" },
    coords: [104.9297, 11.5766],
    blurb: { en: "The hill the city is named after, and a working temple on top of it." },
    description: {
      en: "Legend has Lady Penh finding four Buddha statues in a floating koki tree in 1372 and raising this hill to house them — hence Phnom Penh, 'Penh's hill'. The current stupa dates from 1926.\n\nA busy local shrine rather than a monument: people come to make offerings before exams and business deals. Twenty-seven metres of elevation, which in this city counts as a view.",
    },
    offRadar: 28,
    practical: {
      bestTime: { en: "Late afternoon, when the offerings pick up" },
      entryFeeUsd: 1,
      typicalDurationMins: 45,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Wat_Phnom",
      "https://www.openstreetmap.org/#map=17/11.5766/104.9297",
    ],
  },
  {
    id: "wat-langka",
    slug: "wat-langka",
    city: "phnom-penh",
    categories: ["temple", "culture"],
    name: { en: "Wat Langka" },
    coords: [104.9219, 11.5502],
    blurb: { en: "One of the city's oldest pagodas, with public meditation sessions in English." },
    description: {
      en: "Founded in 1442 as a library for sacred texts and a meeting point for Khmer and Sri Lankan monks — hence the name. Rebuilt after the Khmer Rouge used it as a storehouse.\n\nIt runs open vipassana sessions several evenings a week, led by monks, free and open to anyone. Very few visitors know this is on offer.",
    },
    offRadar: 42,
    pairedWith: {
      spotId: "royal-palace",
      hook: {
        en: "Photographed enough gilded roofline at the Palace? Ten minutes away is a 15th-century working pagoda where you can sit down and actually be taught something.",
      },
    },
    practical: {
      bestTime: { en: "Evening meditation sessions; check times at the gate" },
      entryFeeUsd: 0,
      typicalDurationMins: 90,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Wat_Langka",
      "https://www.openstreetmap.org/#map=17/11.5502/104.9219",
    ],
  },
  {
    id: "koh-dach",
    slug: "koh-dach",
    city: "phnom-penh",
    categories: ["culture", "nature"],
    name: { en: "Koh Dach (Silk Island)" },
    coords: [104.9558, 11.6386],
    blurb: { en: "A Mekong island of weaving households, twenty minutes and one ferry from the city." },
    description: {
      en: "A long sandy island in the Mekong where households still weave silk on wooden looms under their stilt houses. You can watch the whole chain — silkworms, reeling, dyeing, weaving — and buy directly from the family that made the piece.\n\nFlat, quiet and cyclable. The ferry from Prek Leap takes a few minutes and costs almost nothing.",
    },
    offRadar: 55,
    pairedWith: {
      spotId: "central-market",
      hook: {
        en: "The scarves at Central Market are mostly imported. Cross the river and buy from the loom, from the person working it.",
      },
    },
    community: {
      name: "Koh Dach weaving households",
      impact: {
        en: "Buying at the loom keeps the full price with the weaving household instead of a market middleman, and sustains a craft that mass-produced imports have been steadily displacing.",
      },
    },
    practical: {
      bestTime: { en: "Morning, by bicycle; ferry from Prek Leap" },
      entryFeeUsd: 0,
      typicalDurationMins: 240,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Koh_Dach",
      "https://www.openstreetmap.org/#map=14/11.6386/104.9558",
    ],
  },
  {
    id: "oudong",
    slug: "oudong",
    city: "phnom-penh",
    categories: ["temple", "culture"],
    name: { en: "Oudong" },
    coords: [104.7433, 11.8025],
    blurb: { en: "Royal capital for 250 years. A ridge of royal stupas above the plain." },
    description: {
      en: "Cambodia's capital from 1618 until 1866, abandoned when the court moved to Phnom Penh. A staircase climbs a low ridge past the tombs of kings — bombed by the US, dynamited by the Khmer Rouge, and rebuilt since.\n\nAn hour north of the city. Cambodian pilgrims at weekends, near-empty on weekdays, and a long view over rice fields from the top.",
    },
    offRadar: 65,
    practical: {
      bestTime: { en: "Weekday, early — the staircase is unshaded" },
      entryFeeUsd: 0,
      typicalDurationMins: 180,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Oudong",
      "https://www.openstreetmap.org/#map=14/11.8025/104.7433",
    ],
  },
  {
    id: "tonle-bati",
    slug: "tonle-bati",
    city: "phnom-penh",
    categories: ["temple", "nature"],
    name: { en: "Tonlé Bati (Ta Prohm)" },
    coords: [104.8339, 11.2683],
    blurb: { en: "There is a second Ta Prohm. It is 30km from Phnom Penh and nobody is in it." },
    description: {
      en: "A late 12th-century laterite temple built by Jayavarman VII — the same king, the same period, and confusingly the same name as the famous one at Angkor. Intact lintels, a well-preserved central sanctuary, and a smaller temple, Yeay Peau, beside it.\n\nA lakeside picnic spot for Phnom Penh families at weekends. On a weekday you may be the only person there.",
    },
    offRadar: 70,
    pairedWith: {
      spotId: "ta-prohm",
      hook: {
        en: "Not going to Siem Reap? The other Ta Prohm is 45 minutes from Phnom Penh, built by the same king, and you will not queue for anything.",
      },
    },
    practical: {
      bestTime: { en: "Weekday morning; combine with Phnom Chisor" },
      entryFeeUsd: 3,
      typicalDurationMins: 90,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Tonle_Bati",
      "https://www.openstreetmap.org/#map=15/11.2683/104.8339",
    ],
  },
  {
    id: "phnom-chisor",
    slug: "phnom-chisor",
    city: "phnom-penh",
    categories: ["temple", "nature"],
    name: { en: "Phnom Chisor" },
    coords: [104.8494, 11.1444],
    blurb: { en: "An 11th-century hilltop temple, 400 steps up, with the plain laid out below." },
    description: {
      en: "Built under Suryavarman I in the early 11th century, on a hill rising straight out of flat Takeo rice country. The climb is a long unshaded staircase; the reward is a laterite and brick sanctuary and a view down the ancient processional causeway.\n\nAn hour and a half south of Phnom Penh, usually with a handful of visitors at most.",
    },
    offRadar: 72,
    pairedWith: {
      spotId: "angkor-wat",
      hook: {
        en: "Angkor-era temple architecture without the Angkor pass, the coaches, or the flight north.",
      },
    },
    practical: {
      bestTime: { en: "Before 9am — 400 steps with no shade" },
      entryFeeUsd: 2,
      typicalDurationMins: 120,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Phnom_Chisor",
      "https://www.openstreetmap.org/#map=15/11.1444/104.8494",
    ],
  },

  // ─── Kampot & Kep ─────────────────────────────────────────────────────────
  {
    id: "kep-crab-market",
    slug: "kep-crab-market",
    city: "kampot-kep",
    categories: ["food"],
    name: { en: "Kep Crab Market" },
    coords: [104.3033, 10.4869],
    blurb: { en: "Crab pulled from baskets in the sea, cooked with Kampot green pepper." },
    description: {
      en: "A row of waterfront shacks where women wade out to keeper baskets submerged offshore and bring the crab in live. Fried with fresh green Kampot peppercorns still on the stalk, it is the dish the region is known for.\n\nFirmly on the tourist map now, and priced accordingly, but the crab is still excellent and still local.",
    },
    offRadar: 12,
    practical: {
      bestTime: { en: "Late morning, when the baskets come in" },
      entryFeeUsd: 0,
      typicalDurationMins: 90,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Kep,_Cambodia",
      "https://www.openstreetmap.org/#map=17/10.4869/104.3033",
    ],
  },
  {
    id: "la-plantation",
    slug: "kampot-pepper-farms",
    city: "kampot-kep",
    categories: ["food", "culture"],
    name: { en: "Kampot pepper farms" },
    coords: [104.2492, 10.7292],
    blurb: { en: "The protected-origin peppercorn, tasted at the vine." },
    description: {
      en: "Kampot pepper holds a geographical indication, and the farms east of town run free tours through the trellises with tastings of green, black, red and white from the same vine.\n\nGenuinely interesting agriculture, and the standard half-day out of Kampot. Which is also why the larger farms now feel like a visitor centre.",
    },
    offRadar: 25,
    practical: {
      bestTime: { en: "Harvest runs roughly Feb–May" },
      entryFeeUsd: 0,
      typicalDurationMins: 120,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Kampot_pepper",
      "https://www.openstreetmap.org/#map=14/10.7292/104.2492",
    ],
  },
  {
    id: "bokor",
    slug: "bokor-hill-station",
    city: "kampot-kep",
    categories: ["nature", "culture"],
    name: { en: "Bokor Hill Station" },
    coords: [104.0333, 10.6333],
    blurb: { en: "An abandoned French hill station in the cloud, now with a casino next to it." },
    description: {
      en: "A 1920s French resort built at 1,000m by conscripted labour, abandoned twice, and famous for the derelict Bokor Palace Hotel sitting in near-permanent mist. The road up is excellent and the temperature drops ten degrees.\n\nThe atmosphere is thinner than it was: the plateau is now a development concession with a casino, a giant Buddha and new resorts. The national park around it is still worth the drive.",
    },
    offRadar: 30,
    practical: {
      bestTime: { en: "Morning, before cloud closes in; dry season" },
      entryFeeUsd: 0,
      typicalDurationMins: 300,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Bokor_Hill_Station",
      "https://www.openstreetmap.org/#map=13/10.6333/104.0333",
    ],
  },
  {
    id: "koh-tonsay",
    slug: "koh-tonsay",
    city: "kampot-kep",
    categories: ["nature"],
    name: { en: "Koh Tonsay (Rabbit Island)" },
    coords: [104.3269, 10.4197],
    blurb: { en: "Twenty minutes offshore from Kep. Bungalows, no roads, limited electricity." },
    description: {
      en: "A small island with one beach worth swimming from, a handful of family-run bungalow huts, hammocks, and power that runs on a generator for part of the evening.\n\nIt is not undiscovered — but it empties out completely after the last afternoon boat, and the people who stay overnight get a different island from the day-trippers.",
    },
    offRadar: 55,
    pairedWith: {
      spotId: "kep-crab-market",
      hook: {
        en: "Eat the crab, then take the 20-minute boat instead of driving back. After the last boat leaves, the island is yours.",
      },
    },
    practical: {
      bestTime: { en: "Stay overnight; boats from Kep pier, dry season" },
      entryFeeUsd: 10,
      typicalDurationMins: 480,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Koh_Tonsay",
      "https://www.openstreetmap.org/#map=14/10.4197/104.3269",
    ],
  },
  {
    id: "kep-national-park",
    slug: "kep-national-park",
    city: "kampot-kep",
    categories: ["nature"],
    name: { en: "Kep National Park" },
    coords: [104.3011, 10.4933],
    blurb: { en: "An 8km trail loop around the hill above town, waymarked and nearly empty." },
    description: {
      en: "A single track contours around the hill behind Kep with views over the crab market, the islands and Vietnam's Phu Quoc on a clear day. Waymarked in yellow by a local expat, walkable in two to three hours, and shaded most of the way.\n\nOn a hill with a national park's worth of trail, you will usually meet nobody.",
    },
    offRadar: 60,
    pairedWith: {
      spotId: "bokor",
      hook: {
        en: "Don't fancy four hours in a van up Bokor to look at a casino? Walk out of Kep instead and be on a forest ridge in fifteen minutes.",
      },
    },
    practical: {
      bestTime: { en: "Start by 7am; carry water, there is none on the loop" },
      entryFeeUsd: 1,
      typicalDurationMins: 180,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Kep_National_Park",
      "https://www.openstreetmap.org/#map=15/10.4933/104.3011",
    ],
  },
  {
    id: "phnom-chhngok",
    slug: "phnom-chhngok-cave-temple",
    city: "kampot-kep",
    categories: ["temple", "nature"],
    name: { en: "Phnom Chhngok cave temple" },
    coords: [104.2358, 10.6825],
    blurb: { en: "A 7th-century brick shrine standing inside a limestone cave." },
    description: {
      en: "A pre-Angkorian Funan-era brick sanctuary built inside a karst cave, with a stalactite growing down into it that the shrine was placed to honour. Local children guide visitors through the chambers with torches.\n\nHalf an hour from Kampot through rice fields. Small, strange and almost always quiet.",
    },
    offRadar: 68,
    practical: {
      bestTime: { en: "Any time; tip your guide" },
      entryFeeUsd: 2,
      typicalDurationMins: 60,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Kampot_province",
      "https://www.openstreetmap.org/#map=15/10.6825/104.2358",
    ],
  },
  {
    id: "secret-lake",
    slug: "secret-lake",
    city: "kampot-kep",
    categories: ["nature", "culture"],
    name: { en: "Secret Lake (Damnak Chang'aeur)" },
    coords: [104.3350, 10.6539],
    blurb: { en: "A reservoir dug by forced labour under the Khmer Rouge. Now a quiet backroad ride." },
    description: {
      en: "Not a beauty spot with a cute name — the lake was excavated by forced labour in the late 1970s and many of those who dug it died doing so. It is unmarked, unmemorialised, and locally well understood.\n\nThe backroad out from Kampot past pepper farms and the lake is one of the best rides in the country. Go knowing what you are looking at.",
    },
    offRadar: 70,
    practical: {
      bestTime: { en: "Late afternoon by motorbike, on the loop from Kampot" },
      entryFeeUsd: 0,
      typicalDurationMins: 60,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Kampot_province",
      "https://www.openstreetmap.org/#map=14/10.6539/104.3350",
    ],
  },
  {
    id: "kampong-trach",
    slug: "kampong-trach-caves",
    city: "kampot-kep",
    categories: ["nature", "temple"],
    name: { en: "Kampong Trach caves" },
    coords: [104.4642, 10.6008],
    blurb: { en: "A collapsed karst hill you walk into: caves opening onto a hidden inner garden." },
    description: {
      en: "A limestone outcrop whose centre caved in, leaving an enclosed jungle bowl reached through cave passages, with shrines tucked into the chambers along the way.\n\nAn hour east of Kampot, close to the Vietnamese border, and well off the standard loop. Local guides wait at the entrance.",
    },
    offRadar: 75,
    practical: {
      bestTime: { en: "Morning; bring a torch and shoes with grip" },
      entryFeeUsd: 2,
      typicalDurationMins: 90,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Kampong_Trach_District",
      "https://www.openstreetmap.org/#map=15/10.6008/104.4642",
    ],
  },
  {
    id: "trapeang-sangkae",
    slug: "trapeang-sangkae",
    city: "kampot-kep",
    categories: ["nature", "culture"],
    name: { en: "Trapeang Sangkae mangrove community" },
    coords: [104.1858, 10.5919],
    blurb: { en: "A fishing village replanting its own mangroves, with homestays and a paddle out." },
    description: {
      en: "A fishing community at the mouth of the Kampot river that responded to collapsing catches by replanting mangrove and enforcing its own no-take zone. Visitors kayak the channels, plant a seedling, eat with a family, and can stay overnight.\n\nThis is community-based tourism in its literal sense: the village runs it, sets the terms, and keeps the money.",
    },
    offRadar: 85,
    pairedWith: {
      spotId: "kep-crab-market",
      hook: {
        en: "You ate the seafood. This is the community rebuilding the mangrove nursery that seafood depends on — and they will take you out into it.",
      },
    },
    community: {
      name: "Trapeang Sangkae Community Fishery",
      impact: {
        en: "Visitor income funds mangrove reforestation and patrols of the community's protected fishing zone, and is paid directly to village households running the boats, meals and homestays.",
      },
    },
    practical: {
      bestTime: { en: "Book a day ahead; sunset paddle is the good one" },
      entryFeeUsd: 15,
      typicalDurationMins: 240,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Kampot",
      "https://www.openstreetmap.org/#map=14/10.5919/104.1858",
    ],
  },

  // ─── Battambang ───────────────────────────────────────────────────────────
  {
    id: "bamboo-train",
    slug: "bamboo-train",
    city: "battambang",
    categories: ["culture"],
    name: { en: "Bamboo Train (norry)" },
    coords: [103.2508, 13.0303],
    blurb: { en: "A bamboo platform on train wheels, doing 40km/h down a single track." },
    description: {
      en: "Improvised rail carts — a bamboo deck on two axles with a small engine — that carried goods on Cambodia's derelict railway. When two meet, the lighter one is lifted off the track by hand.\n\nThe original line at O Sra Lav was displaced by railway restoration and a purpose-built tourist track now runs nearby. Fun, short, and no longer the improvised thing it was.",
    },
    offRadar: 20,
    practical: {
      bestTime: { en: "Late afternoon; confirm which track is running" },
      entryFeeUsd: 5,
      typicalDurationMins: 60,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Bamboo_train",
      "https://www.openstreetmap.org/#map=14/13.0303/103.2508",
    ],
  },
  {
    id: "phnom-sampeau",
    slug: "phnom-sampeau",
    city: "battambang",
    categories: ["nature", "culture"],
    name: { en: "Phnom Sampeau" },
    coords: [103.0906, 13.0294],
    blurb: { en: "The killing caves, and at dusk millions of bats pouring out of the cliff." },
    description: {
      en: "A limestone hill holding a Khmer Rouge execution site — victims were thrown through a skylight into the cave below, now a memorial with a reclining Buddha and a glass case of remains.\n\nAt around 5:30pm a column of wrinkle-lipped bats streams out of a cliff fissure for close to an hour. The two things sit ten minutes apart and most visitors do both.",
    },
    offRadar: 25,
    practical: {
      bestTime: { en: "Arrive 4pm for the caves, stay for the 5:30pm bat exodus" },
      entryFeeUsd: 3,
      typicalDurationMins: 180,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Phnom_Sampeau",
      "https://www.openstreetmap.org/#map=15/13.0294/103.0906",
    ],
  },
  {
    id: "phare-ponleu-selpak",
    slug: "phare-ponleu-selpak",
    city: "battambang",
    categories: ["culture"],
    name: { en: "Phare Ponleu Selpak" },
    coords: [103.1697, 13.1131],
    blurb: { en: "The arts school itself — watch training, or catch a show on campus." },
    description: {
      en: "Founded in 1994 by young people returning from a refugee camp, where drawing had been used to help them process what they had lived through. It is now a school of circus, music, visual and applied arts alongside free general education and social support for local children.\n\nYou can walk the campus, watch classes train, and see shows performed here rather than in Siem Reap's big top.",
    },
    offRadar: 55,
    pairedWith: {
      spotId: "phare-circus",
      hook: {
        en: "Loved the circus in Siem Reap? This is where those performers were raised and taught — and where your ticket money went. You can visit the campus.",
      },
    },
    community: {
      name: "Phare Ponleu Selpak",
      impact: {
        en: "A Cambodian NGO providing free arts training, general education, and social and child-protection services to young people in Battambang; visitor and show income supports those programmes directly.",
      },
      url: "https://phareps.org/",
    },
    practical: {
      bestTime: { en: "Weekday afternoons for training; check the show schedule" },
      entryFeeUsd: 15,
      typicalDurationMins: 120,
    },
    sources: [
      "https://phareps.org/",
      "https://www.openstreetmap.org/#map=15/13.1131/103.1697",
    ],
  },
  {
    id: "ek-phnom",
    slug: "ek-phnom",
    city: "battambang",
    categories: ["temple"],
    name: { en: "Ek Phnom" },
    coords: [103.1919, 13.1631],
    blurb: { en: "An 11th-century sandstone temple, half collapsed, beside a modern pagoda." },
    description: {
      en: "A partially fallen Baphuon-period temple with a carved lintel of the Churning of the Ocean of Milk still in place, sitting next to a large modern pagoda and an enormous seated Buddha.\n\nThe ride out along the Sangker river through rice-paper and fish-paste villages is as much the point as the temple.",
    },
    offRadar: 58,
    practical: {
      bestTime: { en: "Morning, cycling or by moto along the river road" },
      entryFeeUsd: 2,
      typicalDurationMins: 90,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Ek_Phnom",
      "https://www.openstreetmap.org/#map=15/13.1631/103.1919",
    ],
  },
  {
    id: "wat-banan",
    slug: "wat-banan",
    city: "battambang",
    categories: ["temple", "nature"],
    name: { en: "Wat Banan" },
    coords: [103.1836, 12.9469],
    blurb: { en: "Five towers on a hilltop, 358 steps up. People call it the little Angkor Wat." },
    description: {
      en: "An 11th-century temple with five towers in Angkor Wat's quincunx arrangement, reached by a long steep staircase up a hill south of Battambang. Carved lintels survive on several doorways.\n\nThe comparison to Angkor Wat is a stretch on scale and exact on layout. What it does have is the view, the climb, and nobody else at the top.",
    },
    offRadar: 62,
    pairedWith: {
      spotId: "angkor-wat",
      hook: {
        en: "Five towers in the same arrangement, the same century, on a hill you climb alone. Locals call it the little Angkor Wat and they are not entirely joking.",
      },
    },
    practical: {
      bestTime: { en: "Early morning or late afternoon — 358 unshaded steps" },
      entryFeeUsd: 2,
      typicalDurationMins: 120,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Wat_Banan",
      "https://www.openstreetmap.org/#map=15/12.9469/103.1836",
    ],
  },
  {
    id: "battambang-museum",
    slug: "battambang-provincial-museum",
    city: "battambang",
    categories: ["culture"],
    name: { en: "Battambang Provincial Museum" },
    coords: [103.2019, 13.0975],
    blurb: { en: "One room of Angkorian statuary by the river, and usually you alone in it." },
    description: {
      en: "A small riverside museum holding pre-Angkorian and Angkorian sculpture gathered from temples across the province, including pieces from Banan and Ek Phnom. Labelling is sparse and the lighting is what it is.\n\nIt takes forty minutes and it makes the temples outside town legible. Almost nobody goes in.",
    },
    offRadar: 65,
    practical: {
      bestTime: { en: "Weekday mornings; closed for lunch" },
      entryFeeUsd: 1,
      typicalDurationMins: 45,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Battambang",
      "https://www.openstreetmap.org/#map=17/13.0975/103.2019",
    ],
  },
  {
    id: "wat-kor",
    slug: "wat-kor-village",
    city: "battambang",
    categories: ["culture"],
    name: { en: "Wat Kor heritage village" },
    coords: [103.2081, 13.0736],
    blurb: { en: "Hundred-year-old wooden merchant houses, two of which you can walk through." },
    description: {
      en: "A village just south of town of surviving early-1900s Khmer wooden houses, built by prosperous traders during the French period. Two are open as small house museums, still lived in by the families that own them, who show you round themselves.\n\nBattambang's colonial-era architecture is the best preserved in Cambodia, and this is the domestic half of it.",
    },
    offRadar: 72,
    community: {
      name: "Wat Kor house-museum families",
      impact: {
        en: "Entry fees go directly to the families maintaining the houses, which is the only thing currently funding the upkeep of privately owned heritage timber buildings here.",
      },
    },
    practical: {
      bestTime: { en: "Afternoon; cycle or walk from town" },
      entryFeeUsd: 2,
      typicalDurationMins: 90,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Battambang",
      "https://www.openstreetmap.org/#map=16/13.0736/103.2081",
    ],
  },
  {
    id: "kamping-puoy",
    slug: "kamping-puoy",
    city: "battambang",
    categories: ["nature", "culture"],
    name: { en: "Kamping Puoy reservoir" },
    coords: [103.0000, 13.0331],
    blurb: { en: "A Khmer Rouge irrigation dam between two hills, now where Battambang picnics." },
    description: {
      en: "An eight-kilometre dam built by forced labour in the late 1970s at enormous human cost, and never finished to the design it was meant to serve. It now irrigates the plain and doubles as the local swimming and picnic spot, with stilted platforms over the water.\n\nAt weekends it is full of Cambodian families; midweek it is quiet. Both facts are worth knowing before you go.",
    },
    offRadar: 78,
    pairedWith: {
      spotId: "phnom-sampeau",
      hook: {
        en: "The other Khmer Rouge site outside Battambang — no ticket booth, no tour circuit, and today the place the town comes to swim.",
      },
    },
    practical: {
      bestTime: { en: "Weekday afternoon; lotus flowers in the wet season" },
      entryFeeUsd: 0,
      typicalDurationMins: 120,
    },
    sources: [
      "https://en.wikipedia.org/wiki/Battambang_province",
      "https://www.openstreetmap.org/#map=14/13.0331/103.0000",
    ],
  },
];
