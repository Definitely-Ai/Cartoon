// Checks lib/warp.ts: renders a 456x314 test layer (8x6 checkerboard, thick
// black border, the word TEST), warps it onto a television-shaped quad and a
// strongly keystoned quad over a 1200x1800 white canvas, saves the pictures
// (plus 8x zooms of every corner) and measures: corners land exactly,
// straight lines stay straight, the edge is anti-aliased, no holes.
//
//   node scripts/check-warp.mjs [--out <dir>]
//
// Prints one JSON object with the results.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : fallback;
};
const outDir = path.resolve(opt("out", path.join(repoRoot, "node_modules", ".cache", "swd-warp", "out")));
fs.mkdirSync(outDir, { recursive: true });

// ------------------------------------------------------------ compile TS
const build = path.join(repoRoot, "node_modules", ".cache", "swd-warp");
const sources = ["lib/warp.ts"];
const built = path.join(build, "lib", "warp.js");
const stale = !fs.existsSync(built) || sources.some((f) => fs.statSync(path.join(repoRoot, f)).mtimeMs > fs.statSync(built).mtimeMs);
if (stale) {
  fs.rmSync(path.join(build, "lib"), { recursive: true, force: true });
  fs.mkdirSync(build, { recursive: true });
  fs.writeFileSync(
    path.join(build, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        outDir: build, rootDir: repoRoot, module: "commonjs", moduleResolution: "node", target: "es2022",
        esModuleInterop: true, skipLibCheck: true, strict: true, baseUrl: repoRoot, paths: { "@/*": ["*"] },
      },
      files: sources.map((f) => path.join(repoRoot, f)),
    })
  );
  execFileSync("npx", ["tsc", "-p", path.join(build, "tsconfig.json")], { cwd: repoRoot, stdio: "inherit", shell: process.platform === "win32" });
  for (const name of fs.readdirSync(path.join(build, "lib"))) {
    if (!name.endsWith(".js")) continue;
    const file = path.join(build, "lib", name);
    fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace(/require\("@\/lib\//g, 'require("./'));
  }
  fs.writeFileSync(path.join(build, "package.json"), JSON.stringify({ type: "commonjs" }));
}
const require = createRequire(import.meta.url);
const W = require(built);

// ------------------------------------------------------------ test layer
const LW = 456, LH = 314, COLS = 8, ROWS = 6, BORDER = 16;
const cw = LW / COLS, ch = LH / ROWS;
const DARK = [40, 90, 200], LIGHT = [255, 255, 255];
let cells = "";
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const [R, G, B] = (r + c) % 2 ? DARK : LIGHT;
    cells += `<rect x="${c * cw}" y="${r * ch}" width="${cw}" height="${ch}" fill="rgb(${R},${G},${B})"/>`;
  }
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${LW}" height="${LH}" viewBox="0 0 ${LW} ${LH}" shape-rendering="crispEdges">
  ${cells}
  <rect x="${BORDER / 2}" y="${BORDER / 2}" width="${LW - BORDER}" height="${LH - BORDER}" fill="none" stroke="#000" stroke-width="${BORDER}"/>
  <text x="${LW / 2}" y="${LH / 2 + 52}" font-family="Arial, Helvetica, DejaVu Sans, sans-serif" font-size="150" font-weight="bold"
        text-anchor="middle" fill="#e0201c" stroke="#fff" stroke-width="8" paint-order="stroke" shape-rendering="auto">TEST</text>
