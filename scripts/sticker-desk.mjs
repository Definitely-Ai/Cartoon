// The sticker desk. Local, on the studio machine, no npm and no network.
//
//   node scripts/sticker-desk.mjs            # http://127.0.0.1:8787
//   node scripts/sticker-desk.mjs --port 9001
//
// The founder, 2026-09-05: "maybe we need to generate the room then use all of
// these as stickers we can drag and drop into the correct space in the room
// then we can remove that layer later on if needed and modify it ... make sure
// everything you generate is organised and labeled so i can look back at each
// modular item and where we have gone with it."
//
// So: the room is base.png, every object is an RGBA sticker cut by
// scripts/stickers.py, and this page lays them over the room where you drag
// them. Nothing here draws, renders or touches the GPU. Save writes
// canon/room-kit/v2/layout.json; Compose shells out to
// scripts/compose-layers.py, which honours that layout and gilds the window,
// and the preview flips to the result. Reset empties the layout, which puts
// every sticker back exactly where room-part.py had it.
//
// The version dropdown on each layer offers, in order:
//   - the current sticker (canon/room-kit/v2/stickers/<part>.png)
//   - every RGBA sticker kept in canon/room-kit/v2/history/<part>/ - the
//     labelled archive of where that object has been. The directory need not
//     exist; make it when there is a version worth keeping.
//   - every raw candidate in canon/room-kit/v2/work/<part>-s*.png, so a seed
//     can be tried in one click. A raw candidate is worn through the layer's
//     own alpha and is NOT tone-fitted the way room-part.py fits it - it is
//     for choosing between seeds, not for judging final tone.

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const KIT = path.join(ROOT, "canon/room-kit/v2");
const STICKERS = path.join(KIT, "stickers");
const LAYOUT = path.join(KIT, "layout.json");
const HISTORY = path.join(KIT, "history");
const WORK = path.join(KIT, "work");
const PYTHON = process.env.PYTHON || "C:/Python313/python.exe";

const argv = process.argv.slice(2);
const optOf = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : fallback;
};
const PORT = Number(optOf("port", process.env.PORT || 8787));
const HOST = "127.0.0.1";

const readJson = (p, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
};

// ------------------------------------------------------------------ state
// canon/room-kit/v2/history/<part>/INDEX.md, written by scripts/object-history.py:
// a markdown table, one row per version. We want the verdict and the source
// path off it, so the dropdown says "v009 approved - approved" and so a work/
// candidate already archived is not offered twice.
function indexRows(part) {
  const p = path.join(HISTORY, part, "INDEX.md");
  const rows = new Map();
  if (!fs.existsSync(p)) return rows;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const c = line.split("|").map((s) => s.trim());
    if (c.length < 8 || !/^v\d+$/.test(c[1])) continue;
    rows.set(c[1], { version: c[1], date: c[2], label: c[3], verdict: c[5], source: c[6] });
  }
  return rows;
}

function versionsFor(part) {
  const out = [{ value: "", label: "current sticker (as room-part.py laid it)", kind: "current" }];
  const dir = path.join(HISTORY, part);
  const rows = indexRows(part);
  const archived = new Set([...rows.values()].map((r) => (r.source || "").replace(/\\/g, "/")));
  if (fs.existsSync(dir)) {
    const files = fs
      .readdirSync(dir)
      .filter((n) => /^v\d+-.*\.png$/i.test(n) && !/-in-context\.png$/i.test(n))
      .sort();
    for (const name of files) {
      const v = name.match(/^(v\d+)/)[1];
      const r = rows.get(v);
      const tag = r ? `${r.version} ${r.label}${r.verdict && r.verdict !== r.label ? " - " + r.verdict : ""}` : name.replace(/\.png$/i, "");
      out.push({ value: `history/${part}/${name}`, label: `history: ${tag}`, kind: "history" });
    }
  }
  // anything in work/ that the archive has not picked up yet - the lead may be
  // rendering while the desk is open
  if (fs.existsSync(WORK)) {
    for (const name of fs.readdirSync(WORK).filter((n) => new RegExp(`^${part}-s[0-9]+(-tall)?\\.png$`, "i").test(n)).sort()) {
      if (archived.has(`canon/room-kit/v2/work/${name}`)) continue;
      out.push({ value: `work/${name}`, label: `fresh candidate: ${name.replace(/\.png$/i, "")}`, kind: "work" });
    }
  }
  return out;
}

