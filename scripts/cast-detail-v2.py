"""THE CAST, RE-INKED IN PLACE - the recess trick, applied to Drew, Barclay and Abby.

A whole-plate pass gives each character's head roughly 150 px, and the house
edit model draws it soft at that size; the SAME model draws each character
PERFECTLY when it redraws the portrait at full resolution (reink-portrait.py:
Picture 1 = the portrait itself, 20 steps cfg 2.5). So instead of re-rolling
the whole plate to fix one head, this crops a generous 4:5 box around that
character's own place in an already-composed plate, upscales it to 1344x1680
(the bridge's own 4:5 render size) as Picture 1, sends the character's
approved portrait as Picture 2, and asks the model to REDRAW the figure in
place, feature for feature, in the room's own pen - full resolution, one
character at a time. The render is scaled back down to the box, tone-matched
to the ring just outside it, and pasted through the feathered union of that
character's own figure mask minus whatever furniture sits in front of it
(the founder, 2026-09-09: "they must look perfect, it must be an amazing
looking cartoon, the characters are the centerpiece").

This is scripts/scene-edit.py's own --bottles-crop trick (crop -> 4:5 render
-> tone-match to the ring -> paste inside masks -> post-process -> sign last)
applied to the cast instead of the bottles: scene-edit.py is imported here as
a module (importlib, exactly as it imports room-part.py) for its own pipeline
helpers (figures_union_mask, report) - never duplicated. reink-portrait.py is
imported the same way for its WHO feature-list table and PORTRAIT paths, so
this file never re-types the approved character descriptions by hand.

    python scripts/cast-detail-v2.py --plate <composed plate png> --character drew|barclay|abby
        --seed N [--seed M ...] [--box X0,Y0,X1,Y1]
        [--steps 20 --cfg 2.5 | --fast] [--tag NAME] [--out-dir DIR] [--dry-run]
        [--head-from-portrait [--head-full-tone]]

Picture 1: a crop of --plate at the character's DEFAULT_BOX (plate pixels,
4:5, generous around their place - --box overrides), upscaled to 1344x1680.
Picture 2: the character's approved reference (canon/vision/studies/<name>.png)
via cast-study.py's own prepare_reference(). No Picture 3.

--head-from-portrait (default off): today's finding is that with a headless
grey block-in in the crop, the house model draws the body perfectly (vest,
feathered arms, hands for Drew) but never forms the head; with a code
block-in head it drew a vulture instead. The model re-inks what it SEES
faithfully - the re-inked portraits proved that - so this pastes the
character's own portrait HEAD (and, for Drew, the S-neck down to the collar)
onto the plate at the block-in's own head anchor BEFORE the crop for
Picture 1 is taken, tone-remapped into a firm 90-200 grey under-drawing
(--head-full-tone keeps the portrait's own full tone instead). See
paste_head_on_plate() below for the anchor, scale and mirror logic.

The paste alpha is THIS character's own figure mask (masks/figure-<name>-*.png
- the same part id scene-edit.py's own FIGURE_PART table already names)
dilated 24 px and feathered 4 px, MINUS the mask of whatever sits in front of
them (chair-left for Drew, chair-right for Barclay, counter for Abby - the
same pairing cast-place.py's own STICKER_OCCLUDER_MASK table uses) so the
furniture already in the plate is never redrawn. The render is releveled to
the ring just outside that region with room-part.py's own tone_match() - the
same primitive --bottles-crop composites the bottles back with - before the
paste; scripts/sign-on-glass.py runs LAST, because gilding is pixels and
anything painted after it wipes it.

Outputs (per seed), canon/room-kit/v2/work/ unless --out-dir redirects them:
<tag>-<character>-s<seed>-final.png, a 2x crop of the box beside it as
-detail.png, and a JSON sidecar; every final is logged to the daily report via
scripts/report-log.py. --dry-run writes Picture 1, Picture 2 and the prompt
under --out-dir (or work/ by default) and renders nothing - no bridge call.

Never the paid APIs: the AuraVision bridge at 127.0.0.1:8000 -> ComfyUI,
model local/qwen-image-edit-2511. room-part.py is IMPORTED here for
manifest()/mask_of()/load()/save()/tone_match() only - never run as a command,
and canon/room-kit/v2/parts.json / plate.png are only ever READ, never written.
"""
from __future__ import annotations

import argparse
import datetime as dt
import importlib.util
import json
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent


def _load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / filename)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


