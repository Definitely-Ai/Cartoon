"""Repair DREW's bill at the SOURCE, and cut the tiles that carry it.

WHY
---
Round 3's judges kept rejecting the same three faults -- a smoothly curving
hooked bill whose black runs back along the LOWER JAW while the upper mandible
stays pale, a heavy brow over a stern eye, and leaf-plate plumage. Reading
canon/vision/studies/drew.png at full size shows why: THE OFFICIAL PORTRAIT
ITSELF HAS ALL THREE. Picture 2 is handed to the model with "copy THIS bird
identically", so every seed dutifully copied the defect and no amount of prose
in the EDITS could outvote it.

WHAT THIS DOES
--------------
1. BILL GEOMETRY, once, in one place (BILL below), built to the judges' spec:
   straight and level for two thirds, ONE sharp downward corner, straight again
   to a BLUNT ROUNDED end; solid black outboard of a single vertical line that
   crosses the WHOLE bill (top ridge and lower jaw turn black together); pale
   and finely hatched inboard; short -- eye-to-tip no longer than the skull is
   wide from the eye to the back of the head.
2. Draws that geometry as a flat two-tone DIAGRAM ->
   canon/characters/flamingo/kit/bill-diagram.png. No lettering anywhere on it:
   the model letters whatever it is shown.
3. Repaints the portrait: erases the old hooked bill by copying clean paper over
   it, draws the correct bill in its place, and lightens the heavy brow ->
   canon/characters/flamingo/kit/portrait-billfixed.png.
4. Re-cuts kit/bust.png and kit/head.png from the REPAIRED portrait (the old
   ones are kept as kit/_pre-round4-<name>.png).

    python scripts/make-drew-bill.py [--soften] [--no-tiles]
"""
from __future__ import annotations

import argparse
import shutil
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PORTRAIT = ROOT / "canon/vision/studies/drew.png"          # 1024x1536, never overwritten
KIT = ROOT / "canon/characters/flamingo/kit"

# ---------------------------------------------------------------- measured
# All in the portrait's own 1024x1536 pixels, read off the file at full size.
EYE = (589, 161)                 # centre of the iris
SKULL_BACK_X = 423               # rear contour of the skull at eye height
# eye-to-back-of-skull = 166 px -> the bill's tip may not pass x = 589 + 166 = 755.

# The face's front contour, from the loral feathers down past the gape. The old
# bill is everything to the RIGHT of this line; it is what gets erased.
# It starts ON the new bill's base edge (so the bill covers every nick it makes)
# and then swings RIGHT, staying clear of the neck's front contour all the way
# past the old bill's tip. Erasing into the neck breaks the outline, and a
# broken outline makes make-drew-picture1's silhouette fill leak.
FACE_FRONT = [(668, 180), (586, 274), (596, 300), (606, 330), (620, 370),
              (628, 410), (640, 450), (655, 490), (675, 520)]
ERASE_BOTTOM = 520
ERASE_RIGHT = 850
PAPER_PATCH = (884, 60, 1014, 460)       # clean paper to copy from (L,T,R,B)
# The old bill's own engraving, used to FILL the new one so the strokes are
# the house pen and not a flat vector shape (L,T,R,B in the portrait).
SHANK_TEXTURE = (637, 251, 740, 326)     # pale contour hatching
BLACK_TEXTURE = (694, 354, 786, 451)     # solid black, with its ridge highlight

# ------------------------------------------------------------ the geometry
# ONE bent stick. Top and bottom edge, base (slanted, it tucks into the face)
# to the blunt end; CORNER_X is where BOTH edges break downward AND where the
# black starts, so the two rules can never be drawn apart.
BILL = {
    "top":    [(668, 180), (712, 214), (757, 268)],
    "bottom": [(586, 274), (712, 256), (734, 292)],
    "corner_x": 706,                      # = two thirds of the way eye -> tip
    "nostril": (662, 228, 692, 238),      # a plain thin horizontal slit
}
# tip x = 757 -> eye-to-tip = 168 against a 166 px skull: short, as ordered.
# depth at the corner = 256 - 214 = 42 -> under a third of eye-to-tip (56).


def bill_polygon(g=BILL):
    return list(g["top"]) + list(reversed(g["bottom"]))


def draw_bill(d: ImageDraw.ImageDraw, g, ink=0, line=3, hatch_step=7, scale=1.0, off=(0, 0)):
    """The bent stick: white shank with light hatching, solid black outboard of
    corner_x, one blunt rounded end, a thin nostril slit."""
    def T(p):
        return (p[0] * scale + off[0], p[1] * scale + off[1])

    poly = [T(p) for p in bill_polygon(g)]
    cx = g["corner_x"] * scale + off[0]

    # pale shank
    d.polygon(poly, fill=255, outline=ink)
    for w in range(line):
        d.line(poly + [poly[0]], fill=ink, width=line)

    # light hatching inboard of the black line, clipped to the polygon
    xs = [p[0] for p in poly]
    ys = [p[1] for p in poly]
    hatch = Image.new("L", (int(max(xs)) + 4, int(max(ys)) + 4), 255)
    hd = ImageDraw.Draw(hatch)
    step = max(3, int(hatch_step * scale))
    for x in range(int(min(xs)), int(cx), step):
        hd.line([(x, min(ys) - 5), (x - int(14 * scale), max(ys) + 5)], fill=150, width=max(1, int(scale)))
    mask = Image.new("L", hatch.size, 0)
    ImageDraw.Draw(mask).polygon(poly, fill=255)
    # only inboard of the black line
    ImageDraw.Draw(mask).rectangle([cx, 0, hatch.size[0], hatch.size[1]], fill=0)
    return poly, cx, hatch, mask


