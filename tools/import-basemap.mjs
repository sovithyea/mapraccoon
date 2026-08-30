// Phnom Penh's water, imported once and then owned — the same shape as
// `import-places.mjs` and for the same reason (D36).
//
// The landing page plots 85 venues at their real coordinates and nothing else,
// so it read as dots on an empty grid. What makes those dots legible is the
// thing that makes Phnom Penh legible: the Chaktomuk confluence, where the
// Tonlé Sap meets the Mekong and the Bassac leaves it. Riverside runs along the
// water and Chroy Changvar sits across it, and neither fact is visible without
// the rivers.
//
// Drawn from OpenStreetMap rather than by hand. A river sketched from memory is
// a wrong map, and rule 4 is that we do not invent what we cannot source.
//
//   usage: node tools/import-water.mjs > src/data/water.ts
//
// Rings are stored as raw [lon, lat] and projected at render time by the same
// `projectInto` the dots use, so they cannot drift out of register with them.

const BBOX = [11.44, 104.82, 11.70, 105.04]; // south, west, north, east
/** Roads and greenery only need the frame the landing page actually plots. */
const INNER_BBOX = [11.50, 104.85, 11.63, 104.99];

const QUERY = `[out:json][timeout:90];
(
  way["natural"="water"]["water"="river"](${BBOX.join(",")});
  relation["natural"="water"]["water"="river"](${BBOX.join(",")});
  way["natural"="water"]["water"!="river"](${INNER_BBOX.join(",")});
  way["highway"~"^(motorway|trunk|primary)$"](${INNER_BBOX.join(",")});
  way["highway"="secondary"](${INNER_BBOX.join(",")});
  way["leisure"="park"](${INNER_BBOX.join(",")});
  way["landuse"~"^(grass|forest|recreation_ground)$"](${INNER_BBOX.join(",")});
);
out geom;`;

/** Douglas–Peucker. The plot is ~600px across 0.073°, so 1px ≈ 0.00012°. */
function simplify(points, epsilon) {
  if (points.length < 3) return points;

  let maxDist = 0;
  let index = 0;
  const [ax, ay] = points[0];
  const [bx, by] = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i += 1) {
    const [px, py] = points[i];
    const dx = bx - ax;
    const dy = by - ay;
    const denom = dx * dx + dy * dy;
    const t = denom === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / denom;
    const clamped = Math.max(0, Math.min(1, t));
    const cx = ax + clamped * dx;
    const cy = ay + clamped * dy;
    const dist = Math.hypot(px - cx, py - cy);
    if (dist > maxDist) {
      maxDist = dist;
      index = i;
    }
  }

  if (maxDist <= epsilon) return [points[0], points[points.length - 1]];
  return [
    ...simplify(points.slice(0, index + 1), epsilon).slice(0, -1),
    ...simplify(points.slice(index), epsilon),
  ];
}

const key = (p) => `${p[0].toFixed(7)},${p[1].toFixed(7)}`;

/**
 * Stitch a multipolygon's member ways into closed rings.
 *
 * OSM splits a long riverbank across several ways, so the members of one
 * relation are fragments that only become a ring when joined end to end.
 */
function stitch(ways) {
  const open = ways.map((w) => w.map((n) => [n.lon, n.lat]));
  const rings = [];

  while (open.length > 0) {
    let ring = open.pop();
    let joined = true;

    while (joined && key(ring[0]) !== key(ring[ring.length - 1])) {
      joined = false;
      for (let i = 0; i < open.length; i += 1) {
        const candidate = open[i];
        const tail = key(ring[ring.length - 1]);
        if (key(candidate[0]) === tail) {
          ring = ring.concat(candidate.slice(1));
        } else if (key(candidate[candidate.length - 1]) === tail) {
          ring = ring.concat(candidate.slice(0, -1).reverse());
        } else {
          continue;
        }
        open.splice(i, 1);
        joined = true;
        break;
      }
    }
    if (ring.length >= 4) rings.push(ring);
  }
  return rings;
}

