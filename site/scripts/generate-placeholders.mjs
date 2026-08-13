// Generates canon-informed art studies for every cartoon. These are deliberately
// labelled placeholders; commissioned art should replace cartoon.png in place.
// Run from /site with `npm run placeholders -- --force`.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const cartoonsDir = path.resolve(here, "..", "..", "cartoons");
const force = process.argv.includes("--force");

const concepts = {
  1: { tv: "DOW  −312", board: "HOUSE RULE / No hot tips", prop: "papers", drew: "arch", mango: "listening" },
  2: { tv: "MANAGED / ASSETS", board: "TODAY'S SPECIAL / COMPOUND INTEREST", prop: "receipt", drew: "explaining", mango: "reading" },
  3: { tv: "MARKETS OPEN", board: "PATIENCE / served daily", prop: "clock", drew: "dry", mango: "watching" },
  4: { tv: "COIN  ↑  ↓", board: "NOW ACCEPTING / actual money", prop: "coin", drew: "explaining", mango: "phone" },
  5: { tv: "WEEK AHEAD", board: "FORECAST / partly certain", prop: "chart", drew: "arch", mango: "listening" },
  6: { tv: "RETIREMENT", board: "HAPPY HOUR / 4–?", prop: "calendar", drew: "dry", mango: "reading" },
};

const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);

function propSvg(kind) {
  if (kind === "papers") return `<g transform="translate(862 785) rotate(-5)"><path class="paper" d="M-65-52h130v104H-65z"/><path class="fine" d="M-45-27h91M-45-5h70M-45 17h83"/><path class="ink" d="M-12-11l25 22M13-11l-25 22"/></g>`;
  if (kind === "receipt") return `<g transform="translate(858 775) rotate(4)"><path class="paper" d="M-52-86h104v157l-13-9-13 9-13-9-13 9-13-9-13 9-13-9-13 9z"/><path class="fine" d="M-32-55h64M-32-31h64M-32-7h47M-32 28h64"/><text class="tiny" y="52">1%</text></g>`;
  if (kind === "clock") return `<g transform="translate(876 760)"><circle r="65" class="paper"/><path class="ink" d="M0-49v12M49 0H37M0 49V37M-49 0h12M0 0V-34M0 0l30 9"/></g>`;
  if (kind === "coin") return `<g transform="translate(866 778) rotate(-8)"><circle r="58" class="wash"/><circle r="49" class="fine nofill"/><path class="ink" d="M-15-30v60M9-30v60M-28-20h42q24 0 8 20 19 19-10 23h-40"/></g>`;
  if (kind === "chart") return `<g transform="translate(858 790)"><path class="fine" d="M-75-55v115H80"/><path class="ink nofill" d="M-61 40l31-35 30 17 32-61 34 25"/><path class="fine" d="M58-21l8 7-4 10"/></g>`;
  return `<g transform="translate(866 775) rotate(2)"><path class="paper" d="M-64-68h128V65H-64z"/><path class="ink" d="M-64-35H64M-35-82v28M35-82v28"/><text class="number" y="35">65?</text></g>`;
}