cs = _load("cs", "scripts/cast-study.py")
rp = _load("rp", "scripts/room-part.py")          # manifest()/mask_of()/load()/save()/tone_match() only - never run
se = _load("se", "scripts/scene-edit.py")          # figures_union_mask()/report()/WORK/FIGURE_PART - never run
rk = _load("rk", "scripts/reink-portrait.py")      # WHO/PORTRAIT - the approved feature lists, never retyped here

# --------------------------------------------------------------------- boxes
# Plate pixels (the plate is always 1200x1800), X0,Y0,X1,Y1, each exactly
# 4:5, generous around the character's own place - the founder's own numbers.
DEFAULT_BOX = {
    "drew": (0, 640, 640, 1440),
    "barclay": (560, 640, 1200, 1440),
    "abby": (440, 560, 900, 1135),
}
BRIDGE_SIZE = (1344, 1680)   # scene-edit.py's own BRIDGE_SIZE["4:5"] - the crop is upscaled to this as Picture 1

# The occluder in front of each character - re-pasted from the plate, never
# redrawn - cast-place.py's own STICKER_OCCLUDER_MASK pairing.
OCCLUDER_PART = {"drew": "chair-left", "barclay": "chair-right", "abby": "counter"}
ALPHA_DILATE = 24
ALPHA_FEATHER = 4.0
OCCLUDER_FEATHER = 3.0   # matches scene-edit.py's own FURNITURE_OVER_FIGURES restore feather

POSTURE = {"drew": "sits", "barclay": "sits", "abby": "stands"}
PRONOUN = {"drew": "him", "barclay": "him", "abby": "her"}

NEGATIVE = "text, letters, words, lettering, signature, colour, photographic, blurry, extra limbs, second character"

# ------------------------------------------------------------ --head-from-portrait
# How much of the portrait, top-down, is "the head": Drew's long S-neck
# counts as head all the way down to his collar, so it takes more of the
# portrait; Barclay and Abby's heads sit close on their shoulders.
HEAD_FRAC = {"drew": 0.45, "barclay": 0.40, "abby": 0.40}
HEAD_MASK_TOP_FRAC = 0.25    # the topmost slice of the FULL-HEAD mask's own bounding box that IS the head region
HEAD_SCALE_BOOST = 1.10      # the pasted head is scaled slightly larger than the anchor region, never smaller
HEAD_TONE_LO, HEAD_TONE_HI = 90, 200   # default remap: a firm grey under-drawing, never mistakable for finished ink
PAPER_THRESHOLD = 200        # a portrait pixel this bright AND connected to the sheet's own border is the white paper
HEAD_ALPHA_CLOSE = 22        # closes the alpha across fine fur linework (Abby's terrier coat in particular leaves
                              # thin slivers of white paper between individual hair strokes - border-flood-fill alone
                              # keys those as background, so the un-closed alpha only covered ~31% of her head's own
                              # bounding box and pasted as a faint, ghostly wash; closing bridges gaps that size
                              # without bridging the real gap between her two ears, checked by eye at this radius)

# Which way each portrait head already faces, checked by eye against both
# the portrait itself and its block-in's own FULL-HEAD mask
# (masks/figure-<part>.png), so mirroring is only ever applied where the two
# actually disagree:
#   drew    - seated at the LEFT chair, turns to HIS right = frame right, to
#             face Barclay across the bar. The portrait's own neck curls up
#             from lower-left and the bill points toward frame right; the
#             mask's head blob (see head_anchor()) sits at the RIGHT of the
#             torso silhouette with the bill tip furthest right still. Same
#             direction - no flip.
#   barclay - seated at the RIGHT chair, turns to HIS left = frame left, to
#             face Drew. The portrait's muzzle already points frame left;
#             the mask's head blob sits at the LEFT of the torso silhouette
#             with the muzzle reaching further left still. Same direction -
#             no flip.
#   abby    - stands behind the ledge FACING THE ROOM (the camera), not
#             turned to either side. The portrait is a near head-on close-up
#             and the mask's head blob is roughly centred over the torso
#             (both ears present, no lean either way). Already frontal -
#             no flip.
HEAD_FLIP = {"drew": False, "barclay": False, "abby": False}


