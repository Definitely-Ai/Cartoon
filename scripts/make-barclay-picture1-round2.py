"""BARCLAY ROUND 2 — build the three reference tiles.

WHY (found by looking at the plates at full size, 2026-09-06):

 1. THE JUDGES' PREMISE ABOUT PICTURE 1 IS WRONG. They asked for Picture 1 to be
    re-cut from canon/plates/duo-barclay.png because duo.png "has him in
    near-profile" and duo-barclay.png "has him in true three-quarter with both
    eyes whole". Cropped side by side at (850,700,1120,960) the two plates draw
    the SAME near-profile head; neither shows a whole far eye, and in fact EVERY
    approved plate (canon/plates/duo.png, duo-barclay.png, and all twelve of
    canon/showcase-retired/sc01..sc12) draws Barclay in the same left-facing
    near-profile. There is no approved staging of a forward-turned Barclay to
    copy. The file the judges named is honoured anyway (it is the plate cut for
    his half), but the HEAD TURN has to come from somewhere else -> Picture 2.

 2. duo-barclay.png IS OPEN-MOUTHED where duo.png is closed, so this round hands
    the model an open mouth in Picture 1 that round 1 never had. The run script
    answers that with an explicit closed-mouth EDIT.

 3. THE THINGS THE JUDGES CALL FAULTS ARE IN THE APPROVED PLATE ITSELF. At full
    resolution duo-barclay.png has (a) a cocktail pick — a looped steel stem —
    skewering the cherry above the rocks glass, and (b) a flag pin that really is
    a near-blank shield about 18x30 px on the lapel. Round 1 proved the model
    copies Picture 1 faithfully, so prompting against a mark that is IN Picture 1
    loses. The pick is therefore PAINTED OUT of Picture 1 here (a horizontal
    clone from 42 px to its left, the same glass interior and the same back-bar
    band), leaving the cherry resting on the liquid, which is the prop the judges
    asked for. The pin is too few pixels to redraw honestly, so it is left alone
    and its authority moves to Picture 2, where it is legible.

OUTPUTS (into the round-2 dir): p1-barclay.png, p2-barclay.png, p3-barclay.png
plus a contact sheet refs-preview.png.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np

ROOT = Path("Z:/ImageGenerator/Cartoon")
OUT = Path("C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/"
           "7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/dog/round-2")
OUT.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------- Picture 1
# duo-barclay.png, Barclay's half, chest-up, 4:5. x stops at the plate's own
# right edge (1200) and starts at 620 — Drew's bill tip is at x~480 and his wing
# reaches the marble below y 1380, so no part of Drew is inside this box.
P1_BOX = (620, 600, 580, 725)            # left, top, w, h  (4:5)
# The pick: looped ring + stem, measured off a 5x NEAREST zoom of (760,1120,880,1250).
PICK = (797, 1136, 824, 1192)            # left, top, right, bottom in plate pixels
CLONE_DX = -42                           # same glass interior, same back-bar band

plate = Image.open(ROOT / "canon/plates/duo-barclay.png").convert("L")
a = np.asarray(plate).astype(np.float32).copy()
l, t, r, b = PICK
patch = a[t:b, l + CLONE_DX:r + CLONE_DX].copy()
# feather 3 px on all four sides so the clone does not leave a seam in the flutes
m = np.ones_like(patch)
f = 3
for i in range(f):
    w = (i + 1) / (f + 1)
    m[i, :] = np.minimum(m[i, :], w); m[-1 - i, :] = np.minimum(m[-1 - i, :], w)
    m[:, i] = np.minimum(m[:, i], w); m[:, -1 - i] = np.minimum(m[:, -1 - i], w)
a[t:b, l:r] = patch * m + a[t:b, l:r] * (1 - m)
p1 = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "L")
p1 = p1.crop((P1_BOX[0], P1_BOX[1], P1_BOX[0] + P1_BOX[2], P1_BOX[1] + P1_BOX[3]))
p1.save(OUT / "p1-barclay.png")

# ---------------------------------------------------------------- Picture 2
# canon/vision/studies/barclay.png (1024x1536) is the ONE picture in canon that
# draws him in a true three-quarter with BOTH eyes whole, a CLOSED mouth whose
# corner hooks up, lifted inner brows, and a LEGIBLE flag pin (canton + bars) on
# the lapel. It is cut chest-up here so the belt, the trousers and the raised
# glass — the staging round 1 had to fight — are simply not in the picture, and
# so the pick in that glass is not either.
P2_BOX = (330, 100, 690, 700)
Image.open(ROOT / "canon/vision/studies/barclay.png").convert("L").crop(
    (P2_BOX[0], P2_BOX[1], P2_BOX[0] + P2_BOX[2], P2_BOX[1] + P2_BOX[3])
).save(OUT / "p2-barclay.png")

# ---------------------------------------------------------------- Picture 3
# Replaces canon/characters/dog/kit/head.png, which the judges are right about:
# it is a soft GRAPHITE portrait whose nose is stippled mid-grey with a blown
# highlight and whose lip line is a mid-grey curve, so it contradicted the EDIT
# that named a true-black lip line. sc07 is true engraving: solid black nose,
# heavy black lip band, layered directional fur, and the drop-ear leather with
# its long fringe. Its mouth is OPEN — the run script names that as ink-only.
P3_BOX = (715, 820, 420, 420)
p3 = Image.open(ROOT / "canon/showcase-retired/sc07-the-deductible-rehearsal.png").convert("L").crop(
    (P3_BOX[0], P3_BOX[1], P3_BOX[0] + P3_BOX[2], P3_BOX[1] + P3_BOX[3])
)
# sc07 letters its shelf (MULLIGAN MALT, TEE TIME). A study letters NOTHING, and
# round 1 seed 41 came back with scribbled pseudo-text on the labels, so the two
# lettered panels that fall inside this crop are blanked to plain paper here
# rather than argued with in the prompt.
ImageDraw.Draw(p3).rectangle((2, 126, 152, 176), fill=232)
p3.save(OUT / "p3-barclay.png")

# ------------------------------------------------------------------ preview
tiles = [("P1 duo-barclay (620,600,580,725) pick removed", OUT / "p1-barclay.png"),
         ("P2 vision/studies/barclay (330,100,690,700)", OUT / "p2-barclay.png"),
         ("P3 sc07 head (715,820,420,420)", OUT / "p3-barclay.png")]
H = 560
ims = []
for lab, p in tiles:
    im = Image.open(p).convert("L")
    im = im.resize((round(im.width * H / im.height), H), Image.LANCZOS)
    ims.append((lab, im))
sheet = Image.new("L", (sum(i.width + 12 for _, i in ims), H + 30), 255)
d = ImageDraw.Draw(sheet)
x = 0
for lab, im in ims:
    sheet.paste(im, (x, 28)); d.text((x + 4, 8), lab, fill=0); x += im.width + 12
sheet.save(OUT / "refs-preview.png")
print("wrote", OUT / "refs-preview.png")
