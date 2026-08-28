# Abby — Character Bible

## What the references actually are

**The tile the pipeline sends:** `canon/vision/abby-face-reference.jpg`
(1640×2140). It is the only Abby entry in `VISION_REFS` (`lib/generate.ts`,
`VISION_REFS.abby`) and it is sent **whole, with no crop box** — the only tile
on the board that is a photograph of a printed card rather than a tight cut
from a plate. Drew's two tiles are pre-cut files of 380×520 and 335×275; Mango's
is boxed down at generation. Abby's arrives as the whole snapshot, glare and
background and all.

**What that card is authority for:** the westie head and its fur, the two
pricked ears, the black nose, the ruff, the studded collar, and the gem
pendant. Nothing else.

**What it is NOT authority for, and this matters most:**

| Feature | What the card actually draws | Rule that governs instead |
| --- | --- | --- |
| The eyes | A solid near-black disc filling the whole opening, one white catchlight, no white of the eye anywhere. Measured: **87.6%** and **83.5%** of each eye opening is below luminance 60, and the single light blob is **~20 px across — 1.4% and 1.7%** of the opening | §2. The card draws the exact failure §2 forbids |
| The mouth | Open, tongue and teeth showing | §2 — a warm closed-lip smile |

Expect to fight both. The fix is a better tile, not a softer rule.

**`canon/vision/abby-reference.jpg`** (1980×3190) is **the same artwork, wider**
— verified, not assumed: a 200×210 patch of the muzzle from the face card
matches the wider card at **normalised cross-correlation 0.953**, at the
predicted position, once scaled by the ratio of the two interocular distances.
So there is no argument to be had about the face: it is one face, photographed
twice.

It is **not sent to the model**, and below the neck it must never be copied. In
the pixels it draws four things this bible forbids:

1. **Forepaws on the counter** — two rounded furred paws with claws drawn along
   the front edge (five countable on the near paw), no fingers, no thumb
   (§3, §7).
2. **A crimson off-shoulder wrap over a black lace-trimmed bustier** — not the
   blouse and skirt of §4.
3. **A bust well past trim**, which is the founder's own recorded correction.
4. **A three-strand pearl bracelet**, where §4 sets one strand.

*(`canon/HARRINGTON-VISION.md` and `DESCRIPTION.md` both still name this file
the definitive face study. That is fine and no longer a conflict: it is the
same face. Read it for the head; take the body from §3 and §4.)*

## Where she has and has not been drawn

**She is in none of the four plates.** Plate 1 carries two panels, plate 2 two,
plate 3 one, plate 4 three — eight panels, eight Drews, eight Mangos, no Abby.
Six of the eight are bar panels. She is the one principal with no Harrington
behind her, which is why the rules below have to carry their own counts.

**She has been drawn four times in the house's own technique**, all in the
twelve-panel batch of 27 August 2026, now in `canon/showcase/`:
`sc02-reconsidered-the-olive`, `sc04-fourteen-dollars-of-roof`,
`sc11-from-windsor`, `sc12-permanent-receipt`. Where this bible says "the filed
panels", it means those four. They are the only evidence of Abby drawn right,
and the only evidence of Abby drawn wrong.

**Authority:** this bible and `canon/HARRINGTON-VISION.md` govern together, with
`canon/settings/SETTINGS-BIBLE.md` governing the room around her. Where any
older sheet, prompt, or note disagrees, the plates and the founder's notes win.
The PNG sheets in this folder — `wardrobe-details-sheet.png` and its siblings —
are **retired**: they draw a pearl-strand necklace instead of the collar, an
apron with a back bow, and a vulpine head. Pose vocabulary only, never
identity.

---

## 1. Who she is

Abby owns The Swinging Door and works its bar. She is not scenery and not a
servant — she is **the authority in the room**: the boss, a force to be
reckoned with, warm and quick and entirely in command. Her input is valued;
**her word settles the argument**. She curates the room — no drunks at her
bar, no riffraff beside her regulars.

