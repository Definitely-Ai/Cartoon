"""Contact sheet for one character round: the round's renders at a fixed
width beside the character kit's bust and head tiles, every panel labelled.

    python scripts/build-cast-sheet.py --renders DIR --seeds 41,7,21,33,44,55 \
        --kit canon/characters/flamingo/kit --out .../sheet.png --title "..."
"""
import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
CELL = 420          # the founder's review width
PAD, LABEL, GAP = 26, 30, 20


def font(size: int):
    for name in ("georgia.ttf", "arial.ttf", "segoeui.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def fit(path: Path, w: int) -> Image.Image:
    im = Image.open(path).convert("L")
    return im.resize((w, max(1, round(im.height * w / im.width))), Image.LANCZOS)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--renders", required=True)
    ap.add_argument("--seeds", required=True)
    ap.add_argument("--prefix", default="drew-seed")
    ap.add_argument("--kit", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--title", default="")
    ap.add_argument("--best", type=int, default=None)
    a = ap.parse_args()

    rd = Path(a.renders)
    seeds = [int(s) for s in a.seeds.split(",")]
    tiles = [(f"seed {s}" + ("   ** BEST **" if s == a.best else ""), fit(rd / f"{a.prefix}{s}.png", CELL))
             for s in seeds]

    kitdir = Path(a.kit) if Path(a.kit).is_absolute() else ROOT / a.kit
    kit = [("kit / bust.png  (old sheet)", fit(kitdir / "bust.png", CELL)),
           ("kit / head.png  (old sheet)", fit(kitdir / "head.png", CELL))]

    f_lab, f_title = font(22), font(34)
    cols = 3
    rowh = [max(t[1].height for t in tiles[r * cols:(r + 1) * cols]) + LABEL + GAP
            for r in range((len(tiles) + cols - 1) // cols)]
    grid_h = sum(rowh)
    kit_h = sum(i.height + LABEL + GAP for _, i in kit)
    top = PAD + (46 if a.title else 0)
    W = PAD * 2 + CELL + GAP * 2 + cols * (CELL + GAP) - GAP
    H = top + max(grid_h, kit_h) + PAD

    sheet = Image.new("L", (W, H), 250)
    d = ImageDraw.Draw(sheet)
    if a.title:
        d.text((PAD, PAD - 4), a.title, font=f_title, fill=20)

    y = top                                            # the kit column, frame-left
    for lab, im in kit:
        d.text((PAD, y), lab, font=f_lab, fill=70)
        sheet.paste(im, (PAD, y + LABEL))
        d.rectangle([PAD - 1, y + LABEL - 1, PAD + im.width, y + LABEL + im.height], outline=140)
        y += im.height + LABEL + GAP

    x0 = PAD + CELL + GAP * 2
    for i, (lab, im) in enumerate(tiles):
        r, c = divmod(i, cols)
        x = x0 + c * (CELL + GAP)
        yy = top + sum(rowh[:r])
        d.text((x, yy), lab, font=f_lab, fill=20 if "BEST" in lab else 70)
        sheet.paste(im, (x, yy + LABEL))
        d.rectangle([x - 1, yy + LABEL - 1, x + im.width, yy + LABEL + im.height],
                    outline=0 if "BEST" in lab else 140, width=3 if "BEST" in lab else 1)

    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    print(f"{out}  ({sheet.size[0]}x{sheet.size[1]})")


if __name__ == "__main__":
    main()
