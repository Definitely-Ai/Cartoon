"""Typeset every bottle's brand onto its label, in code, the same way
scripts/sign-on-glass.py gilds THE SWINGING DOOR onto the window: set the words
at 4x in a small flat label space, then warp ONCE by homography onto the
measured label quad and alpha-composite. Lettering is never left to the model
- here that matters twice over, because a bottle label is small and the model
cannot hold ten different house-brand names straight across a shelf anyway.

    python scripts/label-bottles.py <plate.png> <out.png> [--labels <labels.json>] [--font <ttf>]

labels.json is written by the block-in (scripts/draw-room-lines.py's bottles())
in the v2-quads convention: each entry carries a quad (4 plate-pixel corners,
CLOCKWISE FROM TOP-LEFT - the same convention sign-on-glass.py reads for
windowQuad), a shape (rectangle | band | oval | shield), heightPx/widthPx, and
the brand text to set.

THE TYPE IS SIZED TO THE LABEL, NOT THE LABEL TO THE TYPE (critic, 2026-09-08:
"the names are set at whatever size the box allows and half of them are grey
mush"). The rule is one line long:

    SET THE BRAND'S LONGEST WORD TO THE LABEL'S INNER WIDTH, and keep the cap
    height at or above CAP_MIN_PX plate pixels.

So the size is chosen from the WORD, not from the string: every one- and
two-line split of the name is tried, each grown until the widest line fills the
inner width or the block fills the inner height, and the tallest survivor wins.
A four-word name whose long word is TENNESSEE is set two lines deep with
TENNESSEE alone on one of them, because that is the split that lets the type be
biggest - a greedy wrap at the middle sets the same name half the size.

Under CAP_MIN_PX no split of the FULL name is legible, but a real liquor label
never carries the full name at one size anyway - it carries ONE big brand word.
So before giving up, the label DROPS TO A DISPLAY NAME: the brand's short form
from SHORT (or its own first word, for a brand SHORT doesn't know), alone on
one line at up to BIG_WORD_WIDTH_FRAC of the label's width and cap >=
SHORT_MIN_PX, with whatever's left of the brand set smaller beneath it - only
if that remainder itself clears SHORT_REMAINDER_MIN_PX, otherwise the big word
stands alone. Only when even the short form won't clear its floor does the
label fall the rest of the way to A MONOGRAM: the brand's initials, set large
between the rules. A monogram reads across a bar and a 4 px word does not.

A LABEL IS NOT A WINDOW: it is small, its own ground tone varies bottle to
bottle (paper against clear glass vs. paper against dark glass read
differently), and its quad is a bounding box, not the paper's true outline for
oval and shield labels. So per label this script also samples the plate under
the quad for the ground tone and inks DARK against it - never a fixed colour -
and insets the type per shape so it sits on the paper and not on corners the
paper does not have.
"""
import argparse
import json
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
FONT = "C:/Windows/Fonts/framd.ttf"           # bold condensed capitals, same face as the window sign
SS = 4                                        # worked at 4x in the label's own flat space, warped once
TRACK = 0.035                                 # a little air between letters (less than the window: labels are tiny)
CAP_MIN_PX = 6.0                              # the floor, in PLATE pixels, on the height of a capital
LINE_LEAD = 1.40                              # line advance as a multiple of the cap height
RULE_PX = 1.0                                 # a thin rule above and below, in plate pixels
RULE_SIDE = 0.04                              # held in from the safe area's own edges
INK_K = 0.16                                  # ink = this much of the label's own ground, floored/capped
INK_MIN, INK_MAX = 8.0, 44.0
SQUEEZE_MIN = 0.56                            # how far a line may be CONDENSED to reach the width

