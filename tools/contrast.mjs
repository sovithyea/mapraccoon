// Contrast audit over CDP. usage: node tools/contrast.mjs <url> [dark] [palette]
//
// The palette argument exists because D38 ships four of them and light/dark is
// only one of the two axes: eight combinations, and the emulated media query
// reaches exactly two of them.
//
// Resolves colours through a canvas rather than parsing the computed string.
// Tailwind v4 emits `oklab(... / 0.8)` for `text-white/80`, and a regex that
// assumes rgb() reads those numbers as near-black — which produced a confident
// false failure the first time this ran. The canvas also composites alpha over
// the real backdrop, which a string parse cannot do at all.
const [, , url, mode, palette] = process.argv;

const list = await (await fetch("http://127.0.0.1:9222/json/list")).json();
const page = list.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (m, p = {}) =>
  new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
await new Promise((r) => (ws.onopen = r));

await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-color-scheme", value: mode === "dark" ? "dark" : "light" }],
});
await send("Page.enable");
await send("Page.navigate", { url });
await new Promise((r) => setTimeout(r, 1500));

// The palette lives in localStorage and is applied by an inline script before
// first paint, so it has to be written on the origin and the page reloaded.
if (palette) {
  await send("Runtime.evaluate", {
    expression: `localStorage.setItem("mapraccoon:palette", ${JSON.stringify(palette)})`,
  });
  await send("Page.navigate", { url });
}
await new Promise((r) => setTimeout(r, 2000));

const expression = `
(() => {
  const cv = document.createElement("canvas"); cv.width = cv.height = 1;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  // Composite the colour over its real backdrop; resolves oklab/lch/alpha.
  const px = (color, backdrop) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = backdrop; ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = color;    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  };
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const ratio = (a, b) => { const [hi, lo] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)]; return (hi + 0.05) / (lo + 0.05); };
  // Every painted layer from the element out to the root, outermost first.
  // Returning only the nearest one is wrong when it is translucent —
  // bg-white/15 over an indigo card is not bg-white/15 over nothing.
  const backdropStack = (el) => {
    const inward = [];
    for (let p = el; p; p = p.parentElement) {
      const c = getComputedStyle(p).backgroundColor;
      if (c && !/rgba\\(0, 0, 0, 0\\)|transparent/.test(c)) inward.push(c);
    }
    return ["#ffffff", ...inward.reverse()];
  };
  const flatten = (stack) => {
    ctx.clearRect(0, 0, 1, 1);
    for (const layer of stack) { ctx.fillStyle = layer; ctx.fillRect(0, 0, 1, 1); }
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  };

  const out = [];
  document.querySelectorAll("*").forEach((el) => {
    if (el.children.length) return;                       // leaf text nodes only
    const text = (el.textContent || "").trim();
    if (!text) return;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.opacity === "0") return;
    const stack = backdropStack(el);
    const bg = flatten(stack);
    const fg = flatten([...stack, cs.color]);
    const size = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    // WCAG "large text": >=24px, or >=18.66px bold.
    const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
    const c = ratio(fg, bg);
    if (c < need) out.push({ text: text.slice(0, 40), ratio: +c.toFixed(2), need, size, color: cs.color, on: "rgb(" + bg.join(",") + ")" });
  });
  return { failures: out.length, items: out.sort((a, b) => a.ratio - b.ratio).slice(0, 10) };
})()`;

const { result } = await send("Runtime.evaluate", { expression, returnByValue: true });
const v = result.value;
console.log(`${mode === "dark" ? "dark " : "light"}  ${url}  →  ${v.failures} failure(s)`);
v.items.forEach((i) => console.log(`   ${i.ratio} (need ${i.need})  "${i.text}"  ${i.color} on ${i.on}`));
ws.close();
process.exit(v.failures ? 1 : 0);
