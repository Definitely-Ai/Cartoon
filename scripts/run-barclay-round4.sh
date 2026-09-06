#!/usr/bin/env bash
# BARCLAY - ROUND 4 (2026-09-06). Six seeds on the house model through
# scripts/cast-study.py, answering the judges' round-3 list.
#
# THE REFERENCE SWAP IS THE WHOLE ROUND. Round 3's stack was
#   P1 = a composite (kit/head.png pasted onto a duo crop)
#   P2 = canon/vision/studies/barclay.png
#   P3 = an sc01 profile head
# and every render copied P1: the neckless mask geometry (jaw sitting straight
# on the collar), the grey graphite wash, the dark triangle at the throat, no
# lapel and no pin. The judges' first instruction is to stop using the composite
# as the base. Round 4's stack:
#
#   PICTURE 1  p1-barclay-in-room.png, built by scripts/make-barclay-round4-tiles.py
#              (read its docstring for the measurements): the promoted drawing's
#              chest-up FIGURE, matted off its studio paper and seated into the
#              approved plate's own room crop at the plate's camera, head 29% of
#              the tile height with the crown well below the top edge.
#
#              DEVIATION, stated, and it cost two passes to learn. The note says
#              to promote canon/vision/studies/barclay.png into the base slot.
#              PASS A sent it uncut, PASS B sent it cropped chest-up; both came
#              back as a portrait on a sheet of paper - spiral binding down the
#              left edge, a signature scribble in the corner, no back bar and no
#              counter - because an edit model keeps its base picture's GROUND
#              and that drawing's ground is blank studio paper. Negative prompts
#              are inert on the cfg-1 Lightning path, so no amount of shouting
#              in the edits could beat the base. Picture 1 therefore carries the
#              promoted drawing AND the room.
#
#              THIS IS NOT THE COMPOSITE THE NOTE BANNED. That one was
#              kit/head.png, a graphite HEAD mask, dropped on a duo crop - which
#              is exactly where the neckless jaw-on-collar join and the grey wash
#              came from. What is pasted here is the whole chest-up figure of the
#              drawing the note promoted: it brings its own neck, its own ruff,
#              its own small skull on wide shoulders, its own two-leaf collar and
#              placket, its own notched lapel and the flag pin on it. Every
#              geometry fault the note lists is fixed BY the paste. The only
#              thing taken from the old tile is the room behind him, and its own
#              pasted head is cloned out of the back bar first so no second dog
#              shows through.
#
#   PICTURE 2  the SAME drawing cut CLOSER (60,20,860,860) - head, neck, ruff,
#              collar, both lapels and the whole flag pin. It is the studio's
#              official portrait, so cast-study.py's own hardcoded EDIT 4
#              ("redraw BARCLAY to match Picture 2, the studio's official
#              portrait, feature for feature") stays true instead of pointing at
#              a tile it was never written for.
#
#              PASS A OF THIS ROUND SENT IT UNCUT and the render (kept at
#              pass-a/barclay-seed41.png) copied the uncut file's STANDING
#              THREE-QUARTER-LENGTH pose out of it: belt, trousers, the second
#              hand in a pocket, the counter shrunk to a shelf in the corner,
#              and the room never built at all. Cutting it to the chest removes
#              the only place that staging could have come from. The wristwatch
#              is the one mark the cut drops, and EDIT 10 names it in words.
#
#   PICTURE 3  NONE. The note offers canon/plates/duo-barclay.png uncut as the
#              replacement third tile; PASS C sent it, labelled for THE INK ONLY
#              and saying in as many words that the tall bird is Drew and is not
#              to be drawn. The render came back as the whole two-character
#              plate - flamingo, martini, window lettering and all. On this model
#              an uncut duo plate is staging no label can switch off, so the tile
#              is dropped and the round runs on two references.
#
#              Nothing is lost by it. The ink that tile was wanted for is already
#              inside Picture 1: the room it is pasted into IS the approved
#              plate, in the house engraving pen, and EDIT 11 names the pen.
#
#              The round-3 composite survives only as that room inside Picture 1;
#              it is no longer sent as a tile of its own. Demoted further than
#              the note asked, for the note's own reason - its grey and its
#              geometry were what every render was copying.
#
#   DROPPED    p3-barclay.png, the sc01 profile head. The note is right about
#              it: a profile with a parted mouth showing a canine, and it was
#              pulling the lip-curl and pulling the head back to profile.
#
# ONE CONTRADICTION IN THE NOTE, resolved and flagged. It asks in one line for
# the lip-line to end "in a small rounded hook" under the near eye and for that
# hook to be lifted "clearly ABOVE the level of the lip line's middle" per the
# founder's happier-not-sad correction, and in another for the line to end in "a
# soft DOWNWARD tuck ... It does not curl up, it does not hook, it never runs
# back past the cheek". Those cannot both be drawn. EDIT 3 takes the UP hook:
# the two up-hook lines are the round-3 fixes the note leads with and one of
# them cites the founder directly, while the downward-tuck sentence is round
# 3's own wording carried forward. From the tuck line EDIT 3 keeps everything
# that does not conflict - one unbroken fine black line, mouth closed, no
# tooth, tongue or gum.
set -eu

