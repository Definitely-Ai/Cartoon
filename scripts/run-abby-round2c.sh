#!/usr/bin/env bash
# ABBY - ROUND 2, THE PASS THAT SHIPS (2026-09-06). Same recipe as round 1:
# local/qwen-image-edit-2511, 4:5 1344x1680, fast Lightning 8 steps cfg 1.
#   SEEDS="55 7 41 21 33 44"   default
#   P3=on                      hang the sc04 staging tile on as Picture 3
#   OUT=<dir>                  where the renders land
#
# WHAT WAS TESTED AND WHAT IT COST, because the lead's root-cause call did not
# survive contact and the next lead needs the measurements:
#
#   THE CALL: "REPLACE PICTURE 1 with a crop of sc04, box 470,345,345,680 - one
#   swap teaches distance, hands, counter, gaze-down, closed mouth and breed."
#
#   EIGHT RENDERS SAY NO. With that crop as Picture 1, at the recorded recipe:
#     * 6 seeds, judges' wording verbatim  -> 6/6 a HUMAN plus a real four-
#       legged terrier, the bar gone, blank sketchbook paper.
#     * 2 seeds, every human noun purged   -> 2/2 the same split, bar still gone.
#     * 2 seeds, re-cut WIDE to the house 4:5 shape (440,345,544,680, Barclay
#       and the lettered envelope painted out) -> 2/2 the same split again;
#       seed 7 drew TWO terriers side by side.
#   Aspect was not it. The sc04 crop shows Abby HEAD TO HANDS: a terrier head on
#   an upright torso in a blouse with two arms and two hands. At cfg 1 the model
#   takes that apart along the seam it already wants to cut - torso to a person,
#   head to a pet - and the richer the torso in Picture 1, the cleaner the cut.
#   The round-1 tile (trio.png 486,470,360,450) is a HEAD, and a head offers the
#   model nothing to split off. Picture 1 goes back to the shipped crop.
#
#   The tiles built for the attempt are kept beside the renders as
#   abby-picture1-sc04-clean.png (345x680) and abby-picture1-sc04-wide.png
#   (544x680, house shape) - both are good pictures and P3=on hangs the wide one
#   on the end as a STAGING-ONLY third tile, which is the one use of it that
#   does not hand the model a torso to mistake for Picture 1.
#
# WHAT IS KEPT FROM THE JUDGES' LIST: all of it, restated in terrier nouns.
# THE ONE ABSOLUTE RULE: no human noun anywhere in the prompt I control - not
# human, humanoid, woman, lady, person, man or customer. Round 1's own
# diagnostic proved those words are read as nouns at cfg 1 and get drawn, and
# run-abby-round2.sh proved it again by putting them back.
#
# EDIT ORDER, and it is not the lead's. The lead asked for the measured frame at
# 6 and the back-bar count at 12. At eight steps the tail of a fourteen-item
# list is not read, and after the negation list was replaced the ROOM started
# falling out of the picture - blank paper behind her in the diagnostic's seed 7
# and in every sc04 render. So the room is stated positively and EARLY, and the
# count of living figures goes first:
#   5  THE BUSINESS - both hands, promoted out of the tail as the judges asked
#   6  one upright terrier, one pair of hands, and they are hers
#   7  the measured frame (the lead's wording, one slot later)
#   8  the room reaches all four edges and all four corners
#   9  the eye in five parts, with the brow arch and the radiating iris
#  10  the gaze down and off the lens, with the far-eye count
#  11  the one towel and the counter at her waist
#  12  the breed - carrot skull, square muzzle, shallow forehead, two fur lengths
#  13  collar, teardrop, blouse open two buttons
set -eu

PY="C:/Python313/python.exe"
S="Z:/ImageGenerator/Cartoon/scripts/cast-study.py"
OUT="${OUT:-C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/abby/round-2}"
SEEDS="${SEEDS:-55 7 41 21 33 44}"
P3="${P3:-off}"
WIDE="C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/abby/round-2/abby-picture1-sc04-wide.png"

mkdir -p "$OUT"

P1LABEL="THE PICTURE BEING EDITED. ABBY the West Highland White Terrier proprietor, behind the marble counter of The Swinging Door on the FAR SERVICE SIDE, the panelled back bar and its bottle shelves behind her. ONE FIGURE STANDS IN THIS PICTURE AND SHE IS A TERRIER. KEEP THIS ROOM, THIS CAMERA, THIS EYE LEVEL, THIS LIGHT and THIS ENGRAVED PEN, and keep WHO SHE IS: the groomed white westie head, the studded leather collar with its gem, the pale open blouse. The finished picture stands further back than this crop: it shows her shoulders, her arms and both her hands, and her eyes go DOWN to her work."

