# Mango — Canonical Description

**Canon version:** 1.0.0

**Status:** locked (founder-approved working model)

**Effective date:** 2026-08-17

Purpose: this is the compact authority for Mango. The single paste-ready identity text is the MANGO paragraph inside the BASE block of [`canon/MASTER-PROMPT.md`](../../MASTER-PROMPT.md); [PROMPT-BLOCKS.md](PROMPT-BLOCKS.md) carries it verbatim with the other paste blocks. The deep construction and performance rules live in [CHARACTER-BIBLE.md](CHARACTER-BIBLE.md); the approval gates live in [QUALITY-CONTROL.md](QUALITY-CONTROL.md). Do not average Mango with a generic golden retriever, a mascot, or an earlier repository image.

## Reading Summary (non-normative)

This paragraph is for human readers; the master prompt paragraph is the paste text.

Mango is a 46-year-old male anthropomorphic golden retriever with a fully upright, human-readable body and an unmistakably canine head. He is solid and softly built—substantial and comfortable, but neither fat nor muscular—with rounded shoulders, a modest middle, sturdy legs, a thin neck, and almost no throat ruff. His tail is absent. His five-finger hands are human-shaped enough to hold a glass and gesture naturally, but retain fine fur, rounded fingertips, and discreet canine paw pads; his feet remain broad, plantigrade canine feet. His Golden Retriever face has a moderate muzzle, black nose, feathered drop ears, and layered facial-fur texture, while the throat stays short-haired and beard-free. His eyes are human-readable and emotionally precise: clearly visible paper-white sclera (about half the open-eye area), gray iris, black pupil, controlled catchlights, subtle lids, short lashes, and soft fur-brow arcs. He is approachable, earnest, intelligent, patriotic, story-prone, and quietly amused. The base model is clothing-neutral so wardrobe can follow the scene. In his standard bar appearance he wears a collared shirt under a rumpled jacket; the pin is mandatory on any lapeled jacket, always the left lapel; on lapel-less outerwear it moves to the left chest.

## Locked Visual Anchors

- **Age and bearing:** adult male golden retriever, 46—not a puppy, cub, mascot, or elderly dog; adult dignity in every pose.
- **Posture:** anthropomorphic and fully upright, with human posture and human-scale gesture language.
- **Build:** solid, soft, approachable; heavier than lean, lighter than obese, never bodybuilder-defined.
- **Height:** reads as approximately six and a half heads.
- **Neck:** thin and visible, minimal throat fur; no beard, mane, bib, or chest ruff.
- **Tail:** none, in any view—rear, seated, action, silhouette, or clothed.
- **Hands and feet:** human-shaped five-finger hands with canine surface cues; broad plantigrade canine feet. The word "paw" never appears in prompt text for his hands.
- **Face:** textured golden-retriever face—feathered drop ears, moderate muzzle, black nose, soft cheek feathering.
- **Eyes:** human-readable monochrome eyes with clearly visible paper-white sclera (about half the open-eye area), distinct mid-gray iris, distinct black pupil, and catchlights.
- **Pin:** the simplified waving USA flag pin—mandatory on any lapeled jacket, always the left lapel; on lapel-less outerwear it moves to the left chest.
- **Tone:** warm, earnest emotional baseline; never mean, predatory, smug, vacant, or defeated.
- **Style:** strictly black-and-white hand-drawn ink—exactly three values (paper white, one mid-gray wash, solid black ink); never color.
- **Thumbnail priority:** thin neck, no tail, broad soft body, floppy ears, white-eye readability, left-lapel pin shape.

## Character Read

Mango is the earnest heart of the duo: patriotic, story-prone, institution-skeptical, sometimes world-weary, and happy underneath it. He leans toward people and stories where Drew leans toward information and mechanisms. He may be earnest or mistaken, but never buffoonishly frantic. He reads first as a middle-aged man at the bar and second as a golden retriever—not as a dog standing unnaturally on its hind legs.

## Controlled Performance

Mango's approved expression range (canonical ranges, not separate identities — mechanics in the bible, §12):

- neutral/attentive;
- warmly happy;
- mid-story;
- thoughtful;
- skeptical;
- concerned;
- world-weary-but-happy;
- surprised (modest — never a reaction meme).

He leads with eyes and hands, supported by a small head angle, ear position, and a restrained mouth. Gaze direction comes from moving the iris and pupil within the visible sclera, not from rotating the whole head every time. Gestures stay economical enough for a single-panel magazine cartoon.

## Prompt Vocabulary

