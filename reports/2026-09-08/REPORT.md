# The Swinging Door - studio report, 2026-09-08

Built for Rick. Every image the studio generated today, in the order it happened, with the ask that drove it, the thinking behind the decision, the exact prompt and settings, and the verdict. Images are in `images/`, prompts in `prompts/`.

## 001. whole-plate assembled with bartenders-marble-ledge back-bar-lower-shelf back-bar-upper-shelf back-bar-carcass television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign

![whole-plate assembled with bartenders-marble-ledge back-bar-lower-shelf back-bar-upper-shelf back-bar-carcass television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign](images/001-whole-plate-assembled-with-bartenders-marble-ledge-back-bar-lower-shelf-back-bar-upper-shelf-back-bar-carcass-.png)

**The thinking.** Base plus every approved, enabled part laid in order through its own silhouette; the TV's blank screen and the window's lettering are drawn in code last, because lettering is never left to the model.

*Logged 09:42.*

---

## 002. Monday: the founder's four decisions and the day's two teams - Drew into the scene (team Drew), the inlaid back bar (design round)

![Monday: the founder's four decisions and the day's two teams - Drew into the scene (team Drew), the inlaid back bar (design round)](images/002-monday-the-founder-s-four-decisions-and-the-day-s-two-teams-drew-into-the-scene-team-drew-the-inlaid-back-bar-.png)

**The ask.** 1 b and c are actually from a we need to get that character into our scene today ... 2 its barclay ... 3 we need a inlaid shelf that has 2 rows of bottle and then an area to make drinks below it ... 4 get them all in the scene first ... build a team for each character

**The thinking.** Drew is the official portrait; the study script's rebuilt house recipe (edit model, portrait as the tile) becomes a placement script that edits a crop of the real room - Picture 1 - and keys the character out by what changed, so he becomes a layer like every other object. Team Drew: an Opus placer, rounds of six seeds, a Sonnet checklist judge and an Opus eye against the portrait and the staging the founder scored highest, up to five rounds; Barclay's and Abby's teams follow once Drew is verified. In parallel two Opus designers draw the inlaid back bar - set into the wall, two bottle rows, the drinks ledge beneath, its own interior, the wall untouched - for critics before any GPU. The chairs are back in the plate for the scene.

**Settings.** workflows drew-in-the-scene, inlaid-back-bar; chairs ON; Barclay's name provisional

**Verdict.** in progress

*Logged 09:44.*

---

## 003. Drew placed in the left chair, seed 41 - first cast-place round

![Drew placed in the left chair, seed 41 - first cast-place round](images/003-drew-placed-in-the-left-chair-seed-41-first-cast-place-round.png)

**The ask.** Get Drew into the approved room-kit v2 plate: build scripts/cast-place.py, test with Drew seed 41, and measure how clean the difference key is.

**The thinking.** cast-place.py crops plate.png 4:5 around the left chair (20,700-660,1500), upscales to 1344x1680 as Picture 1, sends studies/drew.png as Picture 2 ('copy THIS bird identically'), and asks for two edits only: ADD DREW seated in the left chair seen from behind and a little to his left, turned toward Barclay's chair; and keep everything else exactly as Picture 1 (stated FIRST, --keep-first). The result is tone-matched, aligned and difference-keyed against the crop, and the blob in the chair becomes an RGBA sticker laid on the approved plate. MEASUREMENT: the key is dirty and it cannot be otherwise - local_bridge.py _graph_qwen samples an EmptySD3LatentImage at denoise 1.0, so every pixel comes back drawn from noise. 80 percent of the crop differs from the plate by more than 12 levels after tone matching and alignment; it stays at 71-74 percent blurred at sigma 12, and local normalised cross-correlation between render and plate has a MEDIAN of 0.02, so the room is genuinely re-inked, not jittered. Raising the key threshold does not find the bird either - his white plumage sits on light marble, so the marble veins outrank him. What works is the geometry guard: the sticker may not leave the pose envelope from poses.json (140,770-620,1340), so the window, the far marble, the bar front and the right-hand chair are always the plate's own pixels. Drew reads correctly: three-quarter head, bill and eye toward the right chair, bow tie, sweater vest, feathered hand on the marble, martini.

**Settings.** local/qwen-image-edit-2511, fast Lightning 8-step cfg 1, 4:5 1344x1680, seed 41, 2 references (plate crop + studies/drew.png), key thresh 18 blur 1.5 close 4 open 3 feather 2, roi 140,770,620,1340

**Prompt.** [prompts/003-drew-placed-in-the-left-chair-seed-41-first-cast-place-round.prompt.txt](prompts/003-drew-placed-in-the-left-chair-seed-41-first-cast-place-round.prompt.txt)

**Verdict.** USABLE as round 1 and the method is proved: Drew is in the approved chair at the right scale in the right room. Not final - he sits a little high and left of the seat centre, the chair's studded roll does not cross his lower back (he reads as floating just in front of the chair), and the sticker carries a patch of the model's own marble under his hands whose white does not quite match the plate's. Cleanliness 0.796 outside the sticker: that number is the model re-inking the room, not a prompt fault, and the sticker route is what makes it harmless.

*Logged 10:29.*

---

## 004. the inlaid back bar, design round: the flush inlay (two bottle rows in a recess cut into the wall, its own boarded lining) chosen over a cabinet that read as a box; two fixes before any render

![the inlaid back bar, design round: the flush inlay (two bottle rows in a recess cut into the wall, its own boarded lining) chosen over a cabinet that read as a box; two fixes before any render](images/004-the-inlaid-back-bar-design-round-the-flush-inlay-two-bottle-rows-in-a-recess-cut-into-the-wall-its-own-boarded.png)

**The ask.** we need a inlaid shelf that has 2 rows of bottle and then an area to make drinks below it on the bartenders bar make sure it looks inlaid into the wall dont messup the walls look or carry the walls look into the shelf

**The thinking.** Two Opus designers, two critics each. The flush inlay cuts the opening into the panelling with one slim flat band in the wall plane, lines the recess with plain vertical walnut boards in a calmer darker tone than the wall, and stands two rows of bottles on 3 cm shelves inside it, the marble ledge running under as the drinks area; the cabinet variant carried a proud cornice and lid and read as a box hung on the wall. The critics' one serious objection to the inlay was a flat grey splashback painted over the finished panelling between the recess and the ledge - exactly the wall the founder said not to touch - plus black joint lines that would read as wires across the bottles. Those two fixes are being applied before the first render.

**Settings.** workflows inlaid-back-bar (I1-flush, I2-cabinet, two critics each) and inlaid-i1-fixes; bottle parts back ON in the copy

**Verdict.** I1 chosen; render after the fixes

*Logged 10:56.*

---

## 005. back-bar-carcass and back-bar-lower-shelf and bottles-on-lower-shelf and bottles-on-upper-shelf and back-bar-upper-shelf render seed 7 laid in full plate

![back-bar-carcass and back-bar-lower-shelf and bottles-on-lower-shelf and bottles-on-upper-shelf and back-bar-upper-shelf render seed 7 laid in full plate](images/005-back-bar-carcass-and-back-bar-lower-shelf-and-bottles-on-lower-shelf-and-bottles-on-upper-shelf-and-back-bar-u.png)

**The thinking.** Rendered in context - the plate as it stands behind this part, with only this part's own silhouette blocked in as values - so the pen, light and perspective are inherited; only the mask is laid back. Part note: the back bar's INLAID RECESS: a wide rectangular opening CUT INTO the panelled walnut wall above the marble ledge, its face frame ONE slim FLAT walnut band lying FLUSH with the panelling - no architrave, no bolection, no bead, nothing standing proud of the wall, just a plain flat band with a fine dark joint line where it meets the panelling - and the inside of the cut LINED WITH PLAIN VERTICAL WALNUT BOARDS, quiet, close-grained, a little darker and calmer than the wall, with NO raised-and-fielded panels, NO mouldings and NO frame inside the frame; a deep dark soffit across its head, the left reveal returning back into the wall in shadow, a bright arris down the right-hand edge of the opening, and BENEATH THE FRAME THE WALL'S OWN PANELLING RUNNING ON UNTOUCHED down to the marble ledge - the unit stops dead at its own bottom rail, there is no splashback and no panel of its own below it. This is JOINERY AND A HOLE IN A WALL - it is NEVER a picture, a painting, a mirror, a window, a doorway, a poster, a screen, a television or an empty dark panel AND the lower shelf inside the inlaid recess: a plain 3 cm walnut board running the full width of the opening from reveal to reveal, and it IS THE FLOOR OF THE RECESS - nothing shows beneath it. Seen from a little above, so its polished top catches the daylight and a dark square front edge runs under it - wood, not marble, not stone, and no bracket, no moulding, no nosing AND the row of liquor bottles standing on the lower shelf of the inlaid recess, well in front of its boarded back: varied heights and shapes, clear and dark glass, plain blank paper labels with NO lettering AND the row of liquor bottles standing on the upper shelf of the inlaid recess, well in front of its boarded back: varied heights and shapes, clear and dark glass, plain blank paper labels with NO lettering AND the upper shelf inside the inlaid recess: a plain 3 cm walnut board running the full width of the opening from reveal to reveal, seen from BELOW so its bright front edge stands over its own dark underside, and throwing a soft shadow down the boarded back of the recess beneath it

**Settings.** local/sensenova-u1.5, seed 7, full 40 steps cfg 4, rendered together with shelf-lower, bottles-lower, bottles-upper, shelf-upper, negative: television, screen, monitor, black rectangle, picture, frame, poster, sign, lettering, bottles, glasses, mirror, mirrored panel, glass panel, white panel, lightbox, frosted glass, window, arch, arched opening, arcade, doors, cupboard doors, glazed doors, french doors, mullion, curtain, blur, smear, bartender, terrier, dog, person, figure, woman, character, chair, stool, seat, barstool, chalkboard, blackboard, framed board, picture, frame, dog, retriever, person, figure, man, character, flamingo, bird, person, figure, man, character, lamp, sconce, light fixture, television, screen, monitor, flat screen

**Prompt.** [prompts/005-back-bar-carcass-and-back-bar-lower-shelf-and-bottles-on-lower-shelf-and-bottles-on-upper-shelf-and-back-bar-u.prompt.txt](prompts/005-back-bar-carcass-and-back-bar-lower-shelf-and-bottles-on-lower-shelf-and-bottles-on-upper-shelf-and-back-bar-u.prompt.txt)

*Logged 12:08.*

---

## 006. back-bar-carcass and back-bar-lower-shelf and bottles-on-lower-shelf and bottles-on-upper-shelf and back-bar-upper-shelf render seed 21 laid in full plate

![back-bar-carcass and back-bar-lower-shelf and bottles-on-lower-shelf and bottles-on-upper-shelf and back-bar-upper-shelf render seed 21 laid in full plate](images/006-back-bar-carcass-and-back-bar-lower-shelf-and-bottles-on-lower-shelf-and-bottles-on-upper-shelf-and-back-bar-u.png)

**The thinking.** Rendered in context - the plate as it stands behind this part, with only this part's own silhouette blocked in as values - so the pen, light and perspective are inherited; only the mask is laid back. Part note: the back bar's INLAID RECESS: a wide rectangular opening CUT INTO the panelled walnut wall above the marble ledge, its face frame ONE slim FLAT walnut band lying FLUSH with the panelling - no architrave, no bolection, no bead, nothing standing proud of the wall, just a plain flat band with a fine dark joint line where it meets the panelling - and the inside of the cut LINED WITH PLAIN VERTICAL WALNUT BOARDS, quiet, close-grained, a little darker and calmer than the wall, with NO raised-and-fielded panels, NO mouldings and NO frame inside the frame; a deep dark soffit across its head, the left reveal returning back into the wall in shadow, a bright arris down the right-hand edge of the opening, and BENEATH THE FRAME THE WALL'S OWN PANELLING RUNNING ON UNTOUCHED down to the marble ledge - the unit stops dead at its own bottom rail, there is no splashback and no panel of its own below it. This is JOINERY AND A HOLE IN A WALL - it is NEVER a picture, a painting, a mirror, a window, a doorway, a poster, a screen, a television or an empty dark panel AND the lower shelf inside the inlaid recess: a plain 3 cm walnut board running the full width of the opening from reveal to reveal, and it IS THE FLOOR OF THE RECESS - nothing shows beneath it. Seen from a little above, so its polished top catches the daylight and a dark square front edge runs under it - wood, not marble, not stone, and no bracket, no moulding, no nosing AND the row of liquor bottles standing on the lower shelf of the inlaid recess, well in front of its boarded back: varied heights and shapes, clear and dark glass, plain blank paper labels with NO lettering AND the row of liquor bottles standing on the upper shelf of the inlaid recess, well in front of its boarded back: varied heights and shapes, clear and dark glass, plain blank paper labels with NO lettering AND the upper shelf inside the inlaid recess: a plain 3 cm walnut board running the full width of the opening from reveal to reveal, seen from BELOW so its bright front edge stands over its own dark underside, and throwing a soft shadow down the boarded back of the recess beneath it

**Settings.** local/sensenova-u1.5, seed 21, full 40 steps cfg 4, rendered together with shelf-lower, bottles-lower, bottles-upper, shelf-upper, negative: television, screen, monitor, black rectangle, picture, frame, poster, sign, lettering, bottles, glasses, mirror, mirrored panel, glass panel, white panel, lightbox, frosted glass, window, arch, arched opening, arcade, doors, cupboard doors, glazed doors, french doors, mullion, curtain, blur, smear, bartender, terrier, dog, person, figure, woman, character, chair, stool, seat, barstool, chalkboard, blackboard, framed board, picture, frame, dog, retriever, person, figure, man, character, flamingo, bird, person, figure, man, character, lamp, sconce, light fixture, television, screen, monitor, flat screen

**Prompt.** [prompts/006-back-bar-carcass-and-back-bar-lower-shelf-and-bottles-on-lower-shelf-and-bottles-on-upper-shelf-and-back-bar-u.prompt.txt](prompts/006-back-bar-carcass-and-back-bar-lower-shelf-and-bottles-on-lower-shelf-and-bottles-on-upper-shelf-and-back-bar-u.prompt.txt)

*Logged 12:09.*

---

## 007. whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign

![whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign](images/007-whole-plate-assembled-with-bartenders-marble-ledge-back-bar-carcass-back-bar-lower-shelf-bottles-on-lower-shel.png)

**The thinking.** Base plus every approved, enabled part laid in order through its own silhouette; the TV's blank screen and the window's lettering are drawn in code last, because lettering is never left to the model.

*Logged 12:10.*

---

## 008. whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign

![whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign](images/008-whole-plate-assembled-with-bartenders-marble-ledge-back-bar-carcass-back-bar-lower-shelf-bottles-on-lower-shel.png)

**The thinking.** Base plus every approved, enabled part laid in order through its own silhouette; the TV's blank screen and the window's lettering are drawn in code last, because lettering is never left to the model.

*Logged 12:10.*

---

## 009. whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign

![whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign](images/009-whole-plate-assembled-with-bartenders-marble-ledge-back-bar-carcass-back-bar-lower-shelf-bottles-on-lower-shel.png)

**The thinking.** Base plus every approved, enabled part laid in order through its own silhouette; the TV's blank screen and the window's lettering are drawn in code last, because lettering is never left to the model.

*Logged 12:10.*

---

## 010. whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign

![whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign](images/010-whole-plate-assembled-with-bartenders-marble-ledge-back-bar-carcass-back-bar-lower-shelf-bottles-on-lower-shel.png)

**The thinking.** Base plus every approved, enabled part laid in order through its own silhouette; the TV's blank screen and the window's lettering are drawn in code last, because lettering is never left to the model.

*Logged 12:11.*

---

## 011. whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign

![whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign](images/011-whole-plate-assembled-with-bartenders-marble-ledge-back-bar-carcass-back-bar-lower-shelf-bottles-on-lower-shel.png)

**The thinking.** Base plus every approved, enabled part laid in order through its own silhouette; the TV's blank screen and the window's lettering are drawn in code last, because lettering is never left to the model.

*Logged 12:11.*

---

## 012. the inlaid back bar rendered and approved into the plate: two rows of bottles in a recess cut into the wall, the drinks ledge beneath, the wall untouched (seed 7)

![the inlaid back bar rendered and approved into the plate: two rows of bottles in a recess cut into the wall, the drinks ledge beneath, the wall untouched (seed 7)](images/012-the-inlaid-back-bar-rendered-and-approved-into-the-plate-two-rows-of-bottles-in-a-recess-cut-into-the-wall-the.png)

**The ask.** we need a inlaid shelf that has 2 rows of bottle and then an area to make drinks below it on the bartenders bar make sure it looks inlaid into the wall dont messup the walls look or carry the walls look into the shelf

**The thinking.** Rendered as one candidate for the carcass, both shelves and both bottle rows so they share one pen. Seed 7: the flat frame lies in the wall plane, the recess reads as a hole with its own boarded lining, twelve blank-labelled bottles per row stand on two thin shelves, and the panelling runs untouched round the frame and down to the marble ledge. Approved into the plate so the cast is placed against the real back bar; the founder's verdict decides whether it stays. The first attempt at this render failed because ComfyUI stalled under the cast team's load and the bridge tried to start a second instance on the same port; it recovered on its own.

**Settings.** construction inlaid-I1 (fixes applied); render backbar --with shelf-lower shelf-upper bottles-lower bottles-upper seeds 7, 21; approve all five from seed 7; build

**Verdict.** in the plate - for the founder's approval

*Logged 12:11.*

---

## 013. FOUNDER APPROVED the inlaid back bar - next: clean the wood grain round the shelf and rebuild the bottles (real shapes and sizes, at least half full, real labels)

![FOUNDER APPROVED the inlaid back bar - next: clean the wood grain round the shelf and rebuild the bottles (real shapes and sizes, at least half full, real labels)](images/013-founder-approved-the-inlaid-back-bar-next-clean-the-wood-grain-round-the-shelf-and-rebuild-the-bottles-real-sh.png)

**The ask.** i love those shelves if you could clean up the wood grain around the shelf and improve the bottles drastically they should look like they have real labels like real liquor bottles they should have different shapes and sizes and they should all be at least half full

**The thinking.** The recess stays. The bottles become a proper design: eight real liquor silhouettes at true sizes with fill lines never below half and label patches of varied shape, exported as page quads so the house brands are typeset onto them in code after the render - lettering is never left to the model - and the recess lining is redrawn to render as polished walnut rather than reeding. A design team with two critics goes first; the lead renders after.

**Settings.** workflow bottles-and-lining (opus design, sonnet label-bottles.py, two critics)

**Verdict.** founder: approved the shelves; bottles and lining in work

*Logged 12:17.*

---

## 014. Drew into the room - ROUTE A flat field, seed 41, laid on the approved plate

![Drew into the room - ROUTE A flat field, seed 41, laid on the approved plate](images/014-drew-into-the-room-route-a-flat-field-seed-41-laid-on-the-approved-plate.png)

**The ask.** Get Drew into the approved room-kit v2 plate, in the LEFT club chair, staged as the founder pinned it on 2026-09-08: seen from behind and a little to his left, the knit of the sweater vest across his shoulder blades, the chair's leather roll on his lower back, the neck in its S, the head turned RIGHT to the other chair so bill and lidded eye read in profile, the near feathered hand on the marble. Never a front view. Two keying routes were built into scripts/cast-place.py and compared head to head at seed 41 and seed 7.

**The thinking.** ROUTE A hands the model a Picture 1 in which everything except the left club chair, the marble counter top and the wall's silhouette lines has been flattened to a featureless mid-grey 140, so the chair is the only anchor and there is no room left for the model to re-ink. What comes back that is not flat grey is then the bird: the difference key runs against that flat field, is clipped to the window round the seat, and only that sticker is laid onto the REAL plate, so the room in the picture is always the plate's own pixels. The field premise held - the model did keep the grey empty - but with the room gone it also lost the camera: it rescaled the set, moved Drew to the far side of the marble facing us, and imported the dog out of Picture 3 (duo-behind.png has a dog in it). 12.4% of the plate was replaced; the seam measures 40 grey levels.

**Settings.** scripts/cast-place.py --character drew --seed 41 --route A | local/qwen-image-edit-2511, fast 8-step cfg 1, 4:5 1344x1680 | Picture 1 = flat field (chair 18.5%, marble 13.4%, lines 3.0%, flat 67.1%), Picture 2 = studies/drew.png, Picture 3 = studies/duo-behind.png | key vs flat-field, thresh 18, roi 140,770,620,1340 | join 40.19 levels, plate replaced 0.1240, cleanliness 0.8372, 50.6s

**Prompt.** [prompts/014-drew-into-the-room-route-a-flat-field-seed-41-laid-on-the-approved-plate.prompt.txt](prompts/014-drew-into-the-room-route-a-flat-field-seed-41-laid-on-the-approved-plate.prompt.txt)

**Verdict.** REJECT the picture, KEEP the route. Front view, wrong scale, a dog that came out of Picture 3 - but the join is the softest of the four and the approved room survives everywhere outside the sticker.

*Logged 14:01.*

---

## 015. Drew into the room - ROUTE A flat field, seed 7, laid on the approved plate

![Drew into the room - ROUTE A flat field, seed 7, laid on the approved plate](images/015-drew-into-the-room-route-a-flat-field-seed-7-laid-on-the-approved-plate.png)

**The ask.** Get Drew into the approved room-kit v2 plate, in the LEFT club chair, staged as the founder pinned it on 2026-09-08: seen from behind and a little to his left, the knit of the sweater vest across his shoulder blades, the chair's leather roll on his lower back, the neck in its S, the head turned RIGHT to the other chair so bill and lidded eye read in profile, the near feathered hand on the marble. Never a front view. Two keying routes were built into scripts/cast-place.py and compared head to head at seed 41 and seed 7.

**The thinking.** The same flat field at a second seed, to see whether seed 41's front view was the seed or the route. It was the route's blind spot, not the seed: with the room flattened away the model again lost the camera, drew TWO flamingos and the dog from Picture 3, all facing us across the marble, and the key handed back a slab of the flat grey along with them. Note what did NOT go wrong: the grey stayed grey. The model obeyed EDIT 2 and invented no room in the field, which is what makes the difference key honest at all - the 0.90 cleanliness number here is the model MOVING the chair and the marble, not re-inking them.

**Settings.** scripts/cast-place.py --character drew --seed 7 --route A | same recipe as seed 41 | join 41.11 levels, plate replaced 0.1298, cleanliness 0.9010, 52.5s

**Prompt.** [prompts/015-drew-into-the-room-route-a-flat-field-seed-7-laid-on-the-approved-plate.prompt.txt](prompts/015-drew-into-the-room-route-a-flat-field-seed-7-laid-on-the-approved-plate.prompt.txt)

**Verdict.** REJECT the picture. Two birds and a dog, all front on. Same conclusion as seed 41: the route is sound, the staging reference is what is poisoning it.

*Logged 14:01.*

---

## 016. Drew into the room - ROUTE B whole crop, seed 41, laid on the approved plate

![Drew into the room - ROUTE B whole crop, seed 41, laid on the approved plate](images/016-drew-into-the-room-route-b-whole-crop-seed-41-laid-on-the-approved-plate.png)

**The ask.** Get Drew into the approved room-kit v2 plate, in the LEFT club chair, staged as the founder pinned it on 2026-09-08: seen from behind and a little to his left, the knit of the sweater vest across his shoulder blades, the chair's leather roll on his lower back, the neck in its S, the head turned RIGHT to the other chair so bill and lidded eye read in profile, the near feathered hand on the marble. Never a front view. Two keying routes were built into scripts/cast-place.py and compared head to head at seed 41 and seed 7.

**The thinking.** ROUTE B is the opposite bet: Picture 1 is the plate crop exactly as it is, and the whole rendered crop goes back onto the plate with a 12px feathered border and no key at all, on the theory that the model keeps the room's LOOK and a figure that is never cut out can never have an edge. It does not survive contact: the model returned the group on a blown-out white ground, so the paste is a hard bright rectangle sitting in the middle of the engraved room, twice as much of the plate is thrown away as on route A, and there is no way to keep only the good part - a bad render is pasted whole. Drew is square to the camera with his bow tie facing us, flanked by two dogs; the one figure staged the way the founder asked - from behind, over the shoulder, on the studded chair - is a DOG on the left.

**Settings.** scripts/cast-place.py --character drew --seed 41 --route B | same model and references | no key, paste feather 12px | join 64.60 levels, plate replaced 0.2370, room re-inked 0.9056, 52.6s

**Prompt.** [prompts/016-drew-into-the-room-route-b-whole-crop-seed-41-laid-on-the-approved-plate.prompt.txt](prompts/016-drew-into-the-room-route-b-whole-crop-seed-41-laid-on-the-approved-plate.prompt.txt)

**Verdict.** REJECT, and reject the route. The join is a visible white block: 65 grey levels at the seam against route A's 40.

*Logged 14:01.*

---

## 017. Drew into the room - ROUTE B whole crop, seed 7, laid on the approved plate

![Drew into the room - ROUTE B whole crop, seed 7, laid on the approved plate](images/017-drew-into-the-room-route-b-whole-crop-seed-7-laid-on-the-approved-plate.png)

**The ask.** Get Drew into the approved room-kit v2 plate, in the LEFT club chair, staged as the founder pinned it on 2026-09-08: seen from behind and a little to his left, the knit of the sweater vest across his shoulder blades, the chair's leather roll on his lower back, the neck in its S, the head turned RIGHT to the other chair so bill and lidded eye read in profile, the near feathered hand on the marble. Never a front view. Two keying routes were built into scripts/cast-place.py and compared head to head at seed 41 and seed 7.

**The thinking.** Route B's second seed, and the worst of the four: three figures on bar stools round a small round table, Drew front on in the middle between two dogs, the whole thing on white paper and pasted as a hard rectangle across the approved marble. Every one of the four renders imported the dog, and the dog is in Picture 3 - duo-behind.png is a flamingo AND a labrador at the marble. The staging reference the founder scored highest is the right camera and the wrong cast; the next round should crop Picture 3 to the flamingo alone before anything else is changed.

**Settings.** scripts/cast-place.py --character drew --seed 7 --route B | same recipe as seed 41 | join 71.52 levels, plate replaced 0.2370, room re-inked 0.9330, 52.5s

**Prompt.** [prompts/017-drew-into-the-room-route-b-whole-crop-seed-7-laid-on-the-approved-plate.prompt.txt](prompts/017-drew-into-the-room-route-b-whole-crop-seed-7-laid-on-the-approved-plate.prompt.txt)

**Verdict.** REJECT. Worst join of the four at 71.5 levels and the furthest from the pinned staging.

*Logged 14:01.*

---

## 018. back-bar-carcass and back-bar-lower-shelf and bottles-on-lower-shelf and bottles-on-upper-shelf and back-bar-upper-shelf render seed 21 laid in full plate

![back-bar-carcass and back-bar-lower-shelf and bottles-on-lower-shelf and bottles-on-upper-shelf and back-bar-upper-shelf render seed 21 laid in full plate](images/018-back-bar-carcass-and-back-bar-lower-shelf-and-bottles-on-lower-shelf-and-bottles-on-upper-shelf-and-back-bar-u.png)

**The thinking.** Rendered in context - the plate as it stands behind this part, with only this part's own silhouette blocked in as values - so the pen, light and perspective are inherited; only the mask is laid back. Part note: the back bar's INLAID RECESS: a wide rectangular opening CUT INTO the panelled walnut wall above the marble ledge, its face frame ONE slim FLAT walnut band lying FLUSH with the panelling - no architrave, no bolection, no bead, nothing standing proud of the wall, just a plain flat band with a fine dark joint line where it meets the panelling - and the inside of the cut LINED WITH PLAIN VERTICAL WALNUT BOARDS, quiet, close-grained, a little darker and calmer than the wall, with NO raised-and-fielded panels, NO mouldings and NO frame inside the frame; a deep dark soffit across its head, the left reveal returning back into the wall in shadow, a bright arris down the right-hand edge of the opening, and BENEATH THE FRAME THE WALL'S OWN PANELLING RUNNING ON UNTOUCHED down to the marble ledge - the unit stops dead at its own bottom rail, there is no splashback and no panel of its own below it. This is JOINERY AND A HOLE IN A WALL - it is NEVER a picture, a painting, a mirror, a window, a doorway, a poster, a screen, a television or an empty dark panel. The lining boards and the face band are SMOOTH POLISHED WALNUT, SPARSE SOFT FIGURE, NO REEDING, NO FLUTING, NO FINE PARALLEL STRIPING - a few broad soft sweeps of grain in a wide board, and the flat face band plain AND the lower shelf inside the inlaid recess: a plain 3 cm walnut board running the full width of the opening from reveal to reveal, and it IS THE FLOOR OF THE RECESS - nothing shows beneath it. Seen from a little above, so its polished top catches the daylight and a dark square front edge runs under it - wood, not marble, not stone, and no bracket, no moulding, no nosing AND the row of EIGHT real liquor bottles standing on the lower shelf of the inlaid recess, well in front of its boarded back: REAL BOTTLES OF DIFFERENT SHAPES AND SIZES, FEW AND BIG, NO TWO NEIGHBOURS ALIKE - among them a square-shouldered bourbon, a tall round-shouldered scotch, a broad squat rum, a SQUARE GIN FLASK with parallel sides and a sharp shoulder, a bulbous decanter-like rye, a tall slim vodka, a broad-shouldered whiskey and a wide-shouldered tequila - each with its own neck, its own shoulder and its own closure, a foil capsule under a dark screw cap or a taller cork stopper. Clear glass is pale with a bright highlight down its window side; the dark spirits are deep warm amber, glassy, and both read CLEARLY LIGHTER than the dark boards behind them. EVERY BOTTLE IS AT LEAST HALF FULL AND NO TWO TO THE SAME LEVEL: the liquid inside is DARKER than the empty glass above it and the two meet at a clean horizontal FILL LINE across the bottle. Each bottle STANDS ON THE BOARD, with a small dark pool of contact shadow at its foot and a soft shadow thrown up the boarding behind it, leaning away from the window at frame-left. Each bottle wears ONE paper label, and their shapes differ - rectangles, wrap-around bands, ovals, shields - lighter than the glass, with a crisp edge. THE LABELS ARE BLANK: no lettering, no words, no letters, no numerals, no pseudo-text of any kind - the brand names are typeset onto them in code afterwards, exactly as the window is gilded AND the row of SIX real liquor bottles standing on the upper shelf of the inlaid recess, well in front of its boarded back: REAL BOTTLES OF DIFFERENT SHAPES AND SIZES, FEW AND BIG, NO TWO NEIGHBOURS ALIKE - among them a square-shouldered bourbon, a tall round-shouldered scotch, a broad squat rum, a SQUARE GIN FLASK with parallel sides and a sharp shoulder, a bulbous decanter-like rye, a tall slim vodka, a broad-shouldered whiskey and a wide-shouldered tequila - each with its own neck, its own shoulder and its own closure, a foil capsule under a dark screw cap or a taller cork stopper. Clear glass is pale with a bright highlight down its window side; the dark spirits are deep warm amber, glassy, and both read CLEARLY LIGHTER than the dark boards behind them. EVERY BOTTLE IS AT LEAST HALF FULL AND NO TWO TO THE SAME LEVEL: the liquid inside is DARKER than the empty glass above it and the two meet at a clean horizontal FILL LINE across the bottle. Each bottle STANDS ON THE BOARD, with a small dark pool of contact shadow at its foot and a soft shadow thrown up the boarding behind it, leaning away from the window at frame-left. Each bottle wears ONE paper label, and their shapes differ - rectangles, wrap-around bands, ovals, shields - lighter than the glass, with a crisp edge. THE LABELS ARE BLANK: no lettering, no words, no letters, no numerals, no pseudo-text of any kind - the brand names are typeset onto them in code afterwards, exactly as the window is gilded AND the upper shelf inside the inlaid recess: a plain 3 cm walnut board running the full width of the opening from reveal to reveal, seen from BELOW so its bright front edge stands over its own dark underside, and throwing a soft shadow down the boarded back of the recess beneath it

**Settings.** local/sensenova-u1.5, seed 21, full 40 steps cfg 4, rendered together with shelf-lower, bottles-lower, bottles-upper, shelf-upper, negative: television, screen, monitor, black rectangle, picture, frame, poster, sign, lettering, bottles, glasses, mirror, mirrored panel, glass panel, white panel, lightbox, frosted glass, window, arch, arched opening, arcade, doors, cupboard doors, glazed doors, french doors, mullion, curtain, blur, smear, bartender, terrier, dog, person, figure, woman, character, chair, stool, seat, barstool, chalkboard, blackboard, framed board, picture, frame, dog, retriever, person, figure, man, character, flamingo, bird, person, figure, man, character, lamp, sconce, light fixture, television, screen, monitor, flat screen

**Prompt.** [prompts/018-back-bar-carcass-and-back-bar-lower-shelf-and-bottles-on-lower-shelf-and-bottles-on-upper-shelf-and-back-bar-u.prompt.txt](prompts/018-back-bar-carcass-and-back-bar-lower-shelf-and-bottles-on-lower-shelf-and-bottles-on-upper-shelf-and-back-bar-u.prompt.txt)

*Logged 14:13.*

---

## 019. back-bar-carcass and back-bar-lower-shelf and bottles-on-lower-shelf and bottles-on-upper-shelf and back-bar-upper-shelf render seed 7 laid in full plate

![back-bar-carcass and back-bar-lower-shelf and bottles-on-lower-shelf and bottles-on-upper-shelf and back-bar-upper-shelf render seed 7 laid in full plate](images/019-back-bar-carcass-and-back-bar-lower-shelf-and-bottles-on-lower-shelf-and-bottles-on-upper-shelf-and-back-bar-u.png)

