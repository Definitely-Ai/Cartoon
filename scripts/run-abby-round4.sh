#!/usr/bin/env bash
# ABBY - ROUND 4 (2026-09-06). THE RECIPE IS HELD, THE REFERENCES CHANGE.
# local/qwen-image-edit-2511, 4:5 1344x1680, fast Lightning 8 steps, cfg 1,
# euler/simple, shift 3.0. cfg 1 is deliberate: round 3 proved it is what keeps
# the lettering out, and the judges said do not raise it. Same six seeds as
# round 3 - 55 41 7 21 33 44 - so this is a clean A/B on references alone.
#
# THE REFERENCE SWAP, WHICH THE JUDGES CALLED THE WHOLE ROUND:
#   PICTURE 1  canon/plates/trio.png cut x60..1140 y20..1370 - UNCHANGED, it
#              earned its place in round 3 (the approved BLANK plate: screen off,
#              slate wiped, every label blank, so nothing to copy as pseudo-text)
#   PICTURE 2  NEW. canon/vision/studies/abby.png and canon/characters/abby/
#              kit/bust.png are DROPPED ENTIRELY - bust.png was still going out
#              as Picture 2 in round 3 and it is where the Bichon came from (the
#              silky long coat, the wide lynx-tufted ears, the open-blouse gape).
#              In their place: the two crops of the plates RICK ACCEPTED, the
#              judges own boxes, sc04 (470,360,820,900) and sc12 (450,350,
#              830,930), laid SIDE BY SIDE INTO ONE TILE.
#   PICTURE 3  the hand-drawn eye chart - UNCHANGED, it earned its place, with a
#              hardened role line: round 3 seed 33 drew the chart INTO the slate.
#
# WHY ONE TILE AND NOT PICTURE 2 + PICTURE 4. The qwen family max_refs is 3
# (backend/providers/local_bridge.py:63, mirrored as MAX_REFS=3 in cast-study.py)
# and the bridge drops extras off the END of the list. A fourth picture would
# have been binned on the wire and the round would have LOOKED like it tested the
# sc12 head without ever having sent it. Both ordered crops therefore travel in
# one tile, sc04 left and sc12 right, and both are genuinely on the wire. Four
# legible bottle labels inside the sc04 crop were blanked to plain paper first -
# round 3 proved at seed 55 that lettering in a reference is copied and then
# elaborated into pseudo-text at cfg 1, which check 17 calls fatal.
#
# THE RULE ROUND 2 PROVED AND THIS ROUND STILL KEEPS: no human noun anywhere in
# the text I control - not human, humanoid, woman, lady, person, man or customer.
# At cfg 1 those words get drawn as nouns.
set -eu

PY="C:/Python313/python.exe"
S="Z:/ImageGenerator/Cartoon/scripts/cast-study.py"
OUT="C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/abby/round-4"
SEEDS="${SEEDS:-55 41 7 21 33 44}"

mkdir -p "$OUT"
"$PY" "Z:/ImageGenerator/Cartoon/scripts/make-abby-eye-tile.py"
"$PY" "Z:/ImageGenerator/Cartoon/scripts/make-abby-round4-tiles.py"

P1="C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/abby/round-3/abby-picture1-trio-plate.png"
P2="$OUT/abby-picture2-accepted-plates.png"
EYE="$OUT/abby-eye-tile.png"

