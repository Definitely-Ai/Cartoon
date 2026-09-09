# Regenerating the cast for the house model — six strategies, one test

**2026-09-09, written after midnight. Design only; one small test was run (strategy A, Drew only, 3 renders).**

The founder's direction: *"regenerate Abby, Drew and Barclay using reference photos and
descriptions since this is a different image generation model"*, and then the house model
draws the whole plate.

The reason this is the right instruction: every official portrait the studio is currently
sending as a reference — `canon/vision/studies/drew.png`, `barclay.png`, `abby.png` — was
drawn by **openai/gpt-image-2** (the model line is the first line of each study's own
`.txt`). The plate is drawn by **local/qwen-image-edit-2511**. Every whole-scene pass is
therefore asking one model to copy another model's hand, and the failures the lab logged
all night — the vulture, the turkey, the hound, the poodle, the human, tonight's literal
wading bird — are that gap showing. Closing it means getting each character *into the house
model's own hand*, judged and approved there, before any scene pass uses him.

Six strategies below. Each says the idea, the risk, the cost in renders and hours, and how
it is approved **one character at a time** (the founder's process rule of 2026-09-05: one
object at a time shown for approval, per-object version history, nothing else moves until
that one is signed off).

Facts every cost below is built on, measured tonight and yesterday:

| | |
|---|---|
| fast pass (Lightning 8-step, cfg 1) | **40–50 s** a render at 4:5 1344×1680; **50–115 s** for a whole 2:3 plate |
| full pass (40-step, cfg 4) | roughly **5×** that, so 4–9 min a render |
| first render after a fresh model load | **10–20 min**, log silent — normal, not a wedge |
| serialisation | one render at a time across the whole team, so wall clock ≈ render count × render time, plus judging |
| negatives | **not read at cfg 1**. Anything the fast pass must not draw has to be said in the positive prompt or fixed in code |
| references | the bridge takes **3** (`MAX_REFS`), grayscale, autocontrast, capped at 1024 px wide, JPEG q90 |

---

## A. Own-hand reference sheets — the founder's (a)

**Idea.** For each character the house model draws its own turnaround — front,
three-quarter, back, head close-up — on a white sheet, from the written description in
`canon/characters/<x>/DESCRIPTION.md` + `PROMPT-BLOCKS.md` + the DREW/ABBY paragraphs of
`canon/MASTER-PROMPT.md`, with the old gpt-image-2 portrait as a *loose* Picture 2 for
identity only. Picture 1 is a white 4:5 sheet with the empty panels and their labels drawn
**in code**. The approved sheet, or crops of it, then becomes Picture 2/3 for every
whole-scene pass, and the gpt-image-2 studies are retired to history.

**Risk.** The edit model is not a layout engine. `local_bridge._graph_qwen` samples an
`EmptySD3LatentImage` at denoise 1.0, so *every pixel comes back drawn from noise* — the
panel rules, the printed labels and the four-way discipline are all things it can throw
away, and tonight it threw away a different one at each of three seeds. Two further risks
specific to a turnaround: a sheet that goes into canon with four panels that disagree is
worse than no sheet, because it becomes the thing everything downstream copies; and a
turnaround needs the **whole figure**, so approving one approves legs, trousers and shoes
that canon has never drawn and the founder has never seen (canon currently forbids shoes
"unless the scene names them").

**Cost.** As tested, four cameras in one render: 3–6 renders per character per round, 2–3
rounds → **9–18 renders and 1.5–3 h per character**; ~30–55 renders and 5–9 h for the three.
As the test says it should actually be built — **one panel per render** — 4 cameras ×
2–4 seeds = **8–16 renders per character**, same wall clock, but each render is an
independently approvable object and a bad camera costs one render instead of the sheet.

**Approved one character at a time.** Drew's sheet alone goes to the founder; nothing for
Barclay or Abby is rendered until it is signed off. Versioned per object with
`scripts/object-history.py` under `canon/characters/flamingo/kit/`. In the panel-per-render
form the approval is finer still: one camera at a time, and the sheet is composited in code
from panels that have each already been approved.

---

## B. One character per pass, with its block-in — the founder's (b)

**Idea.** Already built and already proved: `scripts/scene-edit-chain.py --chain
drew,barclay,abby[,bottles] --seed N`. Pass 1's Picture 1 is the approved plate with **only
Drew's** headless block-in painted in (100–180 grey through his own part mask, head erased
so no painted bill leads the model) and **only Drew's** portrait at full size as Picture 2.
Pass 2 chains from pass 1's raw render and adds Barclay the same way; pass 3 adds Abby; an
optional fourth step runs the bottles crop. Yesterday's finding is the whole reason it
exists: painting all three block-ins at once makes the model scramble who is who — the
flamingo lands behind the bar — but one portrait plus one block-in comes out right *every
time*.