function state() {
  const manifest = readJson(path.join(STICKERS, "manifest.json"), null);
  if (!manifest) return { error: "No stickers yet. Run:  " + PYTHON + " scripts/stickers.py export" };
  const layoutDoc = readJson(LAYOUT, {});
  const layout = layoutDoc.layers && typeof layoutDoc.layers === "object" ? layoutDoc.layers : layoutDoc;
  const stickers = [...manifest.stickers].sort((a, b) => a.layerOrder - b.layerOrder);
  for (const s of stickers) s.versions = versionsFor(s.part);
  const composed = path.join(KIT, "plate-layers-signed.png");
  return {
    plate: manifest.plate,
    base: manifest.base,
    sign: manifest.sign,
    generated: manifest.generated,
    stickers,
    layout: layout && typeof layout === "object" ? layout : {},
    composedAt: fs.existsSync(composed) ? fs.statSync(composed).mtimeMs : 0,
  };
}

// ------------------------------------------------------------------ files
const MIME = { ".png": "image/png", ".json": "application/json", ".txt": "text/plain; charset=utf-8" };

function serveKitFile(rel, res) {
  // everything the page can ask for lives under the kit, and nowhere else
  const full = path.resolve(KIT, rel);
  if (!full.startsWith(path.resolve(KIT) + path.sep) || !fs.existsSync(full) || !fs.statSync(full).isFile()) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("not found: " + rel);
  }
  res.writeHead(200, {
    "Content-Type": MIME[path.extname(full).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(full).pipe(res);
}

const body = (req) =>
  new Promise((resolve, reject) => {
    let b = "";
    req.on("data", (c) => {
      b += c;
      if (b.length > 4e6) reject(new Error("body too large"));
    });
    req.on("end", () => resolve(b));
    req.on("error", reject);
  });

const json = (res, code, obj) => {
  res.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(obj));
};

function writeLayout(layers) {
  const doc = {
    _doc:
      "Written by scripts/sticker-desk.mjs and read by scripts/compose-layers.py. Per layer: dx, dy in " +
      "plate pixels from where room-part.py put it; visible; file, a version of that layer under " +
      "canon/room-kit/v2/. A layer this file does not mention keeps its own place and its enabled flag " +
      "from parts.json. Delete this file, or empty layers, to put everything back.",
    saved: new Date().toISOString(),
    layers,
  };
  fs.writeFileSync(LAYOUT, JSON.stringify(doc, null, 2), "utf8");
  return doc;
}

// ----------------------------------------------------------------- server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  try {
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      return res.end(PAGE);
    }
    if (req.method === "GET" && url.pathname === "/api/state") return json(res, 200, state());
    if (req.method === "GET" && url.pathname.startsWith("/f/"))
      return serveKitFile(decodeURIComponent(url.pathname.slice(3)), res);

    if (req.method === "POST" && url.pathname === "/api/layout") {
      const layers = JSON.parse((await body(req)) || "{}");
      writeLayout(layers);
      return json(res, 200, { ok: true, file: LAYOUT, layers: Object.keys(layers).length });
    }
    if (req.method === "POST" && url.pathname === "/api/reset") {
      writeLayout({});
      return json(res, 200, { ok: true, file: LAYOUT });
    }
    if (req.method === "POST" && url.pathname === "/api/compose") {
      return execFile(
        PYTHON,
        [path.join(ROOT, "scripts/compose-layers.py"), "--verify"],
        { cwd: ROOT, windowsHide: true, maxBuffer: 8e6 },
        (err, stdout, stderr) => {
          const out = `${stdout || ""}${stderr || ""}`.trim();
          json(res, 200, { ok: !err, output: out || (err ? String(err) : "(no output)") });
        }
      );
    }
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("not found");
  } catch (e) {
    json(res, 500, { ok: false, error: String(e && e.message ? e.message : e) });
  }
});

