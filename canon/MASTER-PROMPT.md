# The Master Prompt

<!-- BRAND: replace when final — "The Swinging Door" is the working series/bar name throughout this document -->

Purpose: the one page an AI reads before drawing. The BASE block below is assembled from the whole canon and is pasted **verbatim** into every image request; only the three slots change per cartoon. Do not paraphrase the base — paraphrase is how the strip drifts.

## How to use

1. Paste the BASE block exactly as written.
2. Fill the three slots: `[SCENE]`, `[TV]`, `[BOARD]`.
3. The caption is **never sent to the image model**. After the text-free illustration is approved, `npm run dialogue` typesets the exact JSON caption below the panel. See the checklist before filing.

## BASE block

> A single-panel gag cartoon in black-and-white ink wash, in the manner of a dry mid-century American magazine cartoon: confident, variable-weight brush linework over soft gray washes; exactly three values (paper white, one mid-gray wash, solid black ink); no color, no photorealism, no 3D-render or anime look. The scene is the interior of The Swinging Door, a classic old American bar, drawn at eye level from across the room. The dark-wood bar with stools runs along the lower third. The front window, upper right, carries the bar's name lettered in reverse, as read from inside. A small TV sits high on the left wall, showing [TV]. A chalkboard behind the bar reads [BOARD]. A few pieces of framed Americana hang on wood paneling — the walls are never crowded. Drew is a flamingo: tall, one smooth S-curved neck, small round head, thin straight beak, dot eyes with single brow strokes, a black bowtie where neck meets body; he stands at the bar on thin reed legs, a gin martini with three olives on a pick beside him on a coaster. Mango is a golden retriever: broad-shouldered and friendly, floppy ears, seated on a stool with forepaws on the bar, wearing a rumpled jacket with a small American-flag pin on the left lapel, an old fashioned in front of him. Expressions are minimal and dry. No speech balloons, no thought bubbles, no caption text, and no lettering anywhere in the image except the reversed window sign, the short chalkboard lines, and the TV screen. One clear focal action; generous white space. [SCENE]

Add **only when the gag needs her** (about one cartoon in ten): *Abby, a small westie bartender, behind the bar with a towel over one shoulder, mid-task, faintly amused.*

## The slots

- `[SCENE]` — one sentence: who is doing what. Example: *"Mango is mid-story with a raised paw while Drew signals toward the taps without looking away from the TV."*
- `[TV]` — two or three words on the screen: `MARKETS OPEN`, `BREAKING`, `DOW −312`. The TV is how the day's news enters the room.
- `[BOARD]` — two to four chalk words, allowed to carry a background gag: `PATIENCE, SERVED DAILY`, `HAPPY HOUR 4–?`.

## Never draw

- Color. Ever. Including the flag pin — it reads by shape.
- Speech balloons, thought bubbles, or any caption lettering inside the panel.
- Drew without his bowtie; Mango without his flag pin when the jacket is on.
- Long legible text: window, chalkboard, and TV only, all short — image models garble prose.
- A modern sports bar: no neon, no big screens, no crowds. Background patrons only if the gag needs them, minimal and faceless.
- Crowded walls, busy compositions, more than one focal action.

## Checklist before filing (all must pass)

1. Bowtie ✓ flag pin ✓ window lettering reversed ✓.
2. Three values, strictly B&W, single panel, generous margins.
3. No balloons and no model-rendered caption in the illustrated panel; add the exact JSON caption afterward with `npm run dialogue`.
4. The visual gag reads in two seconds without the caption; the caption deepens it rather than explaining it (≤ 20 words, dry, underplayed).
5. The boundaries in `/canon/comedy/COMEDY-BIBLE.md` all pass.
6. Three genuinely distinct takes filed per `/canon/creation/WORKFLOW.md` — different scenes or speakers, not three crops.
