# The parts overhaul

**Status:** direction approved by the founder, 2026-09-03. Machinery landed; the
repo is mid-migration.
**Written by:** claude (art pipeline). **Addressed to:** chatgpt (studio app),
and to whoever picks either side up later.

---

## 1. Why the repo is changing

Until now a change to the bar was made by editing the finished picture: send the
whole plate to the image model with an instruction, get a whole new picture back,
and paste a rectangle of it over the old one.

Every fault the founder caught on 2026-09-02–03 came from that one mechanism:

| What he saw | What actually happened |
| --- | --- |
| Scribbles on Drew's collar, a strap across his chest | the window band runs `x 0–345` and crosses his collar |
| Barclay's ear like steel wool | a full-mode redraw of the ear band, 4× his face's stroke density |
| Black slabs where the window meets the panelling | a sharpening pass whose rectangle swallowed the wooden reveal |
| Both characters' texture "messed up" | the marble band runs the full width and recut their clothes |

A render does not edit what you asked for. **It redraws the whole picture**, and a
rectangular paste-back drags the redraw onto everything the rectangle touches.
Patching in place cannot converge: each fix disturbs its neighbours.

## 2. The new model

The room is **one base drawing plus independently re-rollable parts.**

```
canon/plates/
  base/duo-base.png     the founder's approved plate, never edited
  base/light-map.png    the room's illumination field, extracted from the base
  parts.json            the manifest: every part's outline, prompt, mode, render
  parts/<id>.png        the approved render for each part
  work/                 candidates, kept so nothing generated is ever lost
```

`python scripts/build-plate.py` lays each enabled part onto the base through its
own outline, in order, and writes the plate. Re-roll one part, rebuild, and
nothing else in the picture moves.

### The rule that makes it work

**Parts are rendered in context, never in isolation.** A part's render is a full
render of the whole plate; only its outline is composited back. Drawing a part on
its own canvas fails three ways, all of which we would then have to fight:

1. **Light** — a shelf drawn alone invents its own light direction and reads as
   collage against the room.
2. **Perspective** — warping a flat drawing onto a quad only works for flat
   things. Bottles, the sconce and the ear are three-dimensional; a warp
   distorts them.
3. **Matting** — engraved hatching has no solid edge; paper shows *through* the
   strokes. Keying an alpha off a generated part leaves halos on every piece.

Rendering in context inherits light, perspective and pen style for free. The
stored outline does the cutting.

### Four levers control the lighting

1. **A written light law.** `lighting.prompt` in the manifest is pasted verbatim
   into every part prompt: daylight from the window at frame left, the two
   sconces lighting only the panelling around them, the back bar in deep walnut
   shadow, the marble the brightest thing after the window, no second
   contradicting shadow. A render not told the light direction invents one.
2. **The room's light map**, `base/light-map.png`, taken once from the base by a
   42-px blur. `build-plate.py --relight` re-imposes it on a part by frequency
   separation: divide out the part's own low frequency, multiply the room's back
   in. The part keeps its strokes and adopts the room's tone. Changing the
   room's lighting later is editing this one file and rebuilding.
3. **Ring tone-matching**, on by default. Gain and offset are fitted from the
   ring just *outside* a part's outline — never inside, which is what changed.
   Gain clamped to ±14 %. A part cannot come back brighter or flatter than its
   neighbours.
4. **Protected regions.** Drew, Barclay and both sconces are stored once as
   polygons in `protect` and subtracted from every part whose `respectsCast` is
   true. No outline has to trace the cast by hand.

Measured on the first build with all four active: worst drift anywhere outside a
part fell from **7.13 strokes to 1.22**. The right sconce went `+7.13 → −0.04`;
Drew's vest, Barclay's muzzle and jacket, both liquor shelves and the chairs came
out at **0.00** — bit-for-bit the founder's drawing — while four parts around
them were regenerated.

## 3. What still has to be migrated

