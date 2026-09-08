"""PLACE ONE CHARACTER INTO THE APPROVED ROOM, and cut him out again as a sticker.

    python scripts/cast-place.py --character drew --seed 41 --route A|B
        [--box X0,Y0,X1,Y1] [--edit "..."] [--plate PATH] [--pose-name NAME]
        [--rolls N] [--thresh 18] [--out DIR] [--dry-run]

THE TWO ROUTES (--route, 2026-09-08)
------------------------------------
Both send the same three references and the same numbered EDITS; they differ in
WHAT Picture 1 is and in HOW MUCH of the render is allowed back onto the plate.

  --route A   FLAT FIELD.  Picture 1 is the plate crop with everything EXCEPT the
              left club chair, the marble counter top and the wall's silhouette
              lines replaced by a flat mid-grey (140, --flat-grey). The chair is
              then the ONLY anchor the model has: it cannot copy a room it cannot
              see, and EDIT 2 tells it the grey stays flat. The key is honest for
              the first time - the sticker is the pixels that differ from that
              FLAT FIELD (not from a room the model re-inked), cleaned, and
              clipped to the window round the seat (--roi). Only that sticker is
              laid onto the REAL approved plate, so the room in the finished
              cartoon is always the plate's own pixels.

  --route B   WHOLE CROP.  Picture 1 is the plate crop exactly as it is, and the
              whole rendered crop goes back with a 12 px feathered border
              (--paste-feather) and no key at all. The model keeps the room's
              LOOK but re-inks it, so this trades the plate's own lines for a
              seamless figure: the join to judge is the crop's border ring.

Both routes get Picture 3 = canon/vision/studies/duo-behind.png, the staging the
founder scored highest, and EDIT 1 defaults to THE PINNED STAGING (see
ADD_EDIT): from behind and a little to his left, the knit across the shoulder
blades, the leather roll on the lower back, the neck in its S, the head turned
RIGHT to the other chair in profile with the lidded eye showing, the near hand on
the marble - never a front view.

`--route legacy` is the first launch's behaviour (plate crop as Picture 1, keyed
against the plate or a clean twin) and is kept only to reproduce the old numbers.

WHY THIS EXISTS
---------------
`cast-study.py` draws a character ALONE, in a crop of an old approved plate, and
the studio judges the bird by himself. It cannot put him in TODAY's room: its
Picture 1 is a bust crop of `canon/plates/duo.png`, and its prompt re-points
canon's staging paragraph at a solo figure, which is exactly the instruction that
invites the model to rebuild the set.

The scene is settled: `canon/room-kit/v2/plate.png` — the approved room, the two
leather club chairs ON at the marble. Nothing in it may move. So this script asks
the house model for ONE change and nothing else:

    Picture 1 = the plate, cropped 4:5 around the LEFT chair, upscaled to 1344x1680
    Picture 2 = canon/vision/studies/drew.png, "copy THIS bird identically"
    EDIT 1    = ADD DREW, seated IN that chair, seen from behind and a little to
                his left, turned toward the right-hand chair
    EDIT 2    = keep everything else exactly as Picture 1

and then throws away everything the model returned EXCEPT the character: the
result is tone-matched and aligned back onto the crop, differenced against it,
and the one blob that sits in the chair is feathered into an RGBA sticker. The
room in the finished cartoon is therefore always the approved plate's own pixels,
never a redraw of it — and the fraction of pixels the model changed OUTSIDE the
sticker is written into the sidecar as a cleanliness number, so "the model moved
the room" is data, not an opinion.

WHAT IS REUSED FROM cast-study.py (imported, not copied)
--------------------------------------------------------
  build_request()     the local branch of multiRefInput() — model, provider,
                      aspect_ratio 4:5, negative, fast (Lightning 8-step cfg 1)
  prepare_reference() uploadReferences() — grayscale, autocontrast, max width
                      1024, JPEG q90, inline data URI
  post() / fetch()    POST http://127.0.0.1:8000/api/generate
  finish()            generateCartoonArt()'s grayscale + margin trim
  local_fence()       the 4th ```text fence of canon/MASTER-PROMPT.md
  LOCAL_NEGATIVE / MODEL

THE RULES BLOCK, and the one deliberate difference from cast-study.py
---------------------------------------------------------------------
cast-study sends the WHOLE local fence. Here the fence's room paragraphs (THE
ROOM, THE STAGE, THE TELEVISION, THE CHALKBOARD) describe a set that Picture 1
already IS, in its own approved pixels — restating them is an invitation to
redraw them, and a redrawn room is a dirty key. `--rules pen` (the default)
therefore sends only the two paragraphs that are about DRAWING rather than about
the set: the engraving paragraph, and DREW's own half of the character
paragraph. `--rules full` sends the whole fence, `--rules none` sends none of it;
which one was used is in the sidecar.

WHAT THE FIRST RUNS MEASURED (2026-09-08, Drew seed 41) - READ THIS BEFORE
TUNING THE KEY
--------------------------------------------------------------------------
The house model CANNOT return Picture 1's pixels, and this is settled in the
server, not in the prompt: backend/providers/local_bridge.py _graph_qwen builds
an `EmptySD3LatentImage` and samples it at `"denoise": 1.0`, with the references
reaching the sampler only through `TextEncodeQwenImageEditPlus` conditioning.
Every pixel that comes back is drawn from noise. It copies the CAMERA and the
SEATING almost literally - which is what duo-behind.txt claims for it, and what
seed 41 delivered - but it re-inks the room in its own lighter pen and floats the
whole composition by a few pixels.

Measured on the box below, after percentile tone-matching and a 6px alignment
search: 71-76% of the crop differs from the approved plate by more than 12 grey
levels, and it stays at 71-74% even when both are blurred at sigma 12, so it is
mass, not hatching jitter. Ordering the edits with "keep everything else" FIRST
(--keep-first) did not move that number. A plate-referenced difference key
therefore cannot separate the bird from the room on its own, and two guards do
the separating instead:

  * --roi   the sticker may not leave the pose's own envelope (DEFAULT_ROI), so
            the window, the far marble and the right-hand chair can never be
            keyed into the bird however dirty the render is;
  * --clean-pass  draw the SAME seed a second time with the bird removed from
            the edits AND from the references, and key against THAT twin instead
            of the plate: both twins are re-inked the same way, so what differs
            is the bird. A twin that still sees Picture 2 draws him anyway (round
            2 measured 0.75 "clean"), which is why the twin is blind to him.

The cleanliness number in the sidecar is the fraction of pixels OUTSIDE the
sticker that the model changed by more than 12 levels. Against this model it
reads the model's own re-inking, not a mistake in the prompt: treat anything
under ~0.10 as a clean key and anything above ~0.30 as "the room was redrawn -
the sticker is all you may keep".

WHAT THE ROUTE BAKE-OFF MEASURED (2026-09-08, seeds 41 and 7, four renders)
--------------------------------------------------------------------------
                     join at the seam   of the plate replaced   room re-inked
  route A  seed 41      40.19 levels           12.40%              0.8372
  route A  seed  7      41.11 levels           12.98%              0.9010
  route B  seed 41      64.60 levels           23.70%              0.9056
  route B  seed  7      71.52 levels           23.70%              0.9330

ROUTE A wins the join by every measure and is the route the rounds should use.
Its seam is a feathered outline round the figure and costs 40 grey levels; route
B's is a hard-edged rectangle and costs 65-72, because the model returned the
crop on a blown-out white ground and route B pastes whatever it is given. Route A
also puts back half as much: outside its sticker the picture is still the
approved plate, so a bad render costs nothing, whereas route B has no recovery -
the render IS the room.

THE FLAT FIELD'S PREMISE HELD. The model obeyed EDIT 2 and left the grey grey; it
invented no room in it. That is what a plate-referenced key never managed, and it
means the difference key is finally measuring something real. The 0.84-0.93
"cleanliness" numbers above are the model MOVING the chair and the marble, not
re-inking them.

WHAT STILL FAILS, AND IT IS NOT THE ROUTE. All four renders came back with Drew
square to the camera and with a DOG beside him - and duo-behind.png, the staging
Picture 3, is a flamingo AND a labrador at the marble. The model is copying its
CAST as well as its camera. Before anything else is tuned, crop Picture 3 to the
flamingo alone (--staging) and re-run route A. Route A's second, smaller
weakness: with the room flattened away the model has no horizon left and rescales
the set, so the chair alone is a weaker anchor than it looks - if the crop still
drifts after Picture 3 is fixed, keep one more structural line (the bar front's
near edge) in the field rather than widening the box.

NEVER run room-part.py, never touch parts.json.
"""
from __future__ import annotations

