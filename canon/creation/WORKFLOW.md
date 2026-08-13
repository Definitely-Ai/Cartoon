# Creation Workflow

Purpose: the repeatable path from "new topic" to "published cartoon," per the founder's series bible — written so any assistant (human or AI) produces series-consistent Swinging Door cartoons.

## The seven steps (per new topic)

1. **Verify current factual context when needed.** Captions are topically current with events of the day; check the facts before joking about them.
2. **Place the joke in a single clear visual scene.** Usually inside The Swinging Door (see `/canon/settings/SETTINGS-BIBLE.md`); the TV is how the news enters the room.
3. **Use the characters' personalities to decide who speaks** (see `/canon/personality/PERSONALITIES.md`). Drew names the absurdity; Mango believes his way into it; Abby closes an argument, rarely.
4. **Write 3–5 caption options.** Short, dry, underplayed; the caption deepens the visual gag rather than explaining it (see `/canon/comedy/COMEDY-BIBLE.md`).
5. **Choose the strongest caption.** Read the boundaries list before committing.
6. **Create an image prompt that preserves character continuity and includes the caption.** Assemble it from the template below — canonical description blocks verbatim, never paraphrased.
7. **Maintain a catalog by date.** In this repo, publishing IS cataloging: each cartoon lives in `/cartoons/YYYY-MM-DD-slug/` with its `meta.json` (date, edition, tags), and the site renders the catalog/dating line below the artwork — displayed below the cartoon but not part of the cartoon.

## Image-prompt template

> Compose in this order; paste the canonical blocks exactly as written.

1. Style: single-frame black-and-white ink wash editorial cartoon, dry American magazine cartoon feel (see `/canon/style/STYLE-BIBLE.md`).
2. Setting block from `/canon/settings/SETTINGS-BIBLE.md` — inside the bar: wooden paneling, stools, coasters, framed Americana (walls not crowded), chalkboard with a special, small TV showing news or sports, bar name reversed in the window.
3. Character block(s), verbatim from `/canon/characters/*/DESCRIPTION.md`, for whoever appears.
4. The scene: one sentence placing the joke.
5. The caption, exactly as it will print.

## Delivery

Each concept cartoon package for the founder includes: caption options, the current-event idea behind the gag, the assembled image prompt, and the chosen caption — then the published folder under `/cartoons/` per `/docs/PUBLISHING.md`.
