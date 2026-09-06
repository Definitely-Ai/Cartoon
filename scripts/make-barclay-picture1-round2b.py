"""BARCLAY ROUND 2b - Picture 1 with the HEAD TURN DRAWN IN, not prompted.

WHAT SEED 41 OF ROUND 2a PROVED
-------------------------------
Round 2a re-cut Picture 2 to the one canon picture that shows Barclay in a true
three-quarter with both eyes whole, and named the turn in EDIT 1 in as many words
as the language has. Seed 41 came back in the same near-profile as round 1, with
one eye. The house model is an EDIT model: it copies Picture 1's GEOMETRY and
takes only surface identity from the later tiles. A pose that is not in Picture 1
does not happen. (The same lesson the room kit records: some things must be DRAWN,
not prompted.)

It also came back with an OPEN MOUTH, teeth and tongue - a regression round 1 did
not have. canon/plates/README.md says why: duo-barclay.png is the SPEAKER VARIANT
of the plate, "the plate with one mouth open". The judges asked for Picture 1 to
be re-cut from it believing it was the three-quarter; it is in fact the same
near-profile as duo.png with Barclay's mouth opened. So Picture 1 goes back to
canon/plates/duo.png (mouths closed) and the head turn is composited in.

WHAT THIS BUILDS
----------------
p1b-barclay.png - the duo.png crop (620,600,580,725), the cocktail pick painted
out of the rocks glass, and Barclay's near-profile head REPLACED by the
three-quarter head from canon/vision/studies/barclay.png: cut on a hand-measured
polygon, scaled 0.838 so its crown-to-jaw matches the plate's 310 px, seated by
its jaw and its centre of mass on the plate's own head, tone-matched to the
plate's head (mean and standard deviation), and feathered 9 px into it.

Geometry measured by hand off gridded crops:
  study (1024x1536): crown y=90, jaw y=460, nose x=205, skull back x=600
  plate (1200x1800): crown y=700, jaw y=1010, nose x=775, skull back x=1150,
                     and canon/plates/duo.json's own barclay eyes/mouth boxes agree
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path("Z:/ImageGenerator/Cartoon")
OUT = Path("C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/"
           "7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/dog/round-2")

P1_BOX = (620, 600, 580, 725)
PICK = (797, 1136, 824, 1192)          # the looped pick in duo-barclay; duo.png's sits here too
CLONE_DX = -42

SCALE = 310 / 370                       # plate crown-to-jaw / study crown-to-jaw
OFF_X, OFF_Y = 625, 625                 # study px * SCALE + OFF = plate px

# the head cut, in study pixels: nose, muzzle, brow, crown, ear, ruff, neck, jaw
POLY = [(205, 300), (198, 245), (215, 190), (250, 120), (330, 80), (430, 78),
        (520, 108), (590, 180), (625, 300), (620, 430), (560, 500), (430, 512),
        (320, 490), (250, 455), (215, 400), (196, 340)]
FEATHER = 9


def pick_out(plate: Image.Image) -> Image.Image:
    a = np.asarray(plate).astype(np.float32).copy()
    l, t, r, b = PICK
    patch = a[t:b, l + CLONE_DX:r + CLONE_DX].copy()
    m = np.ones_like(patch)
    for i in range(3):
        w = (i + 1) / 4
        m[i, :] = np.minimum(m[i, :], w); m[-1 - i, :] = np.minimum(m[-1 - i, :], w)
        m[:, i] = np.minimum(m[:, i], w); m[:, -1 - i] = np.minimum(m[:, -1 - i], w)
    a[t:b, l:r] = patch * m + a[t:b, l:r] * (1 - m)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def main() -> None:
    plate = pick_out(Image.open(ROOT / "canon/plates/duo.png").convert("L"))
    study = Image.open(ROOT / "canon/vision/studies/barclay.png").convert("L")

    # the head, cut and placed on a plate-sized canvas
    mask = Image.new("L", study.size, 0)
    ImageDraw.Draw(mask).polygon(POLY, fill=255)
    W, H = plate.size
    sw, sh = round(study.width * SCALE), round(study.height * SCALE)
    head = study.resize((sw, sh), Image.LANCZOS)
    hmask = mask.resize((sw, sh), Image.LANCZOS).filter(ImageFilter.GaussianBlur(FEATHER))

    layer = Image.new("L", (W, H), 255)
    lmask = Image.new("L", (W, H), 0)
    layer.paste(head, (OFF_X, OFF_Y))
    lmask.paste(hmask, (OFF_X, OFF_Y))

    # tone-match the incoming head to the head it replaces, over the same pixels
    m = np.asarray(lmask).astype(np.float32) / 255.0
    src = np.asarray(layer).astype(np.float32)
    dst = np.asarray(plate).astype(np.float32)
    # KILL THE HALO. The polygon runs a little outside the drawn head in places,
    # and there the incoming pixels are the study's blank PAPER laid over the
    # plate's dark shelf, which reads as a glow around his skull. Wherever the
    # incoming pixel is paper and the plate pixel is dark, keep the plate.
    halo = ((src > 236) & (dst < 132)).astype(np.float32)
    halo = np.asarray(Image.fromarray((halo * 255).astype(np.uint8)).filter(
        ImageFilter.GaussianBlur(4))).astype(np.float32) / 255.0
    m = m * (1.0 - np.clip(halo * 1.6, 0, 1))
    sel = m > 0.5
    if sel.sum() > 1000:
        s_mu, s_sd = src[sel].mean(), src[sel].std()
        d_mu, d_sd = dst[sel].mean(), dst[sel].std()
        src = (src - s_mu) * (d_sd / max(s_sd, 1e-3)) + d_mu
    out = np.clip(src * m + dst * (1 - m), 0, 255).astype(np.uint8)

    im = Image.fromarray(out).crop(
        (P1_BOX[0], P1_BOX[1], P1_BOX[0] + P1_BOX[2], P1_BOX[1] + P1_BOX[3]))
    im.save(OUT / "p1b-barclay.png")
    print("wrote", OUT / "p1b-barclay.png", im.size)


if __name__ == "__main__":
    main()