import argparse
import datetime as dt
import importlib.util
import io
import json
import re
import sys
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent           # Z:/ImageGenerator/Cartoon
SCRATCH = Path(
    "C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/"
    "7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-scene"
)
FIGURES = ROOT / "canon" / "room-kit" / "v2" / "figures"
PLATE = ROOT / "canon" / "room-kit" / "v2" / "plate.png"

# --------------------------------------------------------- the house recipe
_spec = importlib.util.spec_from_file_location("cast_study", ROOT / "scripts" / "cast-study.py")
cs = importlib.util.module_from_spec(_spec)
assert _spec.loader is not None
_spec.loader.exec_module(cs)                            # main() is __main__-guarded

WORK = (1344, 1680)                                     # what "4:5" resolves to on the bridge

# ------------------------------------------------------------- the geometry
#
# reports/2026-09-05/CAST-PLAN.md + scratchpad/cast/poses/poses.json, in the
# plate's own 1200x1800 pixels: Drew's crown lands near row 828 (clear of the
# mirrored DOOR ink, which ends about row 805), his shoulders near row 1122, and
# the left chair's studded roll top crosses him at about row 1270. His silhouette
# runs columns 182-634. The default box is the 4:5 window that holds all of that
# plus the chair below it: 640x800 from (20,700).
DEFAULT_BOX = {"drew": (20, 700, 660, 1500)}
# Where the figure must be sitting for a blob to count as him — the left chair,
# in plate pixels. A blob that touches nothing here is the model redecorating.
DEFAULT_SEAT = {"drew": (0, 1240, 520, 1800)}
# THE ENVELOPE the figure is allowed to occupy at all, in plate pixels: poses.json
# figure-drew-01-rest mask_box (182, 825, 634, 1525) with a margin. The model
# re-inks the WHOLE crop (see the note above), so without this the key hands back
# the window and the far marble as part of the bird. Nothing outside it can ever
# enter a sticker.
# TIGHTENED after seed 41 round 6: the first envelope (150,780,700,1560) let the
# key take a slab of re-inked marble and bar front along with the bird. This one
# stops at the chair's roll and just past the martini hand, so the plate's own
# chair, bar front and far marble always survive.
DEFAULT_ROI = {"drew": (140, 770, 620, 1340)}

PORTRAIT = {"drew": "canon/vision/studies/drew.png"}
STAGING = "canon/vision/studies/duo-behind.png"

# --------------------------------------------------- THE FLAT FIELD (route A)
# What survives the grey, in the PLATE's own 1200x1800 pixels.
#
# THE CHAIR is a polygon traced down the left chair's studded roll: per-column
# probing of plate.png put the roll's top edge at rows 1235-1250 for columns
# 20-270, falling to about row 1320 by column 390, with the chair's own right
# side reaching the crop floor near column 440. Everything inside keeps the
# plate's own pixels, so the model is handed the real chair at the real size in
# the real pen - the one anchor it needs in order to seat him.
FIELD_CHAIR_POLY = {
    "drew": [(0, 1235), (250, 1245), (390, 1318), (440, 1500), (470, 1800), (0, 1800)]
}
# THE MARBLE TOP is found, not traced: the largest bright (>150) blob inside these
# plate rows, column-filled into a solid slab and grown a little so its dark near
# and far edges come with it. Rows 1100-1390 are the slab plus both its lips.
FIELD_MARBLE_ROWS = (1100, 1390)
FIELD_MARBLE_BRIGHT = 150
# THE WALL'S SILHOUETTE LINES are the structural boundaries and nothing else: the
# crop blurred at sigma 5 (which averages the engraved hatching away completely)
# and the top 4% of the gradient magnitude kept. That leaves the window mullions,
# the back bar's shelf edges and the counter lines as thin dark strokes on the
# grey, and drops every stroke of hatching, the street, its figures and the
# mirrored lettering.
FIELD_LINE_SIGMA = 5.0
FIELD_LINE_PCT = 96.0
FIELD_LINE_INK = 45
FIELD_LINE_MINLEN = 60      # a "line" has to run this far in one direction to count

PICTURE1_LABEL = (
    "THE APPROVED ROOM of The Swinging Door, cropped around the EMPTY left leather club chair at the "
    "marble bar — this IS the picture being edited. Its camera, its crop, its light, its engraved pen "
    "and every line of the room are already correct and must survive unchanged"
)
PICTURE1_LABEL_FLAT = (
    "THE SET for this edit, keyed down to what matters - this IS the picture being edited. The LEFT leather "
    "club chair and the marble bar top are the studio's own approved pixels, in the studio's engraved pen, at "
    "exactly the size and the place and the perspective the finished picture uses; the few dark strokes above "
    "them are the wall's silhouette lines. EVERYTHING ELSE IS FLAT FEATURELESS MID-GREY and is not a room: it "
    "is blank paper. The chair is the anchor - the bird sits IN that chair, at that size, in that light"
)
PICTURE3_LABEL = (
    "THE APPROVED STAGING (duo-behind), the camera the founder chose for this bar: the patrons are seen FROM "
    "BEHIND, over their shoulders, backs and shoulder blades to us at the marble, each head turned in "
    "three-quarter so the bill and one lidded eye read against the room. COPY THIS BODY ANGLE AND THIS TURN "
    "OF THE HEAD. Do not copy its room, its crop, its lighting or its second bird"
)
PICTURE2_LABEL = {
    "drew": (
        "DREW, the studio's official portrait — copy THIS bird identically: the small refined head, the "
        "slender pale bill with its black outer third, the heavy-lidded amiable eye, the long S-curve "
        "neck, the white collar band and small black bow tie, the V-neck knitted sweater vest, and the "
        "feathered hands with four fingers and a thumb and no claws"
    )
}

