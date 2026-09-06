#!/usr/bin/env bash
# BARCLAY - ROUND 2 (2026-09-06). Six seeds on the house model, through
# scripts/cast-study.py, answering the judges' round-1 list.
#
# WHAT CHANGED AGAINST ROUND 1 - REFERENCES (built by
# scripts/make-barclay-picture1-round2.py, see its docstring for the evidence):
#
#   PICTURE 1  ROUND 2b. Round 2a's seed 41 (kept in 2a-picture1-from-duo-barclay/)
#              proved two things. The model copies Picture 1's GEOMETRY and takes
#              only surface identity from the later tiles, so the head turn named
#              in EDIT 1 and drawn in Picture 2 simply did not happen. And
#              duo-barclay.png is, per canon/plates/README.md, the SPEAKER VARIANT
#              - 'the plate with one mouth open' - so cutting Picture 1 from it as
#              the judges asked handed the model an open mouth it then drew.
#              Picture 1 is therefore now p1b-barclay.png from
#              scripts/make-barclay-picture1-round2b.py: the duo.png crop
#              (620,600,580,725), mouths closed, the cocktail pick painted out of
#              the rocks glass, and the near-profile head REPLACED by the
#              three-quarter head from canon/vision/studies/barclay.png, scaled to
#              the plate's own 310 px crown-to-jaw and tone-matched into it. The
#              pose is DRAWN, not prompted.
#
#   PICTURE 1  (2a, superseded) was duo.png crop (640,620,560,700).
#              now a PRE-COMPOSITED file: duo-barclay.png crop (620,600,580,725)
#              with the COCKTAIL PICK PAINTED OUT of the rocks glass. The judges
#              named duo-barclay.png as the fix for the head turn on the grounds
#              that it shows a true three-quarter; measured side by side it does
#              NOT - duo.png, duo-barclay.png and all twelve showcase plates draw
#              the same left-facing near-profile, and duo-barclay.png is also
#              OPEN-mouthed where duo.png was closed. The file is honoured, the
#              head turn is moved to Picture 2, and the open mouth is answered by
#              EDIT 3. The pick is removed in the pixels because round 1 proved
#              the model copies Picture 1's props no matter what the prompt says.
#
#   PICTURE 2  was canon/vision/studies/barclay.png whole, and round 1's EDIT 5
#              told the model to take NOTHING of its staging - which is what
#              killed the head turn, because that tile is the ONE picture in
#              canon that draws him in a true three-quarter with BOTH eyes whole,
#              a closed mouth with a lifted corner, lifted inner brows and a
#              LEGIBLE flag pin. It is now cut chest-up (330,100,690,700) so the
#              belt, the trousers and the raised glass are simply out of frame,
#              and EDIT 1 tells the model to take the head angle FROM it.
#
#   PICTURE 3  was canon/characters/dog/kit/head.png. DROPPED - the judges are
#              right that it is a soft graphite portrait whose nose is mid-grey
#              and whose lip line is a grey curve, contradicting the edit that
#              names a true-black lip line. Replaced by a head crop of
#              canon/showcase-retired/sc07 (715,820,420,420), true engraving:
#              solid black nose, heavy black lip band, layered directional fur,
#              drop-ear leather with fringe. Its two lettered shelf labels are
#              blanked in the tile so the study still letters nothing.
set -eu

PY="C:/Python313/python.exe"
S="Z:/ImageGenerator/Cartoon/scripts/cast-study.py"
OUT="C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/dog/round-2"

P1="$OUT/p1b-barclay.png"
P2="$OUT/p2-barclay.png"
P3="$OUT/p3-barclay.png"

P1LABEL="THE STAGING AND THE POSE. This strip's own APPROVED plate, cropped to BARCLAY the golden retriever gentleman ALONE at the marble counter of The Swinging Door, chest-up, the panelled back bar and its bottles behind him, his short rocks glass on the slab - with his head already turned round into the room in a TRUE THREE-QUARTER, both eyes whole, mouth closed. KEEP ALL OF IT: this exact camera, this distance, this crop, THIS HEAD ANGLE, this closed mouth, this light, this room and this engraved pen. This IS the picture being edited; the edits below only redraw him more beautifully in the same place."

