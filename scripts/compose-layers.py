"""The plate, composed from stickers instead of re-laid from renders.

    C:/Python313/python.exe scripts/compose-layers.py            # honour layout.json
    C:/Python313/python.exe scripts/compose-layers.py --verify   # and measure against plate.png
    C:/Python313/python.exe scripts/compose-layers.py --no-sign

base.png plus every sticker in canon/room-kit/v2/stickers/, laid down in
layerOrder, each moved and shown or hidden by canon/room-kit/v2/layout.json,
into canon/room-kit/v2/plate-layers.png - then sign-on-glass.py gilds the
window and writes plate-layers-signed.png.

layout.json is written by the desk (scripts/sticker-desk.mjs) and is small
enough to hand-edit. Anything it does not mention keeps the sticker's own
place and its enabled flag from parts.json:

    {
      "layers": {
        "counter":    { "dx": 0, "dy": 0, "visible": true },
        "chair-left": { "visible": true, "dx": -14, "dy": 6,
                        "file": "history/chair-left/2026-09-05-s7.png" }
      }
    }

  dx, dy   pixels right and down from where room-part.py put it
  visible  false hides the layer without deleting anything
  file     a different version of that layer, under the kit. An RGBA sticker
           (what stickers.py writes, and what history/<part>/ should hold) is
           laid as it is. A plain full-frame 1200x1800 render - a candidate
           straight out of work/ - is cropped to the layer's own box and worn
           through the layer's alpha, so a seed can be tried in one click; it
           is NOT ring-fitted or levelled the way room-part.py would do it, so
           judge tone on a real build before approving.

WITH AN EMPTY LAYOUT THIS MUST REPRODUCE plate.png. --verify prints the mean
absolute difference; anything above about a grey level means the stickers are
stale and stickers.py export needs re-running.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
KIT = ROOT / "canon/room-kit/v2"
STICKERS = KIT / "stickers"
LAYOUT = KIT / "layout.json"
OUT = KIT / "plate-layers.png"
SIGNED = KIT / "plate-layers-signed.png"


def read_layout() -> dict:
    if not LAYOUT.exists():
        return {}
    try:
        doc = json.loads(LAYOUT.read_text(encoding="utf8"))
    except json.JSONDecodeError as e:
        raise SystemExit(f"layout.json is not valid JSON: {e}")
    if not isinstance(doc, dict):
        raise SystemExit("layout.json must be an object")
    layers = doc.get("layers", doc)          # tolerate a bare map of part -> settings
    return {k: v for k, v in layers.items() if isinstance(v, dict)}


def sticker_pixels(entry: dict, override: str | None):
    """(rgb, alpha, w, h) for one layer, honouring a version override."""
    default = STICKERS / entry["file"]
    if not override:
        im = Image.open(default).convert("RGBA")
        a = np.asarray(im, np.float32)
        return a[..., 0], a[..., 3] / 255.0, im.width, im.height

    p = Path(override)
    if not p.is_absolute():
        p = KIT / override
    if not p.exists():
        print(f"  ! {entry['part']}: no such version {override} - using {entry['file']}", file=sys.stderr)
        return sticker_pixels(entry, None)
    im = Image.open(p)
    if im.mode in ("RGBA", "LA") or "transparency" in im.info:
        im = im.convert("RGBA")
        a = np.asarray(im, np.float32)
        return a[..., 0], a[..., 3] / 255.0, im.width, im.height
    # a plain full-frame candidate: cut the layer's own box out of it and wear
    # it through the layer's own alpha
    full = im.convert("L")
    man = json.loads((STICKERS / "manifest.json").read_text(encoding="utf8"))
    pw, ph = man["plate"]["w"], man["plate"]["h"]
    if full.size != (pw, ph):
        if full.width == pw and full.height > ph:
            full = full.crop((0, 0, pw, ph))     # a tall-canvas build: the plate is its top
        else:
            full = full.resize((pw, ph), Image.LANCZOS)   # the model's 1184x1792 grid, as room-part.load() does
    x, y, w, h = entry["x"], entry["y"], entry["w"], entry["h"]
    rgb = np.asarray(full, np.float32)[y:y + h, x:x + w]
    alpha = np.asarray(Image.open(default).convert("RGBA"), np.float32)[..., 3] / 255.0
    return rgb, alpha, w, h


def paste(plate: np.ndarray, rgb: np.ndarray, alpha: np.ndarray, x: int, y: int) -> None:
    """rgb over plate at x,y through alpha, clipped to the plate's edges."""
    H, W = plate.shape
    h, w = alpha.shape
    sx, sy = max(0, -x), max(0, -y)
    dx, dy = max(0, x), max(0, y)
    cw, ch = min(w - sx, W - dx), min(h - sy, H - dy)
    if cw <= 0 or ch <= 0:
        return
    a = alpha[sy:sy + ch, sx:sx + cw]
    c = rgb[sy:sy + ch, sx:sx + cw]
    win = plate[dy:dy + ch, dx:dx + cw]
    plate[dy:dy + ch, dx:dx + cw] = win * (1.0 - a) + c * a


