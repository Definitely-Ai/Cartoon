#!/bin/sh
# DREW ROUND 4 -- the judges' fixes after round 3, in two passes.
#
# THE ROOT CAUSE ROUND 3 COULD NOT SEE: canon/vision/studies/drew.png, the tile
# handed to the model as "copy THIS bird identically", ITSELF carries a smoothly
# hooked bill whose black runs back along the lower jaw, a heavy brow over a
# stern eye, and leaf-plate plumage -- the three faults the judges have rejected
# every round. Prose cannot outvote a picture. So this round the PICTURES change:
#
#   Picture 1  a pre-composite (make-drew-picture1.py) built from the REPAIRED
#              portrait, with the second glass painted off the marble.
#   Picture 2  the repaired portrait RE-CUT head-and-shoulders (180,40,700,760).
#              No belt, no trousers, no hand on a stem -- the staging the last
#              two rounds kept reverting to cannot be copied out of it.
#   Picture 3  canon/characters/flamingo/kit/bill-diagram.png -- a flat two-tone
#              DIAGRAM of the bill, not a photo-crop. It cannot be misread.
#
# PASS 1 (this file) is the staging pass. PASS 2 is run-drew-round4-repair.sh.
set -e
OUT="C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/drew/round-4"
P1="$OUT/_picture1-drew-composite-v2.png"
DIAG="Z:/ImageGenerator/Cartoon/canon/characters/flamingo/kit/bill-diagram.png"
PORTRAIT="Z:/ImageGenerator/Cartoon/canon/characters/flamingo/kit/portrait-billfixed.png"

# ---- the roster labels ------------------------------------------------------
# The round-3 sentence "HIS HEAD, HIS BILL AND HIS S-CURVED NECK ARE ALREADY
# CORRECT HERE" is DELETED, as ordered: it was protecting the defect.
P1LABEL="THE PICTURE BEING EDITED: DREW the white flamingo gentleman ALONE at the marble counter of The Swinging Door, chest-up against the back bar, his martini standing on the slab in front of him beside the nut bowl, his feathered hand resting flat on the marble. It is ONE single finished scene, not a sketch page and not a study sheet. The ROOM, the CAMERA, the DISTANCE, the crop, the lighting, the counter across his chest and the engraved pen are FINAL - keep every one of them exactly. Draw the whole picture cleanly and finish it"

P2LABEL="Drew's head and shoulders, the studio's portrait - the authority on WHO HE IS and WHAT HE WEARS: the long S-curved neck with its one reversal, the heavy-lidded human eye, the crisp collar, the small black bow tie and the knitted sweater vest. It is NOT the authority on the bill and it is NOT the authority on the staging: the bill is Picture 3's, and the pose, the camera and the counter are Picture 1's"

P3LABEL="THE BILL, as a plain two-tone DIAGRAM and the only authority on its shape and its black: it runs STRAIGHT and level for two thirds, breaks DOWNWARD in ONE sharp corner, then runs straight to a BLUNT ROUNDED end; one single straight line crosses the WHOLE bill at that corner and EVERYTHING beyond it - the top ridge, both sides, the lower jaw and the wrapped-around tip - is SOLID BLACK together, while everything inboard of it is pale and finely hatched. Copy this shape and this black exactly onto Drew's head. Picture 3 is a DIAGRAM FOR REFERENCE ONLY - a drawing of a shape, not an object in the room. It NEVER appears anywhere in the finished picture: it is not on the counter, not on the wall, not in the air, not a sign, not a card and not a cut-out"

POSE="Drew sits alone at the marble with his martini standing in front of him, his long S-curved neck resting in its one easy reversal, his head carried high and turned a little toward the back bar, heavy-lidded, warm and amiable, both feathered hands resting flat on the slab. Frame him CHEST-UP AND NO CLOSER - at exactly Picture 1's distance: his whole head and bill, his whole neck, the collar band, the black bow tie, the V of the knitted sweater vest, the ARMHOLE of the vest and the whole of the NEAR HAND on the marble are all comfortably inside the frame with clear room above his head, and the marble, the martini and the back bar are all still in shot. Never crop in to the head alone."

