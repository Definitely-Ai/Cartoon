#!/usr/bin/env bash
# File Barclay round 1 (six renders + the contact sheet) into the founder's
# daily report for 2026-09-06.
set -eu

PY="C:/Python313/python.exe"
L="Z:/ImageGenerator/Cartoon/scripts/report-log.py"
D="C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/dog/round-1"

ASK="The founder: 'its a flamingo you did a terrible job you must perfect each character.' Barclay's turn — draw him as a golden retriever actually drawn like one, warm and professional, on the house model, six seeds, and name the best."
THOUGHT="Not room-part.py and not sensenova — the house model local/qwen-image-edit-2511 through scripts/cast-study.py, the recipe Rick's approved plates were made with. Picture 1 is a 4:5 crop of the approved duo.png with Barclay alone, RE-CUT this round to (640,620,560,700) — wider and lower than the script's default (680,640,520,650) — because Drew's round 1 showed the model pushing in past Picture 1's crop; a roomier Picture 1 keeps the shoulders, the collar V and the jacket front in frame. Picture 2 is his official portrait; Picture 3 is NEW this round: canon/characters/dog/kit/head.png, the tight head tile, because his look card's failure mode 2 is that the black lip band and the eye's paper-white are the first two marks the pipeline loses, and that tile carries both at native resolution. Three references is exactly the qwen family's max_refs, so nothing is dropped. Five extra EDIT lines name, positively, what his judge checklist fails him on: the sad first glance (worry in the brows only, mouth closed with the corner hooking UP), the three-mark eye and the black-labrador lip line, the layered coat with three arcing rows of freckles and a modest ruff, and the wardrobe/hands/no tail, plus a hold-the-camera line."

SET="local/qwen-image-edit-2511, fast Lightning 8 steps, cfg 1.0, euler/simple, shift 3.0, 4:5 1344x1680, 3 references (duo.png crop 640,620,560,700 + vision/studies/barclay.png + characters/dog/kit/head.png), scripts/cast-study.py"

file_one () {
  SEED="$1"; TITLE="$2"; VERDICT="$3"
  "$PY" "$L" "$D/barclay-seed$SEED.png" \
    --date 2026-09-06 \
    --title "$TITLE" \
    --ask "$ASK" \
    --thought "$THOUGHT" \
    --prompt-file "$D/barclay-seed$SEED.prompt.txt" \
    --settings "$SET, seed $SEED" \
    --verdict "$VERDICT"
}

file_one 41 "Barclay character study round 1 seed 41 - a real retriever, but the camera crept in" \
"HOLD. He is unmistakably a golden retriever now — layered fur in individual strokes, drop ear with fringe, black nose the blackest mark, mouth closed with the corner hooking up, the eye carrying paper-white and one catchlight. Two faults: the camera pushed past Picture 1's crop so the head fills the frame and the jacket is half out of it, and the bottle labels came back with scribbled pseudo-lettering instead of the blank panels edit 3 asked for. The muzzle is also the longest and heaviest of the six. Not the pick."

file_one 7 "Barclay character study round 1 seed 7 - the warmest face of the round" \
"KEEP AS THE FACE REFERENCE. The best expression in the six: both inner brows lifted with one faint forehead crease, the closed lip line hooking clearly UP at the corner, cheeks full, the eye's dark mass at the front of the opening with paper-white behind it and a single catchlight, ten-odd freckles in loose rows. Ear fringe is fine, not wiry. Faults: the flag pin came back as a blank white triangle with no canton (checklist 12 fail), the lip band is grey and stops short of the eye's front corner, and two bottle labels still carry pseudo-text. Second place."

file_one 21 "Barclay character study round 1 seed 21 - good face, the ear turns woolly" \
"NO. The face is close to seed 7's — closed mouth, corner up, eye built right — but the camera sits nearer than Picture 1 again, the ear leather has gone to a dense woolly mass rather than separate fringe strokes (his recorded failure mode 3), no flag pin appears at all, and the labels carry pseudo-text. Usable evidence, not the pick."

file_one 33 "Barclay character study round 1 seed 33 - REJECT, a second dog on the shelf" \
"REJECT. Barclay himself is fine, but the model hallucinated a SECOND character standing among the bottles on the back bar — a small jacketed dog, complete with its own head and legs. Exactly the 'EXACTLY 1 character' rule the study prompt states twice, broken. Fatal on its own; filed so the round shows what the seed did."

file_one 44 "Barclay character study round 1 seed 44 - BEST, the camera held and the flag pin drawn right" \
"BEST OF THE ROUND. The only render that passes the whole spine of his checklist at once: camera and chest-up crop held to Picture 1 (head does not fill the frame, shoulders and jacket front in), first glance friendly — closed mouth with the corner hook lifting above the line's middle, worry only in the lifted inner brows; the eye in three marks with paper-white behind the dark and one catchlight, lid clear of the dark; freckles in arcing rows on the near muzzle; one drop ear rooting level with the eye and finishing at the jaw with separate fringe strokes down the nape; modest ruff with the pale collar showing both sides; no tail; hand wrapping the rocks glass with no nail or claw at any fingertip. And the USA flag pin is properly DRAWN on the lapel — dark canton, stars stippled pale, alternating bars, a fine staff along the hoist — which no other seed managed. Remaining faults for round 2: the black lip band is a grey line that stops short of the eye's front corner instead of a fine true-black line ending under it; the freckles run six to ten, under the fifteen to twenty in three rows; a couple of bottle labels still carry faint pseudo-marks."

file_one 55 "Barclay character study round 1 seed 55 - warm face, pin lands on the shoulder" \
"NO, BUT CLOSE. Camera held as well as seed 44, the warmest muzzle freckling of the six and a good three-mark eye, closed mouth with the corner up. Two faults put it behind 44: the flag pin is drawn large and legible but pinned to the upper ARM/shoulder rather than the lapel (checklist 12 fail), and a stray thin looping line hangs off the rear corner of the eye. Third place."

"$PY" "$L" "$D/sheet.png" \
  --date 2026-09-06 \
  --title "Barclay character study round 1 - the contact sheet, six seeds against the reference kit" \
  --ask "$ASK" \
  --thought "$THOUGHT" \
  --prompt-text "Contact sheet built by scripts/build-barclay-round1-sheet.py: the six round-1 renders at 420 px beside canon/characters/dog/kit/bust.png and kit/head.png, each render labelled with its seed and its one-line verdict." \
  --settings "$SET, seeds 41 / 7 / 21 / 33 / 44 / 55" \
  --verdict "Round 1 is a pass on the SPECIES and a hold on the DETAIL. Six for six he is now a golden retriever drawn like one — layered fur in individual strokes, drop ear with fringe, black nose, closed mouth with the corner turning up, the human eye with visible white and a catchlight — which is the thing the founder said was missing. SEED 44 IS THE PICK: it alone holds Picture 1's camera AND draws the flag pin properly on the lapel with a legible canton. Seed 7 is the warmest face and seed 55 is third; seed 33 is a reject (a second dog hallucinated on the back-bar shelf); seeds 41 and 21 pushed the camera in past the plate's crop. Round 2 should carry seed 44 forward with three fixes: make the black lip band a fine TRUE-BLACK line running two nose-widths to directly under the front corner of the near eye, raise the muzzle freckles to fifteen to twenty in three arcing rows, and kill the last pseudo-lettering on the bottle labels."