**Risk.** Error accumulation. Every pass re-inks the entire canvas, so the room drifts a
little at each step and the character approved at pass 1 is redrawn by pass 3. "Approve one
character at a time" therefore means approving something that will still change — the
opposite of what the founder's rule is for. And it does not answer the founder's actual
instruction at all: identity still comes out of the gpt-image-2 portrait, so the
cross-model gap stays open.

**Cost.** 3–4 renders a chain, 3–6 seeds → **9–24 renders per candidate scene**, 0.5–1 h of
GPU plus judging. The cheapest thing on this list and it needs no new code.

**Approved one character at a time.** Pass *n*'s render is shown alone, the founder says
yes to that character, and only then does pass *n+1* run. The honest caveat above must be
said out loud when it is shown: the approval is provisional until the last pass lands.

---

## C. Head-only high-resolution passes — the founder's (c)

**Idea.** The recess trick applied to a head. Draw the whole plate first (B, or a single
pass), then re-render **each head alone** as its own 4:5 crop at the bridge's full
1344×1680 — four to six times the pixels on the face — tone-match the patch to the ring
just outside it and paste it back through a feathered head mask. That is exactly what
`--bottles-crop` already does for the recess, line for line (`crop → render → rp.tone_match
→ feathered union paste → --keep window restore → sign-on-glass last`), and
`scene-edit.py --repair <name>` is already the same idea at plate resolution.

**Risk.** A crop has no scale reference, so the model draws a head that is right in itself
and wrong for the neck it lands on — wrong size, wrong tilt, wrong eyeline. Seams: the
bottles pass needs `tone_match` gains of 0.88–0.98 to hide the join, and a join across
hatched plumage is far less forgiving than one across a dark recess. And a white bird's
head against pale marble is a low-contrast target — the same problem that defeated the
sticker key (measured: 80 % of the crop differs from the plate by more than 12 levels after
tone-matching, median normalised cross-correlation 0.02).

**Cost.** 2–4 renders per head per plate at 40–50 s each → **6–12 renders and about an hour
per finished plate**, plus roughly 2 h of code for a `--head-crop` flag written against
`--bottles-crop`'s own pipeline.

**Approved one character at a time.** Perfect fit: one head, one render, shown beside the
version it replaces on the same plate, and the paste is reversible because the previous
`-final.png` is still on disk.

---

## D. A per-character LoRA on the house model — the founder's (d)

**Idea.** Train a small LoRA per character from an approved reference sheet plus every
approved appearance, and load it where the Lightning LoRA already loads
(`LoraLoaderModelOnly`, `local_bridge._graph_qwen`), so "Drew" lives in the weights instead
of in three reference tiles that have to be re-copied on every render.

**Honest state of the local stack — I checked rather than guessed.**

- `Z:/ComfyUI/custom_nodes/` holds **ComfyUI-GGUF** and the stock `websocket_image_save.py`.
  Nothing else. There is no training node of any kind installed.
- `Z:/ai-models/loras/` holds exactly two files, both other people's 8-step distillation
  LoRAs (`Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16`, `SenseNova-U1.5-8B-MoT-LoRA-8step`).
  The studio has never trained anything.
- `C:/Python313` has `torch` and `transformers`; it has **no `peft` and no `diffusers`**.
- No `kohya_ss`, `ai-toolkit`, `diffusion-pipe` or `sd-scripts` anywhere on the drives I
  looked at.
- The base is `qwen_image_edit_2511_fp8mixed.safetensors` — a ~20 B model — on a single
  **RTX 4090, 24 GB**. That is the studio's only render GPU.

So this is not "run a script"; it is install a trainer from scratch, get a ~20 B edit model
to train inside 24 GB with quantised base weights and gradient checkpointing, and build a
dataset first.

**Risk.** The dataset is the killer: a character LoRA wants 20–40 consistent images of a
character we do **not yet have consistently**. That is the whole problem, restated as a
prerequisite. Beyond that, a character LoRA on an *edit* model fights the reference tiles
rather than helping them, and training pins the only GPU, which stops every other strategy
for its whole duration.

**Cost.** 0 renders, **8–16 h of install and debug**, then 2–6 h of training per character,
after 20–40 approved images per character exist. Realistically several days.

**Approved one character at a time.** It cannot be. There is nothing to show the founder
for a day or more, which breaks the one-object-at-a-time rhythm outright. **Recommendation:
shelve it.** Revisit only once A or F has produced an approved sheet per character — at
which point the dataset exists and the argument changes.

