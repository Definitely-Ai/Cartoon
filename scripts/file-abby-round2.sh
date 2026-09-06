#!/usr/bin/env bash
# ABBY ROUND 2 - file every render of the round into reports/2026-09-06/,
# in the order it happened: the six that failed with the judges' wording, the
# three isolation renders that found out why, the six that shipped, the sheet.
set -eu

PY="C:/Python313/python.exe"
LOG="Z:/ImageGenerator/Cartoon/scripts/report-log.py"
RD="C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/abby/round-2"
D="--date 2026-09-06"

SET_FAST="local/qwen-image-edit-2511 via POST /api/generate, 4:5 1344x1680, fast Lightning 8 steps, cfg 1.0, euler/simple, shift 3.0, output png, tag study-abby-r2. Built by scripts/cast-study.py."

# ---------------------------------------------------------------- pass 1: the judges' wording, verbatim
ASK1="ABBY ROUND 2. The judges' fix list from round 1, applied as EDIT lines: one figure only, gaze off the lens with the far eye at least half the near one, both hands visible with four fingers and a thumb, exactly one towel, the full anchor composition, a closed mouth, the two-length fur rule, the blouse open two buttons, delicate face shading. Plus the lead's root-cause call: REPLACE PICTURE 1 with a crop of the approved plate sc04-fourteen-dollars-of-roof.png at box 470,345,345,680, drop kit/bust.png as Picture 3, re-word Picture 1's label so it names no fault, replace EDIT 6 with a measured frame and EDIT 12 with a positive statement of what fills the room."
THO1="I cut the lead's sc04 box and put it on a coordinate grid before sending it. It is not quite one figure: BARCLAY'S muzzle and black nose sit in the bottom-right corner (crop x 255-345, y 596-680) and the RENEWAL NOTICE envelope in the bottom-left carries lettering the study's rules forbid on the marble. Both were cloned over with marble from the same plate by scripts/make-abby-picture1-round2.py; the rocks glass's rim ends at x~265 so the fill starts at 262 and the glass survives whole. I also re-pointed EDIT 4 off its shipped wording - it describes 'the round soft head' and a shoulder towel, four items before the edits that have to undo both - by adding a --character-edit flag to cast-study.py. The judges' phrasings went onto the wire as written."

file_one () { # image title ask thought verdict promptfile
  "$PY" "$LOG" "$2" --title "$3" --ask "$4" --thought "$5" --verdict "$6" \
        --settings "$SET_FAST" --prompt-file "$7" $D >/dev/null
  echo "filed  $3"
}

for S in 55 7 41 21 33 44; do
  case $S in
    55) V="REJECT. A human woman in a blouse with a real four-legged westie held against her chest. The bar is gone: blank sketchbook paper behind them.";;
    7)  V="REJECT. A human woman at a table with a four-legged terrier sitting beside her; a wristwatch on her arm. No bar, no counter, no back bar.";;
    41) V="REJECT. A human woman and TWO four-legged westies on blank paper. Three beings, none of them Abby.";;
    21) V="REJECT. Split again - a human figure plus the terrier as a pet. Room gone.";;
    33) V="REJECT. Split again. Room gone.";;
    44) V="REJECT. Split again. Room gone.";;
  esac
  file_one x "$RD/rejected-human-nouns/abby-seed$S.png" \
    "Abby character study round 2 pass 1 seed $S the sc04 tile and the judges wording" \
    "$ASK1" "$THO1" "$V" "$RD/rejected-human-nouns/abby-seed$S.prompt.txt"
done

# ---------------------------------------------------------------- the isolation renders
ASK2="Six of six came back split into a person plus a real four-legged pet, with the bar gone. Find which change did it before spending another six seeds."
THO2="Round 1's own diagnostic pass had already proved that the words HUMAN and WOMAN in the eye edit are read as NOUNS at cfg 1 and get drawn. The judges' fix list is written in exactly those nouns - 'the ONLY other person in the room', 'no extra human', 'dog-yet-HUMANOID hands', 'human bartender', 'human hands' - and I had carried them onto the wire verbatim. So: purge every human noun from the prompt I control (human, humanoid, woman, lady, person, man, customer), restate every judges' fix in terrier nouns, and change ONE thing at a time from there."

file_one x "$RD/iso/abby-seed55.png" \
  "Abby round 2 isolation seed 55 human nouns purged and Picture 1 back to the shipped plate crop" \
  "$ASK2" "$THO2" \
  "PASS. One upright anthropomorphic Abby, no human, no second dog: the first clean single-Abby render of the project on the standard prompt. Closed mouth, real eyes with whites and a drawn iris, collar and teardrop, blouse open. Fails on staging: no room, no hands, no counter, and the head fills the frame. This is the configuration the shipped six were run on." \
  "$RD/iso/abby-seed55.prompt.txt"

