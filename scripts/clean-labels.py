"""Strip every bottle label in the inlaid recess down to its crest alone -
no type-row, no rule, no barcode, no letter-like mark, on either a bright
(white-ground) or dark (black-ground) label - and quiet small text-like
marks left on the glass, all in code, no render.

WHY (founder, 2026-09-08 night, "perfecting the bottles"): the house edit
model's own recess redraws (scripts/scene-edit.py --bottles-crop, seeds
b3B-s7/11/21/41/44/55/62/3) are the best bottles built so far - dense, real
glass, real variety - but every seed still writes a fake type-row under each
label's crest, because the fast Lightning sampler (8 steps, cfg 1) ignores
negatives and a slower cfg-4 pass degraded the whole image. The founder's
rule is exact: "no names, no lettering at all; just emblems." So the type
rows come off in code, the same way scripts/label-bottles.py finds a label's
own painted paper - never by asking the model again.

THE IDEA, IN ONE LINE: within a label, KEEP ONLY THE CREST - the largest
ink mark sitting away from the label's own edge - and REFILL EVERYTHING ELSE
(rows, rules, barcodes, borders, stray letters) with that label's OWN paper
tone and texture, sampled from its own clean margin, never painted past the
paper's real edge.

    python scripts/clean-labels.py scan <in.png> [--out-json boxes.json]
        [--out-sheet sheet.png] [--masks-dir DIR]
        finds every label it can by brightness/darkness alone (bright paper
        by a fixed threshold, dark paper by local uniformity, same two tests
        scripts/label-bottles.py uses to snap a label's paper) and writes a
        JSON list of candidate boxes plus a boxed contact print for a human
        to check - AUTOMATION FINDS MOST WHITE LABELS AND THE PLAINER BLACK
        ONES; a busy black label (dense ink leaves no flat margin for the
        uniformity test to find) is easy to miss, so `scan` is a first pass,
        not the source of truth - add any label it missed straight into the
        boxes JSON by hand (x0,y0,x1,y1,ground) before `clean`.

    python scripts/clean-labels.py clean <in.png> <out.png> --boxes boxes.json
        [--glass-marks/--no-glass-marks] [--seed 0]
        cleans every box in boxes.json (crest kept, everything else on that
        label's own paper refilled) and, unless turned off, also erases small
        stray dark/light marks sitting directly on the glass outside every
        box (--glass-marks is conservative by design: small, high-contrast,
        genuinely isolated marks only - never a bottle's own outline).

    python scripts/clean-labels.py patch <in.png> <out.png> --box x0,y0,x1,y1
        --ground white|black [--keep-box x0,y0,x1,y1]
        one manual rectangle, cleaned the same way as a `clean` box - for a
        single straggler found after the fact (a missed label, a mark the
        automatic glass pass left behind) without re-running the whole plate.
        --keep-box, if given, is kept verbatim (the crest) inside --box;
        without it every ink mark in --box is treated as removable.

    python scripts/clean-labels.py proof <in.png> <out.png> --boxes boxes.json
        --before-dir DIR --before-tag TAG
        builds the 4x-zoom label-by-label proof sheet: every box, BEFORE next
        to AFTER, for someone else to confirm zero marks survive.

HOW A LABEL IS RECONSTRUCTED (clean_label(), the one routine every entry
point above calls)
-----------------------------------------------------------------------
 1. PAPER MASK. The box is grown a few px, and split by a threshold local to
    that box alone (Otsu, biased toward the paper's own histogram peak, not
    a fixed global grey level - a label's ground varies bottle to bottle)
    into paper vs not-paper. Ink marks - being the opposite tone from the
    paper - show up as HOLES in this mask; scipy.ndimage.binary_fill_holes
    closes them, recovering the label's true silhouette (oval, shield,
    rectangle, whatever the model drew) whether the label is busy or plain.
    Nothing outside this silhouette is ever touched - "keep the paper's
    edge" - so a round label never gets squared off.
 2. INK MASK = paper mask AND (opposite-tone from the paper's own robust
    tone estimate, sampled inside the mask so a dark bottle's paler paper and
    a pale bottle's whiter paper are each read on their own terms).
 3. THE CREST. Ink components are found only in the INTERIOR of the paper
    mask (eroded in from the edge by a margin, so a drawn border rule at the
    label's own edge is never mistaken for the crest); among those, the
    single largest by area, reasonably compact (not a thin full-width row or
    rule), is the crest and is kept, dilated 1px so its own outline survives
    whole.
 4. REFILL. Every remaining ink pixel (rows, rules, barcodes, borders,
    stray letters, everywhere ink touches the paper's own edge) is inpainted
    (skimage.restoration.inpaint_biharmonic) using ONLY the label's own clean
    paper as data - never the glass or shelf around it - then a little of
    the paper's own high-frequency texture (its measured grain, sampled from
    the same clean paper, not invented) is added back so the patch does not
    read as a flat, pasted rectangle.

Nothing here ever touches canon/room-kit/v2/parts.json or plate.png, and
scripts/room-part.py is never run by this file.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
KIT = ROOT / "canon/room-kit/v2"
DEFAULT_MASKS = KIT / "masks"
RECESS_PARTS = ["backbar", "shelf-lower", "shelf-upper", "bottles-lower", "bottles-upper"]

RNG = np.random.default_rng(20260909)

# --------------------------------------------------------------- recess mask
def recess_mask(masks_dir: Path, size: tuple[int, int], dilate: int = 15) -> np.ndarray:
    """Union of the recess's five part masks, grown a little so a label
    drawn slightly outside the OLD construction's own footprint (this bottle
    layout is a free redraw, not the code block-in) is still inside the
    search area."""
    union = np.zeros((size[1], size[0]), bool)
    for name in RECESS_PARTS:
        p = masks_dir / f"{name}.png"
        if not p.exists():
            continue
        m = np.asarray(Image.open(p).convert("L").resize(size, Image.NEAREST)) > 127
        union |= m
    if dilate:
        union = ndimage.binary_dilation(union, iterations=dilate)
    return union


# --------------------------------------------------------------- detection
BRIGHT_BLUR_PX = 1.0
BRIGHT_THRESH = 175.0
DARK_THRESH = 78.0
DARK_STD_WIN = 5
DARK_STD_MAX = 9.5

MIN_WIDTH, MIN_HEIGHT = 16, 20
MAX_ASPECT = 3.2
MIN_AREA, MAX_AREA = 130, 5200
MIN_FILL_BRIGHT = 0.50
MIN_FILL_DARK = 0.50


def _filter_components(comp: np.ndarray, mask_for_fill: np.ndarray, min_fill: float) -> list[dict]:
    boxes = []
    objs = ndimage.find_objects(comp)
    for i, sl in enumerate(objs, start=1):
        if sl is None:
            continue
        ys, xs = sl
        sub = comp[sl] == i
        area = int(sub.sum())
        bw, bh = xs.stop - xs.start, ys.stop - ys.start
        if area < MIN_AREA or area > MAX_AREA:
            continue
        if bw < MIN_WIDTH or bh < MIN_HEIGHT:
            continue
        fill = area / (bw * bh)
        if fill < min_fill:
            continue
        ar = max(bw, bh) / max(1, min(bw, bh))
        if ar > MAX_ASPECT:
            continue
        boxes.append({"x0": int(xs.start), "y0": int(ys.start), "x1": int(xs.stop), "y1": int(ys.stop)})
    return boxes


def detect_bright_labels(gray: np.ndarray, search: np.ndarray) -> list[dict]:
    im = Image.fromarray(gray.astype(np.uint8))
    blurred = np.asarray(im.filter(ImageFilter.GaussianBlur(BRIGHT_BLUR_PX))).astype(np.float32)
    bright = (blurred > BRIGHT_THRESH) & search
    comp, _ = ndimage.label(bright)
    boxes = _filter_components(comp, bright, MIN_FILL_BRIGHT)
    for b in boxes:
        b["ground"] = "white"
    return boxes


def detect_dark_labels(gray: np.ndarray, search: np.ndarray) -> list[dict]:
    mean = ndimage.uniform_filter(gray, size=DARK_STD_WIN)
    sq_mean = ndimage.uniform_filter(gray * gray, size=DARK_STD_WIN)
    local_std = np.sqrt(np.clip(sq_mean - mean * mean, 0.0, None))
    dark = (gray < DARK_THRESH) & (local_std < DARK_STD_MAX) & search
    comp, _ = ndimage.label(dark)
    boxes = _filter_components(comp, dark, MIN_FILL_DARK)
    for b in boxes:
        b["ground"] = "black"
    return boxes


def dedupe_boxes(boxes: list[dict], iou_thresh: float = 0.35) -> list[dict]:
    """Bright and dark passes can both fire on the same label's different
    parts (a white frame around a black interior, say) - drop the smaller
    box of any pair that overlaps enough to plainly be the same label."""
    def area(b):
        return max(0, b["x1"] - b["x0"]) * max(0, b["y1"] - b["y0"])

    def iou(a, b):
        ix0, iy0 = max(a["x0"], b["x0"]), max(a["y0"], b["y0"])
        ix1, iy1 = min(a["x1"], b["x1"]), min(a["y1"], b["y1"])
        iw, ih = max(0, ix1 - ix0), max(0, iy1 - iy0)
        inter = iw * ih
        if inter == 0:
            return 0.0
        return inter / (area(a) + area(b) - inter)

    kept: list[dict] = []
    for b in sorted(boxes, key=area, reverse=True):
        if any(iou(b, k) > iou_thresh for k in kept):
            continue
        kept.append(b)
    return kept


def scan(gray: np.ndarray, masks_dir: Path) -> list[dict]:
    h, w = gray.shape
    search = recess_mask(masks_dir, (w, h))
    boxes = detect_bright_labels(gray, search) + detect_dark_labels(gray, search)
    return dedupe_boxes(boxes)


# --------------------------------------------------------------- per-label clean
PAD = 5              # grow the box this many px before working
REMOVE_GROW_PX = 2   # bulk the ink-to-remove out this many px past its raw (anti-aliased-thinned) threshold
INTERIOR_MARGIN_FRAC = 0.14   # shrink in from the paper's own edge before hunting for the crest
INTERIOR_MARGIN_MIN = 3
CREST_MAX_ASPECT = 3.4        # a candidate crest blob wider/taller than this is a row/rule, not a crest
TEXTURE_STRENGTH = 0.85       # how much of the paper's own measured grain to put back


def _otsu_threshold(values: np.ndarray) -> float:
    hist, edges = np.histogram(values, bins=256, range=(0, 255))
    hist = hist.astype(np.float64)
    total = hist.sum()
    if total == 0:
        return 128.0
    sum_all = float((hist * np.arange(256)).sum())
    w0, sum0 = 0.0, 0.0
    best_thresh, best_var = 128.0, -1.0
    for t in range(256):
        w0 += hist[t]
        if w0 == 0:
            continue
        w1 = total - w0
        if w1 == 0:
            break
        sum0 += hist[t] * t
        m0 = sum0 / w0
        m1 = (sum_all - sum0) / w1
        var_between = w0 * w1 * (m0 - m1) ** 2
        if var_between > best_var:
            best_var, best_thresh = var_between, t
    return float(best_thresh)


def _paper_mask(patch: np.ndarray, ground: str) -> np.ndarray:
    """Split the padded patch into paper vs not-paper by a threshold local to
    THIS label (Otsu over the patch's own histogram), then close the ink
    holes back up to recover the paper's true silhouette."""
    t = _otsu_threshold(patch)
    raw = (patch >= t) if ground == "white" else (patch < t)
    # the biggest component touching (or nearest) the patch centre is the paper
    comp, n = ndimage.label(raw)
    if n == 0:
        return np.zeros_like(raw, bool)
    cy, cx = patch.shape[0] / 2.0, patch.shape[1] / 2.0
    best_id, best_score = 0, -1.0
    objs = ndimage.find_objects(comp)
    for i, sl in enumerate(objs, start=1):
        if sl is None:
            continue
        ys, xs = sl
        area = int((comp[sl] == i).sum())
        my, mx = (ys.start + ys.stop) / 2.0, (xs.start + xs.stop) / 2.0
        dist = ((my - cy) ** 2 + (mx - cx) ** 2) ** 0.5
        score = area / (1.0 + dist)
        if score > best_score:
            best_score, best_id = score, i
    mask = comp == best_id
    mask = ndimage.binary_fill_holes(mask)
    mask = ndimage.binary_closing(mask, structure=np.ones((3, 3)), iterations=2)
    mask = ndimage.binary_fill_holes(mask)
    return mask


def _ink_mask(patch: np.ndarray, paper_mask: np.ndarray, ground: str) -> np.ndarray:
    vals = patch[paper_mask]
    if vals.size < 8:
        return np.zeros_like(paper_mask)
    if ground == "white":
        tone = float(np.percentile(vals, 80))
        thresh = tone - 34.0
        ink = paper_mask & (patch < thresh)
    else:
        tone = float(np.percentile(vals, 20))
        thresh = tone + 34.0
        ink = paper_mask & (patch > thresh)
    return ink


CREST_REGROW_PX = 3            # restore this much of the crest's own stroke width after frame-stripped labelling
CREST_MAX_AREA_FRAC = 0.60     # a candidate covering more of the interior than this is the whole fused ink, not a crest
FRAME_SPAN_FRAC = 0.80         # a component spanning this much of the paper's own width AND height...
FRAME_MAX_FILL = 0.40          # ...at no more than this fill ratio is a drawn border/rule, not a crest


CORNER_FRAC = 0.16    # how big a corner square to check, as a fraction of the component's own bbox
CORNER_MIN_HITS = 4   # a true rectangular frame has ink at ALL FOUR corners; an oval/diamond/leaf crest reaches at most a couple


def _strip_frame(ink: np.ndarray, paper_mask: np.ndarray) -> np.ndarray:
    """Drop any ink component that hugs the paper's own outer edge on all
    sides, is mostly hollow, AND has ink sitting in its own four corners -
    a drawn rectangular border or rule, the thing that otherwise fuses a
    label's crest to its rows/rules/second panel into one connected blob,
    since the frame is what touches all of them at once. The corner test is
    what keeps this from also eating an oval or diamond crest that happens
    to span most of the paper too: a rectangle's stroke turns THROUGH its
    corners, an oval or diamond curves away from them, so its bbox corners
    stay empty."""
    ys, xs = np.where(paper_mask)
    if ys.size == 0:
        return ink
    pw = xs.max() - xs.min() + 1
    ph = ys.max() - ys.min() + 1
    comp, n = ndimage.label(ink)
    if n == 0:
        return ink
    out = ink.copy()
    objs = ndimage.find_objects(comp)
    for i, sl in enumerate(objs, start=1):
        if sl is None:
            continue
        blob = comp[sl] == i
        bw = sl[1].stop - sl[1].start
        bh = sl[0].stop - sl[0].start
        if bw < FRAME_SPAN_FRAC * pw or bh < FRAME_SPAN_FRAC * ph:
            continue
        fill = int(blob.sum()) / (bw * bh)
        if fill > FRAME_MAX_FILL:
            continue
        ch_, cw_ = max(1, int(round(bh * CORNER_FRAC))), max(1, int(round(bw * CORNER_FRAC)))
        hits = 0
        for cy, cx in ((0, 0), (0, bw - cw_), (bh - ch_, 0), (bh - ch_, bw - cw_)):
            if blob[cy:cy + ch_, cx:cx + cw_].any():
                hits += 1
        if hits >= CORNER_MIN_HITS:
            out[sl][blob] = False
    return out


def _pick_crest(ink: np.ndarray, paper_mask: np.ndarray) -> np.ndarray:
    """The largest, reasonably compact ink component on the paper once any
    full-span hollow frame is stripped out first (see _strip_frame) - a
    frame is what otherwise ties a label's crest to its rows/rules/second
    panel into one connected blob, so removing it (it needs to go anyway) is
    what lets the crest stand on its own for picking. No area cap beyond
    that: a crest is allowed to legitimately fill most of its label (a big
    diamond, a bold monogram) once the frame itself is out of the running."""
    stripped = _strip_frame(ink, paper_mask)
    comp, n = ndimage.label(stripped)
    if n == 0:
        return np.zeros_like(ink)
    best_id, best_area = 0, 0
    objs = ndimage.find_objects(comp)
    for i, sl in enumerate(objs, start=1):
        if sl is None:
            continue
        blob = comp[sl] == i
        ys_b, xs_b = np.where(blob)
        cw = xs_b.max() - xs_b.min() + 1
        ch = ys_b.max() - ys_b.min() + 1
        ar = max(cw, ch) / max(1, min(cw, ch))
        if ar > CREST_MAX_ASPECT:
            continue
        area = int(blob.sum())
        if area > best_area:
            best_area, best_id = area, i
    if best_id == 0:
        return np.zeros_like(ink)
    seed = comp == best_id
    crest = ndimage.binary_dilation(seed, iterations=CREST_REGROW_PX) & stripped
    return crest & paper_mask


def _texture_fill(patch: np.ndarray, paper_mask: np.ndarray, remove_mask: np.ndarray,
                   protect: np.ndarray | None = None) -> np.ndarray:
    """Inpaint remove_mask using ONLY the label's own clean paper as data,
    then add back a touch of the paper's own measured grain so the patch
    reads as paper, not a flat pasted rectangle. `protect` (typically the
    kept crest) is masked out of the solve too, not just left as "known" -
    a dark crest sitting right against the removed area otherwise anchors
    the inpaint and bleeds a dark smudge into what should read as clean
    paper; solving across it as another hole and only ever pasting back
    remove_mask keeps the crest's own pixels untouched while its edge stops
    dragging the fill down."""
    from skimage.restoration import inpaint_biharmonic

    clean = paper_mask & ~remove_mask
    if protect is not None:
        clean = clean & ~protect
    out = patch.copy()
    if clean.sum() < 20 or remove_mask.sum() == 0:
        if clean.sum() >= 1:
            out[remove_mask] = float(np.median(patch[clean])) if clean.sum() else float(np.median(patch[paper_mask]))
        return out

    work = patch.astype(np.float64).copy()
    unknown = remove_mask | ~paper_mask
    if protect is not None:
        unknown = unknown | protect
    filled = inpaint_biharmonic(work / 255.0, unknown, channel_axis=None) * 255.0
    out[remove_mask] = filled[remove_mask]

    # texture: the clean paper's own high-frequency residual, resampled
    blurred = ndimage.gaussian_filter(patch, sigma=1.6)
    residual = patch - blurred
    clean_residual = residual[clean]
    if clean_residual.size >= 20:
        std = float(clean_residual.std())
        std = min(std, 14.0) * TEXTURE_STRENGTH
        if std > 0.4:
            noise = RNG.normal(0.0, std, size=out.shape)
            noise = ndimage.gaussian_filter(noise, sigma=0.6)
            out = out.astype(np.float64)
            out[remove_mask] += noise[remove_mask]
    return np.clip(out, 0, 255)


def clean_label(gray: np.ndarray, box: dict, keep_box: dict | None = None) -> None:
    """Mutate `gray` in place: keep only the crest inside `box`, refill the
    rest of that label's own paper. `box` is {x0,y0,x1,y1,ground}. If
    `keep_box` is given, everything in `box` is ink EXCEPT that verbatim
    sub-rectangle (a manual override for a straggler `scan` never framed
    as a proper label). If `box["blank"]` is true (or `keep_box` is the
    literal string "none"), NOTHING is kept - every ink mark in the box goes
    (a label whose only mark is real lettering, e.g. an actual character,
    has no crest to keep at all)."""
    h, w = gray.shape
    x0 = max(0, box["x0"] - PAD)
    y0 = max(0, box["y0"] - PAD)
    x1 = min(w, box["x1"] + PAD)
    y1 = min(h, box["y1"] + PAD)
    if x1 - x0 < 6 or y1 - y0 < 6:
        return
    patch = gray[y0:y1, x0:x1].astype(np.float64)
    ground = box.get("ground", "white")
    blank = bool(box.get("blank")) or keep_box == "none"

    if blank:
        # No paper-mask reconstruction here - some panels are neither a
        # clean white nor a clean black ground (a pale frame around a
        # mid-grey plaque, say), which starves _paper_mask's Otsu split. A
        # `blank` box is a direct order - erase this whole rectangle - so
        # its own inner box (not the padding ring) is simply flooded with
        # its own darkest-quartile tone (the paper's base, ignoring the
        # bright frame/light ink pulling the mean up) plus that tone's own
        # measured grain, no reconstruction needed.
        ix0 = max(0, box["x0"] - x0)
        iy0 = max(0, box["y0"] - y0)
        ix1 = min(patch.shape[1], box["x1"] - x0)
        iy1 = min(patch.shape[0], box["y1"] - y0)
        inner = np.zeros(patch.shape, bool)
        if ix1 > ix0 and iy1 > iy0:
            inner[iy0:iy1, ix0:ix1] = True
        vals = patch[inner]
        if vals.size < 4:
            return
        pct = 25.0 if ground == "black" else 75.0
        tone = float(np.percentile(vals, pct))
        blurred = ndimage.gaussian_filter(patch, sigma=1.6)
        residual = (patch - blurred)[inner]
        std = min(float(residual.std()) if residual.size else 0.0, 10.0) * TEXTURE_STRENGTH
        filled = np.full(patch.shape, tone, dtype=np.float64)
        if std > 0.4:
            noise = ndimage.gaussian_filter(RNG.normal(0.0, std, size=patch.shape), sigma=0.6)
            filled = filled + noise
        gray[y0:y1, x0:x1][inner] = np.clip(filled[inner], 0, 255)
        return
    elif keep_box is not None and keep_box != "none":
        paper_mask = np.ones(patch.shape, bool)
        kx0 = max(0, keep_box["x0"] - x0)
        ky0 = max(0, keep_box["y0"] - y0)
        kx1 = min(patch.shape[1], keep_box["x1"] - x0)
        ky1 = min(patch.shape[0], keep_box["y1"] - y0)
        crest = np.zeros(patch.shape, bool)
        if kx1 > kx0 and ky1 > ky0:
            crest[ky0:ky1, kx0:kx1] = True
        ink = _ink_mask(patch, paper_mask, ground)
    else:
        paper_mask = _paper_mask(patch, ground)
        if paper_mask.sum() < 40:
            return
        ink = _ink_mask(patch, paper_mask, ground)
        crest = _pick_crest(ink, paper_mask)

    remove_mask = ink & ~crest
    if remove_mask.sum() == 0:
        return
    # grow the removal a couple px: dense small type is mostly anti-aliased
    # (a stroke's CORE clears the ink threshold, its soft edge does not), so
    # the raw ink mask alone leaves a thinned, still-legible ghost of every
    # row: bulking it out (never past the crest, re-excluded after) covers
    # the edge the threshold missed.
    remove_mask = ndimage.binary_dilation(remove_mask, iterations=REMOVE_GROW_PX) & paper_mask & ~crest
    protect = ndimage.binary_dilation(crest, iterations=1) if crest.any() else None
    cleaned = _texture_fill(patch, paper_mask, remove_mask, protect=protect)
    gray[y0:y1, x0:x1] = cleaned


# --------------------------------------------------------------- glass marks
GLASS_MIN_AREA, GLASS_MAX_AREA = 3, 42
GLASS_MAX_ASPECT = 4.0
GLASS_DARK, GLASS_BRIGHT = 45.0, 215.0
GLASS_ISOLATION_GROW = 3
GLASS_ISOLATION_CAP = 90


def clean_glass_marks(gray: np.ndarray, search: np.ndarray, exclude: np.ndarray) -> int:
    """Small, high-contrast, genuinely isolated marks sitting on the glass
    (never a label) - stray text the model left off-label. Deliberately
    conservative: only pixels near-black or near-white, in a small blob that
    does not belong to some larger connected stroke, ever move."""
    work = gray.copy()
    changed = 0
    for extreme, is_dark in ((GLASS_DARK, True), (GLASS_BRIGHT, False)):
        raw = (gray < extreme) if is_dark else (gray > extreme)
        raw = raw & search & ~exclude
        comp, n = ndimage.label(raw)
        if n == 0:
            continue
        objs = ndimage.find_objects(comp)
        for i, sl in enumerate(objs, start=1):
            if sl is None:
                continue
            blob = comp[sl] == i
            area = int(blob.sum())
            if area < GLASS_MIN_AREA or area > GLASS_MAX_AREA:
                continue
            ys, xs = np.where(blob)
            bw = xs.max() - xs.min() + 1
            bh = ys.max() - ys.min() + 1
            ar = max(bw, bh) / max(1, min(bw, bh))
            if ar > GLASS_MAX_ASPECT:
                continue
            grown = ndimage.binary_dilation(raw, iterations=GLASS_ISOLATION_GROW)
            gcomp, _ = ndimage.label(grown)
            gid = gcomp[sl][blob][0]
            if int((gcomp == gid).sum()) > GLASS_ISOLATION_CAP:
                continue  # part of a bigger stroke/outline, not a stray mark
            y0, y1, x0, x1 = ys.min() + sl[0].start, ys.max() + sl[0].start + 1, xs.min() + sl[1].start, xs.max() + sl[1].start + 1
            py0, py1 = max(0, y0 - 4), min(gray.shape[0], y1 + 4)
            px0, px1 = max(0, x0 - 4), min(gray.shape[1], x1 + 4)
            local = work[py0:py1, px0:px1].astype(np.float64)
            local_mask = np.zeros(local.shape, bool)
            local_mask[y0 - py0:y1 - py0, x0 - px0:x1 - px0] = True
            paper_mask = np.ones(local.shape, bool)  # whole neighbourhood is "clean glass" data
            cleaned = _texture_fill(local, paper_mask & ~local_mask | paper_mask, local_mask)
            work[py0:py1, px0:px1] = cleaned
            changed += 1
    gray[:] = work
    return changed


# --------------------------------------------------------------- IO helpers
def load_gray(path: Path) -> np.ndarray:
    return np.asarray(Image.open(path).convert("L")).astype(np.float64)


def save_gray(gray: np.ndarray, path: Path) -> None:
    Image.fromarray(np.clip(gray, 0, 255).astype(np.uint8)).save(path)


def boxes_mask(shape, boxes: list[dict], pad: int = PAD) -> np.ndarray:
    m = np.zeros(shape, bool)
    h, w = shape
    for b in boxes:
        x0 = max(0, b["x0"] - pad)
        y0 = max(0, b["y0"] - pad)
        x1 = min(w, b["x1"] + pad)
        y1 = min(h, b["y1"] + pad)
        m[y0:y1, x0:x1] = True
    return m


# --------------------------------------------------------------- proof / contact sheets
def label_thumb(before: np.ndarray, after: np.ndarray, box: dict, scale: int = 4, pad: int = 6) -> Image.Image:
    h, w = before.shape
    x0 = max(0, box["x0"] - pad)
    y0 = max(0, box["y0"] - pad)
    x1 = min(w, box["x1"] + pad)
    y1 = min(h, box["y1"] + pad)
    b = Image.fromarray(np.clip(before[y0:y1, x0:x1], 0, 255).astype(np.uint8)).convert("RGB")
    a = Image.fromarray(np.clip(after[y0:y1, x0:x1], 0, 255).astype(np.uint8)).convert("RGB")
    b = b.resize((b.width * scale, b.height * scale), Image.NEAREST)
    a = a.resize((a.width * scale, a.height * scale), Image.NEAREST)
    gap = 6
    canvas = Image.new("RGB", (b.width + gap + a.width, max(b.height, a.height) + 22), (40, 40, 40))
    canvas.paste(b, (0, 20))
    canvas.paste(a, (b.width + gap, 20))
    d = ImageDraw.Draw(canvas)
    try:
        font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 14)
    except Exception:
        font = ImageFont.load_default()
    d.text((2, 2), f"before ({box.get('ground','?')})", fill=(255, 210, 90), font=font)
    d.text((b.width + gap, 2), "after", fill=(140, 220, 255), font=font)
    return canvas