P1LABEL="THE PICTURE BEING EDITED, AND IT IS A FINISHED CONSTRUCTION OF THE WHOLE ROOM - not a portrait and not a bust. It is the bar room of The Swinging Door seen from the customer side: ABBY the West Highland White Terrier proprietor stands at the FAR service side of the long marble counter, facing across it, her full upper body in the frame from the top of her ears down through both forearms and both working hands, the counter far edge crossing her at the WAIST and hiding everything below it; DREW the flamingo sits frame-LEFT and BARCLAY the retriever sits frame-RIGHT at the NEAR side of the same marble, seen from behind; the back bar with its ranked bottles stands behind her, the wall sconce and the panelled wall to the left, the tall window with the house name mirrored on its glass at the far left, and the big blank dark slate above the bottles. OBEY THIS CONSTRUCTION EXACTLY for the room, the counter, the scale, the eye level, the distance, the framing and the occlusion. KEEP THIS CAMERA, THIS CROP, THIS LIGHT and THIS ENGRAVED PEN. DO NOT crop in to a head. DO NOT pull the camera back. DO NOT empty the room. Its drawing of ABBY COAT, HER HEAD, HER EARS and HER MUZZLE is WRONG and is replaced from Picture 2; its drawing of DREW NECK, HIS PLUMAGE and HIS EYE is WRONG and is replaced by the EDITS below."

P2LABEL="THE BREED SHEET - TWO VIEWS OF THE ONE SAME ABBY, cut from the studio own finished published plates, and it is the ONLY authority for how she is BUILT. Copy from it, and copy it exactly: the HARSH SHORT DOUBLE COAT laid in hard straight strokes; the BROAD FLAT-TOPPED skull wider than it is tall; the SMALL HARD-EDGED TRIANGULAR EARS set close together on top of that skull and carried erect in short fur; the SHORT BLUNT RECTANGULAR MUZZLE with its BEARD FRINGE hanging below it; the black studded collar with its pendant; and the pale collared blouse buttoned over a modest chest. DO NOT COPY its eyes, which are built only from Picture 3; DO NOT COPY its open mouth; DO NOT COPY its gaze, which points at the lens and must not; DO NOT COPY its crop, its distance, its background or its lighting. It is a chart of ONE character, not two: the finished picture contains EXACTLY ONE Abby, and the gap down the middle of this tile is NOT drawn - no panel, no border, no gutter, no second figure, no diptych, and this tile NEVER appears as a picture, a poster or a framed thing anywhere in the room."

P3LABEL="THE EYE CHART - the studio hand-drawn master of ABBY PAIR OF EYES, and the ONLY place her eyes come from. It is a diagram, not a scene. Build each of her eyes exactly as this chart draws them, the near one large and the far one narrowed by the turn of her head, and PASTE THEM INTO HER FACE rather than inventing an eye of your own. Do not copy its blank paper, its size or its framing, and NEVER draw this chart, an eye, a diagram or any picture of a face onto the chalkboard, the television, the wall, the window or anywhere else in the room - it is a working chart, not a thing in the bar."

E_CHAR="redraw ABBY where she already stands in Picture 1, keeping her exact position, her exact scale and her exact distance behind the counter, and rebuild her head, her coat, her face and her hands to Picture 2 and the EDITS below. Everything about how she is BUILT comes from Picture 2 - the harsh short coat, the broad flat-topped skull, the small close-set triangular ears, the short blunt muzzle with its beard - and her EYES come from Picture 3 alone. BARCLAY stays exactly as Picture 1 draws him. DREW keeps his exact seat, size, turn and silhouette from Picture 1, and only his neck line, his plumage strokes and his eye are redrawn, by the EDITS below."

POSE="Abby stands behind the marble on the far service side, mid-task, her body turned about twenty degrees away from the lens and her head following that turn, both hands at her work in front of her chest: the LEFT hand closed round the outside of the bowl of a stemmed glass, the RIGHT hand pressing one end of a folded white towel down inside that bowl. Her eyes go LEFT and DOWN, to Drew and to the glass in her own hands, never out of the picture. Her mouth is a closed smile with both corners lifted and the lips touching along their whole length. Drew sits frame-left and Barclay frame-right at the near side of the same marble with their backs to the reader, exactly as Picture 1 has them."

E_CONSTRUCTION="OBEY THE CONSTRUCTION OF PICTURE 1. This is a FULL SCENE, edge to edge: the room, the marble counter, the back bar, the sconces and the panelling are all in the finished picture exactly where Picture 1 puts them. Abby is NEVER drawn on bare paper, the background is NEVER blank, and no corner of the paper is left as margin. THE CROP IS NOT A PORTRAIT: her full upper body is in the frame, from the top of her head and ears down through both shoulders, both upper arms, both forearms and BOTH HANDS at the marble counter. NEVER crop above her elbows and NEVER reduce this picture to a head-and-shoulders portrait."

