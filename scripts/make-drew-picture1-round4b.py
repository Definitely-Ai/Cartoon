"""ROUND 4B Picture 1 for the DREW study -- the judges' reference fix.

Two things were wrong with round 4's Picture 1 and the renders copied both:

  * the head came from kit/portrait-billfixed.png, a RETOUCHED portrait whose
    bill had been painted over as a flat two-tone bent stick, and a hard-edged
    white mask ("the ghost bill") was laid over the bill region. An edit model
    copies a flat vector shape as a flat vector shape.
  * the pasted head sat LOW: the neck read as a J-hook with the head at
    shoulder level, which no amount of prose in EDIT 14 could outvote.

So: the head is cut from canon/vision/studies/drew.png UNRETOUCHED (it already
carries the correct deep, once-bent, black-tipped flamingo bill), it is pasted
HIGHER so the eye clears the shoulder line and background shows under the jaw,
and no mask is laid on the bill at all. The only paint-out left is the second
rocks glass at the right edge, which "EXACTLY ONE DRINK" kept losing to.

    python scripts/make-drew-picture1-round4b.py --out PATH [--dy N] [--scale F]
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PORTRAIT = ROOT / "canon/vision/studies/drew.png"   # UNRETOUCHED. The bill is correct here.

GLASS_BOX = (676, 626, 780, 850)          # the rocks glass in the 780x975 crop
MARBLE_SRC = (505, 700, 655, 795)         # clean marble, clear of stem and bowl


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--scale", type=float, default=0.72)
    ap.add_argument("--dx", type=int, default=10)
    ap.add_argument("--dy", type=int, default=105)
    a = ap.parse_args()
    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)

    subprocess.run([sys.executable, str(ROOT / "scripts/make-drew-picture1.py"),
                    "--out", str(out), "--portrait", str(PORTRAIT),
                    "--scale", str(a.scale), "--dx", str(a.dx), "--dy", str(a.dy)], check=True)

    im = Image.open(out).convert("L")
    src = im.crop(MARBLE_SRC)
    sw, sh = src.size
    tile = Image.new("L", im.size, 255)
    for y in range(GLASS_BOX[1] - sh, GLASS_BOX[3] + sh, sh):
        for x in range(GLASS_BOX[0] - sw, GLASS_BOX[2] + sw, sw):
            tile.paste(src, (x, y))
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rectangle(GLASS_BOX, fill=255)
    im.paste(tile, (0, 0), mask.filter(ImageFilter.GaussianBlur(7)))
    im.save(out)
    print(f"{out}  ({im.width}x{im.height})  second glass removed")


if __name__ == "__main__":
    main()