P2LABEL="THE CHARACTER AND HIS HEAD ANGLE. Barclay, the studio's official portrait, cut chest-up - copy THIS dog: the head carried in a TRUE THREE-QUARTER with BOTH eyes whole and open, the lifted inner brows, the closed mouth whose corner hooks up, the drop ears, the modest ruff, the pale open collar showing on both sides of the neck, the dark jacket, and the USA flag pin on the lapel with its dark canton, its pale stars and its alternating bars. The finished Barclay must be indistinguishable from this one, and HIS HEAD IS TURNED THE SAME AMOUNT AS IT IS HERE."

P3REF="$P3::THE INK. A head of Barclay at full detail in the house's true engraving pen - the SOLID TRUE-BLACK nose, the heavy TRUE-BLACK lip line, the three arcing rows of muzzle freckles, the drop-ear leather with its long wavy fringe, the paper-white in the eye, and the coat laid in long layered directional strokes. Copy the WEIGHT AND COLOUR OF THE INK from this picture. Its mouth is open and its background is a different corner of the room; take NEITHER."

E1="HOLD PICTURE 1'S HEAD ANGLE EXACTLY. He is already turned out of profile into a TRUE THREE-QUARTER facing forward into the room toward DREW at the far end of the counter - not down the shelf of bottles behind the bar - and he stays that way. BOTH EYES ARE DRAWN AND WHOLE, the far eye at least half the width of the near eye, BOTH PUPILS AIMED THE SAME WAY into the room; the FAR BROW is drawn too, the far cheek shows a finger's width beyond the bridge of the muzzle, and the back of his skull is NEVER the nearest part of him to the reader. Do not turn him back toward the bottles."

E2="HIS GLASS IS A SHORT ROCKS GLASS HOLDING ONE LARGE CLEAR ICE CUBE AND ONE DARK STEMLESS CHERRY RESTING IN THE AMBER LIQUID. There is NO cocktail pick, NO skewer, NO stirrer, NO straw, NO olive and NO stem anywhere in or above the glass, and nothing rises above its rim. The cherry sits down in the drink beside the cube."

E3="THE MOUTH STAYS CLOSED AND THE LIP-LINE IS ONE UNBROKEN TRUE-BLACK STROKE. No teeth, no tongue, no gap, no open jaw anywhere - Picture 3's mouth is open and that is the one thing not to take from it. The lip line is as black and as heavy as the nose: it runs the full two nose-widths from directly under the BACK of the black nose along the muzzle to directly under the FRONT CORNER OF THE NEAR EYE and turns up there in a small rounded hook that JOINS the line and lifts ABOVE the line's middle. It is never a grey smile crease, and there is no detached tick, comma, dot or dash anywhere near the mouth."

E4="THE NOSE IS SOLID TRUE BLACK - the blackest mark in the whole picture, a matte black mass with at most one pinpoint of white on its top plane. Never a grey bead, never a broad glossy highlight, never a cast shadow beneath it."

E5="THE INNER BROW ENDS LIFT AND THE EYES ROUND OPEN. A clear pale wedge of raised skin sits over the inner corner of each eye with two or three fine crease strokes above it; each eye opening ROUNDS OPEN so the upper lid clears the top of the iris and the paper-white shows BOTH in front of and behind the dark, with one bright catchlight punched inside the dark. He reads kind and a little concerned - never half-lidded, sleepy or sly."

E6="THE DROP EAR IS A LEATHER, NOT A FLEECE. A flat lobe of SHORT fur with a clean drawn contour edge, no wider than his muzzle is long, rooting level with the TOP of the eye and its tip finishing level with the BOTTOM of the jaw, with a separate curtain of LONG WAVY FRINGE strokes hanging from its BACK edge and running on down the nape. Every stroke on the fringe is a fine individual directional stroke at the same density as the muzzle and the skull - never a woolly slab, never vertical scribble filling the ear shape, never a mass denser than the face."