def apply_shadow(plate: np.ndarray, pid: str, dx: int, dy: int, alpha: np.ndarray | None = None, x: int = 0, y: int = 0) -> None:
    """Multiply the plate by the part's cast-shadow map (shadows/<part>.png, 1 = none),
    shifted with the layer - the same thing room-part.py's lay() does at build time."""
    p = KIT / "shadows" / f"{pid}.png"
    if not p.exists():
        return
    f = np.asarray(Image.open(p).convert("L"), np.float32) / 255.0
    f = np.clip(ndimage.gaussian_filter(f, 1.2), 0.0, 1.0)
    if dx or dy:
        g = np.ones_like(f)
        H, W = f.shape
        sx0, sx1 = max(0, -dx), min(W, W - dx)
        sy0, sy1 = max(0, -dy), min(H, H - dy)
        g[sy0 + dy:sy1 + dy, sx0 + dx:sx1 + dx] = f[sy0:sy1, sx0:sx1]
        f = g
    if alpha is not None:                      # never on the layer itself (the assembler keeps a part's shadow off its own silhouette)
        H, W = plate.shape; h, w = alpha.shape
        sx, sy = max(0, -x), max(0, -y); dx0, dy0 = max(0, x), max(0, y)
        cw, ch = min(w - sx, W - dx0), min(h - sy, H - dy0)
        if cw > 0 and ch > 0:
            own = alpha[sy:sy + ch, sx:sx + cw] > 0.5
            f[dy0:dy0 + ch, dx0:dx0 + cw][own] = 1.0
    plate *= f


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--verify", action="store_true", help="measure the result against plate.png")
    ap.add_argument("--no-sign", action="store_true", help="stop before sign-on-glass.py")
    ap.add_argument("--out", default=str(OUT))
    ap.add_argument("--quiet", action="store_true")
    a = ap.parse_args()

    man_p = STICKERS / "manifest.json"
    if not man_p.exists():
        raise SystemExit("no stickers yet: run  C:/Python313/python.exe scripts/stickers.py export")
    man = json.loads(man_p.read_text(encoding="utf8"))
    layout = read_layout()

    plate = np.asarray(Image.open(STICKERS / man["base"]).convert("L"), np.float32)
    laid, hidden = [], []
    for entry in sorted(man["stickers"], key=lambda e: e["layerOrder"]):
        pid = entry["part"]
        cfg = layout.get(pid, {})
        visible = bool(cfg.get("visible", entry.get("enabled", True)))
        if not visible:
            hidden.append(pid)
            continue
        rgb, alpha, w, h = sticker_pixels(entry, cfg.get("file"))
        x = int(entry["x"]) + int(cfg.get("dx", 0))
        y = int(entry["y"]) + int(cfg.get("dy", 0))
        paste(plate, rgb, alpha, x, y)
        apply_shadow(plate, pid, x - int(entry["x"]), y - int(entry["y"]), alpha, x, y)
        laid.append(f"{pid}{'' if (x, y) == (entry['x'], entry['y']) else f'@{x},{y}'}"
                    + (f"[{Path(cfg['file']).name}]" if cfg.get("file") else ""))

    try:
        sys.path.insert(0, str(ROOT / "scripts"))
        from ink import ink_edges
        plate = ink_edges(plate, json.loads((KIT / "parts.json").read_text(encoding="utf8")))
    except Exception as ex:
        print("  ink skipped:", ex)
    out_p = Path(a.out)
    Image.fromarray(np.clip(plate, 0, 255).astype(np.uint8)).save(out_p)
    if not a.quiet:
        print(f"wrote {out_p}")
        print(f"  laid   {', '.join(laid) if laid else '(nothing)'}")
        print(f"  hidden {', '.join(hidden) if hidden else '(nothing)'}")

    diff = None
    if a.verify:
        ref_p = KIT / "plate.png"
        if not ref_p.exists():
            print("  ! no plate.png to verify against")
        else:
            ref = np.asarray(Image.open(ref_p).convert("L"), np.float32)
            d = np.abs(plate - ref)
            diff = float(d.mean())
            print(f"  vs plate.png: mean abs diff {diff:.4f} grey levels, "
                  f"max {d.max():.1f}, {(d > 1).mean() * 100:.3f}% of pixels off by more than 1")

    if not a.no_sign:
        r = subprocess.run([sys.executable, str(ROOT / "scripts/sign-on-glass.py"),
                            str(out_p), str(SIGNED)], capture_output=True, text=True)
        if r.returncode != 0:
            print(f"  ! sign-on-glass.py failed: {r.stderr.strip()[:400]}", file=sys.stderr)
        elif not a.quiet:
            print("  " + r.stdout.strip())
    return diff


if __name__ == "__main__":
    main()