E_OCCLUSION="THE COUNTER CROSSES HER AND HIDES HER. The marble far edge runs across Abby body at the WAIST and covers her lower torso and her legs completely - she stands BEHIND the counter and is partly covered by it, so no belt, no waistband and no skirt is anywhere in the picture. DREW and BARCLAY remain VISIBLE, seated at the NEAR side of the same marble and seen from behind, and because she stands while they sit her head is HIGHER IN THE FRAME than either of theirs."

E_COAT="HER COAT IS THE HARSH DOUBLE COAT OF A WEST HIGHLAND WHITE TERRIER, AND IT IS THE FAULT OF THE LAST SIX PICTURES. Draw it as SHORT, STRAIGHT, HARD strokes about ONE THIRD the length of the long sweeping hair drawn before, laid in OVERLAPPING TUFTS with DARK TONAL BREAKS between the tufts so the coat reads as hard and broken up, never as one smooth silky sheet. No long silky sweeping hair anywhere on her. No flowing lapdog fringe. She is not a Bichon, not a Maltese, not a lapdog and not a puppy."

E_SKULL="HER HEAD IS A BROAD FLAT-TOPPED CHRYSANTHEMUM, WIDER THAN IT IS TALL, the skull and cheek fur making one broad flat-topped round with the ears standing clear on top of it. HER MUZZLE IS A SHORT BLUNT RECTANGLE, its front a flat plane carrying the nose, with a DISTINCT BEARD FRINGE hanging below it. Never a small round button muzzle, never a tall dome of fur, never a narrow fox face. HER HEAD IS NO WIDER THAN HER SHOULDERS."

E_EARS="HER EARS ARE SMALL HARD-EDGED TRIANGLES SET CLOSE TOGETHER ON TOP OF THE SKULL and carried ERECT, covered in SHORT fur, both the same size, the same shape and at the same height. NEVER large, NEVER wide-set out on the sides of the head, NEVER drooping, and NEVER carrying long tufts or lynx fringes."

E_EYE="HER EYES ARE PASTED IN FROM PICTURE 3, THE EYE CHART, AND FROM NOTHING ELSE, and they are the most important thing in the picture. Each eye is a WIDE ALMOND, WIDER THAN IT IS TALL, tilted up at the outer corner, and each opening is AT LEAST AS WIDE AS THE BLACK OF HER NOSE. Inside each opening: a CLEARLY SEPARATED PAPER-WHITE CRESCENT at the INNER corner AND a second one at the OUTER corner, the same clean white as the blank paper margin, one on each side of the iris, never grey, never shaded, never filled in and never missing on one side; between those two whites a MID-GREY IRIS drawn as a circle FLOATING CLEAR OF THE LID LINE AT BOTH SIDES and TOUCHING NEITHER CORNER, built from FINE RADIATING LINES running from its centre outward so it reads as drawn line work and never as a grey wash; a ROUND BLACK PUPIL at the centre of that iris, plainly SMALLER than the iris and never filling it; EXACTLY ONE small white catchlight, high on the iris; and a defined upper lid with a lash line sweeping UP AND OUT at the outer corner, a soft lower lid below, and two or three fine strokes in a shallow arch above as her brow. BOTH EYES ARE THE SAME SIZE and the SAME SHAPE, set at the SAME HEIGHT, and both are aimed at the same single point. Her eye is NEVER a solid dark disc, NEVER a button and NEVER an iris that fills the whole opening."

