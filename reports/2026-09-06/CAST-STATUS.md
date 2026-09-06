# The cast - where it stands after the first night (2026-09-06, 03:00)

## What is in place
- The plan: reports/2026-09-05/CAST-PLAN.md (poses, gaze matrix, route, QC). Look cards and judge checklists: reports/2026-09-05/CAST-LOOK-CARDS.md.
- Reference kits, cut from the approved plates at native resolution: canon/characters/{flamingo,dog,abby}/kit/ (bust.png, head.png, study.png; flamingo also hands.png and head-render-s104.png).
- The published set Rick accepted, as one sheet: scratchpad cast/set/set-sheet.png (copy into canon on Monday). Naming conflict to raise: the set's captions call the dog "Mango"; the bible says Barclay.
- Five pose parts drawn in code (draw-room-lines.py, figure(who, pose)): figure-drew-01-rest, figure-drew-02-toward, figure-barclay-01-rest, figure-barclay-02-toward, figure-abby-01-ledge. Each has its own mask, values and shadow; silhouettes are cut by the chairs; all stay in DISABLED.
- Tools: scripts/cast-qc.py (judging sheets and filing), room-part.py --ref (extra references, named in the prompt), --crop (detail render from a 2:3 crop at full resolution), --plain (flat field outside the silhouette), scratchpad combine_heads.py / combine_keyed.py.
- Render a figure with the chairs ON in DISABLED (the conditioning needs the chair), then put them back off before any plate build.

## What was learned on Drew's anchor pose (six rounds, 26 renders)
1. Whole-frame renders never dress him: a bird from behind is plumage to the model, whatever the tone, negatives or wardrobe sheet.
2. The detail render (--crop 60,700,700,1660) with the vest DRAWN as a knit lattice with ribbed armholes, the references NAMED in the prompt, and canon/vision/studies/duo-behind.png as a reference, gives the knit vest and collar reliably (seeds 7, 21, 44).
3. The head does not form inside the body render (swan skull, small beak) even with a good head as the first reference.
4. A head-only render (--crop 280,740,560,1160, head tile first) gives a real Drew head: heavy bill to a black tip, lidded eye, fine plumage (seeds 104, 201, 202).
5. Compositing the head onto the body is the open problem: cut by the block-in's silhouette it leaks the head render's background; keyed from a flat-field render it still catches room fragments the model draws, and the neck join shows. Next: render the head on the flat field with a plainer prompt (no room description) and key with a tighter limit, or render head and neck together and key the whole; then judge with cast-qc.py against the checklist.

## Decisions for the founder
- Drew's bill: the bible's swan wording vs the plates' and the published set's heavy bill (the block-in now follows the plates: depth 0.46 L, bent down).
- Drew's locked reference: plates or the full-body sheet.
- "Mango" vs "Barclay" in the published captions.
- The dado rail under the ledge (a base re-render), carried over from the room.

## Monday order
Drew anchor pose to approval (head composite), then Drew rest; Barclay anchor and rest against the plate with Drew in it; Abby at the ledge last; then the remaining poses. Every render filed with cast-qc.py file; the founder sees each approved pose in the room before it is switched on.