E7="THE COAT IS LAID IN LONG CURVED FEATHERED STROKES OF DIFFERENT LENGTHS that follow the form - long and sweeping down the nape and the ruff, short and fine on the muzzle and around the eye - with the white of the paper showing between them. No part of him is filled with short even parallel ticks all of one length and one direction. FIFTEEN TO TWENTY FRECKLES IN THREE CLEAR ARCING ROWS sweep back from behind the nose across the near side of the muzzle, largest nearest the nose and fading to pinpricks toward the eye - never a single random clump."

E8="THE WARDROBE. The PALE SHIRT COLLAR SHOWS ON BOTH SIDES OF HIS NECK with the modest ruff between them; the near lapel, the far lapel and the jacket's shoulder seam are all drawn, and the dark jacket is hatched in a visible woven weave - never one solid black mass - with the wristwatch on his left wrist. THE USA FLAG PIN sits on his LEFT lapel, the near one, at chest height, and is the ONLY badge on him: a legible dark canton bearing pale stippled stars in its upper corner, alternating light and dark bars filling the rest of the pin, and a fine staff along the hoist dropping slightly below the flag. NEVER a blank triangle or shield, never on the right lapel, never on the shoulder or the sleeve, and no pocket square."

E9="PULL BACK TO PICTURE 1'S DISTANCE. His head takes NO MORE THAN A THIRD of the picture's height; his shoulders, both lapels and the front of the jacket stay in frame; do not push in closer. The marble reads as ONE BROAD BAND OF POLISHED STONE in fine parallel grain with soft grey veining, crossing him at mid-chest - never a crazed, cracked or shattered white surface."

E10="NOTHING ANTHROPOMORPHIC AND NOTHING LETTERED IN THE BACKGROUND. The back bar holds ONLY bottles and glassware: NO second dog, no figurine, statuette, bottle-topper, decanter stopper or framed portrait of any animal or person, on the shelves, the panelling or the back bar. EXACTLY ONE character is in this picture. EVERY BOTTLE LABEL IS AN EMPTY PAPER PANEL - no scribbles, no crests, no medallions, no engraved seals, no mark anywhere that resembles writing."

E11="NO STRAY CONTOUR CROSSES HIS CHEEK. There is no line running from behind the eye back toward the ear, and no crease, scar or fold anywhere on the side of his head. ABSOLUTELY NO TAIL. His hands are broad and fur-backed with soft pads and NOT ONE nail or claw at any fingertip."

E12="THE ROOM CLOSES UP BEHIND HIS HEAD. Picture 1 carries a faint pale seam and a soft light bloom around his skull and along the top of his muzzle where his head was set into the plate. Draw the BACK BAR CONTINUING BEHIND HIM there - shelf, bottles and dark panelling running straight on - with a clean drawn contour where his fur meets it. NO glow, NO halo, NO aura, NO vignette and NO soft blur anywhere around him, and every edge of him is a drawn engraved line."

POSE="Barclay sits alone at the marble with his old fashioned in front of him, his head turned FORWARD INTO THE ROOM toward Drew at the far end of the counter, both eyes on the reader's side of his muzzle, worried-earnest with the worry only in his raised inner brows, one fur-backed hand resting on the slab beside the glass."

for SEED in "$@"; do
  "$PY" "$S" --character barclay --seed "$SEED" --out "$OUT" \
    --picture1-path "$P1" --picture1-label "$P1LABEL" \
    --picture2-path "$P2" --picture2-label "$P2LABEL" \
    --ref "$P3REF" \
    --pose "$POSE" \
    --extra-edit "$E1" --extra-edit "$E2" --extra-edit "$E3" --extra-edit "$E4" \
    --extra-edit "$E5" --extra-edit "$E6" --extra-edit "$E7" --extra-edit "$E8" \
    --extra-edit "$E9" --extra-edit "$E10" --extra-edit "$E11" --extra-edit "$E12" \
    --tag study-barclay-r2
done
