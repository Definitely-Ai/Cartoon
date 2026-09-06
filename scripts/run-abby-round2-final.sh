#!/usr/bin/env bash
# ABBY - ROUND 2, THE PASS THAT SHIPS (2026-09-06). local/qwen-image-edit-2511,
# 4:5 1344x1680, fast Lightning 8 steps cfg 1 - round 1's recipe exactly.
# Seeds 55 7 41 21 33 44; 55 and 7 first, they carried round 1.
#
# THE LEAD'S ROOT-CAUSE CALL WAS TESTED AND IT LOSES. "Replace Picture 1 with
# canon/showcase-retired/sc04 @ 470,345,345,680" was run eleven times:
#   6 seeds, judges' wording verbatim        -> 6/6 a HUMAN + a real 4-legged
#                                               terrier, bar gone, blank paper
#   2 seeds, every human noun purged         -> 2/2 the same split
#   2 seeds, re-cut WIDE to the house 4:5    -> 2/2 the same split; seed 7 drew
#     shape (440,345,544,680, Barclay and       TWO terriers side by side
#     the lettered envelope painted out)
#   1 seed, that wide tile as Picture 3 only -> room came back, still split
# Aspect was not it. The sc04 crop shows Abby HEAD TO HANDS - a terrier head on
# an upright torso with two arms - and at cfg 1 the model cuts along that seam:
# torso to a person, head to a pet. The shipped trio.png crop is a HEAD, and a
# head gives it nothing to split off. Picture 1 goes back to the shipped crop.
# The two sc04 tiles are kept beside the renders; they are good pictures and the
# next round may want them, but not as Picture 1 on the cfg-1 path.
#
# THE ABSOLUTE RULE OF THIS PASS: NO HUMAN NOUN ANYWHERE IN THE PROMPT I
# CONTROL - not human, humanoid, woman, lady, person, man or customer. Round 1's
# diagnostic proved those words are drawn as nouns at cfg 1; run-abby-round2.sh
# proved it again by carrying the judges' list onto the wire verbatim. Every one
# of the judges' fixes is kept and restated in terrier nouns.
#
# THE JUDGES' EDIT NUMBERS. cast-study.py hardcodes 1-5 and appends the rest, so
# EDIT 2 is unreachable; the hands go into THE BUSINESS, edit 5 of 14, which is
# the promotion the judges asked for. The count of living figures goes first of
# mine, then the lead's measured frame, then the eye with its new brow arch and
# radiating iris, and the positive back-bar statement closes the list.
set -eu

PY="C:/Python313/python.exe"
S="Z:/ImageGenerator/Cartoon/scripts/cast-study.py"
OUT="C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/abby/round-2"
P1="${P1:-$OUT/abby-picture1-sc04-wide.png}"
P1BUILD="${P1BUILD:-Z:/ImageGenerator/Cartoon/scripts/make-abby-picture1-round2-wide.py}"
SEEDS="${SEEDS:-55 7 41 21 33 44}"
OUT="${OUT:-$OUT}"

mkdir -p "$OUT"
# Picture 1 is the SHIPPED plate crop again - see the header.

P1LABEL="THE PICTURE BEING EDITED: ABBY the West Highland White Terrier proprietor, the only figure in it, standing behind the marble counter of The Swinging Door on the far service side with both hands at her work, her eyes down on her hands, her mouth closed. ONE FIGURE STANDS IN THIS PICTURE AND SHE IS A TERRIER. KEEP THIS ROOM, THIS CAMERA, THIS EYE LEVEL, THIS DISTANCE, THIS LIGHT, THIS ENGRAVED PEN, this closed mouth and this downward gaze, and keep who she is."

P2LABEL="THE STUDIO'S OFFICIAL PORTRAIT OF ABBY, sent for HER IDENTITY ONLY. Copy this terrier feature for feature: the groomed West Highland White Terrier head with its SHORT SQUARE MUZZLE and its small black nose, the hard white jacket of fur in fine short strokes, both small ears pricked up and set wide, the warm closed mouth, the studded leather collar with its front buckle and its single ring, the ONE teardrop gem in a beaded silver bezel hanging from that ring, and the fitted pale blouse falling open at the throat with its sleeve rolled back. The finished Abby must be indistinguishable from this terrier. Her EYES in the finished picture are built by the eye EDIT below and are taken from that edit, not from this drawing."

