import sharp from "sharp";

// THE PLATE PIPELINE. The bar is drawn ONCE per cast — a "plate" with the
// television switched off and the chalkboard wiped — and never drawn again.
// Every cartoon is then assembled from that fixed picture:
//
//   1. pick the plate for the cast (duo / trio),
//   2. pick the SPEAKER VARIANT of that plate (same pixels, only the
//      speaker's mouth open and the listeners' eyes on the speaker — each
//      variant is generated once, pasted back into the plate by region, and
//      approved once),
//   3. drop the TV footage into the screen rectangle, typeset the chyron,
//   4. typeset the chalkboard,
//   5. typeset the caption beneath.
//
// Steps 3–5 are pure code: the screen and the board sit at fixed pixel
// coordinates in a fixed picture, so an insert lands in the identical place
// every time and the lettering is real type, never model glyphs. The only
// image-model calls left are the plate itself (once), each speaker variant
// (once) and the TV footage (one small still per gag, or none when the
// still library already has it).

export type Box = { x: number; y: number; w: number; h: number };

export type PlateSpec = {
  /** Plate pixel size; every box below is measured on this. */
  width: number;
  height: number;
  /** The television's GLASS (inside the bezel). */
  screen: Box;
  /** The chalkboard's SLATE (inside the wooden frame). */
  board: Box;
  /** Per character: the regions a speaker variant is allowed to change. */
  faces: Record<string, { mouth: Box; eyes: Box }>;
};

export type Cast = "duo" | "trio";

export const CAST: Record<Cast, string[]> = {
  duo: ["drew", "barclay"],
  trio: ["drew", "barclay", "abby"],
};

/** Repo paths. Approved plates live at the top; work-in-progress under work/. */
export const PLATE_DIR = "canon/plates";
export const platePath = (cast: Cast) => `${PLATE_DIR}/${cast}.png`;
export const plateSpecPath = (cast: Cast) => `${PLATE_DIR}/${cast}.json`;
export const speakerPlatePath = (cast: Cast, speaker: string) => `${PLATE_DIR}/${cast}-${speaker}.png`;
export const sourcePlatePath = (cast: Cast) => `${PLATE_DIR}/src/${cast}-source.png`;

// ------------------------------------------------------------- prompts
//
// Short prompts on purpose. The 38KB master prompt is the strip's
// argument with a model that keeps re-inventing the room; a plate makes
// that argument once. With a finished picture attached as @image1, the
// instruction is "same picture, these changes only", and nothing else.

const STYLE =
  "Antique steel-engraving cartoon style exactly as @image1: fine pen crosshatching and stippling, " +
  "full tonal range, black-and-white only, no colour, no photographic rendering.";

const NO_TEXT =
  "No caption, no speech balloon and no typeset words anywhere; the ONLY lettering in the picture is " +
  "the mirrored bar name on the window glass, exactly as in @image1.";

/** The blank DUO plate: the source panel with the screen off, the slate wiped,
 *  the labels wordless, the mouths shut, and the crop raised so the counter's
 *  near edge and both chair backs are inside the frame. */
export function blankDuoPrompt(): string {
  return [
    "Redraw @image1 as the SAME picture: the same two characters in the same poses and the same " +
      "framing, the same room, the same window, the same bottles, sconces, panelling and marble counter. " +
      STYLE,
    "Make ONLY these changes and nothing else:",
    "1. THE TELEVISION IS SWITCHED OFF. Its screen is one flat sheet of uniform dark grey glass with " +
      "NOTHING on it: no logo, no lettering, no picture, no reflection, no chart.",
    "2. THE CHALKBOARD IS WIPED CLEAN: bare dark slate inside its wooden frame with no writing at all, " +
      "no headline, no price, not a mark.",
    "3. EVERY BOTTLE LABEL IS WORDLESS: a plain paper panel, an oval, a band or a small crest — and not " +
      "one letter, number or word on any of them.",
    "4. Both mouths are closed. Drew's bill is shut; Barclay's lips are closed in a soft smile. Drew " +
      "and Barclay look at each other.",
    "5. Raise the crop slightly: the near edge of the marble counter, both forearms on the marble, the " +
      "drinks and the nut bowl, and the top of BOTH studded club-chair backs are all fully inside the " +
      "frame with a little clear space beneath them. The counter is ONE straight level slab across the " +
      "picture. Nothing below the counter — no legs, no stool, no floor.",
    "6. Abby's plain white bar towel is not in this picture; nothing lies on the marble but the two " +
      "drinks, their coasters and the nut bowl.",
    "@image2 shows the same bar empty, for the geometry of the counter and back bar only.",
    NO_TEXT,
  ].join("\n");
}