function panelSvg(meta) {
  const c = concepts[meta.edition] ?? concepts[1];
  const odd = meta.edition % 2;
  const tvX = odd ? 112 : 815;
  const chalkX = odd ? 785 : 92;
  const drewX = odd ? 350 : 430;
  const mangoX = odd ? 650 : 690;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <defs>
    <filter id="wobble" x="-3%" y="-3%" width="106%" height="106%"><feTurbulence baseFrequency=".012" numOctaves="2" seed="${meta.edition + 7}" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5"/></filter>
    <filter id="wash"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="${meta.edition}" result="raw"/><feColorMatrix in="raw" type="saturate" values="0" result="n"/><feComposite in="n" in2="SourceGraphic" operator="in" result="t"/><feBlend in="SourceGraphic" in2="t" mode="multiply"/></filter>
    <style>
      .ink{fill:none;stroke:#161616;stroke-width:7;stroke-linecap:round;stroke-linejoin:round}.fine{fill:none;stroke:#242424;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round}.hair{fill:none;stroke:#191919;stroke-width:2.2;stroke-linecap:round}.wash{fill:#b8b8b8;stroke:#171717;stroke-width:6;filter:url(#wash)}.lightwash{fill:#dedede;stroke:#171717;stroke-width:5;filter:url(#wash)}.paper{fill:#f7f7f7;stroke:#171717;stroke-width:5}.nofill{fill:none}.sign{font:700 23px Georgia,serif;letter-spacing:1px;text-anchor:middle;fill:#161616}.small{font:italic 17px Georgia,serif;text-anchor:middle;fill:#222}.tiny{font:700 22px Georgia,serif;text-anchor:middle;fill:#111}.number{font:700 43px Georgia,serif;text-anchor:middle;fill:#111}
    </style>
  </defs>
  <rect width="1200" height="1200" fill="#f7f7f7"/>
  <g filter="url(#wobble)">
    <!-- restrained, old American bar: paneling, window, television, chalkboard -->
    <path class="fine" d="M30 70h1140v1080H30zM45 680h1110M45 350h1110M60 365v300m180-300v300m720-300v300m180-300v300"/>
    <path class="lightwash" d="M448 95h305v348H448z"/><path class="fine" d="M600 96v347M449 264h304"/>
    <g transform="translate(600 235) scale(-1 1)"><text class="sign">THE SWINGING DOOR</text></g>
    <g transform="translate(${tvX} 105)"><path class="wash" d="M0 0h270v160H0z"/><path class="fine" d="M24 26h222v92H24zM102 160l-18 31m84-31 18 31m-111 0h120"/><text class="sign" x="135" y="67">${esc(c.tv.split(" / ")[0])}</text><text class="small" x="135" y="98">${esc(c.tv.split(" / ")[1] ?? "LIVE")}</text></g>
    <g transform="translate(${chalkX} 430) rotate(${odd ? 1 : -1})"><path d="M0 0h280v145H0z" fill="#282827" stroke="#111" stroke-width="7"/><text x="140" y="54" fill="#f2f2f2" class="sign">${esc(c.board.split(" / ")[0])}</text><text x="140" y="94" fill="#f2f2f2" class="small">${esc(c.board.split(" / ")[1] ?? "")}</text><path d="M35 117q75-13 145 1t65-5" stroke="#eee" stroke-width="2" fill="none"/></g>
    <path class="fine" d="M72 312l55-65 55 65zM95 312v38m64-38v38"/><path class="hair" d="M510 165h70m40 0h70M72 625q70-28 142 0"/>

    <!-- solid mahogany bar and fixtures -->
    <path class="wash" d="M36 820Q590 797 1164 820v245H36z"/><path class="ink" d="M36 820q555-23 1128 0M38 885h1125M115 893v160m970-160v160"/><path class="hair" d="M66 930h1060M66 953h1060M66 976h1060M66 999h1060"/>
    <ellipse class="lightwash" cx="${drewX + 58}" cy="840" rx="91" ry="18"/><ellipse class="lightwash" cx="${mangoX + 37}" cy="840" rx="88" ry="18"/>

    <!-- Drew: elegant, anthropomorphic flamingo; expressive ink anatomy -->
    <g transform="translate(${drewX} 0)">
      <path class="ink" d="M53 706q-29-77 1-143 31-70 10-129-18-50-6-89"/><path class="hair" d="M43 697q-17-75 17-133M67 541q22-57 5-104"/>
      <path class="lightwash" d="M27 337q-5-56 43-79 49-21 91 6 31 20 25 58-7 45-68 52-61 7-91-37z"/>
      <path class="wash" d="M29 309l-116 31 111 30q17-24 5-61z"/><path class="fine" d="M-86 340l83 2"/>
      <circle cx="126" cy="303" r="6" fill="#111"/><path class="fine" d="M105 283q23-15 44 1"/>
      <path d="M52 404l-37-24-3 48 40-19 41 19-3-48z" fill="#232323"/>
      <path class="ink" d="M54 704l-5 177m21-177 44 174M17 881h67m6-3h63"/>
      <path class="fine" d="M20 545q-34 63-13 125M87 541q49 42 66 101"/>
      <path class="paper" d="M122 673h102l-51 94z"/><path class="fine" d="M173 767v62m-40 1h80"/>
      <circle cx="151" cy="703" r="6" fill="#333"/><circle cx="173" cy="703" r="6" fill="#333"/><circle cx="195" cy="703" r="6" fill="#333"/>
      ${c.drew === "explaining" ? '<path class="ink" d="M91 545q78-42 137-12"/><path class="fine" d="M221 520l18 12-20 8"/>' : '<path class="fine" d="M91 544q34 28 59 28"/>'}
    </g>

    <!-- Mango: tailored retriever patron, jacket, lapel pin, old fashioned -->
    <g transform="translate(${mangoX} 0)">
      <path class="wash" d="M-20 781q8-171 58-218 73-68 153 0 53 47 64 218z"/>
      <path class="lightwash" d="M21 470q-3-81 91-100 94 18 92 100-2 96-92 112-88-18-91-112z"/>
      <path class="wash" d="M40 415q-79 5-91 91 43 6 87-42M184 415q79 5 91 91-43 6-87-42"/>
      <path class="paper" d="M62 482q8-58 50-58 44 0 54 58-9 62-54 67-43-7-50-67z"/>
      <ellipse cx="112" cy="464" rx="17" ry="13" fill="#171717"/><path class="fine" d="M112 477q-13 29-38 11m38-11q13 29 38 11"/>
      <circle cx="75" cy="426" r="7" fill="#111"/><circle cx="151" cy="426" r="7" fill="#111"/><path class="fine" d="M52 401q24-17 48-3m26 0q24-14 47 4"/>
      <path class="paper" d="M39 563l73 98 78-98-21 218H56z"/><path class="fine" d="M112 661v120M70 579l42 82m58-82-58 82"/>
      <g transform="translate(151 635)"><path class="paper" d="M0 0h38v27H0z"/><path class="hair" d="M19 1v25M2 13h34"/></g>
      <path class="paper" d="M190 695h86v98q-43 15-86 0z"/><path class="fine" d="M197 730q38 12 72 0"/><rect x="212" y="707" width="24" height="16" rx="5" fill="#bbb"/>
      ${c.mango === "phone" ? '<path class="ink" d="M-1 622q-53 19-52 87"/><rect class="paper" x="-83" y="684" width="53" height="83" rx="7"/><circle cx="-57" cy="751" r="3"/>' : c.mango === "reading" ? '<path class="fine" d="M18 619q-48 20-61 73"/>' : '<path class="fine" d="M10 610q-45 15-61 52"/>'}
    </g>
    ${propSvg(c.prop)}
    <path class="hair" d="M48 1117q198-8 387 0t360 0 357 0"/>
  </g>
  <g transform="translate(600 1161)"><rect x="-208" y="-21" width="416" height="32" fill="#f7f7f7"/><text x="0" y="2" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" letter-spacing="3" fill="#333">PLACEHOLDER STUDY • NOT FOR PUBLICATION • ${String(meta.edition).padStart(2, "0")}</text></g>
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
  await sharp(Buffer.from(panelSvg(meta))).png({ compressionLevel: 9 }).toFile(out);
  console.log(`generated editorial placeholder: ${folder}/cartoon.png (1200x1200)`);
  generated++;
}

console.log(generated === 0 ? "all cartoon placeholders already present" : `done: ${generated} editorial placeholder(s)`);