PY="C:/Python313/python.exe"
S="Z:/ImageGenerator/Cartoon/scripts/cast-study.py"
OUT="C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/dog/round-4"

PORTRAIT="Z:/ImageGenerator/Cartoon/canon/vision/studies/barclay.png"
P1="$OUT/p1-barclay-in-room.png"

"$PY" "Z:/ImageGenerator/Cartoon/scripts/make-barclay-round4-tiles.py"

P1LABEL="THE PICTURE BEING EDITED, AND IT IS ALREADY NEARLY RIGHT. BARCLAY the golden retriever gentleman alone at the marble counter of The Swinging Door, chest-up, the panelled back bar and its bottle shelves behind him. KEEP ALL OF IT: this room, this camera, this distance, this eye level, this crop, this light, THIS HEAD AND ITS TRUE THREE-QUARTER TURN, both eyes whole and level, this long refined muzzle, this closed smiling mouth, the LENGTH OF HIS NECK and the ruff standing between his jaw and his collar, the SMALL SKULL on WIDE SHOULDERS, the two pale collar leaves and the buttoned shirt front between them, the real notched lapel with its fold and its shoulder seam, the USA flag pin on it, and the fur-backed hand round the glass. HE IS A ROUGH PASTE-UP INTO THIS ROOM: his placement, his size, his proportions and his features are law; the seam where he meets the back bar, the doubled glass at his hand and the softness of his pencil are not. Redraw the whole picture as ONE engraving in the house engraving pen, changing nothing about who he is or where he sits."

P2LABEL="THE SAME DOG CLOSE UP, THE STUDIO'S OFFICIAL PORTRAIT. Copy this dog feature for feature: the head at its true three-quarter, both eyes whole and level with white sclera at the inner corners, the two raised inner brows, the long refined muzzle with its three neat rows of whisker pips, the closed mouth whose lip-line hooks UP at its end, the layered drop ears, the ruffed neck standing clear of the collar, the two pale collar leaves over a buttoned placket with NO tie of any kind, the notched lapel with its fold and shoulder seam, and the whole USA flag pin on it with its dark canton, its pale stippled stars and its alternating bars. The finished Barclay must be indistinguishable from this one."

E0="THE ROOM IS PICTURE 1'S ROOM AND IT FILLS THE FRAME. The marble counter crosses the bottom of the frame with his short rocks glass standing on it, and the panelled back bar with its bottle shelves and its dark slat panelling runs on behind his head, behind his ear and behind both shoulders, out to the left edge and the right edge. THE ROOM REACHES ALL FOUR EDGES AND ALL FOUR CORNERS. There is NO blank paper, NO plain or pale backdrop, NO white or grey void, NO drawn sheet, NO page edge, NO sketchbook, NO spiral binding, NO rings, NO torn or curling paper and NO border anywhere, and NO signature, monogram, artist mark, initials or pencil scribble on it. Close the room up cleanly where he meets it: NO seam, NO halo, NO bloom, NO glow and NO soft grey smear around his head, his ear or his shoulders."

