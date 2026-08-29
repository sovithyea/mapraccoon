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

## Screenshot

```bash
node tools/shot.mjs <url> <width> <out.png> [scrollY] [clickSelector]
```

Screenshots go through the same CDP emulation as the probe, so the image and the
measurement always agree. `chrome --headless --screenshot` with `--window-size`
does **not** agree — it produced images showing overflow on a page the probe
correctly measured as clean. Do not use it.
