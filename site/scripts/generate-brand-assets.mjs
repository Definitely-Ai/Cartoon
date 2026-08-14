// Deterministic social artwork. Typography stays in SVG where spelling,
// margins, and safe areas are exact; the latest cartoon supplies the art.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");
const cartoonsDir = path.join(repoRoot, "cartoons");
const output = path.resolve(here, "..", "public", "og.png");

// BRAND: replace these SVG strings if The Swinging Door name changes.

const editions = fs
  .readdirSync(cartoonsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== "_TEMPLATE")
  .map((entry) => {
    const directory = path.join(cartoonsDir, entry.name);
    const meta = JSON.parse(fs.readFileSync(path.join(directory, "meta.json"), "utf8"));
    return { directory, edition: Number(meta.edition) };
  })
  .sort((a, b) => b.edition - a.edition);

if (editions.length === 0) throw new Error("brand-assets: no published cartoons found");

const latestArtwork = path.join(editions[0].directory, "cartoon.png");
const latestMetadata = await sharp(latestArtwork).metadata();
if (!latestMetadata.width || !latestMetadata.height) {
  throw new Error(`brand-assets: cannot read the illustrated panel in ${latestArtwork}`);
}
const illustratedHeight = latestMetadata.height - 264;
if (![latestMetadata.width, Math.round((latestMetadata.width * 5) / 4)].includes(illustratedHeight)) {
  throw new Error(`brand-assets: cannot identify the illustrated panel in ${latestArtwork}`);
}
const artwork = await sharp(latestArtwork)
  .extract({ left: 0, top: 0, width: latestMetadata.width, height: illustratedHeight })
  .resize({ width: 408, height: 408, fit: "cover", position: "centre" })
  .grayscale()
  .png()
  .toBuffer();

const card = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f4f0e6"/>
  <rect x="24" y="24" width="1152" height="582" fill="none" stroke="#111" stroke-width="5"/>
  <path d="M72 73h565M72 82h565M72 473h565M72 482h565" stroke="#111" stroke-width="2"/>
  <text x="72" y="122" font-family="Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="5" fill="#111">A BARROOM CARTOON</text>
  <text x="72" y="198" font-family="Georgia, 'Times New Roman', serif" font-size="58" font-weight="700" letter-spacing="3" fill="#111">THE</text>
  <text x="72" y="272" font-family="Georgia, 'Times New Roman', serif" font-size="72" font-weight="700" letter-spacing="3" fill="#111">SWINGING</text>
  <text x="72" y="372" font-family="Georgia, 'Times New Roman', serif" font-size="106" font-weight="700" letter-spacing="5" fill="#111">DOOR</text>
  <text x="72" y="430" font-family="Arial, sans-serif" font-size="21" letter-spacing="4" fill="#111">POLITICS · MARKETS · AMERICAN LIFE</text>
  <text x="72" y="548" font-family="Georgia, 'Times New Roman', serif" font-size="24" font-style="italic" fill="#111">Dry wit. Black ink. The view from the next stool.</text>
  <rect x="710" y="68" width="432" height="432" fill="#fff" stroke="#111" stroke-width="5"/>
  <rect x="717" y="75" width="418" height="418" fill="none" stroke="#111" stroke-width="1"/>
  <text x="926" y="552" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="4" fill="#111">THE LATEST PANEL</text>
</svg>`;

await sharp(Buffer.from(card))
  .composite([{ input: artwork, left: 722, top: 80 }])
  .png({ compressionLevel: 9 })
  .toFile(output);

console.log(`brand-assets: wrote ${path.relative(repoRoot, output)} from edition ${editions[0].edition}`);
