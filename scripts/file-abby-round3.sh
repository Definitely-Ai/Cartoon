#!/usr/bin/env bash
# ABBY ROUND 3 -> the founder's report for 2026-09-06. Every render of the round,
# the rejected sc12 Picture 1 test that produced the round's key finding, and the
# contact sheet.
set -eu

PY="C:/Python313/python.exe"
L="Z:/ImageGenerator/Cartoon/scripts/report-log.py"
D="C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/abby/round-3"
SET="local/qwen-image-edit-2511, 4:5 1344x1680, fast Lightning 8 steps, cfg 1, euler/simple, shift 3.0, 3 references (Picture 1 the approved blank plate canon/plates/trio.png cut x60..1140 y20..1370 to a true 4:5; Picture 2 canon/characters/abby/kit/bust.png for the collar hardware and the blouse only; Picture 3 the hand-drawn eye chart abby-eye-tile.png), scripts/cast-study.py --cast-count 3 --keep-duo"
ASK="Round 3 of perfecting Abby. The judges called the root cause: rounds 1 and 2 sent a BUST as Picture 1, and qwen-image-edit copies Picture 1's staging, so 6 of 6 came back as portraits on bare paper while the prompt asked for the counter, both hands and the towel. Picture 1 must be a FULL PLATE. Build the eye tile by hand from look-card section 2 and send it as Picture 3 (Step 5, skipped until now); drop canon/vision/studies/abby.png, the source of the level lip line and the animal eye. Fix the jawline, the mouth, the eye, the nose, the ears, the hands and towel, the occlusion and the gaze as EDIT lines. Hold the recipe."

# --- the rejected sc12 test: the finding that set the round's Picture 1 -------
"$PY" "$L" --date 2026-09-06 \
  --title "Abby round 3, seed 41 - the judges' sc12 Picture 1, tested and rejected on lettering" \
  --ask "$ASK" \
  --thought "The judges named canon/showcase-retired/sc12-permanent-receipt.png as Picture 1: the whole art field, caption band cut, resized to the house 4:5. I built exactly that (caption band measured, not guessed - every row from y=1500 down is a flat 245, so the cut is y=1498) and ran it before anything else, because the whole round rests on it. It half-works and half-fails, and the half that fails is fatal, so it is filed as evidence rather than binned." \
  --settings "$SET (Picture 1 = the sc12 art field, 1344x1680)" \
  --prompt-file "$D/rejected-sc12-picture1-seed55.prompt.txt" \
  --verdict "THE DIAGNOSIS IS RIGHT AND THE PLATE IS WRONG. Right: a full-plate Picture 1 brings the whole room back at once - the counter, the back bar, all three characters, both of Abby's hands, the towel, the occlusion at her waist. That is the round-2 failure cured in one move. Wrong: sc12 is a PUBLISHED strip and it is covered in lettering - a live television chyron, a lettered chalkboard and a lettered receipt in Barclay's hands. At cfg 1 the model copied all three and then invented more of it: the chyron came back as 'PPICE GAUES CONES IN AS EXPECTEO', the bottle labels grew scribble, and the receipt kept its columns. Pseudo-text is what INSPECTION.md check 17 calls fatal. Two further drifts: the camera pulled back off the marble into stools and floor, and the left wall grew invented posters. The fix is not to fight the plate with words - it is to send a plate that has nothing to copy. canon/plates/trio.png is the APPROVED BLANK PLATE and carries the identical construction with the screen already off, the slate already wiped, every label already blank and no receipt. Picture 1 changed to trio.png for the rest of the round." \
  "$D/rejected-sc12-picture1-seed55.png"

