// Paste one rectangular band of picture B onto picture A with a feathered
// edge, and write the result.
//
//   node scripts/composite-band.mjs <base.png> <source.png> <out.png> [x y w h] [feather]
//
// Why this exists. The local model edits one thing well and everything else
// slightly: a pass that letters the television re-draws the bottle labels a
// little, and the pass that cleans the labels nudges the chyron. Each pass is
// therefore trusted only for the region it was asked to change, and the
// finished panel is assembled from those regions. The default band is the
// television-and-chalkboard strip high on the back wall of a 4:5 local panel
// (1184×1472), which no character ever overlaps.
import sharp from "sharp";

const [base, source, out, xs, ys, ws, hs, fs_] = process.argv.slice(2);
if (!base || !source || !out) {
  console.error("usage: composite-band.mjs <base.png> <source.png> <out.png> [x y w h] [feather]");
  process.exit(2);
}
const meta = await sharp(base).metadata();
const W = meta.width, H = meta.height;
const x = Number(xs ?? Math.round(W * 0.27));
const y = Number(ys ?? Math.round(H * 0.05));
const w = Number(ws ?? Math.round(W * 0.73) - x);
const h = Number(hs ?? Math.round(H * 0.30) - y);
const feather = Number(fs_ ?? 18);

const rgb = await sharp(source).resize(W, H, { fit: "fill" }).extract({ left: x, top: y, width: w, height: h }).removeAlpha().raw().toBuffer();
// Feathered alpha computed directly: full inside, ramping to zero over the
// last `feather` pixels at every edge.
const rgba = Buffer.alloc(w * h * 4);
const ramp = (d) => Math.max(0, Math.min(1, d / feather));
for (let j = 0; j < h; j++) {
  for (let i = 0; i < w; i++) {
    const a = Math.round(255 * Math.min(ramp(i + 1), ramp(w - i), ramp(j + 1), ramp(h - j)));
    const p = j * w + i;
    rgba[p * 4] = rgb[p * 3]; rgba[p * 4 + 1] = rgb[p * 3 + 1]; rgba[p * 4 + 2] = rgb[p * 3 + 2]; rgba[p * 4 + 3] = a;
  }
}
const overlay = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
await sharp(base).composite([{ input: overlay, left: x, top: y }]).png().toFile(out);
console.log(`wrote ${out}  band x=${x} y=${y} w=${w} h=${h} feather=${feather}`);
