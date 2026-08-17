import sharp from "sharp";
import { PublishError } from "./githubPublish";

// Server-side dialogue typesetting — the same house spec as
// scripts/embed-dialogue.mjs (strip 264px, warm-white field, hairline
// rule, Georgia italic), applied when a cartoon arrives through the chat
// connector. The AI sends text-free art; the house sets the words. That
// split is deliberate: image models garble type, typography is cheap and
// deterministic here.

const STRIP_HEIGHT = 264;
const TARGET_WIDTH = 1200;

const xml = (value: string) =>
  value.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] as string);

function wrapDialogue(caption: string, limit = 48): string[] {
  const words = `“${caption.trim()}”`.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && candidate.length > limit) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  if (lines.length > 3) {
    throw new PublishError(400, "The caption is too long for three typeset lines — tighten it below ~140 characters.");
  }
  return lines;
}

function dialogueSvg(width: number, caption: string): Buffer {
  const lines = wrapDialogue(caption);
  const fontSize = lines.length === 3 ? 50 : 54;
  const lineHeight = 64;
  const firstBaseline = (STRIP_HEIGHT - (lines.length - 1) * lineHeight) / 2 + 15;
  const tspans = lines
    .map((line, i) => `<tspan x="${width / 2}" y="${firstBaseline + i * lineHeight}">${xml(line)}</tspan>`)
    .join("");
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${STRIP_HEIGHT}" viewBox="0 0 ${width} ${STRIP_HEIGHT}">
  <rect width="${width}" height="${STRIP_HEIGHT}" fill="#f8f5ee"/>
  <path d="M72 2H${width - 72}" stroke="#171717" stroke-width="2"/>
  <text text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" font-style="italic" font-weight="500" fill="#171717">${tspans}</text>
</svg>`);
}

/**
 * Turn incoming artwork (any reasonable square-ish or portrait image, PNG
 * or JPEG) into the finished house format: grayscale, width 1200, square
 * or 4:5 art region, dialogue strip typeset beneath. Never crops — odd
 * ratios are matted onto paper white.
 */
export async function finishCartoon(artBytes: Buffer, caption: string): Promise<Buffer> {
  let meta;
  try {
    meta = await sharp(artBytes).metadata();
  } catch {
    throw new PublishError(400, "That file doesn't decode as an image.");
  }
  if (!meta.width || !meta.height) throw new PublishError(400, "Cannot read the image dimensions.");
  const ratio = meta.height / meta.width;
  if (ratio < 0.8 || ratio > 1.6) {
    throw new PublishError(400, "Send square or portrait artwork (between 1:1 and about 2:3).");
  }

  // Nearest house shape: square below 1.125, else 4:5 portrait.
  const artHeight = ratio < 1.125 ? TARGET_WIDTH : Math.round((TARGET_WIDTH * 5) / 4);

  const art = await sharp(artBytes)
    .flatten({ background: "#ffffff" })
    .grayscale()
    .resize(TARGET_WIDTH, artHeight, { fit: "contain", background: "#ffffff" })
    .png()
    .toBuffer();

  const strip = await sharp(dialogueSvg(TARGET_WIDTH, caption)).png().toBuffer();

  return sharp({
    create: {
      width: TARGET_WIDTH,
      height: artHeight + STRIP_HEIGHT,
      channels: 3,
      background: "#ffffff",
    },
  })
    .composite([
      { input: art, top: 0, left: 0 },
      { input: strip, top: artHeight, left: 0 },
    ])
    .png()
    .toBuffer();
}
