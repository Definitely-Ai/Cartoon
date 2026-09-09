# Seating and texture revision

The owner's correction: Barclay looked like he was sitting on the bar; improve his fur and Drew's feathers; make a version without Abby and keep a version with her.

## Review pair

- `duo-seated-v4.png`: Drew and Barclay only. Primary version for the current review.
- `trio-seated-v4.png`: companion derived from the revised duo, with Abby standing in the service aisle.

Both are 1024 x 1536 PNGs produced with the built-in image generator in reference-image edit mode. They are review candidates, not owner-approved canon or published cartoons. No external publication or shared canon replacement was performed.

## Changes inspected

Barclay is lower in the composition, his jacket descends below the marble edge, and a more enclosing curved leather chair back supports and overlaps his lower torso. His arms reach forward onto the marble. The older v2 assessment accepted ambiguous seating; the owner's correction supersedes it.

Barclay's ears and cheeks have more directional strands and softer layered edges. Drew has more detailed feather shafts, barbs and overlapping contours, distinct from his vest's knit. A follow-up reduced Barclay's added throat shag. Both retain their established face shapes, eyes, clothing and drink identities. The duo has exactly two interior characters; the companion has three, with Abby beyond the counter and one towel in her hands.

These are visual improvements, not a claim of perfection. The concealed pelvis means seating is communicated by torso/chair/counter overlap rather than a visible hip contact. Drew's feather overlap remains fairly pronounced and should be judged against the owner's preferred softness. Some short throat fur remains on Barclay. The companion edit also makes small linework changes to the subjects and room; this is not a pixel-locked layered master.

## Exact prompt chain

1. `prompt-duo-v3.txt`: inputs `cast-in-room-v2.png`, the approved `canon/room-kit/v2/plate-signed.png`, `canon/vision/studies/barclay.png`, and `canon/vision/studies/drew.png`, in that order. Removes Abby, reconstructs seated contact and refines texture. Output `duo-seated-v3.png`.
2. `prompt-duo-v4.txt`: input `duo-seated-v3.png`. Follow-up texture pass. Output `duo-seated-v4.png`.
3. `prompt-trio-v4.txt`: inputs `duo-seated-v4.png` and the current approved `canon/vision/studies/abby.png`. Adds Abby at work across the counter. Output `trio-seated-v4.png`.

Earlier images remain available for comparison. All work in this revision is confined to this output folder; Claude's active scene and canon files remain untouched.
