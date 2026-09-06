#!/usr/bin/env bash
# ABBY - ROUND 3 (2026-09-06). local/qwen-image-edit-2511, 4:5 1344x1680,
# fast Lightning 8 steps cfg 1 - the recipe is HELD, exactly as the judges asked.
# Seeds 55 41 7 21 33 44; 55 and 41 first, per the judges' note.
#
# THE THREE REFERENCE CHANGES THIS ROUND, and they are the whole round:
#
# 1. PICTURE 1 IS A FULL PLATE. Rounds 1 and 2 sent a BUST as Picture 1 - the
#    trio.png head crop, then the sc04 head-to-hands crop, tested eleven times.
#    qwen-image-edit copies Picture 1's STAGING, so a bust came back a bust:
#    6 of 6 round-2 renders were portraits on bare paper while the prompt was
#    asking for the counter, both hands and the towel. Picture 1 is now the
#    WHOLE ART FIELD of the published, Rick-accepted sc12-permanent-receipt.png
#    with the caption band cut at y=1498 and the field resized to the house 4:5
#    (scripts/make-abby-picture1-round3.py). It was built and RUN at seed 55 -
#    and it lost, on lettering: sc12 carries a live chyron, a lettered slate and
#    a lettered receipt, and at cfg 1 the model copied all three and invented
#    more ("PPICE GAUES CONES IN AS EXPECTEO"), which INSPECTION.md check 17
#    calls fatal. Picture 1 is therefore canon/plates/trio.png, the APPROVED
#    BLANK PLATE - the SAME construction the judges described (Abby at the far
#    service side, both hands at her work, the counter across her waist, Drew
#    seated frame-left and Barclay frame-right on the near side) with the screen
#    already off, the slate already wiped, every bottle label already blank and
#    no receipt, so its ONLY lettering is the mirrored window name the fence
#    licenses. Cut x 60..1140, y 20..1370 - a true 4:5 that ends at the marble.
#    The sc12 build and its seed-55 render are kept beside these as the evidence.
#
# 2. THE EYE TILE IS DRAWN BY HAND, and it is Picture 3. Every tile in the set
#    carries the failing eye (bust.png, head.png, studies/abby.png all measure
#    above 50% of the opening below L60 with no white at either side of the
#    iris), so a correct eye could never arrive from a reference at any seed.
#    scripts/make-abby-eye-tile.py builds one eye from look-card section 2 and
#    mirrors it for the pair - paper-white at BOTH sides, a radiating mid-grey
#    iris, a round black pupil smaller than the iris, exactly one catchlight
#    high on the iris, a defined upper lid with the lash sweeping up and out.
#    This is Step 5 of the look card and it had been skipped.
#
# 3. canon/vision/studies/abby.png IS DROPPED from this pass. It is the source
#    of both faults the round inherited - the level pursed lip line and the
#    animal eye. kit/bust.png takes Picture 2 and its role line says plainly
#    that it is sent for the COLLAR HARDWARE AND THE BLOUSE ONLY.
#
# TWO FLAGS WERE ADDED TO cast-study.py FOR THIS ROUND (nothing else changed):
#   --keep-duo    stops the SOLO re-pointing of THE STAGE and keeps the fence's
#                 DREW/BARCLAY paragraph. With a full-plate Picture 1 canon's
#                 own staging paragraph already describes that exact plate, and
#                 re-pointing it at one figure is what told the model to throw
#                 the room away.
#   --cast-count  the header line's count of characters; 3, not 1.
#
# THE RULE ROUND 2 PROVED AND THIS ROUND KEEPS: no human noun anywhere in the
# text I control - not human, humanoid, woman, lady, person, man or customer.
# At cfg 1 those words are drawn as nouns. Canon's own fence keeps its wording.
set -eu

PY="C:/Python313/python.exe"
S="Z:/ImageGenerator/Cartoon/scripts/cast-study.py"
OUT="C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/abby/round-3"
SEEDS="${SEEDS:-55 41 7 21 33 44}"

