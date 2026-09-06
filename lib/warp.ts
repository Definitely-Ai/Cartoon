import sharp from "sharp";

// PERSPECTIVE WARP. A flat, upright layer (a television picture, a chalk
// layer) is laid onto a four-cornered region of a drawing that is seen at an
// angle: the layer's four corners are sent to the region's four corners by a
// plane homography, every destination pixel inside the region is mapped BACK
// through the inverse homography and the layer is sampled bilinearly there.
// Straight lines stay straight, the region's edge is feathered over one
// pixel so it is never jagged, and everything outside the region is
// transparent, so the result composites straight onto the plate.
//
// Conventions: a Quad is [TL, TR, BR, BL] in destination pixels, measured at
// pixel EDGES (a quad of width 456 fits a 456-px layer 1:1). Winding may be
// either way. Nothing beyond sharp (decode/encode) is used.

export type Quad = [[number, number], [number, number], [number, number], [number, number]];

export type Box = { x: number; y: number; w: number; h: number };

/**
 * The 3x3 homography (row-major, h[8] = 1) taking src's four corners to
 * dst's, corner for corner. Solves the eight unknowns by Gauss-Jordan
 * elimination with partial pivoting. Throws if either quad is degenerate
 * (three corners collinear).
 */
export function homography(src: Quad, dst: Quad): number[] {
  const rows: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const [u, v] = dst[i];
    rows.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
    rows.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  }
  const h = solveLinear(rows);
  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}

/** Map one point through a homography. */
export function applyHomography(h: number[], x: number, y: number): [number, number] {
  const w = h[6] * x + h[7] * y + h[8];
  return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w];
}

/** The inverse of a 3x3 homography (adjugate over determinant), rescaled so h[8] = 1. */
export function invertHomography(h: number[]): number[] {
  const [a, b, c, d, e, f, g, i, j] = h;
  const A = e * j - f * i, B = -(d * j - f * g), C = d * i - e * g;
  const det = a * A + b * B + c * C;
  if (!Number.isFinite(det) || Math.abs(det) < 1e-12) throw new Error("warp: homography is singular");
  const inv = [
    A, -(b * j - c * i), b * f - c * e,
    B, a * j - c * g, -(a * f - c * d),
    C, -(a * i - b * g), a * e - b * d,
  ].map((v) => v / det);
  const s = inv[8];
  return Math.abs(s) > 1e-12 ? inv.map((v) => v / s) : inv;
}

/** Integer pixel bounds that fully contain the quad (floor of the mins, ceil of the maxes). */
export function quadBounds(q: Quad): Box {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of q) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const x = Math.floor(minX), y = Math.floor(minY);
  return { x, y, w: Math.ceil(maxX) - x, h: Math.ceil(maxY) - y };
}

/** The axis-aligned quad of a box: [TL, TR, BR, BL]. */
export function quadFromBox(b: Box): Quad {
  return [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]];
}

/**
 * Warp a PNG layer (RGB or RGBA, any size) so its four corners land on
 * quad's four corners, over a transparent dstW x dstH canvas. Returns a PNG
 * RGBA. Every destination pixel inside the quad's bounding box is
 * inverse-mapped to the layer and sampled bilinearly (alpha-weighted, so
 * transparent layer pixels never bleed colour); the quad's edge is feathered
 * over one pixel from the signed distance to the nearest edge, so the
 * outline is anti-aliased and the layer's own border colour is what shows
 * in the feather (samples are clamped to the layer's edge).
 */
