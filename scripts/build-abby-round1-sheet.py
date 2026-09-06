"""ABBY ROUND 1 - the contact sheet.

The six renders at 420 px wide, in seed order, beside the two kit tiles the
round was judged against (canon/characters/abby/kit/bust.png, which was also
Picture 3 on the wire, and canon/characters/abby/kit/head.png). Every panel
carries its seed and a one-line verdict so the sheet reads on its own in the
founder's report.

Out: <scratchpad>/cast-studies/abby/round-1/sheet.png
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path("Z:/ImageGenerator/Cartoon")
RD = Path("C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/"
          "7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/abby/round-1")

SEEDS = [41, 7, 21, 33, 44, 55]
NOTE = {
    41: "REJECT - split in two: a human woman bartends, a real 4-legged westie sits on the marble",
    7:  "REJECT - worst of the six: TWO human men plus a 4-legged westie; Abby is not in it",
    21: "REJECT - one human man bartending; the westie sits on the counter as his pet",
    33: "REJECT - TWO stacked westies and a human man; three figures, none of them Abby",
    44: "REJECT - human man + 4-legged westie; room dissolves into hatching below the counter",
    55: "BEST OF SIX - the only anthropomorphic Abby in front: collar, buckle, ring, teardrop, "
        "open blouse, best eyes of the round. Still a human bartender behind her, still too close, "
        "no hands, no towel, no counter",
}

W_KIT, W_IMG, M, G = 320, 420, 28, 22
LBL, HEAD = 26, 96


def font(sz, bold=False):
    for name in (("arialbd.ttf", "arial.ttf") if bold else ("arial.ttf",)):
        try:
            return ImageFont.truetype(f"C:/Windows/Fonts/{name}", sz)
        except OSError:
            pass
    return ImageFont.load_default()


def fit(im: Image.Image, w: int) -> Image.Image:
    return im.convert("L").resize((w, max(1, round(im.height * w / im.width))), Image.LANCZOS)


bust = fit(Image.open(ROOT / "canon/characters/abby/kit/bust.png"), W_KIT)
head = fit(Image.open(ROOT / "canon/characters/abby/kit/head.png"), W_KIT)
tiles = [fit(Image.open(RD / f"abby-seed{s}.png"), W_IMG) for s in SEEDS]

VERD = 62                                                # room for four wrapped verdict lines
row_h = LBL + max(t.height for t in tiles) + VERD + G
kit_h = (LBL + bust.height + G) + (LBL + head.height)
sheet_w = M + W_KIT + G + 3 * W_IMG + 2 * G + M
sheet_h = HEAD + max(2 * row_h, kit_h) + M + 62          # the footer strip

sheet = Image.new("L", (sheet_w, sheet_h), 255)
d = ImageDraw.Draw(sheet)

d.text((M, 22), "ABBY - CHARACTER STUDY, ROUND 1", font=font(30, True), fill=0)
d.text((M, 60), "local/qwen-image-edit-2511, fast Lightning 8 steps, cfg 1, 4:5 1344x1680, 3 references "
                "(plate crop / official portrait / kit bust).  ALL SIX REJECTED.",
       font=font(15), fill=60)

# ------------------------------------------------------------- the kit column
y = HEAD
d.text((M, y), "KIT  bust.png  (also Picture 3)", font=font(15, True), fill=0)
sheet.paste(bust, (M, y + LBL))
d.rectangle([M, y + LBL, M + W_KIT - 1, y + LBL + bust.height - 1], outline=0)
y += LBL + bust.height + G
d.text((M, y), "KIT  head.png", font=font(15, True), fill=0)
sheet.paste(head, (M, y + LBL))
d.rectangle([M, y + LBL, M + W_KIT - 1, y + LBL + head.height - 1], outline=0)

# ---------------------------------------------------------------- the renders
x0 = M + W_KIT + G
for i, (s, tile) in enumerate(zip(SEEDS, tiles)):
    cx = x0 + (i % 3) * (W_IMG + G)
    cy = HEAD + (i // 3) * row_h
    d.text((cx, cy), f"seed {s}" + ("   <-- BEST OF THE SIX" if s == 55 else ""),
           font=font(17, True), fill=0)
    sheet.paste(tile, (cx, cy + LBL))
    d.rectangle([cx, cy + LBL, cx + W_IMG - 1, cy + LBL + tile.height - 1], outline=0)
    # the verdict, wrapped to the panel width, under the frame
    f = font(12)
    words, line, ly = NOTE[s].split(), "", cy + LBL + tile.height + 4
    for w in words:
        trial = (line + " " + w).strip()
        if d.textlength(trial, font=f) > W_IMG - 4 and line:
            d.text((cx, ly), line, font=f, fill=70)
            ly += 14
            line = w
        else:
            line = trial
    if line:
        d.text((cx, ly), line, font=f, fill=70)

f = font(13)
foot = ("THE ONE FAULT THEY SHARE: Abby was SPLIT INTO TWO BEINGS - a four-legged pet terrier wearing her "
        "collar, and a separate human doing her job. Diagnosed the same day: the words HUMAN and WOMAN in "
        "the eye edit (quoted verbatim from the bible), a third Abby tile on the wire, and a list of "
        "negations that is inert on the cfg-1 Lightning path. A two-seed diagnostic with all three removed "
        "killed the four-legged terrier in 2 of 2 and the extra human in 1 of 2.")
line, ly = "", sheet_h - 56
for w in foot.split():
    trial = (line + " " + w).strip()
    if d.textlength(trial, font=f) > sheet_w - 2 * M and line:
        d.text((M, ly), line, font=f, fill=40)
        ly += 16
        line = w
    else:
        line = trial
d.text((M, ly), line, font=f, fill=40)

sheet.save(RD / "sheet.png")
print(RD / "sheet.png", sheet.size)
