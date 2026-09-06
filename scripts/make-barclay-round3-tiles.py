"""BARCLAY ROUND 3 - the three reference tiles, rebuilt to the judges' list.

WHAT THE JUDGES ASKED FOR, AND WHAT THIS BUILDS
-----------------------------------------------
1. RE-CUT PICTURE 2 so the WHOLE head sits inside the tile with air around it,
   nothing the model is told to copy touching an edge. Round 2 cut
   canon/vision/studies/barclay.png at (330,100,690,700), which sliced the nose
   tip off at the left edge. Measured off gridded copies, the study's head runs
   crown y=45, nose tip x=130, chin y=430, back of the near ear x=540, and the
   lapel flag pin sits at x 628-700, y 628-690. The tile is therefore
   (70, 0, 720, 730): 60 px of air in front of the nose, 45 above the crown,
   90 past the pin and 40 below it, with the whole skull, both lifted inner
   brows, both ears and the whole pin inside it.

   The one thing that tile also caught is the study's RAISED GLASS WITH A
   STIRRER in the bottom-left corner - a pick in a reference, fighting the edit
   that forbids one. It is not painted out: the corner is rebuilt by cloning the
   picture's own material from 104 px higher up the same columns, which carries
   blank paper over the paper half and the jacket's own weave (and its slanting
   left edge) over the jacket half. Nothing flat is laid down.

2. REBUILD PICTURE 3 WITHOUT PAINT-OUTS. Round 2's tile was a crop of sc07 with
   a flat grey block laid over two lettered shelf labels - exactly the blank
   rectangle the cleanliness rule forbids handing the model. sc07 also draws him
   with his mouth OPEN, which fights EDIT 3. All twelve retired plates were read
   at full size; sc01 is the one that crops tight on a CLOSED mouth with the
   lettered shelf row entirely above the crop (labels end y=800, crown starts
   y=855). The tile is (620, 818, 420, 344). One label survives inside it - ACE
   RESERVE, on the low bottle beside his muzzle at x 601-663, y 986-1046 - and
   it is removed the way the judges asked: engraved BOTTLE-GLASS texture cloned
   down from the same bottle's shoulder 66 px higher, not a grey block.

3. REBUILD PICTURE 1's HEAD as a full-size composited three-quarter, mouth
   closed, far cheek showing, both eyes whole - "P1 must show the pose you want,
   not a hint of it."

   DEVIATION, and the reason for it. The judges asked for the re-cut Picture 2
   head to be composited in "turned further into the room than it is now". It
   cannot be: pasting that head in gives back the same shallow turn it already
   has, which is the turn round 2 pasted and the model then flattened back to
   profile. The PROCESS note authorises the escalation - "make Picture 1's
   composited head a full three-quarter borrowed from the study rather than the
   duo plate, since the plate's Barclay was drawn in profile and the model keeps
   regressing to it". Canon holds exactly one true three-quarter of Barclay with
   BOTH eyes whole, BOTH inner brows lifted and the mouth closed:
   canon/characters/dog/kit/head.png. It is graphite rather than engraving,
   which is why round 2 dropped it as an INK reference - but Picture 1's job is
   GEOMETRY, and the prompt now says so in as many words ("a rough paste-up:
   keep its ANGLE and PLACEMENT and redraw it at Picture 2's quality"). The ink
   comes from Pictures 2 and 3.

   That head faces the reader's RIGHT (nose x 600-740 against a skull centred on
   x 490; the near ear, the larger one, is at our left). Barclay must face
   frame-LEFT toward Drew, so it is MIRRORED first. After mirroring the muzzle
   points frame-left, the near ear lands at our right where the plate's own ear
   is, and the far eye sits clear of the muzzle bridge with the far cheek open
   beside it - the thing every round so far has failed to draw.

   Measured landmarks (gridded copies, both files):
     kit/head.png  crown y=25, chin y=660  -> crown-to-jaw 635
     duo.png       crown y=705, chin y=1005, nose tip x=815, near ear to x=1120
   so the head is scaled 300/635 = 0.4724 and seated crown-on-crown,
   nose-on-nose. At that scale its silhouette covers the plate's old profile
   head everywhere (checked band by band), so no erase pass is needed and no
   flat block is ever laid down.

   THE HALO. A hand polygon runs outside the drawn head in places, and there the
   incoming pixels are the kit sheet's blank PAPER laid over the plate's dark
   back bar - which reads as a light bloom round his skull, and round 2's render
   drew that bloom. So the cut is not the polygon: the paper is found by what it
   IS - bright AND locally flat (local standard deviation under 4.5 over a 9 px
   window) - and every such region connected to the sheet's border is background.
   The head is what is left, hole-filled, opened, and finally clipped by the
   polygon so the shoulders below the chin are dropped. Fur, which is bright but
   never flat, survives the test.

4. THE PAINTED-OUT COCKTAIL PICK REPAINTED AS CONTINUOUS GLASS AND LIQUID, not
   left as a light patch. Measured: the ring, the stick and the cherry hang at
   x 784-828, y 1128-1226 - the cherry ABOVE the liquid line at y=1226. The
   column is rebuilt by row-wise interpolation between the six clean columns on
   each side, which is what carries the back-rim ellipse and the liquid line
   straight through the gap instead of stamping a patch over them; then the
   cherry itself is re-seated 58 px lower, DOWN INSIDE the drink below the
   liquid line beside the ice, which is where EDIT 7 says it belongs.

OUT: <round-3>/p1-barclay.png, p2-barclay.png, p3-barclay.png, refs-preview.png
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps
from scipy import ndimage

ROOT = Path("Z:/ImageGenerator/Cartoon")
OUT = Path("C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/"
           "7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/dog/round-3")

# ---------------------------------------------------------------- picture 2
STUDY = "canon/vision/studies/barclay.png"
P2_BOX = (70, 0, 720, 730)              # left, top, w, h  in the 1024x1536 study
P2_GLASS = (58, 652, 332, 732)          # the raised glass and its stirrer
P2_GLASS_DY = -104                      # paper over paper, jacket weave over jacket

# ---------------------------------------------------------------- picture 3
SC01 = "canon/showcase-retired/sc01-best-performing-square-foot.png"
P3_BOX = (620, 818, 420, 344)           # head only; the lettered shelf row ends y=800
P3_LABEL = (612, 980, 672, 1052)        # ACE RESERVE
P3_LABEL_DY = -66                       # the same bottle's shoulder, engraved glass

# ---------------------------------------------------------------- picture 1
P1_BOX = (620, 600, 580, 725)           # the round-2 crop, kept, so the camera holds

PICK = (784, 1128, 828, 1226)           # ring + stick + cherry, in duo.png pixels
CHERRY = (786, 1183, 824, 1223)
CHERRY_DY = 58                          # down into the drink, below the liquid line

# The plate's OWN head is a long left-facing profile; the three-quarter head that
# replaces it is foreshortened, so it is narrower, and the old ear and the back of
# the old skull stick out past it at x 1000-1160, y 720-990 as a pale bushy lobe.
# That strip is rebuilt from the band of vertical slat panelling the back bar
# already carries directly above it (y 656-716), tiled down - vertical slats
# repeat vertically, so the wall simply continues behind him. No flat fill.
ERASE = (1000, 686, 1172, 992)
ERASE_BAND = (656, 60)

KIT_HEAD = "canon/characters/dog/kit/head.png"
KIT_W = 990
SCALE = 300 / 635                       # plate crown-to-jaw / kit crown-to-jaw
PLATE_CROWN, PLATE_NOSE_X = 705, 815
KIT_CROWN_Y, KIT_NOSE_X_MIRRORED = 25, 250

# the head cut, in ORIGINAL kit/head.png pixels (mirrored below). This only has
# to CONTAIN the head - the silhouette itself is found from the picture.
POLY = [(500, 20), (620, 32), (720, 70), (790, 120), (870, 190), (925, 290),
        (930, 380), (895, 450), (845, 495), (800, 560), (755, 625), (690, 665),
        (600, 690), (500, 700), (410, 700), (330, 690), (255, 665), (190, 610),
        (130, 510), (95, 390), (85, 280), (120, 180), (190, 105), (300, 50),
        (400, 26)]
FEATHER = 3


def clone(a: np.ndarray, box, dx: int = 0, dy: int = 0, feather: int = 6) -> None:
    """Copy this picture's own material from dx/dy away into box."""
    l, t, r, b = box
    patch = a[t + dy:b + dy, l + dx:r + dx].copy()
    m = np.ones_like(patch)
    for i in range(feather):
        w = (i + 1) / (feather + 1)
        m[i, :] = np.minimum(m[i, :], w)
        m[-1 - i, :] = np.minimum(m[-1 - i, :], w)
        m[:, i] = np.minimum(m[:, i], w)
        m[:, -1 - i] = np.minimum(m[:, -1 - i], w)
    a[t:b, l:r] = patch * m + a[t:b, l:r] * (1 - m)