mkdir -p "$OUT"
"$PY" "Z:/ImageGenerator/Cartoon/scripts/make-abby-picture1-round3.py"
"$PY" "Z:/ImageGenerator/Cartoon/scripts/make-abby-eye-tile.py"

P1="${P1:-$OUT/abby-picture1-trio-plate.png}"
EYE="$OUT/abby-eye-tile.png"

P1LABEL="THE PICTURE BEING EDITED, AND IT IS A FINISHED CONSTRUCTION OF THE WHOLE ROOM - not a portrait and not a bust. It is the bar room of The Swinging Door seen from the customer side: ABBY the West Highland White Terrier proprietor stands at the FAR service side of the long marble counter, facing across it, her full upper body in the frame from the top of her ears down through both forearms and both working hands, the counter's far edge crossing her at the WAIST and hiding everything below it; DREW the flamingo sits frame-LEFT and BARCLAY the retriever sits frame-RIGHT at the NEAR side of the same marble, seen from behind, already drawn and already finished; the back bar with its ranked bottles stands behind her, the wall sconce and the panelled wall to the left, the tall window with the house name mirrored on its glass at the far left, and the big blank dark slate above the bottles. OBEY THIS CONSTRUCTION EXACTLY for the room, the counter, the scale, the eye level, the distance, the framing and the occlusion. KEEP THIS CAMERA, THIS CROP, THIS LIGHT and THIS ENGRAVED PEN. DO NOT crop in to a head. DO NOT pull the camera back. DO NOT empty the room."

P2LABEL="A DETAIL TILE OF ABBY'S WARDROBE HARDWARE, and it is sent FOR THE CLOTHING AND THE JEWELLERY ONLY. Copy from this picture ONLY these things: the studded leather collar with its front buckle and its single ring, the one pendant hanging from that ring, the fitted pale blouse falling open at the throat with its lapels apart, and the roll of the sleeve. DO NOT copy its face, DO NOT copy its eyes, DO NOT copy its mouth and DO NOT copy its staging or its crop - the face is built by the EDITS below and the eyes are built from Picture 3."

P3LABEL="THE EYE CHART - the studio's hand-drawn master of ABBY'S PAIR OF EYES, and the ONLY place her eyes come from. It is a diagram, not a scene: do not copy its blank paper, its size or its framing. Build each of her eyes exactly as this chart draws them, the near one large and the far one narrowed by the turn of her head."

E_CHAR="redraw ABBY where she already stands in Picture 1, keeping her exact position, her exact scale and her exact distance behind the counter, and rebuild only her face and her hands to the EDITS below. She keeps the compact groomed West Highland White Terrier head with its SHORT SQUARE MUZZLE and small black nose, both small ears pricked and set wide, the hard white jacket of coat in fine short strokes, and the studded collar and open blouse of Picture 2. DREW and BARCLAY stay exactly as Picture 1 draws them and are not redrawn."

POSE="Abby stands behind the marble on the far service side, mid-task, both hands at her work in front of her chest: the LEFT hand closed round the outside of the bowl of a stemmed glass, the RIGHT hand pressing one end of a folded white towel down inside that bowl. Her head is tipped a little and turned off the lens, her eyes down on her own hands, her mouth a closed smile with both corners lifted. Drew sits frame-left and Barclay frame-right at the near side of the same marble with their backs to the reader, exactly as Picture 1 has them."

E_CONSTRUCTION="OBEY THE CONSTRUCTION OF PICTURE 1. This is a FULL SCENE, edge to edge: the room, the marble counter, the back bar, the sconces and the panelling are all in the finished picture exactly where Picture 1 puts them. Abby is NEVER drawn on bare paper, the background is NEVER blank, and no corner of the paper is left as margin. THE CROP IS NOT A PORTRAIT: her full upper body is in the frame, from the top of her head and ears down through both shoulders, both upper arms, both forearms and BOTH HANDS at the marble counter. NEVER crop above her elbows and NEVER reduce this picture to a head-and-shoulders portrait."

