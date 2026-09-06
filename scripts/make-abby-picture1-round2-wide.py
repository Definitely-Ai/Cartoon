#!/usr/bin/env python3
"""ABBY ROUND 2 - Picture 1, THE HOUSE-SHAPE CUT of the approved plate sc04.

Why a second builder. make-abby-picture1-round2.py cut the lead's box
(470,345,345,680) out of canon/showcase-retired/sc04-fourteen-dollars-of-roof.png.
That crop is aspect 0.507 and the house shape is 4:5 (0.80), and TWICE, on six
seeds and then on two more with every human noun purged from the prompt, that
tall narrow Picture 1 came back with THE ROOM GONE - Abby on blank sketchbook
paper, no back bar, no counter - and split into two beings. The round-1 tile
that never lost the room was trio.png at 360x450: exactly 4:5. Reflect-padding
the narrow crop out to 4:5 is not an option either; it mirrors her ears and her
arms and hands a second Abby into both margins.

So the box is re-cut WIDE, in the house shape, straight out of the same
approved plate:

    box (440, 345, 544, 680)   ->  544x680, aspect 0.800

and the two things inside it that are not Abby, the room, or her work are
painted out with marble cloned from the same plate:

  * BARCLAY'S HEAD, plate x 745-984, y 880-1025 - the whole bottom-right
    corner. He is a second figure in the base picture, and at cfg 1 the base
    picture is what gets drawn.
  * THE RENEWAL NOTICE ENVELOPE, plate x 478-608, y 983-1025, which carries
    lettering the study's own rules forbid on the marble.

Everything else is the approved plate untouched: one figure, head to hands,
closed mouth, eyes down at her work, both fur-backed hands on the marble, the
counter across the bottom, the back bar running out to BOTH edges, and the
compact square-muzzled Westie head Rick signed off.

usage: make-abby-picture1-round2-wide.py OUT.png
"""
import sys

import numpy as np
from PIL import Image

PLATE = "Z:/ImageGenerator/Cartoon/canon/showcase-retired/sc04-fourteen-dollars-of-roof.png"
BOX = (440, 345, 544, 680)          # left, top, w, h - 4:5
MARBLE = (60, 965, 200, 1060)       # clean near-counter marble on the same plate
BARCLAY = (745, 880, 984, 1025)     # plate coords
ENVELOPE = (478, 983, 608, 1025)    # plate coords
OUT = sys.argv[1] if len(sys.argv) > 1 else "abby-p1-round2-wide.png"

plate = Image.open(PLATE).convert("L")
L, T, W, H = BOX
tile = plate.crop((L, T, L + W, T + H))
marble = plate.crop(MARBLE)


def patch(dst, rect, feather=6):
    """Clone marble over rect=(x0,y0,x1,y1) in TILE coords, feathered on every
    edge that does not sit on the tile's own border."""
    x0, y0, x1, y1 = rect
    w, h = x1 - x0, y1 - y0
    fill = Image.new("L", (w, h))
    for oy in range(0, h, marble.height):
        for ox in range(0, w, marble.width):
            fill.paste(marble, (ox, oy))
    m = np.full((h, w), 255, dtype=np.uint8)
    for i in range(feather):
        a = int(255 * i / feather)
        if x0 > 0:
            m[:, i] = np.minimum(m[:, i], a)
        if y0 > 0:
            m[i, :] = np.minimum(m[i, :], a)
        if x1 < dst.width:
            m[:, w - 1 - i] = np.minimum(m[:, w - 1 - i], a)
        if y1 < dst.height:
            m[h - 1 - i, :] = np.minimum(m[h - 1 - i, :], a)
    dst.paste(fill, (x0, y0), Image.fromarray(m))


for x0, y0, x1, y1 in (BARCLAY, ENVELOPE):
    patch(tile, (max(0, x0 - L), max(0, y0 - T), min(W, x1 - L), min(H, y1 - T)))

tile.save(OUT)
print(f"{OUT}  {tile.size[0]}x{tile.size[1]}  aspect {tile.size[0]/tile.size[1]:.3f}  "
      f"from {PLATE} box {BOX}")
