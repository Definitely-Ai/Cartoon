import sharp from "sharp";
import { quadFromBox, warpLayerToQuad, type Quad } from "./warp";

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
  /** The same two surfaces as the FOUR CORNERS they actually have in the
   *  drawing (TL, TR, BR, BL) — the room is seen at an angle, so neither is
   *  an upright rectangle. When present, the insets are perspective-warped
   *  onto these; the boxes above stay for the face pastes and as a fallback. */
  screenQuad?: Quad;
  boardQuad?: Quad;
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
//
// An inset is built flat, as an upright layer the size of the surface's
// bounding box, then laid onto the surface's real four corners with a
// perspective warp (lib/warp.ts), so it sits IN the room instead of on top
// of it. The founder's rulings of 2026-09-02: the television must read as a
// real lit set carrying ordinary broadcast footage — not a fake screen, not
// an overdramatic news graphic — and the chalk must read as chalk written
// by a hand, never as a typeface.

/** Where an inset lands: the quad when the spec has one, else the box. */
function surface(spec: PlateSpec, which: "screen" | "board"): { quad: Quad; w: number; h: number } {
  const box = spec[which];
  const quad = (which === "screen" ? spec.screenQuad : spec.boardQuad) ?? quadFromBox(box);
  const xs = quad.map((p) => p[0]), ys = quad.map((p) => p[1]);
  return { quad, w: Math.round(Math.max(...xs) - Math.min(...xs)), h: Math.round(Math.max(...ys) - Math.min(...ys)) };
}

/** Lay a flat layer onto a surface of the plate. */
async function lay(plate: Buffer, layer: Buffer, quad: Quad): Promise<Buffer> {
  const meta = await sharp(plate).metadata();
  const warped = await warpLayerToQuad(layer, quad, meta.width!, meta.height!);
  return sharp(plate).composite([{ input: warped, left: 0, top: 0 }]).png().toBuffer();
}

/**
 * The television's picture as a flat layer: the footage toned like a lit LCD in
 * a dim room, with the SAME broadcast furniture the rest of the desk uses
 * (screenOverlay) laid over it. Built flat and then warped onto the screen's
 * four real corners by dressScreen, so the picture faces exactly where the
 * television faces — a still dropped in square reads as a sticker on the wall.
 */
export async function screenLayer(w: number, h: number, still: Buffer | null, chyron: string, time = "1:14 PM ET"): Promise<Buffer> {
  const base = still
    ? await sharp(still)
        .flatten({ background: "#ffffff" })
        .grayscale()
        .resize(w, h, { fit: "cover" })
        // A screen is lit: its white sits a little under the paper's and its
        // black a little over the room's. Compressing harder turns it to fog.
        .linear(0.84, 9)
        .png()
        .toBuffer()
    : await sharp({ create: { width: w, height: h, channels: 3, background: "#1a1a1a" } }).png().toBuffer();
  const glass = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.09"/><stop offset="0.45" stop-color="#fff" stop-opacity="0.02"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="vig" cx="0.5" cy="0.5" r="0.78">
      <stop offset="0.62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.2"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#vig)"/>
  <rect width="${w}" height="${h}" fill="url(#sheen)"/>
</svg>`);
  return sharp(base)
    .composite([
      { input: await sharp(glass).png().toBuffer(), left: 0, top: 0 },
      { input: await screenOverlay(w, h, chyron, time), left: 0, top: 0 },
    ])
    .png()
    .toBuffer();
}

/** Put footage on the screen and the headline over it. */
export async function dressScreen(plate: Buffer, spec: PlateSpec, still: Buffer | null, chyron: string, time = "1:14 PM ET"): Promise<Buffer> {
  const { quad, w, h } = surface(spec, "screen");
  return lay(plate, await screenLayer(w, h, still, chyron, time), quad);
}

/**
 * The founder's ruling (2026-09-02): the chalk must be chalk, written by a
 * hand. So the chalk is DRAWN by the local model on the slate itself
 * (scripts/plate-desk.mjs asks for it and pastes the slate band back with
 * pasteBand). This typeset version is only the fallback when no drawing is
 * available, laid onto the slate's corners.
 */
export async function dressBoard(plate: Buffer, spec: PlateSpec, lines: string[]): Promise<Buffer> {
  const clean = lines.map((l) => l.trim()).filter(Boolean).flatMap((l) => wrap(l, 9)).slice(0, 7);
  if (clean.length === 0) return plate;
  const { quad, w, h } = surface(spec, "board");
  const longest = Math.max(...clean.map((l) => l.length));
  const fs = Math.max(12, Math.min(Math.round(h / (clean.length * 1.9)), Math.round((w * 0.92) / (longest * 0.66)), Math.round(h * 0.12)));
  const gap = Math.round(fs * 1.5);
  const first = Math.round((h - gap * clean.length) / 2 + fs * 0.9);
  const tspans = clean
    .map((l, i) => `<text x="${w / 2}" y="${first + i * gap}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${/\$\s?\d/.test(l) ? Math.round(fs * 1.15) : fs}" fill="#ecebe6" fill-opacity="0.92" letter-spacing="1">${xml(l.toUpperCase())}</text>`)
    .join("\n");
  const layer = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${tspans}</svg>`)).png().toBuffer();
  return lay(plate, layer, quad);
}

