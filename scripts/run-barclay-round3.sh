#!/usr/bin/env bash
# BARCLAY - ROUND 3 (2026-09-06). Six seeds on the house model through
# scripts/cast-study.py, answering the judges' round-2 list.
#
# THE REFERENCES ARE REBUILT FIRST by scripts/make-barclay-round3-tiles.py -
# read its docstring for the measurements. In short, against round 2:
#
#   PICTURE 1  still duo.png cropped (620,600,580,725), so the camera, the room
#              and the light are unchanged - but (a) the cocktail pick is no
#              longer a light patch: the column it hung in is rebuilt by row-wise
#              interpolation so the rim ellipse and the liquid line run straight
#              through, and the cherry is re-seated DOWN INSIDE the drink below
#              the liquid line; (b) the head is replaced by a FULL THREE-QUARTER
#              at full size - mirrored so the muzzle points frame-left, scaled
#              crown-to-jaw to the plate's own 300 px, seated crown-on-crown and
#              nose-on-nose; (c) the pale bushy lobe of the plate's old profile
#              ear that stuck out past it is gone, rebuilt from the back bar's
#              own slat panelling tiled down; (d) the halo round the skull is
#              gone - the head is cut by finding the kit sheet's PAPER (bright
#              AND locally flat) rather than by a hand polygon, then eroded 3 px
#              so the seam sits inside the fur.
#
#              DEVIATION FROM THE LETTER OF THE NOTE, allowed by its own PROCESS
#              line. The judges asked for the re-cut Picture 2 head to be pasted
#              in "turned further into the room than it is now" - which pasting
#              it cannot do, since that is the same shallow turn round 2 pasted
#              and the model flattened. The escalation the note authorises is
#              taken: the three-quarter is borrowed from canon's only true
#              three-quarter of Barclay with both eyes whole and the mouth
#              closed, canon/characters/dog/kit/head.png. It is graphite, so the
#              prompt says outright that Picture 1's head is a rough paste-up
#              whose ANGLE and PLACEMENT are law and whose QUALITY is not.
#
#   PICTURE 2  re-cut (70,0,720,730) instead of (330,100,690,700), which had
#              sliced the nose tip off at the tile edge. Whole head, air all
#              round, both ears, both lifted inner brows and the whole flag pin
#              inside it with margin. The study's own raised glass and stirrer,
#              which that taller cut catches in the corner, is rebuilt from the
#              picture's own paper and jacket weave 104 px higher - no paint-out.
#
#   PICTURE 3  sc07 is dropped: its mouth is OPEN, which fought EDIT 3, and its
#              tile carried a flat grey block over two lettered labels. All
#              twelve retired plates were read; sc01 is the one that crops tight
#              on a CLOSED mouth with the lettered shelf row entirely above the
#              crop. (620,818,420,344). The single label inside it, ACE RESERVE,
#              is removed with engraved bottle-glass cloned from the same
#              bottle's shoulder - never a block.
#
# ONE CONTRADICTION IN THE NOTE, resolved and flagged. The list asks both for an
# iris "pressed against the FRONT corner of the eye opening only, filling no more
# than the front 40%" and, later, for an iris "sitting near the CENTRE of the
# eye, not jammed into the corner", with "both pupils pointing at the same spot
# in the room". Those cannot both be drawn. The later one is the one consistent
# with the pose this round exists to get - a head turned INTO the room, looking
# into it - so EDIT 2 takes the wide-open centred eye and keeps from the earlier
# line the parts that do not conflict: paper-white showing clearly around a small
# dark iris, and exactly one catchlight punched inside the dark.
set -eu

PY="C:/Python313/python.exe"
S="Z:/ImageGenerator/Cartoon/scripts/cast-study.py"
OUT="C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/dog/round-3"

P1="$OUT/p1-barclay.png"
P2="$OUT/p2-barclay.png"
P3="$OUT/p3-barclay.png"

P1LABEL="THE STAGING AND THE POSE. This strip's own APPROVED plate, cropped to BARCLAY the golden retriever gentleman ALONE at the marble counter of The Swinging Door, chest-up, the panelled back bar behind him, his short rocks glass on the slab. KEEP ALL OF IT: this camera, this distance, this crop, THIS HEAD ANGLE, this closed mouth, this light, this room and this engraved pen. HIS HEAD HERE IS A ROUGH PASTE-UP: keep its ANGLE and its PLACEMENT exactly and redraw it at Picture 2's quality and in Picture 3's ink. This IS the picture being edited; the edits below only redraw him more beautifully in the same place."

