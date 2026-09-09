# Occupied chairs and distinct hands

Primary current image: `duo-seated-v6.png`.
Companion with Abby: `trio-seated-v7.png`.

Both are 1024 x 1536 PNGs, generated with the built-in image generator in reference-image edit mode. They remain review candidates; no canon replacement, selection, commit, or publication was performed.

## Owner correction

The earlier chairs had exposed cushions that made them look vacant, and Barclay's pose did not read as seated in his chair. Both species had excessively similar hands. This correction supersedes the earlier favorable seating reviews.

## Visible changes

The chairs were substantially reconstructed to face the counter. The camera sees their outside backs; their inward-facing seats contain the patrons' lower bodies. Drew's clothed hip is visible at the chair's inner side, and neither seat has the broad empty foreground cushion of v4. The chair backs and arms enclose the sitters, while their forearms reach the counter. These are taller chairs, with short portions of the supports visible at the bottom; no character legs or feet are shown.

The hand refinement is strongest in `duo-seated-v6.png`: Drew's hand back has small overlapping feather vanes continuing from his wrist, while Barclay's hands have short directional hair strands and softly furred contours. Wrists, watch, and grips remain connected. Some digits are naturally occluded by the grips; the picture does not expose every digit for counting.

The companion adds Abby in the service aisle, in front of the rear ledge and beyond the foreground serving counter. The intermediate `trio-seated-v6-intermediate.png` put her behind the wrong ledge and is retained only as an intermediate, not the recommended version. Adding her caused small linework changes, including some softening of the fine hand detail. Use the duo as the stronger hand reference.

No claim of perfect fidelity or pixel-identical room preservation is made. These edits alter chair geometry intentionally and redraw small background details. Barclay's left lapel pin is partially obscured by his more rear-facing body angle.

## Exact prompt chain

1. `prompt-duo-v5.txt`, input `duo-seated-v4.png`: reconstruct occupied chairs and body posture, request distinct hands. Output `duo-seated-v5.png`.
2. `prompt-duo-v6-hands.txt`, input `duo-seated-v5.png`: localized feather-versus-fur hand refinement. Output `duo-seated-v6.png`.
3. `prompt-trio-v6.txt`, inputs `duo-seated-v6.png` and `../../canon/vision/studies/abby.png`: add Abby. Output `trio-seated-v6-intermediate.png`.
4. `prompt-trio-v7-depth.txt`, input `trio-seated-v6-intermediate.png`: move Abby forward into the service aisle. Output `trio-seated-v7.png`.

All files from this revision are confined to this output folder. Other project work, including Claude's active files, remains untouched.
