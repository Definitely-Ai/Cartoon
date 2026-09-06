#!/bin/sh
# DREW round 3 -- the judges' fixes from round 2, on the house model.
# Picture 1 is PRE-COMPOSITED (scripts/make-drew-picture1.py): the plate supplies
# the room/camera/light, canon/vision/studies/drew.png supplies the head and neck,
# so the edit blends a correct bird instead of copying the hooked black-jawed one.
# Picture 3 is a BILL-ONLY tile. Seeds come in on the command line.
set -e
OUT="C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/drew/round-3"
P1="$OUT/_picture1-drew-composite.png"

POSE="Drew sits alone at the marble with his martini in front of him, his long S-curved neck resting in its one easy reversal, his head carried high and turned a little toward the back bar, heavy-lidded and amiable, one feathered hand resting on the slab. Frame him CHEST-UP AND NO CLOSER - at exactly Picture 1's distance: his whole head and bill, his whole neck, the collar band, the black bow tie and the V of the knitted sweater vest all sit comfortably inside the frame with clear room above his head, and the marble, the martini and the back bar are all still in shot."

P1LABEL="a ROUGH PASTE-UP the studio made for this round, and the picture being edited. The ROOM, the CAMERA, the DISTANCE, the crop, the lighting and the engraved pen are FINAL and come from this strip's own APPROVED plate - keep every one of them. DREW'S HEAD AND NECK have already been CUT IN from the official portrait and are the CORRECT shape: that bill and that S-curved neck are RIGHT and must be kept exactly as they are here. Only the JOIN is crude - the seam where the neck meets the collar, and the blur behind the head, are unfinished and must be drawn properly. Do NOT redraw the head or the bill into any other shape"

BILL="THE BILL is a FLAMINGO'S, it is ALREADY CORRECT in Picture 1, and Picture 3 is the close authority - keep it, do not restyle it. It is DEEP and HEAVY at the base - as tall as the eye is wide - shallow and nearly straight for its first two thirds, then ONE clean kink and a short blunt downturn to a rounded tip. THE BILL MUST SHOW ONE ABRUPT DOWNWARD BEND roughly two-thirds of the way from the eye to the tip - like a real flamingo's bill, NOT a heron's or ibis's evenly-curving sickle bill. Before the bend the bill is straight and pale; after the bend it drops sharply downward and then runs nearly STRAIGHT AND BLUNT to the tip - it does not keep curving, hooking, or curling past the bend. The tip does not curl backward or upward at the very end; the last quarter-inch of the bill is the same downward direction as the bend, ending in a blunt rounded point, not a claw-like or scythe-like hook. The bill's depth measured across it at the bend is NO MORE than one third of the eye-to-tip length - noticeably slimmer and more compact than a heron's or ibis's bill, closer to a stubby, heavy-based bend. The SOLID BLACK is a CAP on the OUTER THIRD ONLY: it covers the UPPER mandible and the LOWER mandible equally and wraps around the tip, and its inner edge is a single clean line crossing BOTH mandibles at the same point. There is NO black wedge, stripe or taper running back along the lower jaw, the upper mandible is NEVER pale to the tip, and the bill NEVER ends in a needle point. The nostril is a plain thin horizontal slit, no wider than it needs to be, clearly smaller than half the eye's height. Lift the heavy lid slightly and soften the brow so the eye reads AMIABLE and welcoming, not narrowed or suspicious; the line where the mandibles meet is relaxed and faintly upturned, never set hard."

NECK="THE NECK: long, slim and S-CURVED with ONE reversal, exactly as Picture 1 already carries it. It leaves the shoulders leaning BACK, then bends FORWARD into the head, so the profile reads as the letter S and the HEAD IS CARRIED HIGH, clearly ABOVE the shoulder line with daylight between the jaw and the collar. The neck is no thicker than HALF the width of the skull. It is never a hunched hook, never a J, and the head never drops to shoulder level."

CAMERA="TURN DREW toward the camera. His body is in THREE-QUARTER view facing frame-right with his CHEST toward the reader, his bill in clean near-profile against the back bar. His shirt front, the full V of the sweater vest, the placket, the buttons and the KNOT of the black bow tie are all visible. We never see the back of his vest or the back of his shoulder."

WARDROBE="THE SWEATER VEST is a KNITTED garment: a deep V neck with a RIBBED band a finger wide around the V, RIBBED bands around both armholes and a RIBBED hem, the body worked in visible knit stitches. Under it a pale COLLARED SHIRT with a crisp turned collar, a buttoned placket down the chest and a small BLACK BOW TIE tied at the collar band. It is never a flat quilted or upholstered panel."

HANDS="HIS HANDS are FEATHERED HANDS: FOUR FINGERS and an OPPOSED THUMB, slim and human in proportion, covered in the same fine short dash-strokes as his neck. No claws, no talons, no dark nails, no blunt lumpy digits, and never shingled, leaf-shaped or scale-like plates on the hand, arm or shoulder - the dash-strokes of the neck continue unbroken over the whole body."

PROPS="THE MARBLE is ONE continuous slab on ONE plane - no step, no ledge, no second shelf. His hand rests on the SAME surface the martini and the nut bowl stand on. On the marble there is his martini, the nut bowl and napkins and NOTHING ELSE: no second glass, no rocks glass, no tumbler, no second drink of any kind anywhere in the frame, including at the edges. No studded leather chair back, bar rail or padded roll appears in the picture."

LABELS="THE LABELS, once more: every label on every bottle is an EMPTY WHITE PAPER RECTANGLE - no crest, no scrollwork, no ornament, no border device, no scribble, no mark of any kind that could be mistaken for writing."

BILLTILE="canon/vision/studies/drew.png@520,130,310,390::a large close study of DREW'S BILL ALONE - the authority on the black: the black is a SOLID CAP over the OUTER THIRD of the bill, covering the UPPER mandible and the LOWER mandible alike and wrapping around the blunt down-turned tip; the inner two thirds are pale and finely hatched; there is NO black stripe running along the lower jaw"

NEG="sickle bill, ibis bill, heron bill, curved bill without a sharp bend, evenly tapering bill, hooked tip, scythe-shaped bill, backward-curling tip, black lower jaw, black mandible stripe, black wedge along beak, hooked beak, scimitar beak, needle-pointed beak, stork, ibis, heron, vulture, swan, goose, thick straight neck, hunched neck, head at shoulder level, scaled feathers, leaf-shaped feathers, shingled plumage, claws, talons, back view, rear three-quarter, second glass, lettering on labels"

for SEED in "$@"; do
  C:/Python313/python.exe "Z:/ImageGenerator/Cartoon/scripts/cast-study.py" \
    --character drew --seed "$SEED" --out "$OUT" --tag study-drew-r3 \
    --picture1-path "$P1" --picture1-label "$P1LABEL" --pose "$POSE" \
    --ref "$BILLTILE" --negative-extra "$NEG" \
    --extra-edit "$BILL" --extra-edit "$NECK" --extra-edit "$CAMERA" \
    --extra-edit "$WARDROBE" --extra-edit "$HANDS" --extra-edit "$PROPS" --extra-edit "$LABELS"
done