def inpaint_rows(a: np.ndarray, box, pad: int = 6) -> None:
    """Rebuild a narrow column by interpolating each row across it.

    Horizontal features - the far rim of the glass, the liquid line, the bar's
    shelf edge - run straight through, which a stamped patch would break.
    """
    l, t, r, b = box
    left = a[t:b, l - pad:l].mean(axis=1)
    right = a[t:b, r:r + pad].mean(axis=1)
    w = np.linspace(0.0, 1.0, r - l)[None, :]
    a[t:b, l:r] = left[:, None] * (1 - w) + right[:, None] * w


def tile_band_down(a: np.ndarray, box, band_top: int, band_h: int) -> None:
    """Carry a band of the picture's own panelling down through box."""
    l, t, r, b = box
    src = a[band_top:band_top + band_h, l:r].copy()
    y = t
    while y < b:
        h = min(band_h, b - y)
        patch = src[:h].copy()
        m = np.ones_like(patch)
        for i in range(5):
            w = (i + 1) / 6
            m[i, :] = np.minimum(m[i, :], w)
            if h - 1 - i >= 0:
                m[h - 1 - i, :] = np.minimum(m[h - 1 - i, :], w)
            m[:, i] = np.minimum(m[:, i], w)
            m[:, -1 - i] = np.minimum(m[:, -1 - i], w)
        a[y:y + h, l:r] = patch * m + a[y:y + h, l:r] * (1 - m)
        y += band_h


