#!/usr/bin/env bash
# ABBY ROUND 1 - DIAGNOSTIC PASS (2026-09-06). Two seeds, outside the six.
#
# WHAT ROUND 1 DID. All six seeds came back with Abby SPLIT IN TWO: a real
# four-legged West Highland terrier wearing her collar and pendant, sitting on
# the counter, AND a separate HUMAN bartender doing her job beside it - a man in
# five of the six, a woman in seed 41, two men in seed 7. Seed 33 stacked TWO
# westies. Seed 55 is the only one that kept an anthropomorphic Abby in the
# foreground, and it still put a human bartender in the background.
#
# THE THREE SUSPECTS, and this pass removes all three at once:
#
#  1. THE WORDS "HUMAN" AND "WOMAN". My eye EDIT opened "HER EYES ARE HUMAN
#     EYES" and closed "She is a glamorous, self-assured woman of forty-five".
#     Both phrasings are lifted from CHARACTER-BIBLE.md section 2, where they
#     are addressed to a human reader who already knows Abby is a dog. Handed to
#     an edit model at cfg 1 they are nouns, and the model drew the noun. This
#     pass keeps every structural instruction (the five parts of the eye, the
#     brow strokes, the poise) and removes every human noun from them.
#
#  2. PICTURE 3. Round 1 added canon/characters/abby/kit/bust.png as a third
#     tile for framing. Three tiles of Abby, two of them cut at different
#     distances, is three instances of her on the wire - and seed 33 drew two
#     westies stacked. This pass drops it and puts the framing in words.
#
#  3. THE NEGATION LIST. "no second bartender, no customer, no staff ... no
#     signature and no artist mark" - LOCAL_NEGATIVE is inert on the cfg-1
#     Lightning path, and so is a negation inside the prompt. Five of six
#     renders carry a pencil signature scribble at the bottom right and every
#     one carries the second person the list forbids. Replaced with a positive
#     count: ONE living figure, and she is a dog.
#
# If this pass comes back with a single anthropomorphic westie and no human,
# the diagnosis holds and round 2 runs on these edits. Seeds: 55 (round 1's
# best) and 7 (round 1's worst - it drew two men).
set -eu

PY="C:/Python313/python.exe"
S="Z:/ImageGenerator/Cartoon/scripts/cast-study.py"
OUT="C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/abby/round-1/diagnostic"

P1LABEL="THE PICTURE BEING EDITED. ABBY the West Highland White Terrier proprietor, ALONE behind the marble counter of The Swinging Door on the FAR SERVICE SIDE, the panelled back bar and its bottle shelves behind her. KEEP THIS ROOM, THIS CAMERA, THIS EYE LEVEL, THIS LIGHT and THIS ENGRAVED PEN, and keep WHO SHE IS: the groomed white westie head, the silky fur, the studded leather collar with its gem, the pale open blouse. ONE FIGURE STANDS IN THIS PICTURE AND SHE IS A DOG. TWO THINGS IN THIS CROP ARE NOT TO BE COPIED: it is cut off at her collar, and she is staring straight out at the reader. The finished picture stands back far enough to show her shoulders, her arms and her hands, and her eyes go down to her work"

P2LABEL="THE STUDIO'S OFFICIAL PORTRAIT OF ABBY. Copy THIS terrier's identity feature for feature: the groomed West Highland White Terrier head with its soft rounded skull and its SHORT SQUARE MUZZLE, the small black nose, the silky white fur in fine short strokes, both small ears pricked up, the warm closed mouth, the studded leather collar with its front buckle and its single ring, the ONE teardrop gem in a beaded silver bezel hanging from that ring, and the fitted pale blouse falling open at the throat with its sleeve rolled back. The finished Abby must be indistinguishable from this terrier. Her EYES are the one thing this drawing gets wrong; the eye EDIT below rebuilds them"

POSE="Abby stands alone behind the counter on the far service side with both hands at her work: one fur-backed terrier hand closed round the outside of a stemmed glass, the other pressing one end of her folded white towel down inside the bowl of it, her head tipped a little and her eyes DOWN on the glass, a warm closed-lip smile."

E_ONE="ABBY IS ONE UPRIGHT TERRIER AND SHE IS THE WHOLE PICTURE. She is a WEST HIGHLAND WHITE TERRIER WHO STANDS ON TWO LEGS and works her own bar: a terrier head and terrier hands on an upright, shapely, slightly humanoid body in a blouse, exactly as the two gentlemen of this strip are a flamingo and a dog drawn the same way. She is the ONLY LIVING FIGURE IN THE FRAME - one head, one body, one pair of hands. There is no four-legged pet anywhere in the picture, nothing sits or stands ON the counter, and the only person behind this bar is Abby herself."