/** The blank TRIO plate is the approved duo plate plus Abby: the gentlemen,
 *  the room and the counter are inherited pixel for pixel in spirit, and the
 *  only new thing in the picture is her. */
export function blankTrioPrompt(): string {
  return [
    "Redraw @image1 as the SAME picture — same two gentlemen in the same poses, same framing, same " +
      "room, same counter, same bottles, same switched-off television and same blank chalkboard — " +
      "and ADD ONE character: Abby, the bartender in @image2. " +
      STYLE,
    "Abby stands on the FAR side of the marble counter, between the two gentlemen and a little behind " +
      "them, facing them. The counter's far edge crosses her at the waist and hides her below it. She " +
      "stands and they sit, so her head is HIGHER in the frame than either of theirs, in front of the " +
      "back bar's lower panelling, never covering the television or the chalkboard.",
    "She is SMILING — mouth corners clearly up, eyes bright — polishing a coupe glass with a PLAIN " +
      "white towel that carries no lettering. Her face, eyes, collar with its gem and open blouse are " +
      "exactly as @image2. Both her eyes are on the paper.",
    "Nothing else changes: the television stays switched off and blank, the chalkboard stays wiped, " +
      "every bottle label stays wordless, both gentlemen's mouths stay closed, the counter's near edge " +
      "and both chair backs stay inside the frame.",
    NO_TEXT,
  ].join("\n");
}

/** A speaker variant: identical picture, only the mouths and the eyes move. */
export function speakerPrompt(cast: Cast, speaker: string): string {
  const others = CAST[cast].filter((c) => c !== speaker);
  const name = (c: string) => c[0].toUpperCase() + c.slice(1);
  const mouth =
    speaker === "drew"
      ? "Drew's bill is SLIGHTLY PARTED, caught mid-word — the upper and lower mandible separate by a " +
        "small gap along the outer half of the bill, the bill's shape otherwise unchanged"
      : speaker === "barclay"
        ? "Barclay's mouth is OPEN mid-word — lips parted, a little of the dark inside of the mouth " +
          "showing, no tongue, no teeth bared, the muzzle otherwise unchanged"
        : "Abby's mouth is OPEN in a happy mid-word smile — corners up, lips parted, no teeth bared";
  return [
    `Redraw @image1 as EXACTLY the same picture. ${STYLE}`,
    `Make ONLY these changes: ${name(speaker)} is speaking. ${mouth}.`,
    `${others.map(name).join(" and ")} ${others.length > 1 ? "keep" : "keeps"} the mouth CLOSED and ` +
      `${others.length > 1 ? "look" : "looks"} at ${name(speaker)}: the eyes turned toward ${name(speaker)}'s face.`,
    "Every other pixel — the room, the counter, the bottles, the switched-off television, the blank " +
      "chalkboard, the clothes, the hands, the drinks — stays exactly as in @image1.",
    NO_TEXT,
  ].join("\n");
}

/** A TV still: engraved footage for the screen, drawn on its own at 3:2. */
export function tvStillPrompt(footage: string): string {
  return [
    "A single still frame of television news footage, drawn as an antique steel engraving: fine pen " +
      "crosshatching and stippling, full tonal range, black-and-white only, no colour.",
    `THE PICTURE: ${footage}`,
    "Composed simply and boldly so it reads at a glance when shown small. It fills the whole frame " +
      "edge to edge with no border, no bezel, no screen and no room around it.",
    "COUNT THE WORDS IN THE PICTURE: ZERO. No lettering, no numbers, no logo, no chyron, no ticker, " +
      "no chart axis labels, no signs — where the scene would carry writing, that surface is blank.",
  ].join("\n");
}

// ------------------------------------------------------------- geometry

const xml = (v: string) => v.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] as string);

/** Fit any generated image to the plate's exact pixel size. */
export async function toPlateSize(bytes: Buffer, spec: { width: number; height: number }): Promise<Buffer> {
  return sharp(bytes)
    .flatten({ background: "#ffffff" })
    .grayscale()
    .resize(spec.width, spec.height, { fit: "cover", position: "top" })
    .png()
    .toBuffer();
}