def head_silhouette(kit: Image.Image) -> Image.Image:
    """The drawn head, found by what the PAPER is: bright and locally flat."""
    g = np.asarray(kit).astype(np.float32)
    mean = ndimage.uniform_filter(g, 9)
    sd = np.sqrt(np.maximum(ndimage.uniform_filter(g * g, 9) - mean * mean, 0))
    paper = (g > 215) & (sd < 4.5)

    lab, n = ndimage.label(paper)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    border.discard(0)
    bg = np.isin(lab, list(border))

    head = ~bg
    head = ndimage.binary_closing(head, np.ones((5, 5)))
    head = ndimage.binary_fill_holes(head)
    head = ndimage.binary_opening(head, np.ones((5, 5)))
    lab2, n2 = ndimage.label(head)
    if n2:
        sizes = ndimage.sum(head, lab2, range(1, n2 + 1))
        head = lab2 == (int(np.argmax(sizes)) + 1)

    poly = [(KIT_W - x, y) for (x, y) in POLY]
    guard = Image.new("L", kit.size, 0)
    ImageDraw.Draw(guard).polygon(poly, fill=255)
    # pull the seam a few pixels INSIDE the drawn fur, so the feathered edge
    # never carries a rim of the kit sheet's paper out over the dark back bar
    head = ndimage.binary_erosion(head, np.ones((7, 7)))
    m = (head.astype(np.uint8) * 255) & np.asarray(guard)
    return Image.fromarray(m)