E_FRAME="THE FRAMING, AND STAND BACK TO GET IT. This is a CHEST-UP STUDY, not a head: her whole head sits in the UPPER HALF of the tall frame with a clear band of air above both pricked ears, BOTH shoulders and BOTH arms are inside the picture, BOTH HANDS and the glass and the towel are inside the picture, and the MARBLE COUNTER crosses the BOTTOM of the frame and hides her below the waist. Her head is about a quarter of the height of the picture. Do NOT crop into her head and do NOT let her head fill the frame."

E_EYES="HER EYES ARE THE MOST IMPORTANT THING IN THE PICTURE AND THEY ARE BUILT IN FIVE PARTS. Every reference you have been given draws them WRONG - as a solid near-black disc filling the whole opening with one dot of white - and that is the failure to correct. Draw all five parts, each big enough to read: (a) a clear WHITE showing at EACH SIDE of the iris; (b) the IRIS as a drawn mid-tone circle with fine radiating lines inside it, standing clear of the lids; (c) the PUPIL a distinct round dark disc at the centre of the iris and plainly SMALLER than it, never filling it; (d) EXACTLY ONE small white catchlight, high on the iris; (e) a defined upper lid with lashes above it and a soft lower lid below. Above each eye lay TWO OR THREE fine strokes in a shallow arch as her brow, no heavier than the lash line. The eyes are large, dark, lidded and warm - grown, poised and entirely at ease, never staring, never eerie."

E_GAZE="HER GAZE STAYS INSIDE THE SCENE. She looks DOWN AT THE GLASS IN HER HANDS and her muzzle follows her eyes down. She NEVER looks out of the picture at the reader. Turn her BODY into the frame first and let the head follow it, so her face reads in THREE-QUARTER - and keep the count while you do it: BOTH eyes are on the paper, the far one at least HALF the width of the near one, with the bridge of her muzzle showing between them."

E_HANDS="HER HANDS ARE HANDS AND THERE IS EXACTLY ONE TOWEL. Fur-backed terrier hands - four fingers and a thumb on each, soft pads, every finger separately drawn, no claws and no nails - on the ends of two upright arms in rolled blouse sleeves. ONE folded white towel, and it is IN HER HANDS: one end pushed down inside the bowl of the glass, her other hand closed round the outside of the glass. Both her shoulders are BARE of it."

E_HEAD="HER HEAD IS A GROOMED SHOW WEST HIGHLAND WHITE TERRIER, drawn beautiful: short SQUARE muzzle, soft rounded skull, both small ears pricked UP, a small black nose, silky white fur laid in FINE SHORT INDIVIDUAL STROKES no longer than the width of her nose. Her mouth is a WARM CLOSED-LIP SMILE - one soft upward lip-line, drawn CLOSED - with NO teeth and NO tongue showing. Model her face with DELICATE SHADING, never heavy stipple: the white of her face stays luminous."

E_WEAR="HER COLLAR, HER PENDANT AND HER BLOUSE. The collar is a black leather band carrying ONE ROW OF ROUND DOMED STUDS, EVERY STUD THE SAME SIZE, with a buckle at the FRONT and ONE ring below it. From that ring, and from nothing else, hangs ONE teardrop gem in a silver bezel ringed with fine beads - widest low, narrowing under a small cusp at the top, closing to a SINGLE POINT at the bottom. The blouse is fitted and pale with the top TWO buttons undone, the collar falling open in a soft V and a clear sweep of throat and decolletage between the lapels; both sleeves rolled back to the elbow; ONE single strand of pearls at one wrist, drawn whole. OPEN THE NECKLINE, NOT THE FIGURE: her bust stays TRIM and athletic and her hips and shoulders stay slim. She has NO TAIL, and her blouse, collar and skirt carry no lettering."

E_ROOM="THE ROOM IS PICTURE 1'S ROOM AND IT REACHES ALL FOUR EDGES AND ALL FOUR CORNERS. The panelled back bar with its walnut shelving, its bottles and its hanging stemware runs on behind her head and behind both shoulders, out to the left edge and the right edge; the marble counter crosses the bottom. Every corner of the picture is finished engraving on the same paper."

mkdir -p "$OUT"

for SEED in 55 7; do
  "$PY" "$S" --character abby --seed "$SEED" --out "$OUT" --tag study-abby-r1-diag \
    --picture1-label "$P1LABEL" \
    --picture2-label "$P2LABEL" \
    --pose "$POSE" \
    --extra-edit "$E_ONE" \
    --extra-edit "$E_FRAME" \
    --extra-edit "$E_EYES" \
    --extra-edit "$E_GAZE" \
    --extra-edit "$E_HANDS" \
    --extra-edit "$E_HEAD" \
    --extra-edit "$E_WEAR" \
    --extra-edit "$E_ROOM"
done
