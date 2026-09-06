"""The round-4B contact sheet for DREW: six seeds beside the re-cut kit tiles.

Left block: the six renders at 420 px, labelled with their seed and the one-line
verdict. Right column: kit/bust.png and kit/head.png as they now stand -- both
re-cut straight out of canon/vision/studies/drew.png with no retouching -- so
the founder can see that the tile and the render now carry the same bill.

    python scripts/build-drew-round4b-sheet.py --out PATH
"""
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
RENDERS = Path("C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/"
               "7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/flamingo/round-4")
KIT = ROOT / "canon/characters/flamingo/kit"

W = 420
SEEDS = [
    (62, "BEST - deepest bill, black wraps the tip, most open eye"),
    (55, "clean - good bill, tip a shade pointed, eye narrow"),
    (93, "clean - good bill and staging, eye heavy"),
    (21, "REJECT - black cap with scribble glyphs on his crown"),
    (78, "REJECT - two photographic men, one grafted on his body"),
    (84, "REJECT - photographic human bartender behind the bar"),
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

    f_title, f_lab, f_small = font(30), font(19), font(16)

    tiles = []
    for seed, note in SEEDS:
        im = Image.open(RENDERS / f"drew-seed{seed}.png").convert("L")
        tiles.append((seed, note, im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)))
    th = tiles[0][2].height

    kit = []
    for name in ("bust.png", "head.png"):
        im = Image.open(KIT / name).convert("L")
        kw = 340
        kit.append((name, im.resize((kw, round(im.height * kw / im.width)), Image.LANCZOS)))

    pad, gap, lab = 30, 16, 52
    left_w = 3 * W + 2 * gap
    right_w = 340
    sheet_w = pad + left_w + 40 + right_w + pad
    sheet_h = 100 + 2 * (th + lab) + gap + pad

    c = Image.new("L", (sheet_w, sheet_h), 255)
    d = ImageDraw.Draw(c)
    d.text((pad, 20), "DREW - round 4B, the same six seeds after the reference fix", font=f_title, fill=0)
    d.text((pad, 58),
           "bill-diagram.png retired; kit/head.png and kit/bust.png re-cut from canon/vision/studies/drew.png "
           "unretouched; Picture 1 rebuilt from that same portrait with no ghost-bill mask and the head raised.",
           font=f_small, fill=60)
    d.text((pad, 78),
           "Picture 1 + kit/bust.png, two references. local/qwen-image-edit-2511, fast Lightning 8-step, cfg 1, "
           "4:5, 1344x1680. EDIT 8 and 9 replaced, EDIT 10 deleted, EDITs 6/7/11/13/14/19 rewritten.",
           font=f_small, fill=60)

    for i, (seed, note, im) in enumerate(tiles):
        x = pad + (i % 3) * (W + gap)
        y = 106 + (i // 3) * (th + lab + gap)
        c.paste(im, (x, y))
        d.rectangle([x, y, x + W - 1, y + th - 1], outline=170)
        d.text((x, y + th + 6), f"seed {seed}", font=f_lab, fill=0)
        d.text((x, y + th + 28), note, font=f_small, fill=70)

    x = pad + left_w + 40
    y = 106
    d.text((x, y - 24), "the kit tiles, re-cut this round from drew.png", font=f_lab, fill=0)
    for name, im in kit:
        c.paste(im, (x, y))
        d.rectangle([x, y, x + im.width - 1, y + im.height - 1], outline=170)
        tag = "  <- Picture 2 this round" if name == "bust.png" else ""
        d.text((x, y + im.height + 6), f"kit/{name}{tag}", font=f_small, fill=70)
        y += im.height + 34

    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    c.save(out)
    print(f"{out}  ({c.width}x{c.height})")


if __name__ == "__main__":
    main()
