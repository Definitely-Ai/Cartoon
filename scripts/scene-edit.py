"""ONE WHOLE-SCENE PASS by the house edit model: the approved room as Picture 1,
the official portraits as the references, and a short list of edits - the cast
added into the chairs and behind the ledge, the bottles redrawn as a real bar's
shelf. This is how the plates Rick accepted were made (lib/generate.ts): one
picture, one engraved hand, nothing pasted.

    python scripts/scene-edit.py --seed 7 [--seed 41 ...] [--full] [--no-bottles] [--tag NAME]

Picture 1 is the 4:5 crop of canon/room-kit/v2/plate.png (y 300..1800), so the
render comes back at the house size (1344x1680) and is scaled to 1200x1500 and
laid back into the plate for the whole-plate view. Never the paid APIs: the
AuraVision bridge at 127.0.0.1:8000 -> ComfyUI, model local/qwen-image-edit-2511.
"""
from __future__ import annotations
import argparse, datetime as dt, importlib.util, json, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
KIT = ROOT / "canon/room-kit/v2"
WORK = KIT / "work"
spec = importlib.util.spec_from_file_location("cs", ROOT / "scripts/cast-study.py")
cs = importlib.util.module_from_spec(spec); spec.loader.exec_module(cs)

CROP = (0, 300, 1200, 1800)          # 4:5 of the plate: the bar, the chairs, the back bar, the window
SCENE = ("Drew and Barclay seated at the marble bar of The Swinging Door in the two leather club chairs, seen from "
         "behind and turned toward each other in conversation, Abby the owner behind her working ledge in front of "
         "the inlaid back bar facing them, the street through the window")


def references() -> tuple[list[str], str]:
    p1, _ = cs.prepare_reference(KIT / "plate.png", box=(CROP[0], CROP[1], CROP[2] - CROP[0], CROP[3] - CROP[1]))
    p2, _ = cs.prepare_reference(ROOT / "canon/vision/studies/drew.png")
    a = Image.open(ROOT / "canon/vision/studies/barclay.png").convert("L")
    b = Image.open(ROOT / "canon/vision/studies/abby.png").convert("L")
    h = 1024
    a = a.resize((round(a.width * h / a.height), h), Image.LANCZOS)
    b = b.resize((round(b.width * h / b.height), h), Image.LANCZOS)
    tile = Image.new("L", (a.width + b.width + 24, h), 255)
    tile.paste(a, (0, 0)); tile.paste(b, (a.width + 24, 0))
    tp = WORK / "scene-edit-picture3.png"; WORK.mkdir(exist_ok=True); tile.save(tp)
    p3, _ = cs.prepare_reference(tp)
    roster = ("REFERENCES. Picture 1 is THE APPROVED ROOM of The Swinging Door, the picture being edited: its camera, "
              "its crop, its light, its marble bar with the two empty leather club chairs seen from behind, its inlaid "
              "back bar above the working ledge, its window, and its engraved black-and-white pen are already correct. "
              "Picture 2 is DREW, the studio's official portrait - copy THIS bird identically: the small refined head, "
              "the slender pale bill bending down with its black outer third, the heavy-lidded amiable eye, the long "
              "S-curve neck, white plumage in fine strokes, the white collar and small black bow tie, the knitted "
              "V-neck sweater vest, feathered hands with four fingers and a thumb. Picture 3 holds TWO portraits side "
              "by side: on the LEFT is BARCLAY, the golden retriever gentleman - soft golden coat, drop ears, kind "
              "human-looking eyes, a dark blazer over an open-collared shirt with a small flag pin; on the RIGHT is "
              "ABBY, the white West Highland terrier lady who owns the bar - pricked ears, dark button nose, "
              "human-looking eyes with white showing both sides of the iris and a lashed upper lid, a closed-lip "
              "half-smile, a pale blouse and a studded collar with a pendant. Copy each of them identically.")
    return [p1, p2, p3], roster