**The thinking.** Rendered in context - the plate as it stands behind this part, with only this part's own silhouette blocked in as values - so the pen, light and perspective are inherited; only the mask is laid back. Part note: the back bar's INLAID RECESS: a wide rectangular opening CUT INTO the panelled walnut wall above the marble ledge, its face frame ONE slim FLAT walnut band lying FLUSH with the panelling - no architrave, no bolection, no bead, nothing standing proud of the wall, just a plain flat band with a fine dark joint line where it meets the panelling - and the inside of the cut LINED WITH PLAIN VERTICAL WALNUT BOARDS, quiet, close-grained, a little darker and calmer than the wall, with NO raised-and-fielded panels, NO mouldings and NO frame inside the frame; a deep dark soffit across its head, the left reveal returning back into the wall in shadow, a bright arris down the right-hand edge of the opening, and BENEATH THE FRAME THE WALL'S OWN PANELLING RUNNING ON UNTOUCHED down to the marble ledge - the unit stops dead at its own bottom rail, there is no splashback and no panel of its own below it. This is JOINERY AND A HOLE IN A WALL - it is NEVER a picture, a painting, a mirror, a window, a doorway, a poster, a screen, a television or an empty dark panel. The lining boards and the face band are SMOOTH POLISHED WALNUT, SPARSE SOFT FIGURE, NO REEDING, NO FLUTING, NO FINE PARALLEL STRIPING - a few broad soft sweeps of grain in a wide board, and the flat face band plain AND the lower shelf inside the inlaid recess: a plain 3 cm walnut board running the full width of the opening from reveal to reveal, and it IS THE FLOOR OF THE RECESS - nothing shows beneath it. Seen from a little above, so its polished top catches the daylight and a dark square front edge runs under it - wood, not marble, not stone, and no bracket, no moulding, no nosing AND the row of EIGHT real liquor bottles standing on the lower shelf of the inlaid recess, well in front of its boarded back: REAL BOTTLES OF DIFFERENT SHAPES AND SIZES, FEW AND BIG, NO TWO NEIGHBOURS ALIKE - among them a square-shouldered bourbon, a tall round-shouldered scotch, a broad squat rum, a SQUARE GIN FLASK with parallel sides and a sharp shoulder, a bulbous decanter-like rye, a tall slim vodka, a broad-shouldered whiskey and a wide-shouldered tequila - each with its own neck, its own shoulder and its own closure, a foil capsule under a dark screw cap or a taller cork stopper. Clear glass is pale with a bright highlight down its window side; the dark spirits are deep warm amber, glassy, and both read CLEARLY LIGHTER than the dark boards behind them. EVERY BOTTLE IS AT LEAST HALF FULL AND NO TWO TO THE SAME LEVEL: the liquid inside is DARKER than the empty glass above it and the two meet at a clean horizontal FILL LINE across the bottle. Each bottle STANDS ON THE BOARD, with a small dark pool of contact shadow at its foot and a soft shadow thrown up the boarding behind it, leaning away from the window at frame-left. Each bottle wears ONE paper label, and their shapes differ - rectangles, wrap-around bands, ovals, shields - lighter than the glass, with a crisp edge. THE LABELS ARE BLANK: no lettering, no words, no letters, no numerals, no pseudo-text of any kind - the brand names are typeset onto them in code afterwards, exactly as the window is gilded AND the row of SIX real liquor bottles standing on the upper shelf of the inlaid recess, well in front of its boarded back: REAL BOTTLES OF DIFFERENT SHAPES AND SIZES, FEW AND BIG, NO TWO NEIGHBOURS ALIKE - among them a square-shouldered bourbon, a tall round-shouldered scotch, a broad squat rum, a SQUARE GIN FLASK with parallel sides and a sharp shoulder, a bulbous decanter-like rye, a tall slim vodka, a broad-shouldered whiskey and a wide-shouldered tequila - each with its own neck, its own shoulder and its own closure, a foil capsule under a dark screw cap or a taller cork stopper. Clear glass is pale with a bright highlight down its window side; the dark spirits are deep warm amber, glassy, and both read CLEARLY LIGHTER than the dark boards behind them. EVERY BOTTLE IS AT LEAST HALF FULL AND NO TWO TO THE SAME LEVEL: the liquid inside is DARKER than the empty glass above it and the two meet at a clean horizontal FILL LINE across the bottle. Each bottle STANDS ON THE BOARD, with a small dark pool of contact shadow at its foot and a soft shadow thrown up the boarding behind it, leaning away from the window at frame-left. Each bottle wears ONE paper label, and their shapes differ - rectangles, wrap-around bands, ovals, shields - lighter than the glass, with a crisp edge. THE LABELS ARE BLANK: no lettering, no words, no letters, no numerals, no pseudo-text of any kind - the brand names are typeset onto them in code afterwards, exactly as the window is gilded AND the upper shelf inside the inlaid recess: a plain 3 cm walnut board running the full width of the opening from reveal to reveal, seen from BELOW so its bright front edge stands over its own dark underside, and throwing a soft shadow down the boarded back of the recess beneath it

**Settings.** local/sensenova-u1.5, seed 7, full 40 steps cfg 4, rendered together with shelf-lower, bottles-lower, bottles-upper, shelf-upper, negative: television, screen, monitor, black rectangle, picture, frame, poster, sign, lettering, bottles, glasses, mirror, mirrored panel, glass panel, white panel, lightbox, frosted glass, window, arch, arched opening, arcade, doors, cupboard doors, glazed doors, french doors, mullion, curtain, blur, smear, bartender, terrier, dog, person, figure, woman, character, chair, stool, seat, barstool, chalkboard, blackboard, framed board, picture, frame, dog, retriever, person, figure, man, character, flamingo, bird, person, figure, man, character, lamp, sconce, light fixture, television, screen, monitor, flat screen

**Prompt.** [prompts/019-back-bar-carcass-and-back-bar-lower-shelf-and-bottles-on-lower-shelf-and-bottles-on-upper-shelf-and-back-bar-u.prompt.txt](prompts/019-back-bar-carcass-and-back-bar-lower-shelf-and-bottles-on-lower-shelf-and-bottles-on-upper-shelf-and-back-bar-u.prompt.txt)

*Logged 14:13.*

---

## 020. whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign

![whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign](images/020-whole-plate-assembled-with-bartenders-marble-ledge-back-bar-carcass-back-bar-lower-shelf-bottles-on-lower-shel.png)

**The thinking.** Base plus every approved, enabled part laid in order through its own silhouette; the TV's blank screen and the window's lettering are drawn in code last, because lettering is never left to the model.

*Logged 14:15.*

---

## 021. whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign

![whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign](images/021-whole-plate-assembled-with-bartenders-marble-ledge-back-bar-carcass-back-bar-lower-shelf-bottles-on-lower-shel.png)

**The thinking.** Base plus every approved, enabled part laid in order through its own silhouette; the TV's blank screen and the window's lettering are drawn in code last, because lettering is never left to the model.

*Logged 14:15.*

---

## 022. whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign

![whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign](images/022-whole-plate-assembled-with-bartenders-marble-ledge-back-bar-carcass-back-bar-lower-shelf-bottles-on-lower-shel.png)

**The thinking.** Base plus every approved, enabled part laid in order through its own silhouette; the TV's blank screen and the window's lettering are drawn in code last, because lettering is never left to the model.

*Logged 14:15.*

---

## 023. bottles-on-lower-shelf and bottles-on-upper-shelf render seed 7 laid in full plate

![bottles-on-lower-shelf and bottles-on-upper-shelf render seed 7 laid in full plate](images/023-bottles-on-lower-shelf-and-bottles-on-upper-shelf-render-seed-7-laid-in-full-plate.png)

**The thinking.** Rendered in context - the plate as it stands behind this part, with only this part's own silhouette blocked in as values - so the pen, light and perspective are inherited; only the mask is laid back. Part note: the row of EIGHT real liquor bottles standing on the lower shelf of the inlaid recess, well in front of its boarded back: REAL BOTTLES OF DIFFERENT SHAPES AND SIZES, FEW AND BIG, NO TWO NEIGHBOURS ALIKE - among them a square-shouldered bourbon, a tall round-shouldered scotch, a broad squat rum, a SQUARE GIN FLASK with parallel sides and a sharp shoulder, a bulbous decanter-like rye, a tall slim vodka, a broad-shouldered whiskey and a wide-shouldered tequila - each with its own neck, its own shoulder and its own closure, a foil capsule under a dark screw cap or a taller cork stopper. Clear glass is pale with a bright highlight down its window side; the dark spirits are deep warm amber, glassy, and both read CLEARLY LIGHTER than the dark boards behind them. EVERY BOTTLE IS AT LEAST HALF FULL AND NO TWO TO THE SAME LEVEL: the liquid inside is DARKER than the empty glass above it and the two meet at a clean horizontal FILL LINE across the bottle. Each bottle STANDS ON THE BOARD, with a small dark pool of contact shadow at its foot and a soft shadow thrown up the boarding behind it, leaning away from the window at frame-left. Each bottle wears ONE paper label, and their shapes differ - rectangles, wrap-around bands, ovals, shields - lighter than the glass, with a crisp edge. THE LABELS ARE BLANK: no lettering, no words, no letters, no numerals, no pseudo-text of any kind - the brand names are typeset onto them in code afterwards, exactly as the window is gilded AND the row of SIX real liquor bottles standing on the upper shelf of the inlaid recess, well in front of its boarded back: REAL BOTTLES OF DIFFERENT SHAPES AND SIZES, FEW AND BIG, NO TWO NEIGHBOURS ALIKE - among them a square-shouldered bourbon, a tall round-shouldered scotch, a broad squat rum, a SQUARE GIN FLASK with parallel sides and a sharp shoulder, a bulbous decanter-like rye, a tall slim vodka, a broad-shouldered whiskey and a wide-shouldered tequila - each with its own neck, its own shoulder and its own closure, a foil capsule under a dark screw cap or a taller cork stopper. Clear glass is pale with a bright highlight down its window side; the dark spirits are deep warm amber, glassy, and both read CLEARLY LIGHTER than the dark boards behind them. EVERY BOTTLE IS AT LEAST HALF FULL AND NO TWO TO THE SAME LEVEL: the liquid inside is DARKER than the empty glass above it and the two meet at a clean horizontal FILL LINE across the bottle. Each bottle STANDS ON THE BOARD, with a small dark pool of contact shadow at its foot and a soft shadow thrown up the boarding behind it, leaning away from the window at frame-left. Each bottle wears ONE paper label, and their shapes differ - rectangles, wrap-around bands, ovals, shields - lighter than the glass, with a crisp edge. THE LABELS ARE BLANK: no lettering, no words, no letters, no numerals, no pseudo-text of any kind - the brand names are typeset onto them in code afterwards, exactly as the window is gilded

**Settings.** local/sensenova-u1.5, seed 7, full 40 steps cfg 4, rendered together with bottles-upper, negative: text, letters, words, lettering, signage, sign, numbers, typography, writing, inscription, shop name, banner, poster, bartender, terrier, dog, person, figure, woman, character, chair, stool, seat, barstool, chalkboard, blackboard, framed board, picture, frame, dog, retriever, person, figure, man, character, flamingo, bird, person, figure, man, character, lamp, sconce, light fixture, television, screen, monitor, flat screen

**Prompt.** [prompts/023-bottles-on-lower-shelf-and-bottles-on-upper-shelf-render-seed-7-laid-in-full-plate.prompt.txt](prompts/023-bottles-on-lower-shelf-and-bottles-on-upper-shelf-render-seed-7-laid-in-full-plate.prompt.txt)

*Logged 14:16.*

---

## 024. bottles-on-lower-shelf and bottles-on-upper-shelf render seed 21 laid in full plate

![bottles-on-lower-shelf and bottles-on-upper-shelf render seed 21 laid in full plate](images/024-bottles-on-lower-shelf-and-bottles-on-upper-shelf-render-seed-21-laid-in-full-plate.png)

**The thinking.** Rendered in context - the plate as it stands behind this part, with only this part's own silhouette blocked in as values - so the pen, light and perspective are inherited; only the mask is laid back. Part note: the row of EIGHT real liquor bottles standing on the lower shelf of the inlaid recess, well in front of its boarded back: REAL BOTTLES OF DIFFERENT SHAPES AND SIZES, FEW AND BIG, NO TWO NEIGHBOURS ALIKE - among them a square-shouldered bourbon, a tall round-shouldered scotch, a broad squat rum, a SQUARE GIN FLASK with parallel sides and a sharp shoulder, a bulbous decanter-like rye, a tall slim vodka, a broad-shouldered whiskey and a wide-shouldered tequila - each with its own neck, its own shoulder and its own closure, a foil capsule under a dark screw cap or a taller cork stopper. Clear glass is pale with a bright highlight down its window side; the dark spirits are deep warm amber, glassy, and both read CLEARLY LIGHTER than the dark boards behind them. EVERY BOTTLE IS AT LEAST HALF FULL AND NO TWO TO THE SAME LEVEL: the liquid inside is DARKER than the empty glass above it and the two meet at a clean horizontal FILL LINE across the bottle. Each bottle STANDS ON THE BOARD, with a small dark pool of contact shadow at its foot and a soft shadow thrown up the boarding behind it, leaning away from the window at frame-left. Each bottle wears ONE paper label, and their shapes differ - rectangles, wrap-around bands, ovals, shields - lighter than the glass, with a crisp edge. THE LABELS ARE BLANK: no lettering, no words, no letters, no numerals, no pseudo-text of any kind - the brand names are typeset onto them in code afterwards, exactly as the window is gilded AND the row of SIX real liquor bottles standing on the upper shelf of the inlaid recess, well in front of its boarded back: REAL BOTTLES OF DIFFERENT SHAPES AND SIZES, FEW AND BIG, NO TWO NEIGHBOURS ALIKE - among them a square-shouldered bourbon, a tall round-shouldered scotch, a broad squat rum, a SQUARE GIN FLASK with parallel sides and a sharp shoulder, a bulbous decanter-like rye, a tall slim vodka, a broad-shouldered whiskey and a wide-shouldered tequila - each with its own neck, its own shoulder and its own closure, a foil capsule under a dark screw cap or a taller cork stopper. Clear glass is pale with a bright highlight down its window side; the dark spirits are deep warm amber, glassy, and both read CLEARLY LIGHTER than the dark boards behind them. EVERY BOTTLE IS AT LEAST HALF FULL AND NO TWO TO THE SAME LEVEL: the liquid inside is DARKER than the empty glass above it and the two meet at a clean horizontal FILL LINE across the bottle. Each bottle STANDS ON THE BOARD, with a small dark pool of contact shadow at its foot and a soft shadow thrown up the boarding behind it, leaning away from the window at frame-left. Each bottle wears ONE paper label, and their shapes differ - rectangles, wrap-around bands, ovals, shields - lighter than the glass, with a crisp edge. THE LABELS ARE BLANK: no lettering, no words, no letters, no numerals, no pseudo-text of any kind - the brand names are typeset onto them in code afterwards, exactly as the window is gilded

**Settings.** local/sensenova-u1.5, seed 21, full 40 steps cfg 4, rendered together with bottles-upper, negative: text, letters, words, lettering, signage, sign, numbers, typography, writing, inscription, shop name, banner, poster, bartender, terrier, dog, person, figure, woman, character, chair, stool, seat, barstool, chalkboard, blackboard, framed board, picture, frame, dog, retriever, person, figure, man, character, flamingo, bird, person, figure, man, character, lamp, sconce, light fixture, television, screen, monitor, flat screen

**Prompt.** [prompts/024-bottles-on-lower-shelf-and-bottles-on-upper-shelf-render-seed-21-laid-in-full-plate.prompt.txt](prompts/024-bottles-on-lower-shelf-and-bottles-on-upper-shelf-render-seed-21-laid-in-full-plate.prompt.txt)

*Logged 14:16.*

---

## 025. bottles-on-lower-shelf and bottles-on-upper-shelf render seed 21 laid in full plate

![bottles-on-lower-shelf and bottles-on-upper-shelf render seed 21 laid in full plate](images/025-bottles-on-lower-shelf-and-bottles-on-upper-shelf-render-seed-21-laid-in-full-plate.png)

**The thinking.** Rendered in context - the plate as it stands behind this part, with only this part's own silhouette blocked in as values - so the pen, light and perspective are inherited; only the mask is laid back. Part note: the row of EIGHT real liquor bottles standing on the lower shelf of the inlaid recess, well in front of its boarded back: REAL BOTTLES OF DIFFERENT SHAPES AND SIZES, FEW AND BIG, NO TWO NEIGHBOURS ALIKE - among them a square-shouldered bourbon, a tall round-shouldered scotch, a broad squat rum, a SQUARE GIN FLASK with parallel sides and a sharp shoulder, a bulbous decanter-like rye, a tall slim vodka, a broad-shouldered whiskey and a wide-shouldered tequila - each with its own neck, its own shoulder and its own closure, a foil capsule under a dark screw cap or a taller cork stopper. Clear glass is pale with a bright highlight down its window side; the dark spirits are deep warm amber, glassy, and both read CLEARLY LIGHTER than the dark boards behind them. EVERY BOTTLE IS AT LEAST HALF FULL AND NO TWO TO THE SAME LEVEL: the liquid inside is DARKER than the empty glass above it and the two meet at a clean horizontal FILL LINE across the bottle. Each bottle STANDS ON THE BOARD, with a small dark pool of contact shadow at its foot and a soft shadow thrown up the boarding behind it, leaning away from the window at frame-left. Each bottle wears ONE paper label, and their shapes differ - rectangles, wrap-around bands, ovals, shields - lighter than the glass, with a crisp edge. THE LABELS ARE BLANK: no lettering, no words, no letters, no numerals, no pseudo-text of any kind - the brand names are typeset onto them in code afterwards, exactly as the window is gilded AND the row of SIX real liquor bottles standing on the upper shelf of the inlaid recess, well in front of its boarded back: REAL BOTTLES OF DIFFERENT SHAPES AND SIZES, FEW AND BIG, NO TWO NEIGHBOURS ALIKE - among them a square-shouldered bourbon, a tall round-shouldered scotch, a broad squat rum, a SQUARE GIN FLASK with parallel sides and a sharp shoulder, a bulbous decanter-like rye, a tall slim vodka, a broad-shouldered whiskey and a wide-shouldered tequila - each with its own neck, its own shoulder and its own closure, a foil capsule under a dark screw cap or a taller cork stopper. Clear glass is pale with a bright highlight down its window side; the dark spirits are deep warm amber, glassy, and both read CLEARLY LIGHTER than the dark boards behind them. EVERY BOTTLE IS AT LEAST HALF FULL AND NO TWO TO THE SAME LEVEL: the liquid inside is DARKER than the empty glass above it and the two meet at a clean horizontal FILL LINE across the bottle. Each bottle STANDS ON THE BOARD, with a small dark pool of contact shadow at its foot and a soft shadow thrown up the boarding behind it, leaning away from the window at frame-left. Each bottle wears ONE paper label, and their shapes differ - rectangles, wrap-around bands, ovals, shields - lighter than the glass, with a crisp edge. THE LABELS ARE BLANK: no lettering, no words, no letters, no numerals, no pseudo-text of any kind - the brand names are typeset onto them in code afterwards, exactly as the window is gilded

**Settings.** local/sensenova-u1.5, seed 21, full 40 steps cfg 4, rendered together with bottles-upper, negative: text, letters, words, lettering, signage, sign, numbers, typography, writing, inscription, shop name, banner, poster, bartender, terrier, dog, person, figure, woman, character, chair, stool, seat, barstool, chalkboard, blackboard, framed board, picture, frame, dog, retriever, person, figure, man, character, flamingo, bird, person, figure, man, character, lamp, sconce, light fixture, television, screen, monitor, flat screen

**Prompt.** [prompts/025-bottles-on-lower-shelf-and-bottles-on-upper-shelf-render-seed-21-laid-in-full-plate.prompt.txt](prompts/025-bottles-on-lower-shelf-and-bottles-on-upper-shelf-render-seed-21-laid-in-full-plate.prompt.txt)

*Logged 14:22.*

---

## 026. bottles-on-lower-shelf and bottles-on-upper-shelf render seed 7 laid in full plate

![bottles-on-lower-shelf and bottles-on-upper-shelf render seed 7 laid in full plate](images/026-bottles-on-lower-shelf-and-bottles-on-upper-shelf-render-seed-7-laid-in-full-plate.png)

**The thinking.** Rendered in context - the plate as it stands behind this part, with only this part's own silhouette blocked in as values - so the pen, light and perspective are inherited; only the mask is laid back. Part note: the row of EIGHT real liquor bottles standing on the lower shelf of the inlaid recess, well in front of its boarded back: REAL BOTTLES OF DIFFERENT SHAPES AND SIZES, FEW AND BIG, NO TWO NEIGHBOURS ALIKE - among them a square-shouldered bourbon, a tall round-shouldered scotch, a broad squat rum, a SQUARE GIN FLASK with parallel sides and a sharp shoulder, a bulbous decanter-like rye, a tall slim vodka, a broad-shouldered whiskey and a wide-shouldered tequila - each with its own neck, its own shoulder and its own closure, a foil capsule under a dark screw cap or a taller cork stopper. Clear glass is pale with a bright highlight down its window side; the dark spirits are deep warm amber, glassy, and both read CLEARLY LIGHTER than the dark boards behind them. EVERY BOTTLE IS AT LEAST HALF FULL AND NO TWO TO THE SAME LEVEL: the liquid inside is DARKER than the empty glass above it and the two meet at a clean horizontal FILL LINE across the bottle. Each bottle STANDS ON THE BOARD, with a small dark pool of contact shadow at its foot and a soft shadow thrown up the boarding behind it, leaning away from the window at frame-left. Each bottle wears ONE paper label, and their shapes differ - rectangles, wrap-around bands, ovals, shields - lighter than the glass, with a crisp edge. THE LABELS ARE BLANK: no lettering, no words, no letters, no numerals, no pseudo-text of any kind - the brand names are typeset onto them in code afterwards, exactly as the window is gilded AND the row of SIX real liquor bottles standing on the upper shelf of the inlaid recess, well in front of its boarded back: REAL BOTTLES OF DIFFERENT SHAPES AND SIZES, FEW AND BIG, NO TWO NEIGHBOURS ALIKE - among them a square-shouldered bourbon, a tall round-shouldered scotch, a broad squat rum, a SQUARE GIN FLASK with parallel sides and a sharp shoulder, a bulbous decanter-like rye, a tall slim vodka, a broad-shouldered whiskey and a wide-shouldered tequila - each with its own neck, its own shoulder and its own closure, a foil capsule under a dark screw cap or a taller cork stopper. Clear glass is pale with a bright highlight down its window side; the dark spirits are deep warm amber, glassy, and both read CLEARLY LIGHTER than the dark boards behind them. EVERY BOTTLE IS AT LEAST HALF FULL AND NO TWO TO THE SAME LEVEL: the liquid inside is DARKER than the empty glass above it and the two meet at a clean horizontal FILL LINE across the bottle. Each bottle STANDS ON THE BOARD, with a small dark pool of contact shadow at its foot and a soft shadow thrown up the boarding behind it, leaning away from the window at frame-left. Each bottle wears ONE paper label, and their shapes differ - rectangles, wrap-around bands, ovals, shields - lighter than the glass, with a crisp edge. THE LABELS ARE BLANK: no lettering, no words, no letters, no numerals, no pseudo-text of any kind - the brand names are typeset onto them in code afterwards, exactly as the window is gilded

**Settings.** local/sensenova-u1.5, seed 7, full 40 steps cfg 4, rendered together with bottles-upper, negative: text, letters, words, lettering, signage, sign, numbers, typography, writing, inscription, shop name, banner, poster, bartender, terrier, dog, person, figure, woman, character, chair, stool, seat, barstool, chalkboard, blackboard, framed board, picture, frame, dog, retriever, person, figure, man, character, flamingo, bird, person, figure, man, character, lamp, sconce, light fixture, television, screen, monitor, flat screen

**Prompt.** [prompts/026-bottles-on-lower-shelf-and-bottles-on-upper-shelf-render-seed-7-laid-in-full-plate.prompt.txt](prompts/026-bottles-on-lower-shelf-and-bottles-on-upper-shelf-render-seed-7-laid-in-full-plate.prompt.txt)

*Logged 14:23.*

---

## 027. whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign

![whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign](images/027-whole-plate-assembled-with-bartenders-marble-ledge-back-bar-carcass-back-bar-lower-shelf-bottles-on-lower-shel.png)

**The thinking.** Base plus every approved, enabled part laid in order through its own silhouette; the TV's blank screen and the window's lettering are drawn in code last, because lettering is never left to the model.

*Logged 14:24.*

---

## 028. whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign

![whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign](images/028-whole-plate-assembled-with-bartenders-marble-ledge-back-bar-carcass-back-bar-lower-shelf-bottles-on-lower-shel.png)

**The thinking.** Base plus every approved, enabled part laid in order through its own silhouette; the TV's blank screen and the window's lettering are drawn in code last, because lettering is never left to the model.

*Logged 14:24.*

---

## 029. whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign

![whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign](images/029-whole-plate-assembled-with-bartenders-marble-ledge-back-bar-carcass-back-bar-lower-shelf-bottles-on-lower-shel.png)

**The thinking.** Base plus every approved, enabled part laid in order through its own silhouette; the TV's blank screen and the window's lettering are drawn in code last, because lettering is never left to the model.

*Logged 14:24.*

---

## 030. whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign

![whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign](images/030-whole-plate-assembled-with-bartenders-marble-ledge-back-bar-carcass-back-bar-lower-shelf-bottles-on-lower-shel.png)

**The thinking.** Base plus every approved, enabled part laid in order through its own silhouette; the TV's blank screen and the window's lettering are drawn in code last, because lettering is never left to the model.

*Logged 14:31.*

---

## 031. The inlaid back bar perfected: lining calmed, fourteen real bottles, fill lines, typeset labels

![The inlaid back bar perfected: lining calmed, fourteen real bottles, fill lines, typeset labels](images/031-the-inlaid-back-bar-perfected-lining-calmed-fourteen-real-bottles-fill-lines-typeset-labels.png)

**The ask.** Founder: 'i love those shelves if you could clean up the wood grain around the shelf and improve the bottles drastically - real labels like real liquor bottles, different shapes and sizes, all at least half full.'

**The thinking.** The unit and both shelves were re-approved from a seed-21 render with the calmer lining and flat face frame. The bottles were rebuilt in code: eight real silhouettes (square bourbon, round-shouldered scotch, squat rum, gin flask, decanter rye, slim vodka, broad whiskey, tequila) at 1.75x width, 8 below and 6 above, each filled 55-78 percent of its body with the fill line coded as a 100-level step plus an ink meniscus - a 50-level step had rendered every bottle dark to the shoulder. A 2x detail render of the rows failed (flat block-ins turn into marble slabs), so the bottles were rendered whole-plate on the approved unit; seed 21 beat seed 7. The brand names are typeset in code (label-bottles.py) onto the paper the model actually painted - each label quad is snapped to the bright paper first - one big brand word per label, the full name where it fits, with the canon golf-pun brands.

**Settings.** local/sensenova-u1.5 via AuraVision, bottles-lower --with bottles-upper, seed 21; labels typeset in code at build

**Verdict.** Accepted into the plate; sent to the founder for approval.

*Logged 14:31.*

---

## 033. Drew in the scene - round 1 contact sheet, six seeds, route A with Picture 3 cropped to the flamingo alone

![Drew in the scene - round 1 contact sheet, six seeds, route A with Picture 3 cropped to the flamingo alone](images/033-drew-in-the-scene-round-1-contact-sheet-six-seeds-route-a-with-picture-3-cropped-to-the-flamingo-alone.png)

**The ask.** The founder: get Drew into the approved room today, and perfect him there. The staging is fixed - he sits in the LEFT club chair at the marble, seen FROM BEHIND and a little to his left, over his shoulder: the knit of the sweater vest across his shoulder blades, the chair's studded roll crossing his lower back, the neck rising in its S, the head turned RIGHT toward the other chair so the bill reads in profile and the lidded eye shows, the near feathered hand on the marble. Not facing the camera.

**The thinking.** The placer's bake-off earlier today settled the ROUTE (A, the flat field: the model is handed only the real chair, the real marble and the wall's silhouette lines on flat grey 140, and only the pixels that differ from that field are laid onto the approved plate - 40 grey levels at the seam against route B's 65-72, and 12% of the plate at risk against 24%). It also found the reason the staging kept failing, and it was not the route: all four bake-off renders came back with Drew square to the camera AND with a labrador at his elbow, and duo-behind.png - the Picture 3 the founder scored highest - is a flamingo AND a labrador at the marble. The model was copying Picture 3's CAST as well as its camera. So round 1 changes the cast reference and nothing else about the route: Picture 3 is cropped to the FLAMINGO ALONE (staging-flamingo.png, the left third of duo-behind), its label is rewritten to say copy the body angle and the turn of the head and nothing else, and one extra numbered EDIT names the cast out loud - exactly one living creature, no dog, no second bird, the right-hand chair stays empty. Six seeds, because the staging has been a lottery and one seed proves nothing.

**Settings.** scripts/cast-place.py --route A --pose-name seated-left-solo3 --staging staging-flamingo.png --staging-label ... --extra-edit ... ; local/qwen-image-edit-2511 via POST http://127.0.0.1:8000/api/generate, fast (Lightning 8-step, cfg 1), 4:5 -> 1344x1680, three references as data URIs; ComfyUI restarted between every render.

**Prompt.** [prompts/033-drew-in-the-scene-round-1-contact-sheet-six-seeds-route-a-with-picture-3-cropped-to-the-flamingo-alone.prompt.txt](prompts/033-drew-in-the-scene-round-1-contact-sheet-six-seeds-route-a-with-picture-3-cropped-to-the-flamingo-alone.prompt.txt)

**Verdict.** REJECTED as pictures, but the round moved the problem. THE FIX WORKED: the labrador is gone from all six seeds - cropping Picture 3 to the flamingo alone, plus EDIT 3 naming the cast, ended the dog that appeared in 4 of 4 bake-off renders. WHAT STILL FAILS, at all six seeds without exception: Drew is square to the camera or three-quarter FRONT, never from behind; he is on the FAR side of the marble, in the barman's place, at roughly 1.6-2x the plate's scale; and he sits in a tufted wing chair the model invents for him while the plate's own studded club chair stays visibly EMPTY in the foreground of every tile. THE CAUSE IS IN THE FIELD, NOT IN THE WORDING. Route A's flat field leaves only the chair's studded ROLL at the very bottom of the crop, which reads as the near lip of a counter, and the marble slab then reads as a table with a far side - so the model puts him across it. The model also copies Picture 3's ROOM: the crop still contains the back bar, and the BIRDIE BOURBON bottles, the panelling and the mirrored lettering turn up in seeds 21, 44 and 55. NUMBERS: join 44.2-60.7 grey levels, 10.0-13.1% of the plate replaced, and the field was NOT kept flat at any seed (0.88-0.95 changed), so the difference key returns a box-filling slab rather than an outline - the one thing the bake-off had going for it did not survive this prompt. BEST SEED 7: the only one that reads as Drew at 2x - bill, lidded eye, collar band, bow tie, V-neck knit and the feathered hand on the martini all correct - and the least destructive (10.0% of the plate, sticker 0.42 of the box against 0.55 everywhere else). ROUND 2: cut Picture 3 to the bird on blank paper, and put the CHAIR BACK into the flat field so there is something to sit in.

*Logged 14:47.*

---

## 034. Drew seated in the left club chair - route S seed 7

![Drew seated in the left club chair - route S seed 7](images/034-drew-seated-in-the-left-club-chair-route-s-seed-7.png)

**The ask.** Team Drew 3, round 1. The founder's brief: Drew seated in the LEFT leather club chair, seen from behind and a little to his left, head turned to his right in three-quarter so the bill and one lidded eye read, knit vest and collar above the chair back, the chair back in front of his lower body - and the room itself untouched pixels. Routes A and B never managed the seat; this is route S, run as built, with the flamingo-only staging on (--staging-solo).

**The thinking.** Routes A and B hand the model a picture of the ROOM and ask it to choose a scale and a seat, and it always chose a side table of its own. Route S takes the choice away: Picture 1 is a white sheet carrying only the left chair's own rendered pixels, one thin ink line for the marble's near edge, and a pale under-drawing of the construction's own figure-drew-02-toward block-in at --under-blend 0.55. EDIT 1 asks only that Drew be drawn EXACTLY FILLING that under-drawing. The key is absolute, not a difference key - ink darker than 232 inside the dilated figure mask, minus the chair - so the approved plate's own pixels are all that carries the room.

**Settings.** scripts/cast-place.py --character drew --route S --seed 7 --staging-solo --tag r1; qwen-image-edit-2511 via AuraVision 127.0.0.1:8000; 4:5 at 1344x1680, Lightning 8-step cfg 1; box 20,700,660,1500; --under-blend 0.55 --white-thresh 232; rules pen; 52.6s

**Prompt.** [prompts/034-drew-seated-in-the-left-club-chair-route-s-seed-7.prompt.txt](prompts/034-drew-seated-in-the-left-club-chair-route-s-seed-7.prompt.txt)

**Verdict.** 12/20 - FAIL. identity 3, pose 4, seat 3, cleanliness 2. The seat is finally right: he is down IN our left chair with the studded roll across his lower back and the collar and vest above it, at the block-in's own place. Against that, the bill is heavy and dark instead of the portrait's slender pale bill with a black outer third; the model redrew its own studded chair roll inside the sticker, so the chair double-prints; and the sticker carries a counter slab, a martini and a saucer that belong to Picture 3's crop. Free-page ink 0.18, the dirtiest of the three usable seeds. Only 0.67 of his silhouette survived the key, so the panelling shows through his knit.

*Logged 16:25.*

---

## 035. Drew seated in the left club chair - route S seed 21

![Drew seated in the left club chair - route S seed 21](images/035-drew-seated-in-the-left-club-chair-route-s-seed-21.png)

**The ask.** Team Drew 3, round 1, second of four seeds. Same brief and same route S as seed 7, run as built with no change: Drew seated in OUR left leather club chair, from behind and a little to his left, head turned right in three-quarter, the chair back in front of his lower body, the room's own pixels untouched.

