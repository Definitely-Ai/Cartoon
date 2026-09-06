#!/usr/bin/env bash
# File BARCLAY ROUND 2 into reports/2026-09-06 - the six seeds, then the sheet.
set -eu
PY="C:/Python313/python.exe"
L="Z:/ImageGenerator/Cartoon/scripts/report-log.py"
D="C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/dog/round-2"

ASK="The founder: 'its a flamingo you did a terrible job you must perfect each character.' Round 2 for BARCLAY, against the judges' round-1 list: give him his own signature prop (a rocks glass with one large ice cube and one stemless cherry, never a pick), turn his head and both eyes forward into the room toward Drew, draw a legible USA flag pin on the near lapel, run the true-black lip line the full two nose-widths and hook it up, keep the ear a leather of fine individual strokes, pull the camera back, and keep every second dog, every scribbled label and every stray cheek contour out of the picture."

THOUGHT="The judges named two reference changes as the root causes, and looking at the plates at full size only one of them held. (1) They asked for Picture 1 to be re-cut from canon/plates/duo-barclay.png because duo.png has him 'already near-profile'. Cropped side by side the two plates draw the SAME near-profile head - and so do all twelve approved showcase plates; there is no picture in canon of a forward-turned Barclay to copy. canon/plates/README.md also says what duo-barclay.png actually is: the SPEAKER VARIANT, 'the plate with one mouth open'. A probe render on it (kept in 2a-picture1-from-duo-barclay/) came back in the old profile AND with an open mouth showing teeth - a regression round 1 did not have. (2) They were right about kit/head.png: it is a soft graphite portrait whose nose is stippled mid-grey and whose lip line is a grey curve, so the EDIT naming a true-black lip line was contradicting the picture it pointed at. It is dropped. The lesson from the probe is that this is an EDIT model: it copies Picture 1's GEOMETRY and takes only surface identity from the later tiles, so a pose that is not in Picture 1 does not happen no matter how the prompt is worded. The head turn was therefore DRAWN, not prompted: Picture 1 is now a pre-composite (scripts/make-barclay-picture1-round2b.py) of the duo.png crop (620,600,580,725) with the cocktail pick painted out of the rocks glass by a horizontal clone, and Barclay's near-profile head replaced by the true three-quarter head from canon/vision/studies/barclay.png - the one canon picture with both his eyes whole - cut on a hand-measured polygon, scaled 0.838 to the plate's own 310px crown-to-jaw, tone-matched and feathered in. Picture 2 is that same study cut chest-up so its belt, trousers and picked glass are out of frame; Picture 3 is a head crop of showcase sc07, true engraving with a solid black nose and a heavy black lip band, its two lettered shelf labels blanked. Twelve numbered EDITs carry the rest of the judges' list."

SET="scripts/cast-study.py via scripts/run-barclay-round2.sh - local/qwen-image-edit-2511, provider local, 4:5 -> 1344x1680, fast Lightning 8 steps, cfg 1.0, euler/simple, shift 3.0, 3 references (composited plate crop + chest-up study + sc07 head crop), LOCAL_NEGATIVE verbatim (inert at cfg 1), tag study-barclay-r2."

file_one () {
  SEED="$1"; TITLE="$2"; VERDICT="$3"
  "$PY" "$L" "$D/barclay-seed$SEED.png" --date 2026-09-06 \
    --title "$TITLE" --ask "$ASK" --thought "$THOUGHT" --settings "$SET seed $SEED." \
    --prompt-file "$D/barclay-seed$SEED.prompt.txt" --verdict "$VERDICT"
}

file_one 41 "Barclay character study round 2 seed 41 the head turns but the pick returns" \
"PASS on the pose, FAIL on the prop. The composited Picture 1 held: true three-quarter, both eyes whole and both pupils into the room, mouth closed, solid black nose, the black lip line running back and hooking up, freckles in arcing rows, ear a leather with fringe. But a thin curved pick has grown back out of the cherry - the one seed of six that re-invented it - and the bottle labels carry pseudo-text. The flag pin is a faint blank diamond, not a flag."

file_one 7 "Barclay character study round 2 seed 7 clean prop heavy ruff" \
"PASS on the prop and the pose - cherry and ice cube in the glass with nothing above the rim, three-quarter head, closed mouth, black lip line. Weaker than 44: the far eye is small, the ruff under the jaw is a heavy dark mass, and the pale collar barely shows on the far side. Labels carry pseudo-text; the pin is a blank diamond."

file_one 21 "Barclay character study round 2 seed 21 reject blank balloon over the far eye" \
"REJECT. A blank white speech-balloon shape is drawn over his far eye and brow - fatal, and exactly the balloon the fence forbids. Everything below the eyes is sound (prop correct, lip line, freckles), but the picture cannot be shown."

file_one 33 "Barclay character study round 2 seed 33 strong head labels carry pseudo-text" \
"PASS, second best. The strongest far eye of the six at better than half the near eye's width, clean lifted inner brows, three clear freckle rows, the lip line unbroken and hooked, cherry and cube correct. Held back by pseudo-text on the bottle labels, a crazed white marble at the left edge, and a blank diamond where the flag pin should be."

file_one 44 "Barclay character study round 2 seed 44 best both eyes lip-line hook and the correct glass" \
"BEST OF THE ROUND. Every one of the judges' top four fixes lands: the rocks glass holds one large ice cube and one dark stemless cherry with no pick, skewer or stem anywhere; the head is in a true three-quarter with BOTH eyes whole and both pupils aimed into the room; the lip line is one unbroken true-black stroke from under the back of the nose to under the front corner of the near eye, finishing in a small hook that lifts; the drop ear is a leather of fine individual directional strokes, not a woolly slab. The nose is the blackest mark on the page, the freckles read as three arcing rows, the coat is long feathered strokes with paper showing between them, and the inner brows lift so he reads kind and a little concerned. STILL OPEN: the flag pin is a faint blank diamond, not a legible canton-and-bars flag; the head still takes about 46 percent of the frame's height rather than the third asked for; the nose highlight is a long glossy streak rather than a pinpoint; some bottle labels carry engraved medallions; the marble crazes into white at the bottom-left; and a soft bloom survives around the skull from the composite seam."

file_one 55 "Barclay character study round 2 seed 55 reject white bar across the muzzle" \
"REJECT. A blank white caption bar is drawn straight across his muzzle. Notable anyway as the only seed of six that drew a genuinely legible USA flag - canton, stars and bars - but it put it on his upper sleeve, which the judges forbade, not on the lapel."

"$PY" "$L" "$D/sheet.png" --date 2026-09-06 \
  --title "Barclay character study round 2 contact sheet six seeds beside the kit tiles" \
  --ask "$ASK" --thought "$THOUGHT" --settings "$SET Seeds 41, 7, 21, 33, 44, 55 - the same six as round 1, so the two rounds compare seed for seed." \
  --verdict "Seed 44 is the round's best and the first Barclay in this project that answers the founder's brief: a golden retriever drawn like one, turned into the room with both eyes on the reader's side of his muzzle, the black lip line and the black nose carrying the face, and his own drink in front of him with no olive and no pick. Seeds 21 and 55 are rejects for a blank balloon and a blank caption bar. Four of the six are usable. What is still not right in any of the six: the USA flag pin comes back as a blank diamond on the lapel (seed 55 drew a real flag but on the sleeve), the camera sits closer than the third-of-frame asked for, and the composite seam behind the skull leaves a soft bloom. Those are the round-3 list."
