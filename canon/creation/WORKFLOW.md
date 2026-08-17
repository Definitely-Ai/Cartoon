# Creation Workflow

<!-- BRAND: replace when final — "The Swinging Door" is the working series/bar name throughout this document -->

Purpose: the repeatable path from "new topic" to "published cartoon," per the founder's series bible — written so any assistant (human or AI) produces series-consistent Swinging Door cartoons.

## The seven steps (per new topic)

1. **Verify current factual context when needed.** Captions are topically current with events of the day; check the facts before joking about them.
2. **Place the joke in a single clear visual scene.** Usually inside The Swinging Door (see `/canon/settings/SETTINGS-BIBLE.md`); the TV is how the news enters the room.
3. **Use the characters' personalities to decide who speaks** (see `/canon/personality/PERSONALITIES.md`). Drew names the absurdity; Mango believes his way into it; Abby closes an argument, rarely.
4. **Write 3–5 caption options.** Short, dry, underplayed; the caption deepens the visual gag rather than explaining it (see `/canon/comedy/COMEDY-BIBLE.md`).
5. **Choose the strongest caption.** Read the boundaries list before committing.
6. **Create the illustrated panel, then typeset the exact dialogue into it.** Generate the character scene without model-rendered words, then append the print-ready caption deterministically with `npm run dialogue`. This preserves character continuity and prevents misspellings.
7. **Maintain a catalog by date.** In this repo, publishing IS cataloging: each cartoon lives in `/cartoons/YYYY-MM-DD-slug/` with its `meta.json` (date, edition, tags). The JSON caption must exactly match the dialogue printed in the artwork; the site supplies titles, dates, and catalog lines outside the image.

## Image-prompt template

**Use `/canon/MASTER-PROMPT.md`.** It is the pre-assembled base block — style, room map, and character anchors already composed — with three slots (`[SCENE]`, `[TV]`, `[BOARD]`) and the pre-flight checklist. Paste it verbatim; do not re-derive a prompt from the individual bibles, which is how drift happens. The individual documents remain the source of truth the master prompt is built from — when the founder changes a bible, update the master prompt to match. Supply the exact final caption to the deterministic dialogue pass after the image model returns the text-free illustration.

## Delivery — through the studio connector

The primary path is the studio's own MCP connector (the founder's ChatGPT Project has it installed):

1. Call `get_canon` and follow it exactly — every request, no exceptions.
2. Draw **3–5 distinct, text-free candidates** (different scenes or speakers, never crops of one image). No words in the artwork: the house typesets the dialogue.
3. File each one with `file_cartoon` (the raw image plus `title`, `caption`, `topic`, `tags`). The server typesets the caption beneath the art in the house style and commits it; options auto-number within the day.
4. Show the founder the candidates in the conversation. When he says which he likes, call `mark_keeper` for those — never before he chooses.

Fallback (no connector): commit files directly as `/options/YYYY-MM-DD/option-N.png` + `option-N.json` `{"title","caption","topic","tags"}` — PNGs must then already be in the finished dialogue format (see `/docs/PUBLISHING.md`). Never create or modify `keepers.json` or `selected.json` by hand.