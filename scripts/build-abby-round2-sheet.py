"""ABBY ROUND 2 - the contact sheet.

The six shipped renders at 420 px wide, in seed order, beside the two kit tiles
the round is judged against (canon/characters/abby/kit/bust.png and head.png).
Every panel carries its seed and a one-line verdict so the sheet reads on its
own in the founder's report.

Out: <scratchpad>/cast-studies/abby/round-2/sheet.png
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path("Z:/ImageGenerator/Cartoon")
RD = Path("C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/"
          "7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/abby/round-2")

SEEDS = [55, 7, 41, 21, 33, 44]
NOTE = {
    55: "BEST OF SIX - one Abby and nothing else alive. Carrot skull, short square muzzle, fully "
        "closed warm smile, collar-buckle-ring-teardrop, blouse open two buttons with the "
        "decolletage showing. Best eyes of the round - white at both sides, drawn iris, smaller "
        "pupil, one catchlight, lashes - and the gaze furthest off the lens, down and to her left. "
        "Still no room, no hands, no counter, no towel, and far too close",
    7:  "One Abby, no second being. Eyes right, mouth closed, teardrop clean. Gaze sits nearer the "
        "reader than 55 and the chin is dropped. No room, no hands, no counter, no towel",
    41: "One Abby. Cleanest, quietest line of the six - but the gaze comes closest of all six to "
        "meeting the reader, which is the founder's oldest complaint about her. No room, no hands, "
        "no counter, no towel",
    21: "One Abby. Faint pencil scribbles run along the bottom edge where a signature keeps trying "
        "to appear. No room, no hands, no counter, no towel",
    33: "One Abby, but her left shoulder runs off the frame and the bust reads heaviest of the six "
        "against the OPEN THE NECKLINE NOT THE FIGURE rule. No room, no hands, no counter",
    44: "One Abby. Finest lashes and lids of the round, the iris rim clearly drawn - but the gaze "
        "tips UP and away from the work her hands are supposed to be doing. No room, no hands, "
        "no counter, no towel",
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


def wrap(d, text, f, x, y, width, fill, lh):
    line = ""
    for word in text.split():
        trial = (line + " " + word).strip()
        if d.textlength(trial, font=f) > width and line:
            d.text((x, y), line, font=f, fill=fill)
            y += lh
            line = word
        else:
            line = trial
    if line:
        d.text((x, y), line, font=f, fill=fill)
        y += lh
    return y


bust = fit(Image.open(ROOT / "canon/characters/abby/kit/bust.png"), W_KIT)
head = fit(Image.open(ROOT / "canon/characters/abby/kit/head.png"), W_KIT)
tiles = [fit(Image.open(RD / f"abby-seed{s}.png"), W_IMG) for s in SEEDS]

VERD = 88
row_h = LBL + max(t.height for t in tiles) + VERD + G
kit_h = (LBL + bust.height + G) + (LBL + head.height)
sheet_w = M + W_KIT + G + 3 * W_IMG + 2 * G + M
sheet_h = HEAD + max(2 * row_h, kit_h) + M + 96

sheet = Image.new("L", (sheet_w, sheet_h), 255)
d = ImageDraw.Draw(sheet)

d.text((M, 22), "ABBY - CHARACTER STUDY, ROUND 2", font=font(30, True), fill=0)
d.text((M, 60), "local/qwen-image-edit-2511, fast Lightning 8 steps, cfg 1, 4:5 1344x1680, 2 references "
                "(plate crop / official portrait).   THE SPLIT IS FIXED 6 OF 6.   THE STAGING FAILS 6 OF 6.",
       font=font(15), fill=60)

y = HEAD
d.text((M, y), "KIT  bust.png", font=font(15, True), fill=0)
sheet.paste(bust, (M, y + LBL))
d.rectangle([M, y + LBL, M + W_KIT - 1, y + LBL + bust.height - 1], outline=0)
y += LBL + bust.height + G
d.text((M, y), "KIT  head.png", font=font(15, True), fill=0)
sheet.paste(head, (M, y + LBL))
d.rectangle([M, y + LBL, M + W_KIT - 1, y + LBL + head.height - 1], outline=0)

x0 = M + W_KIT + G
for i, (s, tile) in enumerate(zip(SEEDS, tiles)):
    cx = x0 + (i % 3) * (W_IMG + G)
    cy = HEAD + (i // 3) * row_h
    d.text((cx, cy), f"seed {s}" + ("   <-- BEST OF THE SIX" if s == 55 else ""),
           font=font(17, True), fill=0)
    sheet.paste(tile, (cx, cy + LBL))
    d.rectangle([cx, cy + LBL, cx + W_IMG - 1, cy + LBL + tile.height - 1], outline=0)
    wrap(d, NOTE[s], font(12), cx, cy + LBL + tile.height + 4, W_IMG - 4, 70, 14)

foot = ("ROUND 2 FIXED THE THING ROUND 1 COULD NOT: Abby is ONE upright terrier in all six, with no "
        "second being of any kind - round 1 was 0 of 6. The lever was language, not pictures: every "
        "human noun was struck out of the prompt (human, humanoid, woman, lady, person, man, "
        "customer), because at cfg 1 those words are read as nouns and get drawn. THE LEAD'S "
        "ROOT-CAUSE CALL - swap Picture 1 for the sc04 crop - was tested eleven times and made it "
        "worse every time: 6 of 6 with the judges' wording, 2 of 2 with the nouns purged, 2 of 2 "
        "re-cut to the house 4:5 shape, all of them a person plus a real four-legged pet on blank "
        "paper. That crop shows Abby head-to-hands, and a terrier head on a torso is a seam the "
        "model cuts along. WHAT ROUND 3 OWES RICK: the room, the counter and both hands. All six of "
        "these are portraits on bare paper.")
wrap(d, foot, font(13), M, sheet_h - 88, sheet_w - 2 * M, 40, 16)

sheet.save(RD / "sheet.png")
print(RD / "sheet.png", sheet.size)