P2LABEL="THE STUDIO'S OFFICIAL PORTRAIT OF ABBY, sent for HER IDENTITY ONLY. Copy this terrier feature for feature: the groomed West Highland White Terrier head with its SHORT SQUARE MUZZLE and its small black nose, the hard white jacket of fur in fine short strokes, both small ears pricked up and set wide, the warm closed mouth, the studded leather collar with its front buckle and its single ring, the ONE teardrop gem in a beaded silver bezel hanging from that ring, and the fitted pale blouse falling open at the throat with its sleeve rolled back. The finished Abby must be indistinguishable from this terrier. Her EYES in the finished picture are built by the eye EDIT below and are taken from that edit, not from this drawing."

P3LABEL="THE STAGING AND THE DISTANCE TO MATCH, taken from a finished plate of this same bar. The finished picture shows exactly this much of the room and this much of her: her head high in the frame with air above both pricked ears, both shoulders, both arms and BOTH HANDS at her work, the MARBLE COUNTER running across the BOTTOM of the frame, and the walnut back bar with its ranked bottles filling the whole width behind her, out to the left edge and the right edge. Copy this distance and this room. Her face and her eyes come from Picture 2 and from the eye EDIT."

E_CHAR="redraw ABBY to match Picture 2, the studio's official portrait, feature for feature - the COMPACT SQUARE-MUZZLED West Highland White Terrier head, the small black nose on the flat front of that muzzle, the hard white jacket of fur in fine short strokes, both small ears erect and set wide, the studded collar with its one teardrop gem, the blouse open two buttons over her throat - carried into Picture 1's camera, pose and light, and STOOD BACK to show her arms and both hands. She is the ONLY figure in the picture."

POSE="BOTH HER HANDS ARE IN THE PICTURE AND BOTH ARE BUSY. Two fur-backed TERRIER HANDS, four fingers and one opposed thumb on each, every finger separately drawn, soft pads, no claws and no nails. The LEFT hand is closed round the outside of the bowl of a stemmed glass; the RIGHT hand presses one end of a folded white towel down inside that bowl. Both forearms run down out of the bottom of the picture behind the marble. Abby stands alone behind the counter on the far service side, her head tipped a little, her eyes down on her hands, her mouth a closed warm smile."

E_ONE="ABBY IS ONE UPRIGHT TERRIER AND SHE IS THE WHOLE PICTURE. She is a WEST HIGHLAND WHITE TERRIER WHO STANDS ON TWO LEGS and works her own bar: a terrier head and terrier hands on an upright, shapely body in a blouse, drawn exactly the way the flamingo and the retriever of this strip are drawn. She is the ONLY LIVING FIGURE IN THE FRAME - one head, one body, one pair of hands - and every hand in this picture is hers. There is no four-legged pet anywhere in it, nothing sits or stands ON the counter, and the only one working behind this bar is Abby herself."

E_FRAME="THE FRAMING. Her head - ears included - occupies the TOP THIRD of the tall frame and NO MORE THAN ONE THIRD OF ITS WIDTH, with a clear band of air above both pricked ears. Below her chin the picture continues: both shoulders, both upper arms, both forearms and BOTH HANDS are inside the frame, and the MARBLE COUNTER runs unbroken across the BOTTOM EDGE. There is as much picture below her collar as there is above it."

E_ROOM="THE ROOM IS DRAWN, AND IT FILLS EVERY CORNER OF THE PAPER. Behind her and to both sides, from her shoulders out to both edges, there is the BACK BAR: walnut shelving, ranked bottles filled to different levels and hanging stemware, all the way to the LEFT EDGE and the RIGHT EDGE and up to the TOP of the frame; the MARBLE COUNTER crosses the BOTTOM. Every square inch of this picture is finished engraving on the same sheet - crosshatch, stipple and wood grain corner to corner. Every shape in it that is not Abby is furniture, glass or timber."

E_EYES="HER EYES ARE THE MOST IMPORTANT THING IN THE PICTURE AND THEY ARE BUILT IN FIVE PARTS, each big enough to read: (a) a clear WHITE showing at EACH SIDE of the iris; (b) the IRIS as a drawn mid-tone circle standing clear of the lids; (c) the PUPIL a distinct round dark disc at the centre of the iris and plainly SMALLER than it, never filling it; (d) EXACTLY ONE small white catchlight, high on the iris; (e) a defined upper lid with lashes above it and a soft lower lid below, and above each eye, on the shallow forehead, lay TWO OR THREE fine strokes in a shallow arch as her brow, no heavier than the lash line, clearly separate from the coat around them. Inside the iris draw FINE RADIATING LINES from the pupil outward so it reads as a drawn iris, never a grey wash. The eyes are large, dark, lidded and warm - grown, poised and entirely at ease, never staring, never eerie."