/*/**
 * THE BROADCAST FURNITURE, as a transparent layer over footage the model has
 * already drawn on the glass. Modelled line for line on the founder's own
 * approved panel (canon/plates/src/duo-source.png), which is what a real
 * television looks like across a room:
 *
 *   - top left, the network bug: the peacock fan, the wordmark under it, LIVE
 *     under that. No plate, no pill, no box behind it — broadcast bugs sit
 *     directly on the picture and hold up over bright footage with a soft
 *     shadow, which is what this uses.
 *   - a hairline rule the full width of the screen, then the lower third: one
 *     solid band, the headline set left in bold capitals.
 *   - the time in its own cell at the right end of the band, divided from the
 *     headline by a hairline, set over two lines the way a network sets it.
 */
export async function screenOverlay(w: number, h: number, chyron: string, time = "1:14 PM ET"): Promise<Buffer> {
  const band = Math.round(h * 0.115);
  const pad = Math.round(w * 0.028);
  const y0 = h - band;

  // The time cell: "1:14 PM" over "ET", right-aligned in its own compartment.
  const [clock, zone] = (() => {
    const m = time.match(/^(.*?)\s*(ET|EST|EDT|PT|CT)?$/i);
    return [(m?.[1] ?? time).trim(), (m?.[2] ?? "").toUpperCase()];
  })();
  const clockFs = Math.round(band * 0.3);
  const cellW = Math.max(Math.round(w * 0.13), Math.round(clock.length * clockFs * 0.6) + pad * 2);
  const cellX = w - cellW;

  // The headline fills the room left of that cell and never runs under it.
  const room = cellX - pad * 2;
  const fs = Math.max(9, Math.min(Math.round(band * 0.46), Math.floor(room / (Math.max(chyron.length, 1) * 0.57))));

  // The peacock: six tapered petals fanning from a point, the way the mark
  // reads at bug size. Drawn rather than lettered so it survives the warp.
  const bugFs = Math.round(h * 0.062);
  const bx = pad + Math.round(bugFs * 1.35), by = Math.round(h * 0.055) + Math.round(bugFs * 1.5);
  const r = bugFs * 1.35;
  const petals = Array.from({ length: 6 }, (_, i) => {
    const a = (-64 + i * 25.6) * (Math.PI / 180);
    const tipX = bx + Math.sin(a) * r, tipY = by - Math.cos(a) * r;
    const wid = r * 0.15;
    const px = Math.cos(a) * wid, py = Math.sin(a) * wid;
    return `<path d="M${bx.toFixed(1)} ${by.toFixed(1)} Q${(tipX + px).toFixed(1)} ${(tipY + py).toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)} Q${(tipX - px).toFixed(1)} ${(tipY - py).toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)} Z" fill="#fff" fill-opacity="${(0.72 + (i % 2) * 0.22).toFixed(2)}"/>`;
  }).join("");

  const sans = "Arial, Helvetica, sans-serif";
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <!-- A bug has to hold up over a bright sky as well as a dark chart, and a
         plate behind it looks pasted on. Broadcast does this with a shadow:
         a tight dark halo, then a wider soft one. -->
    <filter id="sh" x="-60%" y="-60%" width="220%" height="220%">
      <feDropShadow dx="0" dy="0" stdDeviation="${(bugFs * 0.1).toFixed(2)}" flood-color="#000" flood-opacity="0.95"/>
      <feDropShadow dx="0" dy="${Math.max(1, Math.round(bugFs * 0.05))}" stdDeviation="${(bugFs * 0.34).toFixed(2)}" flood-color="#000" flood-opacity="0.8"/>
    </filter>
  </defs>
  <g filter="url(#sh)">
    ${petals}
    <text x="${bx}" y="${by + bugFs * 1.05}" text-anchor="middle" font-family="${sans}" font-weight="700" font-size="${bugFs}" fill="#fff" letter-spacing="${(bugFs * 0.04).toFixed(1)}">CNBC</text>
    <text x="${bx}" y="${by + bugFs * 1.9}" text-anchor="middle" font-family="${sans}" font-weight="700" font-size="${Math.round(bugFs * 0.62)}" fill="#fff" fill-opacity="0.95" letter-spacing="${(bugFs * 0.06).toFixed(1)}">LIVE</text>
  </g>
  <rect x="0" y="${y0 - 2}" width="${w}" height="2" fill="#fff" fill-opacity="0.92"/>
  <rect x="0" y="${y0}" width="${w}" height="${band}" fill="#0a0b0d" fill-opacity="0.9"/>
  <text x="${pad}" y="${y0 + Math.round(band * 0.68)}" font-family="${sans}" font-weight="700" font-size="${fs}" fill="#fff" letter-spacing="${(fs * 0.02).toFixed(1)}">${xml(chyron.toUpperCase())}</text>
  <rect x="${cellX}" y="${y0 + Math.round(band * 0.16)}" width="1.5" height="${Math.round(band * 0.68)}" fill="#fff" fill-opacity="0.35"/>
  <text x="${cellX + cellW / 2}" y="${y0 + Math.round(band * 0.46)}" text-anchor="middle" font-family="${sans}" font-weight="600" font-size="${clockFs}" fill="#fff" fill-opacity="0.95">${xml(clock)}</text>
  ${zone ? `<text x="${cellX + cellW / 2}" y="${y0 + Math.round(band * 0.82)}" text-anchor="middle" font-family="${sans}" font-weight="600" font-size="${Math.round(clockFs * 0.85)}" fill="#fff" fill-opacity="0.88">${xml(zone)}</text>` : ""}
</svg>`);
  return sharp(svg).png().toBuffer();
}

/** The headline and bug over footage the model drew in place. */
export async function dressScreenText(plate: Buffer, spec: PlateSpec, chyron: string, time = "1:14 PM ET"): Promise<Buffer> {
  if (!chyron.trim()) return plate;
  const { quad, w, h } = surface(spec, "screen");
  return lay(plate, await screenOverlay(w, h, chyron, time), quad);
}

/**
 * Paste one rectangular band of a drawing onto the plate with a feathered
 * edge (the desk's scripts/composite-band.mjs, as a function). The local
 * model edits one thing well and everything else slightly, so each drawing
 * is trusted only for the band it was asked to change: the slate band for
 * the chalk, the screen band for the footage. The source is fitted to the
 * plate's size first.
 */
export async function pasteBand(plate: Buffer, drawing: Buffer, band: Box, feather = 18): Promise<Buffer> {
  const meta = await sharp(plate).metadata();
  const W = meta.width!, H = meta.height!;
  const { x, y, w, h } = band;
  const rgb = await sharp(drawing).flatten({ background: "#ffffff" }).grayscale().resize(W, H, { fit: "fill" }).extract({ left: x, top: y, width: w, height: h }).removeAlpha().raw().toBuffer();
  const rgba = Buffer.alloc(w * h * 4);
  const ramp = (d: number) => Math.max(0, Math.min(1, d / feather));
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const a = Math.round(255 * Math.min(ramp(i + 1), ramp(w - i), ramp(j + 1), ramp(h - j)));
      const p = j * w + i;
      rgba[p * 4] = rgb[p]; rgba[p * 4 + 1] = rgb[p]; rgba[p * 4 + 2] = rgb[p]; rgba[p * 4 + 3] = a;
    }
  }
  const overlay = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  return sharp(plate).composite([{ input: overlay, left: x, top: y }]).png().toBuffer();
}

/** The bands the desk pastes back from an in-place drawing on the duo/trio plate. */
export const BANDS: Record<"screen" | "board", Box> = {
  screen: { x: 440, y: 90, w: 500, h: 380 },
  board: { x: 950, y: 120, w: 245, h: 620 },
};

/** One gag from in-place drawings: the speaker variant of the plate, the
 *  model's own chalk and footage pasted back band by band, the headline and
 *  bug laid onto the glass, the caption beneath. */
export async function composeGagInPlace(input: {
  plate: Buffer;
  spec: PlateSpec;
  chalkDrawing: Buffer | null;
  screenDrawing: Buffer | null;
  chyron: string;
  speaker: string;
  caption: string;
  time?: string;
}): Promise<Buffer> {
  let art = input.plate;
  if (input.chalkDrawing) art = await pasteBand(art, input.chalkDrawing, BANDS.board);
  if (input.screenDrawing) {
    // A LIT SCREEN IN A DIM ROOM, NEVER A HOLE CUT IN THE WALL. The model
    // draws the footage at paper white, which reads as a light box; pulling
    // the whites down and lifting the blacks a little puts the picture back
    // behind glass, the way a television looks across a room.
    const toned = await sharp(input.screenDrawing).flatten({ background: "#ffffff" }).grayscale().linear(0.8, 20).png().toBuffer();
    art = await pasteBand(art, toned, BANDS.screen);
  }
  if (input.screenDrawing && input.chyron) art = await dressScreenText(art, input.spec, input.chyron, input.time);
  return finishPlate(art, input.speaker, input.caption);
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