# --- snapping the quad to the label the model actually painted -------------
#
# The block-in's quad is a CONSTRUCTION box - where the label was told to go.
# The render is a different bottle: the image model draws its own bright
# paper patch, shifted 5-25 px off that box and a different size, because
# nothing forces it to hit the block-in exactly. Typesetting onto the
# construction quad puts the brand half on dark glass. So before typesetting,
# each quad is SNAPPED onto the actual painted paper: search a window around
# the quad, threshold for bright paper, and take the connected component that
# best matches - by overlap with the quad first, by plausible size second.
SNAP_MARGIN_X = 30.0                          # search window growth, plate px, sideways
SNAP_MARGIN_Y = 20.0                          # search window growth, plate px, vertical
SNAP_BLUR_PX = 1.0                            # light blur before thresholding, bridges dither
SNAP_THRESH = 175.0                           # grey level a painted label's paper must clear
SNAP_SHRINK = 0.05                            # inset the fitted paper box this much per side
SNAP_MIN_OVERLAP_FRAC = 0.15                  # primary pick: blob must cover this much of the quad
SNAP_MIN_HEIGHT_FRAC = 0.60                   # fallback pick: blob height >= this x quad height
SNAP_WIDTH_RANGE = (0.6, 1.8)                 # fallback pick: blob width within this x quad width

# --- the display-name step, between the full name and the monogram ---------
#
# A real liquor label carries ONE big brand word - not the whole legal name
# set small enough to fit. SHORT gives that word (or two, e.g. "TEE TIME")
# per house brand; an unlisted brand falls back to its own first word. The
# big word is set on ONE line only (never split further) at up to
# BIG_WORD_WIDTH_FRAC of the snapped paper's own width, wider than the usual
# per-shape safe area because it is the only thing on its line. Whatever of
# the brand is left over is set beneath it, smaller, ONLY if that remainder
# is still legible at SHORT_REMAINDER_MIN_PX - otherwise it is dropped and
# the big word stands alone.
SHORT = {
    "BUNKER": "BUNKER",
    "DIVOT DRIVE GIN": "DIVOT",
    "PAR-TEE SCOTCH": "PAR-TEE",
    "TEE TIME TENNESSEE WHISKEY": "TEE TIME",
    "BIRDIE BOURBON": "BIRDIE",
    "CADDY'S CHOICE RUM": "CADDY'S",
    "EAGLE EYE VODKA": "EAGLE EYE",
    "ROUGH RIDER GIN": "ROUGH RIDER",
    "19TH HOLE RYE": "19TH HOLE",
    "BACK NINE": "BACK NINE",
}
SHORT_MIN_PX = 5.0                            # floor, in PLATE pixels, on the big word's cap height
SHORT_REMAINDER_MIN_PX = 4.0                  # floor on the smaller remainder line; below this it's dropped
BIG_WORD_WIDTH_FRAC = 0.88                    # the big word may use up to this much of the snapped paper width

# per-shape inset of the TEXT SAFE AREA within the quad's bounding box, as a
# fraction of (width, top, bottom) - the quad is the cut paper's bounding box,
# not its outline, for the two non-rectangular shapes.
#
# THE SHIELD IS TOP-ANCHORED. Its paper is full width from the top down to 42%
# of the way up from the bottom and then points; insetting it evenly threw the
# type into the point and cost it a third of its size for nothing.
SHAPE_INSET = {
    "rectangle": (0.05, 0.09, 0.09),
    "band":      (0.05, 0.12, 0.12),
    "oval":      (0.14, 0.17, 0.17),
    "shield":    (0.07, 0.09, 0.25),
}


def coeffs(dst, src):
    """The homography PIL wants: OUTPUT pixels back to INPUT pixels. Same as
    sign-on-glass.py's coeffs() - copied rather than imported so this file has
    no dependency on the window script running first."""
    A, B = [], []
    for (dx, dy), (sx, sy) in zip(dst, src):
        A += [[dx, dy, 1, 0, 0, 0, -sx * dx, -sx * dy],
              [0, 0, 0, dx, dy, 1, -sy * dx, -sy * dy]]
        B += [sx, sy]
    return np.linalg.solve(np.array(A, np.float64), np.array(B, np.float64))


def _font(path, size):
    f = ImageFont.truetype(path, max(int(size), 4))
    try:
        f.set_variation_by_name("Bold")
    except Exception:
        pass
    return f


