#!/usr/bin/env python3
"""ABBY ROUND 2 - build Picture 1 from the approved plate sc04.

The lead's root-cause call: the shipped PLATE_CROPS["abby"] tile (trio.png at
486,470,360,450) is cut off at the collar, her mouth is open with the tongue
showing and she stares straight out - and at fast Lightning cfg 1 the model
copies Picture 1 and cannot be argued out of it. Replace it with a crop of a
plate Rick already accepted:

    canon/showcase-retired/sc04-fourteen-dollars-of-roof.png  box 470,345,345,680

TWO CORRECTIONS TO THAT CROP, made because I cut it and looked at it on a
coordinate grid before sending it:

  1. BARCLAY IS IN IT. His pale muzzle and his black nose sit in the bottom
     right corner - crop x 255-345, y 596-680 of the 345x680 box. The lead's
     own EDIT 12 says every shape in the finished picture that is not Abby is
     furniture, glass or timber, and a second animal muzzle in Picture 1 at
     cfg 1 is precisely the extra-figure lesson this round exists to unteach.
     Painted out with marble cloned from the same plate. The rocks glass's rim
     ends at crop x~265, so the fill starts at x=262 and the glass survives.

  2. THE RENEWAL NOTICE ENVELOPE, bottom left, carries lettering, and the
     house rules say nothing printed lies on the marble in a study. Painted
     out with the same marble.

Everything else is the approved plate untouched: one figure, head to hands,
closed mouth, eyes down at the customer, both fur-backed hands at work, the
counter across the bottom, the back bar behind, the compact square-muzzled
Westie head.
"""
import sys
from PIL import Image, ImageFilter

PLATE = "Z:/ImageGenerator/Cartoon/canon/showcase-retired/sc04-fourteen-dollars-of-roof.png"
BOX = (470, 345, 345, 680)          # left, top, w, h
MARBLE = (60, 955, 200, 1025)       # clean near-counter marble on the same plate
OUT = sys.argv[1] if len(sys.argv) > 1 else "abby-p1-round2.png"

plate = Image.open(PLATE).convert("L")
L, T, W, H = BOX
tile = plate.crop((L, T, L + W, T + H))

marble = plate.crop(MARBLE)


def patch(dst, rect, feather=5):
    """Clone marble over rect=(x0,y0,x1,y1) in tile coords, feathered."""
    x0, y0, x1, y1 = rect
    w, h = x1 - x0, y1 - y0
    fill = Image.new("L", (w, h))
    for oy in range(0, h, marble.height):
        for ox in range(0, w, marble.width):
            fill.paste(marble, (ox, oy))
    mask = Image.new("L", (w, h), 255)
    mask = mask.filter(ImageFilter.GaussianBlur(0))
    # feather every edge that is interior to the tile
    px = mask.load()
    for yy in range(h):
        for xx in range(w):
            d = min(
                xx + feather if x0 == 0 else xx,
                yy + feather if y0 == 0 else yy,
                (w - 1 - xx) + feather if x1 >= dst.width else (w - 1 - xx),
                (h - 1 - yy) + feather if y1 >= dst.height else (h - 1 - yy),
            )
            if d < feather:
                px[xx, yy] = int(255 * d / feather)
    dst.paste(fill, (x0, y0), mask)


patch(tile, (262, 594, 345, 680))   # Barclay's muzzle and nose
patch(tile, (0, 643, 142, 680))     # the RENEWAL NOTICE envelope


# ROUND 2, THIRD PASS: the 345x680 crop is aspect 0.507 and the house shape is
# 4:5 (0.80). Two passes with it as Picture 1 lost the ROOM entirely - blank
# sketchbook paper, no back bar - which the round-1 trio tile (360x450, exactly
# 4:5) never did. Pass "pad" as the second argument to reflect-pad the crop out
# to 545x680 so Picture 1 arrives in the house shape.
if len(sys.argv) > 2 and sys.argv[2] == "pad":
    import numpy as np
    a = np.asarray(tile)
    want = round(tile.height * 0.8)
    extra = want - tile.width
    left = extra // 2
    a = np.pad(a, ((0, 0), (left, extra - left)), mode="reflect")
    tile = Image.fromarray(a)

tile.save(OUT)
print(f"{OUT}  {tile.size[0]}x{tile.size[1]}  from {PLATE} box {BOX}")
