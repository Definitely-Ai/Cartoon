#!/bin/sh
# DREW ROUND 4, PASS 2 -- the narrow bill repair the judges asked for.
#
# "split it into two passes rather than re-rolling the whole scene. Pass 1 as now
#  for staging. Pass 2 is a narrow repair edit -- Picture 1 is the pass-1 render,
#  Picture 2 is the bill diagram, and the ONLY edits are the black-cap paragraph,
#  the bent-stick paragraph, the bill-size sentence and the eye sentence, with
#  'change nothing else in the picture' as the closing line."
#
# ONE DEVIATION, forced by the model: the flat DIAGRAM cannot be Picture 2 on
# this path. Two pass-1 renders proved that qwen-image-edit COMPOSITES an extra
# reference into the scene -- it drew canon/characters/flamingo/kit/bill-diagram
# .png first as a cut-out floating over the counter and then as a duck standing
# on the marble. So Picture 2 here is kit/head.png, which is that same corrected
# bill ON A HEAD (re-cut from the repaired portrait). It is a picture of a bird's
# head, which the model treats as identity, not as an object to place.
set -e
OUT="C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/drew/round-4"
REPAIR="$OUT/repair"
HEAD="Z:/ImageGenerator/Cartoon/canon/characters/flamingo/kit/head.png"

P1LABEL="a FINISHED engraved cartoon of DREW the white flamingo gentleman at the marble counter of The Swinging Door. Everything in it is correct and final except the drawing of his bill"

P2LABEL="Drew's head, the authority on the BILL ONLY: the bill runs STRAIGHT and level for two thirds, breaks DOWNWARD in ONE sharp corner and runs straight to a BLUNT ROUNDED end, and one single line crosses the WHOLE bill at that corner with everything beyond it SOLID BLACK - top ridge, both sides, lower jaw and tip together - and everything inboard of it pale. Take the bill's shape and its black from this head and nothing else"

PEN="REDRAW DREW'S BILL IN THE HOUSE ENGRAVING, in the same pen as the rest of Picture 1: the pale inner two thirds built from fine curved contour hatching over white paper with a soft shadow under the ridge, the black outer third dense solid ink with one bright highlight along the ridge. It is part of his head, attached at the face, with the fine feathers of his cheek overlapping its base - never flat grey, never an outlined cut-out, never a pasted shape."

SHAPE="THE SHAPE OF THE BILL: from the base it runs STRAIGHT and level with NO curve at all for two thirds of its length, then breaks DOWNWARD in ONE sharp corner and runs STRAIGHT again to a BLUNT ROUNDED end. It is a BENT STICK, not a curve - there is exactly one corner in it and no other bend anywhere along it. It never tapers to a point and it never sweeps in a continuous arc from base to tip."

BLACK="THE BLACK ON THE BILL: at a point exactly two thirds of the way from the eye to the tip, ONE straight line crosses the WHOLE bill from its top edge to its bottom edge. Everything OUTBOARD of that line is SOLID BLACK together - the top ridge of the upper mandible, both sides, the lower mandible and the wrapped-around tip. Everything inboard of that line is pale and finely hatched. The TOP EDGE of the bill turns black at the same place the bottom edge turns black. The upper mandible is NEVER pale at the tip. The black is NEVER a stripe, wedge or taper that runs back along the lower jaw while the top of the bill stays white."

SIZE="THE BILL IS SHORT: measured from the eye, the bill is NO LONGER than the skull is wide from the eye to the back of the head. It is smaller than his head, never larger, and it never projects more than half a head-length beyond his face."

EYE="THE EYE is a HUMAN eye, not a bird's bead: an almond opening with the WHITE OF THE EYE clearly visible on BOTH sides of a large dark round iris, one small bright round catchlight at the top of the iris, and a soft upper lid coming a third of the way down. Above the eye there is exactly ONE fine contour arc, nothing else - no second crease, no brow ridge, no ledge between the lid and the crown, and the plumage between the arc and the crown stays perfectly smooth and pale. His expression is warm and amiable: a faint smile-line at the base of the bill and plump, softly stippled cheeks lifting slightly toward the eye - never narrowed, never stern, never irritated, never suspicious."

NEG="black stripe on lower jaw, black wedge along the jaw, white upper mandible, pale beak tip, pointed beak, needle beak, stork bill, shoebill, ibis bill, sickle beak, smoothly curving beak, oversized beak, heavy brow, furrowed brow, second line above the eye, stern expression, irritated expression, bartender, second figure, diagram, cut-out, floating object"

FULL=${FULL:-}
mkdir -p "$REPAIR"
for SEED in "$@"; do
  C:/Python313/python.exe "Z:/ImageGenerator/Cartoon/scripts/cast-study.py" \
    --character drew --seed "$SEED" --out "$REPAIR" --tag study-drew-r4-repair --repair $FULL \
    --picture1-path "$OUT/drew-seed$SEED.png" --picture1-label "$P1LABEL" \
    --picture2-path "$HEAD" --picture2-label "$P2LABEL" \
    --negative-extra "$NEG" \
    --extra-edit "$PEN" --extra-edit "$SHAPE" --extra-edit "$BLACK" \
    --extra-edit "$SIZE" --extra-edit "$EYE"
done