def cap_height(draw, font) -> float:
    """The height of a capital, which is the only size that means anything on a
    label 35 px tall. An em size does not: this face carries a third of its em
    below the baseline and a name set at 'size 12' is 8 px of ink."""
    b = draw.textbbox((0, 0), "H", font=font)
    return float(b[3] - b[1])


def text_width(draw, s, font) -> float:
    """Width with the tracking this script actually draws with - the sum of the
    glyph boxes plus one gap between each pair, not the string's own advance."""
    w = sum(draw.textbbox((0, 0), ch, font=font)[2] - draw.textbbox((0, 0), ch, font=font)[0]
            for ch in s)
    return w + TRACK * font.size * max(len(s) - 1, 0)


def fit_brand(draw, brand, box_w, box_h, font_path):
    """The biggest setting of `brand` that fits (box_w, box_h) in one or two
    lines. Every split is tried, not just the middle one, because which split
    wins is decided by the LONGEST WORD: the size can never exceed what makes
    that word fit the width, and the best split is the one that puts the long
    word on a line of its own. A four-word name whose long word is TENNESSEE is
    set with TENNESSEE alone on a line; a greedy wrap at the middle sets the
    same name half the size.

    The width is reached by CONDENSING as well as by shrinking - down to
    SQUEEZE_MIN, no further - which is what a liquor label does and what buys
    the cap height its floor. Returns (lines, font, cap, squeeze) or None.
    """
    words = brand.split()
    layouts = [[brand]]
    for c in range(1, len(words)):
        layouts.append([" ".join(words[:c]), " ".join(words[c:])])
    best = None
    for lines in layouts:
        chosen = None
        for size in range(5, int(box_h) + 60):
            f = _font(font_path, size)
            cap = cap_height(draw, f)
            if cap * LINE_LEAD * len(lines) > box_h:
                break
            mw = max(text_width(draw, ln, f) for ln in lines)
            sq = min(1.0, box_w / mw) if mw > 0 else 1.0
            if sq < SQUEEZE_MIN:
                break
            chosen = (f, cap, sq)
        if chosen and (best is None or chosen[1] > best[2]):
            best = (lines, chosen[0], chosen[1], chosen[2])
    return best


def fit_one_line(draw, text, box_w, box_h, font_path, max_size=None):
    """Like the inner loop of fit_brand, but for a single line that is never
    split - used for the display-name's big word, which stays on one line by
    definition. `max_size` caps the point size searched (exclusive), so the
    remainder line called with the big word's size comes out strictly smaller
    rather than merely fitting its own box. Returns (font, cap, squeeze) or
    None."""
    hi = int(box_h) + 60
    if max_size is not None:
        hi = min(hi, int(max_size))
    chosen = None
    for size in range(5, hi):
        f = _font(font_path, size)
        cap = cap_height(draw, f)
        if cap * LINE_LEAD > box_h:
            break
        w = text_width(draw, text, f)
        sq = min(1.0, box_w / w) if w > 0 else 1.0
        if sq < SQUEEZE_MIN:
            break
        chosen = (f, cap, sq)
    return chosen


def short_form(brand: str) -> str:
    """The brand's display word(s) from SHORT, or its own first word for a
    brand SHORT doesn't know."""
    if brand in SHORT:
        return SHORT[brand]
    words = brand.split()
    return words[0] if words else brand


def remainder_words(brand: str, short: str) -> str:
    """Whatever of `brand` is left after its short form's words are taken off
    the front - "" when the short form IS the whole brand (BUNKER, BACK
    NINE)."""
    b_words, s_words = brand.split(), short.split()
    if b_words[:len(s_words)] == s_words:
        return " ".join(b_words[len(s_words):])
    return " ".join(b_words[1:])


