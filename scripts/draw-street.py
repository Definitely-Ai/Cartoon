"""Block in the STREET beyond the window, in values, and warp it onto the glass.

Same doctrine as the room: the model renders material well and reasons about
placement badly, so what is out there is decided here and only the drawing of
it is asked for. The street is built in its own rectangle and then mapped onto
the measured glass quad, so it sits in the window's perspective rather than
being pasted flat across it.

Founder's brief: ground floor, looking across at a modern New York building -
glass curtain wall over an older stone base - with a hot dog stand and
indiscriminate people around it on the pavement. No cars, no clutter.

    python scripts/draw-street.py
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
KIT = ROOT / "canon/room-kit/v2"
TW, TH = 620, 1500          # the street's own rectangle, before the warp


def coeffs(dst, src):
    """Solve the homography PIL wants: it maps OUTPUT pixels back to INPUT."""
    A, B = [], []
    for (dx, dy), (sx, sy) in zip(dst, src):
        A += [[dx, dy, 1, 0, 0, 0, -sx * dx, -sx * dy],
              [0, 0, 0, dx, dy, 1, -sy * dx, -sy * dy]]
        B += [sx, sy]
    return np.linalg.solve(np.array(A, np.float64), np.array(B, np.float64))


def street() -> Image.Image:
    img = Image.new("L", (TW, TH), 210)
    d = ImageDraw.Draw(img)
    y = lambda f: int(TH * f)
    x = lambda f: int(TW * f)

    # --- the building opposite: glass curtain wall over an older stone base ---
    d.rectangle([0, 0, TW, y(0.54)], fill=150)                  # the curtain wall
    for i in range(9):                                          # floor bands
        yy = y(0.02 + i * 0.062)
        d.rectangle([0, yy, TW, yy + 9], fill=104)
        d.rectangle([0, yy + 9, TW, yy + int(TH * 0.052)], fill=168)
    for i in range(11):                                         # mullions
        xx = x(0.02 + i * 0.095)
        d.rectangle([xx, 0, xx + 6, y(0.54)], fill=112)
    d.rectangle([0, y(0.52), TW, y(0.565)], fill=86)            # the transfer beam

    d.rectangle([0, y(0.565), TW, y(0.775)], fill=196)          # the stone base
    for i in range(5):                                          # its pilasters
        xx = x(0.03 + i * 0.225)
        d.rectangle([xx, y(0.565), xx + x(0.05), y(0.775)], fill=172)
    for i in range(4):                                          # shopfront glass
        xx = x(0.10 + i * 0.225)
        d.rectangle([xx, y(0.60), xx + x(0.13), y(0.755)], fill=92)

    d.rectangle([0, y(0.775), TW, y(0.80)], fill=132)           # the kerbline
    d.rectangle([0, y(0.80), TW, TH], fill=214)                 # the pavement
    for i in range(7):                                          # paving joints
        yy = y(0.82 + i * 0.028)
        d.line([0, yy, TW, yy], fill=186, width=3)

    # --- the hot dog stand, and people about it ------------------------------
    cx0, cx1 = x(0.30), x(0.66)
    d.rectangle([cx0, y(0.72), cx1, y(0.735)], fill=70)         # the umbrella pole top
    d.polygon([(x(0.22), y(0.665)), (x(0.74), y(0.665)),
               (x(0.68), y(0.625)), (x(0.28), y(0.625))], fill=96)   # the canopy
    for i in range(6):                                          # its scalloped valance
        xx = x(0.22) + i * (x(0.52) // 6)
        d.rectangle([xx, y(0.665), xx + x(0.043), y(0.685)], fill=150 if i % 2 else 84)
    d.rectangle([x(0.46), y(0.665), x(0.475), y(0.735)], fill=64)    # the pole
    d.rectangle([cx0, y(0.735), cx1, y(0.815)], fill=178)       # the cart body
    d.rectangle([cx0, y(0.735), cx1, y(0.752)], fill=118)       # its counter edge
    d.rectangle([x(0.34), y(0.762), x(0.46), y(0.80)], fill=120)     # a hatch

    for fx, fh, fv in ((0.13, 0.185, 74), (0.24, 0.170, 92), (0.71, 0.178, 80),
                       (0.84, 0.163, 96), (0.60, 0.150, 86)):
        top = y(0.815 - fh)
        d.ellipse([x(fx) - 13, top, x(fx) + 13, top + 30], fill=fv)          # head
        d.polygon([(x(fx) - 24, top + 34), (x(fx) + 24, top + 34),
                   (x(fx) + 30, y(0.845)), (x(fx) - 30, y(0.845))], fill=fv)  # body
    return img


def main() -> None:
    q = json.loads((KIT / "quads.json").read_text(encoding="utf8"))["windowQuad"]
    base = Image.open(KIT / "01-values.png").convert("L")
    W, H = base.size
    warped = street().transform(
        (W, H), Image.PERSPECTIVE,
        coeffs(q, [(0, 0), (TW, 0), (TW, TH), (0, TH)]), Image.BICUBIC, fillcolor=210)
    mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mask).polygon([tuple(p) for p in q], fill=255)
    out = Image.composite(warped, base, mask)
    out.save(KIT / "01-values-street.png")
    print(f"wrote canon/room-kit/v2/01-values-street.png  (glass quad {[[round(v) for v in p] for p in q]})")


if __name__ == "__main__":
    main()
