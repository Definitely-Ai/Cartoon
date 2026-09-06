#!/bin/sh
# DREW ROUND 4B -- the judges' two fixes, the REFERENCE fix first.
#
# THE REFERENCE FIX (done before a single pixel was drawn):
#   * canon/characters/flamingo/kit/bill-diagram.png is RETIRED (renamed
#     _retired-bill-diagram-DO-NOT-REFERENCE.png). A flat vector diagram handed
#     to an edit model comes back as flat vector -- and twice as an object in
#     the room. Nothing references it now. kit/portrait-billfixed.png, the
#     retouched portrait, is retired with it.
#   * kit/head.png and kit/bust.png are RE-CUT straight out of
#     canon/vision/studies/drew.png at the judges' crops (head 0.22-0.92 x
#     0.01-0.30, bust 0.05-1.00 x 0.00-0.62) with NO retouching of the bill.
#     drew.png already carries the correct bill.
#   * Picture 1 is rebuilt by make-drew-picture1-round4b.py: the head cut from
#     the UNRETOUCHED drew.png, so it carries the study's own bill and there is
#     no white ghost-bill mask and no hard edge anywhere; pasted higher
#     (scale .74, dy 75) so the head is carried above the shoulder line instead
#     of hooking down to it.
#   * Picture 2 is kit/bust.png -- head, correct bill, neck, collar, bow tie and
#     ribbed knit vest; no belt, no trousers, no hand on a stem.
#   * TWO references only. No third tile: nothing left to composite into the room.
#
# THE PROMPT FIX: EDIT 8 and EDIT 9 replaced with the judges' paragraphs, EDIT
# 7's last clause replaced, EDIT 10 (THE BILL IS SHORT) deleted, EDITs 6, 11,
# 13, 14 and 19 strengthened in the judges' own words.
#
# Same six seeds as round 4 pass 1, unchanged: fast Lightning 8-step, cfg 1, 4:5.
set -e
OUT="C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/flamingo/round-4"
P1="$OUT/_picture1-drew-r4b.png"
BUST="Z:/ImageGenerator/Cartoon/canon/characters/flamingo/kit/bust.png"

P1LABEL="THE PICTURE BEING EDITED: DREW the white flamingo gentleman ALONE at the marble counter of The Swinging Door, chest-up against the back bar, his martini standing on the slab in front of him beside the nut bowl, his feathered hand resting flat on the marble. It is ONE single finished scene, not a sketch page and not a study sheet. The ROOM, the CAMERA, the DISTANCE, the crop, the lighting, the counter across his chest and the engraved pen are FINAL - keep every one of them exactly. His head and his BILL here are cut from the studio's own portrait and are already the RIGHT shape: keep that deep, once-bent, black-tipped bill and simply finish it in the house pen. Draw the whole picture cleanly and finish it"

P2LABEL="Drew's head, neck and shoulders, the studio's official portrait and the authority on WHO HE IS: the deep heavy once-bent bill with its solid black outer end, the long S-curved neck carrying the head high above the shoulders, the heavy-lidded human eye, the crisp collar, the small black bow tie and the ribbed knitted sweater vest. Copy this bird's head, bill, neck and clothes exactly. It is NOT the authority on the staging: the pose, the camera, the counter and the room are Picture 1's"

POSE="Drew sits alone at the marble with his martini standing in front of him, his long S-curved neck carrying his head HIGH above his shoulders, turned a little toward the back bar, heavy-lidded, warm and amiable, both feathered hands resting flat on the slab. Frame him CHEST-UP AND NO CLOSER - at exactly Picture 1's distance: his whole head and bill, his whole neck, the collar band, the black bow tie, the V of the knitted sweater vest, the ARMHOLE of the vest and the whole of the NEAR HAND on the marble are all comfortably inside the frame with clear room above his head, and the marble, the martini and the back bar are all still in shot. Never crop in to the head alone."

# ---- 6. SOLO, with the judges' back-bar clause ------------------------------
SOLO="DREW IS THE ONLY CHARACTER IN THE FRAME. There is no other character in frame - no bartender, no barman, no waiter, no second bird, no dog, no man, no woman, no human figure of any kind, no reflection of a second figure and no inset or spare drawing of a head anywhere on the paper, and no diagram, chart, card, cut-out or floating drawn shape anywhere in the room. One head, one bill, one body, and nobody on the service side of the counter. Behind the bar there is only bottles, shelf and panelling. No head, no face, no shoulders, no figure and no portrait appears among or between the bottles. Nothing in the picture is drawn photographically; every square inch is the same pen."

