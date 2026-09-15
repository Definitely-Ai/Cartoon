# Approved complete-head correction

The owner approved `barclay-chin-cleanup-v4/head-review.png` with:
"perfect fix all of the cartoons".

`approved-head.png` is that exact approved source, SHA-256
`ab76ccbf36c54b1bb3b8aaebecb3913089d70cc162b865d0beedb199c6c89ce8`.
The older reference portrait remains the identity authority; older means the
earlier design, not greater age. Its unchanged bytes are `approved-portrait.png`.

The built-in image editor made the corrected head, speaking source and upward
gaze source. Prompts are preserved alongside them. Delivery plates undergo
deterministic grayscale normalization and protected-region compositing.

All five acting plates use the entire corrected head. The replacement region
covers BOTH the new head and every retired silhouette fragment. Never intersect
the new head with the old fur mask: doing that left an extra rear-ear lobe,
forehead ridge and far-eye flap in v1. Mouth and eye variations are derived only
from this approved head. Preserve the corrected single chin-to-neck contour.

The 38 selected cartoons and two city editions use these exact five poses.
Captions, TV, chalkboard, other characters, hands and the room outside the
bounded head/neck repair are unchanged. Three contour regression crops compare
directly to the approved head, in addition to whole-gallery hash/pixel checks.

Worker v17 is staged separately and all five real compositor replays passed
with retained TV art. No fresh inference or upload was performed in this replay.
The Windows task still points to v14; the canceled startup change was not retried.
Do not claim the installed worker uses v2 until activation is explicitly approved
and verified. Do not modify immutable v14, v15 or v16 snapshots.

Reproduction: run `scripts/fixed-set/build-reference-barclay-v2.mjs` from the
Z:/ImageGenerator/Cartoon studio, then the guarded release publisher. Original
studio art and the v1 canon remain preserved for comparison and recovery.
