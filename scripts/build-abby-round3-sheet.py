"""ABBY ROUND 3 - the contact sheet.

The six renders at 420 px wide, in seed order, beside the two kit tiles the round
is judged against (canon/characters/abby/kit/bust.png and head.png) and the two
references this round REPLACED them with: the full-plate Picture 1 and the
hand-drawn eye chart that is now Picture 3. Every panel carries its seed, its
measured near-eye numbers from scripts/measure-abby-eye.py, and a one-line
verdict, so the sheet reads on its own in the founder's report.

Out: <scratchpad>/cast-studies/abby/round-3/sheet.png
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path("Z:/ImageGenerator/Cartoon")
RD = Path("C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/"
          "7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/abby/round-3")

SEEDS = [55, 41, 7, 21, 33, 44]
BEST = 44

# near eye (viewer-left), from scripts/measure-abby-eye.py
EYE = {
    55: (23.8, 244.8, 246.0, 251),
    41: (24.5, 232.0, 219.0, 241),
    7:  (23.3, 238.0, 233.0, 245),
    21: (24.4, 237.0, 232.2, 252),
    33: (25.7, 237.0, 234.0, 241),
    44: (24.3, 250.0, 250.0, 253),
}

NOTE = {
    55: "RUNNER-UP. Room, counter, both hands, towel, all three at the bar, nothing lettered. The "
        "largest and best-drawn eye of the six - white clean at both sides, iris ring, lashes. "
        "Marked down only against 44: the lip line opens into a distinct dark gap right of centre, "
        "and the coat still runs past the jaw onto the throat",
    41: "Clean and quiet, the closest of the six to Picture 1's own framing, no strays anywhere. "
        "The only render whose eye MISSES the white test - the far side of the near iris shades to "
        "219 against a paper of 241. Mouth parted right of centre; gaze square at the reader",
    7:  "Clean slate, clean room, good eye. Two strays cost it: a curl of smoke rises off the back "
        "bar behind her left ear, and Drew's face is mottled where the plate is crisp",
    21: "REJECT. A ghost figure has surfaced inside the wiped slate - a face and shoulders in faint "
        "pencil where the panel must be bare. Abby herself is sound and her eye all but passes",
    33: "REJECT, and the most useful failure of the round: the EYE CHART sent as Picture 3 has been "
        "drawn INTO the blank slate as a cartoon - a westie with one giant eye and a starburst. "
        "Picture 3 must carry a role line that forbids it appearing as a picture in the room",
    44: "BEST OF THE SIX. Every construction fix lands at once: the room, the marble, the back bar, "
        "the counter crossing her at the waist, both hands working the glass and the towel, Drew "
        "and Barclay seated on the near side, the slate blank, every label blank, nothing lettered "
        "but the mirrored window. Best measured eye of the round - 250 and 250 against a paper of "
        "253, so there is genuine paper-white at BOTH sides of the iris - the cleanest closed smile "
        "with both corners up, even ears, flat black nose, teardrop pendant in its beaded bezel",
}

W_KIT, W_IMG, M, G = 320, 420, 28, 22
LBL, HEAD = 26, 104


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


kit = [
    ("KIT  bust.png  - PICTURE 2, hardware and blouse only",
     fit(Image.open(ROOT / "canon/characters/abby/kit/bust.png"), W_KIT)),
    ("KIT  head.png  - NOT SENT, it carries the failing eye",
     fit(Image.open(ROOT / "canon/characters/abby/kit/head.png"), W_KIT)),
    ("PICTURE 1  - the approved blank plate, cut 4:5",
     fit(Image.open(RD / "abby-picture1-trio-plate.png"), W_KIT)),
    ("PICTURE 3  - the eye, drawn by hand this round",
     fit(Image.open(RD / "abby-eye-tile.png"), W_KIT)),
]
tiles = [fit(Image.open(RD / f"abby-seed{s}.png"), W_IMG) for s in SEEDS]

VERD = 96
row_h = LBL + max(t.height for t in tiles) + VERD + G
kit_h = sum(LBL + im.height + G for _, im in kit)
sheet_w = M + W_KIT + G + 3 * W_IMG + 2 * G + M
sheet_h = HEAD + max(2 * row_h, kit_h) + M + 118

sheet = Image.new("L", (sheet_w, sheet_h), 255)
d = ImageDraw.Draw(sheet)

d.text((M, 20), "ABBY - CHARACTER STUDY, ROUND 3", font=font(30, True), fill=0)
d.text((M, 58), "local/qwen-image-edit-2511, fast Lightning 8 steps, cfg 1, 4:5 1344x1680, 3 references. "
                "THE RECIPE WAS HELD; THE REFERENCES CHANGED.", font=font(15), fill=60)
d.text((M, 79), "THE ROOM, THE COUNTER, BOTH HANDS AND THE TOWEL ARE BACK 6 OF 6 - round 2 was 0 of 6. "
                "The near eye measures 23-26% below L60; the best tile in the repository measures 52%.",
       font=font(15, True), fill=0)

y = HEAD
for label, im in kit:
    d.text((M, y), label, font=font(13, True), fill=0)
    sheet.paste(im, (M, y + LBL))
    d.rectangle([M, y + LBL, M + W_KIT - 1, y + LBL + im.height - 1], outline=0)
    y += LBL + im.height + G

x0 = M + W_KIT + G
for i, (s, tile) in enumerate(zip(SEEDS, tiles)):
    cx = x0 + (i % 3) * (W_IMG + G)
    cy = HEAD + (i // 3) * row_h
    dark, wl, wr, paper = EYE[s]
    d.text((cx, cy), f"seed {s}" + ("   <-- BEST OF THE SIX" if s == BEST else ""),
           font=font(17, True), fill=0)
    d.text((cx + 168, cy + 4), f"near eye {dark:.1f}% dark   white {wl:.0f}/{wr:.0f} on paper {paper:.0f}",
           font=font(11), fill=90)
    sheet.paste(tile, (cx, cy + LBL))
    d.rectangle([cx, cy + LBL, cx + W_IMG - 1, cy + LBL + tile.height - 1], outline=0)
    wrap(d, NOTE[s], font(12), cx, cy + LBL + tile.height + 4, W_IMG - 4, 70, 14)

foot = ("WHAT CHANGED, AND IT WAS THE REFERENCES, NOT THE SEEDS. Round 2 sent a BUST as Picture 1 and "
        "got a bust back six times out of six - portraits on bare paper while the prompt asked for the "
        "counter, both hands and the towel. Picture 1 is now a FULL PLATE and the staging comes back "
        "with it. The judges named sc12; sc12 was built, cut and RUN at seed 55, and it lost on "
        "lettering - it carries a live chyron, a lettered slate and a lettered receipt, and at cfg 1 the "
        "model copied all three and invented more ('PPICE GAUES CONES IN AS EXPECTEO'), which check 17 "
        "calls fatal. Picture 1 is therefore canon/plates/trio.png, the APPROVED BLANK PLATE - the same "
        "construction the judges described, with the screen already off, the slate already wiped and "
        "every label already blank. The eye was drawn BY HAND from look-card section 2 and sent as "
        "Picture 3 (Step 5, previously skipped); canon/vision/studies/abby.png was dropped. "
        "WHAT ROUND 4 STILL OWES: the gaze - all six look out at the reader, because Picture 1 does; "
        "the jawline - the coat still runs past the jaw onto the throat in all six; and the lip line "
        "opens a small dark gap right of centre in five of six.")
wrap(d, foot, font(13), M, sheet_h - 112, sheet_w - 2 * M, 40, 16)

sheet.save(RD / "sheet.png")
print(RD / "sheet.png", sheet.size)
