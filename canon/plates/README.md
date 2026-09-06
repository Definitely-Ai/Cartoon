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

## Notes for later

- `duo-drew.png` (approved 2026-09-02): the join at the top of the bill paste box is slightly soft where the open bill meets the face. Reads fine at full size; the founder said it doesn't bother him for now. If it ever does, widen the feather or the `drew.mouth` box in `duo.json` and re-paste from `work/20260902-151717Z-duo-drew-raw.png` — no new draw needed.

## The local desk (free, on the studio machine)

`scripts/plate-desk.mjs` is this desk run from the checkout against the RTX 4090
(AuraVision on port 8000, ComfyUI on 8188). Same prompts, same paste-by-region,
same typesetting; nothing is committed and no hosted model is called.

```
node scripts/plate-desk.mjs speaker --cast duo --who barclay [--rolls 3 --seed 7]   one raw drawing + the face boxes pasted into the plate
node scripts/plate-desk.mjs speaker --cast duo --who barclay --from <raw.png>       paste an existing raw, draw nothing
node scripts/plate-desk.mjs still   --footage "a stock chart plunging" [--rolls 2]   one engraved still, 3:2, no words
node scripts/plate-desk.mjs blank   --cast duo|trio [--source <panel.png>]           a blank plate candidate
node scripts/plate-desk.mjs approve --cast duo [--who drew] --file <work file>       promote a work/ file to canon
node scripts/plate-desk.mjs compose --cast duo --who drew --still <name> --chyron .. --board "A|B" --caption ..
node scripts/plate-desk.mjs gag     --plan gags.json [--only 1,3]                    a whole batch -> briefs/<batch>/finished/
```

The model bake-off of 2026-09-02 (duo plate as Picture 1; Qwen-Image-Edit-2511,
FLUX.2 klein 4B, SenseNova-U1.5, all Apache-2.0; JoyAI-Image-Edit-Plus still
downloading) settled the defaults:

- **Plate edits** (speaker variants, blank plates): `PLATE_MODEL=local/sensenova-u1.5`
  in its 8-step fast mode. It is the only model that keeps the plate's own soft
  hatching, so the pasted mouth box has no seam. Its full cfg-4 mode drifts to a
  coarser pen; Qwen's mouths come back wide and toothy and it garbles Drew's bill;
  Klein redraws the face in a different pen. Roll a few seeds for Drew's parted
  bill and pick.
- **TV stills**: `STILL_MODEL=local/sensenova-u1.5` in full mode from the text alone
  (about twelve seconds): bold, text-free engravings. With a style swatch attached
  it draws the cast into the footage, and in fast mode it gives faint pencil. Qwen
  letters the prompt's own words onto buildings even at 40 steps; Klein is a fine
  fallback at three seconds (`--model local/flux2-klein-4b`).
- `--model`, `--full`, `--fast`, `--style <png>` override any of this for one run.

Approved here: `duo-barclay.png` was promoted from `work/20260902-152305Z-duo-barclay.png`
on 2026-09-02 by the local desk (the founder had re-pasted it after widening the
mouth box) so a Barclay gag composes with his mouth open. The trio has no speaker
variants yet: `speaker --cast trio --who abby|drew|barclay`.
