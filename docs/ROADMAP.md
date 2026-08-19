# Roadmap — where the training week leads

<!-- BRAND: replace when final -->

The training week's data isn't just feedback — it's fuel. This page records the planned next steps so any future session (human or AI) knows where the system is headed.

## 1. The LoRA fine-tune ("perfect characters every time")

Prompt + reference sheets get FLUX most of the way; a **LoRA fine-tune** is what locks the style permanently. The plan:

- **Trigger:** once ~20–30 keepers exist (starred cartoons with art scores of 8+).
- **Training set:** the keepers + the locked model sheets. The 1–10 art scores are the selection filter — only art the founder scored high teaches the model.
- **How:** Replicate hosts FLUX LoRA training (~$2–10 a run, under an hour). The output is a custom model version string.
- **Switch-over:** set `IMAGE_MODEL` in Vercel to the trained model. `make_cartoons` picks it up automatically — no code change.
- **Iterate:** retrain as the keeper pile grows; the landed-rate trend (`get_feedback`) shows whether each retrain moved the needle.

## 2. Server-side vision QC (optional second filter)

Today the server enforces what it can measure (strict B&W, size, format), and the founder's scores catch the rest. A middle filter is possible: after generation, send the image to a vision model with `canon/creation/SCENE-QC.md` as the rubric and auto-redraw failures before filing. Costs one more API key and pennies per image; worth adding if physically-broken panels keep reaching the founder's table.

## 3. Publishing (parked)

The public newspaper design lives in git history, and the publish core (`lib/githubPublish.ts` → `publishOption`) still works. When the founder decides the strip is ready for the world, the graduation test (4-of-5 land/miss predictions) is the green light.
