// Drive headless Chrome over CDP to measure layout. Node 26 has global WebSocket.
const [,, url, width, expr] = process.argv;
const w = Number(width || 390);

const list = await (await fetch("http://127.0.0.1:9222/json/list")).json();
const page = list.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
};
await new Promise((r) => (ws.onopen = r));

await send("Emulation.setDeviceMetricsOverride", {
  width: w, height: 844, deviceScaleFactor: 2, mobile: true,
});
await send("Page.enable");
await send("Page.navigate", { url });
await new Promise((r) => setTimeout(r, 2500));

const { result } = await send("Runtime.evaluate", {
  expression: expr, returnByValue: true, awaitPromise: true,
});
console.log(JSON.stringify(result.value, null, 2));
ws.close();