def portrait_alpha(gray: np.ndarray) -> np.ndarray:
    """The portrait's figure as a solid boolean mask: every pixel that is
    NOT part of the white paper - found by flood-filling from the four
    edges of the sheet, so one stray dark pixel touching the border (Abby's
    ear tip reaches row 0) never breaks the fill - then CLOSED (dilate then
    erode) HEAD_ALPHA_CLOSE px to bridge the paper slivers fine fur linework
    leaves between hair strokes, then hole-filled so an enclosed sliver of
    paper (the gap inside Drew's S-neck) reads as figure too, not a
    transparent hole in the cutout."""
    bg_candidate = gray >= PAPER_THRESHOLD
    labelled, _ = ndimage.label(bg_candidate)
    border_labels = set(labelled[0, :]) | set(labelled[-1, :]) | set(labelled[:, 0]) | set(labelled[:, -1])
    border_labels.discard(0)
    paper = np.isin(labelled, list(border_labels))
    fig = ndimage.binary_closing(~paper, iterations=HEAD_ALPHA_CLOSE)
    return ndimage.binary_fill_holes(fig)


def portrait_head_cutout(character: str) -> tuple[np.ndarray, np.ndarray]:
    """(gray, alpha): the top HEAD_FRAC[character] of the portrait's own
    figure - head, and for Drew the S-neck down to the collar - tight-
    cropped to its own ink, alpha keyed from the white paper."""
    gray_full = np.asarray(Image.open(ROOT / rk.PORTRAIT[character]).convert("L"), dtype=np.float32)
    fig = portrait_alpha(gray_full)
    ys, xs = np.where(fig)
    fy0, fy1 = int(ys.min()), int(ys.max())
    band_y1 = fy0 + int(round((fy1 - fy0 + 1) * HEAD_FRAC[character]))
    band = np.zeros_like(fig)
    band[fy0:band_y1, :] = fig[fy0:band_y1, :]
    bys, bxs = np.where(band)
    x0, x1, y0, y1 = int(bxs.min()), int(bxs.max()), int(bys.min()), int(bys.max())
    return gray_full[y0:y1 + 1, x0:x1 + 1], band[y0:y1 + 1, x0:x1 + 1].astype(np.float32)


def head_anchor(character: str) -> tuple[float, float, float]:
    """(cx, cy, height): the centroid and height of the block-in's own head
    region - the topmost HEAD_MASK_TOP_FRAC of the FULL-HEAD figure mask's
    bounding box (masks/figure-<part>.png, drawn WITH the head - unlike the
    headless block-in the plate itself carries)."""
    part = se.FIGURE_PART[character]
    m = rp.load(rp.KIT / "masks" / f"{part}.png") > 127
    ys, xs = np.where(m)
    y0, y1 = int(ys.min()), int(ys.max())
    head_y1 = y0 + int(round((y1 - y0 + 1) * HEAD_MASK_TOP_FRAC))
    hys, hxs = np.where(m[y0:head_y1, :])
    cy = float(hys.mean() + y0)
    cx = float(hxs.mean())
    return cx, cy, float(head_y1 - y0)


