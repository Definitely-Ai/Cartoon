#!/usr/bin/env bash
# BARCLAY ROUND 4 - file every render of the round into reports/2026-09-06.
# Three reference-stack passes were burnt before the round proper; they are
# logged too, because what they proved is why Picture 1 is built the way it is.
set -eu

PY="C:/Python313/python.exe"
L="Z:/ImageGenerator/Cartoon/scripts/report-log.py"
R4="C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/dog/round-4"

ASK="The founder: 'its a flamingo you did a terrible job you must perfect each character.' Round 4 for BARCLAY, against the judges' round-3 list: promote canon/vision/studies/barclay.png out of the Picture 2 slot and stop basing the render on the round-3 composite; drop the sc01 profile head; give him a real neck, a two-leaf collar with no tie of any kind, a notched lapel carrying a whole USA flag pin and a round-dialled wristwatch on the wrist; two matched eyes on one level line; a closed lip-line running the full two nose-widths to under the front corner of the near eye and hooking clearly UP so the smile reads happy; layered drop ears clear of the shoulder; three rows of four whisker pips and no ticking anywhere else; clean black pen on white paper with no grey wash; no signature and no blank paper in any corner."

SET8="local/qwen-image-edit-2511 via POST 127.0.0.1:8000/api/generate, fast Lightning 8 steps, cfg 1.0, euler/simple, shift 3.0, 4:5 1344x1680, negative_refs on (LOCAL_NEGATIVE is inert at cfg 1), tag study-barclay-r4, 2 references."

"$PY" "$L" "$R4/pass-a/barclay-seed41.png" --date 2026-09-06 \
  --title "Barclay round 4 pass A seed 41 the promoted drawing sent uncut draws a standing portrait on paper" \
  --ask "$ASK" \
  --thought "The judges' first instruction was to stop using round 3's composite as Picture 1 and promote canon/vision/studies/barclay.png, the real full-quality drawing, into the base slot. Pass A did exactly that, uncut, with the round-3 composite demoted to Picture 3 and labelled for the camera and the crop only." \
  --settings "$SET8 P1 studies/barclay.png cropped 0,20,1024,1100; P2 the same drawing uncut; P3 the round-3 composite." \
  --prompt-file "$R4/pass-a/barclay-seed41.prompt.txt" \
  --verdict "REJECT, and it taught the round its lesson. The CHARACTER jumped: a real neck, a small skull on wide shoulders, two collar leaves over a buttoned placket, no tie, a notched lapel with the flag pin on it, the wristwatch, layered ears, clean pen line, three rows of whisker pips, both eyes level, a warm up-hooked mouth. The PICTURE failed: the uncut Picture 2 handed over its standing three-quarter-length pose (belt, trousers, second hand in a pocket) and, worse, the room never built at all - blank paper, a spiral binding down the left edge, the counter shrunk to a shelf in the corner. An edit model keeps its base picture's ground, and that drawing's ground is studio paper."

"$PY" "$L" "$R4/pass-b/barclay-seed41.png" --date 2026-09-06 \
  --title "Barclay round 4 pass B seed 41 cutting picture 2 to the chest kills the standing pose but not the blank paper" \
  --ask "$ASK" \
  --thought "Pass A's standing pose could only have come from the uncut Picture 2, so Picture 2 was cut to the chest (60,20,860,860 - head, neck, collar, both lapels, the whole pin). The room edit was promoted to the front of the list and hardened with every word for blank paper it could carry: no sheet, no page edge, no sketchbook, no spiral binding, no border, no signature." \
  --settings "$SET8 P1 studies/barclay.png cropped 0,20,1024,1100; P2 the same drawing cropped 60,20,860,860; P3 the round-3 composite." \
  --prompt-file "$R4/pass-b/barclay-seed41.prompt.txt" \
  --verdict "REJECT. The belt and trousers went, so the diagnosis was right. The blank paper did not: the spiral binding came back larger and a signature scribble appeared in the corner. Words cannot beat the base picture on this path - LOCAL_NEGATIVE is inert at cfg 1 and the base's ground is what the model keeps. Picture 1 itself had to carry the room."