async function gray(bytes: Buffer): Promise<{ data: Buffer; w: number; h: number }> {
  const { data, info } = await sharp(bytes).grayscale().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

/**
 * The generated variant is the same picture, but a model never returns it
 * pixel-aligned. Find the shift that best lines the variant up with the
 * plate around a box — on the RING around it, not inside it, because inside
 * it is what changed — so the paste lands on the plate's own drawing.
 */
async function bestOffset(plate: Buffer, variant: Buffer, box: Box, radius = 40): Promise<{ dx: number; dy: number }> {
  const P = await gray(plate);
  const V = await gray(variant);
  const ring = Math.max(24, Math.round(Math.min(box.w, box.h) * 0.4));
  const x0 = Math.max(0, box.x - ring), y0 = Math.max(0, box.y - ring);
  const x1 = Math.min(P.w, box.x + box.w + ring), y1 = Math.min(P.h, box.y + box.h + ring);
  const inside = (x: number, y: number) => x >= box.x && x < box.x + box.w && y >= box.y && y < box.y + box.h;
  let best = { dx: 0, dy: 0, sad: Infinity };
  for (let dy = -radius; dy <= radius; dy += 2) {
    for (let dx = -radius; dx <= radius; dx += 2) {
      let sad = 0, n = 0;
      for (let y = y0; y < y1; y += 2) {
        const vy = y + dy;
        if (vy < 0 || vy >= V.h) continue;
        for (let x = x0; x < x1; x += 2) {
          if (inside(x, y)) continue;
          const vx = x + dx;
          if (vx < 0 || vx >= V.w) continue;
          sad += Math.abs(P.data[y * P.w + x] - V.data[vy * V.w + vx]);
          n++;
        }
      }
      if (n && sad / n < best.sad) best = { dx, dy, sad: sad / n };
    }
  }
  return { dx: best.dx, dy: best.dy };
}

/**
 * Paste only the given boxes of a generated variant back into the plate,
 * feathered at the edges. Everything outside the boxes is the plate itself,
 * so the room cannot drift no matter what the model did to it.
 */
export async function pasteRegions(plate: Buffer, variant: Buffer, boxes: Box[]): Promise<Buffer> {
  const meta = await sharp(plate).metadata();
  const W = meta.width!, H = meta.height!;
  const fitted = await sharp(variant).flatten({ background: "#ffffff" }).grayscale().resize(W, H, { fit: "cover", position: "top" }).png().toBuffer();
  let out = plate;
  for (const box of boxes) {
    const { dx, dy } = await bestOffset(out, fitted, box);
    const feather = Math.max(6, Math.round(Math.min(box.w, box.h) * 0.12));
    const sx = Math.max(0, Math.min(W - box.w, box.x + dx));
    const sy = Math.max(0, Math.min(H - box.h, box.y + dy));
    const patch = await sharp(fitted).extract({ left: sx, top: sy, width: box.w, height: box.h }).toBuffer();
    const maskSvg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${box.w}" height="${box.h}">` +
        `<rect x="${feather}" y="${feather}" width="${box.w - 2 * feather}" height="${box.h - 2 * feather}" rx="${feather}" fill="#fff"/></svg>`
    );
    const mask = await sharp(maskSvg).blur(feather / 2).grayscale().toBuffer();
    const patched = await sharp(patch).ensureAlpha().joinChannel(mask).png().toBuffer();
    out = await sharp(out).composite([{ input: patched, left: box.x, top: box.y }]).png().toBuffer();
  }
  return out;
}

// ------------------------------------------------------------- dressing

