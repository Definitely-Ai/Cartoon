THE DAY, STEP BY STEP (2026-09-05) - what was asked, what was done, what came of it

1. Founder: "fix the seats and the leather", "there is a wall behind the shelves", "a little better text".
   Chairs redrawn with a padded seat the back sits on; the shelf carcass lost its false backs; sign set in Bahnschrift.
   Result: chairs still ribbed, shelves flat - REJECTED by the founder ("you messed up the shelves ... a duplicate back of the chairs carried over to the bar").

2. Founder: "remove the chairs and see what the bar looks like ... remove the shelf, look at the wall ... build the shelf separately ... use opus teammates ... everything organised and labelled ... stickers we can drag and drop".
   Chairs and shelves switched OFF; the bare bar and wall built and shown.

3. Root cause of the "duplicate chair back" (Opus teammate, verified): every part's block-in was cut from ONE image the chairs had painted over,
   so the counter, cabinets and ledge each had a chair back inside their own outline. Fix: a values image per part. Bar parts re-rendered in order,
   each judged on a rebuilt plate by a straight-edge check (6 px, was 31). The bar is clean.

4. Wall check (teammate): geometry correct to a few px; render reeded. A positive-only prompt rewrite was tried on four seeds and was worse - current wall kept.

5. Tools built and verified (teammates): per-object version history (history/<object>/ INDEX.md + SHEET.png, restore any version),
   stickers cut exactly as the assembler tones them (compose reproduces the plate to 0.07 grey levels), a local drag-and-drop desk (node scripts/sticker-desk.mjs).

6. Shelf unit, three rounds: round 1 and 2 rejected by two critics each before rendering (the unit's right end was OUTSIDE the frame - the "missing divider");
   round 2's first renders smeared because cast shadows sat inside the masks -> shadows became a code layer applied to the rendered wall;
   round 3 rendered clean. Founder chose C slab seed 7 (two floating walnut slabs on three posts): HIGHLIGHT OF THE DAY. Cabinets removed at his request.

7. Founder: "perfect the signage ... a better window sill ... the little railing near the window". A review round (one Opus reviewer per part) diagnosed the
   railing as four members stacked under the pane; a designer replaced them with ONE marble sill; the sign moved to Franklin Gothic Medium and lifted clear of the cart.

8. Founder: "add in drew and barclay and the chairs". Chairs back on; Drew and Barclay added as new parts seated in the chairs (block-ins at the cast plan's
   geometry, silhouettes cut by the chair backs, the characters' canon prompt blocks). Drew seed 7 approved; Barclay swept next.

Standing rules learned today: a part's block-in must never contain what stands in front of it; shadows are code, not block-in; an object the frame cuts
on any side gets re-imagined; when a region keeps growing the same wrong object, change what the block-in resembles; one object at a time, shown before it goes in.
