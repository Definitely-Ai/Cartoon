# Drew — Character Bible

**Definitive study:** `canon/vision/drew-plate1-bar-reference.jpg` — the bar
Drew of plate 1. **Authority:** this bible and `canon/HARRINGTON-VISION.md` govern
together; where any older sheet, prompt, or note disagrees, the plates win.
Everything below is written from the founder's own corrections, each one
quoted where it applies.

---

## 1. Who he is

Drew is a successful gentleman in his mid-forties who happens to be a
flamingo. He has money, time, and the particular calm of a man who has seen
this cycle before. He is the strip's **arch observer**: the one who names the
mechanism behind the headline in a single clean sentence, then goes back to
his martini.

He is not a mascot, not a muppet, not a caricature of a rich man. He is a
bird at a good bar, and the comedy is entirely in his composure.

| Field | Canon |
| --- | --- |
| Species | Flamingo — a real one, not a humanoid with a beak |
| Age | Mid-forties |
| Role | The dry verdict; the arch observer |
| Default expression | Heavy-lidded, amiable, unimpressed |
| Permanent | Black silk bow tie |
| Drink | Martini — conical stemmed glass, **one olive on one pick** |
| Frame position | Frame-left by default |
| Value note | Pale, but hatched — **not** the white of the paper. Measured on plate 1's bar panel, mean grey 0–255: his vest **151**, his neck plumage **150**, against Mango's polo **204** and Mango's fur **199**. Drew lives in the high midtones under fine dash-hatching; the untouched paper goes to glass, signage and Mango's shirt |

---

## 2. The single most important rule