E1="HOLD PICTURE 1'S HEAD EXACTLY - the TRUE THREE-QUARTER turn into the room, toward DREW at the far end of the counter and not down the shelf of bottles, with the muzzle to frame-left. BOTH EYES ARE WHOLE AND BOTH ARE ON THE READER'S SIDE OF THE MUZZLE; the bridge of the muzzle passes BELOW the far eye and never across it, and the far cheek keeps a full finger's width of fur beyond the bridge. The back of his skull is NEVER the nearest part of him to the reader. Keep Picture 1's fine directional fur - this angle, this framing and this fur are already right and are not to be redrawn from scratch."

E2="BOTH EYES ARE THE SAME EYE: two matched almonds of equal size sitting on ONE level line, the far one narrowed only by foreshortening, each with a full round dark iris, a clean white crescent of sclera at the inner corner and one small catchlight in the same upper-left place in both; NEITHER eye is a slit, neither has a pouch or bag beneath it, and both pupils point at the same spot off frame-left. The worry lives only in TWO RAISED INNER BROWS - a pale dome above each eye with a short soft brow arc lifting at its inner end."

E3="THE MOUTH IS CLOSED AND SMILING, AND THE LIP-LINE IS ONE UNBROKEN FINE TRUE-BLACK BAND. It starts at the corner of the nose and runs BACK along the bottom of the muzzle a FULL TWO NOSE-WIDTHS, past the cheek, ending DIRECTLY UNDER THE FRONT (nose-side) CORNER OF THE NEAR EYE - it does not stop short at the cheek and it leaves no gap of plain fur before the eye. Where it ends it finishes in a SMALL ROUNDED HOOK THAT CURLS CLEARLY UPWARD, its tip standing plainly ABOVE the level of the band's middle, so the closed-mouth smile reads WARM AND HAPPY at first glance - not sad, not flat, not drooping. No tooth, no tongue, no gum and no gap shows anywhere, and there is no detached tick, comma, dot or dash near the mouth."

E4="HE HAS A NECK. A hand's width of ruffed throat fur stands between the jaw and the shirt collar, and the jaw NEVER touches the jacket. His skull is clearly NARROWER than his shoulder span - shoulders wide, head small on top of them - and the crown sits well below the top of the picture."

E5="THE NOSE IS A MODEST SOLID TRUE-BLACK WEDGE with one clean pinpoint highlight on its top plane - never a large round bulb, never a grey bead, never a broad glossy shine, never a cast shadow beneath it. The muzzle it sits on is LONG and refined."

E6="EACH DROP EAR IS A LAYERED LEATHER OF LONG FEATHERED STROKES hanging free from a root level with the top of the eye, with a visible gap of WHITE PAPER between the ear's back edge and the shoulder behind it. The ear is never a solid slab, never a scribble filling a shape, and it never merges into the neck fur, the ruff, the collar or the jacket."

E7="THE COAT IS LAID IN LONG LAYERED DIRECTIONAL STROKES THAT FOLLOW THE FORM - sweeping back over the skull, down the cheek and fanning out through the ruff, shortening and fining on the muzzle, with white paper showing between them. THE MUZZLE CARRIES THREE NEAT ROWS OF FOUR WHISKER PIPS ON EACH SIDE, small and evenly spaced. The rest of him is CLEAN: no scattered freckles, no ticking, no spots or dapples over the skull, the ears, the chest or the coat - he is a plain pale golden retriever."

E8="THE SHIRT IS A REAL COLLARED SHIRT: two separate pale collar leaves, one on each side of the open neck, a buttoned placket down the chest between them and two small round buttons on it. There is NO tie, NO bow tie and NO dark triangle of any kind at his throat - the bow tie belongs to Drew alone."

