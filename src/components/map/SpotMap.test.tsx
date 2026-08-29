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
    expect(screen.getByText("NEXT_PUBLIC_MAPBOX_TOKEN")).toBeInTheDocument();
  });
});

describe("MapPlaceholder", () => {
  it("names the env var the reader has to set", () => {
    render(<MapPlaceholder title="Title" body="Body" />);
    expect(screen.getByText("NEXT_PUBLIC_MAPBOX_TOKEN")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
  });
});
