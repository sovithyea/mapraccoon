import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { PALETTES } from "@/components/ThemeToggle";

const css = readFileSync("src/app/globals.css", "utf8");

/** Every `--token: value` declaration in a block, as a map. */
const declsIn = (block: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    out[m[1] as string] = (m[2] as string).trim();
  }
  return out;
};

const blockAfter = (marker: string): string => {
  const start = css.indexOf(marker);
  if (start === -1) throw new Error(`missing block: ${marker}`);
  const open = css.indexOf("{", start + marker.length - 1);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(open, i);
    }
  }
  throw new Error(`unterminated block: ${marker}`);
};

/*
 * Palettes are resolved the way a browser resolves them: start from the base
 * `:root`, layer the palette's own block on top, then the dark block if the
 * appearance is dark. Reading the blocks in isolation would miss exactly the
 * bug this file exists to catch, which is a token that only one of them sets.
 */
const resolve = (palette: string, dark: boolean): Record<string, string> => {
  const base = declsIn(blockAfter(":root {"));
  const light =
    palette === "monsoon" ? {} : declsIn(blockAfter(`:root[data-palette="${palette}"] {`));
  if (!dark) return { ...base, ...light };

  const darkBase = declsIn(blockAfter(':root[data-theme="dark"] {'));
  const darkPalette =
    palette === "monsoon"
      ? {}
      : declsIn(blockAfter(`:root[data-palette="${palette}"][data-theme="dark"] {`));
  return { ...base, ...light, ...darkBase, ...darkPalette };
};

// ── Colour maths ───────────────────────────────────────────────────────────