E_GAZE="HER GAZE IS AIMED INSIDE THE PICTURE AND NEVER OUT OF IT. Her eyes go to DREW, or to BARCLAY, or DOWN to the glass and the towel in her own hands - one of those three and nothing else. SHE NEVER LOOKS AT THE READER, NEVER AT THE LENS, and NEITHER PUPIL POINTS OUT OF THE PICTURE: both pupils sit LEFT of centre in their openings, toward Drew. Turn her BODY away from the lens FIRST, about twenty degrees, and let her HEAD FOLLOW that turn so her face reads in THREE-QUARTER, and keep the count: BOTH eyes stay on the paper, the FAR eye at least HALF the width of the near one, with the BRIDGE OF HER MUZZLE showing between them. Picture 1 has her looking out at the reader and Picture 2 has it too: BOTH ARE WRONG AND NEITHER IS COPIED."

E_MOUTH="HER MOUTH IS A CLOSED-LIP SMILE. Draw ONE dark lip line curving UP AT BOTH CORNERS, both corners plainly higher than the middle of the line, and THE LIPS TOUCH ALONG THEIR WHOLE LENGTH - there is NO PARTED LIP LINE, NO DARK GAP between the lips anywhere along it, no teeth, no tongue and no open mouth. Never level, never pursed, never hooked down. Picture 2 shows her mouth open: that is NOT copied."

E_JAW="THE JAWLINE, AND IT IS AN ABRUPT STOP. The long groomed fur on her SKULL and her CHEEKS STOPS DEAD IN A CLEAN LINE AT THE JAW. BELOW that jaw, her THROAT and her UPPER CHEST carry ONLY SHORT, FINE, CLOSE-LYING fur that reads as SMOOTH PALE SKIN. NOT ONE of the long cheek strokes continues down onto the throat or the chest: no ruff, no neck-beard, no mane, no bib, no tufts, and NO FUR OF ANY KIND bridges into or sits inside the collar of her blouse. Below the jaw there is a FURRED NECK, and the studded collar sits ON THAT NECK, not down on chest fluff."

E_NOSE="HER NOSE IS FLAT SOLID BLACK INK with one clean engraved edge round it, and it is SMALLER than either eye opening. No glossy highlight, no wet shine, no photographic pore texture, no grey modelling inside it."

E_MODEL="SHADE THE WHITE COAT so her head is a MODELLED SOLID and never a flat white silhouette against the dark back bar: mid grey UNDER THE JAW, mid grey INSIDE THE RUFF, and mid grey ALONG THE FAR SHOULDER, with the light staying on the top of the skull and the bridge of the muzzle. Carry LESS stipple on her face than on the room so the white of her face stays luminous."

E_HANDS="BOTH OF HER HANDS ARE IN THE PICTURE AND BOTH ARE WORKING. Two fur-backed TERRIER HANDS, FOUR FINGERS AND ONE OPPOSED THUMB on each, every finger separately drawn, blunt soft pads, NO CLAWS and NO NAILS. The LEFT hand is closed round the OUTSIDE OF THE BOWL of a stemmed glass; the RIGHT hand presses one end of a FOLDED WHITE UNLETTERED TOWEL down INSIDE that bowl. Both forearms run down behind the marble. There is EXACTLY ONE towel in the picture, it is unlettered, and it is the one in her working hand - both her shoulders are therefore BARE and no second towel hangs anywhere."

E_WEAR="HER COLLAR, HER PENDANT AND HER BLOUSE, and this overrules every other description of them. The collar is a HEAVY SOLID BLACK STUDDED LEATHER BAND, drawn BLACK against the white coat, carrying one row of round domed studs all the same size, a buckle at the front and ONE ring below it; from that ring, and from nothing else, hangs ONE SMALL DARK HEART PENDANT. Her blouse is a PALE COLLARED SHIRT BUTTONED TO THE SECOND BUTTON with the sleeves ROLLED TO THE ELBOW, worn over a MODEST chest: NO open gape, NO cleavage line, NO shading or shadow line between the breasts, no plunge and no bare sternum. ONE single strand of pearls sits at ONE wrist, drawn whole. Her figure stays TRIM and athletic. She has NO TAIL, and NOTHING is lettered anywhere on her."