/** Put footage on the screen and typeset the chyron over it, CNBC grammar. */
export async function dressScreen(
  plate: Buffer,
  spec: PlateSpec,
  still: Buffer | null,
  chyron: string,
  time = "1:14 PM ET"
): Promise<Buffer> {
  const { x, y, w, h } = spec.screen;
  const band = Math.round(h * 0.17);
  const layers: sharp.OverlayOptions[] = [];
  if (still) {
    const footage = await sharp(still)
      .flatten({ background: "#ffffff" })
      .grayscale()
      .resize(w, h, { fit: "cover" })
      .linear(0.9, 8) // sit the footage a touch back from paper white so it reads as a lit screen, not a hole
      .png()
      .toBuffer();
    layers.push({ input: footage, left: x, top: y });
  }
  // The chyron is ONE line and it fits: shrink to the room left of the
  // timestamp rather than run under it.
  const timeFs = Math.round(band * 0.3);
  const timeW = Math.round(time.length * timeFs * 0.58);
  const room = w * 0.94 - timeW - w * 0.03;
  const fs = Math.max(10, Math.min(Math.round(band * 0.5), Math.floor(room / (Math.max(chyron.length, 1) * 0.6))));
  const bugW = Math.round(w * 0.16), bugH = Math.round(h * 0.2);
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0.18"/><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.22"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#v)"/>
  <rect x="${Math.round(w * 0.03)}" y="${Math.round(h * 0.05)}" width="${bugW}" height="${bugH}" fill="#111" fill-opacity="0.85"/>
  <text x="${Math.round(w * 0.03) + bugW / 2}" y="${Math.round(h * 0.05) + bugH * 0.48}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${Math.round(bugH * 0.36)}" fill="#fff">CNBC</text>
  <text x="${Math.round(w * 0.03) + bugW / 2}" y="${Math.round(h * 0.05) + bugH * 0.86}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${Math.round(bugH * 0.3)}" fill="#fff">LIVE</text>
  <rect x="0" y="${h - band}" width="${w}" height="${band}" fill="#0c0c0c"/>
  <rect x="0" y="${h - band}" width="${w}" height="3" fill="#ffffff" fill-opacity="0.9"/>
  <text x="${Math.round(w * 0.03)}" y="${h - band + band * 0.68}" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${fs}" fill="#fff">${xml(chyron.toUpperCase())}</text>
  <text x="${w - Math.round(w * 0.03)}" y="${h - band + band * 0.68}" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="${timeFs}" fill="#ddd">${xml(time)}</text>
</svg>`);
  layers.push({ input: await sharp(svg).png().toBuffer(), left: x, top: y });
  return sharp(plate).composite(layers).png().toBuffer();
}

/** Hand-lettered chalk on the slate: two to six short lines, centred. */
export async function dressBoard(plate: Buffer, spec: PlateSpec, lines: string[]): Promise<Buffer> {
  const { x, y, w, h } = spec.board;
  // A slate is narrow. Every line is broken to at most ~11 characters —
  // "HOUSE SPECIAL" becomes two lines — so the chalk stays big enough to
  // read; then the type is sized to the longest surviving line.
  const clean = lines
    .map((l) => l.trim())
    .filter(Boolean)
    .flatMap((l) => wrap(l, 11))
    .slice(0, 7);
  if (clean.length === 0) return plate;
  const longest = Math.max(...clean.map((l) => l.length));
  const fs = Math.max(12, Math.min(Math.round(h / (clean.length * 1.9)), Math.round((w * 0.9) / (longest * 0.7)), Math.round(h * 0.11)));
  const gap = Math.round(fs * 1.55);
  const blockH = gap * clean.length;
  const first = Math.round((h - blockH) / 2 + fs * 0.9);
  const rule = (yy: number) => `<path d="M${Math.round(w * 0.3)} ${yy}H${Math.round(w * 0.7)}" stroke="#e7e3da" stroke-opacity="0.8" stroke-width="2"/>`;
  const tspans = clean
    .map((l, i) => {
      const yy = first + i * gap;
      const price = /\$\s?\d/.test(l);
      return `<text x="${w / 2}" y="${yy}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${price ? Math.round(fs * 1.15) : fs}" fill="#ecebe6" fill-opacity="0.94" letter-spacing="1.5">${xml(l.toUpperCase())}</text>`;
    })
    .join("\n");
  const rules = clean.length > 1 ? rule(first + Math.round(fs * 0.55)) : "";
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  ${tspans}
  ${rules}
</svg>`);
  const chalk = await sharp(svg).png().toBuffer();
  return sharp(plate).composite([{ input: chalk, left: x, top: y }]).png().toBuffer();
}

// ------------------------------------------------------------- finishing

const STRIP_HEIGHT = 264;