**She is not in every frame.** She appears when the gag needs her, and the
room feels like hers even when she is off-panel. When she does appear, she is
**the only other character in the bar** — no other bartender, no staff, no
patrons, nobody at the tables, nobody in the mirror. *(Founder: "Abby is the
only bartender or other person in each cartoon; there are no full humans
besides the TV.")* **The television is the one exception in the whole strip:**
people may appear on the screen because it is broadcast footage, and the filed
panels use that — `sc12` runs two human anchors on the TV and is correct.

| Field | Canon |
| --- | --- |
| Species | West Highland White Terrier |
| Age | Mid-forties |
| Role | Proprietor and bartender; the authority whose word settles it |
| Signature | Studded leather collar with a small teardrop gem pendant |
| Position | Behind the counter, on the service side — the only one there |
| Presence | Selective; never furniture |

---

## 2. The face — beautiful, and the hardest thing to get right

> *(Founder: "she must be sexy and attractive" — and, on a failed round,
> "she looks scary, actually.")*

The rule that fixed this face: **beauty first, engraving second.**

- A **true fluffy westie** — short-muzzled, compact, pretty.
- **Her eyes are built like a human eye, not an animal's button.**
  *(Founder: "make her eyes more human — pupil, iris, white area, with
  detail.")* Draw the whole structure and let every part of it read:

  | Part | How it is drawn |
  | --- | --- |
  | **The white** | A clear white of the eye showing **at each side** of the iris — this is what makes the eye human, and it is the part that keeps getting lost |
  | **The iris** | A drawn circle, mid-tone, with **fine radiating lines** inside it |
  | **The pupil** | A distinct round dark disc at the iris centre — **smaller than the iris**, never filling it |
  | **The catchlight** | **Exactly one**, small and white, high on the iris |
  | **The lids** | A defined upper lid with lashes above it, a soft lower lid below |

  A solid near-black disc with a dot of white is the failure: that is a dog's
  eye, and hers is a woman's. **This is the single most-missed rule in the
  file.** It is missed by the reference card (measured above) and it is missed
  by all four filed panels — every one of them draws the dark disc and the one
  catchlight. Nothing in the repository yet shows the eye drawn correctly, so
  there is no picture to copy. Build it from the table.

- **Her brow is where she acts.** Lay **two or three** fine strokes in a
  shallow arch above each eye, no heavier than the lash line, and let their
  tilt carry the beat: level when she rules, inner ends lifted when she is
  fond, both ends lowered when she is not having it. Fine and few, so the white
  face stays luminous.
- A small **black nose**; a **warm closed-lip smile** — one soft upward
  lip-line, drawn closed, the way a well-bred terrier is drawn at rest in a
  portrait.
- **Silky groomed white fur** in fine individual strokes; two small pricked
  ears, both up.
- Her face is modelled with **delicate shading, not heavy stipple** — she
  stays soft and luminous even inside the engraved technique. Coarse stipple
  is what made her frightening.

**Take the head from a groomed show westie:** short square muzzle, soft rounded
skull, fur laid in fine short strokes no longer than the width of her nose, the
mouth closed, the gaze level and unhurried. Take her eyes from a leading lady
in her forties — large, round, dark, catchlit, and **built out of the five
parts above**. She is a grown, glamorous, self-assured woman of her species: an
adult, at ease, in her own room.

*(An early round came back wrong and the founder's note was "More detail
overall more in the face in the fur not so she looks like a werewolf, legs,
knees, hips are slightly wide." Naming that animal is how it kept arriving. The
fix was to name the one she is — the redraw list in §7 carries the rest.)*

---

## 3. Body — built like the gentlemen

> *(Founder: "literally like the other characters — a flamingo and 2 dogs,
> slightly humanoid.")*

She stands **upright on two legs**, with humanoid shoulders and arms and
**fur-backed, dog-yet-humanoid hands** — four fingers and a thumb, soft pads,
every finger distinctly drawn. Only her head and hands are pure terrier; the
body is a shapely feminine humanoid figure.

She meets the counter the way a proprietor does — **standing to it on her own
two feet, arms free, upright from the hips**, one hand at her work and the
other resting on the stone or at her side. What rests on the counter is a
**hand**: four fingers and a thumb, fur-backed and soft-padded, every finger
separately drawn, closed on a glass, a towel, or a bottle neck. **Never a
paw.** The wider reference card draws paws with claws, and that is the single
most literal way to get her wrong.

**Figure:** take the shape from a **well-cut women's dress shirt on a trim
woman of forty-five** — a clean shoulder line, a waist the reader can find, and
one soft curve at the chest that the blouse's placket follows. Slim hips and
legs. **No tail.**

### The neckline and the bust are two different notes

The founder has given both, at different times, and they pull in opposite
directions only if they are read as one note. They are not.

| The note | What it governs | What it asks for |
| --- | --- | --- |
| *(Founder: "she needs more cleavage")* | **The blouse** | Unbuttoned **two buttons down**, the collar falling open in a soft V, a clear sweep of **décolletage** between the lapels |
| *(Founder, earlier: "the boobs are too big")* | **The body** | The **bust stays trim and athletic** — the natural shape of a fit woman of forty-five, never enlarged |

**Open the neckline, not the figure.** One note is about cloth, the other is
about anatomy; satisfying the first must not move the second, and a drawing
that answers the cleavage note by enlarging the bust has failed both.

**Current state, measured on the filed panels:** the bust is trim in **4 of 4**
— that half is landed. The open neckline is drawn in **0 of 4**: all four open
the collar into a shallow V and then button the placket from the chest down,
with no sweep of décolletage between the lapels. The founder's note is the
verdict on exactly these four panels, and the neckline is the outstanding
correction.

---

## 4. Wardrobe

| Item | Rule |
| --- | --- |
| **The collar** | A leather band carrying **one row of round domed studs, every stud the same size** — no small or flat studs mixed into the row — with a buckle at the front and one ring below it. The pendant hangs from that ring and nothing else does. **He loves the collar** — it is her signature and replaces the old pearl strand. *(The even row is a house correction, not something to cite the card for. On the reference card the studs are loosely painted and visibly unequal — some rounded, some squarish, some conical — and no reliable count or size can be taken from them; a segmentation of the pale blobs on the band returns widths spread wider than 2×, and that is measurement noise as much as drawing. What the card does settle is the **buckle at the front and the single ring below it**, and both are correct.)* |
| **The pendant** | **One** small teardrop gem in a **silver bezel ringed with fine beads**, as the card draws it, closing to a **single point at the bottom**. Never so small it stops reading as a gem. *(On the card the drop is widest low — the widest row sits about two thirds down its height — and narrows under a small cusp at the top where the bail attaches, with a little bead finial below the point. Draw the clean teardrop; do not read a broad round top into it, and do not add a second charm on the ring.)* **This is the shape that drifts most.** Across the four filed panels the teardrop reads correctly in one (`sc04`), roughly in one (`sc11`, a pointed shield), and not at all in two — `sc02` draws a round disc medallion and `sc12` draws a heart. The band, buckle and ring are right in all four; it is the stone that wanders. |
| **Blouse** | Fitted and light, the **top two buttons undone** (§3), both sleeves **rolled back to the elbow**. No plate or filed panel fixes the number of turns; three of the four filed panels roll them to about the elbow and `sc12` draws them long to the wrist, which is the fault. |
| **Skirt** | Dark, fitted. `sc04` adds a plain belt at the waist; nothing establishes a belt as canon, so it is neither required nor a fault. |
| **Towel** | A folded white towel, **in every panel she appears in**, and **in EXACTLY ONE PLACE — never both** *(founder: "if she has it in her hands it shouldn't be on her shoulder")*. **Two states and no third:** **at rest**, it lies over her shoulder and hangs, and **her hands are empty of it**; **in use**, it has come OFF the shoulder into her hands — one end inside the glass she is polishing, the other hand closed round the outside — and **the shoulder is bare**. There is only ever **ONE** towel in the panel, and a towel that is nowhere in the panel is equally the fault. At rest it goes over the **left** shoulder, matching `MASTER-PROMPT.md` and `HARRINGTON-VISION.md`; no plate establishes the side, so do not file a panel against it, but do not vary it either. **Current state:** the towel is present in **1 of 4** filed panels — `sc12`, in her hands, shoulder bare, which is state two drawn correctly. It is absent entirely from `sc02`, `sc04` and `sc11`. |
| **Bracelet** | **One** strand of pearls at one wrist, drawn whole — never cut off by the bottom edge of the art. Which wrist is not fixed. *(One strand is a house correction and it holds: the filed panels draw a single strand in 3 of 4. The reference card draws three strands; do not copy it.)* |
| **Shoes** | Black heels — **away games and full-figure studies only**. A bar panel is cropped at the counter, so her shoes are never in one: never fail a bar panel for heels it cannot show, and never add legs to satisfy this row. |

Absolutely no tail.

### The house name goes on objects, never on her

**Nothing is lettered on Abby herself** — not the blouse, not the collar, not
the skirt. Her clothes are blank. This holds in all four filed panels and it is
not negotiable.

On an object she handles, the mark is **made into the material**, exactly as
`SETTINGS-BIBLE.md` sets it out:

| Her object | How the name is made |
| --- | --- |
| The bar towel, napkins, any cloth | **Woven into the weave**, following every fold, disappearing where the cloth turns |
| Coasters | **Pressed into the pulp** — a blind deboss, no ink |
| The mirror panel and the barware | **Etched or acid-frosted into the glass** |

It is a **maker's mark, not a billboard**: one short line in the house script,
small and neat, sized to the object, taking the same light and the same
hatching direction as the material around it, and **broken by anything that
passes in front of it**. The test: *if removing the lettering would leave the
object looking untouched, it was printed on top and it is wrong.*

**Not yet drawn.** `sc12` is the only filed panel with a towel in frame and its
towel carries no mark at all. There is no picture of this done right; work from
the rule.

---

## 5. Staging — she owns the service side

### The sides, and the one cue that settles them

**She is behind the bar. The gentlemen are in front of it. They never swap.**

> **The reliable cue is OCCLUSION.** A patron's shoulders **cover** the bar.
> A bartender is **covered BY** it. Everything else is commentary.

**The counter's far edge crosses Abby at the waist and hides her below it.**
That is the correct drawing, not a crop to fix: never render her lower body
through the counter, and never move her patron-side to show it. Because she is
standing and they are seated, **her head sits higher in the frame than theirs.**

*(`SETTINGS-BIBLE.md` says "upper hip" where `MASTER-PROMPT.md` and the
founder's note say "waist". The filed panels cut her between the two. Either
reads correctly; do not file a panel on the difference.)*

Two counts back the cue up without asking the drawing to reason about it:
**the gentlemen's forearms rest on the near lip of the counter and Abby is
beyond it**, and **one of her two hands is closed on a working object** —
glass, bottle, towel, or chalk. Those working objects are hers alone: a
gentleman holding a bottle or a bar towel reads as the bartender, which was the
original fault.

Bar panels are cropped at the counter: her blouse and the top of her dark skirt
may show above the counter, but no legs, no knees, no feet, no stools.

**The counter is pale grey veined marble**, one continuous slab at one height,
walnut-moulded at the edge — per `SETTINGS-BIBLE.md`, and drawn that way in all
four filed panels. Note before citing anything: **the marble is a house
correction, not a plate fact.** All four Harrington plates draw a dark wooden
bar with long straight grain (plate 3's counter measures mean luminance 113
against the filed panels' 124–152 with an irregular vein network). Never file a
plate against the marble, and never file a panel against the plates' wood.

### What stands behind her

The back bar is behind Abby and fills the background: walnut shelving, the
mirror, the house bottles with their golf-pun labels, hanging stemware, the
television above, the chalkboard beside it, a brass sconce at each end. That is
`SETTINGS-BIBLE.md`'s room map, it is what all six bar panels of the plates
draw, and it is what all twelve panels of the filed batch draw.

**This is the room's business, not hers.** Abby's bible previously carried a
redraw test against bottle shelving behind Drew or Mango. That test is
withdrawn: it is contradicted by 6 of 6 plate bar panels, by 12 of 12 filed
panels, and by the room map itself. See §9 — one sentence of `MASTER-PROMPT.md`
still says the shelving stands behind the reader, and that is a defect in that
file for the room's owner to settle. Do not fail an Abby panel on it either way.

What *is* hers: **a bottle in the frame is in her hand or standing on the
counter, never in a gentleman's grip.**

### Where she looks

*(Founder: "I don't like how Abby is always looking at us — it's weird.")*

Her body is angled **into** the frame and her face goes where her body goes:
she is looking **at Drew and Mango**, or down at the work in her hands. That is
what puts her face in three-quarter for the reader — not a head cranked round
on its neck.

**She never looks out of the panel.** Nobody in this room knows the reader is
there and nobody meets his eye. A dead-on stare down the lens is a redraw,
however pretty the face.

**This is the failure currently being made, and it is being made every time.**
All four filed panels draw her square to the camera, both eyes level, looking
straight at the reader. Turn the body first and let the head follow it.

**The over-correction is turning her away, and it is just as wrong.** Once
corrected, keep the count: **both eyes are drawn, and the far one is at least
half the width of the near one**, with the bridge of her muzzle showing between
them. Her muzzle points at the gentlemen and her head turns only as far as
keeps that second eye. Back of the skull is a redraw; so is one eye.

*(The count is currently passing — both eyes reach the paper in 4 of 4. Do not
lose it while fixing the gaze. Note that Drew and Mango are drawn in
near-profile from behind in those same panels and show one eye each; that is
their staging, not a precedent for hers.)*

### Approved work actions — pick one, and the scene line names which

Polishing a rocks glass with her towel · pouring from a labelled bottle ·
sliding a drink across the counter · chalking the day's special · calling last
round.

Where the scene names none she gets drawn standing with a hand flat on the
counter, which is the proprietor drawn as a guest at her own bar. **One of her
two hands is closed on that object in every panel.**

### Serving accuracy

Drinks match their owner: **Drew's martini — one olive on one pick**, as
`MASTER-PROMPT.md` sets it; **Mango's old fashioned — one large cube and a
cherry.** Where a panel carries more than one martini, every martini in it
carries the **same** count.

A stemmed glass stands on **its own foot, inside the frame**; a stem that runs
off the bottom edge is a drink with nothing under it. Glass rims stay round,
towels pass around vessels rather than through them, bottle necks are gripped
securely, and every bottle that reaches the frame wears its own readable label.

---

## 6. Acting

Abby's comedy is **authority, delivered warmly**. She does not banter upward
at the gentlemen; she rules on things. Where Drew reclassifies and Mango
worries, Abby **closes** — and the room accepts it.

Filed and published:

- *"I haven't raised a number in three years, gentlemen, but I have
  reconsidered the olive."*
- *"There's about four dollars of whiskey in that glass and fourteen dollars
  of roof."*

In the register, not yet filed:

- *"The house protects its own. Read it again, gentlemen."*
- *"I price in a raise every morning. Delivering it is a separate decision."*
- *"The house keeps winning, gentlemen. Just not the kind anyone lives in."*

**When the caption is hers, her mouth is drawn parted** — one drawn word,
landing a beat before the typeset one. When the line belongs to Drew or Mango,
her mouth is closed.

Note the address: *gentlemen*. She is fond of them and entirely unintimidated.

---

## 7. Forbidden — any one of these is a redraw

- Anything but the groomed-show-westie head of §2 — short square muzzle, soft
  rounded skull, fur in fine short strokes
- A frightening, staring, or eerie expression; heavy stipple deadening the face
- Puppyish, childlike, or tongue-out
- A four-legged dog; forepaws, pads or claws leaning on the counter in place of
  hands
- A solid black button eye with no white, no iris ring and no separate pupil
- More than one catchlight, or none
- **A gaze that meets the reader's** — she looks at the gentlemen or at her work
- A head turned so far that only one eye is on the paper; the back of her skull
- Abby on the patron side, or drawn covering the counter instead of covered by
  it
- An exaggerated bust; wide hips or knees
- A buttoned-to-the-throat blouse with no open neckline
- A towel on her shoulder AND in her hands in the same panel; two towels; no
  towel anywhere in the panel
- Fur drawn as a worn coat — any cuff, hem or seam where fur meets nothing
- A tail
- Missing collar or missing gem pendant; more than one thing hanging from its
  ring; a round disc, a heart, or any shape but the teardrop in the bezel
- Lettering anywhere on Abby herself — blouse, collar or skirt
- A house mark that sits ON a surface rather than IN it: a decal, sticker,
  patch or flat label that ignores the material, the curve and the light
- A bottle in frame whose label is blank or unreadable
- Another bartender, staff member, or any figure in the room besides this
  cartoon's cast — **the television screen excepted**, where broadcast footage
  may show people
- Legs, knees, feet, or stools in a bar panel
- Colour, flat fills, cel shading, photographic rendering

---

## 8. Approval standard

A panel passes when Abby is beautiful, plainly a westie, plainly a grown woman
in command, and plainly the owner of the room. Six things can be counted on the
finished pixels before filing:

1. **The collar** at her throat with its teardrop pendant.
2. **Both eyes** on the paper, each built from the five parts in §2 — white,
   iris, pupil, one catchlight, lids.
3. **Her gaze inside the scene** — on the gentlemen or on her work, never on
   the reader.
4. **The towel** in exactly one place: over her shoulder with her hands empty
   of it, or in her hands with the shoulder bare.
5. **One hand closed on a working object.**
6. **The counter crossing her at the waist and hiding her below it**, with the
   gentlemen's shoulders covering the counter in their turn.

If she reads as frightening, as a puppy, or as a different breed, it fails on
sight regardless of everything else in the panel.

---

## 9. Open questions — do not guess these, and do not file against them

These are the places where the canon does not yet decide, or decides twice.
They are listed so nobody invents an answer and nobody files a redraw on one.

| Question | State |
| --- | --- |
| **Which side of the marble she works on** | `MASTER-PROMPT.md`'s ABBY paragraph says she "works on the CAMERA'S side of the marble at the near end of the counter". Its own STAGE paragraph, `SETTINGS-BIBLE.md`, the founder's note and all four filed panels say the opposite. **§5 is correct; that sentence in the master prompt is a defect** and should be fixed by that file's owner |
| **The back-bar shelving** | `MASTER-PROMPT.md`'s ROOM paragraph puts it behind the reader and forbids it behind the gentlemen; its STAGE paragraph, `SETTINGS-BIBLE.md`, 6 of 6 plate bar panels and 12 of 12 filed panels put it in the background. Unresolved in that file; **not an Abby fault either way** |
| **The olive count** | `MASTER-PROMPT.md` says one, `SETTINGS-BIBLE.md` says exactly three, the plates draw one in the bar panels and two at the golf panel. §5 follows the master prompt because that is the text the image model reads. Drew's file, not hers |
| **Which shoulder the towel rests on** | Three canon documents say left; no plate and no filed panel shows it on a shoulder at all. §4 keeps left for consistency and does not treat it as a redraw |
| **Marks on napkins and coasters** | `SETTINGS-BIBLE.md` and `MASTER-PROMPT.md`'s house-name paragraph both mark them; the master prompt's own filing checklist lists napkins and coasters among the surfaces that must be **blank**. Unresolved; **her towel is not in doubt** |
| **What a corrected eye looks like** | No image in the repository draws it. §2's table is the only specification. Do not hunt for a picture to copy — there isn't one |
| **Whether the blouse has a belt** | `sc04` draws one; nothing else does. Neither required nor a fault |
| **Background patrons** | `SETTINGS-BIBLE.md` still carries a line allowing "background patrons, when drawn". `MASTER-PROMPT.md`, `HARRINGTON-VISION.md`, the founder's own note and all twelve filed panels allow nobody but the cast. **§1 is correct**; that line is stale and should come out of the settings file |