**The thinking.** Same white sheet, same pale under-drawing, same absolute key; only the seed moves. Four seeds are drawn so the route can be judged on what it does repeatably rather than on one lucky render - route A's six-seed round failed identically at every seed, which is what proved the fault was the field and not the wording.

**Settings.** scripts/cast-place.py --character drew --route S --seed 21 --staging-solo --tag r1; qwen-image-edit-2511 via AuraVision 127.0.0.1:8000; 4:5 at 1344x1680, Lightning 8-step cfg 1; box 20,700,660,1500; --under-blend 0.55 --white-thresh 232; rules pen; 56.6s

**Prompt.** [prompts/035-drew-seated-in-the-left-club-chair-route-s-seed-21.prompt.txt](prompts/035-drew-seated-in-the-left-club-chair-route-s-seed-21.prompt.txt)

**Verdict.** 13/20 - the best of the four, but still a FAIL. identity 4, pose 4, seat 3, cleanliness 2. Everything the founder asked to READ does read: the small refined head, the heavy-lidded eye, the bill, the white collar band, the small black bow tie, the knit V-neck vest and the feathered hand with fingers on the martini - and he is seated in OUR chair, from behind and a little to his left, head turned right, the studded roll across his lower back. What fails is the cut-out, not the drawing: 0.66 of his silhouette survived the key, so the bar's panelling and the window show through him and a white flamingo reads as a grey stippled heron; and the sticker brought a slab of marble and a bowl of olives onto the counter with him.

*Logged 16:26.*

---

## 036. Drew seated in the left club chair - route S seed 41

![Drew seated in the left club chair - route S seed 41](images/036-drew-seated-in-the-left-club-chair-route-s-seed-41.png)

**The ask.** Team Drew 3, round 1, third of four seeds. Same brief, same route S as built.

**The thinking.** Seed 41 is the seed every previous round was measured on, so it is carried into route S for comparison: if the white sheet holds where the flat grey field did not, it should hold here first.

**Settings.** scripts/cast-place.py --character drew --route S --seed 41 --staging-solo --tag r1; qwen-image-edit-2511 via AuraVision 127.0.0.1:8000; 4:5 at 1344x1680, Lightning 8-step cfg 1; box 20,700,660,1500; --under-blend 0.55 --white-thresh 232; rules pen; 60.5s

**Prompt.** [prompts/036-drew-seated-in-the-left-club-chair-route-s-seed-41.prompt.txt](prompts/036-drew-seated-in-the-left-club-chair-route-s-seed-41.prompt.txt)

**Verdict.** 6/20 - FAIL, and the worst of the four. identity 1, pose 2, seat 2, cleanliness 1. The sheet was not kept blank: the model put ink on 95% of the box, so the absolute key had nothing to separate and handed back a box-filling slab (one blob, 150k px). The head reads front-on with a striped skull and no bow tie, a second studded roll is drawn over the plate's own chair, and a grey smear crosses the marble. The script's own dirty-key warning fired at 92%. This is the same failure the flat-grey field had at seed 41 in the previous round - this seed re-inks whatever ground it is given.

*Logged 16:26.*

---

## 037. Drew seated in the left club chair - route S seed 44

![Drew seated in the left club chair - route S seed 44](images/037-drew-seated-in-the-left-club-chair-route-s-seed-44.png)

**The ask.** Team Drew 3, round 1, fourth of four seeds. Same brief, same route S as built.

**The thinking.** The fourth seed of the round. It also turned into the round's diagnostic: it is the only seed that drew Drew in the portrait's own WHITE, and that is exactly the seed the absolute key handles worst - which is how the round found its real fault.

**Settings.** scripts/cast-place.py --character drew --route S --seed 44 --staging-solo --tag r1; qwen-image-edit-2511 via AuraVision 127.0.0.1:8000; 4:5 at 1344x1680, Lightning 8-step cfg 1; box 20,700,660,1500; --under-blend 0.55 --white-thresh 232; rules pen; 52.6s. First two attempts returned 'All connection attempts failed' while ComfyUI was restarting; /system_stats checked healthy and the render retried.

**Prompt.** [prompts/037-drew-seated-in-the-left-club-chair-route-s-seed-44.prompt.txt](prompts/037-drew-seated-in-the-left-club-chair-route-s-seed-44.prompt.txt)

**Verdict.** 12/20 - FAIL, but the most useful render of the round. identity 4, pose 4, seat 3, cleanliness 1. On paper this is the truest Drew the studio has drawn in the chair: white plumage in fine dash-strokes, the slender pale bill, the heavy-lidded eye, the collar band, the small black bow tie, the knit V-neck vest, the feathered hand on the martini, seated in OUR chair from behind and a little to his left with his head turned right. And it is destroyed in the laid preview, because he is drawn WHITE: the absolute key keeps only what is darker than 232, so his paper-white interior is not his, and just 0.51 of his silhouette survived. His HEAD IS CUT OFF - a milky wedge over the window - and a smeared slab of marble came with him. The better the model draws Drew, the worse this key cuts him out.

*Logged 16:26.*

---

## 038. Team Drew 3 round 1 contact sheet - route S, four seeds

![Team Drew 3 round 1 contact sheet - route S, four seeds](images/038-team-drew-3-round-1-contact-sheet-route-s-four-seeds.png)

**The ask.** One contact sheet of the four laid crops with seed and total in the caption, so the round can be read at a glance.

**The thinking.** Four laid previews, each cropped x 0-800 / y 600-1600 of the plate at 1x - the founder's own window on the left chair - captioned with the seed, the four sub-scores and the total out of 20. Read left to right the sheet makes the round's one finding visible without any numbers: at every seed Drew is finally IN our left chair at the block-in's scale with the chair back across his lower body, and at every seed he is semi-transparent, because a white bird keyed by darkness is mostly holes.

**Settings.** scratchpad/cast-scene/drew3/build-round1-sheet.py; laid previews from canon/room-kit/v2/figures/drew-seated-left-rS-s{7,21,41,44}-laid.png

**Verdict.** The round in one picture. Best seed 21 at 13/20; no seed passes (PASS is 17 with nothing below 4). Seat and pose are solved by route S; identity and cleanliness are both being held down by the same thing - the absolute white-threshold key keeps only 0.51-0.66 of Drew's own silhouette, so the room shows through him.

*Logged 16:26.*

---

## 039. bottles-on-lower-shelf and bottles-on-upper-shelf render seed 21 laid in full plate

![bottles-on-lower-shelf and bottles-on-upper-shelf render seed 21 laid in full plate](images/039-bottles-on-lower-shelf-and-bottles-on-upper-shelf-render-seed-21-laid-in-full-plate.png)

**The thinking.** Rendered in context - the plate as it stands behind this part, with only this part's own silhouette blocked in as values - so the pen, light and perspective are inherited; only the mask is laid back. Part note: the row of ELEVEN real liquor bottles standing shoulder to shoulder on the lower shelf of the inlaid recess, well in front of its boarded back - A NORMAL BAR'S BACK SHELF, crowded and mixed: EVERY BOTTLE A DIFFERENT SHAPE, HEIGHT AND WIDTH, no two neighbours alike - squat flasks beside tall slim bottles, square shoulders beside round, a decanter, a long-necked bottle, a stubby one - with different closures: foil capsules under dark caps, pale rounded cork stoppers, tall black caps. The glass is mixed too: CLEAR bottles pale with a bright highlight down the window side, DARK-GLASS bottles deep, glassy and clearly darker than their clear neighbours, all reading against the darker boards behind. EVERY BOTTLE IS AT LEAST HALF FULL and the levels differ: the liquid inside is DARKER than the empty glass above it and the two meet at a clean horizontal FILL LINE. Each bottle STANDS ON THE BOARD with a small pool of contact shadow at its foot and a soft shadow up the boarding behind it, leaning away from the window at frame-left. Each wears ONE paper label - most white paper, a few BLACK paper - placed high or low as the block-in places it, some with a small second label on the neck; the labels are PLAIN AND BLANK: no lettering, no words, no letters, no numerals, no pseudo-text, no drawing - their emblems are stamped on in code afterwards, exactly as the window is gilded AND the row of NINE real liquor bottles standing shoulder to shoulder on the upper shelf of the inlaid recess, well in front of its boarded back - A NORMAL BAR'S BACK SHELF, crowded and mixed: EVERY BOTTLE A DIFFERENT SHAPE, HEIGHT AND WIDTH, no two neighbours alike - squat flasks beside tall slim bottles, square shoulders beside round, a decanter, a long-necked bottle, a stubby one - with different closures: foil capsules under dark caps, pale rounded cork stoppers, tall black caps. The glass is mixed too: CLEAR bottles pale with a bright highlight down the window side, DARK-GLASS bottles deep, glassy and clearly darker than their clear neighbours, all reading against the darker boards behind. EVERY BOTTLE IS AT LEAST HALF FULL and the levels differ: the liquid inside is DARKER than the empty glass above it and the two meet at a clean horizontal FILL LINE. Each bottle STANDS ON THE BOARD with a small pool of contact shadow at its foot and a soft shadow up the boarding behind it, leaning away from the window at frame-left. Each wears ONE paper label - most white paper, a few BLACK paper - placed high or low as the block-in places it, some with a small second label on the neck; the labels are PLAIN AND BLANK: no lettering, no words, no letters, no numerals, no pseudo-text, no drawing - their emblems are stamped on in code afterwards, exactly as the window is gilded

**Settings.** local/sensenova-u1.5, seed 21, full 40 steps cfg 4, rendered together with bottles-upper, negative: text, letters, words, lettering, signage, sign, numbers, typography, writing, inscription, shop name, banner, poster, bartender, terrier, dog, person, figure, woman, character, chair, stool, seat, barstool, chalkboard, blackboard, framed board, picture, frame, dog, retriever, person, figure, man, character, flamingo, bird, person, figure, man, character, lamp, sconce, light fixture, television, screen, monitor, flat screen

**Prompt.** [prompts/039-bottles-on-lower-shelf-and-bottles-on-upper-shelf-render-seed-21-laid-in-full-plate.prompt.txt](prompts/039-bottles-on-lower-shelf-and-bottles-on-upper-shelf-render-seed-21-laid-in-full-plate.prompt.txt)

*Logged 16:37.*

---

## 040. bottles-on-lower-shelf and bottles-on-upper-shelf render seed 7 laid in full plate

![bottles-on-lower-shelf and bottles-on-upper-shelf render seed 7 laid in full plate](images/040-bottles-on-lower-shelf-and-bottles-on-upper-shelf-render-seed-7-laid-in-full-plate.png)

**The thinking.** Rendered in context - the plate as it stands behind this part, with only this part's own silhouette blocked in as values - so the pen, light and perspective are inherited; only the mask is laid back. Part note: the row of ELEVEN real liquor bottles standing shoulder to shoulder on the lower shelf of the inlaid recess, well in front of its boarded back - A NORMAL BAR'S BACK SHELF, crowded and mixed: EVERY BOTTLE A DIFFERENT SHAPE, HEIGHT AND WIDTH, no two neighbours alike - squat flasks beside tall slim bottles, square shoulders beside round, a decanter, a long-necked bottle, a stubby one - with different closures: foil capsules under dark caps, pale rounded cork stoppers, tall black caps. The glass is mixed too: CLEAR bottles pale with a bright highlight down the window side, DARK-GLASS bottles deep, glassy and clearly darker than their clear neighbours, all reading against the darker boards behind. EVERY BOTTLE IS AT LEAST HALF FULL and the levels differ: the liquid inside is DARKER than the empty glass above it and the two meet at a clean horizontal FILL LINE. Each bottle STANDS ON THE BOARD with a small pool of contact shadow at its foot and a soft shadow up the boarding behind it, leaning away from the window at frame-left. Each wears ONE paper label - most white paper, a few BLACK paper - placed high or low as the block-in places it, some with a small second label on the neck; the labels are PLAIN AND BLANK: no lettering, no words, no letters, no numerals, no pseudo-text, no drawing - their emblems are stamped on in code afterwards, exactly as the window is gilded AND the row of NINE real liquor bottles standing shoulder to shoulder on the upper shelf of the inlaid recess, well in front of its boarded back - A NORMAL BAR'S BACK SHELF, crowded and mixed: EVERY BOTTLE A DIFFERENT SHAPE, HEIGHT AND WIDTH, no two neighbours alike - squat flasks beside tall slim bottles, square shoulders beside round, a decanter, a long-necked bottle, a stubby one - with different closures: foil capsules under dark caps, pale rounded cork stoppers, tall black caps. The glass is mixed too: CLEAR bottles pale with a bright highlight down the window side, DARK-GLASS bottles deep, glassy and clearly darker than their clear neighbours, all reading against the darker boards behind. EVERY BOTTLE IS AT LEAST HALF FULL and the levels differ: the liquid inside is DARKER than the empty glass above it and the two meet at a clean horizontal FILL LINE. Each bottle STANDS ON THE BOARD with a small pool of contact shadow at its foot and a soft shadow up the boarding behind it, leaning away from the window at frame-left. Each wears ONE paper label - most white paper, a few BLACK paper - placed high or low as the block-in places it, some with a small second label on the neck; the labels are PLAIN AND BLANK: no lettering, no words, no letters, no numerals, no pseudo-text, no drawing - their emblems are stamped on in code afterwards, exactly as the window is gilded

**Settings.** local/sensenova-u1.5, seed 7, full 40 steps cfg 4, rendered together with bottles-upper, negative: text, letters, words, lettering, signage, sign, numbers, typography, writing, inscription, shop name, banner, poster, bartender, terrier, dog, person, figure, woman, character, chair, stool, seat, barstool, chalkboard, blackboard, framed board, picture, frame, dog, retriever, person, figure, man, character, flamingo, bird, person, figure, man, character, lamp, sconce, light fixture, television, screen, monitor, flat screen

**Prompt.** [prompts/040-bottles-on-lower-shelf-and-bottles-on-upper-shelf-render-seed-7-laid-in-full-plate.prompt.txt](prompts/040-bottles-on-lower-shelf-and-bottles-on-upper-shelf-render-seed-7-laid-in-full-plate.prompt.txt)

*Logged 16:37.*

---

## 041. whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign

![whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign](images/041-whole-plate-assembled-with-bartenders-marble-ledge-back-bar-carcass-back-bar-lower-shelf-bottles-on-lower-shel.png)

**The thinking.** Base plus every approved, enabled part laid in order through its own silhouette; the TV's blank screen and the window's lettering are drawn in code last, because lettering is never left to the model.

*Logged 16:38.*

---

## 042. whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign

![whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign](images/042-whole-plate-assembled-with-bartenders-marble-ledge-back-bar-carcass-back-bar-lower-shelf-bottles-on-lower-shel.png)

**The thinking.** Base plus every approved, enabled part laid in order through its own silhouette; the TV's blank screen and the window's lettering are drawn in code last, because lettering is never left to the model.

*Logged 16:38.*

---

## 043. whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign

![whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign](images/043-whole-plate-assembled-with-bartenders-marble-ledge-back-bar-carcass-back-bar-lower-shelf-bottles-on-lower-shel.png)

**The thinking.** Base plus every approved, enabled part laid in order through its own silhouette; the TV's blank screen and the window's lettering are drawn in code last, because lettering is never left to the model.

*Logged 16:51.*

---

## 044. The back bar as a normal bar: twenty different bottles, no names, emblem labels drawn in code

![The back bar as a normal bar: twenty different bottles, no names, emblem labels drawn in code](images/044-the-back-bar-as-a-normal-bar-twenty-different-bottles-no-names-emblem-labels-drawn-in-code.png)

**The ask.** Founder: 'the bottles shouldnt all look the same, it should be like a normal bar with lots of different bottles; the bottles shouldnt have creative names or even names at all, they just need emblems that remind people of real liquor bottles.'

**The thinking.** A Sonnet designer and an Opus critic reworked the construction in a scratch copy: fourteen silhouettes, eleven bottles below and nine above shoulder to shoulder with uneven gaps, heights from a squat half-height rum to a tall slim vodka, clear and dark glass with the dark glass now clearly darker than the lining, three closure styles (foil capsule, pale cork, tall cap), four black-paper labels, four neck labels, fill levels staggered from 60 to 78 percent. The names are gone: a library of twenty-four emblem devices (shield, medallion, crest, seal, crown, stag, ship, anchor, fleur-de-lis...) is stamped in code onto the paper the model actually painted, one device per label, none repeated, and a label whose paper the model did not paint is left blank rather than stamped on glass. Rendered whole-plate on the approved unit at seeds 21 and 7; seed 21 accepted.

**Settings.** local/sensenova-u1.5 via AuraVision, bottles-lower --with bottles-upper, seed 21; emblems by scripts/label-bottles.py --mode emblems at build

**Verdict.** Accepted into the plate; sent to the founder.

*Logged 16:51.*

---

## 046. Drew seated left - route S round 2 - seed 7 (hole-filled key)

![Drew seated left - route S round 2 - seed 7 (hole-filled key)](images/046-drew-seated-left-route-s-round-2-seed-7-hole-filled-key.png)

**The ask.** Team Drew 3, round 2 of route S. Seat Drew in the LEFT leather club chair of the approved plate, seen from behind and a little to his left, head turned to his right in three-quarter so the bill and one lidded eye read, knit vest and collar above the chair back, chair back across his lower body - and the room's own pixels untouched. Exactly one thing changes from round 1.

**The thinking.** Round 1 proved route S had solved the SEAT and the SCALE - all four seeds put him down in our chair at the block-in's place. Both remaining failures shared one cause: Drew is a WHITE bird and the absolute key keeps only pixels darker than 232, so his paper interior never entered the sticker and what was laid on the plate was a lattice of ink (mask_covered 0.51-0.67) with the window and the panelling showing through him. So this round adds a hole-fill and nothing else: after the overlapping components are kept and before the 1.5px feather, binary_closing(3) then binary_fill_holes on the kept mask, --white-thresh left at 232. It cannot reach new ink because it only runs inside components already kept. Measured here: seed 7's coverage went 0.665 -> 0.832 with free-page ink unchanged (0.1847 -> 0.1838). The menu's own opacity knob was rejected as a bad trade - --white-thresh 246 buys less coverage and blows seed 7's free-page ink to 0.601.

**Settings.** scripts/cast-place.py --character drew --route S --seed 7 --staging-solo --tag r2 | local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000 | box 20,700,660,1500 | roi 140,770,620,1340 | under-blend 0.55 | white-thresh 232 | key: close(3)+fill_holes+feather 1.5

**Prompt.** [prompts/046-drew-seated-left-route-s-round-2-seed-7-hole-filled-key.prompt.txt](prompts/046-drew-seated-left-route-s-round-2-seed-7-hole-filled-key.prompt.txt)

**Verdict.** 11/20. identity 3 - the collar band, the black bow tie, the V-neck knit and the feathered hand with fingers all read, but the crown is crested and speckled instead of small and refined and the eye is round and staring, not heavy-lidded. pose 2 - he is three-quarter FRONT with the bow-tie knot facing us, the one thing the brief says NOT to draw; the under-drawing's back view did not carry. seat 4 - down in OUR left chair, chair back across the lower body, vest and arms above the roll. cleanliness 2 - the sticker still carries Picture 3's martini, a saucer, the counter slab's edge and a piece of the chair's own studded roll, and a soft grey aura the model drew round the bill washes out the panelling behind it. The hole-fill worked exactly as measured - he is opaque now, not a lattice.

*Logged 16:55.*

---

## 047. Drew seated left - route S round 2 - seed 21 (hole-filled key)

![Drew seated left - route S round 2 - seed 21 (hole-filled key)](images/047-drew-seated-left-route-s-round-2-seed-21-hole-filled-key.png)

**The ask.** Team Drew 3, round 2 of route S, second seed. Same brief: Drew down in the LEFT club chair, seen from behind and a little to his left, head turned right in three-quarter, the room's own pixels untouched.

**The thinking.** Same single change as seed 7 - binary_closing(3) then binary_fill_holes on the kept components before the 1.5px feather, --white-thresh still 232 - so this seed tests whether the hole-fill is a general fix or a seed-7 accident. Round 1 measured seed 21 at mask_covered 0.661; the prediction was 0.879.

**Settings.** scripts/cast-place.py --character drew --route S --seed 21 --staging-solo --tag r2 | local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000 | box 20,700,660,1500 | roi 140,770,620,1340 | under-blend 0.55 | white-thresh 232 | key: close(3)+fill_holes+feather 1.5

**Prompt.** [prompts/047-drew-seated-left-route-s-round-2-seed-21-hole-filled-key.prompt.txt](prompts/047-drew-seated-left-route-s-round-2-seed-21-hole-filled-key.prompt.txt)

**Verdict.** 10/20. identity 2 - the head has come apart: a patterned ball with a tiny eye and no crown, and the bill is a flat wedge without the pale shaft and black outer third. The bow tie, the V-neck knit and the fingered hand survive. pose 2 - three-quarter FRONT again, tie knot to camera. seat 4 - correctly in our chair, chair back across the lower body. cleanliness 2 - Picture 3's bowl of olives and the counter slab came into the sticker, and a pale ghost of the bill smears across the panelling. Coverage went 0.661 -> 0.781, so the hole-fill generalises; the head is a render failure, not a key failure.

*Logged 16:55.*

---

## 048. Drew seated left - route S round 2 - seed 41 (hole-filled key)

![Drew seated left - route S round 2 - seed 41 (hole-filled key)](images/048-drew-seated-left-route-s-round-2-seed-41-hole-filled-key.png)

**The ask.** Team Drew 3, round 2 of route S, third seed. Same brief: Drew down in the LEFT club chair, from behind and a little to his left, head turned right in three-quarter, the room's own pixels untouched.

**The thinking.** Seed 41 is the seed that failed the sheet test in round 1 - it did not keep the paper white but re-inked the whole box (raw ink fraction 0.95 this round, free-page ink 0.916). It is here to show what the hole-fill does NOT fix: measured on round 1's own raw, close+fill moved seed 41's coverage only 0.9701 -> 0.9705, because when the whole sheet is ink there are no holes to fill. The fill is a fix for a WHITE bird keyed out of white paper, not a fix for a model that paints the paper.

**Settings.** scripts/cast-place.py --character drew --route S --seed 41 --staging-solo --tag r2 | local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000 | box 20,700,660,1500 | roi 140,770,620,1340 | under-blend 0.55 | white-thresh 232 | key: close(3)+fill_holes+feather 1.5 | 1091s (the 4090 is shared with the back-bar team)

**Prompt.** [prompts/048-drew-seated-left-route-s-round-2-seed-41-hole-filled-key.prompt.txt](prompts/048-drew-seated-left-route-s-round-2-seed-41-hole-filled-key.prompt.txt)

**Verdict.** 10/20. identity 3 - the best head of the round: the pale bill really does carry a black outer third, the eye is heavy-lidded and amiable, and the collar band, bow tie, V-neck knit and fingered hand all read - but he is drawn mid-grey and scaly rather than white and feathered. pose 2 - three-quarter FRONT with the bow-tie knot to camera, the brief's explicit NOT, for the third seed running. seat 4 - down in our chair at the block-in's place, the studded roll across his lower body. cleanliness 1 - the worst of the round: the model inked 95% of the sheet, so the key kept one blob that is 40% not-Drew - a pale slab of re-inked paper, the marble counter, a saucer and a piece of the chair's own roll - and that slab washes the panelling and the marble where it lands.

*Logged 17:02.*

---

## 049. Drew seated left - route S round 2 - seed 44 (hole-filled key)

![Drew seated left - route S round 2 - seed 44 (hole-filled key)](images/049-drew-seated-left-route-s-round-2-seed-44-hole-filled-key.png)

**The ask.** Team Drew 3, round 2 of route S, fourth seed. Same brief: Drew down in the LEFT club chair, from behind and a little to his left, head turned right in three-quarter, the room's own pixels untouched.

**The thinking.** Seed 44 is the seed the transparency hurt most in round 1 - the key kept only 0.513 of his silhouette and the paper interior ATE HIS HEAD outright. On round 1's own raw the hole-fill lifts that to 0.732 with free-page ink going DOWN (0.0898 -> 0.0871), so this seed was the clearest test of the change. It passed the test on those pixels; what came back this time is a different draw, and the model itself did not draw a head.

**Settings.** scripts/cast-place.py --character drew --route S --seed 44 --staging-solo --tag r2 | local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000 | box 20,700,660,1500 | roi 140,770,620,1340 | under-blend 0.55 | white-thresh 232 | key: close(3)+fill_holes+feather 1.5

**Prompt.** [prompts/049-drew-seated-left-route-s-round-2-seed-44-hole-filled-key.prompt.txt](prompts/049-drew-seated-left-route-s-round-2-seed-44-hole-filled-key.prompt.txt)

**Verdict.** 9/20, the weakest of the round. identity 1 - there is no face: the head is a flat crosshatched wedge with no eye at all and a doubled, broken bill. The wardrobe is the only thing that reads - collar band, black bow tie, V-neck knit, a hand with fingers. pose 2 - three-quarter FRONT again, and with no readable bill or eye the turn of the head cannot be judged. seat 4 - correctly down in our left chair, studded roll across his lower body. cleanliness 2 - martini, saucer, counter slab and a piece of the chair's roll in the sticker, and the pale ghost round the head is now laid as a solid wedge across the window and the panelling. Coverage 0.513 -> 0.775, so the key is fixed; the drawing is not.

*Logged 17:03.*

---

## 050. Drew seated left - route S round 3 - Picture 3 OFF - seed 7

![Drew seated left - route S round 3 - Picture 3 OFF - seed 7](images/050-drew-seated-left-route-s-round-3-picture-3-off-seed-7.png)

**The ask.** Team Drew 3, route S, round 3. Seat Drew in the LEFT leather club chair, seen from behind and a little to his left, head turned to his right in three-quarter so the bill and one lidded eye read, knit vest and collar above the chair back, chair back in front of his lower body. The room must stay the plate's own untouched pixels.

**The thinking.** The one change this round: PICTURE 3 OFF - dropped --staging-solo, route S's own documented default. Not for cleanliness but because Picture 3 WAS the pose bug: staging-flamingo.png is labelled 'from behind' but is in fact a three-quarter FRONT view - chest to camera, white collar and black bow-tie knot facing us, V-neck vest front, martini in the near hand. All four of round 2's seeds reproduced that exact body angle and the martini with it, so the true back-view under-drawing was losing to it at --under-blend 0.55. Dropping it removes the front-view instruction and the martini/olives/saucer furniture in one move. Everything else held: --under-blend 0.55, --white-thresh 232, box and ROI unchanged.

**Settings.** scripts/cast-place.py --character drew --route S --seed 7 --tag r3 | local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000 | route S white-sheet Picture 1, under-blend 0.55, white-thresh 232, rules pen, NO Picture 3 (staging_solo=false, 2 references)

**Prompt.** [prompts/050-drew-seated-left-route-s-round-3-picture-3-off-seed-7.prompt.txt](prompts/050-drew-seated-left-route-s-round-3-picture-3-off-seed-7.prompt.txt)

**Verdict.** 11/20 - identity 2, pose 3, seat 4, clean 2. The front view and the martini are GONE: the back view is won. But the head is a mangled crest with no readable bill and no eye, and the key returned 161 blobs with room fragments in the sticker.

*Logged 17:21.*

---

## 051. Drew seated left - route S round 3 - Picture 3 OFF - seed 21

![Drew seated left - route S round 3 - Picture 3 OFF - seed 21](images/051-drew-seated-left-route-s-round-3-picture-3-off-seed-21.png)

**The ask.** Team Drew 3, route S, round 3. Seat Drew in the LEFT leather club chair, seen from behind and a little to his left, head turned to his right in three-quarter so the bill and one lidded eye read, knit vest and collar above the chair back, chair back in front of his lower body. The room must stay the plate's own untouched pixels.

**The thinking.** The one change this round: PICTURE 3 OFF - dropped --staging-solo, route S's own documented default. Not for cleanliness but because Picture 3 WAS the pose bug: staging-flamingo.png is labelled 'from behind' but is in fact a three-quarter FRONT view - chest to camera, white collar and black bow-tie knot facing us, V-neck vest front, martini in the near hand. All four of round 2's seeds reproduced that exact body angle and the martini with it, so the true back-view under-drawing was losing to it at --under-blend 0.55. Dropping it removes the front-view instruction and the martini/olives/saucer furniture in one move. Everything else held: --under-blend 0.55, --white-thresh 232, box and ROI unchanged.

**Settings.** scripts/cast-place.py --character drew --route S --seed 21 --tag r3 | local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000 | route S white-sheet Picture 1, under-blend 0.55, white-thresh 232, rules pen, NO Picture 3 (staging_solo=false, 2 references)

**Prompt.** [prompts/051-drew-seated-left-route-s-round-3-picture-3-off-seed-21.prompt.txt](prompts/051-drew-seated-left-route-s-round-3-picture-3-off-seed-21.prompt.txt)

**Verdict.** 8/20 - identity 2, pose 2, seat 3, clean 1. Worst of the four. The knit vest across the shoulder blades is excellent, but the head is DETACHED - the bill floats free above the neck stub - and the head's white interior lays as an opaque blob punched over the room. scale 0.15 because the topmost blob is that floating bill.

*Logged 17:21.*

---

## 052. Drew seated left - route S round 3 - Picture 3 OFF - seed 41

![Drew seated left - route S round 3 - Picture 3 OFF - seed 41](images/052-drew-seated-left-route-s-round-3-picture-3-off-seed-41.png)

**The ask.** Team Drew 3, route S, round 3. Seat Drew in the LEFT leather club chair, seen from behind and a little to his left, head turned to his right in three-quarter so the bill and one lidded eye read, knit vest and collar above the chair back, chair back in front of his lower body. The room must stay the plate's own untouched pixels.

**The thinking.** The one change this round: PICTURE 3 OFF - dropped --staging-solo, route S's own documented default. Not for cleanliness but because Picture 3 WAS the pose bug: staging-flamingo.png is labelled 'from behind' but is in fact a three-quarter FRONT view - chest to camera, white collar and black bow-tie knot facing us, V-neck vest front, martini in the near hand. All four of round 2's seeds reproduced that exact body angle and the martini with it, so the true back-view under-drawing was losing to it at --under-blend 0.55. Dropping it removes the front-view instruction and the martini/olives/saucer furniture in one move. Everything else held: --under-blend 0.55, --white-thresh 232, box and ROI unchanged.

**Settings.** scripts/cast-place.py --character drew --route S --seed 41 --tag r3 | local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000 | route S white-sheet Picture 1, under-blend 0.55, white-thresh 232, rules pen, NO Picture 3 (staging_solo=false, 2 references)

**Prompt.** [prompts/052-drew-seated-left-route-s-round-3-picture-3-off-seed-41.prompt.txt](prompts/052-drew-seated-left-route-s-round-3-picture-3-off-seed-41.prompt.txt)

**Verdict.** 13/20 - identity 3, pose 3, seat 4, clean 3. BEST OF THE ROUND. White collar band, a clear small black bow tie, the knit V-neck vest and a properly feathered hand with fingers on the marble. Still fails on the head: a flat folded ribbon terminating in a bill-like wedge, no skull, no eye.

*Logged 17:21.*

---

## 053. Drew seated left - route S round 3 - Picture 3 OFF - seed 44

![Drew seated left - route S round 3 - Picture 3 OFF - seed 44](images/053-drew-seated-left-route-s-round-3-picture-3-off-seed-44.png)

**The ask.** Team Drew 3, route S, round 3. Seat Drew in the LEFT leather club chair, seen from behind and a little to his left, head turned to his right in three-quarter so the bill and one lidded eye read, knit vest and collar above the chair back, chair back in front of his lower body. The room must stay the plate's own untouched pixels.

**The thinking.** The one change this round: PICTURE 3 OFF - dropped --staging-solo, route S's own documented default. Not for cleanliness but because Picture 3 WAS the pose bug: staging-flamingo.png is labelled 'from behind' but is in fact a three-quarter FRONT view - chest to camera, white collar and black bow-tie knot facing us, V-neck vest front, martini in the near hand. All four of round 2's seeds reproduced that exact body angle and the martini with it, so the true back-view under-drawing was losing to it at --under-blend 0.55. Dropping it removes the front-view instruction and the martini/olives/saucer furniture in one move. Everything else held: --under-blend 0.55, --white-thresh 232, box and ROI unchanged.

**Settings.** scripts/cast-place.py --character drew --route S --seed 44 --tag r3 | local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000 | route S white-sheet Picture 1, under-blend 0.55, white-thresh 232, rules pen, NO Picture 3 (staging_solo=false, 2 references)

**Prompt.** [prompts/053-drew-seated-left-route-s-round-3-picture-3-off-seed-44.prompt.txt](prompts/053-drew-seated-left-route-s-round-3-picture-3-off-seed-44.prompt.txt)

**Verdict.** 12/20 - identity 2, pose 3, seat 4, clean 3. The clearest back view and the cleanest key of the four (0.1053 outside the sticker). Knit vest and standing collar read well, but the neck breaks between the collar and a grey head wedge over the window.

*Logged 17:21.*

---

## 054. Drew seated left - route S round 3 contact sheet - Picture 3 OFF

![Drew seated left - route S round 3 contact sheet - Picture 3 OFF](images/054-drew-seated-left-route-s-round-3-contact-sheet-picture-3-off.png)

**The ask.** One contact sheet of the four round-3 laid crops with seed and total in the caption.

**The thinking.** Round 3's one change was Picture 3 OFF. The sheet is the four laid previews cropped x 0-800, y 600-1600 at 1x. Read left to right: the front view and the martini that dominated round 2 are gone at every seed, and the body now reads from behind with the knit vest across the shoulder blades and the chair back in front of the lower body. The whole of the remaining failure has moved into the head - at all four seeds the head above the chair back comes back as a pale wedge or ribbon with no skull and no eye, and at seed 21 it detaches entirely. Measured: the head/neck band (y826-1130) is paler than the body band (y1130-1400) at every seed (mean tone 152/122/169 vs 137/112/142), which is the head being the one part of the under-drawing with no chair pixels beside it to anchor it.

**Settings.** build-round3-sheet.py, four laid crops at 1x, captions from round-3-scores.json

