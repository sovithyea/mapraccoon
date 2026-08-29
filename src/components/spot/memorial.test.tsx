import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OffRadarMeter } from "@/components/spot/OffRadarMeter";
import { PairingCard } from "@/components/spot/PairingCard";
import { getSpotBySlug } from "@/lib/spots";
import type { Spot } from "@/lib/spots/schema";

/**
 * R9 is a rule about what must NOT appear, so the test is that nothing does.
 * D25 moved the rule from editorial discipline into the schema and these three
 * components; without a test the null branches are the easiest thing in the
 * codebase to delete by accident.
 */
describe("memorial sites render no ranking apparatus", () => {
  const tuolSleng = getSpotBySlug("tuol-sleng") as Spot;

  it("has a memorial site to test against", () => {
    expect(tuolSleng?.sensitive).toBe("memorial");
  });

  it("OffRadarMeter renders nothing for one", () => {
    const { container } = render(
      <OffRadarMeter score={tuolSleng.offRadar} sensitive={tuolSleng.sensitive} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("still renders the meter when the spot is not sensitive", () => {
    // The negative case matters: a guard that returns null unconditionally
    // would pass every other test in this file.
    const { container } = render(<OffRadarMeter score={72} />);
    expect(container).not.toBeEmptyDOMElement();
  });

  it("PairingCard renders nothing when the anchor is a memorial", () => {
    const { container } = render(
      <PairingCard
        anchor={tuolSleng}
        hook={{ en: "Should never appear." }}
        dict={
          {
            pairing: {
              heading: "Instead of",
              anchorLabel: "The famous one",
              seeAnchor: "See {name}",
            },
          } as never
        }
        locale="en"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