def build_proof_sheet(before: np.ndarray, after: np.ndarray, boxes: list[dict], cols: int = 4) -> Image.Image:
    thumbs = [label_thumb(before, after, b) for b in boxes]
    if not thumbs:
        return Image.new("RGB", (400, 60), (40, 40, 40))
    maxw = max(t.width for t in thumbs) + 8
    maxh = max(t.height for t in thumbs) + 8
    rows = (len(thumbs) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * maxw, rows * maxh), (60, 60, 60))
    for idx, t in enumerate(thumbs):
        r, c = divmod(idx, cols)
        sheet.paste(t, (c * maxw + 4, r * maxh + 4))
    return sheet


def build_scan_overlay(gray: np.ndarray, boxes: list[dict]) -> Image.Image:
    im = Image.fromarray(np.clip(gray, 0, 255).astype(np.uint8)).convert("RGB")
    d = ImageDraw.Draw(im)
    for b in boxes:
        color = (255, 60, 60) if b.get("ground") == "white" else (60, 160, 255)
        d.rectangle([b["x0"], b["y0"], b["x1"] - 1, b["y1"] - 1], outline=color, width=1)
    return im


# --------------------------------------------------------------- CLI
def cmd_scan(a):
    gray = load_gray(Path(a.image))
    masks_dir = Path(a.masks_dir)
    boxes = scan(gray, masks_dir)
    if a.out_json:
        Path(a.out_json).write_text(json.dumps(boxes, indent=2), encoding="utf8")
    if a.out_sheet:
        build_scan_overlay(gray, boxes).save(a.out_sheet)
    print(f"found {len(boxes)} candidate label(s)")
    for b in boxes:
        print(" ", b)


