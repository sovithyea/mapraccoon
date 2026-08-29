import { offRadarBand } from "@/lib/scoring";

const bandLabel: Record<ReturnType<typeof offRadarBand>, string> = {
  famous: "Famous",
  known: "Well known",
  quiet: "Quiet",
  remote: "Off the radar",
};

/**
 * R9/D25: a memorial site is never scored. Callers pass the spot's `sensitive`
 * field straight through rather than remembering to guard at each call site —
 * the whole point of D25 is that the rule lives in one place and cannot be
 * forgotten. Renders nothing at all; the caller decides what stands in its
 * place, which on the spot page is an explicit statement that the score is
 * withheld, not a silent gap.
 */
export function OffRadarMeter({
  score,
  showValue = false,
  sensitive,
}: {
  score: number;
  showValue?: boolean;
  sensitive?: "memorial";
}) {
  if (sensitive) return null;

  const band = offRadarBand(score);

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-surface-sunk"
        role="img"
        aria-label={`Off-radar score ${score} out of 100 — ${bandLabel[band]}`}
      >
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${Math.max(score, 3)}%` }}
        />
      </div>
      <span className="text-xs text-muted">
        {bandLabel[band]}
        {showValue ? ` · ${score}` : ""}
      </span>
    </div>
  );
}
