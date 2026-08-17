# The Master Prompt

<!-- BRAND: replace when final — "The Swinging Door" is the working series/bar name throughout this document -->

Purpose: the one page an AI reads before drawing. The BASE block below is assembled from the whole canon and is pasted **verbatim** into every image request; only the three slots change per cartoon. Do not paraphrase the base — paraphrase is how the strip drifts.

## How to use

1. Paste the BASE block exactly as written.
2. Fill the three slots: `[SCENE]`, `[TV]`, `[BOARD]`.
3. The caption is **never sent to the image model**. After the text-free illustration is approved, `npm run dialogue` typesets the exact JSON caption below the panel. See the checklist before filing.

## BASE block

> A single-panel gag cartoon in black-and-white ink wash, in the manner of a dry mid-century American magazine cartoon: confident, variable-weight brush linework over soft gray washes; exactly three values (paper white, one mid-gray wash, solid black ink); no color, no photorealism, no 3D-render or anime look. The scene is the interior of The Swinging Door, a classic old American bar, drawn at eye level from across the room. The dark-wood bar with stools runs along the lower third. The front window, upper right, carries the bar's name lettered in reverse, as read from inside. A small TV sits high on the left wall, showing [TV]. A chalkboard behind the bar reads [BOARD]. A few pieces of framed Americana hang on wood paneling — the walls are never crowded. Drew is a flamingo: tall, one smooth S-curved neck, small round head, thin straight beak, dot eyes with single brow strokes, a black bowtie where neck meets body; he stands at the bar on thin reed legs, a gin martini with three olives on a pick beside him on a coaster. Mango matches `canon/characters/dog/full-body-sheet.png` and `identity-sheet.png` exactly: a 46-year-old male anthropomorphic golden retriever with an upright human-readable body, solid soft middle-aged build, rounded shoulders, modest belly, sturdy legs, a thin neck with almost no throat ruff, textured face and feathered drop ears, human-shaped five-finger hands with subtle paw pads, broad canine feet, and absolutely no tail. His emotionally readable eyes show distinct paper-white sclera, a separate mid-gray iris, a separate round black pupil, controlled catchlights, subtle lids, short lashes, and soft fur-brow arcs. In the standard bar scene he sits on a stool with human posture, wearing a rumpled jacket over the canonical base body; the exact simplified waving USA flag pin from `lapel-pin-bible.png` is fixed to the left lapel, and an old fashioned sits in front of him. Mango's wardrobe may change only when [SCENE] requires it; his body and identity never change. Expressions are restrained and dry but the gaze remains alive. No speech balloons, no thought bubbles, no caption text, and no lettering anywhere in the image except the reversed window sign, the short chalkboard lines, and the TV screen. One clear focal action; generous white space. [SCENE]

Add **only when the gag needs her** (about one cartoon in ten), using `canon/characters/abby/full-body-sheet.png` plus the one relevant specialist sheet: *Abby is the adult female anthropomorphic West Highland White Terrier who owns and works The Swinging Door. Match her approved sheets exactly: compact textured Westie head, upright triangular ears, short canine muzzle, black canine nose, and medium-sized living human-style eyes integrated into the canine face with visible white sclera, separate gray irises, separate black pupils, controlled catchlights, clear lids, refined lashes, and expressive brow-fur. She has an upright feminine hourglass build with a fuller bust, narrow waist, slim hips, smooth hairless shapely legs, a natural thigh gap, five-digit hands, and absolutely no tail. Her locked work outfit is a fitted light collared blouse with rolled sleeves and only the top button open over modest scalloped lace, a very short dark fitted bartender skirt/apron with a centered back bow, a folded shoulder towel, a delicate bracelet, black closed-toe mid-height heels, and one close strand of small round pearls with a centered oval faceted gemstone. She is smiling, intelligent, quick-witted, warm, poised, competent, and in charge, ordinarily behind the bar and visibly mid-task.*

## The slots

- `[SCENE]` — one sentence: who is doing what. Example: *"Mango is mid-story with a raised paw while Drew signals toward the taps without looking away from the TV."*
- `[TV]` — two or three words on the screen: `MARKETS OPEN`, `BREAKING`, `DOW −312`. The TV is how the day's news enters the room.
- `[BOARD]` — two to four chalk words, allowed to carry a background gag: `PATIENCE, SERVED DAILY`, `HAPPY HOUR 4–?`.

## Never draw

- Color. Ever. Including the flag pin — it reads by shape.
- Speech balloons, thought bubbles, or any caption lettering inside the panel.
- Drew without his bowtie; Mango without his flag pin when the jacket is on.
- A tail on Mango or Abby. Never give Abby a tail slit, tuft, bulge, furry legs, paw feet, bead eyes, plain choker, long skirt, trousers, missing lace, or missing pearl-and-gem collar. Never give Mango a thick or beard-hidden neck, quadruped forepaws, black bead eyes, or a different body under new clothes.
- Mango's pin on the right lapel, mounted to a pole, oversized, or rendered with dense tiny stars/stripes; use the locked nine-star, seven-band waving pin.
- Long legible text: window, chalkboard, and TV only, all short — image models garble prose.
- A modern sports bar: no neon, no big screens, no crowds. Background patrons only if the gag needs them, minimal and faceless.
- Crowded walls, busy compositions, more than one focal action.

## Training-week protocol (while the bible is being tuned)

Every batch is an experiment, not five rolls of the same dice:

- Vary **one deliberate thing per candidate** — a looser or tighter wash, a longer or shorter caption, gag carried by the TV vs. a prop vs. pure posture, Abby present or absent, wider or closer framing.
- Tag each candidate's variation in `file_cartoon`'s `style_notes` ("8-word caption", "no TV, prop gag") — his reactions then attach to *known* differences.
- When the founder's feedback names a pattern (see `get_feedback`), let the next batches test the fix, and say what you changed.

**The graduation test (end of the week).** The bible is done when the AI can call his shots. On the last day, before filing a fresh batch, study `get_feedback` and *predict his verdict for each candidate* — love it, fine, or not for me — writing the predictions down before he sees anything. Then let him rate as usual and compare. **Four right out of five means the bible reads his taste well enough to present.** Fewer than that: the misses say exactly which chapter is still thin — revise it and test again the next day.

## Checklist before filing (all must pass)

1. Drew's bowtie ✓ Mango's left-lapel flag pin ✓ Abby's pearl-and-gem collar and no-tail silhouette when present ✓ window lettering reversed ✓.
2. Three values, strictly B&W, single panel, generous margins.
3. No balloons and no model-rendered caption in the illustrated panel; add the exact JSON caption afterward with `npm run dialogue`.
4. The visual gag reads in two seconds without the caption; the caption deepens it rather than explaining it (≤ 20 words, dry, underplayed).
5. The boundaries in `/canon/comedy/COMEDY-BIBLE.md` all pass.
6. Three genuinely distinct takes filed per `/canon/creation/WORKFLOW.md` — different scenes or speakers, not three crops.
