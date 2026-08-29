import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Constellation } from "@/components/home/Constellation";
import { getAllSpots } from "@/lib/spots";

const renderAll = () =>
  render(
    <Constellation
      spots={[...getAllSpots()]}
      locale="en"
      label="{count} places, at their real coordinates"
      hint="Hover a dot to name it"
    />,
  );

/**
 * Hard rule 5, and D33's obligation in particular: memorials stay in the
 * dataset, so every surface written in the product's voice needs its own
 * enforced exclusion — "each enforced by a schema rule or a test, never by
 * prose". C19 is the record of what happens when prose is all there is.
 *
 * The landing page is such a surface. It carries the headline "Let's finally
 * plan an actual hangout, eh?", and a dot for Choeung Ek under that sentence is
 * the product's voice applied to a site of mass killing.
 */
describe("the landing-page scatter", () => {
  it("plots no sensitive place", () => {
    renderAll();
    for (const spot of getAllSpots()) {
      if (!spot.sensitive) continue;
      expect(
        screen.queryByLabelText(spot.name.en),
        `${spot.slug} is a memorial and must not be a dot on the going-out map`,
      ).toBeNull();
    }
  });

  it("still plots everywhere that is not", () => {
    renderAll();
    const ordinary = getAllSpots().filter((s) => !s.sensitive);
    expect(ordinary.length).toBeGreaterThan(50);
    expect(screen.getAllByRole("link")).toHaveLength(ordinary.length);
  });

  it("counts what it drew, not what it was handed", () => {
    renderAll();
    const ordinary = getAllSpots().filter((s) => !s.sensitive).length;
    expect(
      screen.getByText(`${ordinary} places, at their real coordinates`),
    ).toBeTruthy();
  });

  it("names a neighbourhood without repeating one", () => {
    const { container } = renderAll();
    const labels = [...container.querySelectorAll("span[aria-hidden]")]
      .map((el) => el.textContent)
      .filter(Boolean);
    expect(labels.length).toBeGreaterThan(3);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
