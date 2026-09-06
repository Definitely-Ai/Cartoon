"""Lay the street into the room's window, through the MEASURED glass quad.

The room and the street are rendered separately and only the glass is taken
from the street plate. This is the parts rule: a render redraws the whole
picture, so a rectangle pasted back drags that redraw onto its neighbours -
every fault the founder caught in September came from doing it the other way.
The outline does the cutting, and it is the same quad the geometry measured.

No tone matching here, deliberately. Ring-matching exists to stop a part coming
back brighter than its neighbours, but the street is SUPPOSED to be brighter: it
is daylight outside and gloom in here, and that contrast is the picture.

    python scripts/compose-room.py <room.png> <street.png> <out.png>
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
import json

room_p, street_p, out_p = sys.argv[1:4]
q = json.loads((ROOT / "canon/room-kit/v2/quads.json").read_text(encoding="utf8"))["windowQuad"]
room = Image.open(room_p).convert("L")
street = Image.open(street_p).convert("L").resize(room.size, Image.LANCZOS)

# Shrink the quad a little towards its own centre so the window's FRAME, its
# reveal and its glazing bead all stay the room's - only the view is replaced.
cx = sum(p[0] for p in q) / 4.0
cy = sum(p[1] for p in q) / 4.0
inner = [((x - cx) * 0.985 + cx, (y - cy) * 0.985 + cy) for x, y in q]

mask = Image.new("L", room.size, 0)
ImageDraw.Draw(mask).polygon([tuple(p) for p in inner], fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(2.2))      # a hair of feather, no halo
out = Image.composite(street, room, mask)

# A faint sheen ACROSS the glass, so it reads as a pane and not as a hole in the
# wall: two soft diagonal bands of light, the engraver's shorthand for glass.
# Subtle on purpose - the street behind must stay legible.
a = np.asarray(out, np.float32)
m = np.asarray(mask, np.float32) / 255.0
yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]].astype(np.float32)
diag = (xx + 0.55 * yy) / a.shape[1]
sheen = (np.exp(-((diag - 0.62) / 0.070) ** 2) * 0.16
         + np.exp(-((diag - 0.86) / 0.045) ** 2) * 0.10)
a = a + (255.0 - a) * sheen * m
out = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
out.save(out_p)
print(f"{out_p}: street laid into the glass quad "
      f"{[[round(v) for v in p] for p in q]}")