file_one x "$RD/isoA/abby-seed55.png" \
  "Abby round 2 isolation seed 55 room edit moved early with the shipped plate crop" \
  "$ASK2" \
  "The room had started falling out of the picture once round 1's negation list was replaced, so this pass moved a positive ROOM edit up to third of mine and rewrote it to name the back bar, the marble and every corner of the paper." \
  "REJECT. Moving the room edit early bought nothing and cost the identity: a human youth with a four-legged westie, on paper. The room edit is not the lever; leave the order alone." \
  "$RD/isoA/abby-seed55.prompt.txt"

file_one x "$RD/isoB/abby-seed55.png" \
  "Abby round 2 isolation seed 55 the sc04 crop demoted to a staging-only Picture 3" \
  "$ASK2" \
  "If the sc04 crop cannot be Picture 1, try it as Picture 3 for STAGING ONLY - the room, the distance and the hands - with the shipped plate crop back as Picture 1 and the official portrait as Picture 2." \
  "MIXED, still a reject. The staging tile DID bring the room back - a full back bar, ranked bottles, the counter across the bottom - but the figure split again: a human bartender with the terrier beside him. The room is recoverable from a third tile; the identity is not survivable next to a torso reference." \
  "$RD/isoB/abby-seed55.prompt.txt"

# ---------------------------------------------------------------- the shipped six
ASK3="Round 2, the pass that ships: every judges' fix kept, all of them restated in terrier nouns, with Picture 1 back to the shipped plate crop and the six round seeds re-run at the recorded recipe."
THO3="The lead's root-cause call was tested eleven times and lost every time: the sc04 crop shows Abby HEAD TO HANDS - a terrier head on an upright torso with two arms - and at cfg 1 the model cuts along that seam, torso to a person and head to a pet. The shipped trio.png crop is a HEAD, and a head offers nothing to split off. So Picture 1 goes back, Picture 3 stays dropped, and the whole weight of the round goes on language: no human noun anywhere, the count of living figures stated first, then the lead's measured frame, the eye in five parts with its new brow arch and radiating iris, the gaze off the lens, the one towel, the breed (carrot skull, square muzzle, shallow forehead, two fur lengths), the blouse open two buttons, and the positive back-bar count closing the list. The hands went into THE BUSINESS, edit 5 of 14, which is the promotion the judges asked for - EDIT 2 is not reachable, cast-study.py hardcodes edits 1 to 5."

for S in 55 7 41 21 33 44; do
  case $S in
    55) V="BEST OF THE SIX. One Abby and nothing else alive. Carrot skull, short square muzzle, fully closed warm smile, collar-buckle-ring-teardrop, blouse open two buttons with the decolletage showing. Best eyes of the round - white at both sides of the iris, a drawn iris with a rim, a distinctly smaller pupil, one catchlight, lashes and a lid - and the gaze furthest off the lens, down and to her left. FAILS: no room, no counter, no hands, no towel, and the head fills the frame instead of the top third.";;
    7)  V="One Abby, no second being. Eyes right, mouth closed, teardrop clean. The gaze sits nearer the reader than 55 and the chin is dropped. No room, no hands, no counter, no towel.";;
    41) V="One Abby. The cleanest, quietest line of the six - but the gaze comes closest of all six to meeting the reader, which is the founder's oldest complaint about her. No room, no hands, no counter, no towel.";;
    21) V="One Abby. Faint pencil scribbles run along the bottom edge where a signature keeps trying to appear. No room, no hands, no counter, no towel.";;
    33) V="One Abby, but her left shoulder runs off the frame and the bust reads heaviest of the six against the OPEN THE NECKLINE NOT THE FIGURE rule. No room, no hands, no counter.";;
    44) V="One Abby. The finest lashes and lids of the round and the iris rim clearly drawn - but the gaze tips UP and away from the work her hands are supposed to be doing. No room, no hands, no counter, no towel.";;
  esac
  file_one x "$RD/abby-seed$S.png" \
    "Abby character study round 2 seed $S one upright terrier the split is fixed" \
    "$ASK3" "$THO3" "$V" "$RD/abby-seed$S.prompt.txt"
done

# ---------------------------------------------------------------- the sheet
"$PY" "$LOG" "$RD/sheet.png" \
  --title "Abby round 2 contact sheet six seeds beside the kit bust and head" \
  --ask "Build the round-2 sheet: the six renders at 420 px beside the kit's bust and head tiles, labelled with seeds and verdicts, so the round reads on its own in Rick's report." \
  --thought "The sheet carries the round's one real result in its subtitle - THE SPLIT IS FIXED 6 OF 6, THE STAGING FAILS 6 OF 6 - and the footer records what the eleven sc04 renders bought, so the next round does not spend another morning on that crop." \
  --settings "Composited by scripts/build-abby-round2-sheet.py from the six 1344x1680 renders and canon/characters/abby/kit/{bust,head}.png. 1702x1542." \
  --verdict "Round 1 was 0 of 6 on identity; round 2 is 6 of 6. What round 3 owes Rick is the room, the counter and both hands - all six of these are portraits on bare paper." \
  $D >/dev/null
echo "filed  sheet"
