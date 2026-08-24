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
| The locked model sheets, cropped into single-figure studies | ~84 | Who they are, from every angle and expression |
| Surviving finished cartoons, dialogue strip removed | 6 | The house look, and how two characters share a panel |
| Generated setting variants (Kontext, from committed reference boards) | 29 | That the background is a caption's business — weighted hard toward Mango, who lost most of his rendered images to the tail purge |

Whole sheets are never used — a model trained on grids draws grids. Neither are: the proportion-grid sheet, the scene-continuity sheet (a different drawing hand — a rounder-skulled, cross-hatched Drew), the crossed-out NEVER row on Mango's pin sheet, five off-model-Abby cartoons, one cartoon with a photorealistic face on the TV — and **every cartoon showing Mango's plumed tail** (canon: "absolutely no tail"; five of the nine surviving cartoons fell to this one check). Every exclusion carries its reason in the manifest's `skip` fields, and residual sheet lettering that a crop box could not dodge is painted out by per-crop `erase` rectangles.

---

## Building the set

```bash
# 1. Crop the figures out of the sheets and check the result yourself.
npm run training:build -- --draft

# 2. Build the conditioning boards the variants are generated from, commit.
npm run training:refs

# 3. Preview exactly what will be generated and what it will cost.
npm run training:variants
```

The variants themselves are generated **in production**, where the Replicate token lives, by the login-gated route `/api/backroom/variants`:

1. Open `/api/backroom/variants?dry=1` signed in — $0; it probes the Replicate account (proving the Vercel integration works) and lists every pending image with its exact prompt and caption.
2. Open `/api/backroom/variants` — generates up to 6 (`?limit=`), committing each PNG + caption straight into `scripts/training/setting-variants/`. Repeat in waves.
3. After each wave: `git pull` and **look at every image**. One where a character drifted off-model — or Mango grew the tail canon forbids — is worse than no image: `git rm` both files, push (that frees its slot), and regenerate it with `?only=<id>`.
4. The route refuses past **30 committed images, ever** — that ceiling is the variants budget line (~$1.70).

```bash
# 4. Build for real: histogram gates enforce the balance; writes the zip.
npm run training:build
git add scripts/training/training-set.zip && git commit -m "training: zip vN" && git push
```

The zip is committed on purpose: the training route reads it from the repo, and the exact bytes behind a paid run belong in history.

---

## Training — one route, one run

`/api/backroom/train` is the only thing that spends training money, and its default answer is no:

| Call | What happens |
| --- | --- |
| `?start=1` | Uploads the committed zip, creates the private destination model (`<account>/swinging-door`) if missing, and starts ONE training with the locked parameters below. **Refuses** if any recorded run is still going, or has ever succeeded. |
| `?status=1` | The newest run's live state; prints the trained `owner/swinging-door:<hash>` version string when it succeeds. |
| `?start=1&force=1` | The only way to pay for a second run — a deliberate, spelled-out choice. |

Locked parameters (`trigger_word` empty — the captions carry the four tokens; `autocaption` off — the captions are the work; `caption_dropout_rate` **0** — default dropout would leak everything the captions guard, the barroom included, into the unconditional space): steps 1750, rank 32, lr 4e-4, resolution "512,768,1024" (load-bearing — the crops keep their natural aspect and the trainer buckets them). Roughly $3 and 20–40 minutes on an H100.

A `failed` in the first minutes costs pennies — read the error, fix, `?start=1` again (the guard only blocks *succeeded* and *running*).

---

## The smoke test, then promotion

`/api/backroom/smoke` (~$0.15) generates four fixed panels through the **exact** production prompt path — trio at the bar, Mango alone on a boat, Abby on a bare panel, Drew in a courtroom — and commits them to `scripts/training/smoke/` for pull-and-inspect. `?scale=` tries a different `LORA_SCALE` per wave without touching Vercel.

Pass bar: three *distinct* on-model characters at the bar, the boat is a boat, the bare panel bare, the courtroom a courtroom, **and Mango has no tail anywhere**. Identity without obedience is a failure — turn the scale down and rerun before blaming the dataset.

Only after both halves pass: set **`IMAGE_MODEL`** in Vercel to the version string and redeploy. Rolling back is the same move with the old value, or delete it to fall back to Kontext.

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
