"""THE RE-INKED PORTRAIT. The official portraits (canon/vision/studies/*.png) were drawn by
another generator; the plates are drawn by the house edit model. So the house model redraws
each portrait in ITS OWN engraved pen - same character, same pose, same crop, same wardrobe -
and the approved re-ink becomes the reference everywhere afterwards (the founder's
"regenerate the cast for this model", 2026-09-09).

    python scripts/reink-portrait.py --character drew --seed 7 --seed 21 [--steps 20 --cfg 2.5] [--tag NAME]

Picture 1 = the portrait itself (the picture being edited); no other references. The request
goes to the AuraVision bridge (127.0.0.1:8000) for local/qwen-image-edit-2511 with explicit
steps and guidance (no Lightning LoRA: fast=False). Outputs: canon/characters/<folder>/reink/
<tag>-s<seed>.png + .json + .prompt.txt, and each render logged to the daily report.
"""
from __future__ import annotations
import argparse, datetime as dt, importlib.util, json, subprocess, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("cs", ROOT / "scripts/cast-study.py")
cs = importlib.util.module_from_spec(spec); spec.loader.exec_module(cs)

PORTRAIT = {"drew": "canon/vision/studies/drew.png", "barclay": "canon/vision/studies/barclay.png",
            "abby": "canon/vision/studies/abby.png"}
FOLDER = {"drew": "flamingo", "barclay": "dog", "abby": "abby"}
WHO = {
    "drew": ("DREW, the white flamingo gentleman: a small refined head, the slender pale bill bending down with its "
             "black outer third and a plain slit nostril, one heavy-lidded amiable eye with a clear iris and a catchlight, "
             "a long S-curve neck, white plumage drawn in fine strokes, a crisp white collar band and a small black bow "
             "tie, a knitted V-neck sweater vest, feathered hands with four fingers and a thumb"),
    "barclay": ("BARCLAY, the golden retriever gentleman: a soft golden coat, a broad kind muzzle, drop ears, warm "
                "human-looking eyes, a dark blazer over an open-collared shirt with a small flag pin"),
    "abby": ("ABBY, the white West Highland terrier lady who owns the bar: pricked ears, a dark button nose, "
             "human-looking eyes with white showing both sides of the iris and a lashed upper lid, a closed-lip "
             "half-smile, a pale blouse and a studded collar with a pendant"),
}
NEGATIVE = ("text, letters, words, lettering, typography, caption, signature, watermark, colour, photographic, "
            "blurry, second character, extra limbs, deformed hands, bare skin")


def prompt_for(character: str) -> str:
    return (
        f"REFERENCES. Picture 1 is the official portrait of {WHO[character]}. It is the picture being edited.\n\n"
        "MAKE THIS ONE CHANGE TO PICTURE 1 AND KEEP EVERYTHING ELSE. The result is Picture 1 itself, redrawn.\n"
        "1. REDRAW THIS SAME PICTURE, feature for feature - the same character, the same pose, the same crop, the same "
        "wardrobe, the same props, the same expression, the same plain paper background - in YOUR OWN engraved "
        "black-and-white pen: an antique steel-engraving hand of fine hatching and stippling, continuous grey tone from "
        "deep blacks to bright paper, the plumage and fur laid in individual fine strokes, no hard outlines, no flat fills.\n"
        "2. The paper around the figure stays plain and empty: no room, no furniture, no border, no lettering, no caption, "
        "no signature, nothing added and nothing removed."
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--character", required=True, choices=sorted(PORTRAIT))
    ap.add_argument("--seed", type=int, action="append", required=True)
    ap.add_argument("--steps", type=int, default=20)
    ap.add_argument("--cfg", type=float, default=2.5)
    ap.add_argument("--tag", default="")
    ap.add_argument("--server", default=cs.SERVER)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    out = ROOT / "canon/characters" / FOLDER[a.character] / "reink"; out.mkdir(parents=True, exist_ok=True)
    tag = a.tag or f"{a.character}-reink-{a.steps}-{str(a.cfg).replace('.', '')}"
    p1, meta = cs.prepare_reference(ROOT / PORTRAIT[a.character])
    prompt = prompt_for(a.character)
    (out / f"{tag}.prompt.txt").write_text(prompt, encoding="utf8")
    for seed in a.seed:
        req = cs.build_request(prompt, [p1], seed, False, f"{tag}-s{seed}", negative_extra=NEGATIVE)
        req["steps"] = a.steps; req["guidance"] = a.cfg
        side = {"character": a.character, "seed": seed, "steps": a.steps, "cfg": a.cfg, "fast": False,
                "picture1": PORTRAIT[a.character], "picture1_meta": meta, "model": cs.MODEL}
        if a.dry_run:
            print(json.dumps({k: v for k, v in req.items() if k != "input_images"}, indent=2)[:800]); continue
        t0 = dt.datetime.now()
        res = cs.post(req, a.server)
        png = cs.fetch(res["image_url"], a.server)
        dst = out / f"{tag}-s{seed}.png"; dst.write_bytes(png)
        side["seconds"] = (dt.datetime.now() - t0).total_seconds(); side["generated_at"] = dt.datetime.now().isoformat(timespec="seconds")
        (out / f"{tag}-s{seed}.json").write_text(json.dumps(side, indent=2), encoding="utf8")
        print(f"  {dst.relative_to(ROOT)}  seed={seed}  {side['seconds']:.0f}s", flush=True)
        subprocess.run([sys.executable, str(ROOT / "scripts/report-log.py"), str(dst),
                        "--title", f"{a.character.title()} re-inked by the house model in its own pen, seed {seed}",
                        "--ask", "Founder: 'do it' - the cast regenerated for this model, one character at a time, Drew first.",
                        "--thought", "The official portrait is Picture 1 and the only reference; the house model redraws it "
                                     "feature for feature in its own engraved hand at the slow sampler band, so the reference "
                                     "used in every scene pass is in the same pen as the plate.",
                        "--prompt-file", str(out / f"{tag}.prompt.txt"),
                        "--settings", f"local/qwen-image-edit-2511, steps {a.steps}, cfg {a.cfg}, no Lightning LoRA, 4:5, seed {seed}",
                        "--verdict", "candidate - to the founder beside the original"], check=False, capture_output=True)


if __name__ == "__main__":
    main()
