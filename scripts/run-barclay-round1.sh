#!/usr/bin/env bash
# BARCLAY — ROUND 1 (2026-09-06). Six seeds on the house model through
# scripts/cast-study.py. No judge fixes exist yet, so the EDITs are cut from
# the founder's note ("perfect each character"), Barclay's look card
# (reports/2026-09-05/CAST-LOOK-CARDS.md, judge checklist 1-14) and the ONE
# lesson Drew's round 1 taught: the camera creeps in unless it is held.
#
# WHAT THIS ROUND CHANGES AGAINST THE SCRIPT'S DEFAULTS
#   1. Picture 1 is RE-CUT: (640,620,560,700) instead of (680,640,520,650) —
#      still 4:5 and still Barclay alone out of the approved duo.png, but wider
#      and lower, so the shoulders, the collar V and the jacket front are in
#      frame and his head is a smaller share of the picture. Drew's round 1
#      failed partly because the model pushed in past Picture 1's crop; a
#      roomier Picture 1 plus EDIT 9 gives it somewhere to push in TO.
#   2. Picture 3 is ADDED: canon/characters/dog/kit/head.png, the tight head
#      tile cut from canon/vision/barclay-face-reference.jpg. Failure mode 2 on
#      his look card is that the black lip band and the eye's paper-white are
#      the first two marks the pipeline loses; this tile carries both at native
#      resolution, plus the freckle rows and the ear fringe. Three references
#      is exactly the qwen family's max_refs, so nothing is dropped.
#   3. Five EDIT lines (5b in localPrompt's order) name, positively, the four
#      things the checklist fails him on: the sad first glance, the lip band and
#      the eye, the coat texture and the ruff, and the wardrobe/hands/no tail.
set -eu

PY="C:/Python313/python.exe"
S="Z:/ImageGenerator/Cartoon/scripts/cast-study.py"
OUT="C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/dog/round-1"

P1BOX="640,620,560,700"
P1LABEL="a crop of this strip's own APPROVED plate: BARCLAY the golden retriever gentleman ALONE at the marble counter of The Swinging Door, chest-up, his head in three-quarter against the back bar, his old fashioned in his hand on the slab. KEEP this exact camera, this crop, this distance, this pose, this lighting and this engraved pen — this IS the picture being edited"

HEADTILE="Z:/ImageGenerator/Cartoon/canon/characters/dog/kit/head.png::Barclay's tight head study at full detail — the one place the marks that make him a golden retriever and a gentleman are all legible: the paper-white in the eye with its single catchlight, the fine true-black lip line hooking UP at the corner, the black nose, the three arcing rows of muzzle freckles, the drop ear leathers with their long fringe, and the layered coat drawn in fine individual strokes. Copy the FACE from this picture"

E1="THE FACE READS FRIENDLY AT FIRST GLANCE. The worry lives ONLY in the brows — both inner brow ends lifted, one faint crease across the forehead, and nothing else on the face is sad. His mouth stays CLOSED and its corner hook lifts ABOVE the level of the lip line's middle; that lifted corner is his whole smile. His cheeks are full and lifted, the fur under the eye rising toward the ear. A good-humoured gentleman who is a little concerned, never a downcast one."

E2="THE EYE AND THE MOUTH COME FROM PICTURE 3. The eye is built in three marks and no more: one solid dark mass pressed against the FRONT corner of the opening, taking the front 40 percent of it and no more; PAPER-WHITE sclera filling the rear 60 percent; and ONE bright catchlight punched inside the dark, with the upper lid resting on the TOP of the dark and no lower — never a black bead, never an opening filled solid, never a lid dragged down over it. THE BLACK LIP-LINE is a black labrador's: a FINE true-black line running two nose-widths from under the back of his black nose, level along the muzzle, ENDING DIRECTLY UNDER THE FRONT CORNER OF THE NEAR EYE and finishing in a small rounded hook. His black nose stays the blackest mark on his head. Both eyes are drawn and whole as the head comes round, and his gaze stays inside the room."

E3="THE COAT IS A GOLDEN RETRIEVER'S, laid in FINE INDIVIDUAL STROKES that each have a direction and a length, overlapping in layers so the pen reads as hair — never as smooth grey tone with woolly edges, never as steel wire denser than the face. FIFTEEN TO TWENTY small dark freckles in THREE arcing rows on the near side of the muzzle, irregular in size and spacing and fading toward the eye. ONE drop ear leather, short-furred with a slightly ragged edge, rooting level with the TOP of the eye and its tip finishing level with the BOTTOM of the jaw, the long fringe hanging behind it and running on down the nape in loose separate strokes; the far ear is a tuft at most, never a second full ear. His chest ruff is MODEST — no deeper than a third of his head and never wider than his jaw, so the pale shirt collar shows on BOTH sides of it; never a neck-beard, mane or bib."

E4="THE WARDROBE AND THE HANDS. The dark suit jacket over a pale OPEN-collared shirt with NO TIE and no cap, as in Picture 2; the small USA flag pin sits on his LEFT lapel wherever that lapel is in view — a dark canton with the stars stippled pale, alternating bars, a fine staff along the hoist — and nothing else anywhere on him is lettered, crested, monogrammed or badged. His hands are broad and fur-backed with soft pads, the same fur strokes running over the backs of them, four fingers and an opposed thumb in a real closed grip on the short rocks glass, every finger separately contoured, and NOT ONE nail or claw at any fingertip. ABSOLUTELY NO TAIL, tail bulge or tuft anywhere."

E5="HOLD PICTURE 1'S CAMERA EXACTLY. The same distance, the same chest-up crop and his head the same share of the frame as in Picture 1 — do NOT push in closer and do not let the head fill the picture; his shoulders, the collar and the front of the jacket stay in frame, and the back bar stays behind him. Take identity, wardrobe and face from Pictures 2 and 3 but NEVER their staging: Picture 2's standing full-length pose, its belt, its trousers and its blank studio background do not enter this picture, and Picture 3's plain background does not either."

for SEED in "$@"; do
  "$PY" "$S" --character barclay --seed "$SEED" --out "$OUT" \
    --picture1-box "$P1BOX" --picture1-label "$P1LABEL" \
    --ref "$HEADTILE" \
    --extra-edit "$E1" --extra-edit "$E2" --extra-edit "$E3" --extra-edit "$E4" --extra-edit "$E5" \
    --tag study-barclay-r1
done