/**
 * Sutherland–Hodgman, against the query box.
 *
 * A ring whose river leaves the box arrives here unclosed, and `stitch` closes
 * it with a straight chord from its last point back to its first. That chord is
 * a hard diagonal edge through open water — it drew right across the top of the
 * plot and read as a rendering fault rather than as a river.
 *
 * Clipping makes every artificial edge run along the box boundary instead. The
 * box is deliberately larger than the frame the landing page plots, so those
 * edges land outside anything anyone sees.
 */
function clip(ring, [south, west, north, east]) {
  const edges = [
    { inside: (p) => p[0] >= west, at: (a, b) => lerpX(a, b, west) },
    { inside: (p) => p[0] <= east, at: (a, b) => lerpX(a, b, east) },
    { inside: (p) => p[1] >= south, at: (a, b) => lerpY(a, b, south) },
    { inside: (p) => p[1] <= north, at: (a, b) => lerpY(a, b, north) },
  ];

  let out = ring.slice(0, -1); // drop the duplicated closing point
  for (const edge of edges) {
    const input = out;
    out = [];
    for (let i = 0; i < input.length; i += 1) {
      const current = input[i];
      const previous = input[(i + input.length - 1) % input.length];
      const currentIn = edge.inside(current);
      const previousIn = edge.inside(previous);
      if (currentIn) {
        if (!previousIn) out.push(edge.at(previous, current));
        out.push(current);
      } else if (previousIn) {
        out.push(edge.at(previous, current));
      }
    }
    if (out.length === 0) return null;
  }
  return [...out, out[0]];
}

const lerpX = (a, b, x) => [x, a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0])];
const lerpY = (a, b, y) => [a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]), y];

/** Shoelace, in square degrees. Only ever used to drop specks. */
const area = (ring) => {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(sum / 2);
};

// Overpass answers 406 to a request with no User-Agent, which reads as a
// query error rather than as a politeness rule. Named so the operators can see
// who is asking.
const res = await fetch("https://overpass-api.de/api/interpreter", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "mapraccoon-import-water/1.0 (https://github.com/sovithyea/mapraccoon)",
  },
  body: new URLSearchParams({ data: QUERY }),
});
if (!res.ok) throw new Error(`overpass ${res.status}`);
const { elements } = await res.json();

const outer = [];
const inner = [];
const lakes = [];
const green = [];
const roadsMajor = [];
const roadsMinor = [];

const isRiver = (t = {}) => t.natural === "water" && t.water === "river";

for (const el of elements) {
  const tags = el.tags ?? {};

  if (el.type === "relation") {
    const role = (r) =>
      el.members.filter((m) => m.role === r && m.geometry).map((m) => m.geometry);
    outer.push(...stitch(role("outer")));
    inner.push(...stitch(role("inner")));
    continue;
  }
  if (!el.geometry) continue;

  const line = el.geometry.map((n) => [n.lon, n.lat]);

  if (tags.highway) {
    // Roads are lines, not rings: closing one would fill a city block.
    (["motorway", "trunk", "primary"].includes(tags.highway) ? roadsMajor : roadsMinor).push(
      line,
    );
  } else if (isRiver(tags)) {
    outer.push(...stitch([el.geometry]));
  } else if (tags.natural === "water") {
    lakes.push(...stitch([el.geometry]));
  } else {
    green.push(...stitch([el.geometry]));
  }
}

/**
 * Slivers, dropped.
 *
 * A member way that never closed stitches into a ring that doubles back on
 * itself — real area near zero, real perimeter large. Those drew as thin
 * scratches across the plot that read as rendering bugs rather than as water.
 * `area / perimeter²` is scale-free: a circle is 1/4π ≈ 0.0796, a sliver tends
 * to zero.
 */
const MIN_FATNESS = 0.002;

const perimeter = (ring) => {
  let total = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    total += Math.hypot(ring[i + 1][0] - ring[i][0], ring[i + 1][1] - ring[i][1]);
  }
  return total;
};

// ~2.5px at the size this renders. Finer than that is bytes in the bundle for
// detail nobody can see.
const EPSILON = 0.0003;
/** Roads carry direction, not shape, so they take a much coarser line. */
const ROAD_EPSILON = 0.0009;
const AREA_EPSILON = 0.0006;
// Anything under this is a pond-sized speck; at plot scale it is one dot.
const MIN_AREA = 2e-7;
/**
 * A park smaller than this is a dot of colour with no information in it.
 *
 * 5e-7 square degrees is about 0.6 hectares. The first value tried was 3e-6,
 * which is nearly four hectares and dropped every park in the city — the
 * importer reported "green 0 rings" and would have shipped a silently empty
 * layer.
 */