# THE PINNED STAGING - the founder's fixed brief of 2026-09-08, written as
# imperative sentences. This is EDIT 1 unless --edit replaces it. Every clause is
# load bearing: the studio has been handed a front view twice already, and the two
# NOT sentences are what stop it.
ADD_EDIT = {
    "drew": (
        "ADD DREW (Picture 2), the white flamingo gentleman, SEATED IN the empty LEFT leather club chair, "
        "filling it as a man fills a chair, and stage him exactly the way Picture 3 stages its patrons. "
        "Show him FROM BEHIND and a little to his LEFT, over his shoulder. Turn his back to the camera so "
        "the knit of the V-neck sweater vest runs across his shoulder blades. Let the chair's studded "
        "leather roll cross his LOWER BACK, its brass studs passing in front of the bottom of the vest, so "
        "he is plainly down inside the chair and not perched in front of it. Carry his neck up out of the "
        "vest and the white collar band in one easy S-curve, well above that roll. Turn his head to his "
        "RIGHT, toward the other chair, so the head and the slender pale bill read in profile - "
        "three-quarter at the very most - and the heavy-lidded eye shows. Rest his near feathered hand on "
        "the marble slab. Do NOT face him toward the camera. Do NOT draw a front view: no chest square to "
        "us, no bow-tie knot facing us, never both eyes. Keep the crown of his head clear of the mirrored "
        "window lettering above. Draw him in the SAME engraved pen, the same size, the same light and the "
        "same perspective as the chair he sits in, sitting behind the marble's near edge and never floating "
        "in front of it."
    )
}
KEEP_EDIT = (
    "KEEP EVERYTHING ELSE EXACTLY AS PICTURE 1, pixel for pixel: the camera, the crop, the marble slab and "
    "its edge, the panelled bar front, the window and the street beyond it, the mirrored window lettering, "
    "the second chair, the light and every hatching line of the room. Nothing moves, nothing is redrawn, "
    "nothing is added anywhere except the one figure in the left chair."
)
# EDIT 2 for --route A: "keep everything else as Picture 1" where Picture 1 is
# mostly flat grey. Saying only "keep everything else" invites the model to read
# the grey as fog and fill it, so this says that the grey IS the everything else.
KEEP_EDIT_FLAT = (
    "KEEP EVERYTHING ELSE EXACTLY AS PICTURE 1. The left leather club chair, the marble slab and its edges, "
    "and the few dark silhouette lines of the wall are the whole of the set: they do not move, they are not "
    "redrawn, they keep every line they have. THE FLAT GREY AROUND THEM STAYS FLAT, EMPTY AND FEATURELESS - "
    "it is blank paper, not a room seen through fog. Do not invent anything in it: no window, no street, no "
    "shelves, no bottles, no mirror, no lettering, no hatching, no shading, no floor, no second figure. "
    "Nothing whatever is added anywhere except the one bird seated in the left chair."
)
# THE CLEAN TWIN's only edit. Same seed, same references, same rules, the ADD
# sentence removed and the chair explicitly left empty: the same room, re-inked
# the same way, WITHOUT the bird. See --clean-pass.
CLEAN_EDIT = (
    "REDRAW PICTURE 1 EXACTLY AS IT IS, pixel for pixel: the camera, the crop, the EMPTY left leather club "
    "chair, the marble slab and its edge, the panelled bar front, the window and the street beyond it, the "
    "mirrored window lettering, the second chair, the light and every hatching line of the room. The room is "
    "EMPTY: no person, no animal and no figure of any kind sits in either chair or stands anywhere in it. "
    "Nothing moves, nothing is added, nothing is taken away."
)

NEWLINE = chr(10)


# ------------------------------------------------------------- the prompt
def rules_block(mode: str, character: str) -> tuple[str, list[str]]:
    """The rules the finished picture obeys. Returns (text, missed)."""
    if mode == "none":
        return "", []
    fence = cs.local_fence((ROOT / "canon" / "MASTER-PROMPT.md").read_text(encoding="utf8"))
    paras = fence.split("\n\n")
    if mode == "full":
        body = fence.replace("[TV]", "BREAKING").replace("[BOARD]", "HAPPY HOUR 4-?")
        body = body.replace("[SCENE]", ADD_EDIT[character])
        return body, []
    missed: list[str] = []
    pen = next((p for p in paras if p.startswith("A single-panel gag cartoon")), "")
    if not pen:
        missed.append("the engraving paragraph (fence paragraph 1)")
    who = next((p for p in paras if p.startswith("DREW (frame-left)")), "")
    if not who:
        missed.append("the DREW/BARCLAY character paragraph")
        block = ""
    else:
        drew_part, sep, _ = who.partition(" BARCLAY (frame-right)")
        if not sep:
            missed.append("DREW/BARCLAY paragraph split on ' BARCLAY (frame-right)'")
        block = (drew_part if sep else who).strip()
        if character == "drew":
            block = block.replace("DREW (frame-left) is", "DREW is")
    return "\n\n".join(p for p in (pen, block) if p), missed


def build_prompt(character: str, edit: str, extra_edits: list[str], rules: str,
                 keep_first: bool, labels: list[str], clean: bool = False,
                 keep_edit: str = KEEP_EDIT) -> str:
    add = edit.strip() or ADD_EDIT[character]
    edits = [keep_edit, add] if keep_first else [add, keep_edit]
    edits += [e.strip() for e in extra_edits if e.strip()]
    head = (
        "MAKE THESE CHANGES TO PICTURE 1 AND KEEP EVERYTHING ELSE. The result is Picture 1 itself with "
        "EXACTLY ONE character added into it, one unbroken scene edge to edge, in the same engraved "
        "black-and-white pen."
    )
    if clean:
        edits = [CLEAN_EDIT]
        head = (
            "MAKE THESE CHANGES TO PICTURE 1 AND KEEP EVERYTHING ELSE. The result is Picture 1 itself with "
            "NOTHING added into it, one unbroken scene edge to edge, in the same engraved black-and-white pen."
        )
    roster = " ".join(f"Picture {i + 1} is {lab}." for i, lab in enumerate(labels))
    out = f"REFERENCES. {roster}\n\n" + head + "\n" + "\n".join(f"{i + 1}. {e}" for i, e in enumerate(edits))
    if rules:
        out += "\n\nTHE RULES THE FINISHED PICTURE OBEYS:\n\n" + rules
    return out