# ---- 7. the pen, with the judges' replacement last clause -------------------
PEN="REDRAW THE BILL IN THE HOUSE ENGRAVING. Drew's bill is drawn with the SAME PEN as the rest of the picture: the pale part is built from fine curved contour hatching over white paper, with a soft shadow under the ridge and along the lower jaw; the black outer end is dense solid ink with one bright highlight running along the ridge. It is part of his head, growing out of the face, with the fine cheek feathers overlapping and softening its base. There is NO OUTLINE around the bill anywhere and NO straight ruled edge anywhere on it. It is never a flat grey shape, never a pasted cut-out, never a diagram, never a separate object laid over the face."

# ---- 8. the judges' new shape paragraph -------------------------------------
SHAPE="THE SHAPE OF THE BILL - it is a FLAMINGO'S bill, the deepest bill of any bird. At the face it is DEEP AND MASSIVE: its depth at the base is as tall as the eye socket, and the whole bill is only about two and a half of those depths long. It carries that depth forward for the first half, then the WHOLE JAW - top ridge and lower mandible together - swings DOWN through one smooth heavy bend of about forty degrees and runs on to a BLUNT ROUNDED end. The bend is a CURVE in a solid three-dimensional jaw, never a corner, never a hinge, never a fold. The LOWER mandible is the deeper of the two and drives the bend; the upper ridge follows it down. A fine GAPE LINE runs back from the corner of the mouth toward the eye. It is never a thin flat wedge, never a triangle, and never a pale stick with a separate black object fixed to its end."

# ---- 9. the judges' new black paragraph -------------------------------------
BLACK="THE BLACK ON THE BILL: from the bend outward the bill is SOLID BLACK all round - top ridge, both sides, lower mandible and the wrapped blunt tip as ONE continuous mass of ink, with a single bright highlight following the curve of the ridge. The boundary is a soft engraved edge crossing the full depth of the jaw at the bend, drawn with the pen, never a ruled line and never a straight machine edge. Inboard of the bend the bill is pale, modelled in fine curved contour hatching that wraps its roundness, shadowed under the ridge and along the lower jaw. The NOSTRIL is a narrow SLIT set high on the pale part just forward of the face, with a hatched rim and a shadow inside it - never a grey ellipse floating on blank paper."

# ---- 10. DELETED, as ordered (THE BILL IS SHORT) ----------------------------

# ---- 11. the eye, strengthened ---------------------------------------------
EYE="THE EYE is a large heavy-lidded HUMAN eye, not a bird's bead and not a small flat reptilian eye: an almond opening set into the SIDE of the head with a soft brow, the WHITE OF THE EYE clearly visible on BOTH sides of a large dark ROUND iris, one small bright round catchlight at the top of the iris, and a soft upper lid coming a third of the way down. Above the eye the plumage is SMOOTH and UNBROKEN - there is no ledge, no ridge, no shelf and no shadow between the lid and the crown. The upper lid is a soft horizontal curve, level or lifting very slightly at its outer end, NEVER angling down toward the bill. The lower lid shows a small soft pouch. Draw the eye of a kind man in his fifties who has just recognised a friend."

# ---- 12. the mood, with the judges' brow-and-mouth sentence -----------------
MOOD="HIS EXPRESSION is warm, alert and friendly, never sleepy, bored, stern or suspicious. SOFTEN THE BROW AND THE MOUTH-LINE OF THE BILL: no furrow and no frown above the eye, and the gape line at the base of the bill lifts in the faintest smile. His cheeks are plump and softly stippled, lifting slightly toward the eye - the look of a man fond of the company."

# ---- 13. the feathers, strengthened ----------------------------------------
FEATHERS="THE FEATHERS everywhere - crown, neck, breast, shoulders and hands - are FINE SHORT PEN DASHES. Every feather stroke is a SHORT STRAIGHT DASH of uniform weight, no longer than a third of the eye's width, laid in loose rows that follow the form with PAPER SHOWING BETWEEN THEM. No stroke is curved, closed, outlined or filled. There are NO closed shapes of any kind on the plumage - no leaves, no teardrops, no petals, no shingles, no scales, no chevrons, no diamond mesh. If two strokes ever meet to enclose an area, the drawing is wrong."

