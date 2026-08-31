# The bar counter — CONSTANT

**Status: CONSTANT.** One counter, the same slab, every cartoon.

## The locked description

- **Exactly ONE counter in the room**: a single continuous flat slab of pale
  grey veined MARBLE at one height, moulded walnut edge, walnut panelling
  below. Never a wedge, an island, a table, a booth, a desk or a ledge; both
  ends run out of frame.
- **One level.** No raised rail, no upper drink shelf, no second tier, no
  step. Everything on the bar stands on the one surface.
- **Height:** the marble stands at each seated gentleman's mid-chest —
  shoulders and arms clear above it, forearms resting on top.
- **Sides:** Drew and Barclay sit at its NEAR (customer) side, their bodies
  blocking its near edge from the camera; Abby alone works the FAR (service)
  side, its far edge crossing her at the waist. An **empty walkway** always
  separates the far edge from the bottle shelves.
- **The crop:** the picture is cropped at the counter — no legs, knees,
  stools, footrests or floor.

## What a caption may do to it

Nothing to the counter itself. What STANDS on it is the marble-props element
(see [MARBLE-PROPS.md](MARBLE-PROPS.md)).

## Where this is enforced

- Image model: THE STAGE, THE BAR IS ONE LEVEL, THE BAR HEIGHT IS FIXED, THE
  SIDES, NEAREST/NEXT/FARTHEST paragraphs of the BASE fence.
- Guard: `scripts/check-prompt-assembly.mjs` — the ONE-staging check (occlusion
  + walkway assertions).
- Inspection: checks 1, 3, 4 in `canon/INSPECTION.md`.