def fit_short(draw, brand, box_w_big, box_w_small, box_h, font_path):
    """The display-name setting: the brand's short form alone on one big line
    at cap >= SHORT_MIN_PX, with whatever's left of the brand set beneath it
    on a smaller line, only if THAT line clears SHORT_REMAINDER_MIN_PX.
    Returns a list of (text, font, cap, squeeze) - one entry, or two - or
    None if even the big word alone doesn't clear its floor."""
    short = short_form(brand)
    big = fit_one_line(draw, short, box_w_big, box_h, font_path)
    if big is None or big[1] / SS < SHORT_MIN_PX:
        return None
    font_big, cap_big, sq_big = big
    specs = [(short, font_big, cap_big, sq_big)]

    rest = remainder_words(brand, short)
    if rest:
        remaining_h = max(0.0, box_h - cap_big * LINE_LEAD)
        small = fit_one_line(draw, rest, box_w_small, remaining_h, font_path, max_size=font_big.size)
        if small is not None and small[1] / SS >= SHORT_REMAINDER_MIN_PX:
            specs.append((rest, small[0], small[1], small[2]))
    return specs


def monogram(brand: str) -> str:
    """The brand's initials - a leading number kept whole, so 19TH HOLE RYE is
    19HR and not 1HR."""
    out = []
    for w in brand.split():
        m = re.match(r"\d+", w)
        out.append(m.group(0) if m else w[0])
    return "".join(out)


def draw_tracked(draw, x, y, text, font, fill):
    cur = x
    for ch in text:
        cb = draw.textbbox((0, 0), ch, font=font)
        draw.text((cur - cb[0], y), ch, fill=fill, font=font)
        cur += (cb[2] - cb[0]) + TRACK * font.size


def line_stamp(text, font, cap, squeeze, ref):
    """One line, drawn once and CONDENSED to `squeeze`, as an L image whose top
    row is the cap line and whose height is the cap height. Stamped rather than
    drawn straight into the label so the condensing is one resample and not a
    per-glyph fudge."""
    w = max(int(round(text_width(ref, text, font))) + 8, 8)
    h = max(int(round(cap)) + 6, 8)
    tmp = Image.new("L", (w, h + int(cap)), 0)
    dt = ImageDraw.Draw(tmp)
    b = dt.textbbox((0, 0), text, font=font)
    draw_tracked(dt, 0, -b[1], text, font, 255)
    tmp = tmp.crop((0, 0, w, h))
    tw = max(int(round(text_width(ref, text, font) * squeeze)), 1)
    return tmp.resize((tw, h), Image.LANCZOS)


