# The cast - where it stands on 2026-09-08 (evening)

## What was settled today
- The official portraits are fixed: Drew = canon/vision/studies/drew.png (founder: "b and c are actually from a"); the dog is Barclay for now (name still in the works); Abby = canon/vision/studies/abby.png.
- Placement route. Three teams ran today (reports entries 014-059):
  - Team Drew 2 (routes A and B in scripts/cast-place.py - a flat-field crop of the room, or the whole crop pasted back): the house edit model draws a superb Drew but seats him at a side table of his own, at his own scale, and redraws the room around him. Route A's measurements are in the script's docstring.
  - Team Drew 3 (route S, the STICKER route): Picture 1 is a white sheet carrying only the occluding chair from the plate, the marble line and a pale under-drawing of the pose's block-in; the render is keyed by ink on white into an RGBA sticker, cut by the chair's mask and laid at the figure's layer. RESULT: seat, pose and scale are right on every seed and the room stays untouched. What failed: (1) the staging Picture 3 was a front view and the model copied it - it stays OFF; (2) Drew is white, so an ink key leaves his interior transparent - a hole-filled key is needed (measured 0.66 -> 0.85-0.88 coverage, no extra ink); (3) the under-drawing's head was invisible to the model (a white bird's head is ~245 grey) and came back goose, stork or ribbon.
- The construction fix (lead, applied live 17:20): Drew's block-in head is now a small skull with a thick bill bending steeply down to a black tip (the portrait's bill), instead of the straight cone that led the model to stork heads; skull half-axes 0.074/0.064/0.056.
- Team 4 (running): route S v2 - a pencil-line under-drawing (mask outline + tone edges) so the head is visible whatever its tone, the hole-filled key, no Picture 3, an EDIT sentence naming the head circle; Drew, Barclay (right chair, judged with Drew laid) and Abby (behind the ledge) in parallel, two judges per round, an independent verifier per character.

## Tooling
- scripts/cast-place.py --route S (--under-blend, --under-lines, --white-thresh, --no-fill, --also part=sticker, --staging-solo), sidecars with key statistics; previews via room-part's assemble(override) - never run as a command.
- ComfyUI wedges after two or three edit-model renders (VRAM pinned, API silent): scratchpad restart-comfy.ps1 + comfy-watchdog.ps1 (3 missed checks -> restart, 180 s grace). Noted in memory.

## Open for the founder
- Judge the first sticker that passes the panel; then the remaining poses per character (rest / toward / ledge) follow the same recipe.
- The Supabase table for the desk (docs/sql/room-desk.sql) still needs your go.
