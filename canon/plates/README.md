# Plates

The bar is drawn **once** per cast and never drawn again. A plate is that
picture with the television switched off and the chalkboard wiped. Every
cartoon is assembled from a plate in code; the image model is asked for
small, one-time pieces only.

| File | What it is |
| --- | --- |
| `src/duo-source.png`, `src/trio-source.png` | The founder's closest-yet panels (2026-09-02), the references the blank plates are redrawn from. |
| `duo.png`, `trio.png` | The **approved blank plates**. Screen off, slate wiped, labels wordless, mouths closed. |
| `duo.json`, `trio.json` | Where things are on each plate, in pixels: the screen glass, the slate, and each face's mouth and eyes. Measured by hand after a plate is approved. |
| `duo-drew.png`, `duo-barclay.png`, `trio-abby.png` … | **Speaker variants**: the plate with one mouth open and the listeners' eyes on the speaker. Generated once, only the face boxes pasted back into the plate, approved once. |
| `work/` | Everything the plate desk generates, in order, so nothing is lost. `work/stills/` holds TV footage; `work/gags/` holds composed cartoons. |

## The desk

`/api/backroom/plate` runs one step per request while logged in to the studio:

```
?step=blank&cast=duo                         draw the blank duo plate (from src/duo-source + the empty set)
?step=approve&cast=duo&file=<work file>      promote it to canon/plates/duo.png
?step=blank&cast=trio                        draw the trio: the APPROVED duo plate + Abby's portrait
?step=speaker&cast=duo&who=drew              Drew speaking, pasted into the plate by region
?step=approve&cast=duo&who=drew&file=<file>  promote it to canon/plates/duo-drew.png
?step=still&footage=<what the screen shows>  one engraved TV still, 3:2, no words
?step=compose&cast=duo&who=drew&still=<file>&chyron=..&board=a|b|c&caption=..
```

The gag itself is code: footage into the screen rectangle, chyron and CNBC
bug typeset, chalk typeset on the slate, caption typeset beneath with a
paper margin so the rule never touches the marble. A gag costs one TV still,
or nothing when the still already exists.

## Rules the desk enforces

- Chalk lines break at ~11 characters and the whole board is at most seven
  lines, so the writer gives the board two to four short lines.
- The chyron is one line and shrinks to fit left of the timestamp.
- The caption is two typeset lines at most; a third line is an error.