> **He is far more flamingo than human.**
> *(Founder: "he's humanoid but a flamingo so he needs feathers — he is more
> flamingo than human; the only thing that's slightly human are his hands.")*

Read that as a ratio, not a style note. Ninety percent bird, ten percent
gentleman:

- **Feathered everywhere.** Breast, shoulders, back, arms — white plumage in
  rows of fine dash-strokes, unbroken **from shoulder to fingertip**.
- **No human skin anywhere.** No bare forearms, no smooth pink limbs, no
  human torso or musculature under the clothes, no human face.
### He is not wearing his feathers

*(Founder: "the right arm looks like a jacket — none of the models should look
like they are wearing their fur or feathers.")*

The plumage **grows out of him**. It is never drawn as a garment, and the tell
is always an EDGE where no edge belongs: a cuff, a hem, a seam, a shoulder line,
a lapel, a closing line down the arm.

> **The armhole of his sweater vest is the only edge anywhere on his arm.**
> Below it the plumage runs unbroken and edgeless to his fingertips.
> A second line crossing that arm is a sleeve, and the panel is wrong.

The same law governs the whole cast: Mango's coat and Abby's are fur under
cloth, meeting the garment at the garment's own edge and nowhere else.

- **He wears no sleeve.** In all eight plate Drews the garment above the waist
  is sleeveless — a V-neck vest, or bare plumage — and the arm is one unbroken
  feathered surface from shoulder to fingertip. No cloth cuff, no hem, no seam
  anywhere on the arm; the only cuff is the fluff of feathers at the wrist.
- The **only** humanlike thing about him is the pair of hands at the ends of
  those feathered arms.

If a panel shows a person-shaped body wearing a flamingo head, it has failed
this bible completely, whatever else is right.

---

## 3. Construction

### The neck — his signature
A true flamingo neck: **long, high, and swept in a deep, graceful S-curve**,
thick at the shoulders and tapering upward. The founder's correction was
explicit — *"neck curve needs to look more like a flamingo"* — and the bar
plate is the measure. It leaves the shoulders thick, rises in one long sweep,
and turns over at the top so the head hangs forward of where the neck left the
body. **Count the reversals: one.**

### The head
**Small and refined** in proportion to that long neck. The rejected version put
an oversized head on a short neck, and the whole bird changed species.

### The bill

**Take the shape from a swan.** Slender, of even taper, bending in one gentle
unbroken curve, with a small dark patch at the very tip. That single sentence
is what finally fixed this after six attempts; everything below is detail on it.

**Depth is the rule that matters.** Where the bill meets the feathers, its
depth top-to-bottom is about **one third of its length**, tapering from there
to the tip.

**Measure depth ACROSS the bill, the short way.** Take the line through the
centre of the nostril and measure from the bill's top outline square across to
the lower outline — not straight down the page. The bill is drawn on a slant of
about forty degrees, so a ruler held vertical reads a third again too deep.
Measure length from the centre of the eye to the tip. Both endpoints must land
on the drawn outline: a point that floats inside the pale, or beside the bird,
settles nothing.

On those landmarks the plates agree to within three percent — plate 1's bar
Drew, the tile, reads **0.36** (73 px across, 200 px long); plate 2's lower Drew
**0.37**; plate 4's two bar Drews **0.36** and **0.37**. The renders that drew
the founder's complaint ran **0.64**, nearly twice as deep. *Length was never
the fault:* four rounds were spent shortening a bill that was never too long.

**The black carries the outline, and that is how the plates draw it.** This
paragraph used to say the opposite — that the black was a marking painted onto a
pale bill, adding nothing to the silhouette. No reference in the repository
supports that. It was an invention, and it lost to the picture on every single
generation.

Measured in the tile the pipeline actually sends,
`canon/vision/drew-plate1-bar-reference.jpg` (380 × 520, a native crop of plate 1
at offset 230,1790): the bill's base at the feather junction is **(198,133)**,
the pale ventral outline ends at **(263,177)**, and the outer edge of the black
runs on to **(274,228)**. Pale **79 px** of a **122 px** bill. **The outer third
of the bill's length is outline drawn in black**, and a **bright highlight ribbon
runs inside it** — grey 219 and 138 against black of 15–35 beside it. All eight
plate Drews are drawn this way.

So the rule, matching the founder's hand:

- **The black is the outer third of the bill's length**, and along that third it
  *is* the outline. The silhouette runs continuously from pale into black with no
  step and no notch.
- **It continues the bill's own curve** to the tip. It does not steepen, it does
  not curl back underneath toward his throat, and it does not reach past the
  front of his chest.
- **One bright highlight ribbon runs inside the black**, along its length. This
  is correct and it was briefly, wrongly, forbidden.
- **The rear two thirds are pale**, top edge and bottom edge alike.
- **Depth stays at 0.36 measured across the bill** — that is the rule doing the
  real work, and it is the one the failing renders broke at 0.64.

*What actually went wrong* in the renders that drew the founder's complaint was
never the construction. It was **scale and curl**: the black ran far longer than
a third, sat on a bill twice as deep as it should be, and hooked back toward the
throat. The plates do the same thing, small and smooth.

**The lesson is the expensive one.** For six rounds the words asked for a bill no
reference showed, while `lib/generate.ts` pinned the label *"the black confined
to a blunt rounded cap"* onto a tile showing the exact opposite. The picture won
every time, as it always will. **Two rounds of rewording with no change is the
signal to stop writing and go look at the picture** — and if the picture and the
words disagree, one of them is wrong, and it is usually not the picture.

Upper and lower halves stay pressed together in one smooth closed line. Pale,
with a fine nostril slit and a small smile-line at its base.

**The nostril is one plain thin slit.** No lid, no lash, no catchlight. Given
any of those it renders as a *second eye on the bill*, which has happened.

**Count the lines that close round it: none.** On the tile the slit is about
**30 × 8 pixels** beside an eye of **33 × 20** — as long as the eye, under half
as deep — with one open arc above it and nothing drawn round the back. Half the
filed panels now ring it: sc09 draws a closed ellipse **35 × 22** against an eye
of **32 × 22** — same size, same depth, same construction as the eye, four
centimetres in front of it. **One slit, one open arc above it, no closed
outline.**

**What sits above the eye is one fine contour arc.** A single drawn line, the
same weight as the smile-line at the bill's base, curving over the lid and dying
away into the crown; between that line and the crown's dash-strokes the plumage
is smooth and pale. The lid is heavy, the cheek full and softly modelled. **The
eyes** below carries the rest of it: one line, never a shelf, never a second
raised lobe outlined over the lid.

#### The two-second test

> Trace the pale bill's outline with a finger, from the feather line to the
> tip. **Does your finger stay on one line the whole way?**
>
> **PASS** — one continuous outline, feather line to tip. The black lies inside
> it, and where the black lies over the edge the pale bill's own curve is still
> the edge of the drawing.
> **FAIL** — the outline stops where the pale stops, and a second, deeper shape
> begins there and finishes the silhouette by itself.

#### What failed, and why it is worth knowing

*(Founder: "fix Drew's beak.")* Six levers were pulled at this one detail. The
log is here because the lessons are not about beaks.

| Lever | Result |
| --- | --- |
| Ratio: "shorter than the head is wide" | **Failed.** Four inspectors, four endpoints for *head width*, ratios from 0.4 to 1.6 **on the same tile** |
| Ratio: "back of skull to bill tip ≤ 1.5×" | **Failed.** On an S-curve neck **there is no back of the skull** — the head merges into the neck and the landmark cannot be found |
| New reference tile (plate 4) | **Necessary, not sufficient.** Closed the gape; the renders copied its hook |
| Model effort raised to medium | **No change to the shape.** Finer linework, same bill |
| A second reference tile, close on the head | **No change** |
| "The black covers the front third" | **Partial win** — fixed the black's distribution where the relational rule had not |
| **Positive referent: "take the shape from a swan"** | **Fixed it** |

Three laws came out of it, and they apply to every rule in every bible here:

1. **Countable beats relational.** *"The front third"* changed the drawing;
   *"level with the chin"* did not. A relation the drawing has to compute is a
   rule it can ignore.
2. **Negation summons.** The rule forbidding a wild flamingo's bill *named a
   wild flamingo's bill* — and produced one for three rounds. These models read
   co-occurrence, not negation. Name the right thing instead.
3. **The reference out-votes the text.** When three rounds of rewording move
   nothing, stop rewording and go look at the conditioning image.

#### A standing warning about the source

Of the eight Drews in the four plates:

- **Plate 3's is the only one with the bill gaped open.** It was the identity
  tile for three rounds. Never cut from it.
- **Plate 4's ends in a curved black hook**, which the renders amplified into a
  talon. Its golf Drew *does* wear the full wardrobe, vest included — the older
  note here said otherwise and was wrong. He also wears a soft closed-crown cap
  rather than his visor. **The visor is the house choice**, kept so his small
  refined skull stays visible and so his golf headgear never reads as Mango's
  ball cap.
- **Plate 1 holds two Drews, and the tile is the lower one.** Cut from the bar
  panel only. The security Drew above him is a cutting hazard of the same kind as
  plate 4: his pale bill's edge ends near **(585,470)** and the black carries the
  silhouette on alone to **(600,520)**.
- **The bar Drew is the tile because he is the closest wardrobe-complete Drew at
  usable resolution — not because his bill is right.** His black is blunter and
  rounder than plate 4's scythe, but it hooks like the rest and carries a
  highlight streak, visible at 5× around x 528–560, y 1918–1950 of the plate.
  This sheet forbids both, and the tile teaches them anyway.
- **The full wardrobe — collar band, bow tie, V-neck honeycomb vest — appears on
  three of the eight:** plate 1's security Drew, plate 1's bar Drew, plate 4's
  golf Drew. Four more wear collar band and bow tie over the bare feathered
  breast — plate 2's two and plate 4's two bar Drews. Plate 3's wears the bow tie
  knotted straight onto the neck feathers, with no collar band at all. **We dress
  him fully in every panel regardless: that is a house rule, set in
  `canon/MASTER-PROMPT.md`, not a majority of the plates, and it is not up for a
  recount.** All ten filed panels wear the vest, so nothing in current output
  shows what his shoulders are built like.
- **No bill-length ranking is recorded here.** Every head-normalised ratio tried
  on these plates has failed the same way — see the table above: four inspectors,
  four endpoints, on one tile — and plate 3's bill is gaped, so it has no single
  length. Before such a number goes in this block, name the two landmarks it was
  measured between.

**And cut it at native resolution.** The plate-4 tile was a 2.94× upscale of a
300-pixel region: mean pixel gradient **3.41**. The model was handed a smear
whose most salient dark shape was the hooked tip. The current tile is 380 pixels
of real linework, unenlarged, at **7.91**.

The figure is `mean(|dI/dx|) + mean(|dI/dy|)`, halved, over the greyscale. Write
the formula down whenever the number is quoted or it cannot be checked. On it the
four plates read **7.10**, **4.78**, **5.84** and **8.35** — a 4.78–8.35 spread,
not the 7–8 this note used to claim. A tile is sharp enough when it is at or
above its own plate; 7.91 against plate 1's 7.10 clears that.

### The eyes
**Heavy-lidded and deadpan**: visible white, a distinct dark iris and pupil, and
an upper lid that comes down across the eye as one long low line. They read as
dry, unimpressed intelligence. Never a flat bird-dot.

The lid is the whole effect, and the plates carry it with **one line, not two**:
a single lid margin across the eye, one fine contour arc above it, and between
that arc and the crown's dash-strokes **smooth pale plumage**. On plate 1's bar
Drew that smooth zone is about **20 pixels deep** above a **30-pixel-wide** eye.
Dashes arced over the lid read as lashes or a ridge — sc09 draws them, and it is
the most severe head in the batch.

The proportions are **not** drifting. Measured across plate 1's bar Drew, plate
2's Drew, sc01, sc03, sc07 and sc09, the opening's depth over width is **0.50**
in the plates and **0.50** in the panels, and the iris sits **0.76** of the way
from the rear corner to the front in the plates against **0.73** in the panels.
Do not send a panel back for the eye without the number.

### The face — amiable, never a ghoul
> *(Founder: "Drew looks scary.")*

The deadpan is **fond**. Plump, softly modelled cheeks; a faint smile-line;
the look of a man who has heard the story before and likes you anyway.
**Never** gaunt, hollow-eyed, sunken, skull-like, staring, or sinister. He is
a gentleman at his club.

### The body
Plump and soft-bodied — a well-fed bird, not an athletic one. Rounded breast,
soft shoulders.

---

## 4. Hands — the one human thing

At the end of each feathered arm is a **genuine hand**: **feather-covered**,
with a soft fluffy cuff at the wrist, and long scalloped tiers of wing feathers
hanging beneath each forearm.

**How much of the hand separates depends on the view.** Plate 1's security Drew
shows four fingers with drawn knuckle creases and a working thumb; plate 1's bar
Drew closes four digits on the stem with nail crescents on the top two; plate 3
shows three fingertips clear of the stem. Plate 2's two Drews and plate 4's golf
Drew fold to three soft lobes at rest. **Three digits closed on a stem is the
floor, not the target** — and a fused paddle with no division in it is only on
model at plate 4's distance from camera, never in a close bar panel.

What is required in every case is that the grip be real: **a digit crosses in
front of the stem**, the digits do not pass through it, and the glass is
genuinely supported.

The standing order for the whole cast:
> *"Focus on the hands — they need to have feathers and fur but be humanoid."*

Texture stays animal; construction stays human. Every finger distinctly drawn —
**four fingers and an opposed thumb**, the count `canon/HARRINGTON-VISION.md`
sets from the founder's note *"his hands need to be changed … more human."*

**The martini is the test.** His hand must look natural and graceful holding
the glass **by the stem**, in a dainty, pinky-elegant grip. If the hand looks
awkward, clubbed, or like a wing pretending to be a hand, redraw it. This is
the single most-looked-at detail in the strip.

---

## 5. Wardrobe

| Item | Rule |
| --- | --- |
| **Bow tie** | Small, solid black, silk, sitting at the throat. **His default skin** — never without it. **The bow is the only black at his neck:** no band, ribbon, strap, cord or choker runs around the neck or behind it. **Drawn as a tied bow, anatomically:** two wings of equal size spreading left and right, each wider at its outer edge, pinched to a small centre knot — horizontal, level, centred under the chin, resting ON the collar. Never one lump, never a knotless butterfly, never tilted or vertical, never more than two wings |
| Collar band | Crisp, starched, white, circling the base of the neck under the tie |
| Sweater vest | V-neck, fine honeycomb or rib knit, ribbed edges, over a pale collared shirt |
| Trousers | Yes *(founder: "he needs to have pants")* — **and never in frame.** No plate and no filed panel puts anything below his chest in shot; the counter crops him. This row says what he owns. Nothing to inspect, so nothing to tick |
| Golf | Adds a pale **visor** — over the bow tie, never instead of it |
| Occasional | A monocle is approved |

Themed dressing stays in this key: knitwear and club-house. Never a costume.

---

## 6. Props and staging

- **The martini** is always within reach at the bar — conical stemmed glass,
  **one olive on one pick**, standing on a square napkin or coaster. Lifted by
  the stem. Count them: six of the seven martinis in the plates hold exactly one
  olive and the seventh holds two; the filed panels hold two in seven of ten and
  three in two more. Every olive is threaded on the pick — none floats loose in
  the cone.
- **One bowl, one stem, one foot, and the foot stands on something.** In every
  plate the glass stands on its own foot on the marble and a digit crosses in
  front of the stem above it. In sc01 the cone stops at (255,1425) with no stem,
  no foot and no counter under it; in sc06, sc09 and sc10 the fingers rest
  alongside the stem without closing on it, and the glass is held up by its own
  foot rather than by him. The cone never ends in a hand, a nub, or the bottom
  edge of the panel.
- **The grip has no reference tile.** `drew-plate1-bar-reference.jpg` is 380 ×
  520, and the martini enters it only at the bottom right corner: about ninety
  pixels of bowl rim and one olive — no stem, no foot, no hand. The detail this
  sheet calls the single most-looked-at in the strip is conditioned on words
  alone. If it drifts again, **recut the tile to include the whole glass and the
  hand. Do not rewrite the sentence.**
- **Frame-left** by default, neck arched so his face hangs where the gag needs
  it, eye sliding sideways at Mango.
- **He is a patron, never staff.** We look toward the bar from the dining room,
  so the **back bar with its bottles and mirror is behind him — and that is
  correct.** What settles it is the **marble counter between him and them**: he
  sits on the room side, our side. He is never in the service well, never
  pouring, and **never holding a liquor bottle or a bar towel** — a gentleman
  holding either reads as the bartender, and that was the original fault.
- Bar panels are **cropped at the counter** — chest-up, no legs, no stools.

---

## 7. Acting

Drew's register is **understatement**. He reclassifies things: he takes a
headline and renames it into what it actually is. He does not shout, explain
the joke, or panic — and he never cusses or slanders.

His lines are verdicts:
- *"Rates will come down. I've simply stopped asking when."*
- *"Committed is money that hasn't had its second thoughts yet."*
- *"The target follows the price at a respectful distance. It's called research."*

Against Mango's worry he is the still point. Against Abby's authority he

### What his face does

Everything above is about the caption. This part is about the drawing, and it is
here because ten panels in a row came back with one head. **His bill never opens,
so it carries no expression at all.** The performance is the lid, the iris, and
the angle of his neck.

The neck angle is the one that is measurably stuck. Take the line from the centre
of his eye to the centroid of the black bill tip, and read its angle below
horizontal. Across the plates it runs from about **40°** — head carried up, plate
4's globe Drew — to about **56°**, head bent over the drink, plate 2's lower
Drew. The ten filed panels came in at **56° ± 4°**, nine of them inside a single
7-degree band. That is one head, drawn ten times.

**Across any batch of ten, at least three panels carry the head up at 40–46°**,
and when the line is Drew's, draw him with the head up. The house types a name in
front of the caption; the reader should not need it.
defers with amusement — she settles the argument, and he enjoys that.

---

## 8. Forbidden — any one of these is a redraw

- A human body, human skin, bare forearms, or a human face
- A neck with no reversal in it, or one short enough to sit the head on the shoulders
- A gaped bill; a bill deeper than **0.45** measured across at the nostril line over its eye-centre-to-tip length (the plates sit at 0.36–0.37 — draw to a third)
- An oversized head
- More than one line above the eye — a shelf, a second raised lobe, or feather dashes arced over the lid
- A nostril with a closed outline round it, or with a lid, lash or catchlight
- Black hung off the end of the bill as a second mass: the pale bill's own outline stops and a deeper shape carries the silhouette on past it, or a white blade is drawn inside the black
- A gaunt, hollow-eyed, skull-like or sinister look
- Missing bow tie; any black band, strap or ribbon around the neck behind the bow
- A bow tie without a centre knot, with one wing or more than two, or tilted off horizontal
- Any cuff, hem or seam crossing the arm — plumage drawn as a sleeve
- Wingtips instead of hands, or hands that can't hold a stem
- Fewer than three digits closed on the stem, or no digit crossing in front of it
- A martini drawn as a bowl alone — no stem, no foot, nothing underneath it
- A third olive, or an olive floating free of the pick
- Standing behind the bar among the bottles

---

## 9. Approval standard

A panel passes when a reader who knows the plates would say *that is the same
bird* — and when the panel would look right hanging beside them. Long neck,
small head, amiable eye, bow tie, feathers to the fingertips, and a martini
held like a gentleman.