P2LABEL="THE CHARACTER, HIS HEAD ANGLE AND HIS QUALITY. Barclay, the studio's official portrait, whole head with air round it - copy THIS dog feature for feature: the head carried in a TRUE THREE-QUARTER with BOTH eyes whole and open, the two raised inner brows, the long refined muzzle, the closed mouth whose corner hooks up, the drop ears, the modest ruff, the pale open collar showing on both sides of the neck, the dark jacket, and the USA flag pin on the near lapel with its dark canton, its pale stars and its alternating bars. The finished Barclay must be indistinguishable from this one."

P3REF="$P3::THE INK. A head of Barclay at full detail in the house's true engraving pen - the SOLID TRUE-BLACK nose, the heavy TRUE-BLACK lip line running forward under the eye, the arcing rows of muzzle freckles, the drop-ear leather with its long wavy fringe, the paper-white in the eye, and the coat laid in long layered directional strokes. Copy the WEIGHT AND COLOUR OF THE INK from this picture. Its head is in profile and its background is a different corner of the room; take NEITHER."

E1="HOLD PICTURE 1'S HEAD ANGLE EXACTLY - HIS HEAD IS TURNED A FULL THREE-QUARTER INTO THE ROOM, toward DREW at the far end of the counter and not down the shelf of bottles. Draw the FAR eye as a COMPLETE OPEN EYE with its own upper lid, its own paper-white, its own dark iris and its own brow above it, AT LEAST TWO-THIRDS the width of the near eye, and set it OFF the muzzle - the bridge of the muzzle passes BELOW it, never under it. The far cheek shows a full finger's width of fur beyond the bridge. Both pupils point at the same spot in the room. If you cannot draw the far eye whole, turn the head further until you can. The back of his skull is NEVER the nearest part of him to the reader."

E2="BOTH EYES ARE WIDE OPEN AND HUMAN: a full rounded almond with plenty of PAPER-WHITE showing both in front of and behind a SMALL DARK IRIS that sits near the CENTRE of the opening - never jammed into a corner, never filling the whole opening - with ONE small white catchlight punched inside the dark. The upper lid is a THIN LIGHT LINE and never a heavy black hood. He is not sleepy and not sly. ALL of the worry lives in TWO RAISED INNER BROWS: draw a distinct pale dome above each eye with a short soft brow arc lifting at its inner end, exactly as in Picture 2. No wrinkle stands in for a brow."

E3="THE MOUTH STAYS CLOSED AND THE LIP-LINE IS ONE UNBROKEN FINE TRUE-BLACK BAND. No teeth, no tongue, no gap, no open jaw. The band starts at its hook at the mouth corner and runs FORWARD along the top of the muzzle, unbroken, ending DIRECTLY UNDER THE FRONT (nasal) CORNER OF THE NEAR EYE - no gap of plain fur between the end of the band and the eye. It stays a fine line while the mouth is closed, never a grey smile crease, and there is no detached tick, comma, dot or dash anywhere near the mouth."

E4="THE NOSE IS SOLID TRUE BLACK - the blackest mark in the picture - but MODEST AND NEATLY MODELLED, a black wedge with one clean pinpoint highlight on its top plane, never a large round bulb, never a grey bead, never a broad glossy shine and never a cast shadow beneath it. The muzzle it sits on is LONG and refined."

E5="EACH DROP EAR IS A SEPARATE HANGING LEATHER: a flat lobe of SHORT fur with a clean drawn contour, rooting level with the top of the eye and finishing level with the bottom of the jaw, drawn dark against the cheek where it folds, with a LONG WAVY FRINGE of individual strokes along its lower and back edge, and LIFTING CLEAR OF THE SHOULDER so a line of background shows between the ear tip and the jacket. No ear merges into the collar, the ruff or the jacket, and no ear is a woolly slab or a scribble filling a shape."

E6="THE COAT IS LAID IN LONG LAYERED DIRECTIONAL STROKES THAT FOLLOW THE FORM - sweeping back over the skull, down the cheek and fanning out through the ruff, lengthening and darkening in the ruff, shortening and fining on the muzzle, with the white of the paper showing between them. It is NEVER a uniform field of short spiky dashes all of one length and one direction. FIFTEEN TO TWENTY FRECKLES IN THREE CLEAR ARCING ROWS sweep back from behind the nose across the near side of the muzzle, largest nearest the nose, fading to pinpricks toward the eye."