# --- the eye tile, drawn by hand ---------------------------------------------
"$PY" "$L" --date 2026-09-06 \
  --title "Abby round 3 - her eye, drawn by hand (look-card Step 5, skipped until now)" \
  --ask "$ASK" \
  --thought "Look-card section 1: 'Her corrected eye must be HAND-BUILT once from the section 2 table and become her permanent paste source (Step 5), not copied from any existing picture.' Every tile in the set carries the failing eye instead - the face reference measures 87.6% and 83.5% of each opening below luminance 60, the definitive study 52.3% and 39.7%, and none of them puts white at either side of the iris. A correct eye cannot arrive from a reference that does not contain one, at any seed, which is why six seeds produced the same eye six times. So it is drawn, not sourced: scripts/make-abby-eye-tile.py builds ONE eye in a 512 cell from the section 2 wording and mirrors it for the pair, so both eyes are the same size, shape and height by construction. All line work - the iris mid-tone is made of radiating strokes, not a grey wash - and no lettering anywhere on the tile, because a label would be copied into the picture as pseudo-text." \
  --settings "PIL, drawn at 3x and downsampled, 1024x470, greyscale; sent as Picture 3" \
  --prompt-text "Section 2 of the look card, drawn rather than described: a wide almond wider than it is tall, tilted up at the outer corner; paper-white at BOTH sides of the iris; a mid-grey iris circle built from fine radiating lines; a round black pupil at its centre, smaller than the iris; exactly ONE small catchlight high on the iris; a defined upper lid with the lash sweeping up and out at the outer corner, a soft lower lid below, and two or three fine strokes in a shallow arch above as the brow." \
  --verdict "It does its job and it also taught the round something. It works: the near eye across all six renders measures 23-26% below L60 against 52.3% for the best tile in the repository, with genuine paper-white on both sides of the iris. It has one cost, seen at seed 33 and faintly at 21: a diagram sent as a reference can be drawn INTO the room as a picture - seed 33 put a cartoon westie with one giant eye and a starburst inside the wiped slate. Round 4's tile needs a role line that forbids it appearing as a picture on any wall." \
  "$D/abby-eye-tile.png"

# --- the six renders ----------------------------------------------------------
file_one () {
  "$PY" "$L" --date 2026-09-06 --title "$2" --ask "$ASK" --thought "$3" \
    --settings "$SET, seed $1" --prompt-file "$D/abby-seed$1.prompt.txt" --verdict "$4" "$D/abby-seed$1.png"
}

T_COMMON="Picture 1 is now canon/plates/trio.png, the approved BLANK plate, cut to a true 4:5 that ends at the marble; Picture 2 is kit/bust.png sent for the collar hardware and the blouse ONLY, with its face, eyes, mouth and staging explicitly refused in its role line; Picture 3 is the hand-drawn eye chart. canon/vision/studies/abby.png is dropped. Two flags were added to cast-study.py: --keep-duo, which stops the study scaffolding re-pointing canon's staging paragraph at one figure (with a full-plate Picture 1 that paragraph already describes the plate, and re-pointing it is what told the model to throw the room away), and --cast-count 3. Fourteen numbered EDITS carry the judges' fixes; no human noun appears anywhere in the text I control, which is the rule round 2 proved at cfg 1."

file_one 55 "Abby character study, round 3, seed 55 - the room comes back with the plate" "$T_COMMON Seed 55 first, as the judges asked." \
  "RUNNER-UP OF SIX. The round-2 failure is cured: the room, the marble, the back bar, the sconce and the mirrored window are all there, the counter crosses her at the waist, both hands work the glass and the towel, and Drew and Barclay sit on the near side. Nothing is lettered but the window name - slate blank, every bottle label blank. Her eye is the largest and best drawn of the six: measured 23.8% below L60 with white at 245 and 246 against a paper of 251, so there is real paper-white at both sides of the iris. Marked below seed 44 on two counts: the lip line opens into a distinct dark gap right of centre where the edit says never parted, and the long coat still runs past the jaw down onto the throat."

file_one 41 "Abby character study, round 3, seed 41 - the quietest line, the weakest eye" "$T_COMMON Seed 41 is the recorded house seed and the judges asked for it second." \
  "THIRD. The cleanest, quietest drawing of the six and the closest of them all to Picture 1's own framing, with no strays anywhere in the frame. It is also the ONLY render of the six whose eye misses the white test: the far side of the near iris shades to 219 against a paper of 241, so the white is on one side of the iris and not the other. Dark fraction is fine at 24.5%. Mouth parted right of centre, gaze square at the reader."