# ------------------------------------------------------- THE FLAT FIELD (route A)
def flat_field(base: np.ndarray, box: tuple[int, int, int, int], character: str,
               grey: float = 140.0) -> tuple[np.ndarray, dict]:
    """Picture 1 for --route A: the plate crop with everything except the left
    chair, the marble counter top and the wall's silhouette lines flattened to a
    featureless mid-grey.

    WHY. The first launch handed the model the whole room and asked it to change
    one thing; the bridge samples from noise at denoise 1.0 (see the note at the
    top of this file), so it re-inked all of it and 71-87% of the crop came back
    "changed". A key against that is meaningless. Here the model is given only
    what it needs in order to SEAT him - the real chair, at the real size, in the
    real pen, with the marble he rests a hand on and a wireframe of the wall
    behind - and everything it might otherwise re-ink is simply not there. What
    comes back that is not flat grey is the bird.

    Returns (field, info); `base` is the plate crop as float, `box` its place in
    the plate."""
    x0, y0, x1, y1 = box
    h, w = base.shape

    # 1. THE MARBLE, found rather than traced: the largest bright blob in the
    #    slab's rows, column-filled into a solid quadrilateral, then grown so the
    #    dark lines of its near and far edges come with it.
    bright = ndimage.binary_opening(base > FIELD_MARBLE_BRIGHT, np.ones((3, 3)), iterations=2)
    band = np.zeros(base.shape, bool)
    band[max(0, FIELD_MARBLE_ROWS[0] - y0):max(0, FIELD_MARBLE_ROWS[1] - y0), :] = True
    lab, n = ndimage.label(bright & band)
    marble = np.zeros(base.shape, bool)
    if n:
        areas = ndimage.sum(bright & band, lab, range(1, n + 1))
        marble = lab == (int(np.argmax(areas)) + 1)
        # The blob's own outline staircases wherever a vein or a shadow crosses the
        # slab. Take its top and bottom edge per column, interpolate the columns it
        # missed, median-smooth both curves, and fill between them: a clean slab
        # with two straight lips instead of a comb.
        cols = np.where(marble.any(axis=0))[0]
        if cols.size:
            top = np.full(w, np.nan)
            bot = np.full(w, np.nan)
            for c in cols:
                rows = np.where(marble[:, c])[0]
                top[c], bot[c] = rows.min(), rows.max()
            xs = np.arange(w)
            lo, hi = int(cols.min()), int(cols.max())
            for cur in (top, bot):
                good = ~np.isnan(cur)
                cur[lo:hi + 1] = np.interp(xs[lo:hi + 1], xs[good], cur[good])
            top = ndimage.median_filter(np.nan_to_num(top), size=41)
            bot = ndimage.median_filter(np.nan_to_num(bot), size=41)
            marble = np.zeros(base.shape, bool)
            for c in range(lo, hi + 1):
                marble[int(round(top[c])):int(round(bot[c])) + 1, c] = True
        marble = ndimage.binary_dilation(marble, np.ones((3, 3)), iterations=6)

    # 2. THE CHAIR: the traced polygon, in crop coordinates.
    poly = [(px - x0, py - y0) for px, py in FIELD_CHAIR_POLY[character]]
    pm = Image.new("L", (w, h), 0)
    ImageDraw.Draw(pm).polygon(poly, fill=255)
    chair = np.asarray(pm) > 0

    # 3. THE WALL'S SILHOUETTE LINES: gradient of the crop blurred past its own
    #    hatching, top 4% kept. Structure survives, engraving does not.
    g = ndimage.gaussian_filter(base, FIELD_LINE_SIGMA)
    gy, gx = np.gradient(g)
    mag = np.hypot(gx, gy)
    lines = ndimage.binary_closing(mag > float(np.percentile(mag, FIELD_LINE_PCT)), np.ones((3, 3)))
    # Keep only LONG structure. Short specks are the street's people, the barrow
    # and the ghosts of the mirrored lettering, and leaving those on the grey
    # invites the model to finish drawing them.
    llab, ln = ndimage.label(lines, ndimage.generate_binary_structure(2, 2))
    if ln:
        objs = ndimage.find_objects(llab)
        long_ids = [i + 1 for i, sl in enumerate(objs)
                    if max(sl[0].stop - sl[0].start, sl[1].stop - sl[1].start) >= FIELD_LINE_MINLEN]
        lines = np.isin(llab, long_ids)

    field = np.full(base.shape, float(grey))
    field[lines] = float(FIELD_LINE_INK)
    keep = marble | chair
    field[keep] = base[keep]
    info = {"grey": grey, "chair_fraction": round(float(chair.mean()), 4),
            "marble_fraction": round(float(marble.mean()), 4),
            "line_fraction": round(float(lines.mean()), 4),
            "flat_fraction": round(float((~(keep | lines)).mean()), 4),
            "chair_poly_plate": [list(pt) for pt in FIELD_CHAIR_POLY[character]],
            "marble_rows_plate": list(FIELD_MARBLE_ROWS),
            "line_sigma": FIELD_LINE_SIGMA, "line_pct": FIELD_LINE_PCT}
    return field, info


def border_alpha(shape: tuple[int, int], feather: int) -> np.ndarray:
    """Route B's only 'key': the whole crop, opaque, with a `feather` px ramp
    round the four edges so the pasted rectangle has no hard border."""
    h, w = shape
    a = np.ones((h, w), np.float64)
    f = max(0, int(feather))
    if f:
        ramp = (np.arange(f) + 0.5) / f
        for i, v in enumerate(ramp):
            a[i, :] = np.minimum(a[i, :], v)
            a[h - 1 - i, :] = np.minimum(a[h - 1 - i, :], v)
            a[:, i] = np.minimum(a[:, i], v)
            a[:, w - 1 - i] = np.minimum(a[:, w - 1 - i], v)
    return (a * 255).round().astype(np.uint8)


# ------------------------------------------------------------ the key
def _blur(a: np.ndarray, sigma: float) -> np.ndarray:
    return ndimage.gaussian_filter(a, sigma) if sigma > 0 else a


