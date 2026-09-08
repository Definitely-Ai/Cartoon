"""PLACE ONE CHARACTER INTO THE APPROVED ROOM, and cut him out again as a sticker.

    python scripts/cast-place.py --character drew|barclay|abby --seed 41 --route A|B|S
        [--box X0,Y0,X1,Y1] [--edit "..."] [--plate PATH] [--pose-name NAME]
        [--rolls N] [--thresh 18] [--out DIR] [--dry-run]
        [--under-lines/--no-under-lines] [--under-blend 0] [--fill/--no-fill]
        [--cut-by-blockin/--no-cut-by-blockin] [--under-remap LO,HI] [--sheet-grey 255]
        [--also PART=STICKER.PNG ...]   (route S only; see WHAT TEAM 4/5/6 ADDED below)

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

  --route S   THE STICKER ROUTE (2026-09-08). Both A and B still hand the model
              a picture of THE ROOM and ask it to add a figure at the model's own
              judgement of scale and seat - and every round proved it will not
              use OUR left chair for that judgement, however little of the room
              it is shown: it stages him at a side table of his own. Route S
              removes the judgement instead of shrinking the room: Picture 1 is a
              WHITE SHEET (255) carrying only the left chair's own rendered
              pixels (through masks/chair-left.png), one thin ink line for the
              marble's near top edge (a horizon, nothing more), and a very PALE
              under-drawing of the exact seated pose - the construction's own
              figure-drew-02-toward block-in (values/ and masks/), blended
              --under-blend (default 0.55) toward white. EDIT 1 asks the model to
              draw Drew EXACTLY FILLING that under-drawing - same size, same
              seat, same turn of the head - so the scale and the seat are no
              longer his to choose. The key is an absolute one, not a difference
              key: after the render is scaled back to the box, alpha is pixels
              darker than --white-thresh (232) after a 1px blur, inside
              dilate(figure mask, 24px), minus the chair's own mask, keeping only
              components that overlap the figure mask by more than 400px, 1.5px
              feather. The sticker is saved as RGBA exactly as route A saves one;
              the laid preview is built through room-part's own assemble()
              (imported as a module, never run as a command), with the render
              handed in as an override for the figure-drew-02-toward part - so
              the part's own parts.json rules (ring tone-match, feather, cast
              shadow) do the compositing, the same way room-part.py lays its own
              candidates.

Routes A and B get Picture 3 = canon/vision/studies/duo-behind.png, the staging
the founder scored highest, and EDIT 1 defaults to THE PINNED STAGING (see
ADD_EDIT): from behind and a little to his left, the knit across the shoulder
blades, the leather roll on the lower back, the neck in its S, the head turned
RIGHT to the other chair in profile with the lidded eye showing, the near hand on
the marble - never a front view. Route S's under-drawing already fixes the pose,
so it sends NO Picture 3 by default; --staging-solo adds one - the previous
team's flamingo-only crop of duo-behind.png, cast alone so no second character
leaks in with it.

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

WHAT ROUND 1 MEASURED (2026-09-08, route A, seeds 41 7 21 33 44 55, six renders)
--------------------------------------------------------------------------------
Round 1 changed exactly what the bake-off said to change - Picture 3 cropped to
the FLAMINGO ALONE (--staging with the left third of duo-behind.png, its label
rewritten by the new --staging-label), plus one extra numbered EDIT naming the
cast out loud - and nothing else about the route.

  THE FIX WORKED. The labrador is gone at all six seeds. It was in 4 of 4
  bake-off renders. Picture 3's CAST was being copied, and cropping it stopped
  that; no wording ever did.

  THE STAGING STILL FAILS, IDENTICALLY, AT ALL SIX SEEDS. Drew comes back square
  to the camera or three-quarter FRONT - never from behind - on the FAR side of
  the marble in the barman's place, at roughly 1.6-2x the plate's scale, seated
  in a tufted wing chair the model invents while the plate's own studded club
  chair stays visibly EMPTY in the foreground.

  THE CAUSE IS THE FIELD, NOT THE WORDING. What survives the grey at this box is
  the chair's studded ROLL and nothing else of the chair - and a roll at the
  bottom of a crop reads as the near lip of a counter, which makes the marble a
  table with a FAR side to sit at. The chair has to be legible AS a chair (its
  back, or a drawn silhouette guide) before "seated IN it" can mean anything.

  PICTURE 3 STILL LEAKS ITS ROOM. The crop is a crop of the pub, so the BIRDIE
  BOURBON bottles, the panelling and the mirrored lettering turn up in seeds 21,
  44 and 55. Round 2's Picture 3 should be the bird cut out on blank paper.

  THE FLAT FIELD WAS NOT KEPT FLAT at any seed (0.88-0.95 of the box changed;
  seed 41 scribbled the ground, seed 7 blew it white). The bake-off's one real
  win did not survive this prompt, so the difference key returned a box-filling
  slab (0.42-0.55 of the box) instead of an outline round the bird.

                 join levels   plate replaced   sticker frac   field kept
    seed 41         49.87          13.09%          0.5523        0.916
    seed  7         60.65          10.05%          0.4239        0.948
    seed 21         58.49          12.99%          0.5481        0.933
    seed 33         44.17          13.01%          0.5490        0.905
    seed 44         54.25          12.92%          0.5449        0.881
    seed 55         45.30          12.98%          0.5476        0.924

  BEST SEED 7: the only one that reads as Drew at 2x - bill, lidded eye, collar
  band, bow tie, V-neck knit, feathered hand on the martini - and the least
  destructive of the six.

  THE KEY GUARD ADDED THIS ROUND (--flat-std, --flat-reject-tol). A featureless
  neighbourhood is never engraved feather, knit or leather, so it may not enter
  the sticker. It was written first as a flat-GREY test and measured inert
  (0 px rejected at seeds 41 and 7, because neither render left the ground near
  140), then generalised to blank paper at ANY tone, which rejects 6-31%. It
  does not rescue a render that re-inked the whole field; it only stops a slab
  of blank paper being laid onto the approved plate.

WHAT TEAM 4 ADDED (2026-09-08). Team Drew 3's sixteen renders (reports/2026-09-08
entries 040-059) proved route S right on the seat, the pose and the scale, with
two things still wrong: the white bird's own paper interior fell OUT of the
absolute key (a lattice of ink with the room showing through it), and the
under-drawing's HEAD was invisible to the model at any --under-blend - a white
bird's block-in head is ~245 grey, so every seed came back a goose, a stork or a
folded ribbon instead of Drew. This round fixes both, and extends route S to
Barclay and Abby:

  * --under-lines (default ON; --no-under-lines off). The under-drawing is now a
    PENCIL LINE DRAWING of the block-in, not just a pale tone fill: the figure
    mask's own outline plus the internal tone edges of the values image (a
    Sobel gradient magnitude, thresholded, thinned to about 2px with a
    morphological skeleton) drawn at grey 150 on top of the tone fill
    (--under-blend, default lowered 0.55 -> 0.30 now that the lines carry the
    shape). The head, the eye and the bill/muzzle/ears are lines now, not a
    guess from a faint grey shift - see under_drawing_lines().
  * Hole-filled key (default ON; --no-fill off). binary_closing(3) then
    binary_fill_holes on the kept components, before the 1.5px feather - already
    in the key, now switchable.
  * EACH CHARACTER'S EDIT 1 now names the under-drawing's head in words too
    (HEAD_SENTENCE), on top of --under-lines making it visible: what its parts
    are, and that it is drawn solid and joined to the neck, never redrawn as
    something else.
  * BARCLAY and ABBY join Drew on route S (DEFAULT_BOX/SEAT/ROI, PORTRAIT,
    STICKER_FIGURE_PART/MASK/VALUES, STICKER_OCCLUDER_MASK, per-character
    ADD_EDIT_STICKER/KEEP_EDIT_STICKER/PICTURE1_LABEL_STICKER/PICTURE2_LABEL).
    Barclay sits in the RIGHT chair exactly as Drew sits in the left one;
    Abby has no chair and no seat box at all - she STANDS behind the marble
    ledge, occluded by the bar COUNTER (laid after her, exactly as a chair
    occludes a seated bird's lower body), with the marble LEDGE's near edge
    (not the counter's) traced as her one thin horizon line, and a blob counts
    as her by overlapping her own block-in mask by more than 300px (rather
    than touching a seat box she does not have - MIN_FIGURE_OVERLAP).
  * --also PART=STICKER.PNG (repeatable): lay another already-accepted
    character's sticker into the laid preview at ITS OWN part (through
    room-part's own assemble(), reading that sticker's own JSON sidecar for its
    box), so e.g. Barclay is judged against the plate with Drew already seated
    in it - see load_also_overrides().

WHAT TEAM 5 ADDED (2026-09-08). Team 4's --under-lines fixed the folded-ribbon
head but left it an open question how the block-in itself should show a WHITE
figure (a bird at ~245 grey) so it reads as solid on white paper at all, with
or without lines. Two more dials, both default OFF/255 so nothing already
working changes underneath them:

  * --under-remap LO,HI. Before --under-blend is applied, the block-in's own
    tones INSIDE the figure mask only are remapped linearly from [0,255] to
    [LO,HI] - so a white head (~245) becomes a pale grey figure that reads
    against the sheet, without touching the room, the chair or the marble
    line. Off by default (the block-in's own tones pass through unchanged).
  * --sheet-grey G. The sheet's own paper tone, instead of a fixed 255 - the
    field starts at G, the under-drawing blends toward G (not white), and the
    absolute key's ink test moves with it: a rendered pixel is ink when it is
    darker than G - (255 - --white-thresh), so --white-thresh keeps its old
    MEANING (how far below the sheet's own tone counts as ink) even when the
    sheet itself is no longer pure white. Default 255 (identical to before).

WHAT TEAM 6 ADDED (2026-09-08). Today's lab (reports/2026-09-08, entries
~070-085) settled the recipe that finally gets the model to draw the
portrait's head: the block-in REMAPPED into a mid-grey band, with NO pencil
lines and NO staging picture. Two changes make that the route S default, and
a third stops a render's furniture and glassware riding onto the sticker
alongside the figure it belongs to:

  * --under-remap 100,180 --under-blend 0 --no-under-lines are now route S's
    OWN defaults (previously --under-remap was off and --under-lines defaulted
    ON) - pass --under-lines or a different --under-remap/--under-blend to go
    back to the earlier recipe for comparison. Picture 3 stays off by default
    for route S regardless (--staging-solo still adds it), unchanged from
    Team 4/5.
  * --cut-by-blockin (default ON; --no-cut-by-blockin to disable). The lab's
    remaining fault was a sticker that carried the marble slab, a martini and
    the chair rail because it was cut by the occluder's OWN mask only - the
    candidate ink was otherwise confined merely to a generous 24px dilation of
    the figure's block-in mask before its blobs were labelled, wide enough
    that a blob touching the figure can still wander onto nearby set dressing.
    This adds one more, tighter word after the key and the hole fill: the kept
    alpha is ANDed against dilate(figure block-in mask, 12px) with the
    occluder's own mask excluded again at the same time, so nothing outside
    the figure's own silhouette (plus a 12px margin) can ride along, however
    it got kept upstream.
  * Per-character HEAD_SENTENCE (Team 4) is unchanged for Drew and Barclay;
    Abby's now names her own eye rule in words - white showing both sides of a
    drawn iris, a smaller round pupil, one catchlight, a lashed upper lid,
    closing in her warm closed-lip half-smile (canon/vision/studies/abby.txt)
    - on top of what the under-drawing already marks for her eyes.
  * POSE_NAME gives each character's own pose word (seated-left, seated-right,
    ledge) as --pose-name's default, so the output name
    <character>-<pose>-r<route>[-<tag>]-s<seed>.png no longer has to be told
    the pose by hand for Barclay or Abby.

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
from skimage.morphology import skeletonize   # --under-lines: thins the pencil line drawing (route S)

ROOT = Path(__file__).resolve().parent.parent           # Z:/ImageGenerator/Cartoon
SCRATCH = Path(
    "C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/"
    "7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-scene"
)
KIT = ROOT / "canon" / "room-kit" / "v2"
FIGURES = KIT / "figures"
PLATE = KIT / "plate.png"
STAGING_SOLO_CROP = SCRATCH / "drew" / "round-1" / "staging-flamingo.png"   # route S: --staging-solo

# --------------------------------------------------------- the house recipe
_spec = importlib.util.spec_from_file_location("cast_study", ROOT / "scripts" / "cast-study.py")
cs = importlib.util.module_from_spec(_spec)
assert _spec.loader is not None
_spec.loader.exec_module(cs)                            # main() is __main__-guarded

# --------------------------------------------------------- room-part, for route S
# Imported exactly the way cast-study is imported above - a module loaded from its
# file, never run as a command - so assemble() can be called directly. Its own
# main() is __main__-guarded, so this executes none of its subcommands; assemble()
# and manifest() only READ canon/room-kit/v2/parts.json, they never write it, and
# nothing here calls cmd_build or cmd_approve. NEVER run room-part.py as a script.
_spec_rp = importlib.util.spec_from_file_location("room_part", ROOT / "scripts" / "room-part.py")
rp = importlib.util.module_from_spec(_spec_rp)
assert _spec_rp.loader is not None
_spec_rp.loader.exec_module(rp)

WORK = (1344, 1680)                                     # what "4:5" resolves to on the bridge

# ------------------------------------------------------------- the geometry
#
# reports/2026-09-05/CAST-PLAN.md + scratchpad/cast/poses/poses.json, in the
# plate's own 1200x1800 pixels: Drew's crown lands near row 828 (clear of the
# mirrored DOOR ink, which ends about row 805), his shoulders near row 1122, and
# the left chair's studded roll top crosses him at about row 1270. His silhouette
# runs columns 182-634. The default box is the 4:5 window that holds all of that
# plus the chair below it: 640x800 from (20,700).
DEFAULT_BOX = {
    "drew": (20, 700, 660, 1500),
    # Team 4 (2026-09-08), route S only: Barclay in the RIGHT chair and Abby
    # behind the ledge. Both boxes are 4:5 (640x800, 480x600), same as Drew's.
    "barclay": (560, 700, 1200, 1500),
    "abby": (420, 620, 900, 1220),
}
# Where the figure must be sitting for a blob to count as him — the left chair,
# in plate pixels. A blob that touches nothing here is the model redecorating.
# Route S does not actually consult this box (see MIN_FIGURE_OVERLAP below,
# which is what a white-sheet render is tested against instead); it is kept
# for route A/legacy and for the sidecar's own record of "where he should be".
# Abby has no seat box at all — she stands, she does not sit in anything — so
# a blob counts for her by MIN_FIGURE_OVERLAP against her own block-in mask,
# exactly as it does for Drew and Barclay's route S render.
DEFAULT_SEAT = {
    "drew": (0, 1240, 520, 1800),
    "barclay": (620, 1240, 1200, 1800),
    "abby": None,
}
# THE ENVELOPE the figure is allowed to occupy at all, in plate pixels: poses.json
# figure-drew-01-rest mask_box (182, 825, 634, 1525) with a margin. The model
# re-inks the WHOLE crop (see the note above), so without this the key hands back
# the window and the far marble as part of the bird. Nothing outside it can ever
# enter a sticker.
# TIGHTENED after seed 41 round 6: the first envelope (150,780,700,1560) let the
# key take a slab of re-inked marble and bar front along with the bird. This one
# stops at the chair's roll and just past the martini hand, so the plate's own
# chair, bar front and far marble always survive.
DEFAULT_ROI = {
    "drew": (140, 770, 620, 1340),
    "barclay": (660, 720, 1120, 1420),
    "abby": (520, 680, 800, 1220),
}
# Route S's per-character block-in overlap floor (a candidate blob counts as HIM
# only if it overlaps his own figure mask by more than this many pixels — see
# "MIN_FIGURE_OVERLAP" at the key, below). Abby's block-in mask is smaller than
# Drew's or Barclay's (about 215x489 against 452x701 and 373x612), so her floor
# is set lower, at 300px, in place of the 400px the two seated birds use.
MIN_FIGURE_OVERLAP = {"drew": 400, "barclay": 400, "abby": 300}
# Route S's per-character POSE NAME - names the output file (see main()'s
# pose_name resolution and "<character>-<pose>-r<route>[-<tag>]-s<seed>.png"),
# taken from the character table: Drew and Barclay each SIT (in the left and
# right chair respectively), Abby STANDS at the ledge.
POSE_NAME = {"drew": "seated-left", "barclay": "seated-right", "abby": "ledge"}

PORTRAIT = {
    "drew": "canon/vision/studies/drew.png",
    "barclay": "canon/vision/studies/barclay.png",
    "abby": "canon/vision/studies/abby.png",
}
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
# route S's optional Picture 3 (--staging-solo): the previous team's flamingo-only
# crop of duo-behind.png. It still leaks room fragments of its OWN crop (see the
# round-1 note above), so the label says not to copy them.
PICTURE3_LABEL_SOLO = (
    "THE FLAMINGO ALONE, cropped out of the approved staging so only his body angle and the turn of his head "
    "carry - seen from behind and a little to his side, head turned in three-quarter so the bill and one "
    "lidded eye read. COPY THIS BODY ANGLE AND THIS TURN OF THE HEAD ONLY. Everything else visible in this "
    "picture - any room fragment, any bottle, any lettering behind him - belongs to a different crop and a "
    "different edit: do not copy any of it"
)
# Route S's per-character OCCLUDER - the thing whose OWN rendered pixels sit on
# the sheet and stay in front of the figure's lower body. Drew and Barclay each
# get their own club chair; Abby has no chair at all - she stands, and the bar
# COUNTER (laid after her, exactly as a chair is) is what occludes her.
OCCLUDER_NAME = {
    "drew": "left leather club chair",
    "barclay": "right leather club chair",
    "abby": "bar counter",
}
# Route S's per-character LINE - what the one thin ink line on the sheet marks.
# Drew and Barclay each get the marble counter's near top edge, a horizon at
# hand height; Abby stands BEHIND the ledge, so hers is the ledge's own near
# edge instead - the surface she actually works at.
LINE_NAME = {
    "drew": "the marble counter's near top edge, so the seat has a horizon",
    "barclay": "the marble counter's near top edge, so the seat has a horizon",
    "abby": "the marble ledge's near top edge behind her, so her stance has a horizon",
}
PICTURE1_LABEL_STICKER = {
    character: (
        "A BLANK WHITE SHEET OF PAPER - this IS the picture being edited - carrying three things and nothing "
        f"else: the {OCCLUDER_NAME[character]}'s own already-finished pixels, in the studio's own engraved "
        f"pen, at exactly the size, the place and the perspective the finished picture uses; one thin ink "
        f"line marking {LINE_NAME[character]}; and a very PALE, faint pencil UNDER-DRAWING of the figure "
        "already down in place, waiting to be drawn in finished line. EVERYWHERE ELSE ON THE SHEET IS BLANK "
        "WHITE PAPER: no room, no wall, no window, no shelf, no second character, no bottle, no lettering"
    )
    for character in OCCLUDER_NAME
}
PICTURE2_LABEL = {
    "drew": (
        "DREW, the studio's official portrait — copy THIS bird identically: the small refined head, the "
        "slender pale bill with its black outer third, the heavy-lidded amiable eye, the long S-curve "
        "neck, the white collar band and small black bow tie, the V-neck knitted sweater vest, and the "
        "feathered hands with four fingers and a thumb and no claws"
    ),
    "barclay": (
        "BARCLAY, the studio's official portrait — copy THIS dog identically: the broad soft-eyed retriever "
        "face, the freckled muzzle with true black dog lips and his mouth closed, the fringed drop ears, "
        "warm bright eyes with worry only in the raised inner brows, the dark suit jacket over a pale "
        "open-collared shirt, the small USA flag pin on the left lapel, and the fur-backed hands with four "
        "fingers and an opposed thumb and no claws"
    ),
    "abby": (
        "ABBY, the studio's official portrait — copy THIS terrier identically: the round soft westie face "
        "with a big black nose close under large glamorous human-style eyes with whites, iris, lashes and a "
        "clear catchlight, the two small pricked ears, the warm closed-lip smile, the studded leather collar "
        "with its teardrop gem pendant, the fitted light blouse open two buttons over a smooth sleek throat, "
        "and the fur-backed hands with four fingers and an opposed thumb and no claws"
    ),
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
# ROUTE S's EDIT 1 - the under-drawing already fixes the pose, the scale and the
# seat, so this edit's job is to say "fill it", not to restage it. Every NOT
# sentence from the pinned staging above still applies; the new one is the paper
# itself, which must stay blank everywhere the under-drawing does not reach.
# THE UNDER-DRAWING'S HEAD (Team 4, 2026-09-08). Team Drew 3 proved the block-in
# HEAD was invisible to the model at any --under-blend: a pale grey skull and bill
# read as nothing in particular, and every seed came back with a goose, a stork or
# a folded ribbon where the head belongs. --under-lines (below) now draws that
# head as actual ink lines the model can see; this sentence tells it, in words,
# that what it is looking at IS the head, and names its parts so it is drawn as
# one solid piece joined to the neck rather than redrawn as something else.
HEAD_SENTENCE = {
    "drew": (
        "At the top of the neck the under-drawing already carries a small ROUND SKULL with the eye marked in "
        "it and the thick bill bending steeply DOWN to its black tip - that IS his head: draw a solid, small, "
        "refined, rounded head exactly filling it, joined to the neck, the bill growing from it along the "
        "line already there, one heavy-lidded amiable eye where the eye is marked. His head is never a folded "
        "feather, a ribbon, a wedge or a plume, and never floats free of the neck."
    ),
    "barclay": (
        "At the top of the neck the under-drawing already carries a small ROUND SKULL with a wedge-shaped "
        "MUZZLE reaching out from it, a dark NOSE marked at the muzzle's tip and both eyes marked where the "
        "muzzle joins the skull, and one rectangular DROP EAR hanging beside it - that IS his head: draw a "
        "solid, small, softly rounded retriever head exactly filling it, joined to the neck, the muzzle "
        "growing from it along the line already there with his black nose at its tip and true black dog lips "
        "beneath it, the fringed drop ear falling naturally where it is marked, both warm bright eyes where "
        "the eyes are marked. His head is never a flat mask, a snoutless blob or a stiff floating ear, and "
        "never floats free of the neck."
    ),
    "abby": (
        "At the top of the neck the under-drawing already carries a small ROUND, SOFT SKULL with two small "
        "pricked EARS standing up from it and a dark NOSE marked low on the face, both eyes marked either "
        "side of the nose, the far eye smaller than the near one where the head turns three-quarter - that IS "
        "her head: draw a solid, small, round westie head exactly filling it, joined to the neck, her short "
        "square muzzle rounding gently down to her black nose exactly where it is marked, both pricked ears "
        "standing up from the skull, and her eyes drawn EXACTLY TO HER OWN EYE RULE where the eyes are "
        "marked: white showing both sides of a drawn iris, a smaller round pupil, one catchlight, a lashed "
        "upper lid, closing in her warm closed-lip half-smile. Her head is never a flat disc, a bare eyeless "
        "skull or drooping ears, and never floats free of the neck."
    ),
}
ADD_EDIT_STICKER = {
    "drew": (
        "DRAW DREW (Picture 2), the white flamingo gentleman, EXACTLY FILLING the pale pencil under-drawing "
        "already on the page - the same size, the same seat in that chair, the same turn of the head, nothing "
        "restaged. He is seen FROM BEHIND and a little to his LEFT, over his shoulder, the knit of the V-neck "
        "sweater vest running across his shoulder blades. Turn his head to his RIGHT, toward where the other "
        "chair would be, so the head and the slender pale bill read in three-quarter at the very most, and the "
        "one heavy-lidded eye shows. Carry his neck, the white collar band and the knit vest up ABOVE the "
        "chair back, into the gap the under-drawing already leaves clear for them. The chair back stays IN "
        "FRONT of his lower body, exactly as the chair's own pixels already show it - do not draw any part of "
        "him in front of the chair. Draw him in the SAME engraved pen, the same size and the same light as the "
        "chair. NOTHING ELSE: the page stays BLANK WHITE PAPER everywhere the under-drawing does not reach - "
        "no room, no wall, no window, no table, no more of the marble than the one thin line already on the "
        "page, no second character, no bottle, no lettering of any kind. " + HEAD_SENTENCE["drew"]
    ),
    "barclay": (
        "DRAW BARCLAY (Picture 2), the golden retriever gentleman, EXACTLY FILLING the pale pencil "
        "under-drawing already on the page - the same size, the same seat in that chair, the same turn of "
        "the head, nothing restaged. He is seen FROM BEHIND and a little to his RIGHT, over his shoulder, "
        "his dark suit jacket running across his shoulder blades. Turn his head to his LEFT, toward where "
        "the other chair (Drew's) would be, so his face reads in three-quarter at the very most, toward "
        "Drew. Carry his neck, his shirt collar and the shoulder of his jacket up ABOVE the chair back, into "
        "the gap the under-drawing already leaves clear for them. The chair back stays IN FRONT of his lower "
        "body, exactly as the chair's own pixels already show it - do not draw any part of him in front of "
        "the chair. Draw him in the SAME engraved pen, the same size and the same light as the chair. "
        "NOTHING ELSE: the page stays BLANK WHITE PAPER everywhere the under-drawing does not reach - no "
        "room, no wall, no window, no table, no more of the marble than the one thin line already on the "
        "page, no second character, no bottle, no lettering of any kind. " + HEAD_SENTENCE["barclay"]
    ),
    "abby": (
        "DRAW ABBY (Picture 2), the West Highland terrier proprietor, EXACTLY FILLING the pale pencil "
        "under-drawing already on the page - the same size, the same stance BEHIND the marble ledge, "
        "nothing restaged. She is seen FACING THE ROOM, standing at her working ledge, one hand busy on a "
        "bar object exactly where the under-drawing already places it. Carry her shoulders, her collar and "
        "the studded leather collar with its teardrop gem up ABOVE the bar counter, into the gap the "
        "under-drawing already leaves clear for them. The bar counter stays IN FRONT of her lower body, "
        "exactly as the counter's own pixels already show it - do not draw any part of her in front of the "
        "counter. Draw her in the SAME engraved pen, the same size and the same light as the counter. "
        "NOTHING ELSE: the page stays BLANK WHITE PAPER everywhere the under-drawing does not reach - no "
        "room, no wall, no window, no shelf, no second character, no bottle, no lettering of any kind. "
        + HEAD_SENTENCE["abby"]
    ),
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
# EDIT 2 for --route S: the page is mostly blank paper, not fog and not a room -
# the same corrective KEEP_EDIT_FLAT makes for the grey field, written for white.
# Route S's per-character KEEP_EDIT_STICKER: the same corrective KEEP_EDIT_FLAT
# makes for the flat grey, written for blank white paper, and naming THIS
# character's own occluder rather than always "the left leather club chair".
KEEP_EDIT_STICKER = {
    character: (
        f"KEEP EVERYTHING ELSE EXACTLY AS PICTURE 1. The {occ} keeps every one of its own pixels exactly as "
        "given, and the thin ink line marking the near edge of the marble stays exactly where it is and "
        "exactly that thin. THE REST OF THE PAGE STAYS BLANK WHITE PAPER - it is not a room seen through fog "
        "and not fog either, it is empty paper. Do not invent anything on it: no window, no street, no "
        "shelves, no bottles, no mirror, no lettering, no hatching, no shading, no floor, no second figure, "
        "no table, no more of the marble than the one line already given. Nothing whatever is added anywhere "
        "except finishing the one figure whose pale under-drawing is already on the page."
    )
    for character, occ in OCCLUDER_NAME.items()
}
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
        body = body.replace("[SCENE]", ADD_EDIT.get(character) or ADD_EDIT_STICKER.get(character, ""))
        return body, []
    missed: list[str] = []
    pen = next((p for p in paras if p.startswith("A single-panel gag cartoon")), "")
    if not pen:
        missed.append("the engraving paragraph (fence paragraph 1)")
    # THE CHARACTER'S OWN PARAGRAPH. Fence paragraph 5 carries DREW and BARCLAY
    # together, joined at " BARCLAY (frame-right)"; paragraph 6 is ABBY alone.
    # Route S now draws Barclay and Abby too (Team 4, 2026-09-08), and each must
    # get HIS OR HER OWN half - sending Drew's paragraph while drawing Barclay
    # would tell the model to draw Drew's bill and bow tie onto him.
    block = ""
    if character == "abby":
        abby_para = next((p for p in paras if p.startswith("ABBY is")), "")
        if not abby_para:
            missed.append("the ABBY character paragraph")
        block = abby_para.strip()
    else:
        who = next((p for p in paras if p.startswith("DREW (frame-left)")), "")
        if not who:
            missed.append("the DREW/BARCLAY character paragraph")
        else:
            drew_part, sep, barclay_rest = who.partition(" BARCLAY (frame-right)")
            if not sep:
                missed.append("DREW/BARCLAY paragraph split on ' BARCLAY (frame-right)'")
            if character == "barclay" and sep:
                block = ("BARCLAY" + barclay_rest).strip()
            else:
                block = (drew_part if sep else who).strip()
                if character == "drew":
                    block = block.replace("DREW (frame-left) is", "DREW is")
    return "\n\n".join(p for p in (pen, block) if p), missed


def build_prompt(character: str, edit: str, extra_edits: list[str], rules: str,
                 keep_first: bool, labels: list[str], clean: bool = False,
                 keep_edit: str = KEEP_EDIT, add_edit: dict = ADD_EDIT) -> str:
    add = edit.strip() or add_edit[character]
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


# --------------------------------------------------- THE WHITE SHEET (route S)
# Routes A and B still hand the model a picture of the ROOM and ask it to place
# the figure at its own judgement of scale and seat; every round proved it will
# not use OUR left chair for that judgement. Route S removes the judgement
# instead: Picture 1 is blank white paper carrying only the chair (the anchor),
# a single line for the marble (a horizon) and a PALE UNDER-DRAWING of the exact
# pose already solved by the construction - the model's only job is to fill it.
# The part id in parts.json / the mask+values filenames, per character - the
# anchor block-in pose each character's white-sheet render fills.
STICKER_FIGURE_PART = {
    "drew": "figure-drew-02-toward",
    "barclay": "figure-barclay-02-toward",
    "abby": "figure-abby-01-ledge",
}
STICKER_FIGURE_MASK = {k: f"canon/room-kit/v2/masks/{v}.png" for k, v in STICKER_FIGURE_PART.items()}
STICKER_FIGURE_VALUES = {k: f"canon/room-kit/v2/values/{v}.png" for k, v in STICKER_FIGURE_PART.items()}
# The OCCLUDER, per character - its OWN rendered pixels are what sits on the
# sheet and stays in front of the figure's lower body (see OCCLUDER_NAME above,
# which is the same table's English name). Drew and Barclay each sit in their
# own club chair; Abby stands behind the bar counter, which is laid after her.
STICKER_OCCLUDER_MASK = {
    "drew": "canon/room-kit/v2/masks/chair-left.png",
    "barclay": "canon/room-kit/v2/masks/chair-right.png",
    "abby": "canon/room-kit/v2/masks/counter.png",
}
# The LINE SOURCE, per character - the mask whose own top boundary per column is
# traced into the one thin ink line (see LINE_NAME above). Drew and Barclay both
# sit at the marble counter; Abby stands behind the ledge, so hers is traced from
# the ledge instead.
STICKER_LINE_SOURCE_MASK = {
    "drew": "canon/room-kit/v2/masks/counter.png",
    "barclay": "canon/room-kit/v2/masks/counter.png",
    "abby": "canon/room-kit/v2/masks/ledge.png",
}
STICKER_WHITE = 255.0
STICKER_LINE_INK = 70.0        # the marble line's tone - a clear stroke, not the room's own ink
STICKER_LINE_HALFWIDTH = 1     # px each side of the traced curve, before feather - a THIN line
STICKER_LINE_FEATHER = 0.6
STICKER_FIGURE_FEATHER = 1.5   # the under-drawing's own edge, so its silhouette doesn't alias
STICKER_OCCLUDER_FEATHER = 1.0  # the occluder's edge, laid last so it stays crisp
# --under-lines (Team 4, 2026-09-08): the pencil line drawing on top of the
# tone fill. STICKER_LINE_TONE is the grey the lines are drawn at; the Sobel
# threshold and the thinning width are its own two dials.
STICKER_UNDER_LINE_TONE = 150.0
STICKER_UNDER_LINE_SOBEL_THRESH = 24.0
STICKER_UNDER_LINE_WIDTH = 2      # target line width in px, after thinning
# --cut-by-blockin (Team 6, 2026-09-08): the final radius, in px, that the kept
# sticker mask is dilated out from the figure's OWN block-in mask before it is
# ANDed back in - see the route S key, below.
STICKER_BLOCKIN_CUT_PX = 12


def sticker_masks(box: tuple[int, int, int, int], character: str) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """The three masks route S needs, cropped to `box` (plate pixels): the figure
    block-in's own silhouette, the occluder's own mask (the chair for Drew and
    Barclay, the counter for Abby), and a THIN line traced along the line
    source's near top edge - its mask's own top boundary per column, which IS
    that edge (measured directly against the plate: counter.png's mask inside
    Drew and Barclay's boxes runs from its bright near-top edge down through the
    bar's front panel to the crop floor, so its topmost row per column is the
    marble's near top edge, nothing more has to be guessed; ledge.png does the
    same for Abby's own working surface)."""
    x0, y0, x1, y1 = box

    def crop(rel: str) -> np.ndarray:
        full = np.asarray(Image.open(ROOT / rel).convert("L"))
        return full[y0:y1, x0:x1] > 127

    fig = crop(STICKER_FIGURE_MASK[character])
    occluder = crop(STICKER_OCCLUDER_MASK[character])
    line_source = crop(STICKER_LINE_SOURCE_MASK[character])
    h, w = fig.shape
    line = np.zeros((h, w), bool)
    for c in np.where(line_source.any(axis=0))[0]:
        r = int(np.where(line_source[:, c])[0].min())
        line[max(0, r - STICKER_LINE_HALFWIDTH):min(h, r + STICKER_LINE_HALFWIDTH + 1), c] = True
    return fig, occluder, line


def under_drawing_lines(fig_values: np.ndarray, fig_mask: np.ndarray,
                        sobel_thresh: float = STICKER_UNDER_LINE_SOBEL_THRESH,
                        width: int = STICKER_UNDER_LINE_WIDTH) -> np.ndarray:
    """--under-lines: the block-in redrawn as a PENCIL LINE DRAWING instead of a
    tone fill - the figure mask's own OUTLINE plus the INTERNAL tone edges of
    the values image, thinned to about `width` px. This is what makes the head
    visible: Team Drew 3 found a pale grey skull and bill read as nothing at
    all, and every seed drew a goose, a stork or a folded ribbon instead of it.
    An actual line at the eye, the skull and the bill gives the model something
    it can see rather than something it has to infer from a faint value shift.

    THE OUTLINE is fig_mask XOR its own 1px erosion - the boundary ring of the
    silhouette, one pixel wide before it is grown to `width`.

    THE INTERNAL EDGES are a Sobel gradient magnitude of a lightly smoothed copy
    of fig_values (sigma 0.6, just enough to stop single-pixel dither reading as
    an edge of its own), thresholded at `sobel_thresh` and confined to fig_mask -
    exactly what separates the eye from the skull and the black bill-tip from
    the pale bill in the block-in's own flat colour bands - then thinned with a
    morphological skeleton (skimage) and grown back out to `width` px so a
    single-pixel skeleton does not alias to invisibility once it is feathered."""
    smooth = ndimage.gaussian_filter(fig_values, 0.6)
    gy, gx = np.gradient(smooth)
    mag = np.hypot(gx, gy)
    edges_raw = (mag > sobel_thresh) & fig_mask
    edges_thin = skeletonize(edges_raw)

    outline = fig_mask & ~ndimage.binary_erosion(fig_mask, iterations=1)

    lines = edges_thin | outline
    grow = max(0, int(round(width)) - 1)
    if grow:
        lines = ndimage.binary_dilation(lines, iterations=grow)
    return lines & ndimage.binary_dilation(fig_mask, iterations=grow + 1)


def remap_figure_values(fig_values: np.ndarray, fig_mask: np.ndarray,
                        lo: float, hi: float) -> np.ndarray:
    """--under-remap LO,HI: linearly remap the block-in's own tones from
    [0,255] to [LO,HI], INSIDE the figure mask only - everywhere else (which
    --under-blend never touches anyway) is left as-is. This is what turns a
    white bird's ~245-grey head into a pale grey figure that still reads
    against the sheet after --under-blend, instead of vanishing into it."""
    remapped = lo + (hi - lo) * (fig_values / 255.0)
    out = fig_values.copy()
    out[fig_mask] = remapped[fig_mask]
    return out


def sticker_field(base: np.ndarray, box: tuple[int, int, int, int], character: str,
                  under_blend: float = 0.30, under_lines: bool = True,
                  under_remap: tuple[float, float] | None = None,
                  sheet_grey: float = STICKER_WHITE) -> tuple[np.ndarray, dict]:
    """Picture 1 for --route S: a SHEET (paper tone `sheet_grey`, default white
    255) carrying only the occluder's own rendered pixels (the chair for Drew
    and Barclay, the counter for Abby), the line source's near top edge as a
    thin line, and a PALE under-drawing of the seated or standing block-in
    pose, blended `under_blend` toward the sheet's own tone - with, when
    `under_lines` is on (the default), the block-in's own outline and internal
    tone edges drawn over that tone fill as an actual PENCIL LINE DRAWING at
    STICKER_UNDER_LINE_TONE (150), so the head is something the model can see
    rather than something it has to infer from a faint grey shift. When
    `under_remap` (LO, HI) is given, the block-in's own tones are remapped
    into that range FIRST (see remap_figure_values()), before either the line
    drawing or the blend reads them - so a white head becomes a pale grey
    figure instead of invisible paper.

    Composited farthest-to-nearest, exactly as the room itself would occlude
    them: the line first (the figure sits in front of most of it), the
    under-drawing (tone fill, then its own pencil lines) next, and the
    occluder's real pixels LAST, on top, because it stands in front of the
    figure's lower body - the same depth order the finished picture must keep."""
    x0, y0, x1, y1 = box
    fig, occluder, line = sticker_masks(box, character)

    def soft(mask: np.ndarray, feather: float) -> np.ndarray:
        a = mask.astype(np.float64) * 255.0
        if feather > 0:
            a = np.asarray(Image.fromarray(a.astype(np.uint8)).filter(ImageFilter.GaussianBlur(feather)),
                           dtype=np.float64)
        return a / 255.0

    field = np.full(base.shape, sheet_grey)

    line_soft = soft(line, STICKER_LINE_FEATHER)
    field = field * (1 - line_soft) + STICKER_LINE_INK * line_soft

    fig_values = np.asarray(Image.open(ROOT / STICKER_FIGURE_VALUES[character]).convert("L"),
                            dtype=np.float64)[y0:y1, x0:x1]
    if under_remap is not None:
        fig_values = remap_figure_values(fig_values, fig, under_remap[0], under_remap[1])
    fig_soft = soft(fig, STICKER_FIGURE_FEATHER)
    undertone = fig_values * (1 - under_blend) + sheet_grey * under_blend
    field = field * (1 - fig_soft) + undertone * fig_soft

    lines_mask = None
    if under_lines:
        lines_mask = under_drawing_lines(fig_values, fig)
        lines_soft = soft(lines_mask, 0.5)
        field = field * (1 - lines_soft) + STICKER_UNDER_LINE_TONE * lines_soft

    occluder_soft = soft(occluder, STICKER_OCCLUDER_FEATHER)
    field = field * (1 - occluder_soft) + base * occluder_soft

    info = {"white": sheet_grey, "under_blend": under_blend, "under_lines": under_lines,
            "under_remap": list(under_remap) if under_remap is not None else None,
            "sheet_grey": sheet_grey,
            "occluder_fraction": round(float(occluder.mean()), 4),
            "figure_fraction": round(float(fig.mean()), 4),
            "line_fraction": round(float(line.mean()), 4),
            "under_line_fraction": round(float(lines_mask.mean()), 4) if lines_mask is not None else None,
            "white_fraction": round(float((~(occluder | fig | line)).mean()), 4),
            "figure_part": STICKER_FIGURE_PART[character], "line_ink": STICKER_LINE_INK,
            "occluder": OCCLUDER_NAME[character]}
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


def parse_pair(text: str) -> tuple[float, float]:
    """--under-remap LO,HI."""
    parts = [float(x) for x in re.split(r"[,x ]+", text.strip()) if x != ""]
    if len(parts) != 2:
        raise SystemExit(f"wants LO,HI - got {text!r}")
    return parts[0], parts[1]  # type: ignore[return-value]


def next_round(character: str) -> Path:
    base = SCRATCH / character
    n = 1
    while (base / f"round-{n}").exists():
        n += 1
    return base / f"round-{n}"


def load_also_overrides(also_args: list[str], out_dir: Path, plate: Image.Image) -> dict[str, Path]:
    """--also PART=STICKER.PNG (repeatable): lay another already-ACCEPTED sticker
    into route S's laid preview, at ITS OWN part, so the character being judged
    today is judged against the plate with that other character already in it
    (e.g. Barclay judged with Drew's own approved sticker already seated beside
    him). `part` is a parts.json id (STICKER_FIGURE_PART's own values); the
    sticker is an RGBA cutout the size of its OWN box, not the full plate, so
    its own JSON sidecar (same file name, .json) is read for that box and the
    sticker is pasted (through its own alpha) into a full-plate-sized copy,
    exactly as this script's own candidate is built for the character it is
    actually drawing today - assemble() only reads pixels through the part's OWN
    mask, so nothing outside that mask in this candidate ever matters."""
    overrides: dict[str, Path] = {}
    for i, raw in enumerate(also_args):
        part_id, sep, sticker_str = raw.partition("=")
        if not sep:
            raise SystemExit(f"--also wants PART=STICKER.PNG, got {raw!r}")
        part_id = part_id.strip()
        sticker_path = Path(sticker_str.strip())
        if not sticker_path.exists():
            raise SystemExit(f"--also {part_id}: sticker not found: {sticker_path}")
        sidecar_path = sticker_path.with_suffix(".json")
        if not sidecar_path.exists():
            raise SystemExit(f"--also {part_id}: no sidecar JSON next to it (needed for its box): {sidecar_path}")
        meta = json.loads(sidecar_path.read_text(encoding="utf8"))
        obox = meta.get("box")
        if not obox or len(obox) != 4:
            raise SystemExit(f"--also {part_id}: sidecar has no usable 'box': {sidecar_path}")
        ox0, oy0, ox1, oy1 = (int(v) for v in obox)
        sticker_img = Image.open(sticker_path).convert("RGBA")
        canvas = plate.convert("RGB").copy()
        canvas.paste(sticker_img.convert("RGB"), (ox0, oy0), sticker_img)
        also_path = out_dir / f"also-{i}-{part_id}.png"
        canvas.convert("L").save(also_path)
        overrides[part_id] = also_path
    return overrides


def main() -> None:
    ap = argparse.ArgumentParser(description="Place one character into the approved room and cut him out.")
    ap.add_argument("--character", default="drew", choices=sorted(DEFAULT_BOX))
    ap.add_argument("--seed", type=int, required=True)
    ap.add_argument("--box", default="", help="X0,Y0,X1,Y1 in the plate's pixels, 4:5 (default: the left chair)")
    ap.add_argument("--edit", default="", help="replace EDIT 1, the ADD sentence, for this round")
    ap.add_argument("--extra-edit", action="append", default=[], help="one more numbered EDIT (repeatable)")
    ap.add_argument("--plate", default=str(PLATE))
    ap.add_argument("--portrait", default="", help="use THIS file as Picture 2")
    ap.add_argument("--route", default="A", choices=("A", "B", "S", "legacy"),
                    help="A = flat-field Picture 1 + difference key onto the real plate; "
                         "B = the plate crop as Picture 1 and the whole render pasted back with a "
                         "feathered border; S = white-sheet Picture 1 with a pale under-drawing of the "
                         "block-in pose, keyed by absolute darkness and laid through room-part's own "
                         "assemble(); legacy = the first launch's plate-keyed behaviour")
    ap.add_argument("--flat-grey", type=float, default=140.0,
                    help="route A: the grey everything but the chair, the marble and the wall lines becomes")
    ap.add_argument("--paste-feather", type=int, default=12,
                    help="route B: the feathered border, in plate pixels, on the pasted crop")
    ap.add_argument("--under-blend", type=float, default=0.0,
                    help="route S (default 0, Team 6 2026-09-08 - the lab's own recipe): how far the "
                         "under-drawing's block-in tones are blended toward the sheet's own tone (0 = the "
                         "block-in's own tones, now remapped by --under-remap instead; 1 = invisible)")
    ap.add_argument("--under-lines", dest="under_lines", action="store_true", default=False,
                    help="route S: draw the under-drawing as a PENCIL LINE DRAWING - the figure mask's "
                         "outline and the internal tone edges of the values image, thinned to about 2px, "
                         "at grey 150 - on top of the tone fill, so the head is visible as lines rather "
                         "than a faint grey shape (default OFF as of Team 6, 2026-09-08 - the lab found "
                         "--under-remap alone, with NO lines and NO staging picture, was the one recipe "
                         "that made the model draw the portrait's head; use --under-lines to bring the "
                         "lines back for comparison)")
    ap.add_argument("--no-under-lines", dest="under_lines", action="store_false",
                    help="route S: the explicit off-switch for --under-lines (already the default)")
    ap.add_argument("--under-remap", default="100,180",
                    help="route S: LO,HI - before --under-blend, remap the block-in's own tones INSIDE "
                         "the figure mask linearly from [0,255] to [LO,HI], so a white head (~245 grey) "
                         "becomes a pale grey figure that reads on the sheet (default '100,180' as of "
                         "Team 6, 2026-09-08 - a darker band top, to help the seeds that still collapsed "
                         "the head; pass '' to send the block-in's own tones through unchanged)")
    ap.add_argument("--sheet-grey", type=float, default=255.0,
                    help="route S: the sheet's own paper tone instead of 255 - the field starts at this "
                         "grey, the under-drawing blends toward it, and --white-thresh's ink test moves "
                         "with it (ink = darker than --sheet-grey - (255 - --white-thresh))")
    ap.add_argument("--white-thresh", type=float, default=232.0,
                    help="route S: a rendered pixel this dark or darker (after a 1px blur) is ink, not "
                         "the sheet's own white paper - the key's threshold")
    ap.add_argument("--fill", dest="fill", action="store_true", default=True,
                    help="route S (default ON): after the overlapping components are kept and before the "
                         "1.5px feather, binary_closing(3) then binary_fill_holes, so a WHITE bird's own "
                         "paper interior (vest, belly, neck, crown) is not left as a lattice of ink with "
                         "the room showing through it")
    ap.add_argument("--no-fill", dest="fill", action="store_false",
                    help="route S: disable the hole fill")
    ap.add_argument("--cut-by-blockin", dest="cut_by_blockin", action="store_true", default=True,
                    help="route S (default ON): after keying (and the hole fill, if any), also limit the "
                         f"sticker's alpha to dilate(figure block-in mask, {STICKER_BLOCKIN_CUT_PX}px), "
                         "re-applying the occluder cut at the same time - so furniture, marble and "
                         "glassware outside the figure's own silhouette can never ride along just because "
                         "they sat within the wider band the ink test itself used")
    ap.add_argument("--no-cut-by-blockin", dest="cut_by_blockin", action="store_false",
                    help="route S: disable --cut-by-blockin")
    ap.add_argument("--also", action="append", default=[], metavar="PART=STICKER.PNG",
                    help="route S (repeatable): lay another already-accepted sticker into the laid preview "
                         "at ITS OWN part (e.g. --also figure-drew-02-toward=canon/room-kit/v2/figures/"
                         "drew-...-s7.png), so this character is judged against the plate with that other "
                         "character already in it. The sticker's own JSON sidecar (same name, .json) "
                         "supplies its box")
    ap.add_argument("--staging-solo", action="store_true",
                    help="route S: send Picture 3 = the previous team's flamingo-only crop of "
                         "duo-behind.png (default for route S: no Picture 3 at all)")
    ap.add_argument("--staging", default="", help="use THIS file as Picture 3 (default: duo-behind.png; "
                                                  "route S: none unless --staging-solo)")
    ap.add_argument("--no-staging", action="store_true", help="send only two references")
    ap.add_argument("--staging-label", default="",
                    help="replace PICTURE3_LABEL (use with a --staging crop that is no longer the duo)")
    ap.add_argument("--flat-std", type=float, default=3.0,
                    help="route A only: local standard deviation (9px window) at or below which a "
                         "neighbourhood counts as blank paper and cannot enter the sticker")
    ap.add_argument("--flat-reject-tol", type=float, default=10.0,
                    help="route A only: a rendered pixel this close to the flat grey AND sitting in a "
                         "featureless neighbourhood cannot enter the sticker - it is the model DELETING "
                         "set, not adding a bird (0 = off)")
    ap.add_argument("--pose-name", default="", help="names the sticker: <character>-<pose>-r<route>-s<seed>.png "
                                                    "(default: the character's own pose table - seated-left "
                                                    "for drew, seated-right for barclay, ledge for abby)")
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
    under_remap = parse_pair(a.under_remap) if a.under_remap.strip() else None

    who = a.character
    pose_name = a.pose_name.strip() or POSE_NAME[who]
    box = parse_box(a.box) if a.box else DEFAULT_BOX[who]
    x0, y0, x1, y1 = box
    bw, bh = x1 - x0, y1 - y0
    if bw <= 0 or bh <= 0:
        raise SystemExit(f"--box is empty: {box}")
    if abs(bw / bh - 0.8) > 0.02:
        print(f"[shape] box {bw}x{bh} is {bw / bh:.3f}, not the house 4:5 (0.800) - the bridge will squash it.")
    seat = parse_box(a.seat) if a.seat else DEFAULT_SEAT[who]   # Abby: None - she has no seat box at all
    seat_local = (seat[0] - x0, seat[1] - y0, seat[2] - x0, seat[3] - y0) if seat else None
    roi = None if a.no_roi else (parse_box(a.roi) if a.roi else DEFAULT_ROI[who])

    plate = Image.open(a.plate).convert("L")
    crop = plate.crop(box)
    base = np.asarray(crop).astype(np.float64)

    out = Path(a.out) if a.out else next_round(who)
    out.mkdir(parents=True, exist_ok=True)
    FIGURES.mkdir(parents=True, exist_ok=True)

    # PICTURE 1: route A flattens the crop to the set; route S blanks it to white
    # paper with a pale under-drawing; B and legacy send it whole. Either way it
    # is upscaled to the shape the bridge will draw at.
    field, field_info = (None, None)
    if a.route == "A":
        field, field_info = flat_field(base, box, who, a.flat_grey)
        p1_img = Image.fromarray(np.clip(field, 0, 255).astype(np.uint8))
        p1_img.save(out / "flat-field.png")
    elif a.route == "S":
        field, field_info = sticker_field(base, box, who, a.under_blend, a.under_lines,
                                          under_remap, a.sheet_grey)
        p1_img = Image.fromarray(np.clip(field, 0, 255).astype(np.uint8))
        p1_img.save(out / "white-sheet.png")
    else:
        p1_img = crop
    p1_path = out / "picture1.png"
    p1_img.resize(WORK, Image.LANCZOS).save(p1_path)
    p2_path = Path(a.portrait) if a.portrait else ROOT / PORTRAIT[who]
    # Picture 3: routes A/B/legacy default to the pinned duo-behind staging; route
    # S's under-drawing already fixes the pose, so it defaults to NONE unless
    # --staging-solo asks for the flamingo-only crop.
    if a.staging_solo:
        p3_default = STAGING_SOLO_CROP
    elif a.route == "S":
        p3_default = None
    else:
        p3_default = ROOT / STAGING
    p3_path = None if a.no_staging else (Path(a.staging) if a.staging else p3_default)

    rules, missed = rules_block(a.rules, who)
    if missed:
        print("[canon drift] not found in the LOCAL fence, so it did not reach the prompt:")
        for m in missed:
            print("   -", m)
    p1_label = PICTURE1_LABEL_FLAT if a.route == "A" else (
        PICTURE1_LABEL_STICKER[who] if a.route == "S" else PICTURE1_LABEL)
    keep_edit = KEEP_EDIT_FLAT if a.route == "A" else (KEEP_EDIT_STICKER[who] if a.route == "S" else KEEP_EDIT)
    add_edit_map = ADD_EDIT_STICKER if a.route == "S" else ADD_EDIT
    p3_label_default = PICTURE3_LABEL_SOLO if a.staging_solo else PICTURE3_LABEL
    p3_label = a.staging_label.strip() or p3_label_default
    labels = [p1_label, PICTURE2_LABEL[who]] + ([p3_label] if p3_path else [])
    prompt = build_prompt(who, a.edit, a.extra_edit, rules, a.keep_first, labels,
                          keep_edit=keep_edit, add_edit=add_edit_map)
    clean_rules, _ = rules_block("pen" if a.rules != "none" else "none", who)
    # the engraving paragraph ONLY - DREW's canon paragraph would draw him into the twin
    clean_rules = clean_rules.split(NEWLINE + NEWLINE)[0] if clean_rules else ""
    clean_labels = [p1_label, "THE SAME EMPTY ROOM AGAIN, the identical picture, for reference"]
    sidecar_staging_label = p3_label if p3_path else None
    clean_prompt = build_prompt(who, a.edit, a.extra_edit, clean_rules, a.keep_first, clean_labels,
                                clean=True, keep_edit=keep_edit, add_edit=add_edit_map)

    ref_paths = [p1_path, p2_path] + ([p3_path] if p3_path else [])
    images, refmeta = [], []
    for pic, (path, label) in enumerate(zip(ref_paths, labels), start=1):
        uri, info = cs.prepare_reference(path, None)
        images.append(uri)
        refmeta.append({"picture": pic, "path": str(path), "label": label, **info})

    for i in range(max(1, a.rolls)):
        seed = a.seed + i
        # --tag names the ROUND as well as the request. Without this a second
        # round at the same seed silently overwrote the first round's approved
        # sticker, laid preview and sidecar in canon/room-kit/v2/figures (it did,
        # on 2026-09-08, to route S seed 7). The house name is
        # <who>-<pose>-r<route>[-<tag>]-s<seed>.
        _t = f"-{a.tag.strip()}" if a.tag.strip() else ""
        name = f"{who}-{pose_name}-r{a.route}{_t}-s{seed}" if a.route != "legacy" \
            else f"{who}-{pose_name}{_t}-s{seed}"
        tag = a.tag or f"place-{who}"
        req = cs.build_request(prompt, images, seed, not a.full, tag, "")
        (out / f"{name}.prompt.txt").write_text(prompt, encoding="utf8")
        sidecar: dict = {
            "generated_at": dt.datetime.now().isoformat(timespec="seconds"),
            "script": "scripts/cast-place.py",
            "character": who,
            "pose": pose_name,
            "route": a.route,
            "flat_field": field_info,
            "paste_feather": a.paste_feather if a.route == "B" else None,
            "under_blend": a.under_blend if a.route == "S" else None,
            "under_lines": a.under_lines if a.route == "S" else None,
            "under_remap": list(under_remap) if (a.route == "S" and under_remap is not None) else None,
            "sheet_grey": a.sheet_grey if a.route == "S" else None,
            "white_thresh": a.white_thresh if a.route == "S" else None,
            "fill": a.fill if a.route == "S" else None,
            "cut_by_blockin": a.cut_by_blockin if a.route == "S" else None,
            "also": a.also if a.route == "S" else None,
            "staging_solo": a.staging_solo,
            "staging_reference": str(p3_path) if p3_path else None,
            "staging_label": sidecar_staging_label,
            "staging_label_overridden": bool(a.staging_label.strip()),
            "plate": str(a.plate),
            "box": list(box),
            "box_size": [bw, bh],
            "seat_region": list(seat) if seat else None,
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
        elif a.route == "S":
            # ROUTE S - AN ABSOLUTE KEY, not a difference key. Picture 1 was
            # blank white paper apart from the occluder (the chair for Drew and
            # Barclay, the counter for Abby), the marble/ledge line and a PALE
            # under-drawing, so anything the render actually drew is simply
            # darker than the paper - there is no room re-inked to tone-match or
            # align against, so neither is attempted here.
            ref_name, fit = "white-sheet (absolute threshold key, no tone fit)", "none"
            ka, kb = 1.0, 0.0
            dy, dx = 0, 0
            fig_mask_local, occ_mask_local, line_mask_local = sticker_masks(box, who)
            # --sheet-grey: the ink test moves with the sheet's own paper tone, so
            # --white-thresh keeps its old MEANING (how far below the sheet's own
            # tone counts as ink) even when the sheet itself is not pure white.
            white_thresh_eff = a.sheet_grey - (255.0 - a.white_thresh)
            dark = _blur(small, 1.0) < white_thresh_eff
            changed = dark          # for "changed_fraction_whole_box" below: Picture 1 was white paper,
                                    # so "differs from Picture 1" and "has ink at all" are the same test
            fig_dilated = disk_iter(fig_mask_local, ndimage.binary_dilation, 24)
            candidate = dark & fig_dilated & ~occ_mask_local
            if roi_mask is not None:
                candidate &= roi_mask
            lab, n = ndimage.label(candidate, ndimage.generate_binary_structure(2, 2))
            overlaps = ndimage.sum(fig_mask_local, lab, range(1, n + 1)) if n else np.zeros(0)
            min_overlap = MIN_FIGURE_OVERLAP[who]
            keep_ids = [i + 1 for i, ov in enumerate(overlaps) if ov > min_overlap]
            sticker_mask = np.isin(lab, keep_ids) if keep_ids else np.zeros(base.shape, bool)
            # HOLE FILL (round 2, 2026-09-08; --fill, default ON). Drew is a WHITE
            # bird: the absolute key keeps only pixels darker than --white-thresh,
            # so his own paper interior - the vest, the belly, the neck, the crown
            # - never enters the sticker and what is laid on the plate is a
            # lattice of ink with the room showing through it (round 1 covered
            # 0.51-0.67 of the figure mask). Closing the hairline gaps between
            # strokes and then filling what is enclosed makes him opaque WITHOUT
            # reaching any new ink: both operations run on the components already
            # kept, so no blank paper outside the figure can be added by them.
            if a.fill:
                sticker_mask = disk_iter(sticker_mask, ndimage.binary_closing, 3)
                sticker_mask = ndimage.binary_fill_holes(sticker_mask)
            # --cut-by-blockin (Team 6, 2026-09-08; default ON). The candidate
            # pixels above were already confined to a 24px dilation of the
            # figure's own block-in mask before labelling, which is generous
            # enough that a connected blob of ink can still wander onto the
            # marble slab, a martini glass or the chair rail beside the figure
            # and be kept, because nothing there is excluded except the
            # occluder's OWN mask - and binary_fill_holes above can also refill
            # occluder pixels that sit inside an enclosed hole of the kept
            # component. This is the final, tighter word on what may survive:
            # dilate the figure's own block-in mask by a further
            # STICKER_BLOCKIN_CUT_PX (12) and AND it back onto the sticker,
            # re-applying the occluder exclusion at the same time so neither
            # cut is undone by anything upstream of this line.
            cut_by_blockin_removed_px = 0
            if a.cut_by_blockin:
                blockin_cut = disk_iter(fig_mask_local, ndimage.binary_dilation, STICKER_BLOCKIN_CUT_PX)
                before_px = int(sticker_mask.sum())
                sticker_mask = sticker_mask & blockin_cut & ~occ_mask_local
                cut_by_blockin_removed_px = before_px - int(sticker_mask.sum())
            alpha = feather(sticker_mask, 1.5)

            def _topmost_height(mask_bool: np.ndarray) -> int | None:
                """The row-span of the topmost connected blob - the head, since
                the head is always the topmost thing in this pose (see 'scale'
                in the sidecar)."""
                lb, cnt = ndimage.label(mask_bool, ndimage.generate_binary_structure(2, 2))
                if not cnt:
                    return None
                objs = ndimage.find_objects(lb)
                i = min(range(cnt), key=lambda k: objs[k][0].start)
                return int(objs[i][0].stop - objs[i][0].start)

            alpha_head_h = _topmost_height(sticker_mask)
            mask_head_h = _topmost_height(fig_mask_local)
            scale = (alpha_head_h / mask_head_h) if (alpha_head_h and mask_head_h) else None
            matched, ga, gb = tone_match(small, base, "pct")   # the RGBA sticker's own tone only
            keyinfo = {
                "blobs": int(n), "raw_fraction": round(float(dark.mean()), 4),
                "kept": len(keep_ids), "kept_px": int(sticker_mask.sum()), "seat_touched": None,
                "white_thresh": a.white_thresh, "sheet_grey": a.sheet_grey,
                "white_thresh_effective": white_thresh_eff,
                "min_figure_overlap_px": min_overlap, "fill": a.fill,
                "cut_by_blockin": a.cut_by_blockin, "cut_by_blockin_px": STICKER_BLOCKIN_CUT_PX,
                "cut_by_blockin_removed_px": cut_by_blockin_removed_px,
                "figure_mask_px": int(fig_mask_local.sum()),
                "figure_mask_dilated_px": int(fig_dilated.sum()),
                "occluder_mask_px": int(occ_mask_local.sum()),
                "alpha_fraction_inside_figure_mask": (
                    round(float((sticker_mask & fig_mask_local).sum() / sticker_mask.sum()), 4)
                    if sticker_mask.sum() else 0.0),
                "figure_mask_fraction_covered": (
                    round(float((sticker_mask & fig_mask_local).sum() / fig_mask_local.sum()), 4)
                    if fig_mask_local.sum() else 0.0),
                "scale_topmost_blob_alpha_over_mask": round(scale, 4) if scale is not None else None,
                "topmost_blob_height_alpha_px": alpha_head_h,
                "topmost_blob_height_mask_px": mask_head_h,
            }
            outside = alpha == 0
            # cleanliness: of the paper that is neither the sticker nor one of
            # the two given anchors (the occluder, the marble/ledge line), how
            # much did the model draw on when it should have stayed blank white.
            free = outside & ~(occ_mask_local | line_mask_local)
            n_free = int(free.sum())
            cleanliness = float((dark & free).sum() / n_free) if n_free else 0.0
            # room drift: did the model keep the ONE anchor it was given - the
            # occluder - or redraw it too.
            occ_outside = occ_mask_local & outside
            if occ_outside.sum():
                occ_changed = np.abs(matched - base) > a.measure_thresh
                room_drift = float((occ_changed & occ_outside).sum() / occ_outside.sum())
            else:
                room_drift = 0.0
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
                # BLANK PAPER, at any tone: a featureless neighbourhood is never
                # engraved feather, knit or leather. The grey test stays as a
                # second door in, for the case the model DOES keep the field.
                flat = (local_std <= a.flat_std) | (
                    (np.abs(keyed - g) <= a.flat_reject_tol) & (local_std <= a.flat_std * 2))
                flat = disk_iter(flat, ndimage.binary_opening, 2)
                flat = disk_iter(flat, ndimage.binary_dilation, 1)
                flat_guard = {"flat_grey": g, "tol": a.flat_reject_tol, "flat_std": a.flat_std,
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

        if a.route == "S":
            # THE LAID PREVIEW, through room-part's OWN assemble() - not this
            # script's paste. The RAW render (not the sticker's own pct-toned
            # copy) is pasted into a copy of the approved plate at the box and
            # handed to assemble() as the override candidate for the
            # figure-drew-02-toward part, so its own parts.json rules (ring
            # tone-match, its 3px feather, its cast shadow) do the compositing -
            # the same call room-part.py's own render command makes to preview a
            # candidate in context. assemble()/manifest() only READ parts.json;
            # nothing here writes it or plate.png, and room-part.py is never run
            # as a command. (This preview is therefore base+parts fresh through
            # assemble(), not literally plate.png - it carries none of plate.png's
            # own later code passes such as ink_edges or the window sign.)
            cand_arr = np.asarray(plate, dtype=np.float64).copy()
            cand_arr[y0:y1, x0:x1] = small
            cand_path = out / f"{name}-candidate.png"
            Image.fromarray(np.clip(cand_arr, 0, 255).astype(np.uint8)).save(cand_path)
            # --also PART=STICKER.PNG: other already-accepted characters, laid
            # into this same preview at their OWN parts (see load_also_overrides).
            also_overrides = load_also_overrides(a.also, out, plate)
            override = {STICKER_FIGURE_PART[who]: cand_path, **also_overrides}
            man = rp.manifest()
            laid_arr = rp.assemble(man, upto=None, quiet=True, override=override)
            laid = Image.fromarray(np.clip(laid_arr, 0, 255).astype(np.uint8)).convert("RGB")
        else:
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
