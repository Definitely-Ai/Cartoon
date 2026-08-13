// Generates clearly labelled, canon-informed mock artwork for every cartoon.
// These are layout/demo assets only; final commissioned art should overwrite
// cartoon.png in each cartoon folder. Run from /site with `npm run placeholders`.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const cartoonsDir = path.resolve(here, "..", "..", "cartoons");
const force = process.argv.includes("--force");

const concepts = {
  1: { tv: "MARKET / FED", board: "TODAY: MIXED SIGNALS", prop: "pie", speaker: "drew" },
  2: { tv: "FEES ↓*", board: "EXPLANATIONS: MARKET PRICE", prop: "receipt", speaker: "drew" },
  3: { tv: "OPEN 1:00:00", board: "PATIENCE ON TAP", prop: "clock", speaker: "mango" },
  4: { tv: "CRYPTO ↑↓↑", board: "NEW! DIGITAL COASTERS", prop: "coin", speaker: "drew" },
  5: { tv: "WEEK AHEAD: ?", board: "FORECAST: WEATHER", prop: "chart", speaker: "drew" },
  6: { tv: "RETIREMENT", board: "HAPPY HOUR: 65–?", prop: "calendar", speaker: "mango" },
};

const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);

function captionLines(caption, max = 62) {
  const lines = [];
  for (const word of caption.split(/\s+/)) {
    const current = lines.at(-1);
    if (!current || `${current} ${word}`.length > max) lines.push(word);
    else lines[lines.length - 1] = `${current} ${word}`;
  }
  return lines.map((line, index) => `<tspan x="600" dy="${index === 0 ? 0 : 42}">${esc(line)}</tspan>`).join("");
}

function propSvg(kind, x, y) {
  if (kind === "pie") return `<circle cx="${x}" cy="${y}" r="54" fill="#eee" stroke="#111" stroke-width="5"/><path d="M${x} ${y}L${x} ${y-54}A54 54 0 0 1 ${x+47} ${y+27}Z" fill="#777" stroke="#111" stroke-width="4"/>`;
  if (kind === "receipt") return `<path d="M${x-42} ${y-72}h84v118l-14-9-14 9-14-9-14 9-14-9-14 9z" fill="#fff" stroke="#111" stroke-width="5"/><path d="M${x-25} ${y-42}h50m-50 22h50m-50 22h36" stroke="#111" stroke-width="4"/>`;
  if (kind === "clock") return `<circle cx="${x}" cy="${y}" r="55" fill="#fff" stroke="#111" stroke-width="6"/><path d="M${x} ${y}v-37m0 37l34 8" stroke="#111" stroke-width="6" stroke-linecap="round"/>`;
  if (kind === "coin") return `<circle cx="${x}" cy="${y}" r="50" fill="#ddd" stroke="#111" stroke-width="7"/><text x="${x}" y="${y+17}" text-anchor="middle" font-family="serif" font-size="52">₿?</text>`;
  if (kind === "chart") return `<path d="M${x-65} ${y+48}V${y-55}M${x-65} ${y+48}h130" stroke="#111" stroke-width="5"/><path d="M${x-53} ${y+28}l30-32 27 19 28-53 24 24" fill="none" stroke="#111" stroke-width="7"/>`;
  return `<rect x="${x-57}" y="${y-55}" width="114" height="105" rx="5" fill="#fff" stroke="#111" stroke-width="6"/><path d="M${x-57} ${y-24}h114M${x-30} ${y-68}v25M${x+30} ${y-68}v25" stroke="#111" stroke-width="6"/><text x="${x}" y="${y+28}" text-anchor="middle" font-family="serif" font-size="54">65</text>`;
}

