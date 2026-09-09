# Cast placement study — 9 September 2026

Current review pair: **duo-seated-v6.png** and **trio-seated-v7.png** (1024 x 1536 each). See `REVIEW-v6.md` for the chair reconstruction, species-specific hands, and exact prompt chain. Earlier seating assessments were too generous: the owner correctly identified the exposed empty cushions and implausible body-chair contact in v2 and v4.

Generated using Codex's built-in image generator in reference-image edit mode. This is a cast placement proof, not a published cartoon or an owner-approved replacement for the room or canon.

## Inputs and reproducibility

First pass, in image order:

1. `../../canon/room-kit/v2/plate-signed.png` — approved room, edit target.
2. `../../canon/vision/studies/drew.png` — approved Drew portrait.
3. `../../canon/vision/studies/barclay.png` — approved Barclay portrait.
4. `../../canon/vision/studies/abby.png` — current approved Abby v2 re-ink (seed 7), not the earlier blank-eyed candidate.

Exact first-pass prompt: `prompt-v1.txt`. Result: `cast-in-room-v1.png`.

Second pass used `cast-in-room-v1.png` as the edit target and the approved Barclay portrait as the identity reference. Exact prompt: `prompt-v2.txt`. Result: `cast-in-room-v2.png`.

## What worked

Treat the room as the edit target and the portraits as identity inputs only. Specify furniture occlusion and anatomical connections: each patron's torso occupies his own foreground chair, the chair back covers his lower back, his torso covers the near counter edge, and his forearms reach onto the marble. Abby stands in the service aisle, with the counter covering her lower body. Drew's single flamingo head and S-neck connect directly to his own seated body.

The first pass resolved all three species, placement, and shared rendering. Its remaining face issue was Barclay's near-profile. A second localized edit turned only his face into a readable three-quarter view.

## Visual review of v2

- Exactly three interior characters; no duplicate heads or human substitutions.
- Drew left and Barclay right, bodies seated in the foreground chairs; Abby across the counter in the service aisle.
- Drew has a continuous S-neck, compact flamingo head, bow tie and knit vest.
- Barclay has both eyes visible, retriever muzzle, flag pin and wristwatch.
- Abby has visible pupils and irises, closed smile, studded collar and pendant, one towel in her working hands, and a pearl bracelet.
- Drinks rest on the marble/coasters, with a shared bowl of nuts between them. Visible hands connect to arms and props without obvious clipping.
- Room composition, window view, blank TV/board and shelves are retained visually. Generative editing redraws pixels: this is not a pixel-identical preservation of the empty room plate or a layered composite. Some bottle detail and line texture differ.

No shared scripts, prompts, canon assets, selections, reports, or publishing files were modified. Both candidates and exact prompts are here for comparison and reuse by the project team.
