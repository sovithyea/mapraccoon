// usage: node shot2.mjs <url> <width> <out.png> [scrollY] [clickSelector]
import { writeFileSync } from "node:fs";
const [, , url, width, out, scrollY = "0", click] = process.argv;
const list = await (await fetch("http://127.0.0.1:9222/json/list")).json();
const page = list.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
await new Promise((r) => (ws.onopen = r));
await send("Emulation.setDeviceMetricsOverride", { width: Number(width), height: 844, deviceScaleFactor: 2, mobile: true });
await send("Page.enable");
await send("Page.navigate", { url });
await new Promise((r) => setTimeout(r, 2500));
if (click) {
  await send("Runtime.evaluate", { expression: `document.querySelector(${JSON.stringify(click)})?.click()` });
  await new Promise((r) => setTimeout(r, 900));
}
await send("Runtime.evaluate", { expression: `window.scrollTo(0, ${Number(scrollY)})` });
await new Promise((r) => setTimeout(r, 700));
const { data } = await send("Page.captureScreenshot", { format: "png" });
writeFileSync(out, Buffer.from(data, "base64"));
console.log("wrote", out);
ws.close();
