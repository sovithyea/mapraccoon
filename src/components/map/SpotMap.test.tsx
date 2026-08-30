import { readFileSync } from "node:fs";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MapPlaceholder } from "@/components/map/MapPlaceholder";
import { SpotMap } from "@/components/map/SpotMap";

/**
 * The token-missing branch is the default state of this repo today (D11), so it
 * is the branch worth a test. jsdom cannot run a WebGL map, so the rendered-map
 * branch is verified in the browser instead — see specs/1-foundation/plan.md.
 */
describe("SpotMap without a Mapbox token", () => {
  it("renders the placeholder instead of a map", () => {
    expect(process.env.NEXT_PUBLIC_MAPBOX_TOKEN).toBeUndefined();

    render(
      <SpotMap
        spots={[]}
        missingTokenTitle="Map not configured"
        missingTokenBody="Set the token to render the map."
      />,
    );

    expect(screen.getByText("Map not configured")).toBeInTheDocument();
    expect(screen.queryByText(/NEXT_PUBLIC_MAPBOX_TOKEN/)).not.toBeInTheDocument();
  });
});

describe("MapPlaceholder", () => {
  it("names the env var the reader has to set", () => {
    render(<MapPlaceholder title="Title" body="Body" />);
    expect(screen.queryByText(/NEXT_PUBLIC_MAPBOX_TOKEN/)).not.toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
  });
});

/**
 * R9 on the map popup (D46).
 *
 * The map is the one surface that shows everything in the dataset, memorials
 * included — it is a map, not an invitation, and since D45 removed the list it
 * is also the only route left to a memorial's page (C40). That makes *how* a
 * memorial reads here load-bearing: a price row and an "open now" badge would
 * put Tuol Sleng in the same register as a hotpot restaurant, which is the C19
 * failure exactly.
 *
 * Structural, because the branch is what carries the rule and a rendering test
 * of a Mapbox popup needs a WebGL context.
 */
describe("the map popup treats a memorial soberly", () => {
  const SRC = readFileSync("src/components/map/SpotMap.tsx", "utf8");

  it("branches on `sensitive` rather than relying on the copy", () => {
    expect(SRC).toMatch(/selected\.sensitive/);
  });

  it("keeps price and open-now out of the memorial branch", () => {
    // Isolate the sensitive branch: everything between `selected.sensitive ? (`
    // and the `) : (` that opens the ordinary one.
    const start = SRC.indexOf("selected.sensitive ? (");
    expect(start).toBeGreaterThan(-1);
    const memorialBranch = SRC.slice(start, SRC.indexOf(") : (", start));

    expect(memorialBranch).not.toMatch(/priceLevel/);
    expect(memorialBranch).not.toMatch(/openNow/);
    expect(memorialBranch).not.toMatch(/isOpenAt/);
  });

  it("still links a memorial to its own page, which is now the only route", () => {
    // D45 took away the list. If this link goes, the pages become unreachable
    // and D33's decision to keep them turns into keeping them hidden.
    expect(SRC).toMatch(/\/spot\/\$\{selected\.slug\}/);
  });
});