---

## E. The re-inked portrait — the smallest thing that answers the actual instruction

**Idea.** The founder's sentence is about the *model*, not about turnarounds. Answer it
directly and minimally: hand the house model the official portrait as **Picture 1** and ask
for exactly one edit — *"redraw this same bird, same pose, same crop, same wardrobe, same
props, in your own engraved pen"* — at 40 steps cfg 4 (where the negative is actually read).
What comes back is the same character, the same silhouette, in the hand that draws the
plate. That own-hand portrait replaces `canon/vision/studies/<x>.png` as Picture 2
everywhere, and from then on every downstream pass has **no style gap left to close**.
`scripts/cast-study.py` already does the whole mechanism (`--picture1-path`,
`--drop-portrait`, `--full`) — this is a call, not a script.

**Risk.** Identity drift in a single render, and the bill is exactly what this model gets
wrong. cfg 4 gives it more freedom to drift than cfg 1 does. Mitigated by the shape of the
call: Picture 1 *is* the portrait, so the geometry is in front of the model rather than
remembered from a tile, and `cast-study.py`'s own repair wording —
`build_prompt(repair=True)`, "PICTURE 1 IS ALREADY FINISHED AND ALREADY CORRECT EXCEPT FOR
ONE THING" — exists for precisely this kind of call.

**Cost.** 2–4 renders per character (4–9 min each at 40 steps) → **6–12 renders total for
all three, 30–45 min per character** including judging. The cheapest real answer on the list.

**Approved one character at a time.** The tightest fit there is: one portrait, one
character, shown side by side with the one it replaces, founder picks, `object-history.py`
records the version. It is the smallest approvable object in the whole problem, and every
other strategy here gets better the moment it exists — A, B and C all currently send a
gpt-image-2 tile as Picture 2 and would send this instead.

---

## F. Pose tiles instead of a turnaround — draw the cameras the strip actually uses

**Idea.** A turnaround is more than the plate ever needs. The scene needs exactly three
cameras: **Drew** seated from behind, head turned back three-quarter; **Barclay** seated
from behind, head turned; **Abby** waist-up behind the ledge, facing the room. Render those
three as solo studies on white — `scripts/cast-study.py` already does exactly this, with a
crop of an approved plate as Picture 1 so the camera, crop and lighting are not up for
negotiation — approve one per character, and use the approved study as Picture 2 for the
whole-plate pass. The reference then already shows the pose, so the model has nothing left
to invent.

**Risk.** A pose tile is not a character bible: it fixes one camera and says nothing about
any other, so every new scene needs a new tile and the library grows forever. And there is
a known failure mode — round 4 found the model **copied the tile's staging back out of it**
(the belt, the trousers, the martini grip came along with the identity), which is why the
identity tile was re-cut to head-and-shoulders in the first place. A pose tile makes that
copying *deliberate*, which is fine while the pose is the one you want and a trap the moment
it is not.

**Cost.** 3–6 renders per character per pose at 40–50 s → **9–18 renders and 1–1.5 h per
character** for its one canonical camera.

**Approved one character at a time.** One pose, one character, one approval, and the
approved tile is a file the founder can point at afterwards. Combines well with E: re-ink
the portrait first (E), then draw the pose tile from the re-inked portrait (F).

---

## Recommended order

1. **E first**, tonight if the founder agrees — 2 renders for Drew, judged, approved. It is
   30 minutes and it is the literal answer to what he asked for.
2. **A for Drew**, in the panel-per-render form the test below argues for, using E's
   re-inked portrait as Picture 2 instead of the gpt-image-2 study.
3. **B** to build the plate, now with an own-hand Picture 2 at every step.
4. **C** for whichever head still misses after B.
5. **F** as the library grows, one camera at a time.
6. **D shelved** until 2 has produced approved sheets — then reconsider with a real dataset.

---

# The test: can the house model draw its own reference sheet?

**Run.** Strategy A, Drew only, three renders, seeds 7 / 21 / 41, `local/qwen-image-edit-2511`,
fast 8-step cfg 1, 4:5 1344×1680, 40–43 s each, serialised on an empty ComfyUI queue.
Report entries **001–004** of 2026-09-09. Files in
`…/scratchpad/strat/cast/` — `picture1-sheet.png`, `drewsheet-s{7,21,41}.png`,
`sheet.prompt.txt`, sidecar JSON per render, and `contact-drew-sheets.png`.

