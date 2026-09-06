#!/usr/bin/env bash
# ABBY - ROUND 1 (2026-09-06). Six seeds on the house model through
# scripts/cast-study.py. No judges' list yet, so this round is the baseline -
# but it is not the bare default, for two reasons found by LOOKING at the
# assets before rendering:
#
#  1. THE DEFAULT PICTURE 1 IS A HEAD, NOT A CHEST-UP STUDY. cast-study.py's
#     PLATE_CROPS["abby"] is trio.png at (486,470,360,450): a beautiful westie
#     head, the collar, the pendant and the top of the blouse - and nothing
#     else. Four of the six things CHARACTER-BIBLE.md section 8 says can be
#     COUNTED on a finished Abby (the towel in exactly one place, one hand
#     closed on a working object, the counter crossing her at the waist, the
#     hands being hands and not paws) are outside that box, so a render made
#     from it cannot be judged on them. Drew's round 1 also proved this model
#     creeps CLOSER than Picture 1, and closer than a head is a muzzle.
#
#     The box is NOT widened. Abby is sandwiched in trio.png - Drew's bill
#     reaches x~500 and Barclay's muzzle starts at x~780 - so every 4:5 box
#     wide enough to hold her hands drags one or both gentlemen into the base
#     picture, and round 1 for Drew showed the model copies Picture 1
#     faithfully. Widening would need a paint-out composite; that is round 2's
#     lever if this one misframes.
#
#  2. WHAT I ADDED INSTEAD: PICTURE 3 = canon/characters/abby/kit/bust.png.
#     Checked at full size on a coordinate grid: 308x688, clean - no Drew, no
#     Barclay, no plate edge - and it draws EXACTLY the staging this study
#     wants: her head in the upper third with air above the ears, both
#     shoulders, both arms, both HANDS, the stemmed glass, the folded towel,
#     the marble across the bottom, the back bar behind. It is canon's own kit
#     tile, not a composite, and it is sent for DISTANCE AND STAGING ONLY. Its
#     one fault is named in its label and again in the head EDIT: its mouth is
#     open with the tongue showing, which section 7 forbids.
#
#     Three references is the qwen family's max_refs on the bridge, so nothing
#     is dropped. Picture order: 1 the plate crop (room, camera, pen), 2 the
#     official portrait (identity, per the script's own hardcoded EDIT 4),
#     3 the kit bust (framing).
#
# THE EDITS ARE THE BIBLE'S OWN COUNTS. CHARACTER-BIBLE.md is unusually
# specific about what keeps going wrong and it says so with measurements:
#   * THE EYE is "the single most-missed rule in the file" - missed by the
#     reference card (87.6% and 83.5% of each eye opening below luminance 60)
#     and by all four filed panels. NOTHING in the repository draws it right,
#     so it cannot be copied from a picture; the eye EDIT builds it from the
#     table. Both identity tiles hand the model the failure, which is why that
#     edit is worded as a correction and placed first of mine.
#   * THE GAZE meets the reader in 4 of 4 filed panels and in BOTH tiles.
#     Founder: "I don't like how Abby is always looking at us - it's weird."
#     The gaze EDIT turns the body first and keeps the count the
#     over-correction loses: both eyes on the paper, far one at least half the
#     near one.
#   * THE OPEN NECKLINE is drawn in 0 of 4 filed panels. The wardrobe EDIT asks
#     for cloth, not anatomy - the bust stays trim (4 of 4, the half already
#     landed).
#   * THE TEARDROP wanders in 3 of 4 (a disc, a heart, a shield), so the shape
#     is named.
#   * THE TOWEL is present in 1 of 4. The hands EDIT puts it in her hands and
#     strips the shoulder, which is the bible's state two.
set -eu

PY="C:/Python313/python.exe"
S="Z:/ImageGenerator/Cartoon/scripts/cast-study.py"
OUT="C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/abby/round-1"
BUST="Z:/ImageGenerator/Cartoon/canon/characters/abby/kit/bust.png"

