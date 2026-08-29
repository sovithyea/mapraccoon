import { offRadarBand } from "@/lib/scoring";

const bandLabel: Record<ReturnType<typeof offRadarBand>, string> = {
  famous: "Famous",
  known: "Well known",
  quiet: "Quiet",
  remote: "Off the radar",
};

export function OffRadarMeter({
  score,
  showValue = false,
}: {
  score: number;
  showValue?: boolean;
}) {
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