E9="A SMALL USA FLAG PIN sits on his LEFT LAPEL at chest height, drawn whole and legible - a little rectangle with a dark canton carrying pale stippled stars in its upper hoist corner, alternating pale and dark bars filling the rest, and a fine staff dropping below the flag - and it is the ONLY mark on his clothing. The lapel carrying it is a real NOTCHED LAPEL with a visible fold and a seam where it meets the shoulder, not a flat panel of the same cloth as the sleeve. FRAME HIM SO THAT NEAR-SIDE LAPEL IS FULLY IN THE PICTURE: the pin is a permanent identity mark and is never cropped out, never behind the glass and never on the far shoulder. There is no other pin, badge, bar, patch or pale rectangle anywhere on him."

E10="HIS HAND IS A FUR-BACKED HAND WITH FOUR SEPARATE FINGERS AND AN OPPOSED THUMB, each finger keeping its own outline and its own knuckle round the glass, the thumb on the reader's side, and NOT ONE nail or claw at any fingertip - never a fused mitten, a blob or a paw stump. WHERE THAT WRIST IS IN FRAME IT WEARS THE WATCH: a plain ROUND DIALLED WRISTWATCH on a dark band at the wrist where the sleeve ends, on the same left wrist as in Picture 2. Like the pin it is a permanent identity mark and must not be cropped away."

E11="DRAW EVERYTHING IN CLEAN BLACK PEN LINE ON WHITE PAPER exactly like Picture 1: crisp separated strokes with the white of the paper showing between them, tone built only by hatching, the nose and the pupils the ONLY solid blacks in the figure. NO grey wash, no smudged or rubbed tone, no soft airbrushed shading, no wavy embossed rippled or plastic texture anywhere, and no soft grey halo, bloom or vignette around his head."


E13="NOTHING LETTERED AND NOTHING BLANK. There is NO lettering, no pseudo-writing and no scribble resembling text anywhere: EVERY bottle label is a smooth EMPTY PAPER PANEL, the television is dark glass and the chalkboard is bare slate. The marble is PALE STONE with a few long soft grey veins - never a crazed, cracked or shattered crackle field. The glass rim is one unbroken ellipse with nothing crossing it: no pick, skewer, stirrer, straw or stem, and the dark cherry lies down inside the drink below the liquid line."

E14="EXACTLY ONE CHARACTER IS IN THIS PICTURE. The back bar holds ONLY bottles and glassware - no second dog, no bird, no flamingo, no figurine, statuette, bottle-topper or framed portrait of any animal or person. ABSOLUTELY NO TAIL. No stray contour crosses his cheek: no line runs from behind the eye back toward the ear, and there is no crease, scar or fold on the side of his head."

E15="KEEP PICTURE 3'S DISTANCE. His head takes NO MORE THAN A THIRD of the picture's height, the crown sits well below the top edge, and his shoulders, BOTH lapels, the flag pin and the front of the jacket all stay inside the frame. Do not push in closer and do not crop the picture at his chest. HE IS SEATED AT THE COUNTER AND THE PICTURE ENDS AT THE MARBLE: this is NOT a full-length or standing portrait, and NO belt, NO waistband, NO trousers, NO legs and NO second hand in a pocket appear anywhere."

POSE="Barclay sits alone at the marble with his old fashioned in front of him, his head turned FORWARD INTO THE ROOM in a full three-quarter toward Drew at the far end of the counter, both eyes whole and level, his mouth closed in a warm friendly smile with the worry only in his two raised inner brows, one fur-backed hand curled round the glass with the watch on that wrist."

for SEED in "$@"; do
  "$PY" "$S" --character barclay --seed "$SEED" --out "$OUT" \
    --picture1-path "$P1" --picture1-label "$P1LABEL" \
    --picture2-path "$PORTRAIT" --picture2-box "60,20,860,860" --picture2-label "$P2LABEL" \
    --pose "$POSE" \
    --extra-edit "$E0" --extra-edit "$E1" --extra-edit "$E2" --extra-edit "$E3" --extra-edit "$E4" \
    --extra-edit "$E5" --extra-edit "$E6" --extra-edit "$E7" --extra-edit "$E8" \
    --extra-edit "$E9" --extra-edit "$E10" --extra-edit "$E11" \
    --extra-edit "$E13" --extra-edit "$E14" --extra-edit "$E15" \
    --tag study-barclay-r4
done
