# Creation Workflow

<!-- BRAND: replace when final — "The Swinging Door" is the working series/bar name throughout this document -->

Purpose: the repeatable path from "new topic" to "published cartoon," per the founder's series bible — written so any assistant (human or AI) produces series-consistent Swinging Door cartoons.

## The seven steps (per new topic)

1. **Verify current factual context when needed.** Captions are topically current with events of the day; check the facts before joking about them.
2. **Place the joke in a single clear visual scene.** Usually inside The Swinging Door (see `/canon/settings/SETTINGS-BIBLE.md`); the TV is how the news enters the room.
3. **Use the characters' personalities to decide who speaks** (see `/canon/personality/PERSONALITIES.md`). Drew names the absurdity; Barclay believes his way into it; Abby closes an argument, rarely.
4. **Write 3–5 caption options.** Short, dry, underplayed; the caption deepens the visual gag rather than explaining it (see `/canon/comedy/COMEDY-BIBLE.md`).
5. **Choose the strongest caption.** Read the boundaries list before committing.
6. **Create the illustrated panel, then typeset the exact dialogue into it.** Generate the character scene without model-rendered words, then append the print-ready caption deterministically (`file_cartoon` over the connector; `npm run dialogue` in-repo). This preserves character continuity and prevents misspellings.
7. **Maintain a catalog by date.** During the training week everything files into `/options/YYYY-MM-DD/` (the studio's daily inbox) — filing IS cataloging, and the founder's 1–10 art and caption scores attach to each option. The public `/cartoons/YYYY-MM-DD-slug/` side is parked until he decides the strip is ready. Either way, the JSON caption must exactly match the dialogue printed in the artwork; the site supplies titles, dates, and catalog lines outside the image.

## Image-prompt template

**Use `/canon/MASTER-PROMPT.md`.** It is the pre-assembled base block — style, room map, and character anchors already composed — with three slots (`[SCENE]`, `[TV]`, `[BOARD]`) and the pre-flight checklist. Paste it verbatim; do not re-derive a prompt from the individual bibles, which is how drift happens. The individual documents remain the source of truth the master prompt is built from — when the founder changes a bible, update the master prompt to match. Supply the exact final caption to the deterministic dialogue pass after the image model returns the text-free illustration.

## Delivery — through the studio connector

The primary path is the studio's own MCP connector (the founder's ChatGPT Project has it installed):

1. Call `get_canon` and follow it exactly — every request, no exceptions.
2. Talk the idea through with the founder; confirm the angle in one sentence before drawing.
3. Write **3–5 distinct candidates** (different scenes or speakers): scene sentence, exact caption (≤20 words), title, characters in the scene, `style_notes` naming the one deliberate variation, and tv/board words (bar) or a setting phrase (away game).
4. Call **`make_cartoons`** with the candidates. The studio generates the art server-side — hosted FLUX conditioned on each character's locked master sheet — enforces B&W and size, typesets the caption, and commits each cartoon; options auto-number within the day. Text in, filed cartoons out.
5. Point the founder at his Today page for scoring: 1–10 art, 1–10 caption per cartoon (a cartoon lands at 6+ on both). Record chat reactions with `record_feedback`; `mark_keeper` only on his word.

**Direct-drawing path** (for AI clients that can see their own images — Claude, repo-side agents): draw text-free candidates yourself using `get_model_sheet` references, **inspect each image** against `/canon/creation/SCENE-QC.md`, redraw failures, then file survivors with `file_cartoon`. Never file a visible fault.

Fallback (no connector): commit files directly as `/options/YYYY-MM-DD/option-N.png` + `option-N.json` `{"title","caption","topic","tags"}` — PNGs must then already be in the finished dialogue format (see `/docs/PUBLISHING.md`). Never create or modify `keepers.json` or `selected.json` by hand.