E_DREW_PLUMAGE="DREW PLUMAGE IS DOWN, NOT ARMOUR, and this is a fault carried in from Picture 1. Every feather on his NECK and his BODY is drawn as a FINE INDIVIDUAL DOWNY DASH-STROKE laid in the direction the feather grows, thousands of separate short strokes lying along the form. NOWHERE on the neck or the body is there an OVERLAPPING SCALE, a SCALLOP, a LEAF, a shingle, a fish scale or a PANGOLIN PLATE - no repeating rounded overlapping shapes of any kind. If Picture 1 draws his neck in scales, that is WRONG and it is redrawn in dashes."

E_DREW_NECK="DREW NECK CARRIES ONE CLEAR S-CURVE WITH A SINGLE REVERSAL: CONCAVE where it leaves the shoulders, then turning over into CONVEX as it rises to the head, so the line changes direction exactly ONCE. It is NOT one unbroken hook, NOT a single C-bend and NOT a smooth arc running straight down into the bill. The neck is long, high and slender."

E_DREW_EYE="DREW EYE IS A HEAVY-LIDDED EYE THAT READS WARM AND HUGGABLE: a visible WHITE at each side of a distinct DARK IRIS with one catchlight, a SOFT HEAVY UPPER LID coming down over the top of that iris with a LASH LINE along it, and a lower lid below. It is NOT a small flat lidless bird eye, NOT a bead and NOT a dot in bare skin."

E_BACKBAR="DRAW THE BACK BAR AS FINE WOOD GRAIN, not as coarse dark crosshatch: the shelf boards and the panelling carry long fine grain lines with the shelves reading as polished walnut, and the ranked bottles stand on them as LEGIBLE BOTTLE SILHOUETTES in CLEAR GLASS, each shoulder, neck and stopper drawn, the liquid line showing through, filled to different levels. The wall behind them stays dark but stays READABLE - never a black scribbled mass."

E_EDGE="CARRY THE DRAWING TO A CLEAN STRAIGHT EDGE ON ALL FOUR SIDES. The picture is a full rectangle, inked corner to corner and cut square at the border - NO torn edge, NO spiked or feathered hatch fringe, NO vignette, NO ragged deckle and NO white margin at the top, the bottom, the left or the right."

E_NOTEXT="NOTHING IN THIS PICTURE IS LETTERED except the house name mirrored on the window glass. The television is dark and blank, the framed slate is a wiped BLANK slate carrying NO words AND NO picture, drawing, face or diagram of any kind, every bottle label is a blank paper panel, and NO printed card, slip, receipt, phone or paper lies on the marble or is held by anyone. No caption, no speech balloon, no typeset word, no signature and no artist mark anywhere."

for SEED in $SEEDS; do
  "$PY" "$S" --character abby --seed "$SEED" --out "$OUT" --tag study-abby-r4 \
    --cast-count 3 --keep-duo \
    --picture1-path "$P1" \
    --picture1-label "$P1LABEL" \
    --picture2-path "$P2" \
    --picture2-label "$P2LABEL" \
    --ref "$EYE::$P3LABEL" \
    --character-edit "$E_CHAR" \
    --pose "$POSE" \
    --extra-edit "$E_CONSTRUCTION" \
    --extra-edit "$E_OCCLUSION" \
    --extra-edit "$E_COAT" \
    --extra-edit "$E_SKULL" \
    --extra-edit "$E_EARS" \
    --extra-edit "$E_EYE" \
    --extra-edit "$E_GAZE" \
    --extra-edit "$E_MOUTH" \
    --extra-edit "$E_JAW" \
    --extra-edit "$E_NOSE" \
    --extra-edit "$E_MODEL" \
    --extra-edit "$E_HANDS" \
    --extra-edit "$E_WEAR" \
    --extra-edit "$E_DREW_PLUMAGE" \
    --extra-edit "$E_DREW_NECK" \
    --extra-edit "$E_DREW_EYE" \
    --extra-edit "$E_BACKBAR" \
    --extra-edit "$E_EDGE" \
    --extra-edit "$E_NOTEXT" \
    ${EXTRA_ARGS:-}
done
