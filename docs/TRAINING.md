# Training the character model

The studio can draw the cast two ways, and one environment variable decides which.

**Today (no training):** FLUX.1 Kontext is handed a reference board built from the locked model sheets and told, in a page of prose, exactly what everyone looks like. It works, but a reference image is a suggestion. Kontext's own paper documents identity drifting across novel poses, and prose has to compete with itself — the longer the description of Drew, the less room left for what Rick actually asked for.

**After training:** a fine-tuned model that *knows* the three of them. Drew, Mango and Abby each get a trigger word, the house look gets a fourth, and the prompt stops describing anyone. What it spends its words on instead is the scene.

That second thing is the point. Rick types a sentence; the cast should be exactly themselves and the panel should be exactly what he asked for.

---

## The line the fine-tune must not cross

A fine-tune learns everything its captions do not mention. That is what makes it work — nobody has to describe Drew's neck again — and it is also the trap: train on a corpus that is all barroom, say nothing about the barroom, and the bar becomes part of who these characters *are*. Ask for a boat and the bottles come along.

So the training set is built to keep one line: **the model owns who they are and how they are drawn; Rick's sentence owns everything else** — the setting, the props, the framing, how busy or how bare the panel is.

Four things hold that line, and all four ship:

1. **Captions name the background out loud.** Every caption in `scripts/training/crop-manifest.json` says where its subject is — the barroom described like any other place — so "barroom" binds to those words instead of hiding inside a character's token. What captions never mention is anatomy, faces, permanent wardrobe, or the black-and-white look; those are the token's job.
2. **The corpus is balanced, and the build refuses when it is not.** `npm run training:build` prints a histogram and fails if figures-on-blank-paper pass 70% of the set, or if any single real place passes 50% of the images that have one.
3. **The prompt drops the room when the scene leaves it.** In fine-tuned mode `lib/generate.ts` includes the barroom paragraph only for bar scenes. `npm run check:prompt` enforces it.
4. **`LORA_SCALE` is a live dial.** No retraining needed — see [When something is wrong](#when-something-is-wrong).

---

## What gets trained on

| Source | Images | What it teaches |
| --- | --- | --- |
| 17 locked model sheets, cropped into single-pose studies | ~104 | Who they are, from every angle and expression |
| 13 finished cartoons, dialogue strip removed | 13 | The house look, and how two characters share a panel |
| 4 scene-continuity panels (bar, golf course, dock, airport) | 4 | That Drew is still Drew somewhere else |
| Generated setting variants | 24 | That the background is a caption's business |

Whole sheets are never used — a model trained on grids draws grids. Neither are the silhouettes, the proportion grids with numerals across them, the swatch rows, the flag diagrams, the disembodied eye studies, or the crossed-out NEVER row on Mango's pin sheet. Five older cartoons are left out because Abby is drawn off-model in them, and one because a photorealistic human face is on the television. Every one of those decisions is recorded, with its reason, in the manifest's `skip` fields.

---

## Building the set

```bash
# 1. Crop the figures out of the sheets. Fails on purpose until step 2 has run —
#    without the setting variants the corpus is 81% blank paper and 88% barroom.
npm run training:build -- --draft

# 2. Generate the non-barroom images. Needs REPLICATE_API_TOKEN; about $1.
npm run training:variants
```

Then **look at all 24 variants.** They are generated, not drawn, and an image where a character has drifted off-model is worse than no image at all — it teaches the drift. Delete any bad one along with its `.txt`, and run more with `--only <id>` if you want replacements.

```bash
# 3. Build for real. Prints the histogram, enforces the balance, writes the zip.
npm run training:build
```

The archive lands at `scripts/training/training-set.zip` (~30 MB): each image beside a same-named `.txt` caption, which is the layout every FLUX LoRA trainer expects.

> `npm run training:detect` re-proposes crop boxes if the sheets ever change. It writes numbered previews to `scripts/training/.detect/` — look at them, then correct the boxes by hand in the manifest. The proposals are a starting point, never the answer.

---

## Training

On [replicate.com](https://replicate.com), with billing enabled on the same account as `REPLICATE_API_TOKEN`:

1. **Create a model** to train into: name it `swinging-door`, visibility **private**, hardware CPU (the trainer picks its own GPU). This is a container for versions — every retrain pushes a new version here, and old ones stay reachable.
2. Open **`ostris/flux-dev-lora-trainer`** and run a training with:

   | Field | Value | Why |
   | --- | --- | --- |
   | `input_images` | `training-set.zip` | |
   | `trigger_word` | *leave empty* | The captions already carry `SWDDREW`, `SWDMANGO`, `SWDABBY`, `SWDINK`. A single trigger word would flatten four concepts into one. |
   | `autocaption` | **off** | The captions are the work. An autocaptioner describes cartoons poorly and would undo the whole doctrine above. |
   | `steps` | 1750 | |
   | `lora_rank` | 32 | Enough capacity for three characters plus a style. |
   | `learning_rate` | 0.0004 | The trainer's default; leave it. |
   | `resolution` | 512,768,1024 | Matches the mixed sizes the build emits. |
   | `destination` | the model from step 1 | |

   Roughly 20–40 minutes and $2–3. Not `replicate/fast-flux-trainer` — that one captions for you, which is exactly what must not happen here.
3. When it finishes, copy the full version string: `<your-account>/swinging-door:<hash>`.

---

## Promoting it

Set **`IMAGE_MODEL`** in Vercel to that version string and redeploy. That single change flips `lib/generate.ts` onto the fine-tuned path: no reference board is built, no model sheets are fetched from GitHub, and the prompt becomes trigger words plus the scene.

Rolling back is the same move with the previous version string, or delete `IMAGE_MODEL` to fall back to Kontext. Nothing else in the studio changes — the connector, the batches, the scoring all work the same.

### The control batch

Before trusting it, have ChatGPT file one batch of eight, and let Rick score it as normal. Four for identity, four for obedience:

| # | Ask for | Passes when |
| --- | --- | --- |
| 1–3 | Drew alone, Mango alone, Abby alone, at the bar | Each is unmistakably themselves; Mango and Abby are not blurring together |
| 4 | All three at the bar | Three distinct characters, nobody merged |
| 5 | The two of them on a boat | It is a boat. Not a bar with a porthole |
| 6 | In a courtroom | It is a courtroom |
| 7 | A bare panel, nothing behind them | It is bare |
| 8 | A crowded street | It is crowded |

**Identity without obedience is a failure.** If 1–4 beat the Kontext batches but 5–8 keep drifting back to the bar, do not accept it — turn `LORA_SCALE` down first.

---

## When something is wrong

`LORA_SCALE` is an environment variable, so both of these are a redeploy, not a retrain:

| Symptom | Do this |
| --- | --- |
| Faces or bodies slipping off-model | Raise `LORA_SCALE` toward 1.1 |
| Settings, props or framing ignoring the prompt; the bar creeping back in | Lower it to 0.7–0.85 |
| Both at once | The dataset is the problem, not the dial — add setting variants and retrain |

Default is 0.9.

---

## Retraining

The feedback loop feeds the model. Every cartoon Rick scores **8 or better on art**, and everything he stars, is a candidate for the next dataset — his taste, made into training data.

Roughly weekly, or whenever there are ~25% more curated images than the last run:

1. Add the new keepers to the `cartoons` list in `crop-manifest.json`, each with a caption that names its setting — same rule as everything else.
2. `npm run training:build`. If the histogram now fails, the keepers have tipped the corpus; generate more setting variants rather than raising the cap.
3. Train again into the **same destination model**. Same cost, new version.
4. Run the control batch and compare against the version in production. **Rick's dials are the evaluation** — if the landed rate does not move, keep the old version.

The 50% cap on any one place is what stops the flywheel quietly re-baking the bar: he will mostly star bar cartoons, because most cartoons are bar cartoons, and without the cap each retrain would drift a little further toward a model that can only draw a bar.

---

## If Replicate ever stops being the answer

The dataset is portable — a folder of images and `.txt` captions is the universal format. [fal.ai](https://fal.ai) runs the same ostris trainer, and the same zip trains locally on a 24 GB GPU with `ai-toolkit`. Only two things are Replicate-shaped: the `IMAGE_MODEL` string and the REST calls in `lib/generate.ts`.