def prompt_text(bottles: bool) -> str:
    _, roster = references()
    edits = [
        "ADD DREW (Picture 2) SEATED IN the empty LEFT leather club chair, filling it as a man fills a chair, seen from "
        "behind and a little to his left, his head turned back and across to his right toward Barclay in three-quarter "
        "so his bill and one heavy-lidded eye read against the room, the chair back standing in front of his lower "
        "body, his knit vest and white collar showing above it, his near feathered hand on the marble beside a martini.",
        "ADD BARCLAY (Picture 3, left) SEATED IN the empty RIGHT leather club chair, seen from behind and a little to "
        "his right, his head turned to his left toward Drew so his muzzle, one eye and a drop ear read, the chair back "
        "in front of his lower body, his blazer and collar above it, an old fashioned on the marble before him.",
        "ADD ABBY (Picture 3, right) STANDING BEHIND the marble working ledge in front of the inlaid back bar, facing the "
        "room between the two chairs, both hands resting on her ledge, drawn from the waist up with the ledge in front "
        "of her, her closed-lip half-smile on the two of them.",
    ]
    if bottles:
        edits.append("REDRAW THE BOTTLES on the two shelves of the inlaid recess as a REAL BAR'S BACK SHELF in the same "
                     "engraved pen: many bottles shoulder to shoulder, of different shapes, heights and widths, clear and "
                     "dark glass, corks and capsules, every one at least half full with a clean fill line, each wearing "
                     "one plain paper label with a small crest or emblem and NO lettering.")
    edits.append("KEEP EVERYTHING ELSE exactly as Picture 1: the marble bar and its edges, the two chairs, the panelled "
                 "walls, the recess and its shelves, the working ledge, the window and the street, the television dark "
                 "and blank, the chalkboard wiped. No lettering, no words, no caption, no signature anywhere.")
    body = "MAKE THESE CHANGES TO PICTURE 1 AND KEEP EVERYTHING ELSE. The result is Picture 1 itself with the cast added, " \
           "one unbroken scene edge to edge, in the same engraved black-and-white pen.\n" + \
           "\n".join(f"{i + 1}. {e}" for i, e in enumerate(edits))
    master = (ROOT / "canon/MASTER-PROMPT.md").read_text(encoding="utf8")
    fence = cs.local_fence(master).replace("[SCENE]", SCENE) \
        .replace("[TV]", "nothing - the screen is dark and blank").replace("[BOARD]", "nothing - the slate is wiped")
    return roster + "\n\n" + body + "\n\nTHE RULES THE FINISHED PICTURE OBEYS:\n" + fence


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", type=int, action="append", required=True)
    ap.add_argument("--full", action="store_true", help="40-step cfg 4 instead of the Lightning 8-step pass")
    ap.add_argument("--no-bottles", action="store_true")
    ap.add_argument("--tag", default="scene")
    ap.add_argument("--server", default=cs.SERVER)
    a = ap.parse_args()
    images, _ = references()
    prompt = prompt_text(not a.no_bottles)
    (WORK / f"{a.tag}-edit.prompt.txt").write_text(prompt, encoding="utf8")
    plate = Image.open(KIT / "plate.png").convert("L")
    for seed in a.seed:
        req = cs.build_request(prompt, images, seed, not a.full, f"{a.tag}-s{seed}",
                               negative_extra="lettering, text, words, letters, caption, signature, watermark, colour, photographic")
        t0 = dt.datetime.now()
        res = cs.post(req, a.server)
        png = cs.fetch(res["image_url"], a.server)
        raw = WORK / f"{a.tag}-s{seed}-raw.png"; raw.write_bytes(png)
        im = Image.open(raw).convert("L").resize((CROP[2] - CROP[0], CROP[3] - CROP[1]), Image.LANCZOS)
        whole = plate.copy(); whole.paste(im, (CROP[0], CROP[1]))
        out = WORK / f"{a.tag}-s{seed}.png"; whole.save(out)
        (WORK / f"{a.tag}-s{seed}.json").write_text(json.dumps({"seed": seed, "full": a.full, "crop": CROP, "model": cs.MODEL,
                                                                "seconds": (dt.datetime.now() - t0).total_seconds(),
                                                                "generated_at": dt.datetime.now().isoformat(timespec="seconds")}, indent=2))
        print(f"  {out.relative_to(ROOT)}  seed={seed}  {(dt.datetime.now() - t0).total_seconds():.0f}s", flush=True)


if __name__ == "__main__":
    main()
