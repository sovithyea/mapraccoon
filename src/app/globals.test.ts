import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");

const tokensIn = (block: string): string[] =>
  [...block.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1] as string).sort();

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

/**
 * Dark mode has two triggers — the OS preference and an explicit toggle — and
 * they must resolve to the same palette.
 *
 * A token defined in only one of them is precisely the class of bug D21 and C13
 * were about, except worse: it would appear only for people who had touched the
 * toggle, so it would survive every review done with the OS setting.
 */
describe("theme blocks", () => {
  const media = tokensIn(blockAfter(':root:not([data-theme="light"])'));
  const explicit = tokensIn(blockAfter(':root[data-theme="dark"]'));

  it("defines the same tokens under both dark triggers", () => {
    expect(explicit).toEqual(media);
  });

  it("defines a meaningful number of them, so an empty match cannot pass", () => {
    expect(media.length).toBeGreaterThan(15);
  });

  it("defines every dark token in the light :root as well", () => {
    // "Never define a colour only inside the dark block" — the light set is the
    // base, and anything missing from it renders as an invalid value.
    const light = tokensIn(css.slice(css.indexOf(":root {"), css.indexOf("@media")));
    for (const token of media) {
      if (token === "--color-scheme") continue;
      expect(light, `${token} is only defined in dark`).toContain(token);
    }
  });
});