E_OCCLUSION="THE COUNTER CROSSES HER AND HIDES HER. The marble's far edge runs across Abby's body at the WAIST and covers her lower torso and her legs completely - she stands BEHIND the counter and is partly covered by it, so no belt, no waistband and no skirt is anywhere in the picture. DREW and BARCLAY remain VISIBLE, seated at the NEAR side of the same marble and seen from behind, and because she stands while they sit her head is HIGHER IN THE FRAME than either of theirs."

E_EYE="HER EYES ARE BUILT FROM PICTURE 3, THE EYE CHART, AND FROM NOTHING ELSE, and they are the most important thing in the picture. Each eye is a WIDE ALMOND, WIDER THAN IT IS TALL, tilted up at the outer corner, and each opening is AT LEAST AS WIDE AS THE BLACK OF HER NOSE. Inside each opening, in this order: PAPER-WHITE at BOTH SIDES of the iris, the same clean white as the blank paper margin, on the left side and on the right side, never grey and never shaded and never filled in; a MID-GREY IRIS drawn as a circle standing clear of the lids, with FINE RADIATING LINES running from its centre outward so it reads as drawn line work and never as a grey wash; a ROUND BLACK PUPIL at the centre of that iris, plainly SMALLER than the iris and never filling it; EXACTLY ONE small white catchlight, high on the iris; and a defined upper lid with a lash line sweeping UP AND OUT at the outer corner, a soft lower lid below, and two or three fine strokes in a shallow arch above as her brow. BOTH EYES ARE THE SAME SIZE and the SAME SHAPE, set at the SAME HEIGHT, and both are aimed at the same single point. Her eye is NEVER a solid dark disc and NEVER a button."

E_MOUTH="HER MOUTH IS A CLOSED SMILE WITH BOTH CORNERS CLEARLY LIFTED, and both corners are drawn plainly HIGHER than the middle of the lip line, so the smile is unmistakable even when the collar hides her chin. Never a level or neutral closed line, never pursed, never hooked down at either corner, never parted, no gap, no tongue and no teeth."

E_JAW="THE JAWLINE, AND IT IS AN ABRUPT CHANGE. The long groomed show-coat fur on her skull and her cheeks STOPS DEAD IN A CLEAN LINE AT HER JAW. Below that jaw, her throat and her upper chest are covered by SHORT, FINE, CLOSE-LYING white fur that reads as smooth skin. No strand of the long cheek fur crosses down onto the neck: no ruff, no neck-beard, no mane, no tufts, and NO FUR OF ANY KIND inside the open V of her blouse."

E_HEAD="HER HEAD IS THE COMPACT HEAD OF A GROOMED SHOW WESTIE, NOT A LAPDOG HEAD AND NOT A BALL OF FLUFF. Seen from the front the skull and cheek fur make a soft CARROT shape, WIDER at the ears and narrowing to the muzzle. The MUZZLE IS SHORT AND SQUARE-ENDED, its front a flat plane carrying the nose. The forehead is SHALLOW and her eyes sit at the MIDDLE of the head's height, not low under a tall dome of fur. The coat is a HARD JACKET in fine short straight strokes no longer than the width of her nose, lying flat and close. HER HEAD IS NO WIDER THAN HER SHOULDERS. Model her face with delicate shading and carry LESS stipple on her face than on the room, so the white of her face stays luminous. Not puppyish, not a Maltese, not a fox, not any other breed."

E_EARS="BOTH EARS ARE THE SAME SIZE, THE SAME SHAPE and set at the SAME HEIGHT on the skull - small, firmly pricked, carried close-set on top of the head, neither drooping nor one higher than the other."

E_NOSE="HER NOSE IS FLAT SOLID BLACK INK with one clean engraved edge round it, and it is SMALLER than either eye opening. No glossy highlight, no wet shine, no photographic pore texture, no grey modelling inside it."

