/**
 * Rendered instead of the map when NEXT_PUBLIC_MAPBOX_TOKEN is absent (D11).
 * Everything else on the site works without a token, so this explains rather
 * than blocks.
 */
export function MapPlaceholder({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex h-full min-h-64 items-center justify-center rounded-lg border border-dashed border-border bg-surface-sunk p-8">
      <div className="max-w-sm text-center">
        <p className="font-medium">{title}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
        <code className="mt-3 inline-block rounded bg-background px-2 py-1 text-xs text-muted">
          NEXT_PUBLIC_MAPBOX_TOKEN
        </code>
      </div>
    </div>
  );
}
