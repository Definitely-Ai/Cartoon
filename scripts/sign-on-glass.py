"""Gild THE SWINGING DOOR onto the window, mirrored, in code.

Lettering is code and never model glyphs: the model garbles mirrored text every
time (reliably the R in DOOR) and its letterforms are crude next to the
engraving. The name is typeset here, worked up at 4x in the glass's own flat
space - fill, outline, shade - and warped ONCE onto the measured glass quad, so
it lies on the pane in perspective with crisp edges.

The lesson of the version before this one: four effects stacked on letters
that are 230 px wide on the plate turned them to mud, and doing the outline and
shade AFTER the warp made every edge coarse. A gilded pub window is simple -
light leaf, one crisp dark outline, a small solid shade - and it is BIG.

MIRRORED (founder, 2026-09-04: 'no, I want it mirrored'): the leaf is on the
street face of the glass and you read the back of it. No flip here - the glass
quad runs corner-end first, so the warp reverses the text on its own.

This runs LAST. Gilding is pixels, and anything that repaints the plate
afterwards wipes it.

    python scripts/sign-on-glass.py <in.png> <out.png>
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
LINES = ["THE", "SWINGING", "DOOR"]
FONT = "C:/Windows/Fonts/framd.ttf"   # a DIN-style modern face: readable and classy (founder, 2026-09-05)   # clean modern capitals: a Wall Street bar, not a Victorian pub
TW, TH = 620, 1500                 # the glass's flat space (shared with the street)
SS = 4                             # worked at 4x, warped once
U0, U1 = 0.03, 0.80                # solved for the 16-degree pane: 34 px inside the frame's edge
                                   # - the pane's middle TO THE EYE: the near half is bigger on
                                   # screen, so the visual centre sits nearer the camera than u=0.5
V0, V1 = 0.24, 0.78                # the middle of the pane (founder, 2026-09-05)
TRACK = 0.10                       # air between the capitals (founder: too close together)
FROST = 0.45                       # an even haze over the WHOLE pane, foggier (founder, 2026-09-04)
LEAF_HI, LEAF_LO = 30.0, 16.0      # DARK against the daylight: from inside, lettering on a bright
                                   # window reads as silhouette, and light leaf on a pale street was
                                   # unreadable (founder, 2026-09-04)
OUTLINE_PX = 2.6                   # on the plate, in pixels: a light keyline round the dark letter
SHADE_PX = 4.5                     # the block shade's offset on the plate
OUTLINE_V, SHADE_V = 252.0, 14.0


def coeffs(dst, src):
    """The homography PIL wants: OUTPUT pixels back to INPUT pixels."""
    A, B = [], []
    for (dx, dy), (sx, sy) in zip(dst, src):
        A += [[dx, dy, 1, 0, 0, 0, -sx * dx, -sx * dy],
              [0, 0, 0, dx, dy, 1, -sy * dx, -sy * dy]]
        B += [sx, sy]
    return np.linalg.solve(np.array(A, np.float64), np.array(B, np.float64))


def letters() -> np.ndarray:
    """THE / SWINGING / DOOR, three straight lines at ONE size - the largest the
    pane's width allows for the widest word (founder, 2026-09-05: 'all in big
    text like DOOR'). A condensed bold, so the letters are as tall as they can be
    for that width. 4x alpha in the glass's flat space."""
    W, H = TW * SS, TH * SS
    tex = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(tex)
    box_w, box_h = (U1 - U0) * W, (V1 - V0) * H
    cx = U0 * W + box_w / 2
    widest = max(LINES, key=len)
    size = 20
    while size < 1600:
        f = ImageFont.truetype(FONT, size + 4)
        try:
            f.set_variation_by_name('Bold')
        except Exception:
            pass
        b = d.textbbox((0, 0), widest, font=f)
        if (b[2] - b[0] + TRACK * size * (len(widest) - 1) > box_w * 0.96
                or (b[3] - b[1]) * len(LINES) * 1.30 > box_h):
            break
        size += 4
    font = ImageFont.truetype(FONT, size)
    try:
        font.set_variation_by_name('Bold')
    except Exception:
        pass
    gap = TRACK * size
    lh = box_h / len(LINES)
    for i, line in enumerate(LINES):
        widths = [d.textbbox((0, 0), ch, font=font)[2] - d.textbbox((0, 0), ch, font=font)[0] for ch in line]
        total = sum(widths) + gap * (len(line) - 1)
        b = d.textbbox((0, 0), line, font=font)
        x = cx - total / 2
        y = V0 * H + i * lh + (lh - (b[3] - b[1])) / 2 - b[1]
        for ch, w_ in zip(line, widths):
            cb = d.textbbox((0, 0), ch, font=font)
            d.text((x - cb[0], y), ch, fill=255, font=font)
            x += w_ + gap
    return np.asarray(tex, np.float32) / 255.0


def main() -> None:
    src, out_p = sys.argv[1:3]
    base = Image.open(src).convert("L")
    PW, PH = base.size
    q = json.loads((ROOT / "canon/room-kit/v2/quads.json").read_text(encoding="utf8"))["windowQuad"]

    # texture pixels per plate pixel across the visible glass, so the outline
    # and the shade are sized on the PLATE and not in the texture
    vis_w = max(abs(q[0][0] - q[1][0]), 1)               # the pane's width on the plate
    tpp = TW * SS / vis_w
    a = letters()
    k = int(OUTLINE_PX * tpp) * 2 + 1
    outline = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(k)),
                         np.float32) / 255.0
    outline = np.clip(outline - a, 0, 1)
    off = int(SHADE_PX * tpp)
    shade = np.roll(np.roll(a + outline, off, axis=0), -off, axis=1)   # -u in the texture is +x on the plate
    shade = np.clip(shade - a - outline, 0, 1)

    # THE FROSTED BAND. A modern bar window carries its name on an etched band;
    # here it is what makes the letters legible - it takes the building's grid
    # out from behind them. Soft-edged, semi-opaque, sized to the text block.
    H = a.shape[0]
    band = np.full_like(a, FROST)                        # the whole pane, evenly

    # the sign as one layer with one alpha, in the glass's space
    ramp = np.linspace(0, 1, H, dtype=np.float32)[:, None]
    leaf = LEAF_HI + (LEAF_LO - LEAF_HI) * ramp
    ink = np.clip(a + outline + shade, 0, 1)
    layer_ink = leaf * a + OUTLINE_V * outline + SHADE_V * shade
    layer_ink = np.where(ink > 0, layer_ink / np.maximum(ink, 1e-6), 0)
    # the band lies UNDER the ink: white where only the band is, ink where ink is
    alpha = np.clip(ink + band * (1 - ink), 0, 1)
    layer = np.where(alpha > 0, (layer_ink * ink + 246.0 * band * (1 - ink)) / np.maximum(alpha, 1e-6), 0)

    cf = coeffs(q, [(0, 0), (TW * SS, 0), (TW * SS, TH * SS), (0, TH * SS)])
    warp = lambda arr: np.asarray(Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
                                  .transform((PW, PH), Image.PERSPECTIVE, cf, Image.BICUBIC, fillcolor=0),
                                  np.float32)
    L = warp(layer)
    A = warp(alpha * 255.0) / 255.0
    A = np.clip(A, 0, 1)                                 # the band's soft edge must survive the resample
    img = np.asarray(base, np.float32)
    out = img * (1 - A) + L * A
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(out_p)
    print(f"{out_p}: gilded {' '.join(LINES)} onto the glass, mirrored ({int((A > 0.5).sum())} px)")


if __name__ == "__main__":
    main()
