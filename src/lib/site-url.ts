/**
 * The absolute origin, for `metadataBase` and nothing else.
 *
 * Open Graph tags must carry absolute URLs — a preview is fetched by Telegram's
 * or Facebook's servers, which have no page to resolve a relative path against.
 * Next needs `metadataBase` to build them, and without it silently emits
 * relative URLs, so every shared link previews without its image.
 *
 * Share links themselves do NOT use this. They are built in the browser from
 * `window.location.origin`, which is correct by construction on any domain,
 * including a Vercel preview deployment. Deriving them from an environment
 * variable would be a way to get them wrong.
 *
 * Order matters:
 *
 *   1. `NEXT_PUBLIC_SITE_URL` — set this once the site has a real domain. It is
 *      the only one that survives a custom domain being added.
 *   2. `VERCEL_PROJECT_PRODUCTION_URL` — the project's stable production host,
 *      the same on every build. Vercel sets it; no protocol.
 *   3. `VERCEL_URL` — the *per-deployment* host. Different for every build, so
 *      it is a last resort: previews get a preview-specific card, which is
 *      right for a preview and wrong for production.
 *   4. localhost, for `npm run dev`.
 */
export function siteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return new URL(explicit);

  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (host) return new URL(`https://${host}`);

  return new URL("http://localhost:3000");
}