def paste_head_on_plate(plate: np.ndarray, character: str, full_tone: bool) -> tuple[np.ndarray, np.ndarray, dict]:
    """Paste the character's own portrait head (scaled, mirrored if
    HEAD_FLIP says so, toned) onto `plate` at the block-in's own head
    anchor - so the model SEES a head in Picture 1 instead of having to
    invent one over a flat grey block. Returns (new plate, the pasted
    head's own alpha at full plate resolution - to dilate into the
    paste-back alpha later, debug info for the sidecar)."""
    src_gray, src_alpha = portrait_head_cutout(character)
    if HEAD_FLIP[character]:
        src_gray = np.fliplr(src_gray)
        src_alpha = np.fliplr(src_alpha)

    cx, cy, target_h = head_anchor(character)
    scale = (target_h * HEAD_SCALE_BOOST) / src_gray.shape[0]
    new_w = max(1, int(round(src_gray.shape[1] * scale)))
    new_h = max(1, int(round(src_gray.shape[0] * scale)))

    gray = np.asarray(Image.fromarray(np.clip(src_gray, 0, 255).astype(np.uint8))
                       .resize((new_w, new_h), Image.LANCZOS), dtype=np.float32)
    alpha = np.asarray(Image.fromarray((np.clip(src_alpha, 0, 1) * 255).astype(np.uint8))
                        .resize((new_w, new_h), Image.LANCZOS), dtype=np.float32) / 255.0

    if not full_tone:
        gray = HEAD_TONE_LO + (gray / 255.0) * (HEAD_TONE_HI - HEAD_TONE_LO)

    # Horizontal: the cutout's OWN alpha-weighted centroid lands under the
    # mask's head-region centroid cx - robust to an off-centre mass like
    # Drew's S-neck, rather than assuming the cutout's bbox centre is "the
    # head".
    #
    # Vertical: NOT the same centroid trick - the cutout's mass is almost
    # all head (ears, fur), with only a thin sliver of neck/collar at its
    # own bottom edge, so centring on mass pulls that thin sliver well
    # short of the block-in's own shoulder line and leaves a gap of shelf
    # showing through beneath the chin (seen first on Barclay). Anchor the
    # cutout's own LOWEST ink instead to the head region's own lower edge -
    # cy + target_h/2, since head_anchor()'s cy is the mean of a band
    # running from (cy - target_h/2) to (cy + target_h/2) - so the collar
    # meets the block-in's shoulder seam directly, the way a neck actually
    # sits on a body.
    xx, yy = np.meshgrid(np.arange(new_w, dtype=np.float32), np.arange(new_h, dtype=np.float32))
    mass = float(alpha.sum())
    src_cx = float((xx * alpha).sum() / mass)
    ox = int(round(cx - src_cx))

    alpha_rows = np.where(alpha.max(axis=1) > 0.5)[0]
    src_bottom = float(alpha_rows.max()) if len(alpha_rows) else new_h - 1.0
    anchor_bottom = cy + target_h / 2.0
    oy = int(round(anchor_bottom - src_bottom))

    ph, pw = plate.shape[:2]
    px0, py0 = max(0, ox), max(0, oy)
    px1, py1 = min(pw, ox + new_w), min(ph, oy + new_h)
    sx0, sy0 = px0 - ox, py0 - oy
    sx1, sy1 = sx0 + (px1 - px0), sy0 + (py1 - py0)

    new_plate = plate.copy()
    head_alpha_full = np.zeros((ph, pw), dtype=np.float32)
    if px1 > px0 and py1 > py0:
        a = alpha[sy0:sy1, sx0:sx1]
        g = gray[sy0:sy1, sx0:sx1]
        region = new_plate[py0:py1, px0:px1]
        new_plate[py0:py1, px0:px1] = region * (1 - a) + g * a
        head_alpha_full[py0:py1, px0:px1] = a

    debug = {
        "source_cutout_size": [int(src_gray.shape[1]), int(src_gray.shape[0])], "flip": HEAD_FLIP[character],
        "scale": round(scale, 4), "pasted_size": [new_w, new_h], "anchor_centroid": [round(cx, 1), round(cy, 1)],
        "anchor_height": round(target_h, 1), "anchor_bottom": round(anchor_bottom, 1),
        "paste_offset": [ox, oy], "tone": "full" if full_tone else f"{HEAD_TONE_LO}-{HEAD_TONE_HI}",
    }
    return new_plate, head_alpha_full, debug


# ------------------------------------------------------------------- prompt
def prompt_for(character: str) -> str:
    name, title = character.upper(), character.title()
    posture, pronoun, features = POSTURE[character], PRONOUN[character], rk.WHO[character]
    roster = (f"REFERENCES. Picture 1 is a piece of the approved room of The Swinging Door with {title} already "
              f"in it, roughly drawn; Picture 2 is {title}'s official portrait.")
    edit1 = (f"REDRAW {name} IN PLACE, exactly where the figure already {posture} and at the same size and turn, "
             f"as the character in Picture 2 feature for feature ({features}), in the same engraved black-and-white "
             f"pen as the room around {pronoun}, with continuous grey tone and fine hatching, so that this piece "
             "reads as one drawing.")
    edit2 = ("KEEP EVERYTHING ELSE exactly as Picture 1: the marble, the chair, the ledge, the shelf, the "
             "panelling, the light. No lettering, no caption, no signature.")
    standard = (f"This character is the centrepiece of the cartoon: draw {pronoun} beautifully, warm and huggable, "
                "with human-looking eyes.")
    return roster + "\n\n1. " + edit1 + "\n2. " + edit2 + "\n\n" + standard


# --------------------------------------------------------------------- box
def parse_box(text: str) -> tuple[int, int, int, int]:
    parts = [int(x) for x in text.split(",") if x.strip() != ""]
    if len(parts) != 4:
        raise SystemExit(f"--box wants X0,Y0,X1,Y1 - got {text!r}")
    x0, y0, x1, y1 = parts
    if not (0 <= x0 < x1 <= 1200 and 0 <= y0 < y1 <= 1800):
        raise SystemExit(f"--box {text!r} out of the plate's 1200x1800 bounds")
    return x0, y0, x1, y1