| Item | State | Owner |
| --- | --- | --- |
| `parts.json`, outlines, protect, lighting | landed | claude |
| `scripts/build-plate.py` | landed | claude |
| Parts: board, marble, window-view, barclay-ear | rendered, approved | claude |
| Parts: window-frame, shelf-top, shelf-lower, sconce-right, drinks | outlined, **not yet rendered** | claude |
| **Chalk, TV footage, caption** | still pasted by the old scripts, outside the system | claude |
| `lib/plates.ts` | still band-paste era; needs to become the parts library | claude |
| `scripts/plate-desk.mjs` | needs `part roll` / `part approve` / `part list` | claude |
| `canon/MASTER-PROMPT.md` | two founder reversals unrecorded (see §6) | claude |
| **A Parts page in the studio** | not started | **chatgpt** |
| Trio (Abby) | becomes one more part on the same base | claude |

The chalk gap is live and visible: when the board moved, the chalk paste searched
40 px to find its footing. Anything still outside the manifest is guessing.

## 4. Ownership, so we do not collide

We are both working uncommitted in one tree. Paths:

**claude owns** — `canon/**`, `lib/plates.ts`, `lib/generate.ts`,
`lib/auravision.ts`, `lib/dialogue.ts`, `lib/writersRoom.ts`,
`scripts/build-plate.py`, `scripts/plate-desk.mjs`, `scripts/draw-local.mjs`,
`Z:\ImageGenerator\backend\**` (the AuraVision server).

**chatgpt owns** — `app/**`, `lib/studio-*.ts`, `lib/studio-*.json`,
`scripts/build-studio-*.mjs`, `docs/*research*`.

**Shared — say so in `AGENTS-HANDOFF.md` before editing** — `package.json`,
`package-lock.json`, `tsconfig.json`, `lib/githubPublish.ts`, `canon/README.md`,
`middleware.ts`.

Note: `app/api/backroom/plate/route.ts` is the hosted plate desk. It is claude's,
and it is **dead code for now** — it drew through Replicate, which is banned; it
has been re-pointed at AuraVision but the local desk is what is used.

## 5. The interface between the art pipeline and the studio

`canon/plates/parts.json` is the single source of truth. The studio app should
read it and render a **Parts page**:

- one row per part: `id`, `note`, `mode`, whether it is `enabled`, and whether
  its `source` render exists;
- the approved render from `canon/plates/parts/<id>.png`, and every candidate
  from `canon/plates/work/`, side by side at full size — this is how the founder
  picks;
- an **approve** action.

**Approving a part means exactly two things:** copy the chosen candidate to
`canon/plates/parts/<id>.png`, and set that path as the part's `source` in
`parts.json`. Nothing else. The plate is then rebuilt by running
`scripts/build-plate.py` — the app should *not* try to composite anything itself.

Contract, so neither side breaks the other:

- The app **writes the manifest and copies part renders**. It never writes
  `base/**`, and it never composites pixels.
- The art pipeline **never changes the manifest's shape** without recording it
  here first.
- `parts.json` must always leave the plate rebuildable by
  `python scripts/build-plate.py` with no arguments.

## 6. Invariants neither side may break

1. **Never Replicate, never a paid image API.** All art is free and local:
   AuraVision on `127.0.0.1:8000` driving ComfyUI on the RTX 4090.
2. **The cast is never redrawn.** Drew and Barclay come from the base or from an
   approved speaker variant. Any part touching them uses `respectsCast`.
3. **Lettering is code, never model glyphs.** The window sign, the chyron and the
   caption are typeset or gilded in code. The model garbles mirrored text on
   every attempt (always the R in DOOR) and its letterforms are crude.
4. **Fast mode for anything that touches a character.** Full mode redraws the
   cast with a coarser pen — Drew's stroke density goes 17 → 55. Full mode only
   where the whole outline is the subject and no character is inside it.
5. **Nothing generated is deleted.** Candidates stay under `canon/plates/work/`.

## 7. Founder rulings not yet in canon

`canon/MASTER-PROMPT.md` still contradicts two decisions, and needs updating:

1. It says the window view "begins ABOVE the street floor, so NO pavement, NO
   roadway, NO sidewalk". The founder has since ruled the bar is **on the ground
   floor**, looking across the street at eye level.
2. It bans figures outright. The founder has since asked for **a hot dog stand
   with indiscriminate people around it** outside the window. Inside the bar the
   no-other-figures rule stands; the street is now populated.

Also unrecorded: the building opposite is **modern glass-and-steel over an older
stone base**, not a Victorian block.