server.listen(PORT, HOST, () => {
  const s = state();
  console.log(`sticker desk  http://${HOST}:${PORT}`);
  if (s.error) console.log("  " + s.error);
  else console.log(`  ${s.stickers.length} stickers over ${s.base}, plate ${s.plate.w}x${s.plate.h}, cut ${s.generated}`);
  console.log(`  layout  ${LAYOUT}${fs.existsSync(LAYOUT) ? "" : "  (none yet - everything sits where room-part.py put it)"}`);
  console.log(`  history ${HISTORY}${fs.existsSync(HISTORY) ? "" : "  (none yet)"}`);
  console.log("  ctrl-c to stop");
});

// ------------------------------------------------------------------- page
const PAGE = String.raw`<!doctype html>
<meta charset="utf-8">
<title>Sticker desk - The Swinging Door</title>
<style>
  :root { --ink:#17150f; --paper:#f2efe6; --line:#cdc6b4; --hi:#8a5a1a; }
  * { box-sizing: border-box; }
  body { margin:0; height:100vh; display:flex; font:13px/1.45 "Segoe UI",system-ui,sans-serif;
         color:var(--ink); background:var(--paper); overflow:hidden; }
  #stage { flex:1; position:relative; overflow:hidden; background:#3a382f;
           display:flex; align-items:center; justify-content:center; }
  #room { position:relative; transform-origin:center center; box-shadow:0 0 0 1px #000, 0 12px 40px rgba(0,0,0,.55); }
  #room img { position:absolute; image-rendering:auto; user-select:none; -webkit-user-drag:none; }
  #base { left:0; top:0; }
  .sticker { cursor:grab; }
  .sticker.sel { outline:2px dashed var(--hi); outline-offset:1px; }
  .sticker.dragging { cursor:grabbing; }
  #preview { position:absolute; left:0; top:0; display:none; }
  body.showcomposed #preview { display:block; }
  body.showcomposed .sticker, body.showcomposed #base { visibility:hidden; }
  #panel { width:370px; min-width:370px; border-left:1px solid var(--line); background:var(--paper);
           display:flex; flex-direction:column; }
  header { padding:10px 12px; border-bottom:1px solid var(--line); }
  h1 { font-size:14px; margin:0 0 2px; letter-spacing:.04em; text-transform:uppercase; }
  .sub { font-size:11px; color:#6b6455; }
  #layers { flex:1; overflow:auto; }
  .row { padding:6px 12px; border-bottom:1px solid #e2ddcf; display:grid;
         grid-template-columns:auto 1fr auto; gap:6px 8px; align-items:center; cursor:pointer; }
  .row.sel { background:#e7e0cc; }
  .row.off .name { color:#9a927f; text-decoration:line-through; }
  .name { font-weight:600; }
  .meta { grid-column:2/4; font-size:11px; color:#6b6455; display:flex; gap:10px; }
  .meta b { font-weight:600; color:var(--ink); }
  select { grid-column:1/4; width:100%; font:11px/1.3 inherit; padding:2px; }
  footer { border-top:1px solid var(--line); padding:10px 12px; display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
  button { font:12px inherit; padding:5px 11px; border:1px solid var(--line); background:#fff; cursor:pointer; }
  button:hover { background:#fff8e8; }
  button.primary { background:var(--hi); color:#fff; border-color:var(--hi); }
  label.chk { display:flex; align-items:center; gap:4px; font-size:11px; }
  #log { padding:8px 12px; border-top:1px solid var(--line); font:11px/1.4 Consolas,monospace;
         white-space:pre-wrap; max-height:170px; overflow:auto; color:#4a4538; background:#eae5d6; }
  #hint { position:absolute; left:10px; bottom:8px; color:#cfc9b8; font-size:11px; text-shadow:0 1px 2px #000; }
</style>

<div id="stage">
  <div id="room"><img id="base"><img id="preview"></div>
  <div id="hint">drag a sticker &middot; arrows nudge 1px, shift 10px &middot; click empty room to deselect</div>
</div>

<div id="panel">
  <header>
    <h1>Sticker desk</h1>
    <div class="sub" id="head">loading&hellip;</div>
  </header>
  <div id="layers"></div>
  <footer>
    <button class="primary" id="save">Save layout</button>
    <button id="compose">Compose</button>
    <button id="reset">Reset</button>
    <label class="chk"><input type="checkbox" id="snap"> snap 8px</label>
    <label class="chk"><input type="checkbox" id="showc"> composed</label>
  </footer>
  <div id="log">ready.</div>
</div>

<script type="module">
const $ = (s) => document.querySelector(s);
const room = $("#room"), layersEl = $("#layers"), logEl = $("#log");
let S = null, L = {}, sel = null, scale = 1;
const log = (t) => { logEl.textContent = t; logEl.scrollTop = 0; };

const cfg = (id) => (L[id] ||= {});
const dxOf = (id) => Number(L[id]?.dx || 0);
const dyOf = (id) => Number(L[id]?.dy || 0);
const visOf = (s) => (L[s.part] && "visible" in L[s.part] ? !!L[s.part].visible : !!s.enabled);

function fit() {
  if (!S) return;
  const st = $("#stage").getBoundingClientRect();
  scale = Math.min((st.width - 40) / S.plate.w, (st.height - 40) / S.plate.h);
  room.style.width = S.plate.w + "px";
  room.style.height = S.plate.h + "px";
  room.style.transform = "scale(" + scale + ")";
}
addEventListener("resize", fit);

function place(s) {
  const img = document.getElementById("st-" + s.part);
  if (!img) return;
  img.style.left = s.x + dxOf(s.part) + "px";
  img.style.top = s.y + dyOf(s.part) + "px";
  img.style.display = visOf(s) ? "block" : "none";
}

function srcFor(s) {
  // A version in history/ or work/ is a WHOLE PLATE, not a cut sticker, so the
  // page keeps showing the cut sticker for position and Compose does the real
  // crop-and-wear through this layer's alpha. Drag placement is unaffected:
  // the box is the layer's, whichever version fills it.
  return "/f/stickers/" + s.file + "?t=" + Date.now();
}

function draw() {
  for (const img of [...room.querySelectorAll(".sticker")]) img.remove();
  for (const s of S.stickers) {
    const img = new Image();
    img.id = "st-" + s.part;
    img.className = "sticker";
    img.src = srcFor(s);
    img.style.zIndex = String(s.layerOrder);
    img.dataset.part = s.part;
    img.title = s.part;
    room.appendChild(img);
    place(s);
  }
  select(sel);
}

function panel() {
  layersEl.innerHTML = "";
  // topmost layer first, the way a layers panel reads
  for (const s of [...S.stickers].sort((a, b) => b.layerOrder - a.layerOrder)) {
    const row = document.createElement("div");
    row.className = "row" + (visOf(s) ? "" : " off") + (sel === s.part ? " sel" : "");
    row.dataset.part = s.part;

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = visOf(s);
    cb.onclick = (e) => { e.stopPropagation(); cfg(s.part).visible = cb.checked; place(s); panel(); };

    const name = document.createElement("div");
    name.className = "name";
    name.textContent = s.part;

    const ord = document.createElement("div");
    ord.className = "sub";
    ord.textContent = "#" + s.layerOrder;

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = "<span>" + s.w + "\u00d7" + s.h + "</span><span>dx <b>" + dxOf(s.part) +
      "</b> dy <b>" + dyOf(s.part) + "</b></span><span>" + (s.enabled ? "on in parts.json" : "off in parts.json") + "</span>";

    const sel2 = document.createElement("select");
    for (const v of s.versions) {
      const o = document.createElement("option");
      o.value = v.value; o.textContent = v.label;
      sel2.appendChild(o);
    }
    sel2.value = L[s.part]?.file || "";
    sel2.onclick = (e) => e.stopPropagation();
    sel2.onchange = () => {
      if (sel2.value) cfg(s.part).file = sel2.value; else delete cfg(s.part).file;
      const img = document.getElementById("st-" + s.part);
      if (img) img.src = srcFor(s);
      log(sel2.value
        ? s.part + " -> " + sel2.value +
          "\n(a whole-plate version: the page still shows the cut sticker for position. Press Compose to see it worn through this layer's alpha - untoned, so judge tone on a real build.)"
        : s.part + " -> current sticker");
      panel();
    };

    row.append(cb, name, ord, meta, sel2);
    row.onclick = () => select(s.part);
    layersEl.appendChild(row);
  }
}

function select(part) {
  sel = part;
  for (const img of room.querySelectorAll(".sticker")) img.classList.toggle("sel", img.dataset.part === part);
  for (const r of layersEl.querySelectorAll(".row")) r.classList.toggle("sel", r.dataset.part === part);
}

// ------------------------------------------------------------- dragging
let drag = null;
room.addEventListener("pointerdown", (e) => {
  const img = e.target.closest(".sticker");
  if (!img) { select(null); return; }
  const s = S.stickers.find((k) => k.part === img.dataset.part);
  select(s.part);
  drag = { s, x0: e.clientX, y0: e.clientY, dx: dxOf(s.part), dy: dyOf(s.part) };
  img.classList.add("dragging");
  img.setPointerCapture(e.pointerId);
  e.preventDefault();
});
room.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const snap = $("#snap").checked ? 8 : 1;
  const q = (v) => Math.round(v / snap) * snap;
  cfg(drag.s.part).dx = q(drag.dx + (e.clientX - drag.x0) / scale);
  cfg(drag.s.part).dy = q(drag.dy + (e.clientY - drag.y0) / scale);
  place(drag.s);
});
const endDrag = () => {
  if (!drag) return;
  document.getElementById("st-" + drag.s.part)?.classList.remove("dragging");
  log(drag.s.part + " at dx " + dxOf(drag.s.part) + ", dy " + dyOf(drag.s.part) + " (unsaved)");
  drag = null;
  panel();
};
room.addEventListener("pointerup", endDrag);
room.addEventListener("pointercancel", endDrag);

addEventListener("keydown", (e) => {
  if (!sel || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
  if (!step) return;
  const n = e.shiftKey ? 10 : 1;
  const s = S.stickers.find((k) => k.part === sel);
  cfg(sel).dx = dxOf(sel) + step[0] * n;
  cfg(sel).dy = dyOf(sel) + step[1] * n;
  place(s);
  panel();
  log(sel + " at dx " + dxOf(sel) + ", dy " + dyOf(sel) + " (unsaved)");
  e.preventDefault();
});

// -------------------------------------------------------------- actions
$("#save").onclick = async () => {
  const r = await (await fetch("/api/layout", { method: "POST", body: JSON.stringify(L) })).json();
  log("saved " + r.layers + " layers to\n" + r.file);
};
$("#compose").onclick = async () => {
  log("composing\u2026");
  await fetch("/api/layout", { method: "POST", body: JSON.stringify(L) });
  const r = await (await fetch("/api/compose", { method: "POST" })).json();
  log(r.output);
  $("#preview").src = "/f/plate-layers-signed.png?t=" + Date.now();
  $("#showc").checked = true;
  document.body.classList.add("showcomposed");
};
$("#reset").onclick = async () => {
  await fetch("/api/reset", { method: "POST" });
  L = {};
  for (const s of S.stickers) place(s);
  panel();
  log("layout reset: every sticker back where room-part.py put it, every layer back to its parts.json flag");
};
$("#showc").onchange = (e) => {
  document.body.classList.toggle("showcomposed", e.target.checked);
  if (e.target.checked && !$("#preview").src) $("#preview").src = "/f/plate-layers-signed.png?t=" + Date.now();
};

// ----------------------------------------------------------------- boot
const s = await (await fetch("/api/state")).json();
if (s.error) { log(s.error); } else {
  S = s; L = JSON.parse(JSON.stringify(s.layout || {}));
  $("#base").src = "/f/stickers/" + S.base;
  if (S.composedAt) $("#preview").src = "/f/plate-layers-signed.png?t=" + S.composedAt;
  $("#head").textContent = S.stickers.length + " layers over " + S.base + " \u00b7 " +
    S.plate.w + "\u00d7" + S.plate.h + " \u00b7 cut " + (S.generated || "");
  fit(); draw(); panel();
  log("The window sign is not a layer.\n" + (S.sign?.note || ""));
}
</script>
`;
