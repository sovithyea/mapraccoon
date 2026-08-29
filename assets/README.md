# assets/

Font files read at build time by `src/app/[locale]/opengraph-image.tsx`.

**Why they are committed rather than fetched.** The documented Next pattern
fetches from Google Fonts inside the image route, which puts a network call on
the critical path of every deployment for a decorative asset. These are 172 KB
and never change.

**Why they are not the ones `next/font` already downloads.** `next/font` leaves
woff2 in `.next/static/media`, and Satori — the renderer behind `ImageResponse`
— cannot read woff2. Same typefaces, different container.

| File | Family | Licence |
|---|---|---|
| `PlayfairDisplay-Bold.ttf` | Playfair Display 700 | SIL Open Font License 1.1 |
| `DMSans-Medium.ttf` | DM Sans 500 | SIL Open Font License 1.1 |

Both are OFL, which permits redistribution as part of a larger work. Fetched
from `fonts.gstatic.com` on 2026-08-29.