def _lerp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def paint_bill(img: Image.Image, g=BILL, scale=1.0, off=(0, 0), line=3, engraved=False):
    """Draw the bill onto a greyscale image, in place.

    engraved=True draws it in the house pen -- lengthwise contour strokes over
    pale paper, a shadow under the ridge, a dense black cap with one bright ridge
    highlight -- which is what goes into a REFERENCE. engraved=False is the flat
    two-tone DIAGRAM, where the only job is to be impossible to misread.
    """
    def T(q):
        return (q[0] * scale + off[0], q[1] * scale + off[1])

    top = [T(q) for q in g["top"]]
    bot = [T(q) for q in g["bottom"]]
    poly = top + list(reversed(bot))
    cx = g["corner_x"] * scale + off[0]

    shape = Image.new("L", img.size, 0)
    ImageDraw.Draw(shape).polygon(poly, fill=255)
    inboard = shape.copy()
    ImageDraw.Draw(inboard).rectangle([cx, 0, img.size[0], img.size[1]], fill=0)
    outboard = shape.copy()
    ImageDraw.Draw(outboard).rectangle([0, 0, cx, img.size[1]], fill=0)

    # --- the pale shank -----------------------------------------------------
    img.paste(252, (0, 0), inboard)
    if engraved:
        strokes = Image.new("L", img.size, 255)
        sd = ImageDraw.Draw(strokes)
        n = 13
        for i in range(1, n):
            t = i / n
            a = _lerp(top[0], bot[0], t)                 # along the base edge
            b = _lerp(top[1], bot[1], t)                 # along the corner line
            tone = 120 + int(70 * abs(0.55 - t) * 2)     # darker toward the middle
            sd.line([a, b], fill=tone, width=max(1, int(round(scale))))
        # a shadow under the ridge and a deeper one along the lower jaw
        for off_t, tone in ((0.06, 150), (0.10, 175), (0.90, 120), (0.95, 95)):
            a = _lerp(top[0], bot[0], off_t)
            b = _lerp(top[1], bot[1], off_t)
            sd.line([a, b], fill=tone, width=max(2, int(round(2 * scale))))
        strokes = strokes.filter(ImageFilter.GaussianBlur(0.6 * scale))
        img.paste(strokes, (0, 0), inboard.filter(
            ImageFilter.MinFilter(max(3, int(round(3 * scale)) | 1))))
    else:
        hatch = Image.new("L", img.size, 255)
        hd = ImageDraw.Draw(hatch)
        n = 14
        for i in range(1, n):
            t = i / n
            hd.line([_lerp(top[0], bot[0], t), _lerp(top[1], bot[1], t)],
                    fill=150, width=max(1, int(round(scale))))
        img.paste(hatch, (0, 0), inboard.filter(
            ImageFilter.MinFilter(max(3, int(round(3 * scale)) | 1))))

    # --- the SOLID BLACK cap, both mandibles at once -------------------------
    img.paste(18 if engraved else 20, (0, 0), outboard)

    d = ImageDraw.Draw(img)
    # THE BLUNT ROUNDED END: a disc across the last of the bill, so the tip is a
    # rounded stub and never a point.
    t2, b2 = top[-1], bot[-1]
    mx, my = (t2[0] + b2[0]) / 2, (t2[1] + b2[1]) / 2
    r = ((t2[0] - b2[0]) ** 2 + (t2[1] - b2[1]) ** 2) ** 0.5 / 2
    d.ellipse([mx - r, my - r, mx + r, my + r], fill=18 if engraved else 20)

    if engraved:
        # one bright highlight along the ridge of the black -- the house does
        # this on every dark curved surface in the plate.
        hi = _lerp(top[1], bot[1], 0.16), _lerp(top[2], bot[2], 0.22)
        d.line([hi[0], hi[1]], fill=205, width=max(1, int(round(1.6 * scale))))

    # --- the contour -------------------------------------------------------
    edge = 55 if engraved else 0
    w = max(2, int(round((2 if engraved else 3) * scale)))
    d.line(top, fill=edge, width=w, joint="curve")
    d.line(bot, fill=edge, width=w, joint="curve")
    # the base line where the bill meets the feathers -- also closes the outline
    # so a silhouette fill of the head cannot leak out through the join.
    d.line([top[0], bot[0]], fill=edge, width=max(2, int(round(2 * scale))))

    # --- the nostril: a plain thin horizontal slit -------------------------
    nx0, ny0, nx1, ny1 = g["nostril"]
    box = [nx0 * scale + off[0], ny0 * scale + off[1], nx1 * scale + off[0], ny1 * scale + off[1]]
    if engraved:
        d.ellipse(box, outline=45, width=max(2, int(round(1.5 * scale))))
    else:
        d.ellipse(box, fill=60)

    if engraved:
        soft = img.filter(ImageFilter.GaussianBlur(0.7))
        img.paste(soft, (0, 0), shape.filter(ImageFilter.MaxFilter(3)).point(lambda v: 110 if v else 0))
    return img