def label_texture(entry, font_path):
    """One label's ink (0..255) and alpha (0..1) in its own flat space, sized
    widthPx x heightPx at 4x: the brand on one or two lines with a thin rule
    above and below it, or - when no split of the name reaches CAP_MIN_PX - the
    brand's initials as a monogram between the same two rules.

    Returns (ink, alpha, note) where note says which of the two was set and at
    what cap height, in PLATE pixels, so the caller can report it."""
    w_px, h_px = float(entry["widthPx"]), float(entry["heightPx"])
    Wt, Ht = max(int(round(w_px * SS)), 8), max(int(round(h_px * SS)), 8)
    ink = Image.new("L", (Wt, Ht), 0)
    alpha = Image.new("L", (Wt, Ht), 0)
    di, da = ImageDraw.Draw(ink), ImageDraw.Draw(alpha)

    side, top, bot = SHAPE_INSET.get(entry.get("shape", "rectangle"), SHAPE_INSET["rectangle"])
    x0, x1 = Wt * side, Wt * (1 - side)
    y0, y1 = Ht * top, Ht * (1 - bot)
    box_w, box_h = x1 - x0, y1 - y0
    rule_h = max(2.0, RULE_PX * SS)
    rx0, rx1 = x0 + box_w * RULE_SIDE, x1 - box_w * RULE_SIDE

    def rule(yy):
        for d in (di, da):
            d.rectangle([rx0, yy, rx1, yy + rule_h], fill=255)

    brand = entry.get("brand", "")
    avail_h = box_h - 2.4 * rule_h
    fit = fit_brand(di, brand, box_w, avail_h, font_path) if brand else None
    mode = "name"
    specs = None                         # list of (text, font, cap, squeeze), biggest/primary first
    if fit is not None and fit[2] / SS >= CAP_MIN_PX:
        lines, font, cap, squeeze = fit
        specs = [(ln, font, cap, squeeze) for ln in lines]
    else:
        big_box_w = Wt * BIG_WORD_WIDTH_FRAC
        short_specs = fit_short(di, brand, big_box_w, box_w, avail_h, font_path) if brand else None
        if short_specs is not None:
            mode = "short"
            specs = short_specs
        else:
            mode = "monogram"
            mfit = fit_brand(di, monogram(brand) or "-", box_w, avail_h, font_path)
            if mfit is not None:
                mlines, mfont, mcap, msq = mfit
                specs = [(ln, mfont, mcap, msq) for ln in mlines]
    if not specs:                        # nothing at all fits: the rules alone
        rule(y0 + box_h * 0.34)
        rule(y0 + box_h * 0.60)
        return (np.asarray(ink, np.float32), np.asarray(alpha, np.float32) / 255.0,
                ("rules", 0.0, 1.0))

    top_cap, top_squeeze = specs[0][2], specs[0][3]
    block = sum(cap * LINE_LEAD for (_, _, cap, _) in specs)
    gap = max(1.5, top_cap * 0.26)
    total = block + 2 * (gap + rule_h)
    if total > box_h:                    # spend the overflow out of the gaps first
        gap = max(0.0, gap - (total - box_h) / 2)
        total = block + 2 * (gap + rule_h)
    ytop = y0 + max(0.0, (box_h - total) / 2)
    rule(ytop)                           # the thin rule stays right above the big word...
    y = ytop + rule_h + gap
    center = x0 + box_w / 2
    for text, font, cap, squeeze in specs:
        st = line_stamp(text, font, cap, squeeze, di)
        px = int(round(center - st.width / 2))
        ink.paste(st, (px, int(round(y))), st)
        alpha.paste(st, (px, int(round(y))), st)
        y += cap * LINE_LEAD
    rule(ytop + rule_h + gap + block + gap)   # ...and right below the whole block, same as before
    return (np.asarray(ink, np.float32), np.asarray(alpha, np.float32) / 255.0,
            (mode, top_cap / SS, top_squeeze))


def ground_tone(plate: np.ndarray, quad) -> float:
    """Mean plate value inside the quad - the label's own paper tone, sampled
    from the block-in rather than assumed, since clear-glass and dark-glass
    bottles leave very different labels behind them."""
    m = Image.new("L", (plate.shape[1], plate.shape[0]), 0)
    ImageDraw.Draw(m).polygon([tuple(p) for p in quad], fill=255)
    mask = np.asarray(m, np.float32) / 255.0
    if mask.sum() < 1:
        return 200.0
    return float((plate * mask).sum() / mask.sum())


def quad_bbox(quad):
    xs = [p[0] for p in quad]
    ys = [p[1] for p in quad]
    return min(xs), min(ys), max(xs), max(ys)


def bright_paper_components(plate_img: Image.Image) -> np.ndarray:
    """Connected components of the render's bright paper, found ONCE for the
    whole plate and reused by every label's snap() below: a light blur (to
    bridge halftone/dither noise in the render) then a fixed paper threshold,
    labelled 4-connected so two labels' paper never merges through a touching
    corner."""
    blurred = plate_img.filter(ImageFilter.GaussianBlur(SNAP_BLUR_PX))
    bright = np.asarray(blurred, np.float32) > SNAP_THRESH
    comp_ids, _ = ndimage.label(bright)
    return comp_ids