const MIN_AREA_LAND = 5e-7;

const prepare = (rings, { epsilon = EPSILON, minArea = MIN_AREA, clipTo = BBOX } = {}) =>
  rings
    .map((r) => clip(r, clipTo))
    .filter((r) => r !== null && r.length >= 4)
    .filter((r) => area(r) > minArea)
    .filter((r) => {
      const p = perimeter(r);
      return p > 0 && area(r) / (p * p) > MIN_FATNESS;
    })
    .map((r) => simplify(r, epsilon))
    .filter((r) => r.length >= 4)
    .map(round);

const prepareLines = (lines) =>
  lines
    .map((l) => simplify(l, ROAD_EPSILON))
    .filter((l) => l.length >= 2)
    // A two-point stub shorter than ~120m is a slip road at this scale.
    .filter((l) => perimeter(l) > 0.0011)
    .map(round);

const round = (r) => r.map(([lon, lat]) => [Number(lon.toFixed(4)), Number(lat.toFixed(4))]);

const outerRings = prepare(outer);
const innerRings = prepare(inner);
const lakeRings = prepare(lakes, { minArea: MIN_AREA_LAND, epsilon: AREA_EPSILON, clipTo: INNER_BBOX });
const greenRings = prepare(green, { minArea: MIN_AREA_LAND, epsilon: AREA_EPSILON, clipTo: INNER_BBOX });
const major = prepareLines(roadsMajor);
const minor = prepareLines(roadsMinor);

const count = (rs) => rs.reduce((n, r) => n + r.length, 0);
const fmt = (rings) =>
  rings.map((r) => `  [${r.map(([x, y]) => `[${x},${y}]`).join(",")}],`).join("\n");

process.stdout.write(`/**
 * Phnom Penh, drawn from OpenStreetMap.
 *
 * GENERATED by \`tools/import-basemap.mjs\` — do not hand-edit; re-run the
 * importer. Every layer is simplified and rounded to four decimals (~11m, under one plot pixel), because
 * this is scenery at ~600px across and every extra digit is bundle weight for
 * detail nobody can see.
 *
 * \`[longitude, latitude]\`, GeoJSON order, matching \`Spot.coords\` — projected
 * by the same \`projectInto\` the dots use, so no layer can drift out of
 * register with the venues.
 *
 * Source: OpenStreetMap contributors, ODbL. Overpass, ${new Date().toISOString().slice(0, 10)}.
 *
 *   rivers  ${outerRings.length} rings (${count(outerRings)} pts), ${innerRings.length} islands (${count(innerRings)} pts)
 *   lakes   ${lakeRings.length} rings (${count(lakeRings)} pts)
 *   green   ${greenRings.length} rings (${count(greenRings)} pts)
 *   roads   ${major.length} major (${count(major)} pts), ${minor.length} minor (${count(minor)} pts)
 *
 * The river islands are Koh Pich and Koh Norea. Dropping them would fill the
 * channel either side of them with water.
 */

export type Ring = readonly (readonly [number, number])[];

/** River water. Drawn filled, with \`WATER_INNER\` cut out of it. */
export const WATER_OUTER: readonly Ring[] = [
${fmt(outerRings)}
];

/** Islands in the river. Holes, via \`fill-rule: evenodd\`. */
export const WATER_INNER: readonly Ring[] = [
${fmt(innerRings)}
];

/** Lakes and ponds. Same fill as the river; separate because they have no islands. */
export const LAKES: readonly Ring[] = [
${fmt(lakeRings)}
];

/** Parks and open ground. */
export const GREEN: readonly Ring[] = [
${fmt(greenRings)}
];

/** Motorway, trunk and primary. Open polylines — never closed. */
export const ROADS_MAJOR: readonly Ring[] = [
${fmt(major)}
];

/** Secondary. Drawn thinner, so the road hierarchy reads. */
export const ROADS_MINOR: readonly Ring[] = [
${fmt(minor)}
];
`);