def cmd_clean(a):
    gray = load_gray(Path(a.image))
    boxes = json.loads(Path(a.boxes).read_text(encoding="utf8"))
    before = gray.copy()
    for b in boxes:
        clean_label(gray, b)
    if a.glass_marks:
        search = recess_mask(Path(a.masks_dir), (gray.shape[1], gray.shape[0]), dilate=15)
        excl = boxes_mask(gray.shape, boxes, pad=PAD + 3)
        n = clean_glass_marks(gray, search, excl)
        print(f"glass marks cleaned: {n}")
    save_gray(gray, Path(a.out))
    if a.before_out:
        save_gray(before, Path(a.before_out))
    print(f"cleaned {len(boxes)} label(s) -> {a.out}")


def cmd_patch(a):
    gray = load_gray(Path(a.image))
    x0, y0, x1, y1 = [int(v) for v in a.box.split(",")]
    box = {"x0": x0, "y0": y0, "x1": x1, "y1": y1, "ground": a.ground, "blank": bool(a.blank)}
    keep_box = None
    if a.keep_box and a.keep_box != "none":
        kx0, ky0, kx1, ky1 = [int(v) for v in a.keep_box.split(",")]
        keep_box = {"x0": kx0, "y0": ky0, "x1": kx1, "y1": ky1}
    clean_label(gray, box, keep_box=keep_box)
    save_gray(gray, Path(a.out))
    print(f"patched {box} -> {a.out}")