E7="HIS HAND IS A FUR-BACKED HAND WITH FOUR SEPARATE FINGERS AND AN OPPOSED THUMB. Each finger keeps its OWN OUTLINE and its own knuckle even in a closed grip, curled round the glass with the thumb visible on the reader's side; the back of the hand is in short layered fur; a WRISTWATCH with a dark band sits on the wrist where the sleeve ends. It is NEVER a fused mitten, a blob or a paw stump, and there is NOT ONE nail or claw at any fingertip."

E8="THE GLASS RIM IS ONE UNBROKEN ELLIPSE and NOTHING crosses it, sits on it or rises above it. The dark cherry lies DOWN INSIDE the glass, fully BELOW the liquid line, resting against the single large clear ice cube at the bottom with its whole round shape surrounded by liquid. There is NO pick, skewer, stirrer, straw, olive, stem or tail anywhere in or above the glass."

E9="THE WARDROBE. The pale open collar shows on BOTH sides of the neck as two clean white points against the dark jacket, with the shirt front visible below the ruff; the near lapel, the far lapel and the shoulder seam are all drawn and the dark jacket is hatched in a visible woven weave, never one solid black mass. THE USA FLAG PIN is on the NEAR LAPEL ONLY, at chest height, small but LEGIBLE: a solid dark canton in its upper hoist corner with pale stippled stars inside it, alternating pale and dark stripes filling the rest, and a fine staff along the hoist edge. Never a blank rectangle, never a scribble without a canton, never oversized. There is NO other pin, badge, bar, patch, label or pale rectangle anywhere on him - not on the far shoulder, not behind or on any ear, not on the muzzle, not in the background."

E10="THE RUFF IS CAPPED AT NO MORE THAN ONE THIRD OF HEAD HEIGHT so the open shirt collar stays visible on BOTH sides of the neck, and the far eye keeps its own catchlight. The ruff is drawn as strokes, never as a bib or a mane that swallows the collar."

E11="NOTHING LETTERED AND NOTHING BLANK. There is NO lettering, no pseudo-writing and no scribble that resembles text anywhere, and NO blank white or grey rectangle anywhere: EVERY bottle label is a smooth EMPTY PAPER PANEL, the television is dark glass and the chalkboard is bare slate. The marble is PALE STONE with a few long soft grey veins - never a crazed, cracked or shattered crackle field."

E12="PULL BACK TO PICTURE 1'S DISTANCE. His head takes NO MORE THAN A THIRD of the picture's height; his shoulders, both lapels and the front of the jacket stay in frame; do not push in closer."

E13="EXACTLY ONE CHARACTER IS IN THIS PICTURE. The back bar holds ONLY bottles and glassware - no second dog, no bird, no figurine, statuette, bottle-topper, decanter stopper or framed portrait of any animal or person, on the shelves, the panelling or the back bar. ABSOLUTELY NO TAIL. No stray contour crosses his cheek: no line runs from behind the eye back toward the ear, and there is no crease, scar or fold on the side of his head."

E14="THE ROOM CLOSES UP BEHIND HIS HEAD. Picture 1 carries a faint pale seam, a soft bloom and a patch of blurred panelling around his skull and behind his ear where the head was set into the plate. Draw the BACK BAR CONTINUING BEHIND HIM there - shelf, bottles and dark slat panelling running straight on, in the same crisp engraved line as the rest - with a clean drawn contour where his fur meets it. NO glow, NO halo, NO aura, NO vignette, NO blur and no soft grey smear anywhere around him."

POSE="Barclay sits alone at the marble with his old fashioned in front of him, his head turned FORWARD INTO THE ROOM in a full three-quarter toward Drew at the far end of the counter, both eyes whole and on the reader's side of his muzzle, worried-earnest with the worry only in his two raised inner brows, one fur-backed hand curled round the glass."

for SEED in "$@"; do
  "$PY" "$S" --character barclay --seed "$SEED" --out "$OUT" \
    --picture1-path "$P1" --picture1-label "$P1LABEL" \
    --picture2-path "$P2" --picture2-label "$P2LABEL" \
    --ref "$P3REF" \
    --pose "$POSE" \
    --extra-edit "$E1" --extra-edit "$E2" --extra-edit "$E3" --extra-edit "$E4" \
    --extra-edit "$E5" --extra-edit "$E6" --extra-edit "$E7" --extra-edit "$E8" \
    --extra-edit "$E9" --extra-edit "$E10" --extra-edit "$E11" --extra-edit "$E12" \
    --extra-edit "$E13" --extra-edit "$E14" \
    --tag study-barclay-r3
done
