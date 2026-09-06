"""The round-4 contact sheet for DREW: six seeds beside the kit tiles.

Left block: the six pass-1 renders at 420 px, labelled with their seed and the
one-line verdict. Right column: the kit's bust and head tiles as they now stand,
so the founder can see that the tiles and the renders finally carry the same
bill.

    python scripts/build-drew-round4-sheet.py --out PATH
"""
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SCRATCH = Path("C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/"
               "7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies")
RENDERS = SCRATCH / "drew/round-4"
KIT = ROOT / "canon/characters/flamingo/kit"

W = 420
SEEDS = [
    (55, "clean - one drink, no belt, hand on the marble"),
    (21, "REJECT - human bartender behind the bar"),
    (62, "BEST - cleanest bill and the most open eye"),
    (78, "REJECT - a second bird beside the martini"),
    (84, "REJECT - human bartender behind the bar"),
    (93, "clean staging, shirt sleeve drifts white"),
]


def font(size):
    for name in ("arial.ttf", "segoeui.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    f_title = font(30)
    f_lab = font(19)
    f_small = font(16)

    tiles = []
    for seed, note in SEEDS:
        im = Image.open(RENDERS / f"drew-seed{seed}.png").convert("L")
        tiles.append((seed, note, im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)))
    th = tiles[0][2].height

    kit = []
    for name in ("bust.png", "head.png"):
        im = Image.open(KIT / name).convert("L")
        kw = 330
        kit.append((name, im.resize((kw, round(im.height * kw / im.width)), Image.LANCZOS)))

    pad, gap, lab = 30, 16, 52
    left_w = 3 * W + 2 * gap
    right_w = 330
    sheet_w = pad + left_w + 40 + right_w + pad
    sheet_h = 92 + 2 * (th + lab) + gap + pad

    c = Image.new("L", (sheet_w, sheet_h), 255)
    d = ImageDraw.Draw(c)
    d.text((pad, 22), "DREW - round 4, six seeds", font=f_title, fill=0)
    d.text((pad, 58),
           "Picture 1 rebuilt from the repaired portrait (correct bill, no second glass); "
           "Picture 2 re-cut head-and-shoulders. local/qwen-image-edit-2511, fast 8-step cfg 1, 4:5.",
           font=f_small, fill=60)

    for i, (seed, note, im) in enumerate(tiles):
        x = pad + (i % 3) * (W + gap)
        y = 92 + (i // 3) * (th + lab + gap)
        c.paste(im, (x, y))
        d.rectangle([x, y, x + W - 1, y + th - 1], outline=170)
        d.text((x, y + th + 6), f"seed {seed}", font=f_lab, fill=0)
        d.text((x, y + th + 28), note, font=f_small, fill=70)

    x = pad + left_w + 40
    y = 92
    d.text((x, y - 26), "the kit tiles, re-cut this round", font=f_lab, fill=0)
    for name, im in kit:
        c.paste(im, (x, y))
        d.rectangle([x, y, x + im.width - 1, y + im.height - 1], outline=170)
        d.text((x, y + im.height + 6), f"kit/{name}", font=f_small, fill=70)
        y += im.height + 34

    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    c.save(out)
    print(f"{out}  ({c.width}x{c.height})")


if __name__ == "__main__":
    main()
