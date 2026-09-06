"""BARCLAY ROUND 4 — the contact sheet.

Six renders at 420 px in seed order, then the kit's bust and head tiles at the
same width so the judges can hold the round against the canon it is copying.
Every cell is captioned with its seed (the kit tiles with their filename), and a
strip along the top carries the round's references.
"""
import pathlib
from PIL import Image, ImageDraw

R4 = pathlib.Path("C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/"
                  "7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/dog/round-4")
KIT = pathlib.Path("Z:/ImageGenerator/Cartoon/canon/characters/dog/kit")
SEEDS = [41, 3, 17, 29, 58, 73]
W = 420
PAD, CAP, MARGIN = 14, 30, 22


def cell(img: Image.Image, caption: str, height: int) -> Image.Image:
    im = img.convert("L").copy()
    im.thumbnail((W, height), Image.LANCZOS)
    box = Image.new("L", (W, height), 255)
    box.paste(im, ((W - im.width) // 2, (height - im.height) // 2))
    out = Image.new("RGB", (W, height + CAP), (255, 255, 255))
    out.paste(box.convert("RGB"), (0, 0))
    d = ImageDraw.Draw(out)
    d.rectangle([0, 0, W - 1, height - 1], outline=(150, 150, 150))
    d.text((6, height + 9), caption, fill=(0, 0, 0))
    return out


def main() -> None:
    tiles = [(Image.open(R4 / f"barclay-seed{s}.png"), f"seed {s}") for s in SEEDS]
    tiles.append((Image.open(KIT / "bust.png"), "canon kit/bust.png"))
    tiles.append((Image.open(KIT / "head.png"), "canon kit/head.png"))

    h = round(W * 1.25)
    cells = [cell(im, cap, h) for im, cap in tiles]

    cols, rows = 4, 2
    cw, ch = W + PAD, h + CAP + PAD
    sheet = Image.new("RGB", (MARGIN * 2 + cols * cw - PAD, MARGIN * 2 + 34 + rows * ch - PAD), (255, 255, 255))
    d = ImageDraw.Draw(sheet)
    d.text((MARGIN, MARGIN),
           "BARCLAY — CAST STUDY ROUND 4 — local/qwen-image-edit-2511, fast Lightning 8-step cfg 1, "
           "4:5 1344x1680, 2 references (the promoted studio drawing seated in the approved plate's room; "
           "the same drawing close up)", fill=(0, 0, 0))
    for i, c in enumerate(cells):
        x = MARGIN + (i % cols) * cw
        y = MARGIN + 34 + (i // cols) * ch
        sheet.paste(c, (x, y))
    sheet.save(R4 / "sheet.png")
    print(R4 / "sheet.png", sheet.size)


if __name__ == "__main__":
    main()
