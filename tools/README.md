# tools/

Zero-dependency layout QA over the Chrome DevTools Protocol. Node 26 has a global
`WebSocket`, so these need no packages installed.

They exist because the mobile layout was broken in a way that was invisible from
the source: a `truncate` class deep inside `CityPicks` set `white-space: nowrap`,
which made a spot's full blurb the min-content width of its grid column and blew
the page out to 630px at a 390px viewport. Reading the JSX would not have found
it. Measuring did.

## Start Chrome

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --remote-debugging-port=9222 \
  --user-data-dir=/tmp/mapraccoon-chrome about:blank &
```

## Measure

```bash
node tools/probe.mjs <url> <width> '<js expression>'
```

The expression is evaluated in the page and returned as JSON. The check that
matters — true horizontal overflow, ignoring elements inside deliberate scroll
rails:

```bash
node tools/probe.mjs http://localhost:3000/en 390 '
(() => {
  const vw = document.documentElement.clientWidth;
  const inScroller = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if (o === "auto" || o === "scroll" || o === "hidden") return true;
    }
    return false;
  };
  const bad = [];
  document.querySelectorAll("*").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > 1 && r.right > vw + 1 && !inScroller(el))
      bad.push((el.className.baseVal ?? el.className ?? "").toString().slice(0, 50));
  });
  return { scrollWidth: document.documentElement.scrollWidth, trueOverflow: bad.length, bad: bad.slice(0, 5) };
})()'
```

**`scrollWidth` must equal the viewport width, and `trueOverflow` must be 0**, at
320, 390 and 768. Filtering by scroll ancestor matters: the city rail and the
pairing rail are *supposed* to extend past the viewport.

Touch targets — WCAG 2.5.8 wants 24×24 CSS px minimum, and 44px is the practical
iOS target:

```bash
node tools/probe.mjs http://localhost:3000/en/discover 390 '
[...document.querySelectorAll("a,button")]
  .map((el) => ({ t: el.textContent.trim().slice(0, 24), h: Math.round(el.getBoundingClientRect().height) }))
  .filter((x) => x.h > 0 && x.h < 24)'
```

## Contrast audit

```bash
node tools/contrast.mjs <url> [dark]     # exits 1 on any failure
```

Walks every leaf text node, composites the full backdrop stack, and reports
anything under WCAG AA (4.5:1, or 3:1 for large text). Run both modes on every
route before signing off a palette change.

Two things it does that a naive version gets wrong, both learned by shipping the
naive version first:

- **It resolves colours through a canvas, not a regex.** Tailwind v4 emits
  `oklab(0.999994 … / 0.8)` for `text-white/80`. A regex that assumes `rgb()`
  reads those three numbers as near-black and reports a confident false failure.
- **It composites the whole backdrop stack, not the nearest background.**
  `bg-white/15` over an indigo card is not `bg-white/15` over nothing. Stopping
  at the first non-transparent layer flagged four passing chips as failures.

It found two real defects on its first correct run — 1.15:1 and 2.46:1 in dark
mode — that reading the source and looking at screenshots had both missed.

## Screenshot

```bash
node tools/shot.mjs <url> <width> <out.png> [scrollY] [clickSelector]
```

Screenshots go through the same CDP emulation as the probe, so the image and the
measurement always agree. `chrome --headless --screenshot` with `--window-size`
does **not** agree — it produced images showing overflow on a page the probe
correctly measured as clean. Do not use it.