# ------------------------------------------------------------------- Picture 1
def build_picture1(plate: np.ndarray, box: tuple[int, int, int, int], out_dir: Path, tag: str, character: str) -> Path:
    """The crop, upscaled (LANCZOS) to BRIDGE_SIZE - the bridge's own 4:5
    render resolution - so the character gets the same pixels of head the
    portrait itself renders at, not the ~150 px a whole-plate pass gives it."""
    x0, y0, x1, y1 = box
    crop = plate[y0:y1, x0:x1]
    im = Image.fromarray(np.clip(crop, 0, 255).astype(np.uint8)).resize(BRIDGE_SIZE, Image.LANCZOS)
    p1_path = out_dir / f"{tag}-{character}-picture1.png"
    im.save(p1_path)
    return p1_path


def save_dry_picture2(character: str, out_dir: Path, tag: str) -> Path:
    p2_path = out_dir / f"{tag}-{character}-picture2.png"
    Image.open(ROOT / rk.PORTRAIT[character]).convert("L").save(p2_path)
    return p2_path


# --------------------------------------------------------------- the paste alpha
def part_by_id(man: dict, pid: str) -> dict:
    return next(p for p in man["parts"] if p["id"] == pid)


def character_alpha(man: dict, character: str, head_alpha_full: np.ndarray | None = None
                     ) -> tuple[np.ndarray, np.ndarray]:
    """(hard, soft): the union of this character's own figure mask, dilated
    ALPHA_DILATE px and feathered ALPHA_FEATHER px (scene-edit.py's own
    figures_union_mask - a single-part union here), MINUS the occluder in
    front of them (their own hard-dilated mask minus the occluder's hard
    mask, for tone_match's ring; the soft feathered version for the actual
    paste) - the furniture already in the plate is never repainted.

    When --head-from-portrait pasted a head, `head_alpha_full` is that
    paste's own alpha at plate resolution: it is dilated ALPHA_DILATE px
    and feathered the same as the figure mask, then UNIONED in before the
    occluder is subtracted, so the paste-back alpha is guaranteed to cover
    the pasted head even where it reaches past the headless block-in's own
    mask (Drew's S-neck in particular)."""
    fig_part = part_by_id(man, se.FIGURE_PART[character])
    occ_part = part_by_id(man, OCCLUDER_PART[character])

    fig_hard = ndimage.binary_dilation(rp.mask_of(fig_part) > 0.5, iterations=ALPHA_DILATE)
    fig_soft = se.figures_union_mask(man, (se.FIGURE_PART[character],), dilate=ALPHA_DILATE, feather=ALPHA_FEATHER)
    if head_alpha_full is not None:
        head_hard = ndimage.binary_dilation(head_alpha_full > 0.5, iterations=ALPHA_DILATE)
        fig_hard = fig_hard | head_hard
        head_soft = np.clip(ndimage.gaussian_filter(head_hard.astype(np.float32), sigma=ALPHA_FEATHER), 0.0, 1.0)
        fig_soft = np.maximum(fig_soft, head_soft)

    occ_hard = rp.mask_of(occ_part) > 0.5
    hard = fig_hard & ~occ_hard

    occ_soft = rp.mask_of(occ_part, feather=OCCLUDER_FEATHER)
    soft = np.clip(fig_soft - occ_soft, 0.0, 1.0)
    return hard, soft