function panelSvg({ width, height, meta }) {
  const c = concepts[meta.edition] ?? concepts[1];
  const speech = c.speaker === "mango" ? meta.caption : meta.caption;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1200 1500">
  <rect width="1200" height="1500" fill="#fff"/>
  <rect x="18" y="18" width="1164" height="1464" fill="none" stroke="#111" stroke-width="8"/>
  <!-- permanent, unmistakable mock-art label -->
  <rect x="18" y="18" width="1164" height="58" fill="#111"/>
  <text x="600" y="57" text-anchor="middle" font-family="monospace" font-size="25" letter-spacing="5" fill="#fff">PLACEHOLDER ART • NOT FOR PUBLICATION • EDITION ${meta.edition}</text>

  <!-- the warm, established Swinging Door bar -->
  <path d="M40 980H1160M40 1100H1160M80 1100v280m1010-280v280" stroke="#111" stroke-width="9"/>
  <path d="M40 750h1120M110 750V290h280v460M810 750V250h300v500" fill="none" stroke="#555" stroke-width="5"/>
  <path d="M825 270h270v250H825z" fill="#eee" stroke="#111" stroke-width="7"/>
  <text x="960" y="365" text-anchor="middle" font-family="serif" font-size="34">ROOD GNIGNIWS</text>
  <text x="960" y="410" text-anchor="middle" font-family="serif" font-size="19">(reversed window sign)</text>
  <rect x="90" y="155" width="320" height="170" rx="9" fill="#ddd" stroke="#111" stroke-width="8"/>
  <text x="250" y="218" text-anchor="middle" font-family="monospace" font-size="26">ON THE TV</text>
  <text x="250" y="270" text-anchor="middle" font-family="monospace" font-size="27" font-weight="bold">${esc(c.tv)}</text>
  <rect x="760" y="555" width="350" height="150" fill="#333" stroke="#111" stroke-width="7"/>
  <text x="935" y="615" text-anchor="middle" font-family="monospace" font-size="19" fill="#fff">CHALKBOARD SPECIAL</text>
  <text x="935" y="660" text-anchor="middle" font-family="monospace" font-size="20" fill="#fff">${esc(c.board)}</text>

  <!-- Drew: elegant flamingo, bowtie, martini with three olives -->
  <path d="M420 865c-76-50-77-153-13-222 42-45 55-91 16-127" fill="none" stroke="#111" stroke-width="18" stroke-linecap="round"/>
  <ellipse cx="427" cy="478" rx="60" ry="49" fill="#eee" stroke="#111" stroke-width="7"/>
  <path d="M376 480l-108 35 101 28" fill="#ddd" stroke="#111" stroke-width="7"/>
  <circle cx="447" cy="463" r="7"/>
  <path d="M405 580l-35-22v46zM411 580l35-22v46z" fill="#111"/>
  <path d="M412 864v240m25-240l47 240" stroke="#111" stroke-width="11"/>
  <path d="M384 1104h52m27 0h58" stroke="#111" stroke-width="10" stroke-linecap="round"/>
  <path d="M500 983h105l-52 76zM553 1059v42m-35 0h70" fill="#fff" stroke="#111" stroke-width="6"/>
  <circle cx="532" cy="1007" r="7"/><circle cx="553" cy="1007" r="7"/><circle cx="574" cy="1007" r="7"/>

  <!-- Mango: earnest retriever, jacket, flag pin, old fashioned -->
  <circle cx="700" cy="710" r="112" fill="#ddd" stroke="#111" stroke-width="8"/>
  <path d="M620 640q-90 10-78 113q50-25 88-68M780 640q90 10 78 113q-50-25-88-68" fill="#aaa" stroke="#111" stroke-width="7"/>
  <ellipse cx="700" cy="748" rx="61" ry="48" fill="#eee" stroke="#111" stroke-width="5"/>
  <circle cx="662" cy="692" r="8"/><circle cx="738" cy="692" r="8"/><ellipse cx="700" cy="730" rx="18" ry="13"/>
  <path d="M610 825q90-55 180 0l64 275H548z" fill="#bbb" stroke="#111" stroke-width="8"/>
  <path d="M700 838l-45 150m45-150l45 150" stroke="#fff" stroke-width="6"/>
  <rect x="762" y="863" width="32" height="23" fill="#fff" stroke="#111" stroke-width="3"/><path d="M773 864v21m-10-11h30" stroke="#111" stroke-width="3"/>
  <rect x="800" y="987" width="82" height="92" rx="8" fill="#ddd" stroke="#111" stroke-width="6"/><path d="M810 1022h62" stroke="#111" stroke-width="4"/>

  <!-- edition-specific visual-gag prop -->
  ${propSvg(c.prop, 995, 955)}
  <ellipse cx="595" cy="1130" rx="90" ry="16" fill="#ddd" stroke="#111" stroke-width="4"/>
  <ellipse cx="830" cy="1130" rx="80" ry="16" fill="#ddd" stroke="#111" stroke-width="4"/>

  <!-- caption is inside the mock image only to make exported assets self-identifying -->
  <rect x="80" y="1210" width="1040" height="190" rx="18" fill="#fff" stroke="#111" stroke-width="5"/>
  <text x="600" y="1260" text-anchor="middle" font-family="monospace" font-size="20" letter-spacing="3">MOCK COMPOSITION — FINAL CAPTION WILL BE SET BY THE SITE</text>
  <text x="600" y="1320" text-anchor="middle" font-family="serif" font-style="italic" font-size="29">${captionLines(`“${speech}”`)}</text>
  <text x="1110" y="1440" text-anchor="end" font-family="monospace" font-size="20">PLACEHOLDER / No. ${meta.edition}</text>
  </svg>`;
}

const folders = fs.readdirSync(cartoonsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== "_TEMPLATE")
  .map((entry) => entry.name).sort();

let generated = 0;
for (const folder of folders) {
  const dir = path.join(cartoonsDir, folder);
  const out = path.join(dir, "cartoon.png");
  if (fs.existsSync(out) && !force) continue;
  const meta = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8"));
  const portrait = meta.edition % 2 === 1;
  const width = portrait ? 1200 : 1400;
  const height = portrait ? 1500 : 1400;
  const svg = panelSvg({ width, height, meta });
  await sharp(Buffer.from(svg)).resize(width, height, { fit: "fill" }).png().toFile(out);
  console.log(`generated labelled placeholder: ${folder}/cartoon.png (${width}x${height})`);
  generated++;
}

console.log(generated === 0 ? "all cartoon placeholders already present" : `done: ${generated} labelled placeholder(s)`);
