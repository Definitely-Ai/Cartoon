// Ink masks for the model sheets.
//
// Both training scripts need the same three questions answered about a drawing
// on paper: what is ink, what is a solid shape, and what is only lettering.
// The sheets are line art on mottled off-white, so none of it is a simple
// threshold — a hollow outline has to be filled by flooding the paper inward
// from the edge before it counts as a shape, and the printed labels have to be
// recognised by proportion rather than by colour.

// Ink is anything meaningfully darker than the paper, measured against the
// paper actually present rather than an assumed white.
export const INK_DELTA = 28;
// Closing radius before the paper flood: pencil outlines have gaps, and a
// leaky outline never becomes a solid shape.
export const CLOSE_RADIUS = 1;
// A drawing on these sheets is at least a head study. Anything shorter, or
// wide-and-short like a heading, is lettering or a stray mark.
export const MIN_HEIGHT = 0.09;
export const MIN_AREA = 0.0015;
export const HEADING_HEIGHT = 0.13;
export const HEADING_ASPECT = 2.2;

// Background = the most common value along the border, where no figure sits.
export function backgroundLevel(gray, w, h) {
  const counts = new Uint32Array(256);
  for (let x = 0; x < w; x++) {
    counts[gray[x]]++;
    counts[gray[(h - 1) * w + x]]++;
  }
  for (let y = 0; y < h; y++) {
    counts[gray[y * w]]++;
    counts[gray[y * w + w - 1]]++;
  }
  let best = 0;
  for (let v = 1; v < 256; v++) if (counts[v] > counts[best]) best = v;
  return best;
}

// Separable max/min filters — two cheap passes instead of a square kernel.
function morph(mask, w, h, r, wantAll) {
  if (r <= 0) return mask;
  const step = (src) => {
    const dst = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let hit = wantAll ? 1 : 0;
        for (let d = -r; d <= r; d++) {
          const nx = x + d;
          const on = nx < 0 || nx >= w ? (wantAll ? 1 : 0) : src[y * w + nx];
          if (wantAll && !on) { hit = 0; break; }
          if (!wantAll && on) { hit = 1; break; }
        }
        dst[y * w + x] = hit;
      }
    }
    return dst;
  };
  const transpose = (src, sw, sh) => {
    const dst = new Uint8Array(sw * sh);
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) dst[x * sh + y] = src[y * sw + x];
    return dst;
  };
  const horizontal = step(mask);
  const t = transpose(horizontal, w, h);
  const vertical = (() => {
    const dst = new Uint8Array(w * h);
    for (let y = 0; y < w; y++) {
      for (let x = 0; x < h; x++) {
        let hit = wantAll ? 1 : 0;
        for (let d = -r; d <= r; d++) {
          const nx = x + d;
          const on = nx < 0 || nx >= h ? (wantAll ? 1 : 0) : t[y * h + nx];
          if (wantAll && !on) { hit = 0; break; }
          if (!wantAll && on) { hit = 1; break; }
        }
        dst[y * h + x] = hit;
      }
    }
    return dst;
  })();
  return transpose(vertical, h, w);
}

export const dilate = (m, w, h, r) => morph(m, w, h, r, false);
export const erode = (m, w, h, r) => morph(m, w, h, r, true);

// Flood the paper inward from the border. What it cannot reach is a drawing —
// this is what turns hollow line art into solid shapes.
export function solidify(ink, w, h) {
  const closed = erode(dilate(ink, w, h, CLOSE_RADIUS), w, h, CLOSE_RADIUS);
  const paper = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let top = 0;
  const push = (p) => {
    if (!closed[p] && !paper[p]) {
      paper[p] = 1;
      stack[top++] = p;
    }
  };
  for (let x = 0; x < w; x++) {
    push(x);
    push((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    push(y * w);
    push(y * w + w - 1);
  }
  while (top > 0) {
    const p = stack[--top];
    const x = p % w;
    const y = (p - x) / w;
    if (x > 0) push(p - 1);
    if (x < w - 1) push(p + 1);
    if (y > 0) push(p - w);
    if (y < h - 1) push(p + w);
  }
  const solid = new Uint8Array(w * h);
  for (let i = 0; i < solid.length; i++) solid[i] = paper[i] ? 0 : 1;
  return solid;
}

// Iterative flood fill — recursion blows the stack on a full-sheet blob.
// Keeps each blob's pixels so callers can erase one.
export function componentsWithPixels(mask, w, h) {
  const seen = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  const members = new Int32Array(w * h);
  const boxes = [];
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || seen[start]) continue;
    let top = 0;
    stack[top++] = start;
    seen[start] = 1;
    let minX = w, minY = h, maxX = -1, maxY = -1, area = 0, count = 0;
    while (top > 0) {
      const p = stack[--top];
      members[count++] = p;
      const x = p % w;
      const y = (p - x) / w;
      area++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const q = ny * w + nx;
          if (mask[q] && !seen[q]) {
            seen[q] = 1;
            stack[top++] = q;
          }
        }
      }
    }
    boxes.push({ minX, minY, maxX, maxY, area, pixels: members.slice(0, count) });
  }
  return boxes;
}

// A heading that overlaps the drawings beside it leaves no gutter anywhere,
// and the cut then returns the whole sheet as one cell. Lettering has to go
// before the cut runs, not after: erase every component of the eroded mask
// that is too small or too heading-shaped to be a drawing.
export function stripMarks(mask, w, h) {
  const cleaned = Uint8Array.from(mask);
  for (const box of componentsWithPixels(mask, w, h)) {
    if (!isMark(box, w, h)) continue;
    for (const p of box.pixels) cleaned[p] = 0;
  }
  return cleaned;
}

// A label, a title letter, or the rule under a heading — anything too short,
// too small, or too wide-and-flat to be a drawing on these sheets.
export function isMark(box, w, h) {
  const bw = box.maxX - box.minX + 1;
  const bh = box.maxY - box.minY + 1;
  if (bh < h * MIN_HEIGHT || box.area < w * h * MIN_AREA) return true;
  return bh < h * HEADING_HEIGHT && bw / bh > HEADING_ASPECT;
}

// Threshold a greyscale buffer against the paper it was drawn on.
export function inkMask(gray, w, h, delta = INK_DELTA) {
  const cut = backgroundLevel(gray, w, h) - delta;
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < mask.length; i++) mask[i] = gray[i] < cut ? 1 : 0;
  return mask;
}