def cmd_proof(a):
    boxes = json.loads(Path(a.boxes).read_text(encoding="utf8"))
    before = load_gray(Path(a.before_dir) / a.before_tag)
    after = load_gray(Path(a.image))
    sheet = build_proof_sheet(before, after, boxes)
    sheet.save(a.out)
    print(f"proof sheet ({len(boxes)} labels) -> {a.out}")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("scan")
    p.add_argument("image")
    p.add_argument("--out-json", default="")
    p.add_argument("--out-sheet", default="")
    p.add_argument("--masks-dir", default=str(DEFAULT_MASKS))
    p.set_defaults(func=cmd_scan)

    p = sub.add_parser("clean")
    p.add_argument("image")
    p.add_argument("out")
    p.add_argument("--boxes", required=True)
    p.add_argument("--masks-dir", default=str(DEFAULT_MASKS))
    p.add_argument("--glass-marks", action="store_true", default=True)
    p.add_argument("--no-glass-marks", dest="glass_marks", action="store_false")
    p.add_argument("--before-out", default="")
    p.add_argument("--seed", type=int, default=0)
    p.set_defaults(func=cmd_clean)

    p = sub.add_parser("patch")
    p.add_argument("image")
    p.add_argument("out")
    p.add_argument("--box", required=True, help="x0,y0,x1,y1")
    p.add_argument("--ground", choices=["white", "black"], default="white")
    p.add_argument("--keep-box", default="", help="x0,y0,x1,y1 kept verbatim as the crest")
    p.add_argument("--blank", action="store_true", help="keep nothing at all - erase every mark in --box")
    p.set_defaults(func=cmd_patch)

    p = sub.add_parser("proof")
    p.add_argument("image")
    p.add_argument("out")
    p.add_argument("--boxes", required=True)
    p.add_argument("--before-dir", required=True)
    p.add_argument("--before-tag", required=True)
    p.set_defaults(func=cmd_proof)

    a = ap.parse_args()
    if getattr(a, "seed", None):
        global RNG
        RNG = np.random.default_rng(a.seed)
    a.func(a)


if __name__ == "__main__":
    main()
