# The Canon — read this first

<!-- BRAND: replace when final — "The Swinging Door" is the working series/bar name throughout this document -->

This folder is the drawing bible for The Swinging Door: everything an AI needs to generate cartoons the founder recognizes as *his strip*. If you are an AI connecting for the first time — through the studio's chat connector or by reading the repo directly — this page is your map.

**The one non-negotiable:** `MASTER-PROMPT.md` is the page pasted **verbatim** into every image request. It is compiled *from* the documents below; they are the source of truth it summarizes. Generate from the master prompt; consult the bibles to understand it; never re-derive a prompt from the bibles freehand — that is how drift starts.

## Read in this order

1. **`MASTER-PROMPT.md`** — the page you paste: base block, slots, stage physics, never-draw list, pre-flight checklist.
2. **`creation/WORKFLOW.md`** — topic → filed batch: the seven steps and the connector ritual.
3. **`creation/SCENE-QC.md`** — the image inspection you run on every candidate before filing. Non-optional.
4. **`characters/<everyone in your scene>`** — each character's folder: `DESCRIPTION.md` first, then the sheets.
5. **`comedy/COMEDY-BIBLE.md`** — what is funny here, and the boundaries that gate every gag.
6. **`settings/SETTINGS-BIBLE.md`** — the room map, the stage rules, and the away games.
7. **`style/STYLE-BIBLE.md`** — ink, values, and panel format.
8. **`personality/PERSONALITIES.md`** — who speaks, and how each voice sounds.

## Who wins a conflict

The authority ladder, top rung wins — follow the higher, flag the lower, **never average**:

1. The character's **locked master sheet** (`full-body-sheet.png`).
2. The character's written canon (`DESCRIPTION.md`, `CHARACTER-BIBLE.md`).
3. **`MASTER-PROMPT.md`** (the compiled page).
4. The topic bibles (comedy, settings, style, personalities).
5. Support/specialist sheets.
6. Older cartoons — story history only; never visual authority.

## The cast

| Character | Wire name (`get_model_sheet`) | Folder | Status |
| --- | --- | --- | --- |
| Drew — the flamingo | `drew` | `characters/flamingo/` | Locked: five-file bible + 7 hash-fingerprinted sheets |
| Mango — the golden retriever | `mango` | `characters/dog/` | Locked 2026-08-17: five-file bible + 3 hash-fingerprinted sheets |
| Abby — the westie who owns the bar | `abby` | `characters/abby/` | Locked 2026-08-17: five-file bible + 7 hash-fingerprinted sheets |

Every character folder follows the five-file standard: `DESCRIPTION.md` (compact authority), `CHARACTER-BIBLE.md` (deep spec), `PROMPT-BLOCKS.md` (paste-ready blocks), `QUALITY-CONTROL.md` (inspection gates), `ASSET-MANIFEST.json` (hash-locked sheets). `npm run canon:check` verifies all three.

## The ritual (over the studio connector)

1. `get_canon` — always fresh, never from memory.
2. Talk the idea through with the founder in plain words; confirm the angle before drawing.
3. Write **3–5 distinct candidates** — scene sentence (canon vocabulary), exact caption (≤20 words), title, who's in the scene, and `style_notes` naming each one's single deliberate variation.
4. Call **`make_cartoons`** — the studio generates the art itself (hosted FLUX conditioned on the locked sheets), runs the house filters, typesets the caption, and files everything. Text in, cartoons out.
5. Point the founder at his Today page: two scores per cartoon, 1–10 for the art and 1–10 for the caption. A cartoon **lands** at 6+ on both; the goal is 60% landing.
6. When he reacts in chat, `record_feedback` his scores and words near-verbatim; `mark_keeper` only on his explicit word. Never rate on his behalf.
7. To study his taste or draft bible revisions: `get_feedback` — it carries the landed-rate trend.

AI clients that can see images (Claude, repo-side agents) may instead draw directly and file with `file_cartoon`, inspecting each image against `creation/SCENE-QC.md` first — the make_cartoons path exists because ChatGPT cannot pass images to tools.

Over the wire, `get_doc` serves the topic bibles, `scene-qc`, and each character's `CHARACTER-BIBLE` and `QUALITY-CONTROL` (`drew-bible`, `drew-qc`, …). A character's `DESCRIPTION.md` and `PROMPT-BLOCKS.md` are repo-side conveniences — over the connector, the CHARACTER-BIBLE supersets them and the identity paste text is already inside the master prompt.

No connector? The fallback file contract is in `creation/WORKFLOW.md` — commit finished-format PNGs to `/options/YYYY-MM-DD/`; never touch `keepers.json` or `selected.json`.

## Leaving the bar

The master prompt's ROOM and STAGE paragraphs are the replaceable **setting passage**; every character paragraph and the style/text rules are identity and never change. `MASTER-PROMPT.md` → "Away games" carries the pre-written outdoor substitute; `settings/SETTINGS-BIBLE.md` lists the approved destinations.

## Changing the canon

Edit the source bible → mirror the change into `MASTER-PROMPT.md` (they must agree — the master is a compilation, not a fork) → run `npm run canon:check` → commit. The wire serves the new canon on the next `get_canon` call; nothing goes stale.

During the training week, canon changes come from the founder's recorded feedback: `get_feedback` shows the corpus, revisions are proposed to him in plain words, and only what he approves lands here.