# ------------------------------------------------------------------ the detail crop
def save_detail_crop(final_path: Path, box: tuple[int, int, int, int], tag: str, character: str, seed: int,
                      out_dir: Path) -> Path:
    x0, y0, x1, y1 = box
    piece = Image.open(final_path).convert("L").crop((x0, y0, x1, y1))
    piece = piece.resize((piece.width * 2, piece.height * 2), Image.LANCZOS)
    detail_path = out_dir / f"{tag}-{character}-s{seed}-detail.png"
    piece.save(detail_path)
    return detail_path


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--plate", required=True, help="a composed plate png (1200x1800, or resized to it) with the "
                     "cast already roughly in place")
    ap.add_argument("--character", required=True, choices=sorted(DEFAULT_BOX))
    ap.add_argument("--seed", type=int, action="append", required=True)
    ap.add_argument("--box", default="", help="X0,Y0,X1,Y1 in plate pixels, overriding DEFAULT_BOX[--character]")
    ap.add_argument("--steps", type=int, default=20)
    ap.add_argument("--cfg", type=float, default=2.5)
    ap.add_argument("--fast", action="store_true", help="the Lightning pass instead of --steps/--cfg overrides")
    ap.add_argument("--tag", default="cast-detail")
    ap.add_argument("--server", default=cs.SERVER)
    ap.add_argument("--out-dir", default="", help="where Picture 1/2, the prompt and every output go (default: "
                     "canon/room-kit/v2/work/)")
    ap.add_argument("--dry-run", action="store_true", help="write Picture 1, Picture 2 and the prompt; render nothing")
    ap.add_argument("--head-from-portrait", action="store_true", help="paste the character's own portrait head onto "
                     "the plate at the block-in's head anchor before the crop is taken (default off)")
    ap.add_argument("--head-full-tone", action="store_true", help="keep the pasted head at the portrait's own full "
                     "tone instead of the default 90-200 grey under-drawing remap (only matters with "
                     "--head-from-portrait)")
    a = ap.parse_args()

    out_dir = Path(a.out_dir) if a.out_dir else se.WORK
    out_dir.mkdir(parents=True, exist_ok=True)

    man = rp.manifest()
    plate_src = Path(a.plate)
    if not plate_src.is_absolute():
        plate_src = ROOT / plate_src
    plate = rp.load(plate_src)

    head_alpha_full, head_debug = None, None
    if a.head_from_portrait:
        plate, head_alpha_full, head_debug = paste_head_on_plate(plate, a.character, a.head_full_tone)

    box = parse_box(a.box) if a.box else DEFAULT_BOX[a.character]
    p1_path = build_picture1(plate, box, out_dir, a.tag, a.character)
    prompt = prompt_for(a.character)
    prompt_path = out_dir / f"{a.tag}-{a.character}.prompt.txt"
    prompt_path.write_text(prompt, encoding="utf8")

    print(f"character: {a.character}   box (x0,y0,x1,y1): {box}   -> {BRIDGE_SIZE[0]}x{BRIDGE_SIZE[1]}")
    if head_debug:
        print(f"head-from-portrait: {head_debug['source_cutout_size'][0]}x{head_debug['source_cutout_size'][1]} "
              f"portrait head -> {head_debug['pasted_size'][0]}x{head_debug['pasted_size'][1]} (scale "
              f"{head_debug['scale']}, flip {head_debug['flip']}, tone {head_debug['tone']}) centred on anchor "
              f"{head_debug['anchor_centroid']} (anchor height {head_debug['anchor_height']})")
    print(f"Picture 1: {p1_path.relative_to(ROOT) if p1_path.is_relative_to(ROOT) else p1_path}")
    print(f"Picture 2: {rk.PORTRAIT[a.character]}")

    if a.dry_run:
        p2_path = save_dry_picture2(a.character, out_dir, a.tag)
        sidecar = {
            "generated_at": dt.datetime.now().isoformat(timespec="seconds"), "script": "scripts/cast-detail-v2.py",
            "dry_run": True, "character": a.character, "plate_source": str(plate_src), "box": list(box),
            "bridge_size": list(BRIDGE_SIZE), "steps": a.steps, "cfg": a.cfg, "fast": a.fast, "tag": a.tag,
            "seeds": a.seed, "picture1": str(p1_path), "picture2": str(p2_path), "prompt_file": str(prompt_path),
            "occluder": OCCLUDER_PART[a.character], "alpha_dilate": ALPHA_DILATE, "alpha_feather": ALPHA_FEATHER,
            "head_from_portrait": a.head_from_portrait, "head_full_tone": a.head_full_tone, "head": head_debug,
        }
        (out_dir / f"{a.tag}-{a.character}-dryrun.json").write_text(json.dumps(sidecar, indent=2), encoding="utf8")
        print(f"Picture 2 (copy): {p2_path.relative_to(ROOT) if p2_path.is_relative_to(ROOT) else p2_path}")
        print(f"prompt: {prompt_path.relative_to(ROOT) if prompt_path.is_relative_to(ROOT) else prompt_path}")
        print("[dry run] no render made")
        return

    p1_uri, _ = cs.prepare_reference(p1_path)
    p2_uri, _ = cs.prepare_reference(ROOT / rk.PORTRAIT[a.character])
    images = [p1_uri, p2_uri]

    hard_alpha, soft_alpha = character_alpha(man, a.character, head_alpha_full)
    x0, y0, x1, y1 = box
    bw, bh = x1 - x0, y1 - y0

    for seed in a.seed:
        req = cs.build_request(prompt, images, seed, a.fast, f"{a.tag}-{a.character}-s{seed}", negative_extra=NEGATIVE)
        if not a.fast:
            req["steps"] = a.steps
            req["guidance"] = a.cfg
        t0 = time.time()
        res = cs.post(req, a.server)
        png = cs.fetch(res["image_url"], a.server)
        raw_path = out_dir / f"{a.tag}-{a.character}-s{seed}-raw.png"
        raw_path.write_bytes(png)

        im = Image.open(raw_path).convert("L")
        piece = np.asarray(im.resize((bw, bh), Image.LANCZOS), np.float32)
        candidate_full = plate.copy()
        candidate_full[y0:y1, x0:x1] = piece
        leveled, gain, off = rp.tone_match(plate, candidate_full, hard_alpha)
        pasted = plate * (1 - soft_alpha) + leveled * soft_alpha

        presign_path = out_dir / f"{a.tag}-{a.character}-s{seed}-presign.png"
        rp.save(pasted, presign_path)
        final_path = out_dir / f"{a.tag}-{a.character}-s{seed}-final.png"
        subprocess.run([sys.executable, str(ROOT / "scripts/sign-on-glass.py"), str(presign_path), str(final_path)],
                        check=True)
        detail_path = save_detail_crop(final_path, box, a.tag, a.character, seed, out_dir)
        seconds = round(time.time() - t0, 1)

        sidecar = {
            "generated_at": dt.datetime.now().isoformat(timespec="seconds"), "script": "scripts/cast-detail-v2.py",
            "character": a.character, "seed": seed, "seed_used": res.get("seed_used"), "plate_source": str(plate_src),
            "box": list(box), "bridge_size": list(BRIDGE_SIZE), "occluder": OCCLUDER_PART[a.character],
            "alpha_dilate": ALPHA_DILATE, "alpha_feather": ALPHA_FEATHER, "steps": a.steps, "cfg": a.cfg,
            "fast": a.fast, "model": cs.MODEL, "tone_gain": gain, "tone_offset": off, "tag": a.tag,
            "seconds": seconds, "server_metadata": res.get("metadata"), "picture1": str(p1_path),
            "picture2": rk.PORTRAIT[a.character], "final": str(final_path), "detail": str(detail_path),
            "head_from_portrait": a.head_from_portrait, "head_full_tone": a.head_full_tone, "head": head_debug,
        }
        (out_dir / f"{a.tag}-{a.character}-s{seed}.json").write_text(json.dumps(sidecar, indent=2), encoding="utf8")

        se.report(
            final_path, f"{a.tag} {a.character.title()} detail pass, seed {seed} - redrawn in place at full resolution",
            ask="Founder: 'they must look perfect, it must be an amazing looking cartoon, the characters are the "
                "centerpiece' - redraw each character at the same full resolution the portrait itself gets, in a "
                "crop of their own place in the composed plate, and paste back without risking the room.",
            thought=(f"Picture 1 is a {box} crop of {a.plate} upscaled to {BRIDGE_SIZE[0]}x{BRIDGE_SIZE[1]}; Picture "
                     f"2 is {a.character}'s approved portrait. After the render, the crop was scaled back to the box "
                     f"and tone-matched to the ring just outside it (room-part.py's own tone_match, gain {gain:.2f} "
                     f"offset {off:+.0f}), then pasted through {a.character}'s own figure mask dilated "
                     f"{ALPHA_DILATE} px and feathered {ALPHA_FEATHER} px, minus the {OCCLUDER_PART[a.character]} "
                     "mask in front of them, before the gilded sign went on last."),
            prompt_file=prompt_path,
            settings=f"{cs.MODEL}, seed {seed}, {'fast Lightning' if a.fast else f'steps {a.steps} cfg {a.cfg}'}, "
                     f"box {box} -> {BRIDGE_SIZE[0]}x{BRIDGE_SIZE[1]}, {seconds}s",
            verdict="candidate - to the founder beside the plate",
        )
        print(f"  {final_path.relative_to(ROOT)}  seed={seed}  {seconds}s  + {detail_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