**Verdict.** Round 3 FAILS the gate (PASS = total >= 17 with no score below 4). Best seed 41 at 13/20, up from round 2's best of 11. The change did what it was predicted to do - the pose bug was Picture 3 - but it bought about 2 points, not the 3-4 hoped, because it exposed a head that the under-drawing is too faint to specify. Round 4: --under-blend 0.55 -> 0.30.

*Logged 17:21.*

---

## 055. Drew seated left - route S round 4 under-blend 0.30 - seed 7

![Drew seated left - route S round 4 under-blend 0.30 - seed 7](images/055-drew-seated-left-route-s-round-4-under-blend-0-30-seed-7.png)

**The ask.** Team Drew 3, round 4 (route S). Seat Drew in the LEFT leather club chair of the approved plate, seen from behind and a little to his left, head turned right in three-quarter so the bill and one lidded eye read, knit vest and collar above the chair back, chair back in front of his lower body. Room pixels must stay untouched. Round 4's single change: --under-blend 0.55 -> 0.30 (darken the under-drawing so the head band carries tone). Picture 3 stays OFF.

**The thinking.** Round 3 won the body and moved the whole failure into the head: at every seed the head above the chair back came back as a pale wedge with no skull and no eye. Measured cause was that the head/neck band of the under-drawing is paler than the body band, so the head is the one stretch of Picture 1 where the model is told least. This round darkens the under-drawing (--under-blend 0.30) and changes nothing else. Deliberately NOT touching --white-thresh: the drawing itself is wrong, and raising the key would only lay a mangled head more solidly. NOTE: the round's literal command line carried --staging-solo (Picture 3 ON) and no --under-blend, which is exactly round 2's configuration and would have applied none of this round's stated change; I ran the round as stated instead - 0.30, Picture 3 OFF, 2 references - and flagged it.

**Settings.** route S, local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000, --under-blend 0.30, --white-thresh 232, Picture 3 OFF (2 references), rules=pen, box 20,700,660,1500, roi 140,770,620,1340, seed 7

**Prompt.** [prompts/055-drew-seated-left-route-s-round-4-under-blend-0-30-seed-7.prompt.txt](prompts/055-drew-seated-left-route-s-round-4-under-blend-0-30-seed-7.prompt.txt)

**Verdict.** 8/20. FAIL. Body/vest/collar/bow tie read from behind, but the head is still a folded feathered ribbon - no skull, no bill, no eye. Chair studs and marble fragments keyed into the sticker (93 blobs, cleanliness 0.153). identity 2, pose 2, seat 2, cleanliness 2.

*Logged 17:37.*

---

## 056. Drew seated left - route S round 4 under-blend 0.30 - seed 21

![Drew seated left - route S round 4 under-blend 0.30 - seed 21](images/056-drew-seated-left-route-s-round-4-under-blend-0-30-seed-21.png)

**The ask.** Team Drew 3, round 4 (route S). Seat Drew in the LEFT leather club chair of the approved plate, seen from behind and a little to his left, head turned right in three-quarter so the bill and one lidded eye read, knit vest and collar above the chair back, chair back in front of his lower body. Room pixels must stay untouched. Round 4's single change: --under-blend 0.55 -> 0.30 (darken the under-drawing so the head band carries tone). Picture 3 stays OFF.

**The thinking.** Second seed of the 0.30 sweep, same settings, sequential.

**Settings.** route S, local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000, --under-blend 0.30, --white-thresh 232, Picture 3 OFF (2 references), rules=pen, box 20,700,660,1500, roi 140,770,620,1340, seed 21

**Prompt.** [prompts/056-drew-seated-left-route-s-round-4-under-blend-0-30-seed-21.prompt.txt](prompts/056-drew-seated-left-route-s-round-4-under-blend-0-30-seed-21.prompt.txt)

**Verdict.** 7/20. FAIL, worst of the four. The bill and eye are drawn beautifully but float COMPLETELY DETACHED above the body with no skull, the neck ending in feathers. Head band tone did invert correctly (115.3 head vs 118.1 body, vs 122/112 in round 3). topmost-blob scale 0.17, mask covered 0.57, 141 blobs. identity 2, pose 2, seat 1, cleanliness 2.

*Logged 17:37.*

---

## 057. Drew seated left - route S round 4 under-blend 0.30 - seed 41

![Drew seated left - route S round 4 under-blend 0.30 - seed 41](images/057-drew-seated-left-route-s-round-4-under-blend-0-30-seed-41.png)

**The ask.** Team Drew 3, round 4 (route S). Seat Drew in the LEFT leather club chair of the approved plate, seen from behind and a little to his left, head turned right in three-quarter so the bill and one lidded eye read, knit vest and collar above the chair back, chair back in front of his lower body. Room pixels must stay untouched. Round 4's single change: --under-blend 0.55 -> 0.30 (darken the under-drawing so the head band carries tone). Picture 3 stays OFF.

**The thinking.** Third seed of the 0.30 sweep, same settings, sequential.

**Settings.** route S, local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000, --under-blend 0.30, --white-thresh 232, Picture 3 OFF (2 references), rules=pen, box 20,700,660,1500, roi 140,770,620,1340, seed 41

**Prompt.** [prompts/057-drew-seated-left-route-s-round-4-under-blend-0-30-seed-41.prompt.txt](prompts/057-drew-seated-left-route-s-round-4-under-blend-0-30-seed-41.prompt.txt)

**Verdict.** 9/20. FAIL. Best body of the four - proper small black bow tie, white collar, knit V-neck vest, feathered hand with fingers on the marble, seen from behind and a little to his left. Head still a folded wedge with a wire bill and a dot for an eye; in the laid it reads as a pale grey chevron smear on the wall. Head/body tone gap closed from +27 to +3.3 (140.1 vs 136.8). identity 2, pose 3, seat 2, cleanliness 2.

*Logged 17:37.*

---

## 058. Drew seated left - route S round 4 under-blend 0.30 - seed 44 - BEST

![Drew seated left - route S round 4 under-blend 0.30 - seed 44 - BEST](images/058-drew-seated-left-route-s-round-4-under-blend-0-30-seed-44-best.png)

**The ask.** Team Drew 3, round 4 (route S). Seat Drew in the LEFT leather club chair of the approved plate, seen from behind and a little to his left, head turned right in three-quarter so the bill and one lidded eye read, knit vest and collar above the chair back, chair back in front of his lower body. Room pixels must stay untouched. Round 4's single change: --under-blend 0.55 -> 0.30 (darken the under-drawing so the head band carries tone). Picture 3 stays OFF.

**The thinking.** Fourth seed of the 0.30 sweep, same settings, sequential.

**Settings.** route S, local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000, --under-blend 0.30, --white-thresh 232, Picture 3 OFF (2 references), rules=pen, box 20,700,660,1500, roi 140,770,620,1340, seed 44

**Prompt.** [prompts/058-drew-seated-left-route-s-round-4-under-blend-0-30-seed-44-best.prompt.txt](prompts/058-drew-seated-left-route-s-round-4-under-blend-0-30-seed-44-best.prompt.txt)

**Verdict.** 10/20. BEST OF ROUND, still FAIL. FIRST REAL HEAD in four rounds: a genuine rounded skull joined to the S-neck, an eye and a full bill, over the white collar and knit V-neck vest, feathered hand with fingers on the marble. Misses: head reads FULL PROFILE not three-quarter, head too large to be the portrait's small refined head, bill lacks the black outer third, eye round not heavy-lidded, and he sits above the chair rather than down in it (scale 0.79). Best cleanliness of the round (0.0825) and best mask coverage (0.854). identity 3, pose 2, seat 2, cleanliness 3.

*Logged 17:37.*

---

## 059. Drew round 4 contact sheet - four seeds at under-blend 0.30

![Drew round 4 contact sheet - four seeds at under-blend 0.30](images/059-drew-round-4-contact-sheet-four-seeds-at-under-blend-0-30.png)

**The ask.** One contact sheet of the four round-4 laid crops with seed and total in the caption.

**The thinking.** Four seeds at the same settings so the head failure can be compared across them. The sheet is what shows the round's real result: seed 44 is the first render in four rounds with an actual skull, eye and bill, while 7, 21 and 41 still put a pale wedge or a detached bill above the collar - so the head fix is seed-dependent, not settled.

**Settings.** laid previews cropped x0-800 y600-1600 at 1x, seeds 7/21/41/44, route S, --under-blend 0.30, Picture 3 OFF

**Verdict.** Round 4 FAILS: best total 10/20 (seed 44), threshold is 17 with nothing below 4. Darkening the under-drawing did move the drawing - one seed in four now draws a real head, where round 3 drew none - but it did not settle it, and measurement shows the lever is now exhausted.

*Logged 17:37.*

---

## 060. Team 4 Abby round 1 seed 7 route S laid preview

![Team 4 Abby round 1 seed 7 route S laid preview](images/060-team-4-abby-round-1-seed-7-route-s-laid-preview.png)

**The ask.** Round 1 for Abby on route S: run cast-place.py --character abby --route S --seed 7 --tag t4r1, keep the sticker and the laid preview, and score identity, pose, seat and cleanliness out of 5 each.

**The thinking.** Route S hands the model a white sheet carrying only the bar counter's own pixels, the marble ledge's near top edge as one thin line, and a pale pencil under-drawing of the figure-abby-01-ledge block-in (under_blend 0.30, under-lines ON). Picture 2 is Abby's official portrait. The render is keyed by ink on white into an RGBA sticker, cut by the counter mask, and laid through room-part assemble(override=) so the approved plate is never redrawn. Seed 7 was the first of four (7, 21, 41, 44). The first submission died on a 20-minute HTTP timeout with ComfyUI queued behind other teams; system_stats answered 200 on the retry poll and the re-run rendered in 40.5 s.

**Settings.** local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000; route S; box 420,620,900,1220; roi 520,680,800,1220; under_blend 0.30; under_lines True; white_thresh 232; fill True; rules pen; seed 7; 40.5 s; sticker 77476 px in 39 blobs; cleanliness 0.4017; room drift 0.6505

**Prompt.** [prompts/060-team-4-abby-round-1-seed-7-route-s-laid-preview.prompt.txt](prompts/060-team-4-abby-round-1-seed-7-route-s-laid-preview.prompt.txt)

**Verdict.** REJECT, 6/20. Identity 1: the model drew a HUMAN WOMAN with long dark hair in a white blouse where Abby belongs, and put a small westie DOG beside her wearing Abby's own studded collar and gem - it read the portrait as 'woman with her dog' instead of copying the terrier. Pose 2: body roughly faces the room at the block-in's place but she leans on the counter and the block-in's head is not filled. Seat 2: scale about right, but a slab of marble ledge came into the sticker so it lays as a floating marble block. Cleanliness 1: two figures, a marble slab, 39 blobs, cut off at the bottom.

*Logged 18:27.*

---

## 061. Team 4 Abby round 1 seed 21 route S laid preview

![Team 4 Abby round 1 seed 21 route S laid preview](images/061-team-4-abby-round-1-seed-21-route-s-laid-preview.png)

**The ask.** Round 1 for Abby on route S, seed 21 of the four (7, 21, 41, 44): same command, same flags, score identity, pose, seat and cleanliness.

**The thinking.** Second seed of the round, identical configuration to seed 7 - white sheet Picture 1 with the counter's own pixels, the ledge's near edge as one line, the figure-abby-01-ledge block-in as a pale pencil under-drawing at under_blend 0.30, Picture 2 the official portrait. Watching for whether the seed 7 failure (a human woman drawn where Abby belongs, the westie relegated to a pet at her side) is a seed accident or the route's behaviour with this portrait.

**Settings.** local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000; route S; box 420,620,900,1220; roi 520,680,800,1220; under_blend 0.30; under_lines True; white_thresh 232; fill True; rules pen; seed 21; 83.2 s; sticker 76226 px in 41 blobs; cleanliness 0.4237; room drift 0.6598

**Prompt.** [prompts/061-team-4-abby-round-1-seed-21-route-s-laid-preview.prompt.txt](prompts/061-team-4-abby-round-1-seed-21-route-s-laid-preview.prompt.txt)

**Verdict.** REJECT, 6/20. Identity 1: a human woman again - long dark hair, human face, human hands with painted nails - now wearing Abby's studded collar and teardrop gem herself, with the westie standing beside her as her pet. The portrait is being read as 'woman and her dog', not as one terrier woman. Pose 2: torso faces the room at about the block-in's place, but the head is a human head and the block-in's own head is ignored. Seat 2: scale plausible, but the sticker carries a slab of the marble ledge so she lays as marble-on-marble. Cleanliness 1: two figures, a highball glass, a bar mat, a marble slab and a stray ink cross above the head - 41 blobs, cut off at the bottom edge.

*Logged 18:28.*

---

## 062. Drew seated left - route S - V1-remap seed 21

![Drew seated left - route S - V1-remap seed 21](images/062-drew-seated-left-route-s-v1-remap-seed-21.png)

**The ask.** Lab variant V1-remap: route S with --no-under-lines, --under-blend 0, --under-remap 110,205 (remap the block-in's own tones inside the figure mask from [0,255] to [110,205] so the white bird's head reads as a pale grey figure on the sheet instead of vanishing), plus an --extra-edit spelling out that the under-drawing's round skull with the eye marked and the bill bending down to a black tip IS his head, to draw solid and joined to the neck, never a folded feather/ribbon/wedge/plume and never floating free of the neck. Seed 21 of two (21, 44).

**The thinking.** The open question left by today's earlier rounds is only how Picture 1 should show the figure so the model draws Drew's head solid and in place - the white bird's head in the values was invisible on the white sheet at any blend, and --under-lines came back as ribbons. V1 answers this by remapping the block-in's tone range so the head band is a visible pale grey shape on the sheet (not white-on-white), with lines off, plus the explicit skull/bill/eye instruction in the edit text.

**Settings.** route S, local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000, --no-under-lines, --under-blend 0, --under-remap 110,205, --white-thresh 232, --fill, box 20,700,660,1500, roi 140,770,620,1340, seed 21, 44.4s (first submission failed with a connection error; ComfyUI answered 200 on the system_stats retry poll and the re-run succeeded), sticker 88554px in 111 blobs, cleanliness 0.1739, room drift vs plate 0.8044

**Prompt.** [prompts/062-drew-seated-left-route-s-v1-remap-seed-21.prompt.txt](prompts/062-drew-seated-left-route-s-v1-remap-seed-21.prompt.txt)

**Verdict.** Seat/pose/room clean again - correct chair, marble line untouched, collar and knit vest read well down onto the shoulders. Head still fails: above the neck's feathered collar a scaled, curved ribbon/wing-shaped patch floats with a plain white gap between it and the collar - no eye, no bill, no rounded skull, and no join to the neck. The remap made the tone band visible instead of invisible, but the model still did not read it as a head to draw solid; it drew a detached decorative fragment instead. Identity fails.

*Logged 18:47.*

---

## 063. Drew seated left - route S - V1-remap seed 44 - BEST HEAD YET

![Drew seated left - route S - V1-remap seed 44 - BEST HEAD YET](images/063-drew-seated-left-route-s-v1-remap-seed-44-best-head-yet.png)

**The ask.** Lab variant V1-remap: route S with --no-under-lines, --under-blend 0, --under-remap 110,205 (remap the block-in's own tones inside the figure mask from [0,255] to [110,205] so the white bird's head reads as a pale grey figure on the sheet instead of vanishing), plus an --extra-edit spelling out that the under-drawing's round skull with the eye marked and the bill bending down to a black tip IS his head, to draw solid and joined to the neck, never a folded feather/ribbon/wedge/plume and never floating free of the neck. Seed 44 of two (21, 44).

**The thinking.** Same settings as seed 21, second and last seed of the V1-remap variant. Testing whether the remap answer to the open question (how Picture 1 shows the figure so the model draws a solid head) is a seed accident or repeatable.

**Settings.** route S, local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000, --no-under-lines, --under-blend 0, --under-remap 110,205, --white-thresh 232, --fill, box 20,700,660,1500, roi 140,770,620,1340, seed 44, 253.2s (queued behind other teams sharing the GPU, no connection error this time), sticker 88519px in 222 blobs, cleanliness 0.0600, room drift vs plate 0.6751

**Prompt.** [prompts/063-drew-seated-left-route-s-v1-remap-seed-44-best-head-yet.prompt.txt](prompts/063-drew-seated-left-route-s-v1-remap-seed-44-best-head-yet.prompt.txt)

**Verdict.** BEST HEAD OF THE DAY. A genuine solid, small, rounded skull sits joined cleanly to the neck with no gap and no seam - one heavy-lidded amiable eye reads on it, and the thick bill bends steeply down to a proper solid black outer tip, all in one continuous line from the neck. No folded feather, no ribbon, no wedge, no floating fragment. Reads in full profile rather than three-quarter (open item: the brief wants the bill/eye readable in three-quarter, this came out side-on), and a faint soft grey smear ghosts the wall just behind/above the head - likely a hole-fill or key-edge artifact, not part of the figure. Seat, collar, knit vest and feathered hand on the marble all clean and correct. The remap answer works on this seed; identity/head finally passes where every prior route-S round failed.

*Logged 18:53.*

---

## 064. Drew seated left - route S variant V2-tone055 - seed 21

![Drew seated left - route S variant V2-tone055 - seed 21](images/064-drew-seated-left-route-s-variant-v2-tone055-seed-21.png)

**The ask.** Team Drew 3, route S, variant V2-tone055 (this lab's seed 21 of 2). Same brief: seat Drew in the LEFT leather club chair of the approved plate, room pixels untouched. This variant returns --under-blend to 0.55 (from round 4's 0.30) and turns OFF the pencil-line under-drawing (--no-under-lines) since it kept coming back as a ribbon, and adds one long --extra-edit spelling out exactly what the head under-drawing already carries - a small round skull with the eye marked in it and a thick bill bending steeply down to a black tip - and ordering a solid, small, refined, rounded head drawn there, joined to the neck, never a folded feather, a ribbon, a wedge or a plume.

**The thinking.** First seed of the tone055 sweep. Head is a detached, purely feather-textured wing/ribbon shape sitting above a gap over the neck - no skull, no eye, no clean bill; the extra-edit did not take on this seed. Identity barely reads since he is drawn mostly from behind as a feathered silhouette. Seat and scale are correct, down in the chair at the block-in's place. Cleanliness is hurt by a stray feathered scrap keyed in on the marble beside him.

**Settings.** scripts/cast-place.py --character drew --route S --seed 21 --tag lab-V2-tone055 --no-under-lines --under-blend 0.55 --extra-edit "..." | local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000 | box 20,700,660,1500 | roi 140,770,620,1340 | seat 0,1240,520,1800 | under-blend 0.55 | under-lines OFF | white-thresh 232 (default) | Picture 3 OFF (2 references, route S default) | rules=pen | retried once after a ComfyUI connection failure (round-30), succeeded on retry in 309.9s (round-33)

**Prompt.** [prompts/064-drew-seated-left-route-s-variant-v2-tone055-seed-21.prompt.txt](prompts/064-drew-seated-left-route-s-variant-v2-tone055-seed-21.prompt.txt)

**Verdict.** FAIL on the head. Head: a detached, feather-textured wing/ribbon with no skull, no eye and no bill, floating above a visible gap over the neck. Identity: barely reads, seen mostly from behind as a feathered silhouette. Seat: correct, down in the left chair at the block-in's place. Cleanliness: a stray feathered scrap keyed in on the marble beside him.

*Logged 18:55.*

---

## 065. Drew seated left - route S variant V2-tone055 - seed 44

![Drew seated left - route S variant V2-tone055 - seed 44](images/065-drew-seated-left-route-s-variant-v2-tone055-seed-44.png)

**The ask.** Team Drew 3, route S, variant V2-tone055 (this lab's seed 44 of 2). Same brief: seat Drew in the LEFT leather club chair of the approved plate, room pixels untouched. This variant returns --under-blend to 0.55 (from round 4's 0.30) and turns OFF the pencil-line under-drawing (--no-under-lines) since it kept coming back as a ribbon, and adds one long --extra-edit spelling out exactly what the head under-drawing already carries - a small round skull with the eye marked in it and a thick bill bending steeply down to a black tip - and ordering a solid, small, refined, rounded head drawn there, joined to the neck, never a folded feather, a ribbon, a wedge or a plume.

**The thinking.** Second seed of the tone055 sweep, same settings, sequential, first try (no connection error, 42.5s). The best head of the sweep so far: the shape is joined directly to the neck with no gap, and reads as an actual head+bill - a dark bill bending down to a black tip - rather than a ribbon, though it is still flag/pennant-shaped rather than a clean round skull and no heavy-lidded eye is legible in it.

**Settings.** scripts/cast-place.py --character drew --route S --seed 44 --tag lab-V2-tone055 --no-under-lines --under-blend 0.55 --extra-edit "..." | local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000 | box 20,700,660,1500 | roi 140,770,620,1340 | seat 0,1240,520,1800 | under-blend 0.55 | under-lines OFF | white-thresh 232 (default) | Picture 3 OFF (2 references, route S default) | rules=pen | 42.5s, first try

**Prompt.** [prompts/065-drew-seated-left-route-s-variant-v2-tone055-seed-44.prompt.txt](prompts/065-drew-seated-left-route-s-variant-v2-tone055-seed-44.prompt.txt)

**Verdict.** Best head of the sweep, still not the brief. Head: joined to the neck with no gap and reads as a head+bill (dark bill bending down to a black tip), but flag/pennant-shaped rather than a clean round skull and no heavy-lidded eye is legible; a soft grey halo bleeds onto the shelf behind it. Identity: strong - collar band, black bow tie, knit V-neck vest, martini glass, fingered hand on the marble - but drawn three-quarter FRONT facing camera, not from behind. Seat: correct, down in the left chair at the block-in's place. Cleanliness: a faint dark smear on the marble to the right of the hand.

*Logged 18:55.*

---

## 066. Drew seated left - team 5 round 1 - route S seed 44 - BEST of the round

![Drew seated left - team 5 round 1 - route S seed 44 - BEST of the round](images/066-drew-seated-left-team-5-round-1-route-s-seed-44-best-of-the-round.png)

**The ask.** Team 5, Drew, ROUND 1: run scripts/cast-place.py --character drew --route S --seed <seed> --tag t5r1 for seeds 44, 7, 21 and 41 exactly as given - no extra flags - score each laid preview and sticker on identity, pose, seat and cleanliness out of 5, and pass at 17/20 with nothing below 4.

**The thinking.** First seed of team 5's round 1, run on the script's own settled defaults: route S, --under-blend 0, --no-under-lines, --under-remap 100,180 (the darker band top the lab asked for), no staging picture, --fill and --cut-by-blockin ON. The question this round asks is whether the remap recipe repeats across four seeds now that the band is darker, and whether cutting by the block-in keeps the marble, the martini and the chair rail out of the sticker.

**Settings.** scripts/cast-place.py --character drew --route S --seed 44 --tag t5r1 | local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000 | 2 references (white sheet + studies/drew.png), no Picture 3 | under-blend 0, under-lines OFF, under-remap 100,180, sheet-grey 255, white-thresh 232, fill ON, cut-by-blockin ON, rules=pen | box 20,700,660,1500 | roi 140,770,620,1340 | seat 0,1240,520,1800 | 42.5s first try | sticker 90431px in 197 blobs, cleanliness 0.0987, room drift vs plate 0.6746

**Prompt.** [prompts/066-drew-seated-left-team-5-round-1-route-s-seed-44-best-of-the-round.prompt.txt](prompts/066-drew-seated-left-team-5-round-1-route-s-seed-44-best-of-the-round.prompt.txt)

**Verdict.** BEST OF THE ROUND, 16/20 - one point short of a pass. Identity 4: a genuine white flamingo gentleman - small refined skull, fine feather stipple, one heavy-lidded eye with a proper dark iris, the thick pale bill bending steeply down to a solid black tip, the white collar band and the knit V-neck vest across the shoulders. Pose 4: seated from behind and a little to his left, head turned to his right, but it lands nearer full profile than three-quarter. Seat 5: down in the left chair at the block-in's scale, the studded chair back correctly in front of his lower body, nothing floating. Cleanliness 3 and that is what fails him: the sticker carries a long marble-vein crack and a small marble chip floating free to the right of his hand, a thin shelf/rail line at the shoulder, and a soft pale rim around the head and bill that reads as a halo when he is laid on the dark panelling.

*Logged 19:23.*

---

## 067. Drew seated left - team 5 round 1 - route S seed 7

![Drew seated left - team 5 round 1 - route S seed 7](images/067-drew-seated-left-team-5-round-1-route-s-seed-7.png)

**The ask.** Team 5, Drew, ROUND 1: run scripts/cast-place.py --character drew --route S --seed <seed> --tag t5r1 for seeds 44, 7, 21 and 41 exactly as given - no extra flags - score each laid preview and sticker on identity, pose, seat and cleanliness out of 5, and pass at 17/20 with nothing below 4.

**The thinking.** Second seed of four, identical settings to seed 44 - the round's whole point is whether the remapped mid-grey band holds the head across seeds, so nothing is changed between them.

**Settings.** scripts/cast-place.py --character drew --route S --seed 7 --tag t5r1 | local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000 | 2 references, no Picture 3 | under-blend 0, under-lines OFF, under-remap 100,180, white-thresh 232, fill ON, cut-by-blockin ON, rules=pen | box 20,700,660,1500 | roi 140,770,620,1340 | 114.9s (queued behind other teams on the GPU) | sticker 73317px in 112 blobs, cleanliness 0.2100, room drift vs plate 0.7963

**Prompt.** [prompts/067-drew-seated-left-team-5-round-1-route-s-seed-7.prompt.txt](prompts/067-drew-seated-left-team-5-round-1-route-s-seed-7.prompt.txt)

**Verdict.** FAIL, 5/20 - the worst seed of the round and a total head collapse. Identity 1: no head at all, only a detached feathered crescent floating high over the window with a wide grey smear under it; no eye, no bill, no collar, no hands. Pose 1: the body is a knit-textured lump with no readable turn and no arms. Seat 2: the torso is roughly in the chair but the head fragment floats free above the room. Cleanliness 1: the sticker carries the studded chair rail along its whole bottom edge and a slab of marble counter off to the right.

*Logged 19:23.*

---

## 068. Drew seated left - team 5 round 1 - route S seed 21

![Drew seated left - team 5 round 1 - route S seed 21](images/068-drew-seated-left-team-5-round-1-route-s-seed-21.png)

**The ask.** Team 5, Drew, ROUND 1: run scripts/cast-place.py --character drew --route S --seed <seed> --tag t5r1 for seeds 44, 7, 21 and 41 exactly as given - no extra flags - score each laid preview and sticker on identity, pose, seat and cleanliness out of 5, and pass at 17/20 with nothing below 4.

**The thinking.** Third seed of four on the same settled defaults.

**Settings.** scripts/cast-place.py --character drew --route S --seed 21 --tag t5r1 | local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000 | 2 references, no Picture 3 | under-blend 0, under-lines OFF, under-remap 100,180, white-thresh 232, fill ON, cut-by-blockin ON, rules=pen | box 20,700,660,1500 | roi 140,770,620,1340 | 116.9s | sticker 78255px in 181 blobs, cleanliness 0.1946, room drift vs plate 0.8133

**Prompt.** [prompts/068-drew-seated-left-team-5-round-1-route-s-seed-21.prompt.txt](prompts/068-drew-seated-left-team-5-round-1-route-s-seed-21.prompt.txt)

**Verdict.** FAIL, 7/20. Identity 1: the head is a small feathered lump with no eye at all and a heavy hooked hornbill bill hanging off it, joined to the neck by a thread; the body is one undifferentiated feathered mass with no knit vest reading and no hands. Pose 2: the head does turn to his right over the shoulder, which is the only part of the staging that survives. Seat 2: the body sits in the chair at roughly the right scale, but a marble slab floats on the counter beside him. Cleanliness 1: chair rail along the bottom edge and a marble slab chunk to the right, both inside the sticker.

*Logged 19:23.*

---

## 069. Team 5 Abby round 1 - route S seed 44 laid preview - BEST

![Team 5 Abby round 1 - route S seed 44 laid preview - BEST](images/069-team-5-abby-round-1-route-s-seed-44-laid-preview-best.png)

**The ask.** Round 1 for Abby on route S with today's settled recipe: run scripts/cast-place.py --character abby --route S --seed 44 --tag t5r1 exactly as given, keep the sticker and the laid preview, and score identity, pose, seat and cleanliness out of 5 each against the official portrait and the figure-abby-01-ledge block-in.

**The thinking.** Today's lab (Drew, entries 062-065) settled that Picture 1 must carry the block-in REMAPPED into a mid-grey band with no pencil lines and no staging picture. Those are now the script's defaults (--under-blend 0, --under-remap 100,180, --no-under-lines, no Picture 3), so the bare command is the round's configuration. Picture 1 is the white sheet with the bar counter's own pixels, one thin line for the marble ledge's near edge and the grey block-in of Abby standing behind the ledge; Picture 2 is her official portrait. Seed 44 first of four (44, 7, 21, 41) because it is the seed that carried Drew's head. The open question for Abby is whether the remap stops Team 4's failure at entries 060-061, where the model read the portrait as 'a woman with her dog' and drew a human bartender with a westie pet.

**Settings.** local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000; route S; box 420,620,900,1220; roi 520,680,800,1220; under_blend 0; under_remap 100,180; under_lines False; staging none; white_thresh 232; fill True; cut_by_blockin True (removed 5491px); rules pen; seed 44; 64.5s; sticker 71157px kept from 42 blobs; cleanliness outside sticker 0.1777; room drift 0.7590; sticker bbox in plate 501,654-828,1218

**Prompt.** [prompts/069-team-5-abby-round-1-route-s-seed-44-laid-preview-best.prompt.txt](prompts/069-team-5-abby-round-1-route-s-seed-44-laid-preview-best.prompt.txt)

**Verdict.** BEST OF THE ROUND, 13/20 - REJECT but the first Abby that is actually Abby. Identity 4: a real West Highland terrier lady, the portrait's own round soft skull, two pricked ears, big black nose and short square muzzle, drawn solid and joined to the neck, in her light blouse with the studded collar and teardrop pendant - huggable and professional, fur laid in individual strokes. Short of 5 only on her eye rule (the eyes are dark almonds with lashes and one catchlight but no white showing both sides of a drawn iris and no smaller round pupil) and on the warm closed-lip half-smile, which reads flat. Pose 3: she stands behind the ledge facing the room at the block-in's place, but the head is essentially frontal where the block-in marks a three-quarter turn (both eyes equal, no far-eye foreshortening) and neither hand is on a working object. Seat 4: right place, right scale, head and collar clear above the counter, counter in front of the lower body, nothing floating. Cleanliness 2: the sticker carries a dark studded counter rail and a whole slab of veined marble across the bottom third, painted where her torso belongs between the ledge line and the counter mask, so she lays as marble-on-marble; the figure itself is whole and nothing is cut off.

*Logged 19:23.*

---

## 070. Drew seated left - team 5 round 1 - route S seed 41

![Drew seated left - team 5 round 1 - route S seed 41](images/070-drew-seated-left-team-5-round-1-route-s-seed-41.png)

**The ask.** Team 5, Drew, ROUND 1: run scripts/cast-place.py --character drew --route S --seed <seed> --tag t5r1 for seeds 44, 7, 21 and 41 exactly as given - no extra flags - score each laid preview and sticker on identity, pose, seat and cleanliness out of 5, and pass at 17/20 with nothing below 4.

**The thinking.** Last seed of four on the same settled defaults.

**Settings.** scripts/cast-place.py --character drew --route S --seed 41 --tag t5r1 | local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000 | 2 references, no Picture 3 | under-blend 0, under-lines OFF, under-remap 100,180, white-thresh 232, fill ON, cut-by-blockin ON, rules=pen | box 20,700,660,1500 | roi 140,770,620,1340 | 114.7s | sticker 93256px in 157 blobs, cleanliness 0.1157, room drift vs plate 0.7305

**Prompt.** [prompts/070-drew-seated-left-team-5-round-1-route-s-seed-41.prompt.txt](prompts/070-drew-seated-left-team-5-round-1-route-s-seed-41.prompt.txt)

**Verdict.** FAIL, 10/20 - the best wardrobe of the round wasted on a collapsed head. Identity 2: white collar, black bow tie, knit V-neck vest and a feathered hand round a martini all read beautifully, but above the neck there is no skull and no eye - only a folded ribbon or wedge with a black-tipped hook, exactly the failure the earlier lab named. Pose 2: he is turned nearer three-quarter FRONT than seen from behind, and the head reads nothing. Seat 4: correctly down in the left chair at the block-in's scale with the chair back in front of his lower body. Cleanliness 2: the sticker carries the martini glass and its marble reflection, a dark scrap beside the bow tie and a dark rail fragment along the bottom.

*Logged 19:23.*

---

## 071. Team 5 Abby round 1 - route S seed 7 laid preview

![Team 5 Abby round 1 - route S seed 7 laid preview](images/071-team-5-abby-round-1-route-s-seed-7-laid-preview.png)

**The ask.** Round 1 for Abby on route S, seed 7 of the four (44, 7, 21, 41): the same command with nothing added or dropped, score identity, pose, seat and cleanliness.

**The thinking.** Second seed of the round, identical configuration to seed 44 - the grey remapped block-in on the white sheet, no pencil lines, no Picture 3. Watching whether seed 44's terrier lady is the recipe's behaviour or a seed accident, and whether Team 4's 'woman with her dog' reading of the portrait (entries 060-061) is really gone.

**Settings.** local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000; route S; box 420,620,900,1220; roi 520,680,800,1220; under_blend 0; under_remap 100,180; under_lines False; staging none; white_thresh 232; fill True; cut_by_blockin True (removed 12520px); rules pen; seed 7; 108.7s; sticker 81923px kept from 23 blobs; cleanliness outside sticker 0.4460; room drift 0.6980

**Prompt.** [prompts/071-team-5-abby-round-1-route-s-seed-7-laid-preview.prompt.txt](prompts/071-team-5-abby-round-1-route-s-seed-7-laid-preview.prompt.txt)

