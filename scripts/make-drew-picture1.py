"""Pre-composite Picture 1 for a DREW character study.

WHY
---
Qwen-image-edit copies Picture 1's silhouette. The approved plate crop
(canon/plates/duo.png @ 40,500,780x975) contains the three faults the founder
named -- a hooked black-jawed bill, a hunched J-neck and scale-like plumage --
so six seeds of prose lost the argument to one picture six times. This script
hands the edit a Picture 1 that already has the RIGHT head on it: the plate
supplies the room, the camera and the light; canon/vision/studies/drew.png
supplies the head, bill and S-neck. The seam is left crude on purpose -- the
edit model's job is to blend a correct head, not to invent one.

WHAT IT DOES
------------
1. Cuts the plate crop (the study's Picture 1).
2. Paints out the old head + bill + neck above the collar by copying clean back
   bar from further right on the same plate, so the hole reads as shelving.
3. Cuts DREW's head + neck out of the official portrait as a filled SILHOUETTE
   (threshold -> close -> fill holes -> largest component), so the pale plumage
   comes across opaque instead of letting the shelf show through it.
4. Scales it to the plate's head size, drops it so the neck base meets the
   collar, feathers the mask, and pastes.

    python scripts/make-drew-picture1.py --out PATH [--scale 0.60] [--dx 26] [--dy 143]
"""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent

PLATE = ROOT / "canon/plates/duo.png"
PLATE_BOX = (40, 500, 780, 975)          # L,T,W,H -- round 2's Picture 1, unchanged

PORTRAIT = ROOT / "canon/vision/studies/drew.png"
HEAD_CUT = (170, 30, 860, 660)           # L,T,R,B in drew.png: head, bill and neck to the collar

# The hole to paint out in the plate crop, and where to copy cover from.
ERASE = (108, 118, 482, 502)             # L,T,R,B in the 780x975 crop -- old head, bill, neck
COVER_DX = 300                           # clean back bar this far right, same rows


def silhouette(im: Image.Image) -> np.ndarray:
    """A filled mask of the drawn figure: ink -> close the outline -> fill the
    interior -> keep the largest blob. The engraving's outline is closed, so the
    white plumage inside comes back as solid."""
    ink = np.asarray(im.convert("L")) < 205
    ink = ndimage.binary_closing(ink, structure=np.ones((9, 9)))
    # The neck is CUT by the bottom of the crop, so its outline is open there and
    # fill_holes leaks straight out of it. Ink one row along the bottom to close
    # that mouth; the background still reaches the other three borders, so only
    # the figure's interior counts as enclosed.
    ink[-1, :] = True
    filled = ndimage.binary_fill_holes(ink)
    filled[-1, :] = ink[-1, :] & filled[-2, :]
    lab, n = ndimage.label(filled)
    if n:
        sizes = ndimage.sum(filled, lab, range(1, n + 1))
        filled = lab == (int(np.argmax(sizes)) + 1)
    return filled


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--scale", type=float, default=0.72)
    ap.add_argument("--dx", type=int, default=10)
    ap.add_argument("--dy", type=int, default=105)
    ap.add_argument("--feather", type=float, default=2.5)
    ap.add_argument("--portrait", default="", help="use THIS portrait for the head (default canon/vision/studies/drew.png)")
    a = ap.parse_args()

    L, T, W, H = PLATE_BOX
    plate = Image.open(PLATE).convert("L").crop((L, T, L + W, T + H))

    # 2. paint the old bird out with clean back bar from the same rows
    ex0, ey0, ex1, ey1 = ERASE
    pad = 40                                     # bleed, so the patch has room to fade out
    cover = plate.crop((ex0 + COVER_DX - pad, ey0 - pad, ex1 + COVER_DX + pad, ey1 + pad))
    patch = Image.new("L", (ex1 - ex0 + 2 * pad, ey1 - ey0 + 2 * pad), 0)
    patch.paste(Image.new("L", (ex1 - ex0, ey1 - ey0), 255), (pad, pad))
    patch = patch.filter(ImageFilter.GaussianBlur(pad / 2))   # soft on all four sides
    base = plate.copy()
    base.paste(cover, (ex0 - pad, ey0 - pad), patch)

    # 3. the correct head + neck, as a filled silhouette
    hl, ht, hr, hb = HEAD_CUT
    src = Path(a.portrait) if a.portrait else PORTRAIT
    head = Image.open(src).convert("L").crop((hl, ht, hr, hb))
    mask = Image.fromarray((silhouette(head) * 255).astype(np.uint8))

    nw, nh = round(head.width * a.scale), round(head.height * a.scale)
    head = head.resize((nw, nh), Image.LANCZOS)
    mask = mask.resize((nw, nh), Image.LANCZOS)

    # fade the bottom 60px of the mask so the neck dissolves into the collar
    m = np.asarray(mask).astype(np.float32)
    fade = 60
    ramp = np.linspace(1.0, 0.0, fade)[:, None]
    m[-fade:, :] *= ramp
    mask = Image.fromarray(m.astype(np.uint8)).filter(ImageFilter.GaussianBlur(a.feather))

    base.paste(head, (a.dx, a.dy), mask)
    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    base.save(out)
    print(f"{out}  ({base.size[0]}x{base.size[1]})  scale={a.scale} offset=({a.dx},{a.dy})")


if __name__ == "__main__":
    main()