const rgb = (hex: string): [number, number, number] => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`not a six-digit hex: ${hex}`);
  const n = parseInt(m[1] as string, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const srgbToLinear = (c: number): number => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string): number => {
  const [r, g, b] = rgb(hex).map(srgbToLinear) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

const toLab = (hex: string): [number, number, number] => {
  const [r, g, b] = rgb(hex).map(srgbToLinear) as [number, number, number];
  const f = (t: number): number => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047);
  const y = f(r * 0.2126 + g * 0.7152 + b * 0.0722);
  const z = f((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
};

const deltaE = (a: string, b: string): number => {
  const [la, aa, ba] = toLab(a);
  const [lb, ab, bb] = toLab(b);
  return Math.hypot(la - lb, aa - ab, ba - bb);
};

// ── The rules ──────────────────────────────────────────────────────────────

/** Every foreground/background pair the layout actually puts together. */
const TEXT_PAIRS: readonly [string, string][] = [
  ["--foreground", "--background"],
  ["--foreground", "--surface"],
  ["--foreground", "--surface-sunk"],
  ["--muted", "--background"],
  ["--muted", "--surface"],
  ["--muted", "--surface-sunk"],
  ["--brand", "--background"],
  ["--brand", "--surface"],
  ["--brand", "--surface-sunk"],
  ["--gold", "--background"],
  ["--gold", "--surface"],
  ["--gold", "--surface-sunk"],
  ["--accent-contrast", "--accent"],
];

const ROLE_TOKENS = [
  "--background",
  "--surface",
  "--surface-sunk",
  "--ink",
  "--foreground",
  "--muted",
  "--border",
  "--brand",
  "--accent",
  "--accent-contrast",
  "--gold",
] as const;

const APPEARANCES: readonly [string, boolean][] = [
  ["light", false],
  ["dark", true],
];

/**
 * "Every value here is verified, not chosen by eye." This is where that is
 * true rather than asserted: the file's own numbers are read back and put
 * through the same maths the claim is about, for every palette and both
 * appearances. Adding a fifth palette that looks nice and fails AA is a red
 * suite, not a review someone has to catch.
 */
describe("palettes", () => {
  for (const { id, name } of PALETTES) {
    for (const [appearance, dark] of APPEARANCES) {
      describe(`${name}, ${appearance}`, () => {
        const p = resolve(id, dark);

        it("defines every role token", () => {
          for (const token of ROLE_TOKENS) {
            expect(p[token], `${id}/${appearance} is missing ${token}`).toBeDefined();
          }
        });

        it("clears WCAG AA on every text pair the layout puts together", () => {
          for (const [fg, bg] of TEXT_PAIRS) {
            const ratio = contrast(p[fg] as string, p[bg] as string);
            expect(
              ratio,
              `${id}/${appearance}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1`,
            ).toBeGreaterThanOrEqual(4.5);
          }
        });

        it("keeps accent and gold telling different things apart (D21)", () => {
          const d = deltaE(p["--accent"] as string, p["--gold"] as string);
          expect(d, `${id}/${appearance}: deltaE ${d.toFixed(1)}`).toBeGreaterThan(25);
        });
      });
    }
  }

  /**
   * The point of the exercise, and the thing the first attempt got wrong: four
   * palettes whose backgrounds were all within deltaE 5 of each other looked
   * like one palette with the accent swapped. A menu offering four choices that
   * a person cannot tell apart is worse than not offering them.
   *
   * The dark floor is lower than the light one and that is physics, not a
   * concession: near-black colours are compressed in Lab, so five units there
   * is a plainly visible cast over a whole screen. Raising it would mean making
   * one of the dark palettes not dark.
   */
  for (const [appearance, dark, floor] of [
    ["light", false, 6],
    ["dark", true, 4],
  ] as const) {
    it(`gives each palette its own background in ${appearance}`, () => {
      const bgs = PALETTES.map(({ id }) => resolve(id, dark)["--background"] as string);
      for (let i = 0; i < bgs.length; i += 1) {
        for (let j = i + 1; j < bgs.length; j += 1) {
          const d = deltaE(bgs[i] as string, bgs[j] as string);
          expect(
            d,
            `${PALETTES[i]!.name} and ${PALETTES[j]!.name} backgrounds differ by ${d.toFixed(1)}`,
          ).toBeGreaterThan(floor);
        }
      }
    });
  }

  it("gives each palette a look of its own", () => {
    // Four entries in a menu that resolve to two palettes is a menu with a bug
    // in it. Compares the accent, which is the tone the page is built around.
    const accents = PALETTES.map(({ id }) => resolve(id, false)["--accent"] as string);
    for (let i = 0; i < accents.length; i += 1) {
      for (let j = i + 1; j < accents.length; j += 1) {
        const d = deltaE(accents[i] as string, accents[j] as string);
        expect(
          d,
          `${PALETTES[i]!.name} and ${PALETTES[j]!.name} differ by only ${d.toFixed(1)}`,
        ).toBeGreaterThan(15);
      }
    }
  });
});

/**
 * Dark mode has two triggers — the OS preference and an explicit toggle — and
 * they must resolve to the same palette.
 *
 * A token defined in only one of them is precisely the class of bug D21 and C13
 * were about, except worse: it would appear only for people who had touched the
 * toggle, so it would survive every review done with the OS setting.
 */
describe("the two dark triggers", () => {
  const pairs: readonly [string, string, string][] = [
    ["monsoon", ':root:not([data-theme="light"]) {', ':root[data-theme="dark"] {'],
    ...PALETTES.filter((p) => p.id !== "monsoon").map(
      ({ id }) =>
        [
          id,
          `:root[data-palette="${id}"]:not([data-theme="light"]) {`,
          `:root[data-palette="${id}"][data-theme="dark"] {`,
        ] as [string, string, string],
    ),
  ];

  for (const [id, mediaSel, explicitSel] of pairs) {
    it(`resolves ${id} identically under both`, () => {
      expect(declsIn(blockAfter(explicitSel))).toEqual(declsIn(blockAfter(mediaSel)));
    });
  }

  it("checks a meaningful number of tokens, so an empty match cannot pass", () => {
    expect(Object.keys(declsIn(blockAfter(':root[data-theme="dark"] {'))).length).toBeGreaterThan(
      14,
    );
  });

  it("defines every dark token in the light base as well", () => {
    // "Never define a colour only inside the dark block" — the light set is the
    // base, and anything missing from it renders as an invalid value.
    const light = declsIn(blockAfter(":root {"));
    for (const token of Object.keys(declsIn(blockAfter(':root[data-theme="dark"] {')))) {
      if (token === "--color-scheme") continue;
      expect(light, `${token} is only defined in dark`).toHaveProperty(token);
    }
  });
});

/**
 * The blocks compose by specificity, so their order in the file is load
 * bearing: a light palette block placed after a dark one wins in dark mode at
 * equal specificity, and that bug is invisible to whichever half of reviewers
 * use the other OS setting.
 */
describe("block order", () => {
  // Anchored to a line start with the opening brace, because the header comment
  // above the palettes explains this ordering and therefore contains the same
  // text — the first version of this test measured against the comment.
  const firstDark = css.indexOf("\n@media (prefers-color-scheme: dark) {");

  it("puts every light palette above the dark blocks", () => {
    for (const { id } of PALETTES) {
      if (id === "monsoon") continue;
      const at = css.indexOf(`:root[data-palette="${id}"] {`);
      expect(at, `${id} light is declared after the dark blocks`).toBeLessThan(firstDark);
    }
  });

  it("puts the explicit dark blocks below the media query", () => {
    expect(css.indexOf('\n:root[data-theme="dark"] {')).toBeGreaterThan(firstDark);
  });
});
