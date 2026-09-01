# The bar counter — CONSTANT

**Status: CONSTANT.** One counter, the same slab, every cartoon.

## The locked description

- **Exactly ONE counter in the room**: a single continuous flat slab of pale
  grey veined MARBLE at one height, moulded walnut edge, walnut panelling
  below. Never a wedge, an island, a table, a booth, a desk or a ledge; both
  ends run out of frame.
- **One level.** No raised rail, no upper drink shelf, no second tier, no
  step. Everything on the bar stands on the one surface.
- **One straight plane.** Where the marble shows beside or between the
  gentlemen it lines up exactly with the marble in front of them — same top
  edge, same height, one unbroken line frame-left to frame-right. A slab
  that steps up or sits higher beside Drew at the window end than in front
  of him is a redraw. (Operator ruling 2026-09-01: "it's not aligned.")
- **One marble surface in the whole room.** No back ledge, lower second
  counter, or work-top along the base of the back bar — the panelling meets
  the floor plain, and the walkway between is bare. (The plate roll of
  2026-09-01 produced exactly this fault; the fence now bans it by name.)
- **Height:** a real 42-inch bar — TALL. Its top sits level with a seated
  gentleman's MID-CHEST — shoulders and arms clear above it, forearms resting
  on top. **A counter crossing at
  the waist or belt means the whole room was drawn too low, and that is a
  redraw.** (Operator ruling 2026-09-01: "they look like they are sitting
  low — the bar needs to be raised up.")
- **The slab is a surface BEYOND each gentleman, never a band drawn across
  him.** No part of the marble overlaps or passes through a chest, waist,
  vest or jacket; the whole torso stands in front of the near edge and hides
  it, and only forearms and drinks reach onto the top. A man "half sunk into
  the bar" is a redraw. (Operator ruling 2026-09-01, second pass: the first
  tall-bar wording — the marble "crosses" him at mid-chest — was obeyed
  literally and drew the slab through both gentlemen.)
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
