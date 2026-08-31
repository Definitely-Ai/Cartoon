# The elements of the room — one bible per fixture

<!-- BRAND: replace when final — "The Swinging Door" is the working series/bar name -->

The room is not one description; it is a set of ELEMENTS, and every element has
exactly one of two statuses:

- **CONSTANT** — identical in every bar cartoon: same object, same place, same
  size, same state. A caption, a gag, a brief, a writer NEVER touches it. If a
  joke seems to need it changed, the joke is rewritten, not the room.
- **CAPTION-DRIVEN** — carries part of the day's joke, through exactly one
  named slot. What may change is listed in its bible; everything else about it
  is constant too.

The founder's rule this encodes: *the scene is constant; each caption
influences certain elements and does not touch the ones that stay the same.*

| Element | Status | Driven by | Bible |
| --- | --- | --- | --- |
| The window | **CONSTANT** | — | [WINDOW.md](WINDOW.md) |
| The bar counter | **CONSTANT** | — | [BAR-COUNTER.md](BAR-COUNTER.md) |
| The back bar & bottles | **CONSTANT** | — | [BOTTLES.md](BOTTLES.md) |
| The seating | **CONSTANT** | — | [SEATING.md](SEATING.md) |
| Walls, lamps & panelling | **CONSTANT** | — | [WALLS-LIGHTING.md](WALLS-LIGHTING.md) |
| The television | **CAPTION-DRIVEN** | `[TV]` + `tvPicture` | [TELEVISION.md](TELEVISION.md) |
| The chalkboard | **CAPTION-DRIVEN** | `[BOARD]` | [CHALKBOARD.md](CHALKBOARD.md) |
| The marble's props | **CAPTION-DRIVEN** | the writer's `action` | [MARBLE-PROPS.md](MARBLE-PROPS.md) |

How an element's bible becomes pixels: the operative sentences live inside the
```text fences of `canon/MASTER-PROMPT.md` (the only words the image model
reads), the writer's slots feed the caption-driven elements per panel, and the
set plate (`canon/vision/staging-plate.jpg`) shows the constants as a picture —
which out-votes text, so **when a constant changes, the plate is regenerated,
approved, and re-locked in the same change.** `canon/INSPECTION.md` checks the
result on every batch.

Editing rules: change an element ONLY in its bible + the fence + (for
constants) the plate, together. Never let the three disagree; when they do, the
operator's most recent ruling wins (see the authority note in
`canon/README.md` — the plates are references, not rulings).