def best_shift(res: np.ndarray, base: np.ndarray, radius: int) -> tuple[int, int]:
    """Integer (dy, dx) that best lands the model's redraw back on the plate crop.
    The bridge resamples 4:5 twice on the way out; a pixel or two of drift makes
    every hatching line look like a change."""
    if radius <= 0:
        return 0, 0
    a, b = _blur(res, 1.5), _blur(base, 1.5)
    best, bestv = (0, 0), None
    h, w = a.shape
    for dy in range(-radius, radius + 1):
        for dx in range(-radius, radius + 1):
            ay0, ay1 = max(0, -dy), h - max(0, dy)
            ax0, ax1 = max(0, -dx), w - max(0, dx)
            by0, by1 = max(0, dy), h - max(0, -dy)
            bx0, bx1 = max(0, dx), w - max(0, -dx)
            v = float(np.abs(a[ay0:ay1:2, ax0:ax1:2] - b[by0:by1:2, bx0:bx1:2]).mean())
            if bestv is None or v < bestv:
                best, bestv = (dy, dx), v
    return best


def tone_match(res: np.ndarray, base: np.ndarray, mode: str = "trim") -> tuple[np.ndarray, float, float]:
    """Put `res` into `base`'s grey levels.

    mode "trim" fits base ~= a*res + b on the pixels that AGREE (iteratively
    trimmed) — right when most of the two pictures really is the same picture,
    i.e. against the CLEAN TWIN. Used against the plate it collapses: the model
    re-inks the whole crop in a lighter pen, most pixels disagree, and the trim
    chases the disagreement (seed 41 fitted gain 0.371).

    mode "pct" maps the 2nd and 98th percentiles onto each other and clamps the
    gain — no assumption that anything matches, which is the honest assumption
    when the room has been re-inked. This is the fit used for the pixels that
    actually get composited onto the approved plate."""
    if mode == "pct":
        rl, rh = np.percentile(res, (2, 98))
        bl, bh = np.percentile(base, (2, 98))
        a = 1.0 if rh - rl < 1e-6 else float(np.clip((bh - bl) / (rh - rl), 0.5, 2.0))
        b = float(bl - a * rl)
        return np.clip(a * res + b, 0, 255), a, b
    x = res[::3, ::3].ravel().astype(np.float64)
    y = base[::3, ::3].ravel().astype(np.float64)
    keep = np.ones(x.shape, bool)
    a, b = 1.0, 0.0
    for _ in range(4):
        if keep.sum() < 100:
            break
        a, b = np.polyfit(x[keep], y[keep], 1)
        r = np.abs(a * x + b - y)
        s = float(np.median(r)) * 1.4826 + 1e-6
        keep = r < 2.5 * s
    return np.clip(a * res + b, 0, 255), float(a), float(b)


def disk_iter(mask: np.ndarray, op, iters: int) -> np.ndarray:
    if iters <= 0:
        return mask
    st = ndimage.generate_binary_structure(2, 2)
    return op(mask, structure=st, iterations=iters)


def cut_sticker(res: np.ndarray, base: np.ndarray, seat: tuple[int, int, int, int],
                thresh: float, blur: float, close_it: int, open_it: int,
                min_area: int, gap: int, roi: np.ndarray | None = None) -> tuple[np.ndarray, dict]:
    """|result - picture1| > threshold, closed then opened, the largest blob that
    touches the chair kept, plus anything within `gap` of it (a head separated
    from a neck by one thin light row is still the same bird)."""
    d = np.abs(_blur(res, blur) - _blur(base, blur))
    raw = d > thresh
    m = disk_iter(raw, ndimage.binary_closing, close_it)
    m = disk_iter(m, ndimage.binary_opening, open_it)
    if roi is not None:
        m &= roi
    lab, n = ndimage.label(m)
    info = {"blobs": int(n), "raw_fraction": float(raw.mean())}
    if n == 0:
        return np.zeros(base.shape, bool), {**info, "kept": 0, "kept_px": 0}
    areas = ndimage.sum(m, lab, range(1, n + 1))
    x0, y0, x1, y1 = seat
    seat_mask = np.zeros(base.shape, bool)
    seat_mask[max(0, y0):max(0, y1), max(0, x0):max(0, x1)] = True
    touching = [i for i in range(1, n + 1) if (seat_mask & (lab == i)).any() and areas[i - 1] >= min_area]
    if not touching:                                  # nothing in the chair: keep the biggest anyway,
        touching = [int(np.argmax(areas)) + 1]        # and let the sidecar say the seat was missed
        info["seat_touched"] = False
    else:
        info["seat_touched"] = True
    keep = {max(touching, key=lambda i: areas[i - 1])}
    for _ in range(6):                                # re-attach near neighbours
        cur = np.isin(lab, list(keep))
        grown = disk_iter(cur, ndimage.binary_dilation, max(1, gap))
        if roi is not None:
            grown &= roi
        add = {i for i in range(1, n + 1)
               if i not in keep and areas[i - 1] >= min_area and (grown & (lab == i)).any()}
        if not add:
            break
        keep |= add
    sticker = np.isin(lab, list(keep))
    return sticker, {**info, "kept": len(keep), "kept_px": int(sticker.sum())}


def feather(mask: np.ndarray, radius: float) -> np.ndarray:
    if radius <= 0:
        return (mask * 255).astype(np.uint8)
    im = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius))
    return np.asarray(im)


# ------------------------------------------------------------------- plumbing
def parse_box(text: str) -> tuple[int, int, int, int]:
    parts = [int(round(float(x))) for x in re.split(r"[,x ]+", text.strip()) if x != ""]
    if len(parts) != 4:
        raise SystemExit(f"wants X0,Y0,X1,Y1 - got {text!r}")
    return tuple(parts)  # type: ignore[return-value]


def next_round(character: str) -> Path:
    base = SCRATCH / character
    n = 1
    while (base / f"round-{n}").exists():
        n += 1
    return base / f"round-{n}"