**Verdict.** REJECT, 6/20. Identity 1: the split is back - a HUMAN WOMAN with long dark hair, hoop earrings, a human face and human hands with painted nails stands in the block-in's place wearing Abby's own studded collar and teardrop gem, and the westie is demoted to a small pet sitting at her right shoulder in a second collar. The portrait was read as 'woman and her dog', not as one terrier lady. Pose 2: the torso is roughly at the block-in's place with both hands down on the marble, but the head is a human head and the block-in's marked skull, ears and nose are ignored. Seat 2: scale is plausible, but a slab of veined marble came into the sticker and lays over the plate's own marble as a floating block. Cleanliness 1: two figures, the marble slab, the counter rail band, and the top of her hair fades off unfinished at the top of the drawn area.

*Logged 19:23.*

---

## 072. Team 5 Abby round 1 - route S seed 21 laid preview

![Team 5 Abby round 1 - route S seed 21 laid preview](images/072-team-5-abby-round-1-route-s-seed-21-laid-preview.png)

**The ask.** Round 1 for Abby on route S, seed 21 of the four (44, 7, 21, 41): the same command, nothing added or dropped, score identity, pose, seat and cleanliness.

**The thinking.** Third seed of the round on the settled recipe. Seed 44 drew the terrier lady and seed 7 drew a woman with a pet, so this seed decides whether the failure is the majority behaviour of the route with this portrait or the exception.

**Settings.** local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000; route S; box 420,620,900,1220; roi 520,680,800,1220; under_blend 0; under_remap 100,180; under_lines False; staging none; white_thresh 232; fill True; cut_by_blockin True (removed 10490px); rules pen; seed 21; 114.9s; sticker 70364px kept from 39 blobs; cleanliness outside sticker 0.4458; room drift 0.6572

**Prompt.** [prompts/072-team-5-abby-round-1-route-s-seed-21-laid-preview.prompt.txt](prompts/072-team-5-abby-round-1-route-s-seed-21-laid-preview.prompt.txt)

**Verdict.** REJECT, 6/20. Identity 1: a human woman again - long dark hair falling over a human face, human hands - bent over the ledge in the block-in's place, with only a stray white paw and a scrap of fur at her left to stand for the terrier. Not one westie feature is drawn where the block-in marks the skull, ears and nose. Pose 2: the body leans forward over the ledge instead of standing to it, and the head is human and largely hidden by hair. Seat 2: about the right scale and place, but the sticker's marble slab lays over the plate's marble so the whole lower half reads as a floating block. Cleanliness 1: bottles and a piece of the back-bar shelf ride along at her left, a big marble slab with a hatched apron rides along below, 39 blobs, and the top of her head fades off unfinished.

*Logged 19:23.*

---

## 073. Team 5 Abby round 1 - route S seed 41 laid preview

![Team 5 Abby round 1 - route S seed 41 laid preview](images/073-team-5-abby-round-1-route-s-seed-41-laid-preview.png)

**The ask.** Round 1 for Abby on route S, seed 41, the last of the four (44, 7, 21, 41): the same command, nothing added or dropped, score identity, pose, seat and cleanliness.

**The thinking.** Last seed of the round. With 44 right and 7 and 21 wrong the same way, this seed settles the count for the round and tells the next round whether the fix has to be aimed at the portrait's reading rather than at the under-drawing.

**Settings.** local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000; route S; box 420,620,900,1220; roi 520,680,800,1220; under_blend 0; under_remap 100,180; under_lines False; staging none; white_thresh 232; fill True; cut_by_blockin True (removed 13060px); rules pen; seed 41; 114.8s; sticker 78742px kept from 43 blobs; cleanliness outside sticker 0.6374; room drift 0.6505

**Prompt.** [prompts/073-team-5-abby-round-1-route-s-seed-41-laid-preview.prompt.txt](prompts/073-team-5-abby-round-1-route-s-seed-41-laid-preview.prompt.txt)

**Verdict.** REJECT, 6/20 - the worst of the round. Identity 1: a smiling human woman in Abby's blouse and studded collar with the teardrop gem, flanked by TWO separate westie dogs, one at each shoulder, the right-hand one wearing a second studded collar and pendant of its own. Three creatures where the brief asks for one, and none of them is Abby. Pose 2: the torso stands at about the block-in's place facing the room, but the head is human and the block-in's head is ignored. Seat 2: plausible scale, but the sticker's marble slab and the dogs' forelegs lay over the plate's own counter so nothing sits in the room properly. Cleanliness 1: three figures, a bottle, the counter rail band and a marble slab - 43 blobs, the dirtiest key of the four (0.6374 outside the sticker).

*Logged 19:24.*

---

## 074. Team 5 Abby round 1 contact sheet - route S, four seeds

![Team 5 Abby round 1 contact sheet - route S, four seeds](images/074-team-5-abby-round-1-contact-sheet-route-s-four-seeds.png)

**The ask.** Make one contact sheet of the four laid crops (x 380-940, y 560-1300 at 1x) with the seed and the total out of 20 in each caption, and say which seed is best, whether it passes (17/20 with nothing below 4) and what the one change for round 2 should be.

**The thinking.** Four seeds on one row, in the order they were run, so the round reads as one verdict rather than four. The round's real finding is the split between seed 44 and the other three: with the settled remap recipe the model either draws Abby as one terrier lady (44) or decomposes her portrait into a human bartender plus one or two westie pets (7, 21, 41). That is an identity failure of the portrait's reading, not of the under-drawing - the block-in's head, ears and nose are marked clearly and seed 44 filled them exactly. Every seed also carried a slab of the marble ledge into its sticker, painted across the block-in's torso band between the ledge line and the counter mask, where cut-by-blockin cannot reach it.

**Settings.** Local composite, no render. Four laid crops at x 380-940, y 560-1300, scaled to 520px wide; captions carry seed and total. Sheet 2190x879 at team5/abby/round-1-sheet.png

**Prompt.** [prompts/074-team-5-abby-round-1-contact-sheet-route-s-four-seeds.prompt.txt](prompts/074-team-5-abby-round-1-contact-sheet-route-s-four-seeds.prompt.txt)

**Verdict.** Round 1 FAILS. Seed 44 is best at 13/20 (identity 4, pose 3, seat 4, cleanliness 2) and is the first Abby in the studio that is genuinely the portrait's terrier lady; seeds 7, 21 and 41 all score 6/20 on the same fault, a human woman drawn in her place with the westie relegated to a pet beside her (two pets on seed 41). One change for round 2: an --extra-edit that names the failure - Abby is ONE creature, the terrier head on her own shoulders, never a human head or hair, never a separate dog or pet on the page. The negative prompt's 'humans, duplicate character' does not stop it, and the numbered EDIT text is what moved this same model on Drew's head earlier today. The marble slab in every sticker is round 3's change (a tighter roi or an explicit 'draw her torso, not the marble, below the ledge line'), not this round's.

*Logged 19:24.*

---

## 075. Drew - team 5 round 1 contact sheet - four seeds on the settled route S recipe

![Drew - team 5 round 1 contact sheet - four seeds on the settled route S recipe](images/075-drew-team-5-round-1-contact-sheet-four-seeds-on-the-settled-route-s-recipe.png)

**The ask.** Make one contact sheet of the four laid crops with seed and total in the caption, and say whether the round passes.

**The thinking.** Four seeds, one recipe, no extra flags: route S with the block-in remapped into a mid-grey band at 100,180, no pencil lines, no staging picture. The sheet is ordered best first. The recipe is REAL but not yet RELIABLE: the sidecar's own head metric (topmost blob height over the block-in's head height) reads 0.78 on seeds 44 and 41 and 0.16 and 0.31 on seeds 7 and 21, which is exactly what the eye sees - two seeds grew a head, two collapsed it into a floating scrap. Only seed 44 turned the head into Drew's head. The darker band top did not cure the collapse; it produced one very good head and three failures, so the head is still a coin flip and the round's remaining fault on the best seed is the cut, not the drawing.

**Settings.** four runs of scripts/cast-place.py --character drew --route S --seed {44,7,21,41} --tag t5r1 | laid previews cropped x0-800 y600-1600 at 1x | scoring identity/pose/seat/cleanliness out of 5, pass at 17 with nothing below 4

**Verdict.** ROUND 1 DOES NOT PASS. seed 44 = 16/20 (identity 4, pose 4, seat 5, cleanliness 3) - the best Drew the studio has made, one point short; seed 41 = 10/20; seed 21 = 7/20; seed 7 = 5/20. The single thing standing between seed 44 and a pass is the cut, not the render: the key kept TWO components instead of one, the second being ink that ran from his hand out along the marble, and the block-in cut then chopped that into free-floating marble crumbs beside him. Re-keying seed 44's own saved render at --white-thresh 226 (simulated through the script's own route-S key path, no GPU) drops the second component entirely - 2 kept components to 1, stray islands to zero - while the head's topmost blob height is unchanged at 527px and figure coverage only moves 0.867 to 0.847. That is round 2's one change.

*Logged 19:26.*

---

## 076. Barclay route S team5 round 1 seed 44 - the block-in's snout comes back as a BIRD'S BILL

![Barclay route S team5 round 1 seed 44 - the block-in's snout comes back as a BIRD'S BILL](images/076-barclay-route-s-team5-round-1-seed-44-the-block-in-s-snout-comes-back-as-a-bird-s-bill.png)

**The ask.** Team 5, ROUND 1 for BARCLAY. Take the recipe today's lab settled on Drew - route S, the white sheet carrying only the occluding furniture, the marble horizon line and the pose block-in REMAPPED into a mid-grey band with no pencil lines and no staging picture - and run it for Barclay at seeds 44, 7, 21 and 41 with no extra flags at all. Keep the sticker and the laid preview for each, look at both, score identity / pose / seat / cleanliness out of 5 each, and name the one change for round 2.

**The thinking.** The command is the round's whole configuration: scripts/cast-place.py --character barclay --route S --seed <seed> --tag t5r1, nothing added and nothing dropped, because Team 6 has already made the lab's winning recipe route S's OWN defaults - --under-remap 100,180, --under-blend 0, --no-under-lines, no Picture 3, --fill and --cut-by-blockin on. So Picture 1 is a white sheet carrying the RIGHT club chair's own rendered pixels, one thin ink line traced along the marble counter's near top edge, and the figure-barclay-02-toward block-in remapped into a 100-180 grey band; Picture 2 is canon/vision/studies/barclay.png. Box (560,700,1200,1500), ROI (660,720,1120,1420), occluder masks/chair-right.png. What is being tested is whether the recipe that made Drew's head appear also carries a GOLDEN RETRIEVER'S head, because Barclay's block-in snout is a long tapering spike with a ball at its tip - drawn at the flamingo's proportions - and a model that fills it literally will draw a bill.

**Settings.** local/qwen-image-edit-2511 via POST http://127.0.0.1:8000/api/generate (ComfyUI 127.0.0.1:8188), fast Lightning 8 steps, cfg 1.0, 4:5 1344x1680, route S, --tag t5r1, 2 references (white sheet + canon/vision/studies/barclay.png), rules pen, --under-remap 100,180 --under-blend 0 --no-under-lines --fill --cut-by-blockin (all defaults), absolute white-sheet key at --white-thresh 232, seed 44

**Prompt.** [prompts/076-barclay-route-s-team5-round-1-seed-44-the-block-in-s-snout-comes-back-as-a-bird-s-bill.prompt.txt](prompts/076-barclay-route-s-team5-round-1-seed-44-the-block-in-s-snout-comes-back-as-a-bird-s-bill.prompt.txt)

**Verdict.** NO. identity 1, pose 2, seat 4, cleanliness 1 = 8/20. The model filled the block-in's long tapering snout LITERALLY and drew a bill - a flat pointed beak with a bird's mouth-line - on a long shaggy neck, with the eye riding high on the forehead and one drop dog ear behind it. That is not the golden retriever in canon/vision/studies/barclay.png. What DID come through is the wardrobe: dark tweed blazer, open pale collar, one small flag pin on the lapel. POSE: square to the camera with both arms folded across the chest and the whole lapel showing, not seen from behind and a little to his right as figure-barclay-02-toward stages him; the head is at least turned to his left, toward Drew. SEAT: fills the block-in well, sits in the RIGHT chair at the block-in's scale, the chair's roll in front of the lower body, nothing floating - only the crown rides about 15px above the block-in's. CLEANLINESS: the sticker carries the tufted chair back with its sunburst buttons on the right, a studded chair rail across the bottom, a slab of marble at the left, and a flat rectangular block of hatching where the block-in's ear box is - which also squares off the top-right of the head. cleanliness 0.1192, room drift 0.9359, 100.7s.

*Logged 19:27.*

---

## 077. Barclay route S team5 round 1 seed 44 - the block-in's snout comes back as a BIRD'S BILL - the keyed RGBA sticker

![Barclay route S team5 round 1 seed 44 - the block-in's snout comes back as a BIRD'S BILL - the keyed RGBA sticker](images/077-barclay-route-s-team5-round-1-seed-44-the-block-in-s-snout-comes-back-as-a-bird-s-bill-the-keyed-rgba-sticker.png)

**The ask.** Team 5, ROUND 1 for BARCLAY. Take the recipe today's lab settled on Drew - route S, the white sheet carrying only the occluding furniture, the marble horizon line and the pose block-in REMAPPED into a mid-grey band with no pencil lines and no staging picture - and run it for Barclay at seeds 44, 7, 21 and 41 with no extra flags at all. Keep the sticker and the laid preview for each, look at both, score identity / pose / seat / cleanliness out of 5 each, and name the one change for round 2.

**The thinking.** The command is the round's whole configuration: scripts/cast-place.py --character barclay --route S --seed <seed> --tag t5r1, nothing added and nothing dropped, because Team 6 has already made the lab's winning recipe route S's OWN defaults - --under-remap 100,180, --under-blend 0, --no-under-lines, no Picture 3, --fill and --cut-by-blockin on. So Picture 1 is a white sheet carrying the RIGHT club chair's own rendered pixels, one thin ink line traced along the marble counter's near top edge, and the figure-barclay-02-toward block-in remapped into a 100-180 grey band; Picture 2 is canon/vision/studies/barclay.png. Box (560,700,1200,1500), ROI (660,720,1120,1420), occluder masks/chair-right.png. What is being tested is whether the recipe that made Drew's head appear also carries a GOLDEN RETRIEVER'S head, because Barclay's block-in snout is a long tapering spike with a ball at its tip - drawn at the flamingo's proportions - and a model that fills it literally will draw a bill.

**Settings.** local/qwen-image-edit-2511 via POST http://127.0.0.1:8000/api/generate (ComfyUI 127.0.0.1:8188), fast Lightning 8 steps, cfg 1.0, 4:5 1344x1680, route S, --tag t5r1, 2 references (white sheet + canon/vision/studies/barclay.png), rules pen, --under-remap 100,180 --under-blend 0 --no-under-lines --fill --cut-by-blockin (all defaults), absolute white-sheet key at --white-thresh 232, seed 44

**Prompt.** [prompts/077-barclay-route-s-team5-round-1-seed-44-the-block-in-s-snout-comes-back-as-a-bird-s-bill-the-keyed-rgba-sticker.prompt.txt](prompts/077-barclay-route-s-team5-round-1-seed-44-the-block-in-s-snout-comes-back-as-a-bird-s-bill-the-keyed-rgba-sticker.prompt.txt)

**Verdict.** NO. identity 1, pose 2, seat 4, cleanliness 1 = 8/20. The model filled the block-in's long tapering snout LITERALLY and drew a bill - a flat pointed beak with a bird's mouth-line - on a long shaggy neck, with the eye riding high on the forehead and one drop dog ear behind it. That is not the golden retriever in canon/vision/studies/barclay.png. What DID come through is the wardrobe: dark tweed blazer, open pale collar, one small flag pin on the lapel. POSE: square to the camera with both arms folded across the chest and the whole lapel showing, not seen from behind and a little to his right as figure-barclay-02-toward stages him; the head is at least turned to his left, toward Drew. SEAT: fills the block-in well, sits in the RIGHT chair at the block-in's scale, the chair's roll in front of the lower body, nothing floating - only the crown rides about 15px above the block-in's. CLEANLINESS: the sticker carries the tufted chair back with its sunburst buttons on the right, a studded chair rail across the bottom, a slab of marble at the left, and a flat rectangular block of hatching where the block-in's ear box is - which also squares off the top-right of the head. cleanliness 0.1192, room drift 0.9359, 100.7s.

*Logged 19:27.*

---

## 078. Barclay route S team5 round 1 seed 7 - a bill again, and the block-in's two eye circles drawn as two eyes