export async function warpLayerToQuad(layer: Buffer, quad: Quad, dstW: number, dstH: number): Promise<Buffer> {
  if (!(dstW > 0 && dstH > 0)) throw new Error("warp: destination size must be positive");
  const { data: src, info } = await sharp(layer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const lw = info.width, lh = info.height;
  const out = Buffer.alloc(dstW * dstH * 4); // zero-filled: fully transparent
  const bounds = quadBounds(quad);
  // One pixel of slack each side for the feather, clipped to the canvas.
  const x0 = Math.max(0, bounds.x - 1), y0 = Math.max(0, bounds.y - 1);
  const x1 = Math.min(dstW, bounds.x + bounds.w + 1), y1 = Math.min(dstH, bounds.y + bounds.h + 1);
  if (x1 > x0 && y1 > y0 && lw > 0 && lh > 0) {
    // Destination -> layer, in edge coordinates (the layer spans [0,lw] x [0,lh]).
    const inv = homography(quad, [[0, 0], [lw, 0], [lw, lh], [0, lh]]);
    const edges = edgeLines(quad);
    const maxX = lw - 1, maxY = lh - 1;
    for (let y = y0; y < y1; y++) {
      const py = y + 0.5;
      for (let x = x0; x < x1; x++) {
        const px = x + 0.5;
        // Signed distance to the quad (positive inside), then a 1 px feather.
        let d = Infinity;
        for (let k = 0; k < 4; k++) {
          const e = edges[k];
          const v = e[0] * px + e[1] * py + e[2];
          if (v < d) d = v;
        }
        const coverage = d + 0.5;
        if (coverage <= 0) continue;
        // Inverse-map the pixel centre; layer pixel centres sit at +0.5.
        const w = inv[6] * px + inv[7] * py + inv[8];
        let sx = (inv[0] * px + inv[1] * py + inv[2]) / w - 0.5;
        let sy = (inv[3] * px + inv[4] * py + inv[5]) / w - 0.5;
        if (sx < 0) sx = 0; else if (sx > maxX) sx = maxX;
        if (sy < 0) sy = 0; else if (sy > maxY) sy = maxY;
        const ix = Math.floor(sx), iy = Math.floor(sy);
        const tx = sx - ix, ty = sy - iy;
        const ix1 = ix < maxX ? ix + 1 : ix, iy1 = iy < maxY ? iy + 1 : iy;
        const o00 = (iy * lw + ix) * 4, o10 = (iy * lw + ix1) * 4, o01 = (iy1 * lw + ix) * 4, o11 = (iy1 * lw + ix1) * 4;
        // Alpha-weighted (premultiplied) bilinear blend of the four taps.
        const a00 = src[o00 + 3] * (1 - tx) * (1 - ty);
        const a10 = src[o10 + 3] * tx * (1 - ty);
        const a01 = src[o01 + 3] * (1 - tx) * ty;
        const a11 = src[o11 + 3] * tx * ty;
        const a = a00 + a10 + a01 + a11;
        if (a <= 0) continue;
        const r = (src[o00] * a00 + src[o10] * a10 + src[o01] * a01 + src[o11] * a11) / a;
        const g = (src[o00 + 1] * a00 + src[o10 + 1] * a10 + src[o01 + 1] * a01 + src[o11 + 1] * a11) / a;
        const b = (src[o00 + 2] * a00 + src[o10 + 2] * a10 + src[o01 + 2] * a01 + src[o11 + 2] * a11) / a;
        const o = (y * dstW + x) * 4;
        out[o] = Math.round(r);
        out[o + 1] = Math.round(g);
        out[o + 2] = Math.round(b);
        out[o + 3] = Math.round(a * (coverage < 1 ? coverage : 1));
      }
    }
  }
  return sharp(out, { raw: { width: dstW, height: dstH, channels: 4 } }).png().toBuffer();
}

// ------------------------------------------------------------------ helpers

/**
 * Unit-normal line equations [a, b, c] for the quad's four edges, signed so
 * that a*x + b*y + c is the distance INSIDE the quad (positive within),
 * whichever way the corners wind.
 */
function edgeLines(q: Quad): [number, number, number][] {
  const cx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4;
  const cy = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
  const lines: [number, number, number][] = [];
  for (let k = 0; k < 4; k++) {
    const [x0, y0] = q[k];
    const [x1, y1] = q[(k + 1) % 4];
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    if (len < 1e-9) throw new Error("warp: quad has a zero-length edge");
    let a = dy / len, b = -dx / len;
    let c = -(a * x0 + b * y0);
    if (a * cx + b * cy + c < 0) { a = -a; b = -b; c = -c; }
    lines.push([a, b, c]);
  }
  return lines;
}

/** Gauss-Jordan with partial pivoting on an n x (n+1) augmented matrix; returns the n unknowns. */
function solveLinear(m: number[][]): number[] {
  const n = m.length;
  const a = m.map((row) => row.slice());
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r;
    if (Math.abs(a[pivot][col]) < 1e-12) throw new Error("warp: degenerate quad (no homography)");
    if (pivot !== col) { const t = a[pivot]; a[pivot] = a[col]; a[col] = t; }
    const p = a[col][col];
    for (let k = col; k <= n; k++) a[col][k] /= p;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = a[r][col];
      if (f === 0) continue;
      for (let k = col; k <= n; k++) a[r][k] -= f * a[col][k];
    }
  }
  return a.map((row) => row[n]);
}