"$PY" "$L" "$R4/pass-c/barclay-seed41.png" --date 2026-09-06 \
  --title "Barclay round 4 pass C seed 41 the uncut duo plate as an ink tile redraws the whole two-character plate" \
  --ask "$ASK" \
  --thought "Picture 1 was rebuilt to carry the room (scripts/make-barclay-round4-tiles.py). With the base fixed, the note's other offer was taken up: canon/plates/duo-barclay.png uncut as the third tile, asked for THE INK AND ONLY THE INK, its label saying in as many words that the tall bird in it is Drew and is not to be drawn." \
  --settings "$SET8 P1 the promoted drawing seated in the plate's room; P2 the drawing close up; P3 canon/plates/duo-barclay.png uncut." \
  --prompt-file "$R4/pass-c/barclay-seed41.prompt.txt" \
  --verdict "REJECT, and the third tile is dropped for the round. The model redrew the whole approved plate: flamingo, martini, mirrored window lettering, both armchairs. On this model an uncut duo plate is staging that no label can switch off. Nothing was lost by dropping it - the ink it was wanted for is already inside Picture 1, whose room IS that plate."

for S in 41 3 17 29 58 73; do
  case "$S" in
    41) V="THE BEST OF ROUND 4 and the round's anchor seed. Every fault the note named in the crown-to-collar band is fixed: a real neck with a hand's width of ruff between jaw and collar, a small skull on wide shoulders with the crown well below the top edge, two matched eyes on one level line each with a white crescent at the inner corner and one catchlight, a closed lip-line running the full two nose-widths and finishing in a hook that curls clearly ABOVE the band's middle so the smile reads warm at a glance, layered drop ears with white paper between ear and shoulder, three rows of whisker pips and no ticking anywhere else, two pale collar leaves over a buttoned placket with NO tie of any kind, a real notched lapel with its fold and shoulder seam carrying one small well-formed flag pin with a dark canton and bars, clean black pen with the nose and pupils the only solids, one character, no tail, no signature, the room to all four edges. Cleanest set of the six: bottle labels read as blank panels and the marble is not crazed. Faults left: a second tumbler doubled below the held glass, a stirrer standing in the drink (EDIT 13 forbids both), the wrist hidden by the counter so the watch never gets drawn, and the nose highlight is a broad glossy bar rather than one pinpoint." ;;
    3)  V="Reject on one fault, otherwise as strong as the winner. TWO flag pins on the lapel - a small correct one on the notch and a large one below it - against EDIT 9's 'the ONLY mark on his clothing'. The head band is good: matched eyes, up-hooked closed mouth, real neck, layered ear. Marble crazed, doubled glass, stirrer." ;;
    17) V="Good, third place. The cleanest NOSE of the six - small, modestly modelled, no glossy bar - and a well-drawn ear. Marked down for the near eye reading more lidded than its partner, a break in the lip-line where the hook starts, a lapel with no pocket or seam, and the worst marble of the round: a hard crazed crackle field across the whole counter." ;;
    29) V="Reject. The jacket has gone almost solid black, so the notched lapel loses its fold and the pin's canton is coarse; the chest fur crowds the collar. The head band itself passes - matched eyes, up-hooked mouth, real neck, layered ear. Crazed marble, doubled glass, stirrer." ;;
    58) V="Reject on a stray. A pale chevron artifact sits on the right edge with a visible vertical seam beside it. The lapel is the best drawn of the six (notch, fold, pocket, shoulder seam) and the ear fringe is excellent, but the pin's canton is faint and the near eye carries a heavier lid than its partner." ;;
    73) V="RUNNER-UP, and the best HEAD of the round: the two eyes are the most closely matched pair of the six, both wide, both level, each with its white crescent and its catchlight, and the lapel is a real notched lapel with fold, pocket and shoulder seam carrying a legible pin. Beaten by seed 41 on the room only - the bottle labels carry pseudo-marks where 41's read as blank panels, the marble is a hard crazed crackle field, and a pale slatted object intrudes at mid-left. Doubled glass and stirrer as everywhere." ;;
  esac
  "$PY" "$L" "$R4/barclay-seed$S.png" --date 2026-09-06 \
    --title "Barclay character study round 4 seed $S the promoted drawing seated in the approved room" \
    --ask "$ASK" \
    --thought "The reference swap the judges asked for, plus the correction three passes of this round forced. Picture 1 is the promoted drawing itself - canon/vision/studies/barclay.png, which has the head-to-shoulder proportion, the neck and ruff, the two-leaf collar and the flag pin that round 3 kept losing - but its chest-up FIGURE is matted off its studio paper and seated into the approved plate's own room crop at the plate's camera, head 29 percent of the tile height. That is not the composite the note banned: that one was a graphite HEAD mask on a duo crop, which is where the neckless jaw-on-collar join and the grey wash came from; what is pasted here brings its own neck, ruff, shoulders, collar, lapel and pin, so the geometry faults are fixed BY the paste. Picture 2 is the same drawing close up as the identity tile. The sc01 profile head is dropped as instructed. Fifteen EDIT lines carry the note's list. Where the note contradicts itself - a lip-line ending in a hook lifted clearly ABOVE the band's middle, versus one ending in a soft DOWNWARD tuck that does not hook - EDIT 3 takes the UP hook, because that is the fix the note leads with and the one that cites the founder's happier-not-sad correction; from the tuck line it keeps everything that does not conflict." \
    --settings "$SET8 seed $S. P1 p1-barclay-in-room.png (studies/barclay.png cropped 0,20,1024,1120, matted, scaled to a 420 px head, seated at (101,78) in the round-3 room crop at 2x); P2 studies/barclay.png cropped 60,20,860,860. No third tile." \
    --prompt-file "$R4/barclay-seed$S.prompt.txt" \
    --verdict "$V"
