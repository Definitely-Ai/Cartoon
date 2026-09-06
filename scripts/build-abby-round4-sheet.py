"""ABBY ROUND 4 - the contact sheet.

The six renders at 420 px wide, in seed order, beside the two kit tiles this
round DROPPED (canon/characters/abby/kit/bust.png and head.png) and the two
references that replaced them - the new breed sheet cut from the plates Rick
accepted, and the hand-drawn eye chart carried over from round 3. Every panel
carries its seed, its measured near-eye numbers from scripts/measure-abby-eye.py
and a one-line verdict, so the sheet reads on its own in the founder's report.

Out: <scratchpad>/cast-studies/abby/round-4/sheet.png
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path("Z:/ImageGenerator/Cartoon")
RD = Path("C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/"
          "7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/abby/round-4")
R3 = RD.parent / "round-3"

SEEDS = [55, 41, 7, 21, 33, 44]
BEST = 44

# near eye, from scripts/measure-abby-eye.py: dark%, whiteL, whiteR, paper
EYE = {
    55: (24.6, 253.0, 253.0, 254),
    41: (26.8, 224.2, 226.2, 241),
    7:  (22.6, 231.0, 226.0, 241),
    21: (24.7, 243.0, 245.0, 254),
    33: (37.4, 231.0, 187.1, 238),
    44: (22.0, 254.0, 254.0, 254),
}

NOTE = {
    55: "RUNNER-UP. The cleanest EAR read of the six - two small hard triangles carried close-set on "
        "top of a broad flat skull, no extra tufts - and the second-best eye, 253 and 253 against a "
        "paper of 254, pupils plainly LEFT onto Drew. Marked below 44 on two counts: the back bar "
        "falls back into coarse dark hatch instead of wood grain, and the bottom-left border breaks "
        "into spiked hatch fringe",
    41: "THE ONLY CLEAN-EDGED RENDER OF THE ROUND, and the only one that answers the border EDIT: ink "
        "runs to a straight cut on all four sides, no fringe, no washed band, no margin. It also draws "
        "the truest EYE CONSTRUCTION - a genuinely MID-GREY iris with a separate black pupil floating "
        "in white, which is what the chart draws - but with the thinnest white margin of the round "
        "(224/226 on a paper of 241) and the most frontal gaze",
    7:  "THIRD. The shortest, hardest coat of the six - closest of any render to the harsh double coat "
        "the EDIT asks for - and a clean 22.6% dark eye. Two faults hold it down: extra ear-shaped "
        "tufts stand outside both real ears so the head reads with FOUR ear forms, and the lip line "
        "opens on a tooth right of centre",
    21: "THE ONLY HEART PENDANT OF THE ROUND - every other seed drew the old oval gem, so the heart is "
        "reachable at this recipe. Gaze plainly left onto Drew, good modelling under the jaw. Same "
        "four-ear-form fault as seed 7, and the bottom edge washes out into a pale band",
    33: "REJECT, FATAL. The wiped slate has filled with a mass of letter-like glyphs - pseudo-text, "
        "which INSPECTION.md check 17 calls fatal. This is the SAME seed that drew the eye chart into "
        "the slate in round 3: seed 33 has a standing habit of filling that panel, and the hardened "
        "Picture 3 role line stopped the chart getting in but not the scribble. It is also the only "
        "eye of the six to fail the white test, 187 on the far side against a paper of 238",
    44: "BEST OF THE SIX. Best measured eye of the whole task - 22.0% below L60 with white at 254 and "
        "254 against a paper of 254, so both sclera crescents are EXACT paper white - and both pupils "
        "sit left, onto Drew, so the gaze is finally off the lens. Broad flat-topped skull, two small "
        "close-set triangular ears, short blunt muzzle with its beard fringe, black studded collar, "
        "slate blank, back bar in readable wood grain with legible bottle silhouettes, nothing "
        "lettered anywhere but the mirrored window. Faults it shares with the round: the lip line "
        "still opens a dark gap, the coat still runs past the jaw onto the throat, the blouse still "
        "gapes, the pendant is an oval and not a heart, and the bottom-left border frays",
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
    ("KIT  bust.png  - DROPPED (the Bichon came from here)",
     fit(Image.open(ROOT / "canon/characters/abby/kit/bust.png"), W_KIT)),
    ("KIT  head.png  - DROPPED, same coat, same failing eye",
     fit(Image.open(ROOT / "canon/characters/abby/kit/head.png"), W_KIT)),
    ("PICTURE 2 - NEW: sc04 + sc12, the accepted plates",
     fit(Image.open(RD / "abby-picture2-accepted-plates.png"), W_KIT)),
    ("PICTURE 3 - the hand-drawn eye chart, kept",
     fit(Image.open(RD / "abby-eye-tile.png"), W_KIT)),
    ("PICTURE 1 - the approved blank plate, kept",
     fit(Image.open(R3 / "abby-picture1-trio-plate.png"), W_KIT)),
]
tiles = [fit(Image.open(RD / f"abby-seed{s}.png"), W_IMG) for s in SEEDS]

VERD = 108
row_h = LBL + max(t.height for t in tiles) + VERD + G
kit_h = sum(LBL + im.height + G for _, im in kit)
sheet_w = M + W_KIT + G + 3 * W_IMG + 2 * G + M
sheet_h = HEAD + max(2 * row_h, kit_h) + M + 136

sheet = Image.new("L", (sheet_w, sheet_h), 255)
d = ImageDraw.Draw(sheet)

d.text((M, 20), "ABBY - CHARACTER STUDY, ROUND 4", font=font(30, True), fill=0)
d.text((M, 58), "local/qwen-image-edit-2511, fast Lightning 8 steps, cfg 1, 4:5 1344x1680, 3 references. "
                "THE RECIPE WAS HELD AGAIN; THE IDENTITY TILE WAS REPLACED. Same six seeds as round 3, "
                "so this is a clean A/B on references alone.", font=font(15), fill=60)
d.text((M, 79), "THE BICHON IS GONE 6 OF 6. Every render now carries the broad flat-topped skull, the "
                "small close-set triangular ears and the short blunt bearded muzzle of the accepted "
                "plates. The gaze came off the lens in 4 of 6. Drew did not move at all.",
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
    d.text((cx + (250 if s == BEST else 168), cy + 4), f"near eye {dark:.1f}% dark   white {wl:.0f}/{wr:.0f} on paper {paper:.0f}",
           font=font(11), fill=90)
    sheet.paste(tile, (cx, cy + LBL))
    d.rectangle([cx, cy + LBL, cx + W_IMG - 1, cy + LBL + tile.height - 1], outline=0)
    wrap(d, NOTE[s], font(12), cx, cy + LBL + tile.height + 4, W_IMG - 4, 70, 14)

foot = ("WHAT CHANGED, AND THE JUDGES WERE RIGHT THAT IT WAS THE TILES. bust.png and studies/abby.png "
        "are dropped outright; Picture 2 is now the two head-and-shoulders crops of the plates Rick "
        "accepted - sc04 (470,360,820,900) and sc12 (450,350,830,930), the judges' own boxes - and the "
        "silky coat, the wide lynx-tufted ears and the round lapdog skull went with the old tiles in "
        "all six renders. ONE FORCED DEVIATION: the qwen bridge takes THREE references and drops extras "
        "off the END of the list, so a PICTURE 4 would have been binned on the wire; both ordered crops "
        "therefore travel side by side in ONE tile, and four legible bottle labels inside the sc04 crop "
        "were blanked first, because round 3 proved lettering in a reference comes back as pseudo-text "
        "at cfg 1. ONE BUG FIXED: --cast-count was parsed and logged but never reached the prompt, so "
        "round 3 asked for 'EXACTLY 1 character' over a three-character plate; it now says 3.  "
        "WHAT ROUND 5 OWES. (1) DREW DID NOT MOVE: his three EDITs - downy dash-strokes, the single-"
        "reversal S-curve, the heavy-lidded eye - lost 6 of 6 to the auto-appended tail EDIT that says "
        "everything else stays exactly as Picture 1. Only his eye improved. He needs his own pass with "
        "--repair, or a corrected Picture 1. (2) THE JAWLINE fails 6 of 6 - the coat still runs past the "
        "jaw onto the throat and into the blouse. (3) THE LIP still parts on a gap or a tooth in 6 of 6. "
        "(4) THE BLOUSE still gapes with a shading line between the breasts in 6 of 6: canon's own fence "
        "paragraph says 'open two buttons over a smooth sleek throat' and 'a teardrop gem pendant', and "
        "it is read AFTER the EDITs - the fence, not the prompt, is now the thing fighting the judges.")
wrap(d, foot, font(13), M, sheet_h - 130, sheet_w - 2 * M, 40, 16)

sheet.save(RD / "sheet.png")
print(RD / "sheet.png", sheet.size)
