import { offRadarBand } from "@/lib/scoring";
import type { Spot } from "@/lib/spots/schema";

const BANDS = [
  { key: "famous", label: "Famous" },
  { key: "known", label: "Known" },
  { key: "quiet", label: "Quiet" },
  { key: "remote", label: "Off radar" },
] as const;

/**
 * The off-radar score as a panel in the spot header, rather than an 18px meter
 * sharing a flex row with category chips.
 *
 * The score is the reason to be on the page, so it gets the header's second
 * largest type. The editorial caveat is attached to the number it qualifies —
 * as a loose paragraph underneath it read as a page footnote about the site
 * rather than a statement about this figure.
 *
 * R9/D25: renders nothing for a memorial site. The caller states the absence.
 */
export function OffRadarPanel({
  spot,
  caveat,
  size = "sm",
}: {
  spot: Spot;
  caveat: string;
  size?: "sm" | "lg";
}) {
  if (spot.sensitive) return null;

  const band = offRadarBand(spot.offRadar);
  const activeIndex = BANDS.findIndex((b) => b.key === band);

  return (
    <section className="rounded-2xl border border-border bg-surface px-4 py-3.5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Off the radar</p>
          <p
            className={`mt-1.5 font-display font-bold leading-none ${
              size === "lg" ? "text-[46px]" : "text-[34px]"
            }`}
          >
            {spot.offRadar}
          </p>
        </div>
        <p className="max-w-[15rem] text-right text-[11.5px] leading-[1.45] text-muted">
          {caveat}
        </p>
      </div>

      {/* Four segments, from offRadarBand() — the label and the sort cannot drift. */}
      <div className="mt-3 flex gap-[3px]" role="img" aria-label={`${spot.offRadar} out of 100 — ${BANDS[activeIndex]?.label}`}>
        {BANDS.map((b, i) => (
          <span
            key={b.key}
            className={`h-[7px] flex-1 rounded-full ${
              i === activeIndex ? "bg-accent" : "bg-border"
            }`}
          />
        ))}
      </div>

      <div className="mt-1.5 flex justify-between text-[10px] text-muted">
        {BANDS.map((b, i) => (
          <span key={b.key} className={i === activeIndex ? "font-bold text-accent" : ""}>
            {b.label}
          </span>
        ))}
      </div>
    </section>
  );
}
