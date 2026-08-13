// Seeds /options with sample daily proofs so the Back Room is demoable
// before the art agent starts delivering real candidates. Same B&W
// SVG-to-PNG technique as the cartoon placeholders; "PROOF — OPTION N"
// instead of "ARTWORK PENDING" so drafts are visually distinct from
// published placeholders. Run once from /site:
//   node scripts/generate-sample-options.mjs
// Existing files are never overwritten.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const optionsDir = path.resolve(here, "..", "..", "options");

// Three days of demo material: one already ran (matches the published
// 2026-08-11 edition), one is an overdue decision, one is "today's" lineup.
const DAYS = {
  "2026-08-11": {
    options: [
      { title: "The Number", caption: "My number keeps moving, Abby. It's the only thing outperforming." },
      { title: "The Retirement Number", caption: "You can absolutely retire at sixty-five, Mango. The question is which sixty-five." },
      { title: "Early Retirement", caption: "He retired at nine this morning. By noon he was back." },
    ],
    selected: { option: 2, slug: "2026-08-11-the-retirement-number", publishedAt: "2026-08-11T21:00:00Z" },
  },
  "2026-08-12": {
    options: [
      { title: "The Committee", caption: "Minutes of the last meeting: ninety of them, Mango." },
      { title: "Index Funds", caption: "I'm passive aggressive, Mango. I buy the index and complain about it." },
      { title: "The Tab", caption: "Your tab is diversified across three bartenders, sir." },
    ],
  },
  "2026-08-13": {
    options: [
      { title: "The Soft Landing", caption: "They've achieved a soft landing, Mango. Nobody can say on what." },
      { title: "House View", caption: "The house view is that you should both switch to water." },
      { title: "Breaking News", caption: "Turn it up, Abby. I want to hear nothing, louder." },
    ],
  },
};

function proofSvg({ width, height, n }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  <rect x="3" y="3" width="${width - 6}" height="${height - 6}" fill="none" stroke="#000000" stroke-width="6"/>
  <rect x="24" y="24" width="${width - 48}" height="${height - 48}" fill="none" stroke="#000000" stroke-width="1" stroke-dasharray="8 8"/>
  <text x="${width / 2}" y="${height / 2 - 18}" text-anchor="middle" font-family="monospace" font-size="${Math.round(width / 32)}" letter-spacing="6" fill="#000000">PROOF</text>
  <text x="${width / 2}" y="${height / 2 + 34}" text-anchor="middle" font-family="monospace" font-size="${Math.round(width / 26)}" letter-spacing="6" fill="#000000">OPTION ${n}</text>
</svg>`;
}

for (const [day, spec] of Object.entries(DAYS)) {
  const dir = path.join(optionsDir, day);
  fs.mkdirSync(dir, { recursive: true });

  for (let i = 0; i < spec.options.length; i++) {
    const n = i + 1;
    const pngPath = path.join(dir, `option-${n}.png`);
    const jsonPath = path.join(dir, `option-${n}.json`);
    // Vary shape per option so the light table proves mixed aspect ratios.
    const portrait = n !== 2;
    const width = portrait ? 1200 : 1400;
    const height = portrait ? 1500 : 1400;
    if (!fs.existsSync(pngPath)) {
      await sharp(Buffer.from(proofSvg({ width, height, n }))).png().toFile(pngPath);
      console.log(`generated options/${day}/option-${n}.png`);
    }
    if (!fs.existsSync(jsonPath)) {
      fs.writeFileSync(jsonPath, `${JSON.stringify({ ...spec.options[i], tags: [] }, null, 2)}\n`);
    }
  }

  const selectedPath = path.join(dir, "selected.json");
  if (spec.selected && !fs.existsSync(selectedPath)) {
    fs.writeFileSync(selectedPath, `${JSON.stringify(spec.selected, null, 2)}\n`);
  }
}

console.log("sample options ready");
