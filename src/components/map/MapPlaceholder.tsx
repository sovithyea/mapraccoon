/**
 * Rendered instead of the map when NEXT_PUBLIC_MAPBOX_TOKEN is absent (D11) —
 * which is this repo's actual deployed state, not an edge case.
 *
 * It used to print the environment variable name in a `<code>` block. That is
 * a message to whoever is running the site, and the person reading it is a
 * traveller. The variable name now goes to the build log instead; this space
 * carries something useful to a visitor.
 */
export function MapPlaceholder({
  title,
  body,
  coords,
}: {
  title: string;
  body: string;
  /** [longitude, latitude] — GeoJSON order, as everywhere else. */
  coords?: readonly [number, number];
}) {
  return (
    <div className="flex h-full min-h-64 items-center justify-center rounded-lg border border-dashed border-border bg-surface-sunk p-8">
      <div className="max-w-sm text-center">
        <p className="font-medium">{title}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>

        {coords ? (
          <>
            <p className="mt-4 font-mono text-xs tabular-nums text-muted">
              {Math.abs(coords[1]).toFixed(4)}° {coords[1] >= 0 ? "N" : "S"} ·{" "}
              {Math.abs(coords[0]).toFixed(4)}° {coords[0] >= 0 ? "E" : "W"}
            </p>
            <a
              href={`https://www.openstreetmap.org/?mlat=${coords[1]}&mlon=${coords[0]}#map=15/${coords[1]}/${coords[0]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center text-sm text-accent underline underline-offset-4"
            >
              Open in a maps app ↗
            </a>
          </>
        ) : null}
      </div>
    </div>
  );
}