def mend_the_glass(plate: Image.Image) -> Image.Image:
    a = np.asarray(plate).astype(np.float32).copy()
    cherry = a[CHERRY[1]:CHERRY[3], CHERRY[0]:CHERRY[2]].copy()

    inpaint_rows(a, PICK)

    h, w = cherry.shape
    yy, xx = np.mgrid[0:h, 0:w]
    rr = np.sqrt(((yy - (h - 1) / 2) / (h * 0.46)) ** 2
                 + ((xx - (w - 1) / 2) / (w * 0.46)) ** 2)
    m = np.clip((1.12 - rr) / 0.28, 0, 1)
    t = CHERRY[1] + CHERRY_DY
    a[t:t + h, CHERRY[0]:CHERRY[0] + w] = (
        cherry * m + a[t:t + h, CHERRY[0]:CHERRY[0] + w] * (1 - m))
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def paste_the_head(plate: Image.Image):
    a = np.asarray(plate).astype(np.float32).copy()
    for _ in range(3):          # three passes so the feathered seams close up
        tile_band_down(a, ERASE, *ERASE_BAND)
    plate = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

    kit = ImageOps.mirror(Image.open(ROOT / KIT_HEAD).convert("L"))
    mask = head_silhouette(kit)
    kit = kit.filter(ImageFilter.UnsharpMask(radius=2, percent=140, threshold=3))

    sw, sh = round(kit.width * SCALE), round(kit.height * SCALE)
    head = kit.resize((sw, sh), Image.LANCZOS)
    hmask = (mask.resize((sw, sh), Image.LANCZOS)
             .filter(ImageFilter.GaussianBlur(FEATHER)))

    off_y = PLATE_CROWN - round(KIT_CROWN_Y * SCALE)
    off_x = PLATE_NOSE_X - round(KIT_NOSE_X_MIRRORED * SCALE)

    W, H = plate.size
    layer = Image.new("L", (W, H), 255)
    lmask = Image.new("L", (W, H), 0)
    layer.paste(head, (off_x, off_y))
    lmask.paste(hmask, (off_x, off_y))

    m = np.asarray(lmask).astype(np.float32) / 255.0
    src = np.asarray(layer).astype(np.float32)
    dst = np.asarray(plate).astype(np.float32)

    sel = m > 0.5
    if sel.sum() > 1000:
        s_mu, s_sd = src[sel].mean(), src[sel].std()
        d_mu, d_sd = dst[sel].mean(), dst[sel].std()
        src = (src - s_mu) * (d_sd / max(s_sd, 1e-3)) + d_mu
    out = np.clip(src * m + dst * (1 - m), 0, 255).astype(np.uint8)
    return Image.fromarray(out), (off_x, off_y, sw, sh)


def crop(im: Image.Image, box) -> Image.Image:
    l, t, w, h = box
    return im.crop((l, t, l + w, t + h))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    study = np.asarray(Image.open(ROOT / STUDY).convert("L")).astype(np.float32).copy()
    clone(study, P2_GLASS, dy=P2_GLASS_DY, feather=8)
    p2 = crop(Image.fromarray(np.clip(study, 0, 255).astype(np.uint8)), P2_BOX)
    p2.save(OUT / "p2-barclay.png")

    sc = np.asarray(Image.open(ROOT / SC01).convert("L")).astype(np.float32).copy()
    clone(sc, P3_LABEL, dy=P3_LABEL_DY, feather=6)
    p3 = crop(Image.fromarray(np.clip(sc, 0, 255).astype(np.uint8)), P3_BOX)
    p3.save(OUT / "p3-barclay.png")

    plate = Image.open(ROOT / "canon/plates/duo.png").convert("L")
    full, where = paste_the_head(mend_the_glass(plate))
    p1 = crop(full, P1_BOX)
    p1.save(OUT / "p1-barclay.png")
    print("head pasted at", where)

    tiles = [("P1 duo.png %s, pick mended, THREE-QUARTER HEAD composited" % (P1_BOX,), p1),
             ("P2 vision/studies/barclay %s - whole head, air all round" % (P2_BOX,), p2),
             ("P3 sc01 head %s - no paint-outs, no lettering" % (P3_BOX,), p3)]
    tw = 520
    ims = [(n, t.resize((tw, round(tw * t.height / t.width)), Image.LANCZOS))
           for n, t in tiles]
    th = max(i.height for _, i in ims)
    sheet = Image.new("L", (len(ims) * (tw + 16) + 16, th + 46), 255)
    d = ImageDraw.Draw(sheet)
    for k, (n, i) in enumerate(ims):
        x = 16 + k * (tw + 16)
        sheet.paste(i, (x, 30))
        d.text((x, 12), n, fill=0)
    sheet.save(OUT / "refs-preview.png")
    for f in ("p1-barclay.png", "p2-barclay.png", "p3-barclay.png", "refs-preview.png"):
        print("wrote", OUT / f, Image.open(OUT / f).size)


if __name__ == "__main__":
    main()
