"""Assemble the plate from its base and its parts.

    python scripts/build-plate.py [--out canon/plates/duo.png] [--only id,id] [--list]

The room is ONE drawing - canon/plates/base/duo-base.png, the founder's own
approved plate - and every change to it is a part listed in canon/plates/parts.json:
an outline, a prompt, and a render. This script lays each enabled part onto the
base through its own outline, in order, so re-rolling one part cannot disturb any
other. Run it after changing any part and the plate is rebuilt deterministically.

Each part's render is a render of the WHOLE plate (see the note in parts.json);
only the outline is composited back, which is what keeps light, perspective and
pen style consistent without any collage.
"""
import argparse, json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "canon/plates/parts.json"


def load_gray(p, size=None):
    im = Image.open(p).convert("L")
    if size and im.size != size:
        im = im.resize(size, Image.LANCZOS)
    return np.asarray(im, dtype=np.float32)


def align(base, src, outline, search=10):
    """A render comes back at the model's own size and drifts a few pixels when
    scaled to the plate. Find the shift that best matches the RING around the
    part - never inside it, which is the bit that changed."""
    H, W = base.shape
    xs = [p[0] for p in outline]; ys = [p[1] for p in outline]
    x0, y0 = max(0, min(xs) - 60), max(0, min(ys) - 60)
    x1, y1 = min(W, max(xs) + 60), min(H, max(ys) + 60)
    ring = Image.new("L", (x1 - x0, y1 - y0), 255)
    ImageDraw.Draw(ring).polygon([(p[0] - x0, p[1] - y0) for p in outline], fill=0)
    m = np.asarray(ring) > 127
    if m.sum() < 500:
        return 0, 0
    best = (0, 0, 1e18)
    for dy in range(-search, search + 1, 2):
        for dx in range(-search, search + 1, 2):
            sy0, sx0 = y0 + dy, x0 + dx
            if sy0 < 0 or sx0 < 0 or sy0 + (y1 - y0) > H or sx0 + (x1 - x0) > W:
                continue
            diff = np.abs(base[y0:y1, x0:x1] - src[sy0:sy0 + (y1 - y0), sx0:sx0 + (x1 - x0)])[m].mean()
            if diff < best[2]:
                best = (dx, dy, diff)
    return best[0], best[1]


def cast_mask(man, size):
    """Drew and Barclay, stored once in the manifest. Subtracted from every room
    part so no outline can clip them - tracing the cast into each part's outline
    by hand is what put scribbles on Drew's collar."""
    prot = man.get("protect")
    if not prot:
        return None
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    for k, poly in prot.items():
        if k.startswith("_") or k == "feather":
            continue
        d.polygon([tuple(v) for v in poly], fill=255)
    return np.asarray(m.filter(ImageFilter.GaussianBlur(prot.get("feather", 6))), dtype=np.float32) / 255.0


def tone_match(base, src, mask):
    """Fit the part's tone to the picture it is landing in, measured on the RING
    just outside its outline - never inside, which is the part that changed. A
    re-rolled part can come back brighter or flatter than its neighbours; this
    makes that impossible, whatever the model did."""
    inside = mask > 0.5
    ring = (ndimage.binary_dilation(inside, np.ones((3, 3)), iterations=26) & ~inside)
    if ring.sum() < 800:
        return src, 1.0, 0.0
    b, s_ = base[ring], src[ring]
    gain = float(np.clip(b.std() / max(s_.std(), 1e-3), 0.88, 1.14))
    off = float(np.clip(b.mean() - s_.mean() * gain, -26, 26))
    return np.clip(src * gain + off, 0, 255), gain, off


def relight(src, light, sigma=42.0):
    """Keep the part's own strokes, adopt the room's illumination: divide out the
    part's own low frequency and multiply the stored light map back in."""
    own = ndimage.gaussian_filter(src, sigma)
    return np.clip(src * (light / np.maximum(own, 1.0)), 0, 255)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="canon/plates/duo.png")
    ap.add_argument("--only", default="")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--quiet", action="store_true")
    ap.add_argument("--relight", action="store_true", help="re-impose the room's stored light map on every part")
    a = ap.parse_args()

    man = json.loads(MANIFEST.read_text(encoding="utf8"))
    parts = sorted([p for p in man["parts"]], key=lambda p: p.get("order", 0))
    if a.list:
        for p in parts:
            src = ROOT / p.get("source", "")
            state = "on " if p.get("enabled") else "off"
            have = "" if p.get("mode") == "code" else ("  render: ok" if src.exists() else "  render: MISSING")
            print(f"  [{state}] {p['id']:14s} order {p.get('order',0):3d}  {p.get('mode','fast'):5s}{have}")
            if p.get("note"):
                print(f"         {p['note']}")
        return

    only = {s.strip() for s in a.only.split(",") if s.strip()}
    cast = cast_mask(man, Image.open(ROOT / man["plate"]["base"]).size)
    lm_p = ROOT / man.get("lighting", {}).get("lightMap", "")
    light = load_gray(lm_p) if lm_p.exists() else None
    base_p = ROOT / man["plate"]["base"]
    base_im = Image.open(base_p).convert("L")
    size = base_im.size
    out = np.asarray(base_im, dtype=np.float32).copy()
    if not a.quiet:
        print(f"base {man['plate']['base']}  {size[0]}x{size[1]}")

    for p in parts:
        if not p.get("enabled"):
            continue
        if only and p["id"] not in only:
            continue
        if p.get("mode") == "code":
            continue
        src_p = ROOT / p["source"]
        if not src_p.exists():
            print(f"  ! {p['id']}: no render at {p['source']} — skipped")
            continue
        src = load_gray(src_p, size)
        dx, dy = align(out, src, p["outline"])
        if dx or dy:
            src = np.roll(np.roll(src, -dy, axis=0), -dx, axis=1)
        mask = Image.new("L", size, 0)
        ImageDraw.Draw(mask).polygon([tuple(v) for v in p["outline"]], fill=255)
        mask = mask.filter(ImageFilter.GaussianBlur(p.get("feather", 20)))
        m = np.asarray(mask, dtype=np.float32) / 255.0
        if p.get("respectsCast") and cast is not None:
            m = m * (1.0 - cast)
        note = ""
        if a.relight and light is not None and p.get("relight", True):
            src = relight(src, light)
            note += " relit"
        if p.get("toneMatch"):
            src, gain, off = tone_match(out, src, m)
            note += f" tone x{gain:.3f}{off:+.1f}"
        out = out * (1 - m) + src * m
        if not a.quiet:
            print(f"  + {p['id']:14s} dx={dx:+d} dy={dy:+d}  {int((m>0.5).sum()):>7d} px{note}")

    out_p = ROOT / a.out
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(out_p)
    if not a.quiet:
        print(f"wrote {a.out}")
    sign = next((p for p in parts if p.get("mode") == "code" and p.get("enabled")), None)
    if sign:
        print(f"  note: part '{sign['id']}' is drawn in code — run the gilder on {a.out} to finish.")


if __name__ == "__main__":
    main()
