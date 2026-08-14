# Creation Workflow

<!-- BRAND: replace when final — "The Swinging Door" is the working series/bar name throughout this document -->

Purpose: the repeatable path from "new topic" to "published cartoon," per the founder's series bible — written so any assistant (human or AI) produces series-consistent Swinging Door cartoons.

## The seven steps (per new topic)

1. **Verify current factual context when needed.** Captions are topically current with events of the day; check the facts before joking about them.
2. **Place the joke in a single clear visual scene.** Usually inside The Swinging Door (see `/canon/settings/SETTINGS-BIBLE.md`); the TV is how the news enters the room.
3. **Use the characters' personalities to decide who speaks** (see `/canon/personality/PERSONALITIES.md`). Drew names the absurdity; Mango believes his way into it; Abby closes an argument, rarely.
4. **Write 3–5 caption options.** Short, dry, underplayed; the caption deepens the visual gag rather than explaining it (see `/canon/comedy/COMEDY-BIBLE.md`).
5. **Choose the strongest caption.** Read the boundaries list before committing.
6. **Create the illustrated panel, then typeset the exact dialogue into it.** Generate the character scene without model-rendered words, then append the print-ready caption deterministically with `cd site && npm run dialogue`. This preserves character continuity and prevents misspellings.
7. **Maintain a catalog by date.** In this repo, publishing IS cataloging: each cartoon lives in `/cartoons/YYYY-MM-DD-slug/` with its `meta.json` (date, edition, tags). The JSON caption must exactly match the dialogue printed in the artwork; the site supplies titles, dates, and catalog lines outside the image.

## Image-prompt template

**Use `/canon/MASTER-PROMPT.md`.** It is the pre-assembled base block — style, room map, and character anchors already composed — with three slots (`[SCENE]`, `[TV]`, `[BOARD]`) and the pre-flight checklist. Paste it verbatim; do not re-derive a prompt from the individual bibles, which is how drift happens. The individual documents remain the source of truth the master prompt is built from — when the founder changes a bible, update the master prompt to match. Supply the exact final caption to the deterministic dialogue pass after the image model returns the text-free illustration.

## Delivery — the exact file contract

When the founder asks for a cartoon ("I want a cartoon about X"), produce **three finished candidates** and commit them to this repo as the day's proofs:

```
/options/YYYY-MM-DD/          ← today's date
  option-1.png                ← finished cartoon, B&W ink wash, ≥1200px long side
  option-1.json               ← {"title": "…", "caption": "…", "tags": ["…", "…"]}
  option-2.png
  option-2.json
  option-3.png
  option-3.json
```

Rules for the generator:

- Three distinct takes on the same request — different visual scenes or different speakers, not three crops of one image.
- Each PNG is a finished cartoon: square or 4:5 illustrated panel plus its exact dialogue typeset in the warm-white caption field below. No title, date, proof label, or watermark is baked in.
- Each JSON's `caption` is print-ready and must match the dialogue in the PNG exactly. If the wording changes, edit the JSON and rerun `npm run dialogue`; the script preserves the square art region and rebuilds only the dialogue field.
- `tags`: up to five lowercase subjects ("markets", "retirement", "media"…).
- **Never create or modify `selected.json`** — the site writes it when the founder publishes.
- Never write into `/cartoons/` directly; publishing is the founder's decision, made in the Back Room.

The moment the options are pushed, they appear on the founder's light table at the website's `/backroom`. He picks one, taps RUN IT, and the site publishes it to the front page automatically.