def main() -> None:
    ap = argparse.ArgumentParser(description="Place one character into the approved room and cut him out.")
    ap.add_argument("--character", default="drew", choices=sorted(DEFAULT_BOX))
    ap.add_argument("--seed", type=int, required=True)
    ap.add_argument("--box", default="", help="X0,Y0,X1,Y1 in the plate's pixels, 4:5 (default: the left chair)")
    ap.add_argument("--edit", default="", help="replace EDIT 1, the ADD sentence, for this round")
    ap.add_argument("--extra-edit", action="append", default=[], help="one more numbered EDIT (repeatable)")
    ap.add_argument("--plate", default=str(PLATE))
    ap.add_argument("--portrait", default="", help="use THIS file as Picture 2")
    ap.add_argument("--route", default="A", choices=("A", "B", "legacy"),
                    help="A = flat-field Picture 1 + difference key onto the real plate; "
                         "B = the plate crop as Picture 1 and the whole render pasted back with a "
                         "feathered border; legacy = the first launch's plate-keyed behaviour")
    ap.add_argument("--flat-grey", type=float, default=140.0,
                    help="route A: the grey everything but the chair, the marble and the wall lines becomes")
    ap.add_argument("--paste-feather", type=int, default=12,
                    help="route B: the feathered border, in plate pixels, on the pasted crop")
    ap.add_argument("--staging", default="", help="use THIS file as Picture 3 (default: duo-behind.png)")
    ap.add_argument("--no-staging", action="store_true", help="send only two references")
    ap.add_argument("--staging-label", default="",
                    help="replace PICTURE3_LABEL (use with a --staging crop that is no longer the duo)")
    ap.add_argument("--flat-reject-tol", type=float, default=10.0,
                    help="route A only: a rendered pixel this close to the flat grey AND sitting in a "
                         "featureless neighbourhood cannot enter the sticker - it is the model DELETING "
                         "set, not adding a bird (0 = off)")
    ap.add_argument("--pose-name", default="seated-left", help="names the sticker: drew-<pose>-s<seed>.png")
    ap.add_argument("--seat", default="", help="X0,Y0,X1,Y1 in plate pixels - a blob must touch this to be him")
    ap.add_argument("--roi", default="", help="X0,Y0,X1,Y1 in plate pixels - the sticker may not leave this "
                                              "envelope (default: the pose's own mask box plus a margin)")
    ap.add_argument("--no-roi", action="store_true", help="let the key take the whole box (it will take the room)")
    ap.add_argument("--rules", default="pen", choices=("pen", "full", "none"))
    ap.add_argument("--keep-first", action="store_true",
                    help="put 'keep everything else' FIRST in the numbered edits")
    ap.add_argument("--rolls", type=int, default=1, help="seed, seed+1, ... in one run")
    ap.add_argument("--full", action="store_true", help="40-step cfg 4 instead of the Lightning 8-step pass")
    ap.add_argument("--tag", default="")
    ap.add_argument("--server", default=cs.SERVER)
    ap.add_argument("--out", default="")
    ap.add_argument("--dry-run", action="store_true")
    # the key
    ap.add_argument("--thresh", type=float, default=18.0, help="key threshold in grey levels")
    ap.add_argument("--measure-thresh", type=float, default=12.0, help="cleanliness threshold in grey levels")
    ap.add_argument("--key-blur", type=float, default=1.5, help="blur before differencing (kills hatching jitter)")
    ap.add_argument("--close", type=int, default=4)
    ap.add_argument("--open", type=int, default=3)
    ap.add_argument("--min-area", type=int, default=400)
    ap.add_argument("--gap", type=int, default=8, help="a blob this close to the figure is part of him")
    ap.add_argument("--feather", type=float, default=2.0)
    ap.add_argument("--align", type=int, default=6, help="max integer pixel drift corrected before keying (0 = off)")
    ap.add_argument("--rekey", default="", help="skip drawing: re-key THIS finished result PNG")
    ap.add_argument("--clean-twin", default="", help="with --rekey: the clean twin PNG to key against")
    ap.add_argument("--clean-pass", action="store_true",
                    help="draw the SAME seed twice, once without the bird, and key against that twin "
                         "instead of against the plate (the model re-inks the room, so the plate is a "
                         "poor key reference)")
    a = ap.parse_args()

    who = a.character
    box = parse_box(a.box) if a.box else DEFAULT_BOX[who]
    x0, y0, x1, y1 = box
    bw, bh = x1 - x0, y1 - y0
    if bw <= 0 or bh <= 0:
        raise SystemExit(f"--box is empty: {box}")
    if abs(bw / bh - 0.8) > 0.02:
        print(f"[shape] box {bw}x{bh} is {bw / bh:.3f}, not the house 4:5 (0.800) - the bridge will squash it.")
    seat = parse_box(a.seat) if a.seat else DEFAULT_SEAT[who]
    seat_local = (seat[0] - x0, seat[1] - y0, seat[2] - x0, seat[3] - y0)
    roi = None if a.no_roi else (parse_box(a.roi) if a.roi else DEFAULT_ROI[who])

    plate = Image.open(a.plate).convert("L")
    crop = plate.crop(box)
    base = np.asarray(crop).astype(np.float64)

    out = Path(a.out) if a.out else next_round(who)
    out.mkdir(parents=True, exist_ok=True)
    FIGURES.mkdir(parents=True, exist_ok=True)

    # PICTURE 1: route A flattens the crop to the set; B and legacy send it whole.
    # Either way it is upscaled to the shape the bridge will draw at.
    field, field_info = (None, None)
    if a.route == "A":
        field, field_info = flat_field(base, box, who, a.flat_grey)
        p1_img = Image.fromarray(np.clip(field, 0, 255).astype(np.uint8))
        p1_img.save(out / "flat-field.png")
    else:
        p1_img = crop
    p1_path = out / "picture1.png"
    p1_img.resize(WORK, Image.LANCZOS).save(p1_path)
    p2_path = Path(a.portrait) if a.portrait else ROOT / PORTRAIT[who]
    p3_path = None if a.no_staging else (Path(a.staging) if a.staging else ROOT / STAGING)

    rules, missed = rules_block(a.rules, who)
    if missed:
        print("[canon drift] not found in the LOCAL fence, so it did not reach the prompt:")
        for m in missed:
            print("   -", m)
    p1_label = PICTURE1_LABEL_FLAT if a.route == "A" else PICTURE1_LABEL
    keep_edit = KEEP_EDIT_FLAT if a.route == "A" else KEEP_EDIT
    p3_label = a.staging_label.strip() or PICTURE3_LABEL
    labels = [p1_label, PICTURE2_LABEL[who]] + ([p3_label] if p3_path else [])
    prompt = build_prompt(who, a.edit, a.extra_edit, rules, a.keep_first, labels, keep_edit=keep_edit)
    clean_rules, _ = rules_block("pen" if a.rules != "none" else "none", who)
    # the engraving paragraph ONLY - DREW's canon paragraph would draw him into the twin
    clean_rules = clean_rules.split(NEWLINE + NEWLINE)[0] if clean_rules else ""
    clean_labels = [p1_label, "THE SAME EMPTY ROOM AGAIN, the identical picture, for reference"]
    sidecar_staging_label = p3_label if p3_path else None
    clean_prompt = build_prompt(who, a.edit, a.extra_edit, clean_rules, a.keep_first, clean_labels,
                                clean=True, keep_edit=keep_edit)

    ref_paths = [p1_path, p2_path] + ([p3_path] if p3_path else [])
    images, refmeta = [], []
    for pic, (path, label) in enumerate(zip(ref_paths, labels), start=1):
        uri, info = cs.prepare_reference(path, None)
        images.append(uri)
        refmeta.append({"picture": pic, "path": str(path), "label": label, **info})

    for i in range(max(1, a.rolls)):
        seed = a.seed + i
        name = f"{who}-{a.pose_name}-r{a.route}-s{seed}" if a.route != "legacy" \
            else f"{who}-{a.pose_name}-s{seed}"
        tag = a.tag or f"place-{who}"
        req = cs.build_request(prompt, images, seed, not a.full, tag, "")
        (out / f"{name}.prompt.txt").write_text(prompt, encoding="utf8")
        sidecar: dict = {
            "generated_at": dt.datetime.now().isoformat(timespec="seconds"),
            "script": "scripts/cast-place.py",
            "character": who,
            "pose": a.pose_name,
            "route": a.route,
            "flat_field": field_info,
            "paste_feather": a.paste_feather if a.route == "B" else None,
            "staging_reference": str(p3_path) if p3_path else None,
            "staging_label": sidecar_staging_label,
            "staging_label_overridden": bool(a.staging_label.strip()),
            "plate": str(a.plate),
            "box": list(box),
            "box_size": [bw, bh],
            "seat_region": list(seat),
            "roi": list(roi) if roi else None,
            "seed": seed,
            "rules_mode": a.rules,
            "keep_first": a.keep_first,
            "edit_override": a.edit or None,
            "extra_edit": a.extra_edit or None,
            "canon_missed": missed,
            "server": a.server,
            "request": {**req, "input_images": f"<{len(images)} data URIs - see references>"},
            "references": refmeta,
            "prompt": prompt,
            "clean_prompt": clean_prompt if a.clean_pass else None,
            "clean_pass": a.clean_pass,
            "expected_size": list(WORK),
            "key": {"thresh": a.thresh, "measure_thresh": a.measure_thresh, "blur": a.key_blur,
                    "close": a.close, "open": a.open, "min_area": a.min_area, "gap": a.gap,
                    "feather": a.feather, "align": a.align},
        }
        if a.dry_run:
            (out / f"{name}.json").write_text(json.dumps(sidecar, indent=2, ensure_ascii=False), encoding="utf8")
            print(f"[dry run] {out / (name + '.json')}")
            continue

        def draw(request: dict, label: str) -> tuple[Image.Image | None, float, dict]:
            t0 = time.time()
            r = cs.post(request, a.server)
            if not r.get("success"):
                return None, 0.0, {"error": r.get("error")}
            im = cs.finish(cs.fetch(r["image_url"], a.server))
            el = round(time.time() - t0, 1)
            im.save(out / f"{name}{label}-raw.png")
            return im, el, {"seed_used": r.get("seed_used"), "elapsed_seconds": el,
                            "server_local_path": r.get("local_path"), "raw_size": list(im.size),
                            "raw": str(out / f"{name}{label}-raw.png")}

        twin = None
        if a.rekey:
            img = Image.open(a.rekey).convert("L")
            sidecar["rekeyed_from"] = a.rekey
            elapsed = 0.0
            if a.clean_twin:
                twin = Image.open(a.clean_twin).convert("L")
                sidecar["clean_twin_from"] = a.clean_twin
        else:
            img, elapsed, meta = draw(req, "")
            sidecar["result"] = meta
            if img is None:
                print(f"FAILED seed {seed}: {meta.get('error')}", file=sys.stderr)
                (out / f"{name}.json").write_text(json.dumps(sidecar, indent=2, ensure_ascii=False), encoding="utf8")
                continue
            if a.clean_pass and a.route == "legacy":
                # THE CLEAN TWIN: same seed, same Picture 1, the bird removed from
                # the edits AND from the references. Round 2 proved that a twin that
                # still carries Picture 2 and DREW's canon paragraph draws the bird
                # anyway (0.75 "clean") — the twin has to be blind to him. The model
                # re-inks the room the same way in both, so the difference between
                # the two renders is the bird and not the pen.
                # Picture 1 TWICE, not once: a one-reference request to the bridge
                # hung past the 20-minute client timeout on 2026-09-08, and two
                # references keep the graph the same shape as the bird's own run.
                creq = cs.build_request(clean_prompt, [images[0], images[0]], seed, not a.full, tag + "-clean", "")
                (out / f"{name}-clean.prompt.txt").write_text(clean_prompt, encoding="utf8")
                twin, tel, tmeta = draw(creq, "-clean")
                sidecar["clean_twin"] = tmeta
                elapsed = round(elapsed + tel, 1)
                if twin is None:
                    print(f"[clean twin failed] {tmeta.get('error')} - keying against the plate instead",
                          file=sys.stderr)

        # ---- back onto the plate's own grid, tone and alignment
        small = np.asarray(img.resize((bw, bh), Image.LANCZOS).convert("L")).astype(np.float64)
        roi_mask = None
        if roi is not None:
            roi_mask = np.zeros(base.shape, bool)
            roi_mask[max(0, roi[1] - y0):max(0, roi[3] - y0), max(0, roi[0] - x0):max(0, roi[2] - x0)] = True

        if a.route == "B":
            # ROUTE B - NO KEY. The whole rendered crop is put into the plate's own
            # grey levels, slid back onto the plate's grid and pasted with a
            # feathered border. The model keeps the room's LOOK, so the figure is
            # never cut out and never has an edge; the price is that the plate's
            # own lines inside the box are gone, replaced by the model's re-inking
            # of them. The only join to judge is the border ring.
            ref_name, fit = "none (whole crop pasted)", "pct"
            matched, ga, gb = tone_match(small, base, "pct")
            dy, dx = best_shift(matched, base, a.align)
            if (dy, dx) != (0, 0):
                matched = ndimage.shift(matched, (-dy, -dx), order=1, mode="nearest")
            keyed, ka, kb = matched, ga, gb
            alpha = border_alpha(base.shape, a.paste_feather)
            keyinfo = {"blobs": 0, "raw_fraction": 1.0, "seat_touched": None, "kept": 1,
                       "kept_px": int((alpha > 0).sum())}
            outside = alpha == 0                       # empty: nothing of the plate survives in the box
            changed = np.abs(matched - base) > a.measure_thresh
            cleanliness = float(changed.mean())        # here it reads "how much of the room was re-inked"
            room_drift = cleanliness
        else:
            if a.route == "A":
                # ROUTE A - the key reference is the FLAT FIELD that was SENT as
                # Picture 1, never the room. "trim" is the honest fit here because
                # most of the two pictures really is the same picture (flat grey),
                # which was exactly what was false against the plate; if the model
                # ignored EDIT 2 and invented a room in the grey the fitted gain
                # runs away, and the guard below catches it and says so.
                ref, ref_name, fit = field, "flat-field", "trim"
            elif twin is not None:
                ref = np.asarray(twin.resize((bw, bh), Image.LANCZOS).convert("L")).astype(np.float64)
                ref_name, fit = "clean-twin", "trim"
            else:
                ref, ref_name, fit = base, "plate-crop", "pct"
            keyed, ka, kb = tone_match(small, ref, fit)
            if fit == "trim" and not (0.6 <= ka <= 1.6):
                keyed, ka, kb = tone_match(small, ref, "pct")
                fit = "pct (trim gain %.3f out of range - the field was not kept flat)" % ka
            dy, dx = best_shift(keyed, ref, a.align)
            if (dy, dx) != (0, 0):
                keyed = ndimage.shift(keyed, (-dy, -dx), order=1, mode="nearest")
            # ---- THE FLAT-GREY GUARD (route A). The bake-off's stickers each came
            #      back carrying a slab of featureless grey: wherever the model MOVED
            #      the marble or the chair, the field had ink and the render had blank
            #      paper, the difference key called that "changed", and a grey
            #      rectangle was laid onto the approved plate. But Drew is engraved -
            #      no part of him is flat mid-grey. So a rendered pixel that is within
            #      --flat-reject-tol of the field's grey AND sits in a featureless
            #      neighbourhood is the model DELETING set, never the bird, and it may
            #      not enter the sticker.
            flat_guard = None
            if a.route == "A" and a.flat_reject_tol > 0:
                g = float(a.flat_grey)
                m1 = ndimage.uniform_filter(keyed, 9)
                m2 = ndimage.uniform_filter(keyed * keyed, 9)
                local_std = np.sqrt(np.clip(m2 - m1 * m1, 0.0, None))
                flat = (np.abs(keyed - g) <= a.flat_reject_tol) & (local_std <= 3.0)
                flat = disk_iter(flat, ndimage.binary_opening, 2)
                flat = disk_iter(flat, ndimage.binary_dilation, 1)
                flat_guard = {"flat_grey": g, "tol": a.flat_reject_tol,
                              "rejected_px": int(flat.sum()),
                              "rejected_fraction": round(float(flat.mean()), 4)}
                roi_mask = (~flat) if roi_mask is None else (roi_mask & ~flat)
            sticker_mask, keyinfo = cut_sticker(keyed, ref, seat_local, a.thresh, a.key_blur,
                                                a.close, a.open, a.min_area, a.gap, roi_mask)
            if flat_guard is not None:
                keyinfo = {**keyinfo, "flat_guard": flat_guard}
            alpha = feather(sticker_mask, a.feather)

            # ---- cleanliness: what the model changed OUTSIDE the sticker
            outside = alpha == 0
            n_out = int(outside.sum())
            changed = np.abs(keyed - ref) > a.measure_thresh
            cleanliness = float((changed & outside).sum() / n_out) if n_out else 0.0

            # ---- the pixels that get composited, in the PLATE's levels. On route A
            #      the field's chair and marble ARE the plate's pixels, so the key
            #      fit already put the bird in the plate's levels.
            if a.route == "A":
                matched, ga, gb = keyed, ka, kb
            else:
                matched, ga, gb = tone_match(small, base, "pct")
                if (dy, dx) != (0, 0):
                    matched = ndimage.shift(matched, (-dy, -dx), order=1, mode="nearest")
            room_changed = np.abs(matched - base) > a.measure_thresh
            room_drift = float((room_changed & outside).sum() / n_out) if n_out else 0.0

        # ---- THE JOIN, in grey levels: how hard the pasted pixels land on the
        #      approved plate along the feathered seam. Route A's seam is the ramp
        #      round the bird; route B's is the ramp round the whole crop. Same
        #      number, so the two routes can be compared on it.
        af = alpha.astype(np.float64) / 255.0
        comp = matched * af + base * (1.0 - af)
        seam = (alpha > 0) & (alpha < 255)
        join_mean = float(np.abs(comp - base)[seam].mean()) if seam.any() else 0.0

        rgb = np.repeat(np.clip(matched, 0, 255).astype(np.uint8)[:, :, None], 3, axis=2)
        sticker = Image.fromarray(np.dstack([rgb, alpha]))
        sticker_path = FIGURES / f"{name}.png"
        sticker.save(sticker_path)

        laid = plate.convert("RGB")
        laid.paste(sticker.convert("RGB"), (x0, y0), sticker)
        laid_path = FIGURES / f"{name}-laid.png"
        laid.save(laid_path)

        ys, xs = np.where(alpha > 0)
        if xs.size:
            cx0, cy0 = x0 + int(xs.min()) - 40, y0 + int(ys.min()) - 40
            cx1, cy1 = x0 + int(xs.max()) + 40, y0 + int(ys.max()) + 40
            cbox = (max(0, cx0), max(0, cy0), min(laid.width, cx1), min(laid.height, cy1))
            fig = laid.crop(cbox)
            fig = fig.resize((fig.width * 2, fig.height * 2), Image.LANCZOS)
            crop_path = FIGURES / f"{name}-crop2x.png"
            fig.save(crop_path)
        else:
            crop_path, cbox = None, None

        sidecar["key_result"] = {
            "route": a.route,
            "keyed_against": ref_name,
            "tone_fit": fit,
            "join_mean_abs_levels": round(join_mean, 2),
            "join_seam_px": int(seam.sum()),
            "plate_fraction_replaced": round(float((alpha > 0).sum() / (plate.width * plate.height)), 4),
            "key_tone_gain": round(ka, 4), "key_tone_offset": round(kb, 2),
            "composite_tone_gain": round(ga, 4), "composite_tone_offset": round(gb, 2),
            "shift_applied": [int(dy), int(dx)],
            **keyinfo,
            "sticker_px": int((alpha > 0).sum()),
            "sticker_fraction_of_box": round(float((alpha > 0).mean()), 4),
            "sticker_bbox_plate": list(cbox) if cbox else None,
            "cleanliness_outside_sticker_gt%g" % a.measure_thresh: round(cleanliness, 4),
            "room_drift_vs_plate_outside_sticker": round(room_drift, 4),
            "changed_fraction_whole_box": round(float(changed.mean()), 4),
        }
        sidecar["outputs"] = {"sticker": str(sticker_path), "laid": str(laid_path),
                              "crop2x": str(crop_path) if crop_path else None,
                              "picture1": str(p1_path)}
        (out / f"{name}.json").write_text(json.dumps(sidecar, indent=2, ensure_ascii=False), encoding="utf8")
        (sticker_path.with_suffix(".json")).write_text(
            json.dumps(sidecar, indent=2, ensure_ascii=False), encoding="utf8")
        if cleanliness > 0.30:
            print(f"[dirty key] the model changed {cleanliness:.0%} of everything outside the sticker - "
                  "it re-inked the room. Only the sticker may be kept; the laid preview is the APPROVED "
                  "plate plus that sticker, which is the point.")
        print(f"{sticker_path}  sticker {keyinfo['kept_px']}px in {keyinfo['blobs']} blobs, "
              f"seat_touched={keyinfo.get('seat_touched')}, keyed against {ref_name}, "
              f"cleanliness {cleanliness:.4f}, room drift vs plate {room_drift:.4f}, {elapsed}s")
        print(f"  laid   {laid_path}")
        if crop_path:
            print(f"  crop2x {crop_path}")


if __name__ == "__main__":
    main()
