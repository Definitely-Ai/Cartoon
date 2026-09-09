# The Swinging Door - studio report, 2026-09-09

Built for Rick. Every image the studio generated today, in the order it happened, with the ask that drove it, the thinking behind the decision, the exact prompt and settings, and the verdict. Images are in `images/`, prompts in `prompts/`.

## 001. Drew own-hand four-view reference sheet, seed 7 - strategy (a) test

![Drew own-hand four-view reference sheet, seed 7 - strategy (a) test](images/001-drew-own-hand-four-view-reference-sheet-seed-7-strategy-a-test.png)

**The ask.** regenerate Abby, Drew and Barclay using reference photos and descriptions since this is a different image generation model - test whether the house model can draw its own reference sheet for one character first

**The thinking.** Picture 1 is a white 4:5 sheet drawn in code with four EMPTY ruled panels and four printed labels (1 FRONT, 2 THREE-QUARTER, 3 BACK, 4 HEAD CLOSE-UP); Picture 2 is the official portrait canon/vision/studies/drew.png as a loose identity reference only; the written description travels in the prompt (canon's own DREW paragraph from MASTER-PROMPT.md plus the anchors in canon/characters/flamingo/DESCRIPTION.md), never as a picture. Six numbered EDITS, one per panel plus a same-individual rule and a keep-the-sheet rule. No room, no props, no ground.

**Settings.** local/qwen-image-edit-2511, seed 7, fast 8-step cfg 1, 4:5 1344x1680, 2 references (code sheet + drew.png), 42.4s

**Prompt.** [prompts/001-drew-own-hand-four-view-reference-sheet-seed-7-strategy-a-test.prompt.txt](prompts/001-drew-own-hand-four-view-reference-sheet-seed-7-strategy-a-test.prompt.txt)

**Verdict.** BEST IDENTITY, WORST CAMERAS. The four panels, four rules and four labels all survive and the labels are correctly spelled - the only seed where they do. Identity is excellent and consistent across all four panels: same bird, same knit vest, same bow tie, same slender pale bill with the black outer third, same heavy-lidded eye, engraved dash-stroke plumage throughout. But every panel is a BUST cropped at the belt - canon's own crop-at-the-counter law beat edits 1-3 - so there is no full figure, no trousers below the waistband and no shoes anywhere. Panel 1 (FRONT) is a profile, not a front; panel 3 (BACK) is a three-quarter rear with the face still showing, not a back. A martini appears in panel 2 although it was forbidden in the edit and in the negative - the fast Lightning pass runs at cfg 1 and never reads the negative. Panel 4 (HEAD CLOSE-UP) is the strongest single drawing of Drew's head the studio has: approvable on its own.

*Logged 00:01.*

---

## 002. Drew own-hand four-view reference sheet, seed 21 - strategy (a) test

![Drew own-hand four-view reference sheet, seed 21 - strategy (a) test](images/002-drew-own-hand-four-view-reference-sheet-seed-21-strategy-a-test.png)

**The ask.** same ask, second seed: can the house model hold a four-panel model sheet at all, or does the panel grid depend on the seed

**The thinking.** Identical prompt and identical two references to seed 7 - only the seed changed - so any difference between the two is the sampler's freedom at cfg 1, not the brief.

**Settings.** local/qwen-image-edit-2511, seed 21, fast 8-step cfg 1, 4:5 1344x1680, 2 references (code sheet + drew.png), 42.5s

**Prompt.** [prompts/002-drew-own-hand-four-view-reference-sheet-seed-21-strategy-a-test.prompt.txt](prompts/002-drew-own-hand-four-view-reference-sheet-seed-21-strategy-a-test.prompt.txt)

**Verdict.** GRID COLLAPSED. The model ignored the four-panel division and drew TWO full-length figures, each spanning a whole column - torso in the top panel, legs and shoes in the bottom one - so the bottom row's two panels hold nothing but trousers. Two of the four printed labels came back as garbled type ('2 MREHIALSQ', '1 THERWAKER BACK'), which is a hard fail against the house rule that lettering is never left to the model. Neither figure is a back view and both hold or reach for a martini. The one useful finding: the full figure with trousers and shoes IS drawable - the model simply needs a panel tall enough to take it, and a 592x706 panel is not.

*Logged 00:01.*

---

## 003. Drew own-hand four-view reference sheet, seed 41 - strategy (a) test

![Drew own-hand four-view reference sheet, seed 41 - strategy (a) test](images/003-drew-own-hand-four-view-reference-sheet-seed-41-strategy-a-test.png)

**The ask.** same ask, third seed: is a true front and a true back view reachable on this sheet

**The thinking.** Identical prompt and references again, seed 41 only - the third of the three rolls that decide whether strategy (a) is worth building out.

**Settings.** local/qwen-image-edit-2511, seed 41, fast 8-step cfg 1, 4:5 1344x1680, 2 references (code sheet + drew.png), 40.5s

**Prompt.** [prompts/003-drew-own-hand-four-view-reference-sheet-seed-41-strategy-a-test.prompt.txt](prompts/003-drew-own-hand-four-view-reference-sheet-seed-41-strategy-a-test.prompt.txt)

**Verdict.** BEST STRUCTURE, ONE PANEL FERAL. The grid held, and this is the only seed that answered the brief: panel 1 is a TRUE full-length front view, head to shoes, trousers and dark shoes on his feet; panel 3 is a TRUE full-length back view with no face visible, the ribbed back of the sweater vest and the collar above it - exactly what was asked; panel 4 is a large clean head close-up with the bill, nostril slit and heavy-lidded eye all right. Panel 2 failed outright: it reverted to a LITERAL flamingo - a wading bird on two stick legs with a folded wing and a martini - which is the same regression (bird, not gentleman) the studio has hit before. One label came back as garbled type ('4 HIVSP DUD-CINSY - NIP'). Three of four panels here are approvable as they stand.

*Logged 00:01.*

---

## 004. Contact sheet - Drew own-hand reference sheets, three seeds against the portrait and the empty sheet

![Contact sheet - Drew own-hand reference sheets, three seeds against the portrait and the empty sheet](images/004-contact-sheet-drew-own-hand-reference-sheets-three-seeds-against-the-portrait-and-the-empty-sheet.png)

**The ask.** judge the strategy (a) test as a set and say whether the house model can produce a usable own-hand reference sheet

**The thinking.** The official portrait, the code-drawn empty Picture 1 and the three renders in one row, captioned in code so the comparison is on the page and not in a paragraph. Read left to right: what the strip has now, what the model was handed, and the three things it gave back.

**Settings.** composited in code from the three finished renders; no GPU

**Verdict.** YES, WITH ONE CHANGE OF SHAPE. No single seed is approvable whole, but every seed produced at least two approvable panels, and between them the three cover every camera asked for: seed 41 gives a true front, a true back and a good head; seed 7 gives the best identity and the cleanest head-and-bill; seed 21 proves the full figure with shoes is drawable when the panel is tall enough. What the model cannot do is hold FOUR cameras in ONE render - the failures are all cross-panel (grid collapse, one panel going feral, labels garbling). So the sheet should be drawn ONE PANEL PER RENDER, one camera at a time, and composited in code, which is also exactly the founder's one-object-at-a-time approval rule. Prop leakage (the martini in two of three sheets) and label garbling are both cfg-1 problems: the negative is not read at cfg 1, and lettering must be re-stamped in code after the render, never left to the model.

*Logged 00:01.*

---

## 005. s3A-cfg175 bottles-crop seed 21 recess-only edit

![s3A-cfg175 bottles-crop seed 21 recess-only edit](images/005-s3a-cfg175-bottles-crop-seed-21-recess-only-edit.png)

**The ask.** Redraw the bottles as a real back shelf without risking the room, the window or the seated cast that a whole-plate re-roll would put at risk.

**The thinking.** Picture 1 is a 4:5 crop of the recess alone from plate (box (427, 284, 1186, 1233)); Picture 2 is the look reference duo-shelf-ref2.png. After the render, the crop was scaled back and tone-matched to the ring just outside the recess (room-part.py's own tone_match, gain 1.14 offset -16), then pasted through the feathered union of the recess's five masks; ['window-frame', 'glass'] restored from the plate before the gilded sign went on last.

**Settings.** local/qwen-image-edit-2511, seed 21, fast 8-step cfg 1 [cfg override -> 1.75] [negative override], actual steps=8 cfg=1.75 sampler=euler, crop (427, 284, 1186, 1233) -> 4:5, bottles-p2 plate, bottles-ref True, match-keep False, 74.5s

**Prompt.** [prompts/005-s3a-cfg175-bottles-crop-seed-21-recess-only-edit.prompt.txt](prompts/005-s3a-cfg175-bottles-crop-seed-21-recess-only-edit.prompt.txt)

*Logged 00:02.*

---

## 006. s3A-cfg175 bottles-crop seed 44 recess-only edit

![s3A-cfg175 bottles-crop seed 44 recess-only edit](images/006-s3a-cfg175-bottles-crop-seed-44-recess-only-edit.png)

**The ask.** Redraw the bottles as a real back shelf without risking the room, the window or the seated cast that a whole-plate re-roll would put at risk.

**The thinking.** Picture 1 is a 4:5 crop of the recess alone from plate (box (427, 284, 1186, 1233)); Picture 2 is the look reference duo-shelf-ref2.png. After the render, the crop was scaled back and tone-matched to the ring just outside the recess (room-part.py's own tone_match, gain 1.07 offset -9), then pasted through the feathered union of the recess's five masks; ['window-frame', 'glass'] restored from the plate before the gilded sign went on last.

**Settings.** local/qwen-image-edit-2511, seed 44, fast 8-step cfg 1 [cfg override -> 1.75] [negative override], actual steps=8 cfg=1.75 sampler=euler, crop (427, 284, 1186, 1233) -> 4:5, bottles-p2 plate, bottles-ref True, match-keep False, 74.2s

**Prompt.** [prompts/006-s3a-cfg175-bottles-crop-seed-44-recess-only-edit.prompt.txt](prompts/006-s3a-cfg175-bottles-crop-seed-44-recess-only-edit.prompt.txt)

*Logged 00:04.*

---

## 007. s3B-20-25 bottles-crop seed 21 recess-only edit

![s3B-20-25 bottles-crop seed 21 recess-only edit](images/007-s3b-20-25-bottles-crop-seed-21-recess-only-edit.png)

**The ask.** Redraw the bottles as a real back shelf without risking the room, the window or the seated cast that a whole-plate re-roll would put at risk.

**The thinking.** Picture 1 is a 4:5 crop of the recess alone from plate (box (427, 284, 1186, 1233)); Picture 2 is the look reference duo-shelf-ref2.png. After the render, the crop was scaled back and tone-matched to the ring just outside the recess (room-part.py's own tone_match, gain 1.14 offset -17), then pasted through the feathered union of the recess's five masks; ['window-frame', 'glass'] restored from the plate before the gilded sign went on last.

**Settings.** local/qwen-image-edit-2511, seed 21, full 30-step cfg 4 [steps override -> 20] [cfg override -> 2.5] [negative override], actual steps=20 cfg=2.5 sampler=euler, crop (427, 284, 1186, 1233) -> 4:5, bottles-p2 plate, bottles-ref True, match-keep False, 151.1s

**Prompt.** [prompts/007-s3b-20-25-bottles-crop-seed-21-recess-only-edit.prompt.txt](prompts/007-s3b-20-25-bottles-crop-seed-21-recess-only-edit.prompt.txt)

*Logged 00:06.*

---

## 008. s3B-20-25 bottles-crop seed 44 recess-only edit

![s3B-20-25 bottles-crop seed 44 recess-only edit](images/008-s3b-20-25-bottles-crop-seed-44-recess-only-edit.png)

**The ask.** Redraw the bottles as a real back shelf without risking the room, the window or the seated cast that a whole-plate re-roll would put at risk.

**The thinking.** Picture 1 is a 4:5 crop of the recess alone from plate (box (427, 284, 1186, 1233)); Picture 2 is the look reference duo-shelf-ref2.png. After the render, the crop was scaled back and tone-matched to the ring just outside the recess (room-part.py's own tone_match, gain 1.14 offset -17), then pasted through the feathered union of the recess's five masks; ['window-frame', 'glass'] restored from the plate before the gilded sign went on last.

**Settings.** local/qwen-image-edit-2511, seed 44, full 30-step cfg 4 [steps override -> 20] [cfg override -> 2.5] [negative override], actual steps=20 cfg=2.5 sampler=euler, crop (427, 284, 1186, 1233) -> 4:5, bottles-p2 plate, bottles-ref True, match-keep False, 154.9s

**Prompt.** [prompts/008-s3b-20-25-bottles-crop-seed-44-recess-only-edit.prompt.txt](prompts/008-s3b-20-25-bottles-crop-seed-44-recess-only-edit.prompt.txt)

*Logged 00:09.*

---

## 009. s3C-28-3 bottles-crop seed 21 recess-only edit

![s3C-28-3 bottles-crop seed 21 recess-only edit](images/009-s3c-28-3-bottles-crop-seed-21-recess-only-edit.png)

**The ask.** Redraw the bottles as a real back shelf without risking the room, the window or the seated cast that a whole-plate re-roll would put at risk.

**The thinking.** Picture 1 is a 4:5 crop of the recess alone from plate (box (427, 284, 1186, 1233)); Picture 2 is the look reference duo-shelf-ref2.png. After the render, the crop was scaled back and tone-matched to the ring just outside the recess (room-part.py's own tone_match, gain 1.14 offset -18), then pasted through the feathered union of the recess's five masks; ['window-frame', 'glass'] restored from the plate before the gilded sign went on last.

**Settings.** local/qwen-image-edit-2511, seed 21, full 30-step cfg 4 [steps override -> 28] [cfg override -> 3.0] [negative override], actual steps=28 cfg=3.0 sampler=euler, crop (427, 284, 1186, 1233) -> 4:5, bottles-p2 plate, bottles-ref True, match-keep False, 205.4s

**Prompt.** [prompts/009-s3c-28-3-bottles-crop-seed-21-recess-only-edit.prompt.txt](prompts/009-s3c-28-3-bottles-crop-seed-21-recess-only-edit.prompt.txt)

*Logged 00:13.*

---

## 010. s3C-28-3 bottles-crop seed 44 recess-only edit

![s3C-28-3 bottles-crop seed 44 recess-only edit](images/010-s3c-28-3-bottles-crop-seed-44-recess-only-edit.png)

**The ask.** Redraw the bottles as a real back shelf without risking the room, the window or the seated cast that a whole-plate re-roll would put at risk.

**The thinking.** Picture 1 is a 4:5 crop of the recess alone from plate (box (427, 284, 1186, 1233)); Picture 2 is the look reference duo-shelf-ref2.png. After the render, the crop was scaled back and tone-matched to the ring just outside the recess (room-part.py's own tone_match, gain 1.14 offset -18), then pasted through the feathered union of the recess's five masks; ['window-frame', 'glass'] restored from the plate before the gilded sign went on last.

**Settings.** local/qwen-image-edit-2511, seed 44, full 30-step cfg 4 [steps override -> 28] [cfg override -> 3.0] [negative override], actual steps=28 cfg=3.0 sampler=euler, crop (427, 284, 1186, 1233) -> 4:5, bottles-p2 plate, bottles-ref True, match-keep False, 206.6s

**Prompt.** [prompts/010-s3c-28-3-bottles-crop-seed-44-recess-only-edit.prompt.txt](prompts/010-s3c-28-3-bottles-crop-seed-44-recess-only-edit.prompt.txt)

*Logged 00:17.*

---

## 011. S2 bottle library - bourbon seed 101 (fast 8-step cfg1)

![S2 bottle library - bourbon seed 101 (fast 8-step cfg1)](images/011-s2-bottle-library-bourbon-seed-101-fast-8-step-cfg1.png)

**The ask.** STRATEGY S2 - a bottle library placed by code: draw one bottle at a time on plain white paper (a faint guide silhouette from BOTTLE_KINDS as Picture 1, the duo shelf crop as the Picture-2 hand reference), key each into a sticker, then place the library on the approved plate's two shelves in code using labels.json's own slot geometry plus a synthesised second rank, with contact shadows and a cast shadow drawn in code (scripts/draw-room-lines.py's own cast()).

**The thinking.** First roll of the library, fast Lightning 8-step/cfg1 (house default). Bottle shape and engraving quality were good and the white page keyed cleanly, but the label carried more than the one crest asked for.

**Settings.** local/qwen-image-edit-2511, seed 101, fast Lightning 8-step cfg1, 4:5 1344x1680 | Picture 1 = plain white page + faint grey BOTTLE_KINDS silhouette guide (gen_sheets.py), Picture 2 = canon/plates/duo.png shelf crop x380-980 y450-1000 (hand reference only) | never Replicate, AuraVision bridge -> ComfyUI

**Prompt.** [prompts/011-s2-bottle-library-bourbon-seed-101-fast-8-step-cfg1.prompt.txt](prompts/011-s2-bottle-library-bourbon-seed-101-fast-8-step-cfg1.prompt.txt)

**Verdict.** REJECT - the label's second panel came back with clear letter-like marks ('OA', a cross-like glyph, a dot) under the crest; reroll needed.

*Logged 00:38.*

---

## 012. S2 bottle library - bourbon seed 202 (full 40-step cfg4)

![S2 bottle library - bourbon seed 202 (full 40-step cfg4)](images/012-s2-bottle-library-bourbon-seed-202-full-40-step-cfg4.png)

**The ask.** STRATEGY S2 - a bottle library placed by code: draw one bottle at a time on plain white paper (a faint guide silhouette from BOTTLE_KINDS as Picture 1, the duo shelf crop as the Picture-2 hand reference), key each into a sticker, then place the library on the approved plate's two shelves in code using labels.json's own slot geometry plus a synthesised second rank, with contact shadows and a cast shadow drawn in code (scripts/draw-room-lines.py's own cast()).

**The thinking.** Tried --full to see whether cfg4 (which reads negatives, unlike fast/cfg1) would stop the label drifting into pseudo-text. It helped the label but broke the one assumption the whole pipeline leans on: a plain white page to key against.

**Settings.** local/qwen-image-edit-2511, seed 202, full 40-step cfg4, 4:5 1344x1680 | Picture 1 = plain white page + faint grey BOTTLE_KINDS silhouette guide (gen_sheets.py), Picture 2 = canon/plates/duo.png shelf crop x380-980 y450-1000 (hand reference only) | never Replicate, AuraVision bridge -> ComfyUI

**Prompt.** [prompts/012-s2-bottle-library-bourbon-seed-202-full-40-step-cfg4.prompt.txt](prompts/012-s2-bottle-library-bourbon-seed-202-full-40-step-cfg4.prompt.txt)

**Verdict.** REJECT - full 40-step/cfg4 honoured the no-lettering negative better (only a tiny illegible microprint survived) but drew a full hatched studio background + floor reflection across the whole page instead of plain white, defeating the flood-fill keying this library depends on.

*Logged 00:38.*

---

## 013. S2 bottle library - bourbon seed 303 (fast 8-step cfg1)

![S2 bottle library - bourbon seed 303 (fast 8-step cfg1)](images/013-s2-bottle-library-bourbon-seed-303-fast-8-step-cfg1.png)

**The ask.** STRATEGY S2 - a bottle library placed by code: draw one bottle at a time on plain white paper (a faint guide silhouette from BOTTLE_KINDS as Picture 1, the duo shelf crop as the Picture-2 hand reference), key each into a sticker, then place the library on the approved plate's two shelves in code using labels.json's own slot geometry plus a synthesised second rank, with contact shadows and a cast shadow drawn in code (scripts/draw-room-lines.py's own cast()).

**The thinking.** Same fast recipe as s101 but with the label EDIT rewritten as ONE undivided panel that is explicitly blank beneath the crest - a positive instruction, which fast/cfg1 DOES read even though it ignores the negative list. Worked on the first try.

**Settings.** local/qwen-image-edit-2511, seed 303, fast Lightning 8-step cfg1, 4:5 1344x1680 | Picture 1 = plain white page + faint grey BOTTLE_KINDS silhouette guide (gen_sheets.py), Picture 2 = canon/plates/duo.png shelf crop x380-980 y450-1000 (hand reference only) | never Replicate, AuraVision bridge -> ComfyUI

**Prompt.** [prompts/013-s2-bottle-library-bourbon-seed-303-fast-8-step-cfg1.prompt.txt](prompts/013-s2-bottle-library-bourbon-seed-303-fast-8-step-cfg1.prompt.txt)

**Verdict.** ACCEPT - clean crest (wreath+star), one rule line, blank paper otherwise, no lettering anywhere. Final bourbon sticker.

*Logged 00:38.*

---

## 014. S2 bottle library - rye seed 304 (fast 8-step cfg1)

![S2 bottle library - rye seed 304 (fast 8-step cfg1)](images/014-s2-bottle-library-rye-seed-304-fast-8-step-cfg1.png)

**The ask.** STRATEGY S2 - a bottle library placed by code: draw one bottle at a time on plain white paper (a faint guide silhouette from BOTTLE_KINDS as Picture 1, the duo shelf crop as the Picture-2 hand reference), key each into a sticker, then place the library on the approved plate's two shelves in code using labels.json's own slot geometry plus a synthesised second rank, with contact shadows and a cast shadow drawn in code (scripts/draw-room-lines.py's own cast()).

**The thinking.** Same house prompt template, new kind description and BOTTLE_KINDS silhouette guide.

**Settings.** local/qwen-image-edit-2511, seed 304, fast Lightning 8-step cfg1, 4:5 1344x1680 | Picture 1 = plain white page + faint grey BOTTLE_KINDS silhouette guide (gen_sheets.py), Picture 2 = canon/plates/duo.png shelf crop x380-980 y450-1000 (hand reference only) | never Replicate, AuraVision bridge -> ComfyUI

**Prompt.** [prompts/014-s2-bottle-library-rye-seed-304-fast-8-step-cfg1.prompt.txt](prompts/014-s2-bottle-library-rye-seed-304-fast-8-step-cfg1.prompt.txt)

**Verdict.** ACCEPT - bulbous tall-neck rye, one crest, no lettering. Also stands in for the shelf's 'scotch' slots (same oval tall-neck family).

*Logged 00:38.*

---

## 015. S2 bottle library - rum seed 305 (fast 8-step cfg1)

![S2 bottle library - rum seed 305 (fast 8-step cfg1)](images/015-s2-bottle-library-rum-seed-305-fast-8-step-cfg1.png)

**The ask.** STRATEGY S2 - a bottle library placed by code: draw one bottle at a time on plain white paper (a faint guide silhouette from BOTTLE_KINDS as Picture 1, the duo shelf crop as the Picture-2 hand reference), key each into a sticker, then place the library on the approved plate's two shelves in code using labels.json's own slot geometry plus a synthesised second rank, with contact shadows and a cast shadow drawn in code (scripts/draw-room-lines.py's own cast()).

**The thinking.** Same template.

**Settings.** local/qwen-image-edit-2511, seed 305, fast Lightning 8-step cfg1, 4:5 1344x1680 | Picture 1 = plain white page + faint grey BOTTLE_KINDS silhouette guide (gen_sheets.py), Picture 2 = canon/plates/duo.png shelf crop x380-980 y450-1000 (hand reference only) | never Replicate, AuraVision bridge -> ComfyUI

**Prompt.** [prompts/015-s2-bottle-library-rum-seed-305-fast-8-step-cfg1.prompt.txt](prompts/015-s2-bottle-library-rum-seed-305-fast-8-step-cfg1.prompt.txt)

**Verdict.** ACCEPT - broad squat flagon, one crest (off-centre but singular), no lettering. Also stands in for 'sherry' (both squat/dark/wide).

*Logged 00:38.*

---

## 016. S2 bottle library - gin seed 306 (fast 8-step cfg1)

![S2 bottle library - gin seed 306 (fast 8-step cfg1)](images/016-s2-bottle-library-gin-seed-306-fast-8-step-cfg1.png)

**The ask.** STRATEGY S2 - a bottle library placed by code: draw one bottle at a time on plain white paper (a faint guide silhouette from BOTTLE_KINDS as Picture 1, the duo shelf crop as the Picture-2 hand reference), key each into a sticker, then place the library on the approved plate's two shelves in code using labels.json's own slot geometry plus a synthesised second rank, with contact shadows and a cast shadow drawn in code (scripts/draw-room-lines.py's own cast()).

**The thinking.** A cheap fix once pixel-level control is available: rather than reroll for one ambiguous device, remove it and keep the clean crest that was already there beside it.

**Settings.** local/qwen-image-edit-2511, seed 306, fast Lightning 8-step cfg1, 4:5 1344x1680 | Picture 1 = plain white page + faint grey BOTTLE_KINDS silhouette guide (gen_sheets.py), Picture 2 = canon/plates/duo.png shelf crop x380-980 y450-1000 (hand reference only) | never Replicate, AuraVision bridge -> ComfyUI

**Prompt.** [prompts/016-s2-bottle-library-gin-seed-306-fast-8-step-cfg1.prompt.txt](prompts/016-s2-bottle-library-gin-seed-306-fast-8-step-cfg1.prompt.txt)

**Verdict.** ACCEPT after a code retouch - the render came back with TWO circular devices on the label, the second one reading like a stylised 'U'/coin-legend; painted out in code (sampled the paper tone and flattened that one device), keeping the star/compass crest alone. No render spent. Also stands in for 'tequila'.

*Logged 00:38.*

---

## 017. S2 bottle library - vodka seed 307 (fast 8-step cfg1)

![S2 bottle library - vodka seed 307 (fast 8-step cfg1)](images/017-s2-bottle-library-vodka-seed-307-fast-8-step-cfg1.png)

**The ask.** STRATEGY S2 - a bottle library placed by code: draw one bottle at a time on plain white paper (a faint guide silhouette from BOTTLE_KINDS as Picture 1, the duo shelf crop as the Picture-2 hand reference), key each into a sticker, then place the library on the approved plate's two shelves in code using labels.json's own slot geometry plus a synthesised second rank, with contact shadows and a cast shadow drawn in code (scripts/draw-room-lines.py's own cast()).

**The thinking.** Same template.

**Settings.** local/qwen-image-edit-2511, seed 307, fast Lightning 8-step cfg1, 4:5 1344x1680 | Picture 1 = plain white page + faint grey BOTTLE_KINDS silhouette guide (gen_sheets.py), Picture 2 = canon/plates/duo.png shelf crop x380-980 y450-1000 (hand reference only) | never Replicate, AuraVision bridge -> ComfyUI

**Prompt.** [prompts/017-s2-bottle-library-vodka-seed-307-fast-8-step-cfg1.prompt.txt](prompts/017-s2-bottle-library-vodka-seed-307-fast-8-step-cfg1.prompt.txt)

**Verdict.** ACCEPT - the tallest, slimmest bottle in the library, one shield crest, no lettering on the bottle itself (some faint blueprint-like scribble scattered in the BACKGROUND, well outside the bottle's own silhouette, dropped automatically by the keying). Also stands in for 'triple_sec'.

*Logged 00:38.*

---

## 018. S2 bottle library - whiskey seed 308 (fast 8-step cfg1)

![S2 bottle library - whiskey seed 308 (fast 8-step cfg1)](images/018-s2-bottle-library-whiskey-seed-308-fast-8-step-cfg1.png)

**The ask.** STRATEGY S2 - a bottle library placed by code: draw one bottle at a time on plain white paper (a faint guide silhouette from BOTTLE_KINDS as Picture 1, the duo shelf crop as the Picture-2 hand reference), key each into a sticker, then place the library on the approved plate's two shelves in code using labels.json's own slot geometry plus a synthesised second rank, with contact shadows and a cast shadow drawn in code (scripts/draw-room-lines.py's own cast()).

**The thinking.** An unlucky seed on an otherwise-proven prompt - rerolled rather than accepted.

**Settings.** local/qwen-image-edit-2511, seed 308, fast Lightning 8-step cfg1, 4:5 1344x1680 | Picture 1 = plain white page + faint grey BOTTLE_KINDS silhouette guide (gen_sheets.py), Picture 2 = canon/plates/duo.png shelf crop x380-980 y450-1000 (hand reference only) | never Replicate, AuraVision bridge -> ComfyUI

**Prompt.** [prompts/018-s2-bottle-library-whiskey-seed-308-fast-8-step-cfg1.prompt.txt](prompts/018-s2-bottle-library-whiskey-seed-308-fast-8-step-cfg1.prompt.txt)

**Verdict.** REJECT - a fully legible fake word ('FAIOPAC') plus corner marks and letters inside the crest ('JE'). Reroll.

*Logged 00:38.*

---

## 019. S2 bottle library - whiskey seed 408 (fast 8-step cfg1)

![S2 bottle library - whiskey seed 408 (fast 8-step cfg1)](images/019-s2-bottle-library-whiskey-seed-408-fast-8-step-cfg1.png)

**The ask.** STRATEGY S2 - a bottle library placed by code: draw one bottle at a time on plain white paper (a faint guide silhouette from BOTTLE_KINDS as Picture 1, the duo shelf crop as the Picture-2 hand reference), key each into a sticker, then place the library on the approved plate's two shelves in code using labels.json's own slot geometry plus a synthesised second rank, with contact shadows and a cast shadow drawn in code (scripts/draw-room-lines.py's own cast()).

**The thinking.** Reroll of s308 at a new seed. Came back almost clean; the one small corner blemish was cheaper to retouch than to spend another render on.

**Settings.** local/qwen-image-edit-2511, seed 408, fast Lightning 8-step cfg1, 4:5 1344x1680 | Picture 1 = plain white page + faint grey BOTTLE_KINDS silhouette guide (gen_sheets.py), Picture 2 = canon/plates/duo.png shelf crop x380-980 y450-1000 (hand reference only) | never Replicate, AuraVision bridge -> ComfyUI

**Prompt.** [prompts/019-s2-bottle-library-whiskey-seed-408-fast-8-step-cfg1.prompt.txt](prompts/019-s2-bottle-library-whiskey-seed-408-fast-8-step-cfg1.prompt.txt)

**Verdict.** ACCEPT after a small code retouch - clean crest, no lettering on the label proper, but a tiny illegible print-like squiggle in the label's bottom corner was painted out (sampled local tone, flattened a small patch). Final whiskey sticker.

*Logged 00:38.*

---

## 020. S2 bottle library - brandy seed 309 (fast 8-step cfg1)

![S2 bottle library - brandy seed 309 (fast 8-step cfg1)](images/020-s2-bottle-library-brandy-seed-309-fast-8-step-cfg1.png)

**The ask.** STRATEGY S2 - a bottle library placed by code: draw one bottle at a time on plain white paper (a faint guide silhouette from BOTTLE_KINDS as Picture 1, the duo shelf crop as the Picture-2 hand reference), key each into a sticker, then place the library on the approved plate's two shelves in code using labels.json's own slot geometry plus a synthesised second rank, with contact shadows and a cast shadow drawn in code (scripts/draw-room-lines.py's own cast()).

**The thinking.** Same template.

**Settings.** local/qwen-image-edit-2511, seed 309, fast Lightning 8-step cfg1, 4:5 1344x1680 | Picture 1 = plain white page + faint grey BOTTLE_KINDS silhouette guide (gen_sheets.py), Picture 2 = canon/plates/duo.png shelf crop x380-980 y450-1000 (hand reference only) | never Replicate, AuraVision bridge -> ComfyUI

**Prompt.** [prompts/020-s2-bottle-library-brandy-seed-309-fast-8-step-cfg1.prompt.txt](prompts/020-s2-bottle-library-brandy-seed-309-fast-8-step-cfg1.prompt.txt)

**Verdict.** ACCEPT - round-shouldered cognac-style body, one main crest plus a small repeated seal near the divider (same star motif, not lettering) - kept as is. A stray cursive signature-like scribble in the floor/background area was dropped automatically by keying (outside the bottle). Also stands in for 'amaro'.

*Logged 00:38.*

---

## 021. S2 bottle library - absinthe seed 310 (fast 8-step cfg1)

![S2 bottle library - absinthe seed 310 (fast 8-step cfg1)](images/021-s2-bottle-library-absinthe-seed-310-fast-8-step-cfg1.png)

**The ask.** STRATEGY S2 - a bottle library placed by code: draw one bottle at a time on plain white paper (a faint guide silhouette from BOTTLE_KINDS as Picture 1, the duo shelf crop as the Picture-2 hand reference), key each into a sticker, then place the library on the approved plate's two shelves in code using labels.json's own slot geometry plus a synthesised second rank, with contact shadows and a cast shadow drawn in code (scripts/draw-room-lines.py's own cast()).

**The thinking.** Same template.

**Settings.** local/qwen-image-edit-2511, seed 310, fast Lightning 8-step cfg1, 4:5 1344x1680 | Picture 1 = plain white page + faint grey BOTTLE_KINDS silhouette guide (gen_sheets.py), Picture 2 = canon/plates/duo.png shelf crop x380-980 y450-1000 (hand reference only) | never Replicate, AuraVision bridge -> ComfyUI

**Prompt.** [prompts/021-s2-bottle-library-absinthe-seed-310-fast-8-step-cfg1.prompt.txt](prompts/021-s2-bottle-library-absinthe-seed-310-fast-8-step-cfg1.prompt.txt)

**Verdict.** ACCEPT - slim bottle, cork stopper, one shield crest, no lettering.

*Logged 00:38.*

---

## 022. S2 bottle library - port seed 311 (fast 8-step cfg1)

![S2 bottle library - port seed 311 (fast 8-step cfg1)](images/022-s2-bottle-library-port-seed-311-fast-8-step-cfg1.png)

**The ask.** STRATEGY S2 - a bottle library placed by code: draw one bottle at a time on plain white paper (a faint guide silhouette from BOTTLE_KINDS as Picture 1, the duo shelf crop as the Picture-2 hand reference), key each into a sticker, then place the library on the approved plate's two shelves in code using labels.json's own slot geometry plus a synthesised second rank, with contact shadows and a cast shadow drawn in code (scripts/draw-room-lines.py's own cast()).

**The thinking.** Same template; closed out the library at exactly 9 rendered kinds (bourbon, rye, rum, gin, vodka, whiskey, brandy, absinthe, port), covering all 14 of the shelf's own kinds by substitution (scotch->rye, tequila->gin, triple_sec->vodka, amaro->brandy, sherry->rum).

**Settings.** local/qwen-image-edit-2511, seed 311, fast Lightning 8-step cfg1, 4:5 1344x1680 | Picture 1 = plain white page + faint grey BOTTLE_KINDS silhouette guide (gen_sheets.py), Picture 2 = canon/plates/duo.png shelf crop x380-980 y450-1000 (hand reference only) | never Replicate, AuraVision bridge -> ComfyUI

**Prompt.** [prompts/022-s2-bottle-library-port-seed-311-fast-8-step-cfg1.prompt.txt](prompts/022-s2-bottle-library-port-seed-311-fast-8-step-cfg1.prompt.txt)

**Verdict.** ACCEPT - short wide body, one clean shield crest, plain white page, no lettering anywhere. Final render of the strategy's 12-render budget.

*Logged 00:38.*

---

## 023. S2 bottle library - contact sheet (9 kinds, final)

![S2 bottle library - contact sheet (9 kinds, final)](images/023-s2-bottle-library-contact-sheet-9-kinds-final.png)

**The ask.** Deliver the library sheet, the composed plate, and the recess crop for STRATEGY S2.

**The thinking.** The final 9-bottle library after 12 renders (3 spent on bourbon, 2 on whiskey, 1 each on rye/rum/gin/vodka/brandy/absinthe/port). Two ambiguous label marks (gin's second device, whiskey's corner microprint) were retouched in code rather than re-rolled, to stay in budget. All 14 of the shelf's original kinds are covered by direct render or substitution: scotch->rye, tequila->gin, triple_sec->vodka, amaro->brandy, sherry->rum.

**Settings.** local/qwen-image-edit-2511, fast Lightning 8-step cfg1 (bourbon also tried full 40-step cfg4 once, rejected for a hatched background), 4:5 1344x1680 per bottle, keyed to RGBA stickers by flood-fill from the white page

**Verdict.** ACCEPT as the library for code placement - dense, varied, real-glass silhouettes, one crest each, no lettering anywhere.

*Logged 00:38.*

---

## 024. S2 - full plate, bottle library placed by code (candidate)

![S2 - full plate, bottle library placed by code (candidate)](images/024-s2-full-plate-bottle-library-placed-by-code-candidate.png)

**The ask.** Place the S2 bottle library on the approved plate's two shelves in code: labels.json's own slot geometry (world x, per-slot topPx/basePx), scaled isotropically per sticker (never stretched to a slot's nominal width), plus a synthesised second rank half a shelf-depth further back, with contact + cast shadows drawn via scripts/draw-room-lines.py's own cast()/bottle_shadow() (imported read-only, never run as a script).

**The thinking.** Before placing anything the old (rejected) code block-in bottles inside masks/bottles-lower.png and masks/bottles-upper.png are wiped to a soft blurred dark field, so no clip-art scrap survives in a gap between the new bottles. Everything - wipe, shadows, back rank, front rank - is built on a working copy and then clipped back through the feathered union of masks/{bottles-lower,bottles-upper,shelf-lower,shelf-upper}.png, so the frame, the boards' own faces, the window and the sign are byte-identical to canon/room-kit/v2/plate.png outside that area (plate.png itself was only read, never written). A final tone-match (room-part.py's own tone_match(), imported the same way scene-edit.py already does) fits the changed region's tone to the ring just outside it.

**Settings.** Composited entirely in code (numpy/PIL/scipy) from the 9-sticker library - no additional render for this step. canon/room-kit/v2/labels.json's 20 front-rank slots (11 lower + 9 upper) kept exactly as the construction placed them; kind per slot substituted for one of this library's stickers (kind_substitute.json). Second rank: 18 more bottles at the gaps between front-rank centres, BOTTLE_Z+0.14m deeper, projected through the room's own P() camera.

**Verdict.** Candidate for review - dense, varied, real-glass bottles wall to wall with a second rank behind, no lettering visible, window and sign intact. All 20 front-rank slots and all 18 back-rank gaps are filled from the 9-sticker library (kind_substitute.json); with only 9 distinct shapes across 38 placements a few repeats are visible on close inspection, most noticeably where the same kind lands in adjacent gaps upper-shelf - a founder pass may want 2-3 more kinds rendered to thin that out.

*Logged 00:38.*

---

## 025. S2 - recess crop 2x, bottle library placed by code (candidate)

![S2 - recess crop 2x, bottle library placed by code (candidate)](images/025-s2-recess-crop-2x-bottle-library-placed-by-code-candidate.png)

**The ask.** A 2x crop of the recess (plate x 540-1200, y 500-1000) for judging the bottles at a glance, per the founder's own SHELF_CROP_BOX convention (scripts/scene-edit.py).

**The thinking.** Same full-plate candidate as the previous entry, cropped and enlarged 2x. At this scale the crest-only labels, the fill lines and the shadow work are all visible without opening the whole plate.

**Settings.** Crop of 024's full plate, (540,500)-(1200,1000) at 2x LANCZOS.

**Verdict.** Candidate for review alongside the full plate and the library sheet.

*Logged 00:39.*

---

## 026. Strategy S1 best candidate b3B-s21, recess redraw plus code label cleaning - Opus critic pass

![Strategy S1 best candidate b3B-s21, recess redraw plus code label cleaning - Opus critic pass](images/026-strategy-s1-best-candidate-b3b-s21-recess-redraw-plus-code-label-cleaning-opus-critic-pass.png)

**The ask.** judge strategy S1's four cleaned bottle-shelf plates against the founder's rule (a normal bar, lots of different bottles, no names, no lettering at all, just emblems) and against the accepted reference canon/plates/duo.png

**The thinking.** S1 rendered the recess with the house edit model (b3B seeds 11/21/44/55) and then tried to remove the fake type in code: an Otsu paper mask per label, a four-corner frame-component test to peel the drawn border, keep the largest remaining ink blob as the crest, biharmonic-inpaint everything else from the label's own paper. No renders were spent. I looked at duo's shelf first, then every candidate at 2x whole-recess and 4x-12x per label, and cross-checked with a mechanical detector for baseline-aligned runs of small marks inside the bottle masks, run on the before and the after of each plate.

**Settings.** no render - critic pass only, 0 of 12 render budget used; s21 clean-final 1200x1800, recess x540-1200 y500-1000

**Verdict.** NOT DELIVERABLE - 3/10, and not lettering-free. b3B-s21 is the right base: the densest, most bottle-like shelf of the four, real necks, capsules and varied heights, and the recess frame, both shelf lips, the window and the on-glass sign are all intact with no seam or ghosting. But the cleaning did not take. At 12x, the upper-right label at plate x1010-1065 y660-720 still carries a drawn border, a diamond crest AND three full rows of small type under it - a brand line, a subtitle and a third line - exactly the failure the founder rejected. The lower-left cluster (x545-745) has four more labels with two or three type rows each, and the black circular-emblem label at x855-890 y850-895 still has its three rows of Chinese-looking characters despite being one of the five hand-added targets. A baseline-aligned type-row detector run over the bottle masks scores 3 rows before cleaning and 3 after on s21 (s11 8 to 7, s44 7 to 6, s55 6 to 5): mechanically, the pass removed essentially none of the type it was built to remove. Where it did fire it left a second problem - hard-edged, flat, faintly noisy blank cards, most visibly the bright white strip under the black snowflake crest at x745-835 y700-730 and the big blank panels at x565-635 - which read as stickers taped over the bottles and are a regression on the raw render. Style is also well short of duo: duo is soft graphite with mid-tones, depth and believable glass, s21 is crushed blacks and blown whites with an outlined, photocopied look and a hard vertical-stripe backbar. Bottles also stop about 55px short of the recess wall on both sides instead of running wall to wall. Of the others: s55 is the same style but sparser on the top shelf and carries more surviving type; s11 is disfigured by large featureless white wipe rectangles; s44 is the weakest drawing, mushy blobs that never read as glass. The single most important fix is to stop hunting for labels that look like they have rows - the scanner cleaned 22 of roughly 32 labels on s21 and missed whole clusters - and instead reduce EVERY label-paper region in the recess to one emblem unconditionally, refilling the cleared area with a resample of that label's own engraved paper tone rather than a flat inpaint, then gate delivery on the type-row detector returning zero.

*Logged 00:55.*

---

