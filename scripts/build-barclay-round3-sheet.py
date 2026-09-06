"""BARCLAY ROUND 3 contact sheet: the six seeds at 420 px beside the kit tiles.

Row 1 holds canon/characters/dog/kit/bust.png and kit/head.png - and head.png is
worth reading twice this round, because it is the picture whose ANGLE was
composited into Picture 1 to get the three-quarter the last two rounds could not
prompt into existence. Then the six seeds in the order they were rolled, each
with its seed and its one-line verdict.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path("Z:/ImageGenerator/Cartoon")
DIR = Path("C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/"
           "7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/dog/round-3")

CELL = 420
GAP = 22
PAD = 26
COLS = 4

SEEDS = [
    (41, "BEST - true 3/4, both eyes whole, black lip band"),
    (44, "REJECT - a HUMAN bartender appeared"),
    (7, "REJECT - room gone, blank paper, spotted coat"),
    (12, "second best - softer eyes, glossy nose"),
    (68, "good pose, sleepier eyes, one label lettered"),
    (91, "REJECT - back to profile, spots, pin misplaced"),
]


def font(sz, bold=False):
    for n in (("arialbd.ttf" if bold else "arial.ttf"), "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(n, sz)
        except OSError:
            pass
    return ImageFont.load_default()


def fit(im: Image.Image) -> Image.Image:
    im = im.convert("L")
    s = CELL / max(im.width, im.height)
    im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    cell = Image.new("L", (CELL, CELL), 255)
    cell.paste(im, ((CELL - im.width) // 2, (CELL - im.height) // 2))
    return cell


tiles = [("KIT bust.png", "the house bust", ROOT / "canon/characters/dog/kit/bust.png"),
         ("KIT head.png", "canon's only true 3/4 - now Picture 1's pose",
          ROOT / "canon/characters/dog/kit/head.png")]
tiles += [(f"seed {s}", note, DIR / f"barclay-seed{s}.png") for s, note in SEEDS]

rows = (len(tiles) + COLS - 1) // COLS
HEAD = 152
LAB = 52
W = PAD * 2 + COLS * CELL + (COLS - 1) * GAP
H = HEAD + rows * (CELL + LAB) + (rows - 1) * GAP + PAD

sheet = Image.new("L", (W, H), 255)
d = ImageDraw.Draw(sheet)
d.text((PAD, 22), "BARCLAY - CHARACTER STUDY, ROUND 3", font=font(38, True), fill=0)
d.text((PAD, 70), "2026-09-06 - local/qwen-image-edit-2511 - fast Lightning 8 steps, cfg 1 - 4:5 1344x1680",
       font=font(20), fill=0)
d.text((PAD, 96),
       "P1 = duo.png (620,600,580,725), pick REBUILT as glass and liquid, cherry dropped below the liquid line, "
       "FULL THREE-QUARTER HEAD composited from kit/head.png (mirrored, crown-to-jaw 300 px)",
       font=font(19), fill=0)
d.text((PAD, 120),
       "P2 = vision/studies/barclay RE-CUT (70,0,720,730), whole head + whole flag pin, its stirrer-glass rebuilt away   -   "
       "P3 = showcase sc01 head (620,818,420,344), mouth closed, no paint-outs",
       font=font(19), fill=0)

for i, (title, note, path) in enumerate(tiles):
    x = PAD + (i % COLS) * (CELL + GAP)
    y = HEAD + (i // COLS) * (CELL + LAB + GAP)
    sheet.paste(fit(Image.open(path)), (x, y))
    d.rectangle((x, y, x + CELL - 1, y + CELL - 1), outline=170)
    d.text((x, y + CELL + 6), title, font=font(24, True), fill=0)
    d.text((x, y + CELL + 32), note, font=font(18), fill=0)

out = DIR / "sheet.png"
sheet.save(out)
print("wrote", out, sheet.size)