P1LABEL="THE PICTURE BEING EDITED. ABBY the West Highland White Terrier proprietor, ALONE behind the marble counter of The Swinging Door on the FAR SERVICE SIDE, the panelled back bar and its bottle shelves behind her. KEEP THIS ROOM, THIS CAMERA, THIS EYE LEVEL, THIS LIGHT and THIS ENGRAVED PEN, and keep WHO SHE IS: the groomed white westie head, the silky fur, the studded leather collar with its gem, the pale open blouse. She is the ONLY figure in the picture and no other character of any kind exists anywhere in it. TWO THINGS IN THIS CROP ARE NOT TO BE COPIED: it is cut off at her collar, and she is staring straight out at the reader. The finished picture STANDS BACK to Picture 3's distance and her eyes go down to her work."

# The shipped VISION_REFS label for this tile says "the round soft head with the
# big black nose close under the eyes and NO MUZZLE" and names a towel the tile
# does not draw. CHARACTER-BIBLE.md section 2 says the opposite - "short square
# muzzle" - so the label is replaced rather than left to fight the head EDIT.
P2LABEL="THE STUDIO'S OFFICIAL PORTRAIT OF ABBY. Copy THIS lady's identity feature for feature: the groomed West Highland White Terrier head with its soft rounded skull and its SHORT SQUARE MUZZLE, the small black nose, the silky white fur in fine short strokes, both small ears pricked up, the warm closed mouth, the studded leather collar with its front buckle and its single ring, the ONE teardrop gem in a beaded silver bezel hanging from that ring, and the fitted pale blouse falling open at the throat with its sleeve rolled back. The finished Abby must be indistinguishable from this lady. Do NOT copy her EYES - this drawing makes exactly the mistake the eye EDIT below corrects"

P3LABEL="Abby again, from the studio's own kit: THE STAGING AND THE DISTANCE TO MATCH. The finished picture shows exactly this much of her and no more - her whole head in the UPPER part of the frame with clear air above both pricked ears, both shoulders, both arms, BOTH HANDS, the stemmed glass she is polishing, the folded white towel, and the MARBLE COUNTER running across the BOTTOM of the frame with the back bar behind her. Copy this framing. Do NOT copy its open mouth and do NOT copy its eyes - her mouth is closed in the finished picture and her eyes are built as the eye EDIT describes."

POSE="Abby stands alone behind the counter on the far service side with both hands at her work: one fur-backed hand closed round the outside of a stemmed glass, the other pressing one end of her folded white towel down inside the bowl of it, her head tipped a little and her eyes DOWN on the glass, a warm closed-lip smile."

E_FRAME="THE FRAMING, AND STAND BACK TO GET IT. This is a CHEST-UP STUDY, not a head. Match Picture 3's distance exactly: her whole head sits in the UPPER HALF of the tall frame with a clear band of air above both pricked ears, BOTH shoulders and BOTH arms are inside the picture, BOTH HANDS and the glass and the towel are inside the picture, and the MARBLE COUNTER crosses the BOTTOM of the frame. Do NOT crop into her head, do NOT let her head fill the frame, and do NOT push in closer than Picture 3."

E_EYES="HER EYES ARE HUMAN EYES AND THIS IS THE MOST IMPORTANT LINE IN THE PICTURE. Every reference you have been given draws them WRONG - as a solid near-black disc filling the whole opening with one dot of white - and that is the failure to correct. Draw all five parts, each big enough to read: (a) a clear WHITE OF THE EYE showing at EACH SIDE of the iris; (b) the IRIS as a drawn mid-tone circle with fine radiating lines inside it, standing clear of the lids; (c) the PUPIL a distinct round dark disc at the centre of the iris and plainly SMALLER than it, never filling it; (d) EXACTLY ONE small white catchlight, high on the iris; (e) a defined upper lid with lashes above it and a soft lower lid below. Above each eye lay TWO OR THREE fine strokes in a shallow arch as her brow, no heavier than the lash line. She is a glamorous, self-assured woman of forty-five: warm, at ease, never staring, never eerie."