**Setup.** Picture 1 was a white 4:5 sheet drawn in code: four empty ruled panels, 592×706
each, labelled `1 FRONT`, `2 THREE-QUARTER`, `3 BACK`, `4 HEAD CLOSE-UP` in Georgia (the
lettering drawn in code, as the house rule requires). Picture 2 was
`canon/vision/studies/drew.png` — the official portrait — labelled in the roster as a loose
identity reference whose pose, crop, background and props are explicitly *not* to be copied.
The description travelled in the prompt: canon's own DREW paragraph out of
`MASTER-PROMPT.md`, plus the anchors from `canon/characters/flamingo/DESCRIPTION.md` (the
question-mark neck, the plump soft body, trousers, no display tail), plus a bespoke
THE SHEET paragraph replacing the room and stage paragraphs, plus six numbered EDITS — one
per panel, one "these are one individual seen four ways", one "keep the sheet and its labels
exactly".

**What came back.**

| seed | panel grid | figures | labels | verdict |
|---|---|---|---|---|
| **7** | held, four clean panels | four **busts cropped at the belt**; panel 1 is a profile not a front; panel 3 is a three-quarter rear, face still showing; a **martini** appears in panel 2 | all four correct and legible | best identity, worst cameras |
| **21** | **collapsed** — two full-length figures spanning a column each, bottom row holds only trousers | full length **with trousers and shoes**; no back view; martini again | two of four **garbled** (`2 MREHIALSQ`, `1 THERWAKER BACK`) | hard fail on lettering, one real finding |
| **41** | held | panel 1 a **true full-length front**, head to shoes; panel 3 a **true full-length back**, no face; panel 4 a large clean head; panel 2 **went feral** — a literal wading flamingo on stick legs with a folded wing and a martini | one garbled (`4 HIVSP DUD-CINSY - NIP`) | best structure, three of four panels approvable |

## The answer

**Yes — the house model can produce a usable own-hand reference sheet, but not in one
render, and not as a literal turnaround.**

What it did well, at every seed, is the thing that matters most: **identity in its own
hand.** The bird is unmistakably Drew — plump and soft-bodied, white plumage laid in fine
dash-strokes, the slender pale bill with the black outer third and the plain slit nostril,
the heavy-lidded eye with iris and catchlight, the crisp collar band, the small black bow
tie, the honeycomb knit vest — rendered as an engraving, not as a copy of a gpt-image-2
drawing. Seed 7's head close-up is the strongest single drawing of Drew's head the studio
has produced, and seed 41's front and back views are the first time the character has
existed below the waistband at all. That is exactly the asset A promises.

What it cannot do is hold **four cameras in one render**. Every failure was *cross-panel*:
the grid collapsing (21), one panel reverting to a real bird while its three neighbours
stayed on model (41), the labels garbling in two of three. The model is an image editor
working from an empty latent at denoise 1.0 — it has no concept of "four independent
sub-drawings", and asking for one is asking for the one thing its architecture does not
provide.

### Three changes and A becomes buildable

1. **One panel per render.** Ask for one camera on one white sheet, judge it, approve it,
   and composite the four approved panels into the sheet in code. Same total render count,
   but a bad camera costs one render instead of the sheet, and — the reason it is the right
   answer rather than merely the safe one — it *is* the founder's one-object-at-a-time rule
   applied to reference art.
2. **Never let the model near the lettering.** Two of three seeds garbled the printed
   labels. Send Picture 1 with the panels ruled but **unlabelled**, and stamp the labels in
   code after the render, the same way `sign-on-glass.py` goes on last because gilding is
   pixels.
3. **Say it in the positive, or fix it in code.** The martini appeared in two of three
   sheets despite being forbidden in the edit *and* in the negative — because the fast
   Lightning pass runs at cfg 1 and never reads a negative. Either state the prohibition
   inside the numbered edit in positive terms ("both hands hang open and empty at his
   sides, nothing in either hand"), or run the sheet at 40-step cfg 4 where the negative is
   read, at 5× the time.

### Two things the founder has to decide before A runs for real

- **The panel has to be taller than the figure.** A full-length flamingo will not fit a
  592×706 panel — seed 7 solved that by cropping him at the belt, seed 21 by spilling him
  across two panels. One camera per sheet at the full 1344×1680 solves it outright.
- **A turnaround draws his legs.** Canon has never shown Drew below the waistband and
  currently forbids shoes "unless the scene names them". Seeds 21 and 41 both put him in
  plain dark oxfords over his trousers. Those shoes are now a canon decision, not a render
  detail, and they need the founder's eye before anything downstream copies them.

**Budget used: 3 of 12 renders.** No plate candidate was produced and none was called for —
this strategy's product is a reference sheet on white, so there is no shelf to crop and no
recess to enlarge; the contact sheet stands in its place.
