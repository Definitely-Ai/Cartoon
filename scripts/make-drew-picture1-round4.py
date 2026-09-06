"""Build ROUND 4's Picture 1 for the DREW study, end to end.

make-drew-picture1.py drops the corrected head onto the approved plate crop.
Two more things have to be true of Picture 1 before it is handed to the model,
because at the house's fast Lightning pass (8 steps, cfg 1) the edit COPIES
Picture 1 far more than it obeys prose:

  * the head must come from the REPAIRED portrait (kit/portrait-billfixed.png),
    not canon/vision/studies/drew.png, whose bill is the defect itself;
  * the rocks glass at the right edge must go, because "EXACTLY ONE DRINK" loses
    every argument with a picture of two drinks.

    python scripts/make-drew-picture1-round4.py --out PATH
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PORTRAIT = ROOT / "canon/characters/flamingo/kit/portrait-billfixed.png"

GLASS_BOX = (676, 626, 780, 850)          # the rocks glass in the 780x975 crop
MARBLE_SRC = (505, 700, 655, 795)         # clean marble, clear of stem and bowl


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)

    subprocess.run([sys.executable, str(ROOT / "scripts/make-drew-picture1.py"),
                    "--out", str(out), "--portrait", str(PORTRAIT)], check=True)

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