- Mango has **hands** — the word "paw" never appears in prompt text for his hands. Write "hands," "five-finger hands," or "human-shaped hands"; "subtle paw pads" as a surface detail (exactly as the locked paragraph writes it) is the only permitted use of the word.
- Never borrow Drew's vocabulary ("wing-hands," "feather-digits") or anatomy for Mango, and never import Drew's or Abby's traits, clothes, props, silhouette, or expressions.

## Stage Position

An identity constant, not a scene variable: in the standard bar scene Mango is on the **patron/room side** of the bar, **seated on a stool with human posture**—hips on the seat, knees forward, feet planted or on the stool rail, torso upright or casually leaned. He never occupies the bartender's service side.

## Scene Variables and Wardrobe

The base model is clothing-neutral; wardrobe is dictated by the scene, occupation, weather, and joke. Clothing changes; body, head, eyes, neck, hands, feet, and the no-tail rule do not.

- Standard Swinging Door look: a slightly rumpled, comfortable jacket with soft lapels over an open-collar shirt; straight or gently relaxed trousers; the USA pin on the left lapel.
- The pin is mandatory on any lapeled jacket, always the left lapel; on lapel-less outerwear it moves to the left chest.
- Other scenes (golf, fishing, travel, weather, work, formal) may use appropriate clothing fitted over the approved base model.
- No accessory may compete with the USA pin or change his silhouette permanently.
- Scene-variable details never become permanent canon: an outfit, prop, or expression from one cartoon does not carry into the next without an explicit continuity instruction.

## Signature Prop: The Old Fashioned

Mango's recurring drink is an old fashioned: a **short rocks glass** with **one large cube** and restrained garnish (a single peel at most, often none). It rests **flat on the bar** (or a coaster) or sits in a **real five-finger grip**—never floating, tipped without a story reason, or fused with his hand. In the standard bar scene it sits on the bar in front of him; elsewhere it is optional unless the gag calls for it.

## Reference Hierarchy

When references disagree, use this order:

1. `full-body-sheet.png` — locked master model.
2. The written canon — this document and `CHARACTER-BIBLE.md`.
3. `canon/MASTER-PROMPT.md` — the assembled BASE block and its MANGO paragraph.
4. The relevant specialist/support sheet (`identity-sheet.png`, `lapel-pin-bible.png` in its pin domain).
5. Older cartoons — story history only; never use them to override the sheets or documents above.

Never average conflicting references; match the master and flag the conflict for review. Do not blend old and new models—if the current sheets are attached, match them rather than inventing a compromise.

## Model Sheet Index

Reference sheets are fetched with `get_model_sheet` over the studio connector, or attached directly when working in-repo.

| File | Authority | Use |
| --- | --- | --- |
| `full-body-sheet.png` | **Locked master** | Primary body, silhouette, neck, hands, feet, facial texture, eye construction, and no-tail authority. Attach to every Mango generation. |
| `identity-sheet.png` | Review support | Close identity check for face, eyes, expression, muzzle, ears, and fur texture. Attach to every Mango generation. |
| `lapel-pin-bible.png` | Review support (pin authority) | Exact USA pin design and left-lapel placement. Attach whenever Mango is jacketed. |

The locked master outranks every support sheet. If references disagree, follow `full-body-sheet.png` and the written canon, then flag the support sheet for review.

## Never

- Never draw a tail, tail opening, tail bulge, or ambiguous tail-like shape.
- Never thicken the neck, hide it behind a beard, or surround it with a fluffy ruff, mane, bib, or chest ruff.
- Never lose the three separate eye shapes: clearly visible paper-white sclera (about half the open-eye area), separate gray iris, separate black pupil.
- Never use black bead or button eyes, giant anime eyes, colored irises, crossed eyes, or an emotionally vacant gaze.
- Never use quadruped forepaws, mitten hands, rubber-hose gloves, naked human skin hands, or claw-heavy hands—and never write "paw" for his hands in prompt text.
- Never make the body athletic, thin, obese, puppy-proportioned, or bodybuilder-muscular.
- Never smooth the facial fur into generic blankness or grow it into a beard or mane.
- Never omit the pin on a lapeled jacket, put it on the right lapel, mount it on a pole, over-detail it, or oversize it.
- Never omit the collared shirt under the standard jacket—no jacket over bare fur.
- Never let wardrobe change the underlying body, head, neck, hands, feet, or age.
- Never seat Mango on the bartender's service side, or seat him on nothing.
- Never use color, photorealism, 3D, vector-flat, anime, or digital gloss—exactly three values (paper white, one mid-gray wash, solid black ink).

## One-Second Canon Test

Hide the pin and caption. If the thin neck, no-tail silhouette, broad soft body, floppy ears, white-eye readability, five-finger hands, and adult bearing do not still read immediately as the same Mango, reject the image and revise it.