E_HANDS="BOTH OF HER HANDS ARE IN THE PICTURE AND BOTH ARE WORKING. Two fur-backed TERRIER HANDS, FOUR FINGERS AND ONE OPPOSED THUMB on each, every finger separately drawn, blunt soft pads, NO CLAWS and NO NAILS. The LEFT hand is closed round the OUTSIDE OF THE BOWL of a stemmed glass; the RIGHT hand presses one end of a FOLDED WHITE UNLETTERED TOWEL down INSIDE that bowl. Both forearms run down behind the marble. There is EXACTLY ONE towel in the picture, it is unlettered, and it is the one in her working hand - both her shoulders are therefore BARE and no second towel hangs anywhere."

E_GAZE="HER GAZE GOES DOWN AND STAYS INSIDE THE SCENE. Her eyes travel DOWN to her own hands and the glass she is working; her muzzle follows her eyes down. She NEVER looks out of the picture at the reader and NEITHER EYE POINTS AT THE LENS. Turn her BODY into the frame first and let her head follow, so her face reads in THREE-QUARTER, and keep the count: BOTH eyes are on the paper, the FAR eye at least HALF the width of the near one, with the BRIDGE OF HER MUZZLE showing between them."

E_WEAR="HER COLLAR, HER PENDANT AND HER BLOUSE. The collar is a black leather band carrying ONE ROW OF ROUND DOMED STUDS, EVERY STUD THE SAME SIZE, a buckle at the FRONT and ONE ring below it. From that ring, and from nothing else, hangs ONE TEARDROP gem in a silver bezel ringed with fine beads - widest low, narrowing under a small cusp at the top, closing to a SINGLE POINT at the bottom. Not a round disc, not a heart, not a shield. The BLOUSE IS OPEN TWO BUTTONS: the collar falls open in a soft V with a clear sweep of throat between the lapels. Both sleeves are rolled back to the elbow, and ONE single strand of pearls sits at ONE wrist, on the arm whose sleeve is rolled back, drawn whole. Her figure stays TRIM and athletic, shoulders and hips slim. She has NO TAIL, and NOTHING is lettered anywhere on her."

E_WALLS="THE ROOM STAYS THE ROOM OF PICTURE 1 AND NOTHING IS ADDED TO IT. The picture ENDS AT THE MARBLE: no stools, no chairs, no floor, no legs and no knees are in frame. The back wall carries ONLY the ranked bottle shelves, the one big blank dark slate above them and the panelling; the left wall carries the tall window with the house name mirrored on its glass and the one wall sconce. NO posters, NO framed pictures, NO signs, NO patterned tabletop and NO extra bottles standing on the marble are added anywhere - the marble carries only the nut bowl and the gentlemen's two drinks, and its surface is plain polished stone."

E_NOTEXT="NOTHING IN THIS PICTURE IS LETTERED except the house name mirrored on the window glass. The television is dark and blank, the framed slate is a wiped blank slate, every bottle label is a blank paper panel, and NO printed card, slip, receipt, phone or paper lies on the marble or is held by anyone. No caption, no speech balloon, no typeset word, no signature and no artist mark anywhere."

for SEED in $SEEDS; do
  "$PY" "$S" --character abby --seed "$SEED" --out "$OUT" --tag study-abby-r3 \
    --cast-count 3 --keep-duo \
    --picture1-path "$P1" \
    --picture1-label "$P1LABEL" \
    --picture2-path "Z:/ImageGenerator/Cartoon/canon/characters/abby/kit/bust.png" \
    --picture2-label "$P2LABEL" \
    --ref "$EYE::$P3LABEL" \
    --character-edit "$E_CHAR" \
    --pose "$POSE" \
    --extra-edit "$E_CONSTRUCTION" \
    --extra-edit "$E_OCCLUSION" \
    --extra-edit "$E_EYE" \
    --extra-edit "$E_MOUTH" \
    --extra-edit "$E_JAW" \
    --extra-edit "$E_HEAD" \
    --extra-edit "$E_EARS" \
    --extra-edit "$E_NOSE" \
    --extra-edit "$E_HANDS" \
    --extra-edit "$E_GAZE" \
    --extra-edit "$E_WEAR" \
    --extra-edit "$E_NOTEXT"
done
