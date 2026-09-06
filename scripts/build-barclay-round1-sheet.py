"""BARCLAY ROUND 1 — the contact sheet.

The six seeds at 420 px wide beside the two tiles from his reference kit
(canon/characters/dog/kit/bust.png and head.png), each render labelled with its
seed and its one-line verdict, so the founder can read the round at a glance.

    C:/Python313/python.exe scripts/build-barclay-round1-sheet.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(
    "C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/"
    "7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/dog/round-1"
)
KIT = ROOT / "canon" / "characters" / "dog" / "kit"

CELL_W, CELL_H = 420, 525          # the house 4:5 at 420 px
PAD, GAP, LABEL = 30, 24, 40
TITLE = 124

RENDERS = [
    (41, "camera pushed in; labels scribbled"),
    (7,  "warm face; pin is a blank triangle"),
    (21, "good face; ear goes woolly"),
    (33, "REJECT - a second dog on the shelf"),
    (44, "BEST - camera held, flag pin right"),
    (55, "warm face; pin on the shoulder"),
]

REFS = [
    (KIT / "bust.png", "KIT bust.png"),
    (KIT / "head.png", "KIT head.png"),
]


def font(size: int):
    for name in ("arialbd.ttf", "arial.ttf", "segoeui.ttf"):
        try:
            return ImageFont.truetype(f"C:/Windows/Fonts/{name}", size)
        except OSError:
            continue
    return ImageFont.load_default()


def fit(im: Image.Image, w: int, h: int) -> Image.Image:
    """Contain the tile inside the cell on white — never crop a render."""
    s = min(w / im.width, h / im.height)
    im = im.convert("L").resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    cell = Image.new("L", (w, h), 255)
    cell.paste(im, ((w - im.width) // 2, (h - im.height) // 2))
    return cell


def main() -> None:
    cols = 3
    grid_w = cols * CELL_W + (cols - 1) * GAP
    W = PAD + CELL_W + PAD + grid_w + PAD
    row_h = CELL_H + LABEL
    H = TITLE + 2 * row_h + GAP + PAD

    sheet = Image.new("L", (W, H), 255)
    d = ImageDraw.Draw(sheet)
    f_title, f_sub, f_lab, f_note = font(38), font(20), font(24), font(18)

    d.text((PAD, 26), "BARCLAY — CHARACTER STUDY, ROUND 1", font=f_title, fill=0)
    d.text((PAD, 68),
           "2026-09-06 · local/qwen-image-edit-2511 · fast Lightning 8 steps, cfg 1 · 4:5 1344x1680",
           font=f_sub, fill=60)
    d.text((PAD, 92),
           "Picture 1 = duo.png crop (640,620,560,700) · Picture 2 = vision/studies/barclay.png · "
           "Picture 3 = kit/head.png",
           font=f_sub, fill=60)

    # the reference column
    ref_x = PAD
    for i, (path, label) in enumerate(REFS):
        y = TITLE + i * (row_h + GAP)
        cell = fit(Image.open(path), CELL_W, CELL_H)
        sheet.paste(cell, (ref_x, y))
        d.rectangle([ref_x, y, ref_x + CELL_W - 1, y + CELL_H - 1], outline=140)
        d.text((ref_x, y + CELL_H + 8), label, font=f_lab, fill=0)
        d.text((ref_x, y + CELL_H + 8), label, font=f_lab, fill=0)

    # the six renders
    gx = PAD + CELL_W + PAD
    for i, (seed, note) in enumerate(RENDERS):
        c, r = i % cols, i // cols
        x = gx + c * (CELL_W + GAP)
        y = TITLE + r * (row_h + GAP)
        p = OUT / f"barclay-seed{seed}.png"
        cell = fit(Image.open(p), CELL_W, CELL_H)
        sheet.paste(cell, (x, y))
        d.rectangle([x, y, x + CELL_W - 1, y + CELL_H - 1], outline=140)
        d.text((x, y + CELL_H + 4), f"seed {seed}", font=f_lab, fill=0)
        d.text((x, y + CELL_H + 24), note, font=f_note, fill=70)

    path = OUT / "sheet.png"
    sheet.save(path)
    print(f"{path}  ({sheet.width}x{sheet.height})")


if __name__ == "__main__":
    main()