done

"$PY" "$L" "$R4/sheet.png" --date 2026-09-06 \
  --title "Barclay round 4 contact sheet six seeds beside the canon kit bust and head" \
  --ask "$ASK Build a sheet of the six renders at 420 px beside the kit's bust and head tile, labelled with seeds, and judge the crown-to-collar band at 2x before building it." \
  --thought "Six seeds - 41 held as the pose anchor the judges asked to carry forward, plus five new ones (3, 17, 29, 58, 73) - on one reference stack. The note's PROCESS line asked for the head band to be judged magnified first, because every remaining fault lives between the crown and the collar; heads-1..3.png crop (360,150,1010,830) of each render and lapels-1..2.png crop (560,760,1344,1400) for the lapel, the pin and the wrist. The sheet is built after those, so the ranking on it is the magnified ranking." \
  --settings "$SET8 Six seeds 41, 3, 17, 29, 58, 73. Sheet by scripts/build-barclay-round4-sheet.py; renders 420 px wide, kit/bust.png and kit/head.png at the same width." \
  --verdict "The round lands. All six share a real neck, a small skull on wide shoulders, two collar leaves over a buttoned placket with no tie, a notched lapel with a flag pin, layered drop ears clear of the shoulder, three rows of whisker pips on an otherwise clean coat, clean black pen with no grey wash, one character, no tail and no blank paper. BEST: SEED 41 - the anchor - on the cleanest room of the six. Runner-up seed 73 for the best-matched pair of eyes and the best lapel. Three faults are common to every seed and are the round-5 list: the held glass is doubled by a second tumbler below it, a stirrer stands in the drink, and the wrist never clears the counter so the wristwatch the note asks for is never drawn. The marble crazes on four of the six."

echo "filed."