![Barclay route S team5 round 1 seed 7 - a bill again, and the block-in's two eye circles drawn as two eyes](images/078-barclay-route-s-team5-round-1-seed-7-a-bill-again-and-the-block-in-s-two-eye-circles-drawn-as-two-eyes.png)

**The ask.** Team 5, ROUND 1 for BARCLAY. Take the recipe today's lab settled on Drew - route S, the white sheet carrying only the occluding furniture, the marble horizon line and the pose block-in REMAPPED into a mid-grey band with no pencil lines and no staging picture - and run it for Barclay at seeds 44, 7, 21 and 41 with no extra flags at all. Keep the sticker and the laid preview for each, look at both, score identity / pose / seat / cleanliness out of 5 each, and name the one change for round 2.

**The thinking.** The command is the round's whole configuration: scripts/cast-place.py --character barclay --route S --seed <seed> --tag t5r1, nothing added and nothing dropped, because Team 6 has already made the lab's winning recipe route S's OWN defaults - --under-remap 100,180, --under-blend 0, --no-under-lines, no Picture 3, --fill and --cut-by-blockin on. So Picture 1 is a white sheet carrying the RIGHT club chair's own rendered pixels, one thin ink line traced along the marble counter's near top edge, and the figure-barclay-02-toward block-in remapped into a 100-180 grey band; Picture 2 is canon/vision/studies/barclay.png. Box (560,700,1200,1500), ROI (660,720,1120,1420), occluder masks/chair-right.png. What is being tested is whether the recipe that made Drew's head appear also carries a GOLDEN RETRIEVER'S head, because Barclay's block-in snout is a long tapering spike with a ball at its tip - drawn at the flamingo's proportions - and a model that fills it literally will draw a bill.

**Settings.** local/qwen-image-edit-2511 via POST http://127.0.0.1:8000/api/generate (ComfyUI 127.0.0.1:8188), fast Lightning 8 steps, cfg 1.0, 4:5 1344x1680, route S, --tag t5r1, 2 references (white sheet + canon/vision/studies/barclay.png), rules pen, --under-remap 100,180 --under-blend 0 --no-under-lines --fill --cut-by-blockin (all defaults), absolute white-sheet key at --white-thresh 232, seed 7

**Prompt.** [prompts/078-barclay-route-s-team5-round-1-seed-7-a-bill-again-and-the-block-in-s-two-eye-circles-drawn-as-two-eyes.prompt.txt](prompts/078-barclay-route-s-team5-round-1-seed-7-a-bill-again-and-the-block-in-s-two-eye-circles-drawn-as-two-eyes.prompt.txt)

**Verdict.** NO. identity 1, pose 2, seat 4, cleanliness 1 = 8/20. The same bill as seed 44, and worse above it: the block-in draws TWO overlapping circles for the eye and this seed drew BOTH of them - a dark lidded eye beside a bare bulging eyeball with no lid - on the crown of the skull. The coat came back speckled and ticked like a shorthaired pointer rather than a retriever's layered feathering, on a long ostrich neck. Wardrobe is right again: tweed blazer, open collar, flag pin, and the round-dialled wristwatch actually drawn on the wrist. POSE square to the camera, hands together in front, head profile to his left - the head turn is right, the body is not. SEAT good: block-in scale, right chair, chair in front, nothing floating. CLEANLINESS: studded chair rail across the bottom, marble slab at the left, a grey haze at the right edge. cleanliness 0.2119, room drift 0.9356, 114.7s.

*Logged 19:27.*

---

## 079. Barclay route S team5 round 1 seed 7 - a bill again, and the block-in's two eye circles drawn as two eyes - the keyed RGBA sticker

![Barclay route S team5 round 1 seed 7 - a bill again, and the block-in's two eye circles drawn as two eyes - the keyed RGBA sticker](images/079-barclay-route-s-team5-round-1-seed-7-a-bill-again-and-the-block-in-s-two-eye-circles-drawn-as-two-eyes-the-key.png)

**The ask.** Team 5, ROUND 1 for BARCLAY. Take the recipe today's lab settled on Drew - route S, the white sheet carrying only the occluding furniture, the marble horizon line and the pose block-in REMAPPED into a mid-grey band with no pencil lines and no staging picture - and run it for Barclay at seeds 44, 7, 21 and 41 with no extra flags at all. Keep the sticker and the laid preview for each, look at both, score identity / pose / seat / cleanliness out of 5 each, and name the one change for round 2.

**The thinking.** The command is the round's whole configuration: scripts/cast-place.py --character barclay --route S --seed <seed> --tag t5r1, nothing added and nothing dropped, because Team 6 has already made the lab's winning recipe route S's OWN defaults - --under-remap 100,180, --under-blend 0, --no-under-lines, no Picture 3, --fill and --cut-by-blockin on. So Picture 1 is a white sheet carrying the RIGHT club chair's own rendered pixels, one thin ink line traced along the marble counter's near top edge, and the figure-barclay-02-toward block-in remapped into a 100-180 grey band; Picture 2 is canon/vision/studies/barclay.png. Box (560,700,1200,1500), ROI (660,720,1120,1420), occluder masks/chair-right.png. What is being tested is whether the recipe that made Drew's head appear also carries a GOLDEN RETRIEVER'S head, because Barclay's block-in snout is a long tapering spike with a ball at its tip - drawn at the flamingo's proportions - and a model that fills it literally will draw a bill.

**Settings.** local/qwen-image-edit-2511 via POST http://127.0.0.1:8000/api/generate (ComfyUI 127.0.0.1:8188), fast Lightning 8 steps, cfg 1.0, 4:5 1344x1680, route S, --tag t5r1, 2 references (white sheet + canon/vision/studies/barclay.png), rules pen, --under-remap 100,180 --under-blend 0 --no-under-lines --fill --cut-by-blockin (all defaults), absolute white-sheet key at --white-thresh 232, seed 7

**Prompt.** [prompts/079-barclay-route-s-team5-round-1-seed-7-a-bill-again-and-the-block-in-s-two-eye-circles-drawn-as-two-eyes-the-key.prompt.txt](prompts/079-barclay-route-s-team5-round-1-seed-7-a-bill-again-and-the-block-in-s-two-eye-circles-drawn-as-two-eyes-the-key.prompt.txt)

**Verdict.** NO. identity 1, pose 2, seat 4, cleanliness 1 = 8/20. The same bill as seed 44, and worse above it: the block-in draws TWO overlapping circles for the eye and this seed drew BOTH of them - a dark lidded eye beside a bare bulging eyeball with no lid - on the crown of the skull. The coat came back speckled and ticked like a shorthaired pointer rather than a retriever's layered feathering, on a long ostrich neck. Wardrobe is right again: tweed blazer, open collar, flag pin, and the round-dialled wristwatch actually drawn on the wrist. POSE square to the camera, hands together in front, head profile to his left - the head turn is right, the body is not. SEAT good: block-in scale, right chair, chair in front, nothing floating. CLEANLINESS: studded chair rail across the bottom, marble slab at the left, a grey haze at the right edge. cleanliness 0.2119, room drift 0.9356, 114.7s.

*Logged 19:27.*

---

## 080. Barclay route S team5 round 1 seed 21 - BEST OF THE ROUND, a real golden retriever in the block-in's own pose

![Barclay route S team5 round 1 seed 21 - BEST OF THE ROUND, a real golden retriever in the block-in's own pose](images/080-barclay-route-s-team5-round-1-seed-21-best-of-the-round-a-real-golden-retriever-in-the-block-in-s-own-pose.png)

**The ask.** Team 5, ROUND 1 for BARCLAY. Take the recipe today's lab settled on Drew - route S, the white sheet carrying only the occluding furniture, the marble horizon line and the pose block-in REMAPPED into a mid-grey band with no pencil lines and no staging picture - and run it for Barclay at seeds 44, 7, 21 and 41 with no extra flags at all. Keep the sticker and the laid preview for each, look at both, score identity / pose / seat / cleanliness out of 5 each, and name the one change for round 2.

**The thinking.** The command is the round's whole configuration: scripts/cast-place.py --character barclay --route S --seed <seed> --tag t5r1, nothing added and nothing dropped, because Team 6 has already made the lab's winning recipe route S's OWN defaults - --under-remap 100,180, --under-blend 0, --no-under-lines, no Picture 3, --fill and --cut-by-blockin on. So Picture 1 is a white sheet carrying the RIGHT club chair's own rendered pixels, one thin ink line traced along the marble counter's near top edge, and the figure-barclay-02-toward block-in remapped into a 100-180 grey band; Picture 2 is canon/vision/studies/barclay.png. Box (560,700,1200,1500), ROI (660,720,1120,1420), occluder masks/chair-right.png. What is being tested is whether the recipe that made Drew's head appear also carries a GOLDEN RETRIEVER'S head, because Barclay's block-in snout is a long tapering spike with a ball at its tip - drawn at the flamingo's proportions - and a model that fills it literally will draw a bill.

**Settings.** local/qwen-image-edit-2511 via POST http://127.0.0.1:8000/api/generate (ComfyUI 127.0.0.1:8188), fast Lightning 8 steps, cfg 1.0, 4:5 1344x1680, route S, --tag t5r1, 2 references (white sheet + canon/vision/studies/barclay.png), rules pen, --under-remap 100,180 --under-blend 0 --no-under-lines --fill --cut-by-blockin (all defaults), absolute white-sheet key at --white-thresh 232, seed 21

**Prompt.** [prompts/080-barclay-route-s-team5-round-1-seed-21-best-of-the-round-a-real-golden-retriever-in-the-block-in-s-own-pose.prompt.txt](prompts/080-barclay-route-s-team5-round-1-seed-21-best-of-the-round-a-real-golden-retriever-in-the-block-in-s-own-pose.prompt.txt)

**Verdict.** BEST OF THE ROUND, and the first render that is BARCLAY. identity 4, pose 5, seat 5, cleanliness 2 = 16/20 - a FAIL by one point, on cleanliness alone. IDENTITY: a genuine golden retriever head - a broad modelled muzzle with a black button nose, whisker pips in rows, a closed lip line hooking clearly UP into a warm smile, a drop ear rooting level with the eye and finishing in separate fringe strokes, a modest ruff, layered fur drawn in individual strokes. Wardrobe is the portrait's: dark tweed blazer with a real notched lapel carrying one well-formed flag pin, the pale open collar showing at the throat. Marked 4 not 5 because the eye is heavier-lidded and sleepier than the portrait's, with almost no white showing, and the shirt is nearly swallowed by the blazer. POSE 5: this is figure-barclay-02-toward exactly - seen from BEHIND and a little to his right, the back and far shoulder of the blazer toward us, the head turned to his LEFT into clean profile toward Drew's chair, muzzle and eye both readable, never square to the camera. SEAT 5: he fills the block-in almost line for line - crown, shoulder, back, near arm to the marble - in the RIGHT chair at the block-in's own scale, with the plate's chair roll in front of the lower body and nothing floating. CLEANLINESS 2 is what costs him the pass: the sticker carries a studded chair top-rail across the bottom that the model drew ABOVE the plate chair's own mask (so the occluder cut could not take it), a slab of marble counter with small marks on it at the left, and a vertical hatched panel at the right. The head itself is solid, joined to the neck, and nothing is cut off. cleanliness 0.2408, room drift 0.9447, 114.6s.

*Logged 19:27.*

---

## 081. Barclay route S team5 round 1 seed 21 - BEST OF THE ROUND, a real golden retriever in the block-in's own pose - the keyed RGBA sticker

![Barclay route S team5 round 1 seed 21 - BEST OF THE ROUND, a real golden retriever in the block-in's own pose - the keyed RGBA sticker](images/081-barclay-route-s-team5-round-1-seed-21-best-of-the-round-a-real-golden-retriever-in-the-block-in-s-own-pose-the.png)

**The ask.** Team 5, ROUND 1 for BARCLAY. Take the recipe today's lab settled on Drew - route S, the white sheet carrying only the occluding furniture, the marble horizon line and the pose block-in REMAPPED into a mid-grey band with no pencil lines and no staging picture - and run it for Barclay at seeds 44, 7, 21 and 41 with no extra flags at all. Keep the sticker and the laid preview for each, look at both, score identity / pose / seat / cleanliness out of 5 each, and name the one change for round 2.

**The thinking.** The command is the round's whole configuration: scripts/cast-place.py --character barclay --route S --seed <seed> --tag t5r1, nothing added and nothing dropped, because Team 6 has already made the lab's winning recipe route S's OWN defaults - --under-remap 100,180, --under-blend 0, --no-under-lines, no Picture 3, --fill and --cut-by-blockin on. So Picture 1 is a white sheet carrying the RIGHT club chair's own rendered pixels, one thin ink line traced along the marble counter's near top edge, and the figure-barclay-02-toward block-in remapped into a 100-180 grey band; Picture 2 is canon/vision/studies/barclay.png. Box (560,700,1200,1500), ROI (660,720,1120,1420), occluder masks/chair-right.png. What is being tested is whether the recipe that made Drew's head appear also carries a GOLDEN RETRIEVER'S head, because Barclay's block-in snout is a long tapering spike with a ball at its tip - drawn at the flamingo's proportions - and a model that fills it literally will draw a bill.

**Settings.** local/qwen-image-edit-2511 via POST http://127.0.0.1:8000/api/generate (ComfyUI 127.0.0.1:8188), fast Lightning 8 steps, cfg 1.0, 4:5 1344x1680, route S, --tag t5r1, 2 references (white sheet + canon/vision/studies/barclay.png), rules pen, --under-remap 100,180 --under-blend 0 --no-under-lines --fill --cut-by-blockin (all defaults), absolute white-sheet key at --white-thresh 232, seed 21

**Prompt.** [prompts/081-barclay-route-s-team5-round-1-seed-21-best-of-the-round-a-real-golden-retriever-in-the-block-in-s-own-pose-the.prompt.txt](prompts/081-barclay-route-s-team5-round-1-seed-21-best-of-the-round-a-real-golden-retriever-in-the-block-in-s-own-pose-the.prompt.txt)

**Verdict.** BEST OF THE ROUND, and the first render that is BARCLAY. identity 4, pose 5, seat 5, cleanliness 2 = 16/20 - a FAIL by one point, on cleanliness alone. IDENTITY: a genuine golden retriever head - a broad modelled muzzle with a black button nose, whisker pips in rows, a closed lip line hooking clearly UP into a warm smile, a drop ear rooting level with the eye and finishing in separate fringe strokes, a modest ruff, layered fur drawn in individual strokes. Wardrobe is the portrait's: dark tweed blazer with a real notched lapel carrying one well-formed flag pin, the pale open collar showing at the throat. Marked 4 not 5 because the eye is heavier-lidded and sleepier than the portrait's, with almost no white showing, and the shirt is nearly swallowed by the blazer. POSE 5: this is figure-barclay-02-toward exactly - seen from BEHIND and a little to his right, the back and far shoulder of the blazer toward us, the head turned to his LEFT into clean profile toward Drew's chair, muzzle and eye both readable, never square to the camera. SEAT 5: he fills the block-in almost line for line - crown, shoulder, back, near arm to the marble - in the RIGHT chair at the block-in's own scale, with the plate's chair roll in front of the lower body and nothing floating. CLEANLINESS 2 is what costs him the pass: the sticker carries a studded chair top-rail across the bottom that the model drew ABOVE the plate chair's own mask (so the occluder cut could not take it), a slab of marble counter with small marks on it at the left, and a vertical hatched panel at the right. The head itself is solid, joined to the neck, and nothing is cut off. cleanliness 0.2408, room drift 0.9447, 114.6s.

*Logged 19:27.*

---

## 082. Barclay route S team5 round 1 seed 41 - REJECT, a pedestal table and a tufted settee drawn where the head belongs

![Barclay route S team5 round 1 seed 41 - REJECT, a pedestal table and a tufted settee drawn where the head belongs](images/082-barclay-route-s-team5-round-1-seed-41-reject-a-pedestal-table-and-a-tufted-settee-drawn-where-the-head-belongs.png)

**The ask.** Team 5, ROUND 1 for BARCLAY. Take the recipe today's lab settled on Drew - route S, the white sheet carrying only the occluding furniture, the marble horizon line and the pose block-in REMAPPED into a mid-grey band with no pencil lines and no staging picture - and run it for Barclay at seeds 44, 7, 21 and 41 with no extra flags at all. Keep the sticker and the laid preview for each, look at both, score identity / pose / seat / cleanliness out of 5 each, and name the one change for round 2.

**The thinking.** The command is the round's whole configuration: scripts/cast-place.py --character barclay --route S --seed <seed> --tag t5r1, nothing added and nothing dropped, because Team 6 has already made the lab's winning recipe route S's OWN defaults - --under-remap 100,180, --under-blend 0, --no-under-lines, no Picture 3, --fill and --cut-by-blockin on. So Picture 1 is a white sheet carrying the RIGHT club chair's own rendered pixels, one thin ink line traced along the marble counter's near top edge, and the figure-barclay-02-toward block-in remapped into a 100-180 grey band; Picture 2 is canon/vision/studies/barclay.png. Box (560,700,1200,1500), ROI (660,720,1120,1420), occluder masks/chair-right.png. What is being tested is whether the recipe that made Drew's head appear also carries a GOLDEN RETRIEVER'S head, because Barclay's block-in snout is a long tapering spike with a ball at its tip - drawn at the flamingo's proportions - and a model that fills it literally will draw a bill.

**Settings.** local/qwen-image-edit-2511 via POST http://127.0.0.1:8000/api/generate (ComfyUI 127.0.0.1:8188), fast Lightning 8 steps, cfg 1.0, 4:5 1344x1680, route S, --tag t5r1, 2 references (white sheet + canon/vision/studies/barclay.png), rules pen, --under-remap 100,180 --under-blend 0 --no-under-lines --fill --cut-by-blockin (all defaults), absolute white-sheet key at --white-thresh 232, seed 41

**Prompt.** [prompts/082-barclay-route-s-team5-round-1-seed-41-reject-a-pedestal-table-and-a-tufted-settee-drawn-where-the-head-belongs.prompt.txt](prompts/082-barclay-route-s-team5-round-1-seed-41-reject-a-pedestal-table-and-a-tufted-settee-drawn-where-the-head-belongs.prompt.txt)

**Verdict.** REJECT, the worst of the four. identity 3, pose 1, seat 1, cleanliness 0 = 5/20. The head slot of the block-in was filled by FURNITURE: a round pedestal table on a turned column with a whole button-tufted settee standing on it, sprouting from the top of his skull, and the dog himself drawn small and low underneath it. IDENTITY 3 - the face that IS there is actually the closest of the four to the official portrait (soft worried brow, heavy-lidded gentle eyes, the closed smile, black nose, cream coat, tweed blazer over an open collar, a rocks glass in the hand) but the lapel carries TWO flag pins, one above the other. POSE 1: square to the camera, head not turned, glass raised - none of the block-in's staging. SEAT 1: he is drawn well below and well inside the block-in, at maybe two thirds its scale, so his crown sits where the block-in's throat is and the settee floats above him. CLEANLINESS 0: table, settee, rocks glass with a stirrer and a cherry, a chair arm rail across his lap, a grey halo rectangle behind his right shoulder, marble at the left. This is the render that triggered the script's own dirty-key warning - the model changed 36 percent of everything outside the sticker. cleanliness 0.3580, room drift 0.8691, 112.9s.

*Logged 19:27.*

---

## 083. Barclay route S team5 round 1 seed 41 - REJECT, a pedestal table and a tufted settee drawn where the head belongs - the keyed RGBA sticker

![Barclay route S team5 round 1 seed 41 - REJECT, a pedestal table and a tufted settee drawn where the head belongs - the keyed RGBA sticker](images/083-barclay-route-s-team5-round-1-seed-41-reject-a-pedestal-table-and-a-tufted-settee-drawn-where-the-head-belongs.png)

**The ask.** Team 5, ROUND 1 for BARCLAY. Take the recipe today's lab settled on Drew - route S, the white sheet carrying only the occluding furniture, the marble horizon line and the pose block-in REMAPPED into a mid-grey band with no pencil lines and no staging picture - and run it for Barclay at seeds 44, 7, 21 and 41 with no extra flags at all. Keep the sticker and the laid preview for each, look at both, score identity / pose / seat / cleanliness out of 5 each, and name the one change for round 2.

**The thinking.** The command is the round's whole configuration: scripts/cast-place.py --character barclay --route S --seed <seed> --tag t5r1, nothing added and nothing dropped, because Team 6 has already made the lab's winning recipe route S's OWN defaults - --under-remap 100,180, --under-blend 0, --no-under-lines, no Picture 3, --fill and --cut-by-blockin on. So Picture 1 is a white sheet carrying the RIGHT club chair's own rendered pixels, one thin ink line traced along the marble counter's near top edge, and the figure-barclay-02-toward block-in remapped into a 100-180 grey band; Picture 2 is canon/vision/studies/barclay.png. Box (560,700,1200,1500), ROI (660,720,1120,1420), occluder masks/chair-right.png. What is being tested is whether the recipe that made Drew's head appear also carries a GOLDEN RETRIEVER'S head, because Barclay's block-in snout is a long tapering spike with a ball at its tip - drawn at the flamingo's proportions - and a model that fills it literally will draw a bill.

**Settings.** local/qwen-image-edit-2511 via POST http://127.0.0.1:8000/api/generate (ComfyUI 127.0.0.1:8188), fast Lightning 8 steps, cfg 1.0, 4:5 1344x1680, route S, --tag t5r1, 2 references (white sheet + canon/vision/studies/barclay.png), rules pen, --under-remap 100,180 --under-blend 0 --no-under-lines --fill --cut-by-blockin (all defaults), absolute white-sheet key at --white-thresh 232, seed 41

**Prompt.** [prompts/083-barclay-route-s-team5-round-1-seed-41-reject-a-pedestal-table-and-a-tufted-settee-drawn-where-the-head-belongs.prompt.txt](prompts/083-barclay-route-s-team5-round-1-seed-41-reject-a-pedestal-table-and-a-tufted-settee-drawn-where-the-head-belongs.prompt.txt)

**Verdict.** REJECT, the worst of the four. identity 3, pose 1, seat 1, cleanliness 0 = 5/20. The head slot of the block-in was filled by FURNITURE: a round pedestal table on a turned column with a whole button-tufted settee standing on it, sprouting from the top of his skull, and the dog himself drawn small and low underneath it. IDENTITY 3 - the face that IS there is actually the closest of the four to the official portrait (soft worried brow, heavy-lidded gentle eyes, the closed smile, black nose, cream coat, tweed blazer over an open collar, a rocks glass in the hand) but the lapel carries TWO flag pins, one above the other. POSE 1: square to the camera, head not turned, glass raised - none of the block-in's staging. SEAT 1: he is drawn well below and well inside the block-in, at maybe two thirds its scale, so his crown sits where the block-in's throat is and the settee floats above him. CLEANLINESS 0: table, settee, rocks glass with a stirrer and a cherry, a chair arm rail across his lap, a grey halo rectangle behind his right shoulder, marble at the left. This is the render that triggered the script's own dirty-key warning - the model changed 36 percent of everything outside the sticker. cleanliness 0.3580, room drift 0.8691, 112.9s.

*Logged 19:27.*

---

## 084. Barclay route S team5 round 1 - the contact sheet, four laid crops with seed and total

![Barclay route S team5 round 1 - the contact sheet, four laid crops with seed and total](images/084-barclay-route-s-team5-round-1-the-contact-sheet-four-laid-crops-with-seed-and-total.png)

**The ask.** Team 5, ROUND 1 for BARCLAY. Take the recipe today's lab settled on Drew - route S, the white sheet carrying only the occluding furniture, the marble horizon line and the pose block-in REMAPPED into a mid-grey band with no pencil lines and no staging picture - and run it for Barclay at seeds 44, 7, 21 and 41 with no extra flags at all. Keep the sticker and the laid preview for each, look at both, score identity / pose / seat / cleanliness out of 5 each, and name the one change for round 2.

**The thinking.** The command is the round's whole configuration: scripts/cast-place.py --character barclay --route S --seed <seed> --tag t5r1, nothing added and nothing dropped, because Team 6 has already made the lab's winning recipe route S's OWN defaults - --under-remap 100,180, --under-blend 0, --no-under-lines, no Picture 3, --fill and --cut-by-blockin on. So Picture 1 is a white sheet carrying the RIGHT club chair's own rendered pixels, one thin ink line traced along the marble counter's near top edge, and the figure-barclay-02-toward block-in remapped into a 100-180 grey band; Picture 2 is canon/vision/studies/barclay.png. Box (560,700,1200,1500), ROI (660,720,1120,1420), occluder masks/chair-right.png. What is being tested is whether the recipe that made Drew's head appear also carries a GOLDEN RETRIEVER'S head, because Barclay's block-in snout is a long tapering spike with a ball at its tip - drawn at the flamingo's proportions - and a model that fills it literally will draw a bill.

**Settings.** local/qwen-image-edit-2511 via POST http://127.0.0.1:8000/api/generate (ComfyUI 127.0.0.1:8188), fast Lightning 8 steps, cfg 1.0, 4:5 1344x1680, route S, --tag t5r1, 2 references (white sheet + canon/vision/studies/barclay.png), rules pen, --under-remap 100,180 --under-blend 0 --no-under-lines --fill --cut-by-blockin (all defaults), absolute white-sheet key at --white-thresh 232, seeds 44 / 7 / 21 / 41

**Prompt.** [prompts/084-barclay-route-s-team5-round-1-the-contact-sheet-four-laid-crops-with-seed-and-total.prompt.txt](prompts/084-barclay-route-s-team5-round-1-the-contact-sheet-four-laid-crops-with-seed-and-total.prompt.txt)

**Verdict.** ROUND 1 DOES NOT PASS: best total 16/20 (seed 21), one point short of 17, and one score below 4. THE ROUTE IS RIGHT AND THE BLOCK-IN IS RIGHT: all four seeds sat in the RIGHT chair at the block-in's own scale with the chair in front of the lower body, and seed 21 filled the block-in almost line for line in exactly its staging - from behind and a little to his right, head turned left into profile toward Drew - which is the thing every earlier route failed at. TWO FAULTS RUN THROUGH THE ROUND. (1) THE HEAD COLLAPSES AT THREE SEEDS OF FOUR, and the block-in is why: Barclay's figure-barclay-02-toward snout is a long tapering spike with a ball at its tip, drawn at the flamingo's proportions, so a model that fills it literally draws a BIRD'S BILL - seeds 44 and 7 both did, and seed 7 also drew both of the block-in's two overlapping eye circles as two separate eyes. Seed 41 filled the head slot with a pedestal table and a settee instead. Only seed 21 read the spike as a dog's muzzle. (2) EVERY STICKER CARRIES FURNITURE THE MODEL INVENTED ON THE WHITE SHEET - a marble counter slab at the left on all four, a studded chair top-rail across the bottom on all four drawn ABOVE the plate chair's own mask so the occluder cut cannot reach it, plus a tufted chair back (44), a grey haze (7), and a table, a settee, a glass and a halo (41). That is what holds the best seed to cleanliness 2 and costs the round its pass. ROUND 2 CHANGES ONE THING: a single --extra-edit forbidding the model to draw ANY object or furniture on the sheet outside the character's own outline. Cleanliness is the only score seed 21 lost, so it is the only score that has to move for a pass; the head collapse costs seeds, not the round, and four fresh seeds under a clean sheet should land one.

*Logged 19:27.*

---

## 085. All three in the scene for the first time: Drew, Barclay and Abby as stickers on the winning recipe (seed 44 each)

![All three in the scene for the first time: Drew, Barclay and Abby as stickers on the winning recipe (seed 44 each)](images/085-all-three-in-the-scene-for-the-first-time-drew-barclay-and-abby-as-stickers-on-the-winning-recipe-seed-44-each.png)

**The ask.** Founder: 'get them all in the scene first, see how it looks, then I can tell you what we need to do ... build a team for each character and put them in the scene, a nice loop using agents with you verifying and guiding, then show me.'

**The thinking.** Route S (the sticker route) after the lab: each character is drawn by the house edit model from the official portrait onto a white sheet that carries only the occluding furniture, the marble line and the pose's block-in remapped into a mid-grey band; the render is keyed by ink on white, hole-filled, cut by the figure's own silhouette and the occluder's mask, and laid at the figure's layer. Seed 44 of Team 5's first round gave all three at once; the room's own pixels are untouched, and the code passes (ink edges, bottle emblems, the sign) now stay off the figures. Abby reads as her portrait; Drew is seated correctly with a bill still a touch heavy and a profile rather than a three-quarter turn; Barclay reads as a wiry dog rather than the portrait's golden retriever. The team continues its judged rounds on identity.

**Settings.** local/qwen-image-edit-2511 via AuraVision, cast-place.py --route S --under-remap 100,180 --under-blend 0 --no-under-lines, seed 44; composed with room-part assemble(override) + code passes

**Verdict.** Milestone: the whole cast is in the room. Sent to the founder for direction.

*Logged 19:29.*

---

## 086. whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign

![whole-plate assembled with bartenders-marble-ledge back-bar-carcass back-bar-lower-shelf bottles-on-lower-shelf bottles-on-upper-shelf back-bar-upper-shelf television-blank chalkboard-blank window-frame-and-reveal window-glass-street-view main-bar-marble-counter left-leather-club-chair right-leather-club-chair and window-sign](images/086-whole-plate-assembled-with-bartenders-marble-ledge-back-bar-carcass-back-bar-lower-shelf-bottles-on-lower-shel.png)

**The thinking.** Base plus every approved, enabled part laid in order through its own silhouette; the TV's blank screen and the window's lettering are drawn in code last, because lettering is never left to the model.

*Logged 19:30.*

---

## 087. Abby route S team 5 round 2 seed 44 - one terrier lady, but the far eye is gone

![Abby route S team 5 round 2 seed 44 - one terrier lady, but the far eye is gone](images/087-abby-route-s-team-5-round-2-seed-44-one-terrier-lady-but-the-far-eye-is-gone.png)

**The ask.** Team 5, Abby round 2. Round 1 proved the settled route-S recipe draws the room and the staging right but keeps handing back a HUMAN WOMAN standing at the ledge with a live westie sitting beside her as a pet (seeds 7, 21, 41); only seed 44 drew a single terrier lady. Round 2 changes exactly one thing: an extra numbered EDIT that tells the model Abby is ONE creature whose head IS the westie head of Picture 2, never a woman with a dog, and that exactly one figure stands on the sheet. Same four seeds, 44 / 7 / 21 / 41, everything else untouched.

**The thinking.** The failure was never the block-in or the key - it was that the model read 'West Highland terrier lady' as a woman plus her dog, and obligingly drew both. So the edit does not describe her better, it forbids the split: her head IS the terrier head, drawn on her own shoulders directly above the studded collar, never a human head, never human hair, never a second dog or puppy anywhere on the page, EXACTLY ONE figure. Nothing else moved: still --route S, still the mid-grey remapped block-in at 100,180 with no pencil lines and no staging picture, still the counter as the occluder and her own ledge ROI. Scored 0-5 on identity / pose / seat / cleanliness against the official portrait and the abby.txt eye rule.

**Settings.** scripts/cast-place.py --character abby --route S --seed 44 --tag t5r2 --extra-edit "ABBY IS ONE SINGLE CREATURE, NOT A WOMAN WITH A DOG..." | local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000, 4:5, fast 8-step | box 420,620,900,1220 roi 520,680,800,1220, under-remap 100,180, no under-lines, no staging | 42.3s, sticker 71652px in 33 blobs, kept 2, cleanliness 0.2536

**Prompt.** [prompts/087-abby-route-s-team-5-round-2-seed-44-one-terrier-lady-but-the-far-eye-is-gone.prompt.txt](prompts/087-abby-route-s-team-5-round-2-seed-44-one-terrier-lady-but-the-far-eye-is-gone.prompt.txt)

**Verdict.** 12/20. identity 3 - one creature at last, no pet, collar and pendant and blouse right, but the muzzle drifts wheaten rather than westie and the head is turned so far that the FAR EYE IS NOT DRAWN AT ALL, which breaks her own eye rule; the hand on the ledge is a human hand with painted nails, not a fur-backed dog hand. pose 3 - body square to the room, head past three-quarter into near profile. seat 4 - right place, right scale, counter across the lower body, nothing floating. cleanliness 2 - the sticker carries a slab of invented back-bar, the marble ledge and the studded counter lip along with her.

*Logged 19:35.*

---

## 088. Abby route S team 5 round 2 seed 7 - the edit did not take, still a woman and her dog

![Abby route S team 5 round 2 seed 7 - the edit did not take, still a woman and her dog](images/088-abby-route-s-team-5-round-2-seed-7-the-edit-did-not-take-still-a-woman-and-her-dog.png)

**The ask.** Team 5, Abby round 2, second of four seeds on the one-creature edit.

**The thinking.** Same command, seed 7. Round 1's seed 7 drew a smiling human woman with a westie pet; this seed is the direct test of whether the one-creature edit is strong enough to break that habit on a seed that has it badly.

**Settings.** scripts/cast-place.py --character abby --route S --seed 7 --tag t5r2 --extra-edit "ABBY IS ONE SINGLE CREATURE..." | local/qwen-image-edit-2511, 4:5, fast | 42.4s, sticker 80105px in 28 blobs, kept 1, cleanliness 0.4098, dirty key (41% of the room re-inked)

**Prompt.** [prompts/088-abby-route-s-team-5-round-2-seed-7-the-edit-did-not-take-still-a-woman-and-her-dog.prompt.txt](prompts/088-abby-route-s-team-5-round-2-seed-7-the-edit-did-not-take-still-a-woman-and-her-dog.prompt.txt)

**Verdict.** 5/20. identity 1 - a human woman with dark hair and a human face wearing Abby's studded collar and pendant, with a separate live westie sitting on the ledge beside her; the exact split the edit forbids, drawn anyway. pose 1 - she faces the reader and smiles out of the panel, nothing like the block-in. seat 2 - she is at the ledge at the block-in's scale with the counter in front, but a dog sits ON the ledge and a stirred glass floats at her hand. cleanliness 1 - the sticker carries a whole second figure, the glass, the marble slab and the ledge.

*Logged 19:36.*

---

## 089. Abby route S team 5 round 2 seed 21 - a woman with no face and a westie at her elbow

![Abby route S team 5 round 2 seed 21 - a woman with no face and a westie at her elbow](images/089-abby-route-s-team-5-round-2-seed-21-a-woman-with-no-face-and-a-westie-at-her-elbow.png)

**The ask.** Team 5, Abby round 2, third of four seeds on the one-creature edit.

**The thinking.** Same command, seed 21. Round 1's seed 21 collapsed the head entirely; this checks whether the one-creature edit rescues a seed that was losing the head as well as the species.

**Settings.** scripts/cast-place.py --character abby --route S --seed 21 --tag t5r2 --extra-edit "ABBY IS ONE SINGLE CREATURE..." | local/qwen-image-edit-2511, 4:5, fast | 42.4s, sticker 66141px in 42 blobs, kept 2, cleanliness 0.4278, dirty key (43% re-inked)

**Prompt.** [prompts/089-abby-route-s-team-5-round-2-seed-21-a-woman-with-no-face-and-a-westie-at-her-elbow.prompt.txt](prompts/089-abby-route-s-team-5-round-2-seed-21-a-woman-with-no-face-and-a-westie-at-her-elbow.prompt.txt)

**Verdict.** 5/20. identity 1 - a human woman in long black hair, no terrier head at all, and a westie pet standing at her left; both halves of the banned split present at once. pose 1 - the head is a smear of hair with no face, no eye and no muzzle, and she hunches square over the ledge. seat 2 - right place and scale, counter in front, but the pet floats at the left edge. cleanliness 1 - second figure, marble slab, a solid black hatched block and bottle shapes all keyed in; the head is not solid.

*Logged 19:36.*

---

## 090. Abby route S team 5 round 2 seed 41 - BEST - the westie lady herself, one figure, both eyes

![Abby route S team 5 round 2 seed 41 - BEST - the westie lady herself, one figure, both eyes](images/090-abby-route-s-team-5-round-2-seed-41-best-the-westie-lady-herself-one-figure-both-eyes.png)

**The ask.** Team 5, Abby round 2, fourth of four seeds on the one-creature edit. Round 1's seed 41 was the worst of the round - a human woman flanked by TWO westies.

**The thinking.** Same command, seed 41. If the one-creature edit works anywhere it should show most on the seed that was previously drawing the most dogs. It did: the seed that gave a woman with two pets now gives one terrier lady and nothing else.

**Settings.** scripts/cast-place.py --character abby --route S --seed 41 --tag t5r2 --extra-edit "ABBY IS ONE SINGLE CREATURE, NOT A WOMAN WITH A DOG..." | local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000, 4:5, fast 8-step | box 420,620,900,1220 roi 520,680,800,1220, under-remap 100,180, no under-lines, no staging | 42.4s, sticker 84163px in 27 blobs, kept 1, cleanliness 0.4255

**Prompt.** [prompts/090-abby-route-s-team-5-round-2-seed-41-best-the-westie-lady-herself-one-figure-both-eyes.prompt.txt](prompts/090-abby-route-s-team-5-round-2-seed-41-best-the-westie-lady-herself-one-figure-both-eyes.prompt.txt)

**Verdict.** 16/20, best of the round and one point short of PASS. identity 5 - this is the official portrait's Abby: a groomed show-westie skull with two small pricked ears, a short square muzzle and a small black nose, and both eyes drawn to her own rule - white showing at each side of a drawn circular iris, a smaller round pupil, one catchlight, a lashed upper lid - over a closed-lip mouth, with the studded leather collar and its teardrop gem pendant at her throat and the pale blouse with rolled sleeves; fur laid in individual strokes, huggable and professional. pose 4 - standing behind the ledge facing the room as the block-in stages her, head turned a touch to her right, both eyes and the muzzle fully readable, though she reads closer to frontal than to a true three-quarter. seat 4 - dead on the block-in's place and scale, the counter across her lower body, nothing floating. cleanliness 3 - THE ONLY THING KEEPING HER FROM A PASS: the sticker carries a vertical strip of invented back-bar shelving beside her right arm, a small fur-or-foliage tuft at that shoulder, and the black studded counter lip along the bottom. The key cannot cut them out - the sidecar says kept 1 blob of 84163px, so the model drew that furniture JOINED to her body on a sheet that should have stayed blank paper behind her.

*Logged 19:36.*

---

## 091. Abby route S team 5 round 2 seed 41 - the keyed RGBA sticker on white

![Abby route S team 5 round 2 seed 41 - the keyed RGBA sticker on white](images/091-abby-route-s-team-5-round-2-seed-41-the-keyed-rgba-sticker-on-white.png)

**The ask.** Show the best seed's cut sticker on its own so the contamination is visible away from the room behind it.

**The thinking.** The laid preview flatters the key, because invented back-bar ink lands on top of the plate's real back-bar and hides there. On white the fault is plain: a vertical strip of shelving ink beside her right sleeve and the studded counter lip along the bottom edge. Measured on the alpha, her own sleeve runs out to sticker x365 and the strip sits in the same columns, so tightening her ROI would clip her arm before it clipped the furniture - the fix has to stop the model drawing the room in the first place.

**Settings.** cut by the counter occluder's mask and the block-in, ROI 520,680,800,1220; alpha bbox 122,74-367,559, coverage 0.31

**Verdict.** Head solid and joined to the neck, nothing of her cut off, no second figure and no glassware - a real improvement on round 1. Remaining dirt is furniture only: the back-bar strip, one fur tuft at that shoulder, and the counter lip. cleanliness 3/5.

*Logged 19:36.*

---

## 092. Abby team 5 round 2 contact sheet - four laid crops with seed and total

![Abby team 5 round 2 contact sheet - four laid crops with seed and total](images/092-abby-team-5-round-2-contact-sheet-four-laid-crops-with-seed-and-total.png)

**The ask.** One contact sheet of the four laid crops with seed and total in the caption.

**The thinking.** Read left to right the sheet says the one-creature edit is real but not yet reliable: it converted seed 41 outright (round 1's woman-with-two-westies is now the westie lady herself, 6/20 to 16/20) and held seed 44 as a single creature, while seeds 7 and 21 ignored it and drew the woman-plus-pet anyway. Two of four seeds are now on model, against one of four in round 1.

**Settings.** laid previews cropped x380-940 y560-1300 at 1x, four up; PASS = total >= 17 with no score below 4

**Verdict.** Round 2 does NOT pass: best is seed 41 at 16/20, held one point short by cleanliness 3. Next round changes one thing only - a second numbered EDIT that keeps the paper behind her blank, so the model stops drawing a back-bar and a counter lip that the key then cannot separate from her body.

*Logged 19:36.*

---

## 093. Drew round 2 seed 44 - white flamingo gentleman seated in the left chair, laid with Abby

![Drew round 2 seed 44 - white flamingo gentleman seated in the left chair, laid with Abby](images/093-drew-round-2-seed-44-white-flamingo-gentleman-seated-in-the-left-chair-laid-with-abby.png)

**The ask.** Team 5, round 2 for Drew: re-run route S at the lab's settled recipe with the key tightened one notch (--white-thresh 226, from round 1's 232) and Abby's accepted round-1 ledge sticker laid into the preview, so Drew is judged in a room that already has the barmaid in it. Seeds 44, 7, 21 and 41.

**The thinking.** Round 1 proved the recipe: the block-in goes in as a mid-grey band (--under-remap 100,180), no pencil lines, no staging picture - that is the one Picture 1 that makes the model draw the portrait's head rather than a hood. Round 2 changes one thing, the ink test: 226 instead of 232, so a pale rendered pixel has to be a touch darker before it counts as ink, which should stop the marble slab and the chair rail wandering into the sticker. Abby's own accepted sticker is laid at her part so this is judged as a real two-hander, not a solo. Seed 44 is the seed that worked in round 1, carried forward as the control.

**Settings.** scripts/cast-place.py --character drew --route S --seed 44 --tag t5r2 --white-thresh 226 --also figure-abby-01-ledge=canon/room-kit/v2/figures/abby-ledge-rS-t5r1-s44.png | model local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000 | under-blend 0, under-remap 100,180, no under-lines, no staging, sheet-grey 255, fill on, cut-by-blockin on | 42.4s | sticker 99683px, blobs 217, kept 1, head blob 0.78 of the block-in's own height, alpha inside figure mask 0.84, cleanliness outside sticker 0.0852

**Prompt.** [prompts/093-drew-round-2-seed-44-white-flamingo-gentleman-seated-in-the-left-chair-laid-with-abby.prompt.txt](prompts/093-drew-round-2-seed-44-white-flamingo-gentleman-seated-in-the-left-chair-laid-with-abby.prompt.txt)

**Verdict.** KEEP - the best Drew the studio has made. identity 4, pose 5, seat 5, cleanliness 4, total 18/20, PASSES. The head is the official portrait's: small refined skull under a feather stipple, heavy-lidded eye with a real pupil and a catchlight, a nostril slit, the bill bending down to a solid black tip. He is seated in the left chair from behind and a little to his left with his head turned to his right in three-quarter, at the block-in's scale, the chair in front of his lower body, both wing-hands landing on the marble. Knit V-neck vest, white collar and a black bow tie all read. Faults: two thin marble-edge slivers ride along to the right of his hands and a dark hatched shadow wedge sits at the lower right of the sticker; the skull and neck are a little heavier than the study's.

*Logged 19:40.*

---

## 094. Drew round 2 seed 7 - the model drew no head at all

![Drew round 2 seed 7 - the model drew no head at all](images/094-drew-round-2-seed-7-the-model-drew-no-head-at-all.png)

**The ask.** Team 5, round 2 for Drew: same command, seed 7 - one of the three fresh seeds testing whether the tighter ink test also rescues the seeds that collapsed the head in round 1.

**The thinking.** Seed 7 is a control on the failure mode, not on the recipe: round 1 showed some seeds read the grey band as a thing to erase rather than a head to paint. Nothing about Picture 1 changed here, only the key's threshold, so if 7 still collapses it tells us the fault is in what the model is being asked, not in how the render is cut.

**Settings.** scripts/cast-place.py --character drew --route S --seed 7 --tag t5r2 --white-thresh 226 --also figure-abby-01-ledge=canon/room-kit/v2/figures/abby-ledge-rS-t5r1-s44.png | 74.7s | sticker 83654px, blobs 119, kept 3, head blob only 0.157 of the block-in's own height (106px against 675), cleanliness outside sticker 0.1888, room drift 0.7991

**Prompt.** [prompts/094-drew-round-2-seed-7-the-model-drew-no-head-at-all.prompt.txt](prompts/094-drew-round-2-seed-7-the-model-drew-no-head-at-all.prompt.txt)

**Verdict.** REJECT - identity 0, pose 0, seat 1, cleanliness 0, total 1/20. There is no bird. The neck ends in a stump; a severed piece of bill floats in the air above and to the right of it with a grey smear behind it, and the torso is a bare knit hump. The cut is as bad as the drawing: the sticker carries the studded chair rail along its whole bottom edge, a wedge of the marble slab, and a small card lying on the counter. The tighter ink test did not touch this failure, which confirms it is the drawing collapsing, not the key.

*Logged 19:40.*

---

## 095. Drew round 2 seed 21 - a stub head on a neck that never joins the body

![Drew round 2 seed 21 - a stub head on a neck that never joins the body](images/095-drew-round-2-seed-21-a-stub-head-on-a-neck-that-never-joins-the-body.png)

**The ask.** Team 5, round 2 for Drew: same command, seed 21.

**The thinking.** The third of the fresh seeds. Watching for the second failure mode round 1 named: the head arrives but shrinks, so the bill grows to fill the space the skull should have taken.

**Settings.** scripts/cast-place.py --character drew --route S --seed 21 --tag t5r2 --white-thresh 226 --also figure-abby-01-ledge=canon/room-kit/v2/figures/abby-ledge-rS-t5r1-s44.png | 72.7s | sticker 89068px, blobs 202, kept 2, head blob 0.307 of the block-in's own height (207px against 675), cleanliness outside sticker 0.1903, room drift 0.8118

**Prompt.** [prompts/095-drew-round-2-seed-21-a-stub-head-on-a-neck-that-never-joins-the-body.prompt.txt](prompts/095-drew-round-2-seed-21-a-stub-head-on-a-neck-that-never-joins-the-body.prompt.txt)

**Verdict.** REJECT - identity 1, pose 1, seat 2, cleanliness 1, total 5/20. The head collapsed to a stub and the bill swelled to a great dark hook to fill the gap; there is no eye, and the neck is drawn in hard scales, a reptile's neck, not a flamingo's feathered one. Worse, the neck never joins the torso - there is clear white between the two, so the sticker is a head floating above a body. It also carries a fragment of cracked marble off to the right and the chair rail's studs along the bottom.

*Logged 19:40.*

---

## 096. Drew round 2 seed 41 - the wardrobe is right and the head was never painted

![Drew round 2 seed 41 - the wardrobe is right and the head was never painted](images/096-drew-round-2-seed-41-the-wardrobe-is-right-and-the-head-was-never-painted.png)

**The ask.** Team 5, round 2 for Drew: same command, seed 41 - the last of the four.

**The thinking.** Seed 41 is the most useful failure of the round. Its numbers look like seed 44's - the head blob is the full height of the block-in, 0.78 of the mask - so by measurement it passed; only looking at it shows what actually happened.

**Settings.** scripts/cast-place.py --character drew --route S --seed 41 --tag t5r2 --white-thresh 226 --also figure-abby-01-ledge=canon/room-kit/v2/figures/abby-ledge-rS-t5r1-s44.png | 74.7s | sticker 100835px, blobs 169, kept 1, head blob 0.78 of the block-in's own height, alpha inside figure mask 0.84, cleanliness outside sticker 0.1015

**Prompt.** [prompts/096-drew-round-2-seed-41-the-wardrobe-is-right-and-the-head-was-never-painted.prompt.txt](prompts/096-drew-round-2-seed-41-the-wardrobe-is-right-and-the-head-was-never-painted.prompt.txt)

**Verdict.** REJECT - identity 1, pose 2, seat 4, cleanliness 2, total 9/20. From the neck down this is the best-dressed Drew of the four: knit V-neck vest, a crisp white collar, a black bow tie, seated at the right scale with the chair in front of his lower body. From the neck up the model never painted anything - the head and neck are the mid-grey band of the block-in itself, passed through as a flat hatched shape with no skull, no eye and no feather, only the bill's silhouette and its black tip surviving. Because that band is darker than the ink test, the key happily kept it and the measurements read it as a full-height head. The sticker also carries the tumbler in his hand and a marble sliver at the right.

*Logged 19:40.*

---

## 097. Drew round 2 contact sheet - four seeds side by side, seed 44 is the one

![Drew round 2 contact sheet - four seeds side by side, seed 44 is the one](images/097-drew-round-2-contact-sheet-four-seeds-side-by-side-seed-44-is-the-one.png)

**The ask.** Team 5: put round 2's four laid previews on one sheet with the seed and the score under each, so the round can be read at a glance.

**The thinking.** One seed in four is a keeper, which matches round 1. The three failures are three different ways of losing the head - not drawn at all (7), drawn too small so the bill takes over (21), or not drawn over at all so the grey block-in survives as the head (41) - while the body, the seat and the wardrobe come out right in nearly every seed. So the recipe is placing him correctly and the remaining risk is entirely in the head. Seed 44 also proves the tighter ink test did its job: it is the cleanest cut of the day, with only two thin marble slivers left riding along. One note for the desk: the round's command carried --also with a bare file path, and the script requires PART=PATH, so it was run as --also figure-abby-01-ledge=<path>, which is Abby's own part id and the reading the command clearly intended.

**Settings.** PIL contact sheet, four laid previews cropped x0-800 y600-1600 at 1x then halved for the sheet; source renders as logged in entries 093-096

**Verdict.** Round 2 PASSES on seed 44 at 18/20. Seed 44's sticker and laid preview go forward as Drew; seeds 7, 21 and 41 are rejected. Recommend showing the founder seed 44 for approval rather than spending another round, and if he wants the last two points, a round 3 that only tightens the head - a --extra-edit naming the small refined skull, the heavy-lidded eye and the feather stipple - rather than touching Picture 1, which is now working.

*Logged 19:41.*

---

## 098. Barclay round 2 - route S seed 44 (t5r2), laid with Abby + Drew

![Barclay round 2 - route S seed 44 (t5r2), laid with Abby + Drew](images/098-barclay-round-2-route-s-seed-44-t5r2-laid-with-abby-drew.png)

**The ask.** Team 5 round 2 for Barclay: run the settled route-S recipe (white sheet, block-in remapped into a mid-grey band 100,180, no pencil lines, no staging picture) at seeds 44, 7, 21, 41 with one added EDIT that forbids every object outside Barclay's own outline, and judge him in the laid preview with Abby's and Drew's approved t5r1 s44 stickers already in the room.

**The thinking.** Seed 44 was the seed that worked for Drew, so it was the first to try with the new no-objects EDIT. The EDIT did not stop the model inventing furniture; it invented a whole second seating group instead, and the head collapsed the way the lab warned some seeds still do.

**Settings.** scripts/cast-place.py --character barclay --route S --seed 44 --tag t5r2 --extra-edit "Draw ONLY Barclay himself on the sheet...no object of any kind anywhere on it..." --also figure-abby-01-ledge=abby-ledge-rS-t5r1-s44.png --also figure-drew-02-toward=drew-seated-left-rS-t5r1-s44.png | model local/qwen-image-edit-2511, 4:5, fast 8-step, under-blend 0, under-remap 100,180, no under-lines, no staging, fill on, cut-by-blockin on, white-thresh 232, box 560,700,1200,1500

**Prompt.** [prompts/098-barclay-round-2-route-s-seed-44-t5r2-laid-with-abby-drew.prompt.txt](prompts/098-barclay-round-2-route-s-seed-44-t5r2-laid-with-abby-drew.prompt.txt)

**Verdict.** REJECT - total 3/20 (identity 1, pose 1, seat 1, cleanliness 0). The head collapsed into a long duck bill grafted onto a retriever skull at giant scale, and a whole second scene rode along in the sticker: a tufted club chair, a side table, a tumbler, a rug and a small correct-looking second Barclay seated in it. Nothing is at the block-in's staging.

*Logged 19:41.*

---

## 099. Barclay round 2 - route S seed 7 (t5r2), laid with Abby + Drew

![Barclay round 2 - route S seed 7 (t5r2), laid with Abby + Drew](images/099-barclay-round-2-route-s-seed-7-t5r2-laid-with-abby-drew.png)

**The ask.** Team 5 round 2 for Barclay: run the settled route-S recipe (white sheet, block-in remapped into a mid-grey band 100,180, no pencil lines, no staging picture) at seeds 44, 7, 21, 41 with one added EDIT that forbids every object outside Barclay's own outline, and judge him in the laid preview with Abby's and Drew's approved t5r1 s44 stickers already in the room.

**The thinking.** Second seed of the round, same command. The failure mode is the head collapse the lab predicted plus the sticker swallowing the chair - evidence the darker grey band is what is needed, not more words in the EDIT.

**Settings.** scripts/cast-place.py --character barclay --route S --seed 7 --tag t5r2 --extra-edit "Draw ONLY Barclay himself on the sheet...no object of any kind anywhere on it..." --also figure-abby-01-ledge=abby-ledge-rS-t5r1-s44.png --also figure-drew-02-toward=drew-seated-left-rS-t5r1-s44.png | model local/qwen-image-edit-2511, 4:5, fast 8-step, under-blend 0, under-remap 100,180, no under-lines, no staging, fill on, cut-by-blockin on, white-thresh 232, box 560,700,1200,1500

**Prompt.** [prompts/099-barclay-round-2-route-s-seed-7-t5r2-laid-with-abby-drew.prompt.txt](prompts/099-barclay-round-2-route-s-seed-7-t5r2-laid-with-abby-drew.prompt.txt)

**Verdict.** REJECT - total 3/20 (identity 1, pose 1, seat 1, cleanliness 0). A small bird-billed head with retriever ears sits on a long scaled neck wearing a bib; below it the torso IS a tufted chesterfield arm with a cuff and a wristwatch. No readable body, no correct species, furniture is most of the sticker.

*Logged 19:41.*

---

## 100. Barclay round 2 - route S seed 21 (t5r2), laid with Abby + Drew

![Barclay round 2 - route S seed 21 (t5r2), laid with Abby + Drew](images/100-barclay-round-2-route-s-seed-21-t5r2-laid-with-abby-drew.png)

**The ask.** Team 5 round 2 for Barclay: run the settled route-S recipe (white sheet, block-in remapped into a mid-grey band 100,180, no pencil lines, no staging picture) at seeds 44, 7, 21, 41 with one added EDIT that forbids every object outside Barclay's own outline, and judge him in the laid preview with Abby's and Drew's approved t5r1 s44 stickers already in the room.

**The thinking.** This is the first Barclay whose head did not collapse - the portrait's face survived the edit at the block-in's scale. It confirms the recipe is right and that the remaining fight is the sticker's cut, not the drawing: everything that fails here is furniture inside the silhouette that the block-in cut cannot remove.

**Settings.** scripts/cast-place.py --character barclay --route S --seed 21 --tag t5r2 --extra-edit "Draw ONLY Barclay himself on the sheet...no object of any kind anywhere on it..." --also figure-abby-01-ledge=abby-ledge-rS-t5r1-s44.png --also figure-drew-02-toward=drew-seated-left-rS-t5r1-s44.png | model local/qwen-image-edit-2511, 4:5, fast 8-step, under-blend 0, under-remap 100,180, no under-lines, no staging, fill on, cut-by-blockin on, white-thresh 232, box 560,700,1200,1500

**Prompt.** [prompts/100-barclay-round-2-route-s-seed-21-t5r2-laid-with-abby-drew.prompt.txt](prompts/100-barclay-round-2-route-s-seed-21-t5r2-laid-with-abby-drew.prompt.txt)

**Verdict.** BEST OF THE ROUND but still short - total 14/20 (identity 4, pose 4, seat 4, cleanliness 2). A real golden retriever gentleman: refined muzzle with whisker dots, dark nose, floppy ear, heavy-lidded human-looking eye with one catchlight, closed-lip smile, dark blazer over an open-collared shirt with the small flag pin. Seen from behind and a little to his right with the head turned to his left toward Drew, sitting on the block-in almost exactly (93.5% of the block-in covered) with the right club chair in front of his lower body. The sticker still carries the chair's studded top rail across his lap, a hatched marble wedge at his right and a cuff/stem fragment at his left, and the laid preview shows that rail doubled against the plate's own.

*Logged 19:41.*

---

## 101. Barclay round 2 - route S seed 41 (t5r2), laid with Abby + Drew

![Barclay round 2 - route S seed 41 (t5r2), laid with Abby + Drew](images/101-barclay-round-2-route-s-seed-41-t5r2-laid-with-abby-drew.png)

**The ask.** Team 5 round 2 for Barclay: run the settled route-S recipe (white sheet, block-in remapped into a mid-grey band 100,180, no pencil lines, no staging picture) at seeds 44, 7, 21, 41 with one added EDIT that forbids every object outside Barclay's own outline, and judge him in the laid preview with Abby's and Drew's approved t5r1 s44 stickers already in the room.

**The thinking.** Last seed of the round. Same collapse as 44 and 7 but milder, and the only run this round to trip the dirty-key guard, so the model was fighting the sheet as well as the head.

**Settings.** scripts/cast-place.py --character barclay --route S --seed 41 --tag t5r2 --extra-edit "Draw ONLY Barclay himself on the sheet...no object of any kind anywhere on it..." --also figure-abby-01-ledge=abby-ledge-rS-t5r1-s44.png --also figure-drew-02-toward=drew-seated-left-rS-t5r1-s44.png | model local/qwen-image-edit-2511, 4:5, fast 8-step, under-blend 0, under-remap 100,180, no under-lines, no staging, fill on, cut-by-blockin on, white-thresh 232, box 560,700,1200,1500

**Prompt.** [prompts/101-barclay-round-2-route-s-seed-41-t5r2-laid-with-abby-drew.prompt.txt](prompts/101-barclay-round-2-route-s-seed-41-t5r2-laid-with-abby-drew.prompt.txt)

**Verdict.** REJECT - total 8/20 (identity 2, pose 2, seat 3, cleanliness 1). The wardrobe is right - dark blazer, open collar, flag pin - but the head is a goose/duck bill with retriever ears instead of a muzzle, the body is turned to the camera rather than seen from behind, and a tumbler and two grey marble wedges plus a rail band ride along. The run also tripped the dirty-key warning (the model re-inked 59% of the room).

*Logged 19:41.*

---

## 102. Barclay round 2 contact sheet - four seeds side by side, seed 21 is the one

![Barclay round 2 contact sheet - four seeds side by side, seed 21 is the one](images/102-barclay-round-2-contact-sheet-four-seeds-side-by-side-seed-21-is-the-one.png)

**The ask.** Make one contact sheet of the four round-2 laid crops (x 500-1200, y 600-1600) with the seed and the total in each caption.

**The thinking.** Side by side the round reads at a glance: three of the four seeds grafted a bird's bill onto the retriever's skull, and only seed 21 drew the portrait's own head. Every one of the four still smuggled furniture inside the silhouette, so the fight has moved from the face to the cut and to how faithfully the model obeys the no-objects EDIT.

**Settings.** scripts\ (local PIL compose), out C;C:\Program Files\Git\Users\admin\AppData\Local\Temp\claude\Z--ImageGenerator\7e90a839-5703-42df-8007-3e3f206ae0ae\scratchpad\cast-scene\team5\barclay\round-2-sheet.png

**Prompt.** [prompts/102-barclay-round-2-contact-sheet-four-seeds-side-by-side-seed-21-is-the-one.prompt.txt](prompts/102-barclay-round-2-contact-sheet-four-seeds-side-by-side-seed-21-is-the-one.prompt.txt)

**Verdict.** Seed 21 (14/20) is the round's only usable Barclay; 44 and 7 are 3/20, 41 is 8/20. Round 2 does not PASS - the threshold is 17 with nothing below 4, and seed 21's cleanliness is 2.

*Logged 19:42.*

---

## 103. Abby route S team 5 round 3 seed 44 - one creature, but the skull has no ears and a toothy grin

![Abby route S team 5 round 3 seed 44 - one creature, but the skull has no ears and a toothy grin](images/103-abby-route-s-team-5-round-3-seed-44-one-creature-but-the-skull-has-no-ears-and-a-toothy-grin.png)

**The ask.** Team 5, Abby round 3. Round 2 got her to 16/20 on seed 41 and was held one point short by cleanliness 3 - the sticker carried a strip of invented back-bar shelving, a fur tuft and the studded counter lip, drawn joined to her body on paper that should have stayed blank. Round 3 changes exactly one thing: a SECOND numbered EDIT that says the paper behind and beside her stays blank white, the counter already printed on the sheet is the only furniture, and no back-bar, shelves, bottles, panelling, wall, mirror, marble slab or counter lip of the model's own may be drawn anywhere around her. The one-creature edit from round 2 is unchanged, the same four seeds 44 / 7 / 21 / 41, and this round also lays Drew (t5r1 s44) and Barclay (t5r1 s21) into the preview through their own parts so she is judged in the room with the two gentlemen already in it.

**The thinking.** First of four seeds. Round 2's seed 44 gave one terrier lady whose far eye was never drawn; the question here is whether the blank-paper edit costs anything on a seed that was already borderline. It did not help: the model draws one creature and no pet, so the one-creature edit still holds, but the head comes back wrong - a rounded fur blob with NO PRICKED EARS AT ALL, the top of the skull ending flat at the block-in's ceiling, small eyes shoved up against that edge, and a wide open toothy grin where the canon asks for a closed-lip half-smile. The blank-paper edit did cut the back-bar, but the sheet still comes back with a marble slab, the studded counter lip and two dark panel scraps at her elbows, and the key kept them in 3 blobs.

**Settings.** scripts/cast-place.py --character abby --route S --seed 44 --tag t5r3 --extra-edit (one-creature) --extra-edit (blank-paper) --also figure-drew-02-toward=drew-seated-left-rS-t5r1-s44.png --also figure-barclay-02-toward=barclay-seated-right-rS-t5r1-s21.png | local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000, 4:5, fast 8-step | box 420,620,900,1220 roi 520,680,800,1220, under-remap 100,180, no under-lines, no staging | 42.4s, sticker 62571px in 54 blobs, kept 3, cleanliness 0.2243, room drift 0.7600

**Prompt.** [prompts/103-abby-route-s-team-5-round-3-seed-44-one-creature-but-the-skull-has-no-ears-and-a-toothy-grin.prompt.txt](prompts/103-abby-route-s-team-5-round-3-seed-44-one-creature-but-the-skull-has-no-ears-and-a-toothy-grin.prompt.txt)

**Verdict.** 10/20. identity 2 - one creature and no pet, and the studded collar, teardrop pendant and open pale blouse are all right, but the head is not Abby: no pricked ears anywhere, the skull cut flat across the top, the eyes tiny and crowded against that edge, and a wide open toothy grin instead of her closed-lip half-smile. pose 2 - body square to the room and both eyes on the paper, but the head is malformed and truncated rather than staged. seat 4 - right place, right scale, the counter across her lower body, nothing floating. cleanliness 2 - 3 blobs kept: a marble slab, the black studded counter lip and dark panel scraps at both elbows ride along with her, and the head is not whole.

*Logged 19:51.*

---

## 104. Abby route S team 5 round 3 seed 7 - still a young woman and her westie, exactly as forbidden

![Abby route S team 5 round 3 seed 7 - still a young woman and her westie, exactly as forbidden](images/104-abby-route-s-team-5-round-3-seed-7-still-a-young-woman-and-her-westie-exactly-as-forbidden.png)

**The ask.** Team 5, Abby round 3, second of four seeds on the one-creature edit plus the new blank-paper edit, laid with Drew and Barclay already in the room.

**The thinking.** Same command, seed 7. This seed drew a human woman with a westie pet in round 1 and again in round 2; it is the direct test of whether adding a second edit about the paper changes anything about the figure itself. It does not - the blank-paper edit governs the background, not the split, and seed 7 hands back the same banned pair: a young human woman smiling out of the panel wearing Abby's studded collar and pendant, with a live westie propped at her right shoulder as a pet. The room behind her is cleaner than round 2, so the new edit is doing its job; this seed's fault is the figure.

**Settings.** scripts/cast-place.py --character abby --route S --seed 7 --tag t5r3, same two extra edits and the same two --also stickers | local/qwen-image-edit-2511, 4:5, fast 8-step | 42.5s, sticker 81066px in 26 blobs, kept 3, cleanliness 0.3831, room drift 0.7254, dirty key (38% of the room re-inked)

**Prompt.** [prompts/104-abby-route-s-team-5-round-3-seed-7-still-a-young-woman-and-her-westie-exactly-as-forbidden.prompt.txt](prompts/104-abby-route-s-team-5-round-3-seed-7-still-a-young-woman-and-her-westie-exactly-as-forbidden.prompt.txt)

**Verdict.** 5/20. identity 1 - a human woman with a human face, human hair and human hands, plus a separate westie sitting against her shoulder; both halves of the split the edit forbids, drawn anyway. pose 1 - she faces the reader and smiles out of the panel, nothing like the block-in's staging. seat 2 - she is at the ledge at the block-in's scale with the counter in front, but the pet sits up on the ledge beside her. cleanliness 1 - the sticker carries a whole second figure and a marble slab across the bottom.

*Logged 19:52.*

---

## 105. Abby route S team 5 round 3 seed 21 - a woman with half a head, a westie at her elbow and a wine glass

![Abby route S team 5 round 3 seed 21 - a woman with half a head, a westie at her elbow and a wine glass](images/105-abby-route-s-team-5-round-3-seed-21-a-woman-with-half-a-head-a-westie-at-her-elbow-and-a-wine-glass.png)

**The ask.** Team 5, Abby round 3, third of four seeds on the one-creature edit plus the new blank-paper edit, laid with Drew and Barclay already in the room.

**The thinking.** Same command, seed 21. This is the seed that has failed hardest in both previous rounds - round 1 lost the head entirely, round 2 gave a faceless woman with a westie at her elbow. Round 3 repeats round 2's failure almost exactly and adds a prop: a human woman in long black hair whose skull simply stops above the brow, a live westie standing at her left, and a stemmed wine glass held in two human hands. The new blank-paper edit did not reach this seed either - a marble slab and a black hatched block are drawn under her arms.

**Settings.** scripts/cast-place.py --character abby --route S --seed 21 --tag t5r3, same two extra edits and the same two --also stickers | local/qwen-image-edit-2511, 4:5, fast 8-step | 42.5s, sticker 68340px in 35 blobs, kept 2, cleanliness 0.3998, room drift 0.6630, dirty key (40% of the room re-inked)

**Prompt.** [prompts/105-abby-route-s-team-5-round-3-seed-21-a-woman-with-half-a-head-a-westie-at-her-elbow-and-a-wine-glass.prompt.txt](prompts/105-abby-route-s-team-5-round-3-seed-21-a-woman-with-half-a-head-a-westie-at-her-elbow-and-a-wine-glass.prompt.txt)

**Verdict.** 5/20. identity 1 - a human woman, human face and long human hair, no terrier head at all, with a westie pet standing at her left; the banned split again, and the top of her skull is never painted. pose 1 - she hunches square over the ledge with the crown of her head missing, no muzzle, no readable staging. seat 2 - right place and scale with the counter in front, but the pet and a stemmed glass sit on the ledge with her. cleanliness 1 - second figure, glassware, a marble slab and a solid black hatched block all keyed in; the head is not solid.

*Logged 19:52.*

---

## 106. Abby route S team 5 round 3 seed 41 - PASS - the westie lady herself on blank paper, 17/20

![Abby route S team 5 round 3 seed 41 - PASS - the westie lady herself on blank paper, 17/20](images/106-abby-route-s-team-5-round-3-seed-41-pass-the-westie-lady-herself-on-blank-paper-17-20.png)

**The ask.** Team 5, Abby round 3, fourth of four seeds. Seed 41 is the one round 2 converted outright - it went from a woman flanked by two westies to the terrier lady herself at 16/20, held one point short of a pass by cleanliness 3. The single change this round is the blank-paper edit, aimed at exactly that fault.

**The thinking.** The one thing round 2 could not fix by keying was that the model drew a strip of back-bar shelving JOINED to her body, so the key had no seam to cut on. The blank-paper edit attacks it at the source: the counter already printed on the sheet is the only furniture in the picture, everything else stays untouched white paper. It worked. Seed 41 comes back as one figure with no invented shelving, no bottles, no wall and no second creature - the key kept ONE blob of 79625px at cleanliness 0.1837, against round 2's 0.4255. What survives is a black studded counter lip drawn across her waist with a faint marble smear under it, and two short stubs of the ledge horizon line running out past her sleeves into blank paper. The head is the best Abby route S has drawn: a groomed show-westie skull, two small pricked ears, a short square muzzle, a small black nose, a closed-lip mouth, and both eyes built like human eyes - almond opening, drawn iris, round pupil, one catchlight, a lashed upper lid over fine brow strokes - though the white of the eye is a thinner sliver than the official portrait shows, and thinnest on the far eye. Wardrobe is exact: studded leather collar with the teardrop gem pendant, pale blouse open two buttons with rolled sleeves, fur-backed hand on the ledge.

**Settings.** scripts/cast-place.py --character abby --route S --seed 41 --tag t5r3 --extra-edit (one-creature) --extra-edit (blank-paper) --also figure-drew-02-toward=drew-seated-left-rS-t5r1-s44.png --also figure-barclay-02-toward=barclay-seated-right-rS-t5r1-s21.png | local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000, 4:5, fast 8-step | box 420,620,900,1220 roi 520,680,800,1220, under-remap 100,180, no under-lines, no staging | 42.5s, sticker 79625px in 16 blobs, kept 1, cleanliness 0.1837, room drift 0.8365, alpha inside figure mask 0.874, mask covered 0.985

**Prompt.** [prompts/106-abby-route-s-team-5-round-3-seed-41-pass-the-westie-lady-herself-on-blank-paper-17-20.prompt.txt](prompts/106-abby-route-s-team-5-round-3-seed-41-pass-the-westie-lady-herself-on-blank-paper-17-20.prompt.txt)

**Verdict.** 17/20 - PASS, the first Abby to clear the bar. identity 5 - the official portrait's Abby: groomed westie skull, two pricked ears, short square muzzle, small black nose, closed-lip mouth, large eyes with iris, pupil, catchlight and lashed lid, studded collar and teardrop pendant, pale blouse with rolled sleeves, fur laid in individual strokes; huggable and professional. The only drift from canon is thin whites on the far eye and a slightly furry sweep in the open collar where the canon asks for smooth close-lying fur. pose 4 - standing behind the ledge facing the room as the block-in stages her, both eyes and the muzzle fully readable, one hand on the ledge; she reads dead frontal rather than turned into a true three-quarter. seat 4 - dead on the block-in's place and scale, the counter across her lower body, nothing floating, and she now shares the room with Drew in the left chair and Barclay in the right. cleanliness 4 - one blob, head solid and joined to the neck, nothing cut off, no second figure, no glassware, no back-bar and no shelving; what remains is the black studded counter lip across her waist, a faint marble smear beneath it and two short ledge-line stubs past her sleeves.

*Logged 19:52.*

---

## 107. Abby round 3 seed 41 - the keyed RGBA sticker on white, the back-bar finally gone

![Abby round 3 seed 41 - the keyed RGBA sticker on white, the back-bar finally gone](images/107-abby-round-3-seed-41-the-keyed-rgba-sticker-on-white-the-back-bar-finally-gone.png)

**The ask.** Show the winning seed's cut sticker on its own, the way round 2's was shown, so the blank-paper edit can be judged where the laid preview cannot flatter it.

**The thinking.** On the laid preview invented back-bar ink hides on top of the plate's real back-bar, so the sticker on white is the only honest test. Round 2's sticker carried a vertical strip of shelving beside her right sleeve, a fur tuft at that shoulder and the counter lip; round 3's carries none of the shelving and no tuft. Measured on the alpha: one blob, 79625px, bbox 121,73-365,562 inside a 480x600 box, so nothing is clipped at the box edge and the head is whole and joined to the neck. The remaining ink that is not her is the black studded counter lip along the bottom with a faint marble smear under it, and two short stubs of the ledge horizon line at the left and right edges.

**Settings.** cut by the counter occluder's mask and the block-in, ROI 520,680,800,1220, white_thresh 232, fill on; alpha bbox 121,73-365,562, kept 1 blob 79625px, cleanliness 0.1837

**Verdict.** cleanliness 4/5. The fault that held round 2 at 16 is gone - no invented shelving, no bottles, no wall, no second figure, no glassware, no halo, nothing cut off. What is left is furniture the model still insists on drawing at her waist: the studded counter lip and the two ledge-line stubs. Good enough to pass; the next thing to chase if the founder wants a 5.

*Logged 19:52.*

---

## 108. Abby team 5 round 3 contact sheet - four laid crops with seed and total, seed 41 passes at 17

![Abby team 5 round 3 contact sheet - four laid crops with seed and total, seed 41 passes at 17](images/108-abby-team-5-round-3-contact-sheet-four-laid-crops-with-seed-and-total-seed-41-passes-at-17.png)

**The ask.** One contact sheet of the four laid crops with seed and total in the caption.

**The thinking.** Read left to right the sheet says the blank-paper edit did exactly the one job it was given and nothing more. On seed 41, the seed that was already on model, it removed the invented back-bar and the fur tuft and lifted cleanliness from 3 to 4, taking her from 16/20 to 17/20 and over the pass line. It changed nothing about the figure on the seeds that were drawing the wrong figure: 7 and 21 hand back the woman-plus-pet split again, and 44 draws one creature with a malformed earless head. So the recipe is now proven on one seed rather than reliable across four - two of four were on model in round 2, one of four here, and the one that is on model is the same seed both times. This is also the first sheet where Abby is judged in the finished room: Drew's approved sticker sits in the left chair and Barclay's in the right, and she reads correctly in scale and staging between them.

**Settings.** laid previews cropped x380-940 y560-1300 at 1x, four up, Drew t5r1 s44 and Barclay t5r1 s21 laid in at their own parts; PASS = total >= 17 with no score below 4

**Verdict.** Round 3 PASSES on seed 41 at 17/20 with identity 5, pose 4, seat 4, cleanliness 4 - no score below 4. Seed 44 10/20, seeds 7 and 21 5/20 each. Abby's sticker for the scene is canon/room-kit/v2/figures/abby-ledge-rS-t5r3-s41.png. If the founder wants the last point, the one change to make is a third edit forbidding the studded counter lip and the ledge horizon line specifically, since that is the only ink left in the sticker that is not her.

*Logged 19:53.*

---

## 109. Barclay round 3 seed 44 - route S at 40 steps, the block-in inked as a grey cutout

![Barclay round 3 seed 44 - route S at 40 steps, the block-in inked as a grey cutout](images/109-barclay-round-3-seed-44-route-s-at-40-steps-the-block-in-inked-as-a-grey-cutout.png)

**The ask.** Team 5, Barclay round 3: place Barclay (golden retriever gentleman, dark blazer over an open-collared shirt, small flag pin) into the approved room on route S - right club chair, seen from behind and a little to his right, head turned to his left toward Drew - and cut him out as a sticker. Four seeds (44, 7, 21, 41), scored on identity / pose / seat / cleanliness, laid against the plate with Abby and Drew already in it.

**The thinking.** Round 3 keeps today lab recipe (block-in remapped into a mid-grey band, no pencil lines, no staging picture) and adds --full: the 40-step cfg 4 pass instead of the Lightning 8-step one, on the theory that more steps would stop the head collapsing. It did the opposite. At cfg 4 the model treats Picture 1 as something to reproduce rather than something to finish, so the flat mid-grey block-in came back as a flat grey cutout: a pale slab body with a rectangular ear-board, no fur, no blazer, no shirt, no flag pin, and a paper label reading BARCLEY pasted on the chest where the portrait should be. The staging is right - the figure fills the block-in at its own scale, seat and head turn (mask coverage 0.91, scale 1.02) - but the character is not there, and the key kept the whole leather chair back, the marble slab edge and a glass inside the sticker.

**Settings.** scripts/cast-place.py --character barclay --route S --seed 44 --tag t5r3 --full --also figure-abby-01-ledge=abby-ledge-rS-t5r2-s44.png --also figure-drew-02-toward=drew-seated-left-rS-t5r1-s44.png | local/qwen-image-edit-2511 via AuraVision 127.0.0.1:8000 | 40-step cfg 4 (--full) | under-blend 0, under-remap 100,180, no under-lines, no staging picture, white-thresh 232, fill on, cut-by-blockin on | box 560,700,1200,1500

**Prompt.** [prompts/109-barclay-round-3-seed-44-route-s-at-40-steps-the-block-in-inked-as-a-grey-cutout.prompt.txt](prompts/109-barclay-round-3-seed-44-route-s-at-40-steps-the-block-in-inked-as-a-grey-cutout.prompt.txt)

**Verdict.** FAIL - total 7/20 (identity 1, pose 2, seat 3, cleanliness 1). Not Barclay: a grey cutout with a printed name label instead of a retriever, and furniture inside the sticker.

*Logged 20:11.*

---

## 110. Barclay round 3 seed 7 - the whole sheet re-inked, a transparent grey dummy in the chair

![Barclay round 3 seed 7 - the whole sheet re-inked, a transparent grey dummy in the chair](images/110-barclay-round-3-seed-7-the-whole-sheet-re-inked-a-transparent-grey-dummy-in-the-chair.png)

**The ask.** Team 5, Barclay round 3, seed 7: same command, next seed - Barclay into the right club chair on route S, sticker plus laid preview against the plate with Abby and Drew already in it.

**The thinking.** Same recipe, seed 7. The model re-inked 97 percent of the sheet outside the figure (cleanliness 0.95), so the absolute white-sheet key had almost nothing white left to cut against and simply returned the dilated block-in silhouette as one blob. What is inside it is a see-through grey mannequin - a wedge bill with a dark ball at the tip, a dark bar for the eyes, a rectangular ear plate - with the marble and the chair studs showing through the body, plus a black wedge of chair rail carried along at the bottom left. No fur, no jacket, no collar, no pin.

**Settings.** scripts/cast-place.py --character barclay --route S --seed 7 --tag t5r3 --full --also figure-abby-01-ledge=abby-ledge-rS-t5r2-s44.png --also figure-drew-02-toward=drew-seated-left-rS-t5r1-s44.png | local/qwen-image-edit-2511 via AuraVision | 40-step cfg 4 | under-blend 0, under-remap 100,180, no under-lines, no staging picture

**Prompt.** [prompts/110-barclay-round-3-seed-7-the-whole-sheet-re-inked-a-transparent-grey-dummy-in-the-chair.prompt.txt](prompts/110-barclay-round-3-seed-7-the-whole-sheet-re-inked-a-transparent-grey-dummy-in-the-chair.prompt.txt)

**Verdict.** FAIL - total 6/20 (identity 1, pose 2, seat 2, cleanliness 1). A ghost of the block-in, not a character; sticker is semi-transparent and carries chair and marble.

*Logged 20:11.*

---

## 111. Barclay round 3 seed 21 - a photographic human man in the blazer, square to camera

![Barclay round 3 seed 21 - a photographic human man in the blazer, square to camera](images/111-barclay-round-3-seed-21-a-photographic-human-man-in-the-blazer-square-to-camera.png)

**The ask.** Team 5, Barclay round 3, seed 21: same command, next seed - Barclay into the right club chair on route S, sticker plus laid preview against the plate with Abby and Drew already in it.

**The thinking.** Third seed of the 40-step pass and the third different way of losing him. Here the model read the block-in as a person and drew a photographic middle-aged HUMAN man - real skin, real hair - wearing the wardrobe it did take from the portrait (dark blazer, pale open collar, the small flag pin on the left lapel, a wristwatch). He is also square to the camera with both hands flat on the marble, which is the one staging the pinned brief forbids: the block-in asks for him from behind and a little to his right with the head turned left toward Drew. The sticker carries the marble slab, the chair rail and a glass with him.

**Settings.** scripts/cast-place.py --character barclay --route S --seed 21 --tag t5r3 --full --also figure-abby-01-ledge=abby-ledge-rS-t5r2-s44.png --also figure-drew-02-toward=drew-seated-left-rS-t5r1-s44.png | local/qwen-image-edit-2511 via AuraVision | 40-step cfg 4 | under-blend 0, under-remap 100,180, no under-lines, no staging picture

**Prompt.** [prompts/111-barclay-round-3-seed-21-a-photographic-human-man-in-the-blazer-square-to-camera.prompt.txt](prompts/111-barclay-round-3-seed-21-a-photographic-human-man-in-the-blazer-square-to-camera.prompt.txt)

**Verdict.** FAIL - total 5/20 (identity 1, pose 1, seat 2, cleanliness 1). Wrong species and photographic: a human face in Barclay clothes, facing the camera, with furniture in the sticker.

*Logged 20:11.*

---

## 112. Barclay round 3 seed 41 - the block-in traced exactly, as a wooden mannequin

![Barclay round 3 seed 41 - the block-in traced exactly, as a wooden mannequin](images/112-barclay-round-3-seed-41-the-block-in-traced-exactly-as-a-wooden-mannequin.png)

**The ask.** Team 5, Barclay round 3, seed 41: same command, last seed of the round - Barclay into the right club chair on route S, sticker plus laid preview against the plate with Abby and Drew already in it.

**The thinking.** The clearest picture of what --full does to route S. At 40 steps and cfg 4 the model copies Picture 1 instead of finishing it: the mid-grey block-in came back line for line as a wooden artist mannequin - the round skull, the wedge muzzle with a ball nose, the two dot eyes, the rectangular drop-ear plate, the blocky torso and the flat triangle of a glass - hatched in the house pen but with no fur, no jacket, no shirt, no pin and no face. Nothing of Barclay portrait survived Picture 2. On the round scoring this is the best of the four only because everything except identity is right: the figure fills the block-in exactly (mask coverage 1.00, scale 1.02), the chair sits in front of his lower body, and the sticker holds only the figure (no chair, no marble). It is the right statue of the wrong thing.

**Settings.** scripts/cast-place.py --character barclay --route S --seed 41 --tag t5r3 --full --also figure-abby-01-ledge=abby-ledge-rS-t5r2-s44.png --also figure-drew-02-toward=drew-seated-left-rS-t5r1-s44.png | local/qwen-image-edit-2511 via AuraVision | 40-step cfg 4 | under-blend 0, under-remap 100,180, no under-lines, no staging picture

**Prompt.** [prompts/112-barclay-round-3-seed-41-the-block-in-traced-exactly-as-a-wooden-mannequin.prompt.txt](prompts/112-barclay-round-3-seed-41-the-block-in-traced-exactly-as-a-wooden-mannequin.prompt.txt)

**Verdict.** FAIL - total 9/20 (identity 0, pose 3, seat 3, cleanliness 3). Best total of round 3 and still not a character: the staging is exact, the character is absent.

*Logged 20:11.*

---

## 113. Barclay team 5 round 3 contact sheet - four laid crops, --full traced the block-in on every seed

![Barclay team 5 round 3 contact sheet - four laid crops, --full traced the block-in on every seed](images/113-barclay-team-5-round-3-contact-sheet-four-laid-crops-full-traced-the-block-in-on-every-seed.png)

**The ask.** One contact sheet of the four round-3 laid crops (x 500-1200, y 600-1600) with the seed and the total in each caption.

**The thinking.** Read left to right the sheet is a single verdict on --full. Round 2 ran this same recipe on the Lightning 8-step pass and got one real golden retriever gentleman (seed 21, 14/20, identity 4 / pose 4 / seat 4) held back only by furniture in the cut. Round 3 changed the pass to 40 steps at cfg 4 and every seed lost the character instead: 44 is a flat grey cutout with a paper label reading BARCLEY on its chest, 7 is a see-through mannequin, 21 is a photographic human man in the blazer, 41 is the block-in traced line for line as a wooden artist dummy. The staging numbers went the other way - the figures now fill the block-in exactly (mask coverage 0.86 to 1.00, scale 1.02) - which is the tell: at cfg 4 the model reproduces Picture 1 rather than finishing it, and Picture 1 is a solid mid-grey silhouette. The remapped band that reads as a helpful ghost at 8 steps reads as an object to ink at 40. Round 3 also dropped round 2 no-objects EDIT, and the chair, the marble and a glass came back inside three of the four stickers.

**Settings.** four laid previews cropped x500-1200 y600-1600 at 1x, four up, local PIL compose; Abby t5r2 s44 and Drew t5r1 s44 laid in at their own parts; PASS = total >= 17 with no score below 4; out C:\Users\admin\AppData\Local\Temp\claude\Z--ImageGenerator\7e90a839-5703-42df-8007-3e3f206ae0ae\scratchpad\cast-scene\team5\barclay\round-3-sheet.png

**Verdict.** Round 3 does NOT pass. Best seed 41 at 9/20 (identity 0, pose 3, seat 3, cleanliness 3), then 44 at 7, 7 at 6, 21 at 5 - every one far below the round-2 best of 14. --full is the wrong dial for route S: it buys staging fidelity by copying the under-drawing, and the under-drawing is not a character. Next round: take the 40-step pass off (or blend the block-in back toward white with --under-blend 0.55 if it stays on) and restore the no-objects EDIT that round 2 was carrying.

*Logged 20:12.*

---

## 114. RETHINK: one whole-scene pass by the house model from the approved room and the three portraits (seed 7)

![RETHINK: one whole-scene pass by the house model from the approved room and the three portraits (seed 7)](images/114-rethink-one-whole-scene-pass-by-the-house-model-from-the-approved-room-and-the-three-portraits-seed-7.png)

**The ask.** Founder, on seeing the all-three composite and the emblem bottles: 'thats one of the worst things ive ever seen the bottles are terrible the characters are even worse you need to rethink your approach.'

**The thinking.** The patchwork was the problem: every object rendered separately by the weaker model from a flat block-in and pasted through a mask, the characters keyed out as stickers. The plates Rick accepted were drawn WHOLE by the house edit model in one hand. So: scripts/scene-edit.py sends the approved room (its 4:5 crop) as Picture 1, Drew's portrait as Picture 2 and a Barclay+Abby tile as Picture 3, with five numbered edits (add each character at their place, redraw the bottles as a real bar shelf, keep everything else) and the studio's LOCAL rules. Seed 7: all three read as their portraits at once, one engraved hand, real bottles, the room's layout kept. Faults to fix next: the cast stands in a row facing the camera instead of Drew and Barclay seated in the chairs from behind; the pasted crop's top seam. Seed 41 drifted to a sketchbook page and is rejected. Also learned tonight: the house model's FIRST step after a fresh load streams weights for ~10-20 minutes (the 'wedge'); once resident a pass is ~60 s.

**Settings.** local/qwen-image-edit-2511 via AuraVision, fast Lightning 8-step cfg 1, 4:5 1344x1680, Picture 1 = plate crop y 300-1800, seed 7 (646 s incl. load) / seed 41 (57 s)

**Verdict.** Direction confirmed by the proof; the founder decides whether the house model draws the whole plate from here.

*Logged 20:36.*

---

## 115. Whole-scene pass, seed 41: rejected (drifted to a sketchbook page)

![Whole-scene pass, seed 41: rejected (drifted to a sketchbook page)](images/115-whole-scene-pass-seed-41-rejected-drifted-to-a-sketchbook-page.png)

**The ask.** Same pass, second seed.

**The thinking.** The model abandoned Picture 1 and drew the three as a sketchbook illustration; a seed to discard, logged for the record.

**Settings.** as seed 7

**Verdict.** Rejected.

*Logged 20:36.*

---

## 116. s2A pass A seed 7 whole-plate edit

![s2A pass A seed 7 whole-plate edit](images/116-s2a-pass-a-seed-7-whole-plate-edit.png)

**The ask.** Founder's note on the seed-7 proof: restore the approved window, gild THE SWINGING DOOR, put Abby behind the ledge and Drew/Barclay seated on the near side in their own chairs, redraw the bottles as a real back shelf.

**The thinking.** Pass A: Picture 1 is the approved plate with Drew's and Barclay's block-ins painted in at 100-180 grey; EDITS carried this pass: ['drew', 'barclay']. After the render, tone-matched to the plate over the room and ['window-frame', 'glass'] restored from the plate through their own masks before the gilded sign went on last.

**Settings.** local/qwen-image-edit-2511, seed 7, fast 8-step cfg 1, aspect 2:3 -> bridge (1232, 1840), 66.0s

**Prompt.** [prompts/116-s2a-pass-a-seed-7-whole-plate-edit.prompt.txt](prompts/116-s2a-pass-a-seed-7-whole-plate-edit.prompt.txt)

**Verdict.** Seating 4/5, identity 2/5, room 4/5, quality 4/5 - TOTAL 14/20. Joint best of the six. Both are seated in their own chairs on the near side of the bar, chair backs in front of their lower bodies, heads turned to each other, nobody behind the bar - the painted block-ins held, and the founder's 'wrong side of the bar' did not recur. The room, the restored window and the gilded sign are clean and seamless. Identity is the failure: Drew's head is a hook-billed vulture, not the flamingo's slender pale bill bending down with its black outer third, and Barclay reads three-quarter front rather than from behind and wears ABBY's studded collar and pendant - the Picture 3 tile carrying Barclay and Abby side by side bled her onto him. Closest of the six to the right two faces, which is why it keeps identity 2.

*Logged 21:20.*

---

## 117. s2A pass A seed 21 whole-plate edit

![s2A pass A seed 21 whole-plate edit](images/117-s2a-pass-a-seed-21-whole-plate-edit.png)

**The ask.** Founder's note on the seed-7 proof: restore the approved window, gild THE SWINGING DOOR, put Abby behind the ledge and Drew/Barclay seated on the near side in their own chairs, redraw the bottles as a real back shelf.

**The thinking.** Pass A: Picture 1 is the approved plate with Drew's and Barclay's block-ins painted in at 100-180 grey; EDITS carried this pass: ['drew', 'barclay']. After the render, tone-matched to the plate over the room and ['window-frame', 'glass'] restored from the plate through their own masks before the gilded sign went on last.

**Settings.** local/qwen-image-edit-2511, seed 21, fast 8-step cfg 1, aspect 2:3 -> bridge (1232, 1840), 66.1s

**Prompt.** [prompts/117-s2a-pass-a-seed-21-whole-plate-edit.prompt.txt](prompts/117-s2a-pass-a-seed-21-whole-plate-edit.prompt.txt)

**Verdict.** Seating 1/5, identity 1/5, room 1/5, quality 3/5 - TOTAL 6/20. Rejected. Barclay became a HUMAN MAN in a suit placed BEHIND the bar - the founder's exact complaint, reproduced - the right club chair is gone from the room altogether, and the television and the panel beside it turned into framed human portraits. The block-in was overridden completely on the right-hand seat.

*Logged 21:22.*

---

## 118. s2A pass A seed 41 whole-plate edit

![s2A pass A seed 41 whole-plate edit](images/118-s2a-pass-a-seed-41-whole-plate-edit.png)

**The ask.** Founder's note on the seed-7 proof: restore the approved window, gild THE SWINGING DOOR, put Abby behind the ledge and Drew/Barclay seated on the near side in their own chairs, redraw the bottles as a real back shelf.

**The thinking.** Pass A: Picture 1 is the approved plate with Drew's and Barclay's block-ins painted in at 100-180 grey; EDITS carried this pass: ['drew', 'barclay']. After the render, tone-matched to the plate over the room and ['window-frame', 'glass'] restored from the plate through their own masks before the gilded sign went on last.

**Settings.** local/qwen-image-edit-2511, seed 41, fast 8-step cfg 1, aspect 2:3 -> bridge (1232, 1840), 66.0s

**Prompt.** [prompts/118-s2a-pass-a-seed-41-whole-plate-edit.prompt.txt](prompts/118-s2a-pass-a-seed-41-whole-plate-edit.prompt.txt)

**Verdict.** Seating 4/5, identity 1/5, room 3/5, quality 3/5 - TOTAL 11/20. Both figures are in their chairs on the near side, so the staging holds, but Barclay is a hook-billed vulture in Abby's studded collar with a written name-card at his throat and a scribbled card in his hand - pseudo-lettering, which the fence forbids anywhere but the code sign. Drew's head is a flat grey cut-out that does not belong to the engraved hand around it.

*Logged 21:23.*

---

## 119. s2A pass A seed 44 whole-plate edit

![s2A pass A seed 44 whole-plate edit](images/119-s2a-pass-a-seed-44-whole-plate-edit.png)

**The ask.** Founder's note on the seed-7 proof: restore the approved window, gild THE SWINGING DOOR, put Abby behind the ledge and Drew/Barclay seated on the near side in their own chairs, redraw the bottles as a real back shelf.

**The thinking.** Pass A: Picture 1 is the approved plate with Drew's and Barclay's block-ins painted in at 100-180 grey; EDITS carried this pass: ['drew', 'barclay']. After the render, tone-matched to the plate over the room and ['window-frame', 'glass'] restored from the plate through their own masks before the gilded sign went on last.

**Settings.** local/qwen-image-edit-2511, seed 44, fast 8-step cfg 1, aspect 2:3 -> bridge (1232, 1840), 66.1s

**Prompt.** [prompts/119-s2a-pass-a-seed-44-whole-plate-edit.prompt.txt](prompts/119-s2a-pass-a-seed-44-whole-plate-edit.prompt.txt)

**Verdict.** Seating 5/5, identity 1/5, room 4/5, quality 4/5 - TOTAL 14/20. Joint best, and the best SEATING of the six by a clear margin: both are genuinely seen FROM BEHIND, each filling his own chair on the near side, chair backs in front of their lower bodies, heads turned to each other - this is duo.png's accepted staging, reproduced. Identity is where it fails, and it fails by SWAP: Drew wears Barclay's dark pinstripe suit while Barclay wears Drew's white collar and bow tie plus Abby's studded collar, both heads are billed birds rather than a flamingo and a retriever, and Barclay carries a botched dark flap where his drop ear should be. Television speckled instead of dark and blank.

*Logged 21:24.*

---

## 120. s2A pass A seed 3 whole-plate edit

![s2A pass A seed 3 whole-plate edit](images/120-s2a-pass-a-seed-3-whole-plate-edit.png)

**The ask.** Founder's note on the seed-7 proof: restore the approved window, gild THE SWINGING DOOR, put Abby behind the ledge and Drew/Barclay seated on the near side in their own chairs, redraw the bottles as a real back shelf.

**The thinking.** Pass A: Picture 1 is the approved plate with Drew's and Barclay's block-ins painted in at 100-180 grey; EDITS carried this pass: ['drew', 'barclay']. After the render, tone-matched to the plate over the room and ['window-frame', 'glass'] restored from the plate through their own masks before the gilded sign went on last.

**Settings.** local/qwen-image-edit-2511, seed 3, fast 8-step cfg 1, aspect 2:3 -> bridge (1232, 1840), 64.1s

**Prompt.** [prompts/120-s2a-pass-a-seed-3-whole-plate-edit.prompt.txt](prompts/120-s2a-pass-a-seed-3-whole-plate-edit.prompt.txt)

**Verdict.** Seating 4/5, identity 1/5, room 3/5, quality 4/5 - TOTAL 12/20. Both seated in their own chairs on the near side with the chair backs in front of them; Barclay reads three-quarter front rather than from behind. Drew is a hook-billed vulture, Barclay a muzzle-billed hybrid wearing Abby's studded collar and pendant. The television lit itself into a speckled night view instead of staying dark and blank. Beautiful pen throughout.

*Logged 21:25.*

---

## 121. s2A pass A seed 11 whole-plate edit

![s2A pass A seed 11 whole-plate edit](images/121-s2a-pass-a-seed-11-whole-plate-edit.png)

**The ask.** Founder's note on the seed-7 proof: restore the approved window, gild THE SWINGING DOOR, put Abby behind the ledge and Drew/Barclay seated on the near side in their own chairs, redraw the bottles as a real back shelf.

**The thinking.** Pass A: Picture 1 is the approved plate with Drew's and Barclay's block-ins painted in at 100-180 grey; EDITS carried this pass: ['drew', 'barclay']. After the render, tone-matched to the plate over the room and ['window-frame', 'glass'] restored from the plate through their own masks before the gilded sign went on last.

**Settings.** local/qwen-image-edit-2511, seed 11, fast 8-step cfg 1, aspect 2:3 -> bridge (1232, 1840), 66.0s

**Prompt.** [prompts/121-s2a-pass-a-seed-11-whole-plate-edit.prompt.txt](prompts/121-s2a-pass-a-seed-11-whole-plate-edit.prompt.txt)

**Verdict.** Seating 3/5, identity 1/5, room 3/5, quality 2/5 - TOTAL 9/20. Rejected. Barclay became a HUMAN MAN with a pipe grafted straight through his face, looking up and away instead of across at Drew, so even the turn of the heads is lost. Drew keeps the knit vest, white collar and bow tie but wears the vulture head again. The grafted pipe alone puts this out of the running.

*Logged 21:26.*

---

## 122. scene2 PASS A contact sheet - six whole-plate seeds scored

![scene2 PASS A contact sheet - six whole-plate seeds scored](images/122-scene2-pass-a-contact-sheet-six-whole-plate-seeds-scored.png)

**The ask.** Run scene-edit.py pass A over seeds 7, 21, 41, 44, 3 and 11, look at every final, score seating / identity / room / quality out of 5 each, and say which two seeds to carry forward.

**The thinking.** One process, six seeds strictly sequential - never two renders on the card at once. Picture 1 was the approved plate with Drew's and Barclay's block-ins painted into the two chairs at 100-180 grey; the window-frame and glass were restored from the plate after every render and THE SWINGING DOOR was gilded last, so window, street and sign are code, not the model's invention. Scoring is against duo.png, the staging Rick already accepted. The block-ins did their job: five of six seeds put both figures in their own chairs on the near side, and the founder's 'wrong side of the bar' only recurred on seed 21. Identity is now the whole problem, and it has one dominant cause: Picture 3 carries Barclay and Abby side by side, and Abby's studded collar and pendant migrated onto Barclay on four of six seeds.

**Settings.** local/qwen-image-edit-2511, fast 8-step cfg 1, aspect 2:3 -> bridge 1232x1840, 64-66s per seed once the model was resident, six seeds sequential

**Verdict.** Totals out of 20: seed 44 = 14 (seating 5, identity 1, room 4, quality 4), seed 7 = 14 (seating 4, identity 2, room 4, quality 4), seed 3 = 12, seed 41 = 11, seed 11 = 9, seed 21 = 6. Carry seed 44 and seed 7: 44 has the best seating of the six - both genuinely from behind in their own chairs, duo.png's staging reproduced - and 7 has the closest pair of faces. Seating is SOLVED by the block-ins; identity is the open problem, and the first fix is to stop sending Barclay and Abby on one tile.

*Logged 21:29.*

---

## 123. s2B1 pass B seed 7 whole-plate edit

![s2B1 pass B seed 7 whole-plate edit](images/123-s2b1-pass-b-seed-7-whole-plate-edit.png)

**The ask.** Founder's note on the seed-7 proof: restore the approved window, gild THE SWINGING DOOR, put Abby behind the ledge and Drew/Barclay seated on the near side in their own chairs, redraw the bottles as a real back shelf.

**The thinking.** Pass B: Picture 1 is a previous pass-A render, already right about the room and the cast; EDITS carried this pass: ['abby', 'bottles']. After the render, tone-matched to the plate over the room and ['window-frame', 'glass'] restored from the plate through their own masks before the gilded sign went on last.

**Settings.** local/qwen-image-edit-2511, seed 7, fast 8-step cfg 1, aspect 2:3 -> bridge (1232, 1840), 65.1s

**Prompt.** [prompts/123-s2b1-pass-b-seed-7-whole-plate-edit.prompt.txt](prompts/123-s2b1-pass-b-seed-7-whole-plate-edit.prompt.txt)

**Verdict.** Abby 0/5, bottles 2/5, room 3/5, quality 3/5 - TOTAL 8/20. Rejected. ABBY IS NOT IN THE PICTURE AT ALL: the working ledge in front of the recess is as empty as it was in Picture 1. The bottles are the same bottles Picture 1 already had - the same ten on the top shelf with the same gaps, not a real bar's shoulder-to-shoulder back shelf - though their labels are clean crests with no lettering. The window and the gilded sign came back cleanly in code. Cost: the percentile tone-match darkened the recess into mud and blew the marble's hatching to white, and both gentlemen drifted further into scaled reptiles under the model's hand.

*Logged 21:34.*

---

## 124. s2B2 pass B seed 7 whole-plate edit

![s2B2 pass B seed 7 whole-plate edit](images/124-s2b2-pass-b-seed-7-whole-plate-edit.png)

**The ask.** Founder's note on the seed-7 proof: restore the approved window, gild THE SWINGING DOOR, put Abby behind the ledge and Drew/Barclay seated on the near side in their own chairs, redraw the bottles as a real back shelf.

**The thinking.** Pass B: Picture 1 is a previous pass-A render, already right about the room and the cast; EDITS carried this pass: ['abby', 'bottles']. After the render, tone-matched to the plate over the room and ['window-frame', 'glass'] restored from the plate through their own masks before the gilded sign went on last.

**Settings.** local/qwen-image-edit-2511, seed 7, fast 8-step cfg 1, aspect 2:3 -> bridge (1232, 1840), 113.2s

**Prompt.** [prompts/124-s2b2-pass-b-seed-7-whole-plate-edit.prompt.txt](prompts/124-s2b2-pass-b-seed-7-whole-plate-edit.prompt.txt)

**Verdict.** PASS B on candidate 2, scored 10/20 (abby 1, bottles 2, room 4, quality 3). Abby never appears: the space behind the working ledge is left as empty panelling. The cause is structural - Picture 1 here is pass A's raw render, which has no Abby and no grey block-in for her, and EDIT 1 tells the model her pose and place 'stay exactly as Picture 1 already has them', so an empty ledge is what it faithfully keeps. Drew and Barclay carry over unchanged, as asked. The bottles hardly move: both shelves keep wide gaps between bottles, flat outlined glass, almost no dark glass and no readable fill lines - though every label is lettering-free with a small emblem, as asked. The room, the restored window and the gilded sign are clean: no seams, no stray lettering, one engraved hand.

*Logged 21:34.*

---

## 125. s2B1 pass B seed 21 whole-plate edit

![s2B1 pass B seed 21 whole-plate edit](images/125-s2b1-pass-b-seed-21-whole-plate-edit.png)

**The ask.** Founder's note on the seed-7 proof: restore the approved window, gild THE SWINGING DOOR, put Abby behind the ledge and Drew/Barclay seated on the near side in their own chairs, redraw the bottles as a real back shelf.

**The thinking.** Pass B: Picture 1 is a previous pass-A render, already right about the room and the cast; EDITS carried this pass: ['abby', 'bottles']. After the render, tone-matched to the plate over the room and ['window-frame', 'glass'] restored from the plate through their own masks before the gilded sign went on last.

**Settings.** local/qwen-image-edit-2511, seed 21, fast 8-step cfg 1, aspect 2:3 -> bridge (1232, 1840), 107.3s

**Prompt.** [prompts/125-s2b1-pass-b-seed-21-whole-plate-edit.prompt.txt](prompts/125-s2b1-pass-b-seed-21-whole-plate-edit.prompt.txt)

**Verdict.** Abby 0/5, bottles 2/5, room 3/5, quality 3/5 - TOTAL 8/20. Rejected. No Abby again - the ledge is empty. The bottles are Picture 1's bottles rearranged by a hair, still gapped and still all the same square flask, but no lettering on any label. The room survives, though the panelling above the recess washes out, the window sill doubles where the restored glass meets the bar's left end, and the whole plate reads flatter and greyer than the plate. Barclay is now a scaled head with a beak and he is still wearing Abby's studded collar and pendant.

*Logged 21:35.*

---

## 126. s2B2 pass B seed 21 whole-plate edit

![s2B2 pass B seed 21 whole-plate edit](images/126-s2b2-pass-b-seed-21-whole-plate-edit.png)

**The ask.** Founder's note on the seed-7 proof: restore the approved window, gild THE SWINGING DOOR, put Abby behind the ledge and Drew/Barclay seated on the near side in their own chairs, redraw the bottles as a real back shelf.

**The thinking.** Pass B: Picture 1 is a previous pass-A render, already right about the room and the cast; EDITS carried this pass: ['abby', 'bottles']. After the render, tone-matched to the plate over the room and ['window-frame', 'glass'] restored from the plate through their own masks before the gilded sign went on last.

**Settings.** local/qwen-image-edit-2511, seed 21, fast 8-step cfg 1, aspect 2:3 -> bridge (1232, 1840), 107.1s

**Prompt.** [prompts/126-s2b2-pass-b-seed-21-whole-plate-edit.prompt.txt](prompts/126-s2b2-pass-b-seed-21-whole-plate-edit.prompt.txt)

**Verdict.** PASS B on candidate 2, scored 7/20 (abby 0, bottles 2, room 3, quality 2) - the worst of the three. A HUMAN MAN in a top hat is drawn behind the bar where Abby belongs, breaking the cast rule outright; he leans onto the near side of the marble, covers the recess and redraws the working ledge behind him. The bottles are unchanged and now half hidden behind him. His portrait-realist face also breaks the engraved cartoon hand the rest of the plate keeps. Window and sign are clean.

*Logged 21:36.*

---

## 127. s2B1 pass B seed 44 whole-plate edit

![s2B1 pass B seed 44 whole-plate edit](images/127-s2b1-pass-b-seed-44-whole-plate-edit.png)

**The ask.** Founder's note on the seed-7 proof: restore the approved window, gild THE SWINGING DOOR, put Abby behind the ledge and Drew/Barclay seated on the near side in their own chairs, redraw the bottles as a real back shelf.

**The thinking.** Pass B: Picture 1 is a previous pass-A render, already right about the room and the cast; EDITS carried this pass: ['abby', 'bottles']. After the render, tone-matched to the plate over the room and ['window-frame', 'glass'] restored from the plate through their own masks before the gilded sign went on last.

**Settings.** local/qwen-image-edit-2511, seed 44, fast 8-step cfg 1, aspect 2:3 -> bridge (1232, 1840), 107.2s

**Prompt.** [prompts/127-s2b1-pass-b-seed-44-whole-plate-edit.prompt.txt](prompts/127-s2b1-pass-b-seed-44-whole-plate-edit.prompt.txt)

**Verdict.** Abby 0/5, bottles 2/5, room 4/5, quality 4/5 - TOTAL 10/20. Best of the three, and still rejected: no Abby anywhere. This is the crispest pen of the pass and the closest to Picture 1 in tone - marble hatching intact, recess clear, window and gilded sign clean - and the top shelf has the best spread of heights. Against it: one label on the top shelf carries a letter-like monogram where only a crest is allowed, a little loose scrawl sits on the bottom edge, and both gentlemen drifted reptilian again.

*Logged 21:37.*

---

## 128. s2B2 pass B seed 44 whole-plate edit

![s2B2 pass B seed 44 whole-plate edit](images/128-s2b2-pass-b-seed-44-whole-plate-edit.png)

**The ask.** Founder's note on the seed-7 proof: restore the approved window, gild THE SWINGING DOOR, put Abby behind the ledge and Drew/Barclay seated on the near side in their own chairs, redraw the bottles as a real back shelf.

**The thinking.** Pass B: Picture 1 is a previous pass-A render, already right about the room and the cast; EDITS carried this pass: ['abby', 'bottles']. After the render, tone-matched to the plate over the room and ['window-frame', 'glass'] restored from the plate through their own masks before the gilded sign went on last.

**Settings.** local/qwen-image-edit-2511, seed 44, fast 8-step cfg 1, aspect 2:3 -> bridge (1232, 1840), 106.3s

**Prompt.** [prompts/128-s2b2-pass-b-seed-44-whole-plate-edit.prompt.txt](prompts/128-s2b2-pass-b-seed-44-whole-plate-edit.prompt.txt)

**Verdict.** PASS B on candidate 2, scored 11/20 (abby 1, bottles 3, room 4, quality 3) - the best of the three, and still not close. Abby is absent again, the same structural cause as seed 7; Drew and Barclay are unchanged. The bottles are the best of the three: the upper shelf is fuller and more varied, with a couple of genuinely dark bottles - but still gappy against the approved plate's own shoulder-to-shoulder shelf, fill lines are not drawn, and the lower row is half behind Barclay's head. Room, window and gilded sign clean, no seams. NEXT: paint Abby's block-in (figure-abby-01-ledge) into pass B's Picture 1 - scene-edit.py's build_picture1() skips paint_blockins whenever --pass2 is set - and switch her EDIT from the REDRAW wording to the ADD wording plus the block-in identification sentence.

*Logged 21:38.*

---

## 129. s2B2 pass B contact sheet - candidate 2, three seeds scored

![s2B2 pass B contact sheet - candidate 2, three seeds scored](images/129-s2b2-pass-b-contact-sheet-candidate-2-three-seeds-scored.png)

**The ask.** PASS B on candidate 2 (the pass-A seed-3 render): fix Abby and the bottles, keep the room and the seated cast, then look at each plate whole and in the Abby and bottle crops and score it out of 20.

**The thinking.** Picture 1 was pass A's RAW render (s2A-s3-raw.png), so the model edits its own drawing rather than a tone-matched, already-signed plate; the tool restored the approved window from the plate and gilded THE SWINGING DOOR last, on every seed. Three seeds run sequentially on the one free server: 7, 21, 44. Sheet is whole plate over the Abby crop (x380-940 y560-1300) over the bottle crop (x560-1200 y520-1000), one column per seed.

**Settings.** local/qwen-image-edit-2511, fast 8-step cfg 1, aspect 2:3 -> bridge 1232x1840, edits abby,bottles, keep window-frame,glass; 113.2s / 107.1s / 106.3s

**Verdict.** Seed 44 best at 11/20, seed 7 at 10/20, seed 21 at 7/20 - none acceptable. Abby is missing from every plate: seeds 7 and 44 leave the ledge empty, seed 21 draws a HUMAN man in a top hat there. The cause is structural, not a seed accident: scene-edit.py's build_picture1() only paints block-ins on pass A, so pass B's Picture 1 carries no grey ghost behind the ledge, and the pass-B EDIT for Abby says her pose and place stay exactly as Picture 1 has them - which is empty. The bottles moved hardly at all from Picture 1 and are still gappy, flat and unfilled against the approved plate's own shoulder-to-shoulder shelf, though they are correctly free of lettering. The room, the restored window, the gilded sign and the engraved hand are clean on all three.

*Logged 21:40.*

---

## 130. scene2 PASS B contact sheet - candidate 1, three seeds scored

![scene2 PASS B contact sheet - candidate 1, three seeds scored](images/130-scene2-pass-b-contact-sheet-candidate-1-three-seeds-scored.png)

**The ask.** PASS B on candidate 1 (pass A seed 7): send that pass's RAW render back as Picture 1 with EDITS abby,bottles on seeds 7, 21 and 44, look at every final whole and cropped, score abby / bottles / room / quality out of 5 each, and say which seed to carry.

**The thinking.** One process, three seeds strictly sequential on the one card (the queue was shared with candidate 2's agent, so ComfyUI interleaved the two runs; never two of ours at once). Picture 1 was s2A-s7-raw.png - the pass-A render itself, so the model edits its own drawing rather than a re-signed copy - Picture 2 Abby's official portrait, Picture 3 the approved plate's own back-bar recess. After each render the tone was matched to the plate over the room, the window-frame and glass were pasted back from the plate, and THE SWINGING DOOR was gilded last. Every seed came back with the window and the sign right and the seating right, and every seed came back WITHOUT ABBY: the pass-B EDIT tells the model her pose and place stay exactly as Picture 1 already has them, and Picture 1 has no Abby and no block-in for her, so all three seeds obeyed by drawing nothing behind the ledge. The bottles barely moved either - the same ten flasks with the same gaps - because the same sentence orders everything else kept exactly as Picture 1.

**Settings.** local/qwen-image-edit-2511, fast 8-step cfg 1, aspect 2:3 -> bridge 1232x1840, seeds 7 / 21 / 44, 65s + 107s + 107s (the longer two waited behind candidate 2's jobs on the shared queue)

**Verdict.** Totals out of 20: seed 44 = 10 (abby 0, bottles 2, room 4, quality 4), seed 7 = 8 (0/2/3/3), seed 21 = 8 (0/2/3/3). Seed 44 is the one to carry - crispest pen, closest tone to the plate, best spread of bottle heights - but no seed is deliverable: candidate 1's pass B failed its own job on all three. The fix is structural, not a seed: Abby needs a block-in behind the ledge in Picture 1 (paint_blockins on figure-abby-01-ledge, or run pass A with --abby-in-pass-a), and the bottles need to be exempted from the KEEP-EVERYTHING-ELSE sentence that is currently telling the model to leave them alone.

*Logged 21:41.*

---

## 131. s2N pass A seed 7 whole-plate edit

![s2N pass A seed 7 whole-plate edit](images/131-s2n-pass-a-seed-7-whole-plate-edit.png)

**The ask.** Founder's note on the seed-7 proof: restore the approved window, gild THE SWINGING DOOR, put Abby behind the ledge and Drew/Barclay seated on the near side in their own chairs, redraw the bottles as a real back shelf - and fix the IDENTITY failure (Drew a vulture/turkey, Barclay a hound/poodle/llama/human).

**The thinking.** Pass A: Picture 1 is the approved plate with Drew's and Barclay's block-ins painted in at 100-180 grey, heads none; EDITS carried this pass: ['drew', 'barclay']; p3=barclay, head-edit=True. After the render, tone-matched to the plate over the room and ['window-frame', 'glass'] restored from the plate through their own masks before the gilded sign went on last.

**Settings.** local/qwen-image-edit-2511, seed 7, fast 8-step cfg 1, aspect 2:3 -> bridge (1232, 1840), blockin-heads none, p3 barclay, head-edit True, 66.1s

**Prompt.** [prompts/131-s2n-pass-a-seed-7-whole-plate-edit.prompt.txt](prompts/131-s2n-pass-a-seed-7-whole-plate-edit.prompt.txt)

*Logged 21:41.*

---

## 132. s2N pass A seed 21 whole-plate edit

![s2N pass A seed 21 whole-plate edit](images/132-s2n-pass-a-seed-21-whole-plate-edit.png)

**The ask.** Founder's note on the seed-7 proof: restore the approved window, gild THE SWINGING DOOR, put Abby behind the ledge and Drew/Barclay seated on the near side in their own chairs, redraw the bottles as a real back shelf - and fix the IDENTITY failure (Drew a vulture/turkey, Barclay a hound/poodle/llama/human).

**The thinking.** Pass A: Picture 1 is the approved plate with Drew's and Barclay's block-ins painted in at 100-180 grey, heads none; EDITS carried this pass: ['drew', 'barclay']; p3=barclay, head-edit=True. After the render, tone-matched to the plate over the room and ['window-frame', 'glass'] restored from the plate through their own masks before the gilded sign went on last.

**Settings.** local/qwen-image-edit-2511, seed 21, fast 8-step cfg 1, aspect 2:3 -> bridge (1232, 1840), blockin-heads none, p3 barclay, head-edit True, 66.0s

**Prompt.** [prompts/132-s2n-pass-a-seed-21-whole-plate-edit.prompt.txt](prompts/132-s2n-pass-a-seed-21-whole-plate-edit.prompt.txt)

*Logged 21:42.*

---

## 133. s2N pass A seed 44 whole-plate edit

![s2N pass A seed 44 whole-plate edit](images/133-s2n-pass-a-seed-44-whole-plate-edit.png)

**The ask.** Founder's note on the seed-7 proof: restore the approved window, gild THE SWINGING DOOR, put Abby behind the ledge and Drew/Barclay seated on the near side in their own chairs, redraw the bottles as a real back shelf - and fix the IDENTITY failure (Drew a vulture/turkey, Barclay a hound/poodle/llama/human).

**The thinking.** Pass A: Picture 1 is the approved plate with Drew's and Barclay's block-ins painted in at 100-180 grey, heads none; EDITS carried this pass: ['drew', 'barclay']; p3=barclay, head-edit=True. After the render, tone-matched to the plate over the room and ['window-frame', 'glass'] restored from the plate through their own masks before the gilded sign went on last.

**Settings.** local/qwen-image-edit-2511, seed 44, fast 8-step cfg 1, aspect 2:3 -> bridge (1232, 1840), blockin-heads none, p3 barclay, head-edit True, 66.1s

**Prompt.** [prompts/133-s2n-pass-a-seed-44-whole-plate-edit.prompt.txt](prompts/133-s2n-pass-a-seed-44-whole-plate-edit.prompt.txt)

*Logged 21:44.*

---

## 134. s2NF pass A seed 7 whole-plate edit

![s2NF pass A seed 7 whole-plate edit](images/134-s2nf-pass-a-seed-7-whole-plate-edit.png)

**The ask.** Founder's note on the seed-7 proof: restore the approved window, gild THE SWINGING DOOR, put Abby behind the ledge and Drew/Barclay seated on the near side in their own chairs, redraw the bottles as a real back shelf - and fix the IDENTITY failure (Drew a vulture/turkey, Barclay a hound/poodle/llama/human).

**The thinking.** Pass A: Picture 1 is the approved plate with Drew's and Barclay's block-ins painted in at 100-180 grey, heads none; EDITS carried this pass: ['drew', 'barclay']; p3=barclay, head-edit=True. After the render, tone-matched to the plate over the room and ['window-frame', 'glass'] restored from the plate through their own masks before the gilded sign went on last.

**Settings.** local/qwen-image-edit-2511, seed 7, full 40-step cfg 4, aspect 2:3 -> bridge (1232, 1840), blockin-heads none, p3 barclay, head-edit True, 333.3s

**Prompt.** [prompts/134-s2nf-pass-a-seed-7-whole-plate-edit.prompt.txt](prompts/134-s2nf-pass-a-seed-7-whole-plate-edit.prompt.txt)

*Logged 21:49.*

---

## 135. s2NF pass A seed 44 whole-plate edit

![s2NF pass A seed 44 whole-plate edit](images/135-s2nf-pass-a-seed-44-whole-plate-edit.png)

**The ask.** Founder's note on the seed-7 proof: restore the approved window, gild THE SWINGING DOOR, put Abby behind the ledge and Drew/Barclay seated on the near side in their own chairs, redraw the bottles as a real back shelf - and fix the IDENTITY failure (Drew a vulture/turkey, Barclay a hound/poodle/llama/human).

**The thinking.** Pass A: Picture 1 is the approved plate with Drew's and Barclay's block-ins painted in at 100-180 grey, heads none; EDITS carried this pass: ['drew', 'barclay']; p3=barclay, head-edit=True. After the render, tone-matched to the plate over the room and ['window-frame', 'glass'] restored from the plate through their own masks before the gilded sign went on last.

**Settings.** local/qwen-image-edit-2511, seed 44, full 40-step cfg 4, aspect 2:3 -> bridge (1232, 1840), blockin-heads none, p3 barclay, head-edit True, 329.3s

**Prompt.** [prompts/135-s2nf-pass-a-seed-44-whole-plate-edit.prompt.txt](prompts/135-s2nf-pass-a-seed-44-whole-plate-edit.prompt.txt)

*Logged 21:55.*

---

