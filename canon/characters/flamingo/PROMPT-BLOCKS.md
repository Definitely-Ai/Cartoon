# Drew Prompt Blocks

Use these blocks with `canon/MASTER-PROMPT.md`. They are designed to keep identity separate from scene variables and to make reference use explicit.

## Required Attachments

For every Drew image:

1. attach `full-body-sheet.png` as the primary identity reference;
2. attach `identity-sheet.png` when the face is readable;
3. attach `wing-hand-sheet.png` when a wing-hand, gesture, or held object is readable;
4. attach at most two additional Drew support sheets relevant to the shot.

State that the locked master outranks all other references. Never use a previously generated scene as the sole identity reference.

## Locked Identity Block

Paste verbatim whenever Drew appears:

> Preserve Drew exactly from the attached locked master: a 46-year-old male anthropomorphic flamingo of average healthy build, with a compact mature head, a pale-and-dark angular downturned flamingo beak, and a long slim neck held in a pronounced smooth S-curve. His small lively avian eyes have controlled visible white, a distinct iris and darker pupil, one restrained catchlight, fine lid contours, and a clearly directed gaze. His arms are layered feathered wing-arms ending in three articulated feather-digits—one short thumb-feather and two longer finger-feathers—with only tiny pale avian nail tips. He has long slim bird legs, webbed flamingo feet, natural feather covering, and one small solid-black bow tie at the neck base. Keep his mature proportions, species anatomy, and poised restrained bearing unchanged.

## Base-Model Block

Use for turnarounds, anatomy, or scenes where no clothing is specified:

> Show Drew's G-rated base model completely covered in natural plumage with only his permanent black bow tie. Do not add a shirt, suit, jacket, trousers, shoes, hat, or other clothing. Clothing shown in other references is scene-specific and must not be copied into the base model.

## Scene-Clothing Block

Use only when the scene requires clothes:

> Add [GARMENT] as scene-specific wardrobe fitted over Drew's locked body. Preserve his average build, long S-neck, wing-arm feather structure, and black bow tie. Sleeves follow the layered wing-arms and never turn them into human arms. This outfit belongs only to this scene and does not redefine his base model.

## Eye and Expression Block

> Drew's expression is [EXPRESSION] at [INTENSITY]/5. Keep the eyes small and avian with controlled sclera, a distinct iris and pupil, one subtle catchlight, fine lid contours, and gaze fixed on [GAZE TARGET]. Convey emotion through lid aperture, iris direction, head pitch, beak seam, neck posture, and an economical wing gesture. Do not use black bead eyes, huge white eyes, concentric alien eyes, glamour eyelashes, human eyebrows, or photoreal human eyes.

Approved `[EXPRESSION]` values: neutral, curious, subtle smile, open smile, skeptical, amused, concerned, surprised, thinking, listening, speaking.

## Smile Block

> Drew is [SUBTLY / OPENLY] smiling. Create the smile through a slight lift in the rear beak seam, a soft lower-lid response, brighter focus, lifted head, and open posture. If the beak parts, keep the opening small and anatomically plausible. No human lips, teeth, tongue emphasis, cheeks, or pasted-on human grin.

## Curiosity Block

> Curiosity is the dominant read. Drew's gaze lands precisely on [SUBJECT]; his head leads the torso and his long neck leans forward while retaining the rounded S-curve. One feather-digit may rise in a restrained question gesture. He looks attentive and analytically interested, never nosy, frantic, vacant, or childlike.

## Wing-Hand and Prop Block

> Build both arms as layered feathered wing-arms, not skin arms or sleeves. The visible feather-hand has one short thumb-feather and two longer finger-feathers with tiny pale avian nail tips. For [GESTURE OR PROP], preserve a clear feather silhouette and a mechanically plausible contact point. Simplify the grip or prop instead of morphing the hand into a human palm or five fingers. No extra wings, bare skin, manicured nails, claws, or talons.

Approved gesture terms: folded rest, one-digit question, open explanation, martini hold, bar lean, point, small shrug, listening fold, writing, reading.

## Signature Martini Block

Use only when the scene calls for the recurring drink:

> Include one classic clear martini in a stemmed triangular glass with exactly three olives on one pick. Place it [ON A COASTER WITHIN REACH / IN DREW'S FEATHER-HAND]. Do not change the olive count and do not fuse the glass with his feathers.

## Camera Continuity Block

> Camera: [SHOT] at [ANGLE]. Preserve Drew's beak length and bend, compact head, neck thickness and attachment, continuous S-curve, wing-feather layering, black bow-tie placement, and scale relative to the environment. A crop may not remove the species or gesture information required for the joke.

Suggested `[SHOT]`: close-up, head-and-neck, medium, full figure, wide, seated two-shot. Suggested `[ANGLE]`: front, three-quarter front, profile, three-quarter back, back.

## Style Block

> Render as a sophisticated hand-drawn black-and-white American editorial cartoon: confident variable-weight black line, restrained transparent gray ink wash, warm off-white paper, selective short feather marks, and controlled crosshatching only where it clarifies anatomy or overlap. Keep Drew and the gag dominant; render the background one step lighter and looser. No color, photorealism, glossy 3D, anime, flat vector art, clip-art mascot style, muddy all-over wash, dense texture, watermark, or signature.

## Negative Block

Append verbatim to any Drew generation:

> Do not redesign Drew. No human face, hair, ears, nose, lips, teeth, moustache, jaw, arms, palms, or five-fingered hands. No duck, parrot, pelican, stork, or thin straight beak. No short, straight, thick, kinked, or swan-like neck. No giant alien eyes, all-black bead eyes, oversized sclera, target eyes, glamour lashes, or pasted-on human eyes. No extra wings, bare skin arms, talons, long claws, human nail beds, manicure shapes, black nail tips, or polish. No extreme thinness, bodybuilder muscles, pot belly, child proportions, permanent suit, missing bow tie, color, 3D, anime, photorealism, vector-flat art, or traits borrowed from another character.

## Complete Scene Template

```text
Reference priority: full-body-sheet.png is the locked master and outranks all support images.

[PASTE LOCKED IDENTITY BLOCK]

Scene: [ONE SENTENCE DESCRIBING ACTION AND RELATIONSHIPS].
Setting: [LOCATION AND ESSENTIAL CONTINUITY DETAILS].
Camera: [SHOT AND ANGLE].
Expression: [EXPRESSION, INTENSITY, GAZE TARGET].
Wardrobe: [BASE MODEL / SCENE-SPECIFIC GARMENTS].
Wing gesture and prop: [ANATOMICALLY FEASIBLE ACTION].

[PASTE STYLE BLOCK]
[PASTE NEGATIVE BLOCK]

Do not render the caption, title, date, catalog line, speech balloon, signature, watermark, or long readable text inside the illustration. Reserve clean space for deterministic dialogue added afterward.
```

## Prompt Order

Keep the prompt in this order to prevent scene details from overruling anatomy:

1. reference priority;
2. locked identity;
3. scene action;
4. camera and expression;
5. scene-specific wardrobe;
6. wing gesture and prop;
7. environment;
8. style;
9. negative block;
10. deterministic text instruction.

Do not bury identity after scenery, clothing, or mood. Do not paraphrase the locked identity block from memory.