E_GAZE="HER GAZE STAYS INSIDE THE SCENE. She looks DOWN AT THE GLASS IN HER HANDS and her muzzle follows her eyes down. She NEVER looks out of the picture at the reader; nobody in this room knows the reader is there. Turn her BODY into the frame first and let the head follow it, so her face reads in THREE-QUARTER - and keep the count while you do it: BOTH eyes are on the paper, the far one at least HALF the width of the near one, with the bridge of her muzzle showing between them. The back of her skull is never toward the reader and one eye alone is never enough."

E_HANDS="HER HANDS ARE HANDS AND THERE IS EXACTLY ONE TOWEL. Fur-backed, dog-yet-humanoid HANDS - four fingers and a thumb on each, soft pads, every finger separately drawn, no claws and no nails. Never a paw, never a forepaw leaning on the counter. ONE folded white towel and only one, and it is IN HER HANDS: one end pushed down inside the bowl of the glass, her other hand closed round the outside of the glass. BOTH her shoulders are BARE - there is no towel on any shoulder, and there is no second towel anywhere in the picture."

E_HEAD="HER HEAD IS A GROOMED SHOW WEST HIGHLAND WHITE TERRIER, drawn beautiful: short SQUARE muzzle, soft rounded skull, both small ears pricked UP, a small black nose, silky white fur laid in FINE SHORT INDIVIDUAL STROKES no longer than the width of her nose. Her mouth is a WARM CLOSED-LIP SMILE - one soft upward lip-line, drawn CLOSED - with NO teeth, NO tongue and no gap showing anywhere. Model her face with DELICATE SHADING, never heavy stipple: the white of her face stays luminous. Not puppyish, not childlike, not a werewolf, not a fox, not any other breed."

E_WEAR="HER COLLAR, HER PENDANT AND HER BLOUSE. The collar is a black leather band carrying ONE ROW OF ROUND DOMED STUDS, EVERY STUD THE SAME SIZE, with a buckle at the FRONT and ONE ring below it. From that ring, and from nothing else, hangs ONE teardrop gem in a silver bezel ringed with fine beads - widest low, narrowing under a small cusp at the top, closing to a SINGLE POINT at the bottom. Not a round disc, not a heart, not a shield, and nothing else hangs beside it. The blouse is fitted and pale with the top TWO buttons undone, the collar falling open in a soft V and a clear sweep of throat and decolletage between the lapels; both sleeves are rolled back to the elbow; ONE single strand of pearls at one wrist, drawn whole and not cut by any edge. OPEN THE NECKLINE, NOT THE FIGURE: her bust stays TRIM and athletic, the natural shape of a fit woman of forty-five, and her hips and shoulders stay slim. She has NO TAIL. NOTHING is lettered anywhere on her - the blouse, the collar and the skirt are blank."

E_ROOM="THE ROOM IS PICTURE 1'S ROOM AND IT REACHES ALL FOUR EDGES. The panelled back bar with its walnut shelving, its bottles and its hanging stemware runs on behind her head and behind both shoulders, out to the left edge and the right edge; the marble counter crosses the bottom. There is NO blank paper, no pale void, no page edge, no border, no signature and no artist mark anywhere. SHE IS THE ONLY FIGURE: no second bartender, no customer, no staff, nobody at the tables, nobody in the mirror, and no face or figure of any kind on her side of the bar."

mkdir -p "$OUT"

for SEED in 41 7 21 33 44 55; do
  "$PY" "$S" --character abby --seed "$SEED" --out "$OUT" --tag study-abby-r1 \
    --picture1-label "$P1LABEL" \
    --picture2-label "$P2LABEL" \
    --ref "$BUST::$P3LABEL" \
    --pose "$POSE" \
    --extra-edit "$E_FRAME" \
    --extra-edit "$E_EYES" \
    --extra-edit "$E_GAZE" \
    --extra-edit "$E_HANDS" \
    --extra-edit "$E_HEAD" \
    --extra-edit "$E_WEAR" \
    --extra-edit "$E_ROOM"
done