E_GAZE="HER GAZE STAYS INSIDE THE SCENE AND GOES DOWN. Her eyes travel DOWN AND ACROSS THE COUNTER to the work in her hands and on past it to the near side of the marble, which is below the bottom edge of this picture. Her muzzle follows her eyes down. She NEVER looks out at the reader and NEITHER EYE POINTS AT THE LENS. Turn her BODY into the frame first and let the head follow it, so her face reads in THREE-QUARTER, and keep the count while you do it: BOTH eyes are on the paper, the FAR eye at least HALF the width of the near one, with the BRIDGE OF HER MUZZLE showing between them. The back of her skull is never toward the reader and one eye alone is never enough."

E_TOWEL="THE ONE TOWEL, AND THE COUNTER LINE. There is EXACTLY ONE plain white towel in the picture, unlettered, and it is the folded towel IN HER WORKING HAND, pushed down inside the bowl of the glass. Both her shoulders are therefore BARE: no towel hangs on any shoulder and there is no second towel anywhere. The MARBLE COUNTER is tall: its far edge crosses ABBY AT THE WAIST and hides her below it, so no belt, no waistband and no skirt is in the picture; she is standing, so her head sits HIGH in the frame."

E_HEAD="HER HEAD IS THE COMPACT HEAD OF A GROOMED SHOW WESTIE, NOT A LAPDOG HEAD. Seen from the front the skull and cheek fur make a soft CARROT shape, WIDER at the ears and narrowing to the muzzle - never a round ball. The MUZZLE IS SHORT AND SQUARE-ENDED, its front a flat plane carrying the small black nose. The forehead between the brow and the crown is SHALLOW: the eyes sit at the MIDDLE of the head's height, not low under a tall dome of fur. The coat is a HARD JACKET laid in fine short straight strokes no longer than the width of her nose, lying flat and close - not a long soft drooping fleece. Both ears are small, erect, set WIDE apart and carried on the outer corners of the skull. HER MOUTH IS A FULLY CLOSED WARM SMILE, corners up - one soft upward lip-line with no parting, no gap, no tongue and no teeth. TWO LENGTHS OF FUR, and the change is abrupt: the long directional show-coat fur on the skull and cheeks STOPS DEAD AT THE JAWLINE, and below the jaw her throat and chest carry short, fine, close-lying fur that reads as smooth skin - there is no continuous coat running down the neck. Model her face with DELICATE SHADING and fine short strokes only, none longer than the width of her nose, and carry LESS stipple on her face than on the room and the clothing, so the white of her face stays luminous. Not puppyish, not childlike, not a Maltese, not a fox, not any other breed."

E_WEAR="HER COLLAR, HER PENDANT AND HER BLOUSE. The collar is a black leather band carrying ONE ROW OF ROUND DOMED STUDS, EVERY STUD THE SAME SIZE, with a buckle at the FRONT and ONE ring below it. From that ring, and from nothing else, hangs ONE teardrop gem in a silver bezel ringed with fine beads - widest low, narrowing under a small cusp at the top, closing to a SINGLE POINT at the bottom. Not a round disc, not a heart, not a shield, and nothing else hangs beside it. The BLOUSE IS OPEN TWO BUTTONS: the collar falls open in a soft V and a CLEAR SWEEP OF DECOLLETAGE shows between the lapels - it is not buttoned to a full closed collar. Both sleeves are rolled back to the elbow; ONE single strand of pearls at one wrist, drawn whole and not cut by any edge. OPEN THE NECKLINE, NOT THE FIGURE: her bust stays TRIM and athletic, the natural shape of a fit, slim figure, and her hips and shoulders stay slim. She has NO TAIL. NOTHING is lettered anywhere on her."

REF_ARGS=()
if [ "$P3" = "on" ]; then
  REF_ARGS=(--ref "$WIDE::$P3LABEL")
fi

for SEED in $SEEDS; do
  "$PY" "$S" --character abby --seed "$SEED" --out "$OUT" --tag study-abby-r2 \
    --picture1-label "$P1LABEL" \
    --picture2-label "$P2LABEL" \
    --character-edit "$E_CHAR" \
    --pose "$POSE" \
    "${REF_ARGS[@]}" \
    --extra-edit "$E_ONE" \
    --extra-edit "$E_FRAME" \
    --extra-edit "$E_ROOM" \
    --extra-edit "$E_EYES" \
    --extra-edit "$E_GAZE" \
    --extra-edit "$E_TOWEL" \
    --extra-edit "$E_HEAD" \
    --extra-edit "$E_WEAR"
done