def snap_quad(entry, comp_ids: np.ndarray, PW: int, PH: int):
    """Find the blob of painted paper that best matches this label's
    construction quad, within a window = the quad's bounding box grown by
    SNAP_MARGIN_X sideways and SNAP_MARGIN_Y vertically.

    Picks, in order:
      1. the component with the largest overlap with the quad, provided that
         overlap covers at least SNAP_MIN_OVERLAP_FRAC of the quad's own area
         (the model painted roughly where it was told, just offset/resized);
      2. failing that, the largest bright blob in the window whose height is
         >= SNAP_MIN_HEIGHT_FRAC of the quad's height and whose width falls
         within SNAP_WIDTH_RANGE of the quad's width (the model drew the
         label somewhere else in the window entirely).

    Returns None if neither candidate exists (caller keeps the original quad
    and warns). Otherwise returns a dict with the new quad (axis-aligned,
    clockwise from top-left, inset SNAP_SHRINK per side as a paper margin),
    its widthPx/heightPx, the raw (pre-shrink) blob box, and which rule fired.
    """
    quad = entry["quad"]
    qx0, qy0, qx1, qy1 = quad_bbox(quad)
    qw, qh = qx1 - qx0, qy1 - qy0

    wx0 = max(0, int(np.floor(qx0 - SNAP_MARGIN_X)))
    wy0 = max(0, int(np.floor(qy0 - SNAP_MARGIN_Y)))
    wx1 = min(PW, int(np.ceil(qx1 + SNAP_MARGIN_X)))
    wy1 = min(PH, int(np.ceil(qy1 + SNAP_MARGIN_Y)))
    if wx1 <= wx0 or wy1 <= wy0:
        return None

    window = comp_ids[wy0:wy1, wx0:wx1]
    ids = np.unique(window)
    ids = ids[ids != 0]
    if ids.size == 0:
        return None

    qmask_img = Image.new("L", (wx1 - wx0, wy1 - wy0), 0)
    ImageDraw.Draw(qmask_img).polygon([(p[0] - wx0, p[1] - wy0) for p in quad], fill=1)
    qmask = np.asarray(qmask_img, bool)
    qarea = float(qmask.sum())

    best_overlap = None    # (overlap, box)
    best_fallback = None   # (area, box)
    for i in ids:
        comp = window == i
        ys_c, xs_c = np.where(comp)
        box = (xs_c.min() + wx0, ys_c.min() + wy0, xs_c.max() + wx0, ys_c.max() + wy0)
        cw, ch = box[2] - box[0] + 1, box[3] - box[1] + 1
        area = float(comp.sum())

        overlap = float((comp & qmask).sum())
        if qarea > 0 and overlap / qarea >= SNAP_MIN_OVERLAP_FRAC:
            if best_overlap is None or overlap > best_overlap[0]:
                best_overlap = (overlap, box)

        if ch >= SNAP_MIN_HEIGHT_FRAC * qh and SNAP_WIDTH_RANGE[0] * qw <= cw <= SNAP_WIDTH_RANGE[1] * qw:
            if best_fallback is None or area > best_fallback[0]:
                best_fallback = (area, box)

    if best_overlap is not None:
        rule, (bx0, by0, bx1, by1) = "overlap", best_overlap[1]
    elif best_fallback is not None:
        rule, (bx0, by0, bx1, by1) = "fallback", best_fallback[1]
    else:
        return None

    bw, bh = bx1 - bx0 + 1, by1 - by0 + 1
    sx, sy = bw * SNAP_SHRINK, bh * SNAP_SHRINK
    nx0, ny0, nx1, ny1 = bx0 + sx, by0 + sy, bx1 - sx, by1 - sy
    if nx1 <= nx0 or ny1 <= ny0:
        return None

    return {
        "quad": [[nx0, ny0], [nx1, ny0], [nx1, ny1], [nx0, ny1]],
        "widthPx": nx1 - nx0,
        "heightPx": ny1 - ny0,
        "raw_box": (bx0, by0, bx1, by1),
        "rule": rule,
    }


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("plate_in")
    ap.add_argument("out")
    ap.add_argument("--labels", default=str(ROOT / "canon/room-kit/v2/labels.json"))
    ap.add_argument("--font", default=FONT)
    ap.add_argument("--brand-key", default="brand", choices=("brand", "brandForKind"),
                    help="which of the two names labels.json carries to set")
    ap.add_argument("--no-snap", action="store_true",
                    help="typeset onto the construction quad as-is; skip snapping to the painted paper")
    a = ap.parse_args()

    data = json.loads(Path(a.labels).read_text(encoding="utf8"))
    labels = data["labels"]

    base = Image.open(a.plate_in).convert("L")
    PW, PH = base.size
    plate = np.asarray(base, np.float32)
    out = plate.copy()

    comp_ids = None if a.no_snap else bright_paper_components(base)

    named = short_n = mono = 0
    snapped_n = 0
    worst = (1e9, "")
    for entry in labels:
        entry = dict(entry, brand=entry.get(a.brand_key, entry.get("brand", "")))

        if comp_ids is not None:
            ox0, oy0, ox1, oy1 = quad_bbox(entry["quad"])
            snap = snap_quad(entry, comp_ids, PW, PH)
            if snap is not None:
                snapped_n += 1
                sx0, sy0, sx1, sy1 = quad_bbox(snap["quad"])
                dx = (sx0 + sx1) / 2 - (ox0 + ox1) / 2
                dy = (sy0 + sy1) / 2 - (oy0 + oy1) / 2
                print(f'  {entry["row"]:5s}{entry["index"]:3d}  {entry["brand"]:25s}  snap[{snap["rule"]}]  '
                      f'orig=({ox0:.1f},{oy0:.1f})-({ox1:.1f},{oy1:.1f})  '
                      f'snapped=({sx0:.1f},{sy0:.1f})-({sx1:.1f},{sy1:.1f})  '
                      f'dx={dx:+.1f} dy={dy:+.1f}')
                entry["quad"] = snap["quad"]
                entry["widthPx"] = snap["widthPx"]
                entry["heightPx"] = snap["heightPx"]
            else:
                print(f'  {entry["row"]:5s}{entry["index"]:3d}  {entry["brand"]:25s}  '
                      f'WARNING: no acceptable paper blob found near '
                      f'orig=({ox0:.1f},{oy0:.1f})-({ox1:.1f},{oy1:.1f}) - keeping construction quad')

        quad = entry["quad"]
        ink_tex, alpha_tex, (mode, cap, sq) = label_texture(entry, a.font)
        named += mode == "name"
        short_n += mode == "short"
        mono += mode == "monogram"
        if cap < worst[0]:
            worst = (cap, f'{entry["row"]} {entry["index"]} {entry["brand"]}')
        Ht, Wt = ink_tex.shape

        ground = ground_tone(plate, quad)
        ink_v = min(max(ground * INK_K, INK_MIN), INK_MAX)
        # the ink sits DARK on the label's own light ground, whatever that ground is
        layer = ink_v * (ink_tex / 255.0)

        cf = coeffs(quad, [(0, 0), (Wt, 0), (Wt, Ht), (0, Ht)])
        warp = lambda arr, resample=Image.BICUBIC: np.asarray(
            Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
                 .transform((PW, PH), Image.PERSPECTIVE, cf, resample, fillcolor=0),
            np.float32)
        L = warp(layer)
        A = np.clip(warp(alpha_tex * 255.0) / 255.0, 0, 1)
        out = out * (1 - A) + L * A
        print(f'  {entry["row"]:5s}{entry["index"]:3d}  {entry["shape"]:9s} '
              f'{entry["widthPx"]:5.1f}x{entry["heightPx"]:4.1f} px  {mode:8s} '
              f'cap {cap:4.1f} px  squeeze {sq:.2f}  ink {ink_v:3.0f} on {ground:3.0f}  '
              f'{entry["brand"]}')

    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(a.out)
    print(f'{a.out}: {named} names set, {short_n} short forms, {mono} monograms, '
          f'from {len(labels)} labels in {a.labels}')
    if comp_ids is not None:
        print(f'snapped {snapped_n}/{len(labels)} labels to painted paper '
              f'({len(labels) - snapped_n} kept the construction quad)')
    print(f'smallest cap height {worst[0]:.1f} px (floor {CAP_MIN_PX:.0f})  on {worst[1]}')


if __name__ == "__main__":
    main()