function wrap(line: string, limit = 48): string[] {
  const words = line.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const wd of words) {
    const cand = cur ? `${cur} ${wd}` : wd;
    if (cur && cand.length > limit) {
      lines.push(cur);
      cur = wd;
    } else cur = cand;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** The house caption strip beneath the art: warm paper, hairline rule,
 *  attributed italic dialogue, never more than two lines. */
export function captionStrip(width: number, speaker: string, speech: string): Buffer {
  const name = speaker[0].toUpperCase() + speaker.slice(1);
  const lines = wrap(`${name}: “${speech.trim().replace(/^["“]/, "").replace(/["”]$/, "")}”`);
  if (lines.length > 2) throw new Error(`The caption runs ${lines.length} typeset lines — the house allows two. Cut it.`);
  const fontSize = 54, lineHeight = 64;
  const firstBaseline = (STRIP_HEIGHT - (lines.length - 1) * lineHeight) / 2 + 15;
  const tspans = lines.map((l, i) => `<tspan x="${width / 2}" y="${firstBaseline + i * lineHeight}">${xml(l)}</tspan>`).join("");
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${STRIP_HEIGHT}">
  <rect width="${width}" height="${STRIP_HEIGHT}" fill="#f8f5ee"/>
  <path d="M72 2H${width - 72}" stroke="#171717" stroke-width="2"/>
  <text text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" font-style="italic" fill="#171717">${tspans}</text>
</svg>`);
}

/** Art on top, a paper margin so the rule never touches the marble, the
 *  caption strip beneath. The art is never cropped or matted. */
export async function finishPlate(art: Buffer, speaker: string, speech: string): Promise<Buffer> {
  const meta = await sharp(art).metadata();
  const W = meta.width!, H = meta.height!;
  const margin = Math.round(H * 0.025);
  const strip = await sharp(captionStrip(W, speaker, speech)).png().toBuffer();
  return sharp({ create: { width: W, height: H + margin + STRIP_HEIGHT, channels: 3, background: "#f8f5ee" } })
    .composite([
      { input: art, left: 0, top: 0 },
      { input: strip, left: 0, top: H + margin },
    ])
    .png()
    .toBuffer();
}

/** One gag, assembled entirely in code from approved parts. */
export async function composeGag(input: {
  plate: Buffer; // the speaker variant of the cast's plate
  spec: PlateSpec;
  still: Buffer | null;
  chyron: string;
  board: string[];
  speaker: string;
  caption: string;
  time?: string;
}): Promise<Buffer> {
  let art = await dressScreen(input.plate, input.spec, input.still, input.chyron, input.time);
  art = await dressBoard(art, input.spec, input.board);
  return finishPlate(art, input.speaker, input.caption);
}

/** A revision pass on a candidate plate: the picture is @image1 and only
 *  the numbered changes happen. Used when a candidate is nearly right. */
export function revisePrompt(changes: string[]): string {
  return [
    "Redraw @image1 as the SAME picture: same characters, same poses, same framing, same room, " +
      "same television, same chalkboard, same bottles, everything exactly where it is. " + STYLE,
    `Make ONLY ${changes.length === 1 ? "this change" : "these changes"} and nothing else:`,
    ...changes.map((c, i) => `${i + 1}. ${c}`),
    NO_TEXT,
  ].join("\n");
}

export const CHANGE = {
  bottlesModern:
    "THE BOTTLES. Every bottle on the back bar is a MODERN, REAL-LOOKING spirits bottle — the shapes " +
    "of today's bourbon, gin, vodka, rye and scotch bottles, some tall, some squat, some square-" +
    "shouldered, a few with a cork or a metal cap — filled to different levels. Each carries a modern " +
    "printed label: a crest, a band, a medallion, a plain colour block with fine decorative lines, " +
    "designed the way a real brand would design it. THE LABELS ARE NOT LEGIBLE: any text-like marks " +
    "are too small and too fine to read, mere suggestion of type, and not one real letter, word or " +
    "number appears anywhere on any bottle.",
  counterFullWidth:
    "THE COUNTER. The marble counter runs the FULL WIDTH of the picture, from the right edge past " +
    "Barclay, between the two gentlemen, past Drew, all the way to the window wall at the left edge. " +
    "It is ONE straight, level slab: its near edge and its far edge are two horizontal lines, the " +
    "marble at exactly the same height beside Drew at the window end as in front of him. The " +
    "gentlemen sit AT it on the near side: each man's torso stands in front of the slab's near edge " +
    "and hides it where he sits, so the marble shows beside and between them, never as a band drawn " +
    "across a chest. Drinks and the nut bowl on the slab. Nothing below the counter.",
} as const;