# ---- 14. the neck, strengthened --------------------------------------------
NECK="THE NECK is long, slim and truly S-SHAPED, with TWO reversals: it curves OUTWARD and UP from the shoulders, reverses INWARD around the mid-neck, then reverses OUTWARD again just below the head, so the silhouette is unmistakably serpentine and never a single swan-like C. The head is carried HIGH - the eye sits ABOVE the top of the shoulder, and there is a clear open gap of at least one skull-width of background visible between the underside of the jaw and the collar band. The neck rises from the shoulders leaning BACK, reaches its highest point, then bends FORWARD and slightly DOWN into the head. It is never a J, never a hook, and the head never sinks to or below the shoulder line. The neck is no thicker than HALF the width of the skull."

WARDROBE="THE SWEATER VEST is a KNITTED garment: a deep V neck with a RIBBED band a finger wide around the V, RIBBED bands around both armholes and a RIBBED hem, the body worked in visible knit stitches. Under it a pale COLLARED SHIRT with a crisp turned collar, a buttoned placket down the chest and a small BLACK BOW TIE tied at the collar band. It is never a flat quilted or upholstered panel. The near ARMHOLE of the vest is fully inside the frame."

HANDS="HIS HANDS are FEATHERED HANDS: FOUR FINGERS and an OPPOSED THUMB, slim and human in proportion, covered in the same fine short dash-strokes as his neck. On the near hand the THUMB IS VISIBLE and lies OPPOSED across the marble in front of at least one finger - never cropped away, never hidden under the palm. No claws, no talons, no dark nails, no ridged or banded fingertips, no nail-like fingertip texture, no blunt lumpy digits, and never shingled, leaf-shaped or scale-like plates on the hand, arm or shoulder."

STAGING="HE IS NOT HOLDING ANYTHING. Both feathered hands rest FLAT on the marble; the martini STANDS BY ITSELF on the slab in front of him, untouched, and no hand touches its stem or its bowl."

MARBLE="THE PICTURE ENDS AT THE MARBLE. The slab crosses him at mid-chest and runs out of frame at both ends across the FOREGROUND, in front of his chest. Below the slab there is NOTHING: no belt, no buckle, no waistband, no trousers, no hips, no lap anywhere in the picture."

# ---- 19. one drink, with the judges' martini sentence -----------------------
ONEDRINK="THERE IS EXACTLY ONE DRINK IN THE PICTURE: his martini. No rocks glass, no tumbler, no second martini, no second stemmed glass anywhere in the frame, including at the extreme left and right edges. Nothing stands, sits or floats inside the martini glass except one olive on one pick."

LABELS="EVERY BOTTLE LABEL IS AN EMPTY WHITE RECTANGLE: no crest, no medallion, no oval, no scrollwork, no border device, no dots, no scribbles - blank white paper with nothing on it."

LETTERING="THE ONLY LETTERING in the picture is the house name mirrored on the window, complete and correctly spelled: T-H-E on the first line, S-W-I-N-G-I-N-G on the second, D-O-O-R on the third, every letter present and correctly formed. If it cannot be spelled correctly, leave the window glass plain with no lettering at all."

NEG="flat vector shape, ruled straight edge, outlined beak, pasted cut-out, diagram, thin triangular beak, wedge beak, pointed beak, needle beak, stork bill, shoebill, ibis bill, white beak tip, black object stuck on the beak, leaf-shaped feathers, teardrop feathers, shingled feathers, scales, diamond mesh, pinecone texture, reptile skin, heavy brow, furrowed brow, sleepy eye, bored expression, small bead eye, J-shaped neck, hunched neck, head at shoulder level, face among the bottles, portrait on the back bar, figure inside the glass, second glass, rocks glass, bartender, second figure, belt, buckle, trousers"

EXTRA="$EXTRA"
for SEED in "$@"; do
  C:/Python313/python.exe "Z:/ImageGenerator/Cartoon/scripts/cast-study.py" \
    --character drew --seed "$SEED" --out "$OUT" --tag study-drew-r4b \
    --picture1-path "$P1" --picture1-label "$P1LABEL" \
    --picture2-path "$BUST" --picture2-label "$P2LABEL" \
    --pose "$POSE" --negative-extra "$NEG" $EXTRA \
    --extra-edit "$SOLO" --extra-edit "$PEN" --extra-edit "$SHAPE" --extra-edit "$BLACK" \
    --extra-edit "$EYE" --extra-edit "$MOOD" --extra-edit "$FEATHERS" \
    --extra-edit "$NECK" --extra-edit "$WARDROBE" --extra-edit "$HANDS" \
    --extra-edit "$STAGING" --extra-edit "$MARBLE" --extra-edit "$ONEDRINK" \
    --extra-edit "$LABELS" --extra-edit "$LETTERING"
done
