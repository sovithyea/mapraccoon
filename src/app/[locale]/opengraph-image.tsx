import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { buildableLocales } from "@/i18n/config";
import { boundsOf, projectInto } from "@/lib/geo/project";
import { getAllSpots } from "@/lib/spots";
import { plottableSpots } from "@/lib/spots/plottable";

/**
 * The link preview, which for this product is the front door.
 *
 * Distribution is one person pasting a link into a group chat. What the other
 * four see before they tap is this image, so it does the job the landing page
 * would otherwise do — and it is the constellation rather than a logo, because
 * the scatter says "these are real places in your city" without a sentence.
 *
 * Fonts are read off disk, not fetched. The documented pattern fetches from
 * Google at build time, which puts a network call on the critical path of every
 * deployment for a decorative asset. `assets/*.ttf` are both OFL — see
 * assets/README.md. Satori cannot read woff2, which is the only format
 * `next/font` leaves behind, so these are separate files rather than a reuse.
 *
 * Statically generated at build: it reads the seed file and nothing per-request.
 */

/**
 * Prerender it. Without this the route is dynamic on account of the `[locale]`
 * segment, and Satori would run on every preview fetch — every paste of a link
 * into a chat, by every service that unfurls it.
 */
export function generateStaticParams() {
  return buildableLocales.map((locale) => ({ locale }));
}

export const alt =
  "MapRaccoon — pick a few places in Phnom Penh, send one link, everyone votes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const playfair = await readFile(join(process.cwd(), "assets/PlayfairDisplay-Bold.ttf"));
const dmSans = await readFile(join(process.cwd(), "assets/DMSans-Medium.ttf"));

// Monsoon light, literal. ImageResponse has no stylesheet and therefore no
// custom properties; these are the four values it needs from globals.css.
const BONE = "#faf6ef";
const SUNK = "#f1ead9";
const INK = "#1d2621";
const MUTED = "#655d51";
const ACCENT = "#123a31";
const BORDER = "#e1d8c6";

export default async function Image() {
  // The same rule as the on-page scatter, through the same function: a dot for
  // a killing field does not go in the card that sells a night out (R9, D33).
  const plotted = plottableSpots(getAllSpots());
  const project = projectInto(boundsOf(plotted.map((s) => s.coords)));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: BONE,
          color: INK,
          fontFamily: "DM Sans",
          padding: 64,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: 620,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 20,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: ACCENT,
              fontWeight: 500,
            }}
          >
            MapRaccoon
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontFamily: "Playfair Display",
              fontSize: 68,
              lineHeight: 1.04,
              marginTop: 22,
            }}
          >
            <div style={{ display: "flex" }}>Let&apos;s finally plan</div>
            <div style={{ display: "flex" }}>an actual</div>
            <div style={{ display: "flex", color: ACCENT }}>hangout, eh?</div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 25,
              lineHeight: 1.4,
              color: MUTED,
              marginTop: 26,
            }}
          >
            {plotted.length} places across Phnom Penh. Pick a few, send one link,
            everyone votes.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            position: "relative",
            width: 442,
            height: 442,
            marginLeft: 50,
            alignSelf: "center",
            background: SUNK,
            border: `1px solid ${BORDER}`,
            borderRadius: 32,
          }}
        >
          {plotted.map((spot) => {
            const { x, y } = project(spot.coords);
            return (
              <div
                key={spot.id}
                style={{
                  position: "absolute",
                  left: (x / 100) * 442 - 5,
                  top: (y / 100) * 442 - 5,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  background: ACCENT,
                  opacity: 0.62,
                }}
              />
            );
          })}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Playfair Display", data: playfair, style: "normal", weight: 700 },
        { name: "DM Sans", data: dmSans, style: "normal", weight: 500 },
      ],
    },
  );
}
