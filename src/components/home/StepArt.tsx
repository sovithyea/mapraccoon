/**
 * The three steps, drawn.
 *
 * The section was three paragraphs of prose, and prose is the wrong medium for
 * "one link fans out to four phones and comes back as a schedule" — a reader
 * has to build the picture themselves, and someone landing here has never seen
 * the product. Each drawing shows the mechanic the sentence beside it names,
 * so the shape of the loop is legible before the words are read.
 *
 * Schematic, not illustration. No venue, no phone chrome, no faces: the thing
 * being shown is the *shape* of the step, and detail would compete with the
 * card's own words.
 *
 * **Every stroke and fill is `currentColor`.** That is what keeps these correct
 * across four palettes and three appearances without a single new token — the
 * colour comes from a Tailwind text utility on the enclosing `<g>`, which reads
 * the same CSS variable the rest of the page does. A literal hex here would be
 * invisible in one of the eight combinations and nobody would find it.
 *
 * They use `--brand` and `--accent` only. Category colour identifies map pin
 * layers and gold means "unverified claim"; neither has any business in a
 * diagram (D21).
 */

const box = "h-auto w-full" as const;

/** Step 1 — a list, with a few of them added. */
export function PickArt() {
  // Widths vary because a list of identical bars reads as a loading skeleton.
  const rows = [
    { y: 3, on: true, w: 96 },
    { y: 19, on: false, w: 132 },
    { y: 35, on: true, w: 74 },
    { y: 51, on: true, w: 118 },
    { y: 67, on: false, w: 88 },
  ];

  return (
    <svg viewBox="0 0 240 82" className={box} aria-hidden="true" focusable="false">
      {rows.map((row) => (
        <g key={row.y}>
          {/* The row itself. Added rows carry a faint accent wash, so "some of
              them, not all" reads without needing a legend. */}
          <rect
            x="28"
            y={row.y}
            width="208"
            height="12"
            rx="4"
            className={row.on ? "text-accent" : "text-border"}
            fill="currentColor"
            fillOpacity={row.on ? 0.13 : 0.5}
          />
          <rect
            x="28"
            y={row.y}
            width="208"
            height="12"
            rx="4"
            className={row.on ? "text-accent" : "text-border"}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          {/* A short bar inside each row. Without it the rows read as empty
              input fields rather than as places already on a list. */}
          <rect
            x="36"
            y={row.y + 4}
            width={row.w}
            height="4"
            rx="2"
            className={row.on ? "text-accent" : "text-muted"}
            fill="currentColor"
            fillOpacity={row.on ? 0.85 : 0.4}
          />
          {row.on ? (
            <>
              <circle cx="12" cy={row.y + 6} r="6" className="text-accent" fill="currentColor" />
              <path
                d="M9 6.2 l2.2 2.2 L15 4.4"
                transform={`translate(0 ${row.y})`}
                className="text-background"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          ) : (
            <circle
              cx="12"
              cy={row.y + 6}
              r="5.5"
              className="text-border"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          )}
        </g>
      ))}
    </svg>
  );
}

/** Step 2 — one link, four phones, one answer each. */
export function SendArt() {
  const phones = [2, 22, 42, 62];

  return (
    <svg viewBox="0 0 240 82" className={box} aria-hidden="true" focusable="false">
      {/* The link. One object, and the only thing the organiser sends. */}
      <rect
        x="2"
        y="29"
        width="62"
        height="24"
        rx="12"
        className="text-accent"
        fill="currentColor"
      />
      {/*
        The conventional chain link, at its native 24px inside the 24-tall pill.
        A hand-rolled glyph was tried first and rendered as "+ )(" at this size —
        an icon that has a convention is not the place to invent one.
      */}
      <g
        transform="translate(21 29)"
        className="text-background"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </g>

      {/* The fan-out. Curves rather than straight rays: four lines meeting at a
          point reads as a burst, four curves read as one thing reaching four
          places. */}
      <g className="text-border" fill="none" stroke="currentColor" strokeWidth="1.2">
        {phones.map((y) => (
          <path key={y} d={`M64 41 C 108 41, 116 ${y + 9}, 158 ${y + 9}`} />
        ))}
      </g>

      {/* Four phones, each with its own yes / maybe / no — and one of them
          chosen. The marks are what makes these phones rather than boxes. */}
      {phones.map((y, i) => (
        <g key={y}>
          <rect
            x="158"
            y={y}
            width="80"
            height="18"
            rx="5"
            className="text-border"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          {[0, 1, 2].map((slot) => {
            const on = slot === i % 3;
            return (
              <rect
                key={slot}
                x={166 + slot * 22}
                y={y + 5}
                width="18"
                height="8"
                rx="4"
                className={on ? "text-brand" : "text-border"}
                fill="currentColor"
                fillOpacity={on ? 1 : 0.55}
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
}

/** Step 3 — the approved places, laid out along an evening. */
export function PlanArt() {
  return (
    <svg viewBox="0 0 240 82" className={box} aria-hidden="true" focusable="false">
      {/* The evening, as a line. Ticks give it duration; without them two
          rectangles are just two rectangles. */}
      <g className="text-border" stroke="currentColor" strokeWidth="1">
        <path d="M4 66h232" />
        {[4, 62, 120, 178, 236].map((x) => (
          <path key={x} d={`M${x} 62v8`} />
        ))}
      </g>

      {/* Two stops of different lengths — the point being that you set how long
          you want at each, and the rest moves. */}
      <rect x="10" y="22" width="86" height="30" rx="8" className="text-accent" fill="currentColor" />
      <rect
        x="140"
        y="22"
        width="90"
        height="30"
        rx="8"
        className="text-accent"
        fill="currentColor"
        fillOpacity="0.55"
      />

      {/* The gap between them is travel, and it is drawn because it is the part
          a group forgets when they plan in a chat. */}
      <g className="text-muted" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M100 37h36" strokeDasharray="3 4" strokeLinecap="round" />
        <path d="M131 33l5 4-5 4" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <g className="text-background" fill="currentColor">
        <circle cx="24" cy="37" r="7" />
        <circle cx="154" cy="37" r="7" />
      </g>
      <g className="text-accent" fill="currentColor" fontSize="9" fontWeight="700">
        <text x="24" y="40" textAnchor="middle">
          1
        </text>
        <text x="154" y="40" textAnchor="middle">
          2
        </text>
      </g>
    </svg>
  );
}

/** Indexed by step, so `HowItWorks` stays a map over the dictionary. */
export const STEP_ART = [PickArt, SendArt, PlanArt] as const;