E_CHAR="redraw ABBY to match Picture 2, the studio's official portrait, feature for feature - the COMPACT SQUARE-MUZZLED West Highland White Terrier head, the small black nose on the flat front of that muzzle, the hard white jacket of fur in fine short strokes, both small ears erect and set wide, the studded collar with its one teardrop gem, the blouse open two buttons over her throat - carried into Picture 1's camera, crop, pose, DISTANCE and light. She is the ONLY figure in the picture."

POSE="BOTH HER HANDS ARE IN THE PICTURE AND BOTH ARE BUSY. Two fur-backed TERRIER HANDS, four fingers and one opposed thumb on each, every finger separately drawn, soft pads, no claws and no nails. The LEFT hand is closed round the outside of the bowl of a stemmed glass; the RIGHT hand presses one end of a folded white towel down inside that bowl. Both forearms run down out of the bottom of the picture behind the marble. Abby stands alone behind the counter on the far service side, her head tipped a little, her eyes down on her hands, her mouth a closed warm smile."

E_ONE="ABBY IS ONE UPRIGHT TERRIER AND SHE IS THE WHOLE PICTURE. She is a WEST HIGHLAND WHITE TERRIER WHO STANDS ON TWO LEGS and works her own bar: a terrier head and terrier hands on an upright, shapely body in a blouse, drawn exactly the way the flamingo and the retriever of this strip are drawn. She is the ONLY LIVING FIGURE IN THE FRAME - one head, one body, one pair of hands - and every hand in this picture is hers. There is no four-legged pet anywhere in it, nothing sits or stands ON the counter, and the only one working behind this bar is Abby herself."

E_FRAME="THE FRAMING. Her head - ears included - occupies the TOP THIRD of the tall frame and NO MORE THAN ONE THIRD OF ITS WIDTH, with a clear band of air above both pricked ears. Below her chin the picture continues: both shoulders, both upper arms, both forearms and BOTH HANDS are inside the frame, and the MARBLE COUNTER runs unbroken across the BOTTOM EDGE. There is as much picture below her collar as there is above it."

E_EYES="HER EYES ARE THE MOST IMPORTANT THING IN THE PICTURE AND THEY ARE BUILT IN FIVE PARTS, each big enough to read: (a) a clear WHITE showing at EACH SIDE of the iris; (b) the IRIS as a drawn mid-tone circle standing clear of the lids; (c) the PUPIL a distinct round dark disc at the centre of the iris and plainly SMALLER than it, never filling it; (d) EXACTLY ONE small white catchlight, high on the iris; (e) a defined upper lid with lashes above it and a soft lower lid below, and above each eye, on the shallow forehead, lay TWO OR THREE fine strokes in a shallow arch as her brow, no heavier than the lash line, clearly separate from the coat around them. Inside the iris draw FINE RADIATING LINES from the pupil outward so it reads as a drawn iris, never a grey wash. The eyes are large, dark, lidded and warm - grown, poised and entirely at ease, never staring, never eerie."

E_GAZE="HER GAZE STAYS INSIDE THE SCENE AND GOES DOWN. Her eyes travel DOWN AND ACROSS THE COUNTER to the work in her hands and on past it to the near side of the marble, which is below the bottom edge of this picture. Her muzzle follows her eyes down. She NEVER looks out at the reader and NEITHER EYE POINTS AT THE LENS; nobody in this room knows the reader is there. Turn her BODY into the frame first and let the head follow it, so her face reads in THREE-QUARTER, and keep the count while you do it: BOTH eyes are on the paper, the FAR eye at least HALF the width of the near one, with the BRIDGE OF HER MUZZLE showing between them. The back of her skull is never toward the reader and one eye alone is never enough."