file_one 7 "Abby character study, round 3, seed 7 - clean face, two strays" "$T_COMMON" \
  "FOURTH. Slate blank, room right, occlusion right, both hands right, and a good eye at 23.3% dark with white at 238 and 233 on a paper of 245. Two strays keep it out of the top three: a curl of smoke rises off the back bar behind her left ear, and Drew's face is mottled where the rest of the plate is crisp."

file_one 21 "Abby character study, round 3, seed 21 - a ghost in the wiped slate" "$T_COMMON" \
  "REJECT. Abby herself is sound - room, counter, both hands, towel, and an eye at 24.4% dark that all but passes the white test (237 and 232 on a paper of 252, the second side marginal). The reject is the slate: a ghost figure has surfaced inside it, a face and shoulders in faint pencil, where EDIT 2 says a blank wiped slate. Same family of fault as seed 33 and the same cause - a picture-shaped reference finding a picture-shaped hole in the room."

file_one 33 "Abby character study, round 3, seed 33 - the eye chart climbs into the slate" "$T_COMMON" \
  "REJECT, and the most useful failure of the round. Abby is good: the room, the counter, both hands, the towel, and the eye at 25.7% dark with white at 237 and 234 on a paper of 241. But the EYE CHART sent as Picture 3 has been drawn INTO the blank slate as a cartoon - a westie head with one giant eye and a starburst, exactly the diagram's own motifs. The tile did its job on her face and then leaked onto the wall. Round 4's Picture 3 role line must forbid it appearing as a picture anywhere in the room, and the wiped-slate edit should name the slate as bare of pictures as well as bare of words."

file_one 44 "Abby character study, round 3, seed 44 - BEST OF THE ROUND" "$T_COMMON" \
  "BEST OF THE SIX, and the first Abby of the whole task that is a scene rather than a portrait. Every construction fix lands together: the room and the back bar behind her, the marble crossing her at the waist and hiding her below it, both hands working - the left closed round the bowl of the stemmed glass, the right pressing the folded towel down inside it - Drew seated frame-left and Barclay frame-right on the near side, her head high in the frame because she stands while they sit. Nothing is lettered anywhere but the mirrored window name: slate blank, every bottle label blank, no receipt, no caption, no signature. The face: the best measured eye of the round at 24.3% below L60 with white at 250 and 250 against a paper of 253 - genuine paper-white at BOTH sides of the iris, a drawn iris ring, a pupil smaller than the iris, one catchlight, lid and lash - the cleanest closed smile of the six with both corners lifted, ears matched in size and height, a flat black nose smaller than the eye opening, and the teardrop gem in its beaded bezel that the wardrobe edit asked for and earlier rounds drew as a heart. THREE FAULTS REMAIN, and they are the same three in all six, so they are language and reference faults rather than seed faults: (1) THE GAZE - she looks out at the reader, which is the founder's oldest complaint about her; the gaze edit loses to Picture 1, where she also looks out. (2) THE JAWLINE - the long show-coat still runs past the jaw down onto the throat instead of stopping dead at it. (3) THE LIP LINE opens a small dark gap right of centre. Round 4 should hold this Picture 1 and this eye tile and repair those three."

# --- the sheet ----------------------------------------------------------------
"$PY" "$L" --date 2026-09-06 \
  --title "Abby round 3 - contact sheet, six seeds beside the kit tiles" \
  --ask "$ASK" \
  --thought "The six renders at 420 px in seed order, beside kit/bust.png and kit/head.png and beside the two references this round replaced them with - the full-plate Picture 1 and the hand-drawn eye chart. Each panel carries its seed, its measured near-eye numbers and its verdict, so the sheet reads on its own." \
  --settings "scripts/build-abby-round3-sheet.py; numbers from scripts/measure-abby-eye.py" \
  --prompt-text "Not a render - a contact sheet built from the six." \
  --verdict "6 of 6 bring back the room, the counter, both hands and the towel; round 2 was 0 of 6. The near eye measures 23-26% below L60 across all six against 52.3% for the best tile in the repository, and 4 of 6 also clear the paper-white-at-both-sides test. 2 of 6 are rejects, both for the same new fault - a picture appearing inside the wiped slate. Best of the round: seed 44." \
  "$D/sheet.png"