# ---- the EDITS the judges wrote, in their words ------------------------------
PEN="REDRAW THE BILL IN THE HOUSE ENGRAVING. Drew's bill is drawn with the SAME PEN as the rest of the picture: the pale inner two thirds are built from fine curved contour hatching over white paper, with a soft shadow under the ridge and along the lower jaw; the black outer third is dense solid ink with one bright highlight running along the ridge. It is never flat grey, never an outlined cut-out, never a pasted diagram and never a separate object - it is part of his head, attached at the face, with the fine feathers of his cheek overlapping its base."

SHAPE="THE SHAPE OF THE BILL: from the base it runs STRAIGHT and level with NO curve at all for two thirds of its length, then breaks DOWNWARD in ONE sharp corner and runs STRAIGHT again to a BLUNT ROUNDED end. It is a BENT STICK, not a curve - there is exactly one corner in it and no other bend anywhere along it. It never tapers to a point and it never sweeps in a continuous arc from base to tip. Picture 1 already carries this exact bill: keep that shape, and redraw it in the house pen."

BLACK="THE BLACK ON THE BILL: at a point exactly two thirds of the way from the eye to the tip, ONE straight line crosses the WHOLE bill from its top edge to its bottom edge. Everything OUTBOARD of that line is SOLID BLACK together - the top ridge of the upper mandible, both sides, the lower mandible and the wrapped-around tip. Everything inboard of that line is pale and finely hatched. The TOP EDGE of the bill turns black at the same place the bottom edge turns black. The upper mandible is NEVER pale at the tip. The black is NEVER a stripe, wedge or taper that runs back along the lower jaw while the top of the bill stays white."

SIZE="THE BILL IS SHORT: measured from the eye, the bill is NO LONGER than the skull is wide from the eye to the back of the head. It is smaller than his head, never larger, and it never projects more than half a head-length beyond his face."

EYE="THE EYE is a HUMAN eye, not a bird's bead: an almond opening with the WHITE OF THE EYE clearly visible on BOTH sides of a large dark round iris, one small bright round catchlight at the top of the iris, and a soft upper lid coming a third of the way down. There is NO heavy brow ridge and NO downward-angled frown line above it. He looks warm, gentle and glad to see you - never narrowed, never sneering, never suspicious. Above the eye there is exactly ONE fine contour arc, nothing else - no second crease, no brow ridge, no ledge between the lid and the crown; the plumage between the arc and the crown stays perfectly smooth and pale."

MOOD="HIS EXPRESSION is warm and amiable, not stern: add a faint smile-line at the base of the bill and plump, softly stippled cheeks lifting slightly toward the eye - the look of a man fond of the company, never skeptical, never irritated, never a furrowed brow."

FEATHERS="THE FEATHERS everywhere - crown, neck, breast, shoulders and hands - are FINE SHORT PEN DASHES, small and soft and close together, no single stroke longer than a third of the eye's width. They are NEVER leaf shapes, NEVER teardrop plates, NEVER overlapping shingles or scales, and they never read as a pinecone, an artichoke or a lizard's skin."

NECK="THE NECK: long, slim and S-CURVED with ONE reversal, exactly as Picture 1 already carries it. It leaves the shoulders leaning BACK, then bends FORWARD into the head, so the profile reads as the letter S and the HEAD IS CARRIED HIGH, clearly ABOVE the shoulder line with daylight between the jaw and the collar. The neck is no thicker than HALF the width of the skull. It is never a hunched hook, never a J, and the head never drops to shoulder level."

WARDROBE="THE SWEATER VEST is a KNITTED garment: a deep V neck with a RIBBED band a finger wide around the V, RIBBED bands around both armholes and a RIBBED hem, the body worked in visible knit stitches. Under it a pale COLLARED SHIRT with a crisp turned collar, a buttoned placket down the chest and a small BLACK BOW TIE tied at the collar band. It is never a flat quilted or upholstered panel. The near ARMHOLE of the vest is fully inside the frame."