E_TOWEL="THE ONE TOWEL, AND THE COUNTER LINE. There is EXACTLY ONE plain white towel in the picture, unlettered, and it is the folded towel IN HER WORKING HAND, pushed down inside the bowl of the glass. Both her shoulders are therefore BARE: no towel hangs on any shoulder and there is no second towel anywhere. The MARBLE COUNTER is tall: its far edge crosses ABBY AT THE WAIST and hides her below it, so no belt, no waistband and no skirt is in the picture; she is standing, so her head sits HIGH in the frame."

E_HEAD="HER HEAD IS THE COMPACT HEAD OF A GROOMED SHOW WESTIE, NOT A LAPDOG HEAD. Seen from the front the skull and cheek fur make a soft CARROT shape, WIDER at the ears and narrowing to the muzzle - never a round ball. The MUZZLE IS SHORT AND SQUARE-ENDED, its front a flat plane carrying the small black nose. The forehead between the brow and the crown is SHALLOW: the eyes sit at the MIDDLE of the head's height, not low under a tall dome of fur. The coat is a HARD JACKET laid in fine short straight strokes no longer than the width of her nose, lying flat and close - not a long soft drooping fleece. Both ears are small, erect, set WIDE apart and carried on the outer corners of the skull. HER MOUTH IS A FULLY CLOSED WARM SMILE, corners up - one soft upward lip-line with no parting, no gap, no tongue and no teeth. TWO LENGTHS OF FUR, and the change is abrupt: the long directional show-coat fur on the skull and cheeks STOPS DEAD AT THE JAWLINE, and below the jaw her throat and chest carry short, fine, close-lying fur that reads as smooth skin - there is no continuous coat running down the neck. Model her face with DELICATE SHADING and fine short strokes only, none longer than the width of her nose, and carry LESS stipple on her face than on the room and the clothing, so the white of her face stays luminous. Not puppyish, not childlike, not a Maltese, not a fox, not any other breed."

E_WEAR="HER COLLAR, HER PENDANT AND HER BLOUSE. The collar is a black leather band carrying ONE ROW OF ROUND DOMED STUDS, EVERY STUD THE SAME SIZE, with a buckle at the FRONT and ONE ring below it. From that ring, and from nothing else, hangs ONE teardrop gem in a silver bezel ringed with fine beads - widest low, narrowing under a small cusp at the top, closing to a SINGLE POINT at the bottom. Not a round disc, not a heart, not a shield, and nothing else hangs beside it. The BLOUSE IS OPEN TWO BUTTONS: the collar falls open in a soft V and a CLEAR SWEEP OF DECOLLETAGE shows between the lapels - it is not buttoned to a full closed collar. Both sleeves are rolled back to the elbow; ONE single strand of pearls at one wrist, drawn whole and not cut by any edge. OPEN THE NECKLINE, NOT THE FIGURE: her bust stays TRIM and athletic, the natural shape of a fit, slim figure, and her hips and shoulders stay slim. She has NO TAIL. NOTHING is lettered anywhere on her."

E_BACKBAR="BEHIND HER AND TO BOTH SIDES, FROM HER SHOULDERS OUT TO BOTH EDGES, THERE IS NOTHING BUT THE BACK BAR: walnut shelving, ranked bottles and hanging stemware, empty of life, all the way to the left edge and the right edge. Every shape in this picture that is not Abby is furniture, glass or timber, and every corner of the paper is finished engraving - no blank margin, no signature, no artist mark."

for SEED in $SEEDS; do
  "$PY" "$S" --character abby --seed "$SEED" --out "$OUT" --tag study-abby-r2 \
    --picture1-label "$P1LABEL" \
    --picture2-label "$P2LABEL" \
    --character-edit "$E_CHAR" \
    --pose "$POSE" \
    --extra-edit "$E_ONE" \
    --extra-edit "$E_FRAME" \
    --extra-edit "$E_EYES" \
    --extra-edit "$E_GAZE" \
    --extra-edit "$E_TOWEL" \
    --extra-edit "$E_HEAD" \
    --extra-edit "$E_WEAR" \
    --extra-edit "$E_BACKBAR"
done