# ------------------------------------------------------------------- steps
def erase_old_bill(im: Image.Image) -> Image.Image:
    """Copy clean paper over everything right of the face contour."""
    out = im.copy()
    px, py = PAPER_PATCH[0], PAPER_PATCH[1]
    pw, ph = PAPER_PATCH[2] - px, PAPER_PATCH[3] - py
    paper = im.crop(PAPER_PATCH)
    tile = Image.new("L", (ERASE_RIGHT + pw, ERASE_BOTTOM + ph), 255)
    for ty in range(0, tile.height, ph):
        for tx in range(0, tile.width, pw):
            tile.paste(paper, (tx, ty))

    mask = Image.new("L", im.size, 0)
    d = ImageDraw.Draw(mask)
    poly = FACE_FRONT + [(ERASE_RIGHT, ERASE_BOTTOM), (ERASE_RIGHT, FACE_FRONT[0][1])]
    d.polygon(poly, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(2))
    out.paste(tile.crop((0, 0, im.width, im.height)), (0, 0), mask)
    return out


def soften_brow(im: Image.Image, cx=572, cy=122, rx=88, ry=30, amount=0.62) -> Image.Image:
    """Lighten the heavy brow shelf above the eye so ONE fine contour arc is all
    that is left to copy. The lid itself (below cy) is not touched."""
    out = im.copy()
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=int(255 * amount))
    mask = mask.filter(ImageFilter.GaussianBlur(10))
    out.paste(248, (0, 0), mask)
    return out


def soften_plumage(im: Image.Image, amount=0.5) -> Image.Image:
    """Melt the leaf-plate feathers on the neck into a soft mottle so there is
    no shingle structure in the tile for the model to copy."""
    a = np.asarray(im).astype(np.float32)
    blur = np.asarray(im.filter(ImageFilter.GaussianBlur(5))).astype(np.float32)
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).polygon(
        [(300, 300), (300, 620), (360, 800), (470, 900), (600, 900), (600, 690),
         (520, 520), (560, 380), (620, 300)], fill=int(255 * amount))
    m = np.asarray(mask.filter(ImageFilter.GaussianBlur(12))).astype(np.float32) / 255.0
    # lift the mottle back toward paper so it reads pale, not grey
    mixed = a * (1 - m) + np.clip(blur * 0.55 + 255 * 0.45, 0, 255) * m
    return Image.fromarray(mixed.astype(np.uint8))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--soften", action="store_true", help="also melt the leaf plates on the neck")
    ap.add_argument("--no-tiles", action="store_true", help="diagram + portrait only")
    a = ap.parse_args()
    KIT.mkdir(parents=True, exist_ok=True)

    # ---- 1. the flat two-tone diagram, same geometry, 7x -------------------
    S = 7.0
    xs = [p[0] for p in bill_polygon()]
    ys = [p[1] for p in bill_polygon()]
    pad = 70
    W = int((max(xs) - min(xs)) * S) + 2 * pad
    H = int((max(ys) - min(ys)) * S) + 2 * pad
    diagram = Image.new("L", (W, H), 255)
    paint_bill(diagram, scale=S, off=(pad - min(xs) * S, pad - min(ys) * S), line=3)
    dpath = KIT / "bill-diagram.png"
    diagram.save(dpath)
    print(f"diagram   {dpath}  ({W}x{H})  no lettering on it")

    # ---- 2. the repaired portrait -----------------------------------------
    im = Image.open(PORTRAIT).convert("L")
    fixed = erase_old_bill(im)
    fixed = paint_bill(fixed, scale=1.0, off=(0, 0), line=3, engraved=True)
    fixed = soften_brow(fixed)
    if a.soften:
        fixed = soften_plumage(fixed)
    ppath = KIT / "portrait-billfixed.png"
    fixed.save(ppath)
    print(f"portrait  {ppath}  ({fixed.width}x{fixed.height})  soften_plumage={a.soften}")

    # ---- 3. re-cut the kit tiles from the REPAIRED portrait ----------------
    if not a.no_tiles:
        for name, box in (("bust.png", (170, 20, 900, 880)), ("head.png", (400, 60, 900, 560))):
            dst = KIT / name
            if dst.exists() and not (KIT / f"_pre-round4-{name}").exists():
                shutil.copyfile(dst, KIT / f"_pre-round4-{name}")
            fixed.crop(box).save(dst)
            print(f"tile      {dst}  <- portrait-billfixed {box}")


if __name__ == "__main__":
    main()