# The judges asked for both "the thumb is wrapped OPPOSED across the STEM" and
# "HE IS NOT HOLDING ANYTHING". The staging edit is the explicit replacement for
# item 11, so the thumb rule is re-pointed at the hand ON THE MARBLE. Flagged.
HANDS="HIS HANDS are FEATHERED HANDS: FOUR FINGERS and an OPPOSED THUMB, slim and human in proportion, covered in the same fine short dash-strokes as his neck. On the near hand the THUMB IS VISIBLE and lies OPPOSED across the marble in front of at least one finger - never cropped away, never hidden under the palm. No claws, no talons, no dark nails, no ridged or banded fingertips, no nail-like fingertip texture, no blunt lumpy digits, and never shingled, leaf-shaped or scale-like plates on the hand, arm or shoulder."

STAGING="HE IS NOT HOLDING ANYTHING. Both feathered hands rest FLAT on the marble; the martini STANDS BY ITSELF on the slab in front of him, untouched, and no hand touches its stem or its bowl."

MARBLE="THE PICTURE ENDS AT THE MARBLE. The slab crosses him at mid-chest and runs out of frame at both ends across the FOREGROUND, in front of his chest. Below the slab there is NOTHING: no belt, no buckle, no waistband, no trousers, no hips, no lap anywhere in the picture."

ONEDRINK="THERE IS EXACTLY ONE DRINK IN THE PICTURE: his martini. No rocks glass, no tumbler, no second martini, no second stemmed glass anywhere in the frame, including at the extreme left and right edges."

LABELS="EVERY BOTTLE LABEL IS AN EMPTY WHITE RECTANGLE: no crest, no medallion, no oval, no scrollwork, no border device, no dots, no scribbles - blank white paper with nothing on it."

LETTERING="THE ONLY LETTERING in the picture is the house name mirrored on the window, complete and correctly spelled: T-H-E on the first line, S-W-I-N-G-I-N-G on the second, D-O-O-R on the third, every letter present and correctly formed. If it cannot be spelled correctly, leave the window glass plain with no lettering at all."

SOLO="DREW IS THE ONLY CHARACTER IN THE FRAME. There is no other character in frame - no bartender, no barman, no waiter, no second bird, no dog, no man, no woman, no human figure of any kind, no reflection of a second figure and no inset or spare drawing of a head anywhere on the paper, and no diagram, chart, card, cut-out or floating drawn shape anywhere in the room. One head, one bill, one body, and nobody on the service side of the counter."

NEG="black stripe on lower jaw, black wedge along the jaw, white upper mandible, pale beak tip, pointed beak, needle beak, stork bill, shoebill, ibis bill, sickle beak, smoothly curving beak, oversized beak, scaly neck, leaf-shaped feathers, shingled feathers, pinecone texture, reptile skin, heavy brow, furrowed brow, second line above the eye, stern expression, irritated expression, frowning bird, ridged or banded fingertip, nail-like fingertip texture, belt, buckle, trousers, waistband, hand gripping a glass, second glass, rocks glass, ornate bottle labels, crest, medallion, bartender, second figure, diagram, cut-out, floating object, inset drawing, sign, card"

for SEED in "$@"; do
  C:/Python313/python.exe "Z:/ImageGenerator/Cartoon/scripts/cast-study.py" \
    --character drew --seed "$SEED" --out "$OUT" --tag study-drew-r4 \
    --picture1-path "$P1" --picture1-label "$P1LABEL" \
    --picture2-path "$PORTRAIT" --picture2-box "180,40,700,760" --picture2-label "$P2LABEL" \
    --pose "$POSE" --negative-extra "$NEG" \
    --extra-edit "$SOLO" --extra-edit "$PEN" --extra-edit "$SHAPE" --extra-edit "$BLACK" --extra-edit "$SIZE" \
    --extra-edit "$EYE" --extra-edit "$MOOD" --extra-edit "$FEATHERS" \
    --extra-edit "$NECK" --extra-edit "$WARDROBE" --extra-edit "$HANDS" \
    --extra-edit "$STAGING" --extra-edit "$MARBLE" --extra-edit "$ONEDRINK" \
    --extra-edit "$LABELS" --extra-edit "$LETTERING"
done