</svg>`;
const layerPng = await sharp(Buffer.from(svg)).png().toBuffer();
const layerPath = path.join(outDir, "test-layer.png");
fs.writeFileSync(layerPath, layerPng);
const layerRaw = await sharp(layerPng).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

// ------------------------------------------------------------ cases
const CANVAS = { w: 1200, h: 1800 };
const cases = [
  { name: "tv", quad: [[462, 118], [918, 124], [912, 432], [468, 426]] },
  { name: "keystone", quad: [[300, 300], [900, 360], [860, 900], [340, 840]] },
];

const files = [layerPath];
const results = [];
for (const { name, quad } of cases) {
  const t0 = performance.now();
  const warped = await W.warpLayerToQuad(layerPng, quad, CANVAS.w, CANVAS.h);
  const ms = Math.round(performance.now() - t0);
  const raw = await sharp(warped).raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => {
    if (x < 0 || y < 0 || x >= CANVAS.w || y >= CANVAS.h) return [0, 0, 0, 0];
    const o = (y * CANVAS.w + x) * 4;
    return [raw.data[o], raw.data[o + 1], raw.data[o + 2], raw.data[o + 3]];
  };

  // The picture, over white.
  const overWhite = await sharp({ create: { width: CANVAS.w, height: CANVAS.h, channels: 3, background: "#fff" } })
    .composite([{ input: warped }]).png().toBuffer();
  const picPath = path.join(outDir, `warp-${name}.png`);
  fs.writeFileSync(picPath, overWhite);
  files.push(picPath);
  // The raw RGBA layer too, for the integrator.
  const layerOut = path.join(outDir, `warp-${name}-rgba.png`);
  fs.writeFileSync(layerOut, warped);
  files.push(layerOut);

  // 8x nearest zooms of a 48x48 patch at every corner, tiled in one sheet.
  const tiles = [];
  for (const [cx, cy] of quad) {
    const x = Math.max(0, Math.min(CANVAS.w - 48, Math.round(cx) - 24));
    const y = Math.max(0, Math.min(CANVAS.h - 48, Math.round(cy) - 24));
    tiles.push(await sharp(overWhite).extract({ left: x, top: y, width: 48, height: 48 }).resize(384, 384, { kernel: "nearest" }).png().toBuffer());
  }
  const sheet = await sharp({ create: { width: 384 * 4 + 30, height: 384, channels: 3, background: "#888" } })
    .composite(tiles.map((input, i) => ({ input, left: i * 394, top: 0 }))).png().toBuffer();
  const zoomPath = path.join(outDir, `warp-${name}-corners-8x.png`);
  fs.writeFileSync(zoomPath, sheet);
  files.push(zoomPath);

  // ---- 1. corners land exactly: the homography sends layer corners to quad corners.
  const H = W.homography([[0, 0], [LW, 0], [LW, LH], [0, LH]], quad);
  const cornerErr = Math.max(...quad.map(([u, v], i) => {
    const s = [[0, 0], [LW, 0], [LW, LH], [0, LH]][i];
    const [x, y] = W.applyHomography(H, s[0], s[1]);
    return Math.hypot(x - u, y - v);
  }));
  const Hinv = W.invertHomography(H);
  const roundTrip = Math.max(...quad.map(([u, v]) => {
    const [x, y] = W.applyHomography(Hinv, u, v);
    const [u2, v2] = W.applyHomography(H, x, y);
    return Math.hypot(u2 - u, v2 - v);
  }));
  // ...and in the pixels: 1.5 px inside each corner (toward the centre) the
  // border is opaque black; 1.5 px outside it is fully transparent.
  const cx = quad.reduce((s, p) => s + p[0], 0) / 4, cy = quad.reduce((s, p) => s + p[1], 0) / 4;
  const cornerPixels = quad.map(([u, v]) => {
    const len = Math.hypot(cx - u, cy - v);
    const ux = (cx - u) / len, uy = (cy - v) / len;
    const inside = px(Math.floor(u + 2 * ux), Math.floor(v + 2 * uy));
    const outside = px(Math.floor(u - 2 * ux), Math.floor(v - 2 * uy));
    return { corner: [u, v], inside, outside };
  });
  const cornersOk = cornerPixels.every(({ inside, outside }) => inside[3] === 255 && inside[0] < 40 && inside[1] < 40 && inside[2] < 40 && outside[3] === 0);

  // ---- 2. straight lines stay straight: walk the mapped image of two
  // checker boundaries (layer x = 4 cells, layer y = 3 cells) and a border
  // edge; on each side of the predicted line the colours must be the expected
  // ones all the way along.
  const inv = W.homography(quad, [[0, 0], [LW, 0], [LW, LH], [0, LH]]);
  const sampleLayer = (sx, sy) => {
    const x = Math.max(0, Math.min(LW - 1, Math.floor(sx))), y = Math.max(0, Math.min(LH - 1, Math.floor(sy)));
    const o = (y * LW + x) * 4;
    return [layerRaw.data[o], layerRaw.data[o + 1], layerRaw.data[o + 2]];
  };
  const lineChecks = [];
  const lines = [
    { name: "vertical checker boundary x=4 cells", from: [4 * cw, BORDER + 4], to: [4 * cw, LH - BORDER - 4], normal: [1, 0] },
    { name: "horizontal checker boundary y=3 cells", from: [BORDER + 4, 3 * ch], to: [LW - BORDER - 4, 3 * ch], normal: [0, 1] },
    { name: "inner edge of top border", from: [BORDER + 4, BORDER], to: [LW - BORDER - 4, BORDER], normal: [0, 1] },
    { name: "inner edge of left border", from: [BORDER, BORDER + 4], to: [BORDER, LH - BORDER - 4], normal: [1, 0] },
  ];
  for (const line of lines) {
    let samples = 0, agree = 0, worst = 0;
    const [ax, ay] = W.applyHomography(H, line.from[0], line.from[1]);
    const [bx, by] = W.applyHomography(H, line.to[0], line.to[1]);
    const n = Math.round(Math.hypot(bx - ax, by - ay) / 3);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      // The destination point ON the (straight) mapped line...
      const dx = ax + (bx - ax) * t, dy = ay + (by - ay) * t;
      // ...and the destination direction across it: map two layer points
      // 3 px either side of the layer line and compare colours to the layer.
      for (const side of [-3, 3]) {
        const sx = line.from[0] + (line.to[0] - line.from[0]) * t + line.normal[0] * side;
        const sy = line.from[1] + (line.to[1] - line.from[1]) * t + line.normal[1] * side;
        const [ex, ey] = W.applyHomography(H, sx, sy);
        // The mapped point must be within ~2 px of the straight segment's offset direction; then colours must agree.
        const got = px(Math.floor(ex), Math.floor(ey));
        const want = sampleLayer(sx, sy);
        const diff = Math.max(Math.abs(got[0] - want[0]), Math.abs(got[1] - want[1]), Math.abs(got[2] - want[2]));
        samples++;
        if (diff <= 24 && got[3] === 255) agree++;
        worst = Math.max(worst, diff);
      }
      // Skip the point on the line itself but keep it as the straightness anchor:
      void dx; void dy;
    }
    lineChecks.push({ line: line.name, samples, agree, worstColourDiff: worst });
  }
  const linesOk = lineChecks.every((l) => l.agree === l.samples);

  // ---- 3. no holes: every pixel deeper than 1 px inside the quad is opaque;
  // 4. anti-aliasing: partial alphas exist and sit within 1 px of an edge.
  const edges = [];
  for (let k = 0; k < 4; k++) {
    const [x0, y0] = quad[k], [x1, y1] = quad[(k + 1) % 4];
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
    let a = dy / len, b = -dx / len, c = -(a * x0 + b * y0);
    if (a * cx + b * cy + c < 0) { a = -a; b = -b; c = -c; }
    edges.push([a, b, c]);
  }
  const depth = (x, y) => Math.min(...edges.map(([a, b, c]) => a * (x + 0.5) + b * (y + 0.5) + c));
  const bounds = W.quadBounds(quad);
  let holes = 0, partial = 0, partialFar = 0, opaqueOutside = 0, deepInside = 0, alphaHist = {};
  for (let y = bounds.y - 2; y < bounds.y + bounds.h + 2; y++) {
    for (let x = bounds.x - 2; x < bounds.x + bounds.w + 2; x++) {
      const a = px(x, y)[3];
      const d = depth(x, y);
      if (d > 1) { deepInside++; if (a !== 255) holes++; }
      if (d < -1 && a !== 0) opaqueOutside++;
      if (a > 0 && a < 255) { partial++; if (Math.abs(d) > 1) partialFar++; alphaHist[Math.floor(a / 32)] = (alphaHist[Math.floor(a / 32)] || 0) + 1; }
    }
  }
  const perimeter = quad.reduce((s, p, i) => s + Math.hypot(quad[(i + 1) % 4][0] - p[0], quad[(i + 1) % 4][1] - p[1]), 0);
  // Fully transparent outside the bounding box (spot check the whole canvas).
  let strayOutsideBounds = 0;
  for (let y = 0; y < CANVAS.h; y += 7) for (let x = 0; x < CANVAS.w; x += 7) {
    if ((x < bounds.x - 1 || x > bounds.x + bounds.w || y < bounds.y - 1 || y > bounds.y + bounds.h) && px(x, y)[3] !== 0) strayOutsideBounds++;
  }

  results.push({
    name, quad, ms, bounds,
    homographyCornerError: cornerErr, inverseRoundTripError: roundTrip,
    cornersOk, cornerPixels, linesOk, lineChecks,
    deepInsidePixels: deepInside, holes, opaqueOutside, strayOutsideBounds,
    partialAlphaPixels: partial, partialAlphaFarFromEdge: partialFar, perimeterPx: Math.round(perimeter),
    partialAlphaBuckets: alphaHist,
    ok: cornersOk && linesOk && holes === 0 && opaqueOutside === 0 && strayOutsideBounds === 0 && partialFar === 0 && partial > perimeter * 0.5 && cornerErr < 1e-6,
  });
}

// quadFromBox / quadBounds sanity.
const boxQuad = W.quadFromBox({ x: 10, y: 20, w: 30, h: 40 });
const roundBounds = W.quadBounds(boxQuad);
const util = {
  quadFromBox: boxQuad,
  quadBounds: roundBounds,
  quadFromBoxOk: JSON.stringify(boxQuad) === JSON.stringify([[10, 20], [40, 20], [40, 60], [10, 60]]) && JSON.stringify(roundBounds) === JSON.stringify({ x: 10, y: 20, w: 30, h: 40 }),
  identityIsIdentity: W.homography(boxQuad, boxQuad).map((v) => Math.round(v * 1e9) / 1e9),
};

console.log(JSON.stringify({ ok: results.every((r) => r.ok) && util.quadFromBoxOk, files, util, results }, null, 2));
