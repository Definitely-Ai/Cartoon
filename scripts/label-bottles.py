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
import math
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
# The render is a different bottle: the image model draws its own paper
# patch, shifted 5-25 px off that box and a different size, because nothing
# forces it to hit the block-in exactly. Typesetting onto the construction
# quad puts the brand half on dark glass. So before typesetting, each quad is
# SNAPPED onto the actual painted paper: search a window around the quad and
# take the connected component that best matches - by overlap with the quad
# first, by plausible size second.
#
# SNAP BY GROUND (critic, 2026-09-08). A white label's paper is brighter than
# almost everything around it, so a fixed brightness threshold finds it. A
# BLACK label's paper is not - it sits at roughly the same darkness as the
# dark glass, the wood-grain shelf and the shadow around it, so thresholding
# on darkness alone floods the whole window into one blob. What sets the
# paper apart from its surroundings is its FLATNESS: a printed label is a
# near-uniform fill, where glass, grain and shadow all carry local texture.
# So the black pass masks on darkness AND local uniformity together (a small
# windowed local std, not the fixed-threshold blob the white pass uses), and
# additionally demands the resulting blob be mostly rectangular (a real label
# fills most of its own bounding box; a stray sliver of uniform shadow does
# not) - neither check is needed for the white pass, whose bright threshold
# already isolates paper cleanly on its own.
SNAP_MARGIN_X = 45.0                          # search window growth, plate px, sideways
SNAP_MARGIN_Y = 35.0                          # search window growth, plate px, vertical
SNAP_BLUR_PX = 1.0                            # light blur before thresholding, bridges dither
SNAP_THRESH = 175.0                           # grey level a painted WHITE label's paper must clear
SNAP_DARK_THRESH = 70.0                       # grey level a painted BLACK label's paper must stay under
SNAP_DARK_STD_WIN = 5                         # window, px, for the BLACK pass's local-uniformity test
SNAP_DARK_STD_MAX = 8.0                       # local std must stay under this to count as "uniform"
SNAP_DARK_MIN_FILL = 0.60                     # BLACK candidate blob: area / its own bbox area, min
SNAP_SHRINK = 0.05                            # inset the fitted paper box this much per side
SNAP_MIN_OVERLAP_FRAC = 0.15                  # primary pick: blob must cover this much of the quad
SNAP_MIN_HEIGHT_FRAC = 0.60                   # fallback pick: blob height >= this x quad height
SNAP_WIDTH_RANGE = (0.6, 1.8)                 # fallback pick: blob width within this x quad width
SNAP_MIN_SHORT_PX = 14.0                      # snapped paper's shorter side floor - under this, skip

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

# --- the emblem library, --mode emblems (the default) ----------------------
#
# ROUND 2 (founder, 2026-09-08, verbatim): "the bottles shouldnt have creative
# names or even names at all on them they just need emblems the remind people
# of real liquor bottles". So the default path no longer sets a house brand at
# all - it stamps ONE bold device onto the label, from a library of
# twenty-four (sixteen at first; extended - see the block comment above
# EMBLEMS - once a twenty-body-label shelf turned out to need more devices
# than either row alone did), the same way a name was stamped: worked at SS in
# the label's own flat space, then warped once by the SAME homography onto the
# SAME snapped quad the names used (snap_quad, coeffs - both unchanged, both
# mode-agnostic). --mode names keeps the old lettered pipeline exactly as it
# was; nothing above this section changed for it.
#
# EMBLEM_MIN_PX is the floor for a DEVICE, not a WORD, and it sits well under
# CAP_MIN_PX (6 px, a set capital) because a bold solid shape carries at a
# fraction of the size a letterform needs to stay a letterform. On the
# eleven-lower/nine-upper shelf a few of the narrowest labels (vodka,
# triple_sec) fall under the 34 px construction floor draw-room-lines.py aims
# for - this is the floor that catches them; see the build log's own count of
# how many.
EMBLEM_MIN_PX = 26.0
EMBLEM_FIT_FRAC = 0.70          # the device's own diameter, as a fraction of the
                                # SNAPPED PAPER's shorter side (widthPx/heightPx) -
                                # not the shape-inset safe area, so a small, tightly
                                # snapped label (a neck) sizes off what it actually
                                # measures rather than a doubly-inset box that
                                # starved it further; still capped to the safe
                                # area so it never overflows a border or a shape's
                                # own point
EMBLEM_MIN_DEVICE_PX = 10.0     # a device drawn smaller than this is unreadable -
                                # skip the label instead (critic, 2026-09-08)
EMBLEM_RULE_FRAC = 0.09         # a fine rule/cut, as a fraction of the device's
                                # own radius - "a fine light rule or two"
EMBLEM_BORDER_W_FRAC = 0.05     # a shape-matching border's stroke width, as a
                                # fraction of the label's shorter side, for the
                                # emblems that carry one (EMBLEM_BORDER below)

# INVERTED INK (founder: "A black-label bottle inverts"). The existing
# ground-relative formula (INK_K, INK_MIN/MAX below) always sets ink DARKER
# than its ground - right for a paper label, wrong for a black one, where the
# device has to be LIGHTER than the dark paper it sits on. Both modes share
# this: a black label set in --mode names would be unreadable dark-on-dark
# without it too.
INK_K_INV = 0.82                 # how far from ground toward white the ink sits
INK_MIN_INV, INK_MAX_INV = 205.0, 250.0


def _ept(nx: float, ny: float, cx: float, cy: float, r: float):
    """One point of a device, in its own normalised -1..1 square (ny UP, like
    a drawing convention) mapped to the flat label space at (cx, cy) radius r."""
    return (cx + nx * r, cy - ny * r)


def _epoly(dm, pts, cx, cy, r, fill=255):
    dm.polygon([_ept(nx, ny, cx, cy, r) for nx, ny in pts], fill=fill)


def _eline(dm, a, b, cx, cy, r, fill=0, width=2):
    dm.line([_ept(*a, cx, cy, r), _ept(*b, cx, cy, r)], fill=fill, width=max(1, int(round(width))))


def _eellipse(dm, cx, cy, r, rx=1.0, ry=1.0, fill=255, outline=None, width=1):
    dm.ellipse([cx - rx * r, cy - ry * r, cx + rx * r, cy + ry * r],
               fill=fill, outline=outline, width=max(1, int(round(width))))


def _estar(n, r_out, r_in, rot=-math.pi / 2):
    pts = []
    for i in range(n * 2):
        rad = r_out if i % 2 == 0 else r_in
        a = rot + i * math.pi / n
        pts.append((rad * math.cos(a), rad * math.sin(a)))
    return pts


def _erule(r):
    return max(1.0, r * EMBLEM_RULE_FRAC)


# TWENTY-FOUR DEVICES (sixteen, plus eight more - critic, 2026-09-08: the
# first sixteen left the shelf's last eight labels repeating the first eight,
# "in a regular lower-left/upper-right diagonal" - see emblem_for_index), each
# a SOLID shape with one or two fine rules cut through it (drawn fill=0 after
# the fill=255 shape, in the same pass) - "all as solid black shapes with a
# fine light rule or two", per the founder's list. Every one is deliberately
# plain: no device here depends on a stroke finer than _erule(r) to read,
# which is what makes them hold at EMBLEM_MIN_PX where a set word would not.
def _em_shield_chevron(dm, cx, cy, r):
    _epoly(dm, [(-0.75, 1.0), (0.75, 1.0), (0.75, -0.25), (0.0, -1.0), (-0.75, -0.25)], cx, cy, r)
    w = _erule(r) * 1.6
    _eline(dm, (-0.55, 0.55), (0.0, 0.05), cx, cy, r, fill=0, width=w)
    _eline(dm, (0.0, 0.05), (0.55, 0.55), cx, cy, r, fill=0, width=w)


def _em_oval_star(dm, cx, cy, r):
    _eellipse(dm, cx, cy, r, rx=0.95, ry=0.62, fill=255)
    _epoly(dm, _estar(5, 0.42, 0.18), cx, cy, r, fill=0)


def _em_crest_ribbon(dm, cx, cy, r):
    dm.pieslice([cx - 0.75 * r, cy - r, cx + 0.75 * r, cy - r + 1.5 * r], 180, 360, fill=255)
    _epoly(dm, [(-0.75, 0.5), (0.75, 0.5), (0.75, -0.05), (-0.75, -0.05)], cx, cy, r, fill=255)
    _eline(dm, (-0.75, 0.20), (0.75, 0.20), cx, cy, r, fill=0, width=_erule(r))
    _epoly(dm, [(-0.95, -0.35), (-0.95, -0.85), (0.0, -0.58)], cx, cy, r, fill=255)
    _epoly(dm, [(0.95, -0.35), (0.95, -0.85), (0.0, -0.58)], cx, cy, r, fill=255)


def _em_diamond(dm, cx, cy, r):
    _epoly(dm, [(0.0, 1.0), (0.85, 0.0), (0.0, -1.0), (-0.85, 0.0)], cx, cy, r, fill=255)
    _epoly(dm, [(0.0, 0.68), (0.55, 0.0), (0.0, -0.68), (-0.55, 0.0)], cx, cy, r, fill=0)
    _epoly(dm, [(0.0, 0.48), (0.38, 0.0), (0.0, -0.48), (-0.38, 0.0)], cx, cy, r, fill=255)


def _em_roundel(dm, cx, cy, r):
    _eellipse(dm, cx, cy, r, rx=0.95, ry=0.95, fill=255)
    _eellipse(dm, cx, cy, r, rx=0.72, ry=0.72, fill=0)
    _eellipse(dm, cx, cy, r, rx=0.40, ry=0.40, fill=255)


def _em_band_slash(dm, cx, cy, r):
    _epoly(dm, [(-1.0, 0.48), (1.0, 0.48), (1.0, -0.48), (-1.0, -0.48)], cx, cy, r, fill=255)
    _eline(dm, (-0.85, -0.7), (0.85, 0.7), cx, cy, r, fill=0, width=_erule(r) * 2.2)


def _em_crown(dm, cx, cy, r):
    _epoly(dm, [(-0.85, -0.75), (0.85, -0.75), (0.85, -0.30), (-0.85, -0.30)], cx, cy, r, fill=255)
    _epoly(dm, [(-0.85, -0.30), (-0.55, -0.30), (-0.70, 0.30)], cx, cy, r, fill=255)
    _epoly(dm, [(-0.20, -0.30), (0.20, -0.30), (0.0, 0.60)], cx, cy, r, fill=255)
    _epoly(dm, [(0.55, -0.30), (0.85, -0.30), (0.70, 0.30)], cx, cy, r, fill=255)
    _eline(dm, (-0.85, -0.52), (0.85, -0.52), cx, cy, r, fill=0, width=_erule(r))
    for nx in (-0.70, 0.0, 0.70):
        _eellipse(dm, cx + nx * r, cy + 0.60 * r, r * 0.09, fill=0)


def _em_laurel_dots(dm, cx, cy, r):
    n = 5
    for side in (-1, 1):
        for i in range(n):
            a = math.pi * (0.12 + 0.76 * i / (n - 1))
            x, y = side * math.sin(a), math.cos(a) - 0.05
            _eellipse(dm, cx + x * r * 0.88, cy - y * r * 0.88, r * 0.20, fill=255)
    _eellipse(dm, cx, cy - 0.05 * r, r * 0.34, fill=255)


def _em_bell(dm, cx, cy, r):
    dm.pieslice([cx - 0.62 * r, cy - r * 0.8, cx + 0.62 * r, cy + 0.5 * r], 180, 360, fill=255)
    _epoly(dm, [(-0.62, 0.10), (-0.9, 0.60), (0.9, 0.60), (0.62, 0.10)], cx, cy, r, fill=255)
    _eellipse(dm, cx, cy + 0.72 * r, r * 0.12, fill=255)
    _eellipse(dm, cx, cy - 0.95 * r, r * 0.10, fill=255)
    _eline(dm, (-0.9, 0.60), (0.9, 0.60), cx, cy, r, fill=0, width=_erule(r))


def _em_stag_head(dm, cx, cy, r):
    _epoly(dm, [(0.0, 0.55), (-0.32, 0.05), (-0.20, -0.55), (0.20, -0.55), (0.32, 0.05)], cx, cy, r, fill=255)
    w = _erule(r) * 1.6
    _eline(dm, (-0.18, 0.35), (-0.62, 0.95), cx, cy, r, fill=255, width=w)
    _eline(dm, (-0.62, 0.95), (-0.85, 0.72), cx, cy, r, fill=255, width=w * 0.9)
    _eline(dm, (-0.62, 0.95), (-0.40, 0.75), cx, cy, r, fill=255, width=w * 0.9)
    _eline(dm, (0.18, 0.35), (0.62, 0.95), cx, cy, r, fill=255, width=w)
    _eline(dm, (0.62, 0.95), (0.85, 0.72), cx, cy, r, fill=255, width=w * 0.9)
    _eline(dm, (0.62, 0.95), (0.40, 0.75), cx, cy, r, fill=255, width=w * 0.9)


def _em_ship(dm, cx, cy, r):
    _epoly(dm, [(-1.0, -0.35), (1.0, -0.35), (0.55, 0.05), (-0.55, 0.05)], cx, cy, r, fill=255)
    _eline(dm, (0.0, -0.05), (0.0, 0.95), cx, cy, r, fill=255, width=_erule(r) * 1.8)
    _epoly(dm, [(0.04, 0.90), (0.04, 0.0), (0.68, 0.30)], cx, cy, r, fill=255)
    _epoly(dm, [(-0.04, 0.65), (-0.04, 0.05), (-0.42, 0.22)], cx, cy, r, fill=255)


def _em_thistle_tree(dm, cx, cy, r):
    _epoly(dm, [(0.0, 1.0), (-0.55, 0.30), (0.55, 0.30)], cx, cy, r, fill=255)
    _epoly(dm, [(0.0, 0.55), (-0.68, -0.15), (0.68, -0.15)], cx, cy, r, fill=255)
    _epoly(dm, [(0.0, 0.10), (-0.8, -0.55), (0.8, -0.55)], cx, cy, r, fill=255)
    _epoly(dm, [(-0.14, -0.55), (0.14, -0.55), (0.14, -0.9), (-0.14, -0.9)], cx, cy, r, fill=255)
    _eline(dm, (-0.4, 0.05), (0.4, 0.05), cx, cy, r, fill=0, width=_erule(r))


def _em_horse(dm, cx, cy, r):
    _epoly(dm, [(-0.55, -0.85), (-0.55, -0.10), (-0.30, 0.30), (-0.42, 0.60),
                (-0.15, 0.95), (0.15, 0.70), (-0.02, 0.55), (0.35, 0.30),
                (0.60, 0.35), (0.55, 0.05), (0.30, -0.10), (0.30, -0.85)],
           cx, cy, r, fill=255)
    _eline(dm, (-0.30, 0.30), (0.05, 0.10), cx, cy, r, fill=0, width=_erule(r))


def _em_mountain(dm, cx, cy, r):
    _epoly(dm, [(-1.0, -0.6), (-0.35, 0.55), (0.05, -0.05), (0.35, 0.35), (1.0, -0.6)], cx, cy, r, fill=255)
    _eline(dm, (-0.50, 0.20), (-0.20, 0.20), cx, cy, r, fill=0, width=_erule(r))


def _em_sunburst(dm, cx, cy, r):
    n = 10
    for i in range(n):
        a0 = 2 * math.pi * i / n
        a1 = a0 + math.pi / n
        pts = [(0, 0),
               (0.95 * math.cos(a0), 0.95 * math.sin(a0)),
               (0.55 * math.cos(a0 + math.pi / (2 * n)), 0.55 * math.sin(a0 + math.pi / (2 * n))),
               (0.95 * math.cos(a1), 0.95 * math.sin(a1))]
        _epoly(dm, pts, cx, cy, r, fill=255)
    _eellipse(dm, cx, cy, r * 0.34, fill=255)


def _em_anchor(dm, cx, cy, r):
    w = _erule(r) * 2.4
    _eellipse(dm, cx, cy - 0.82 * r, r * 0.16, outline=255, width=w)
    _eline(dm, (0, 0.68), (0, -0.62), cx, cy, r, fill=255, width=w)
    _eline(dm, (-0.42, 0.28), (0.42, 0.28), cx, cy, r, fill=255, width=w)
    dm.arc([cx - 0.9 * r, cy - 0.25 * r, cx + 0.9 * r, cy + 1.15 * r], 15, 165, fill=255, width=max(1, int(round(w))))
    for sx in (-1, 1):
        _eline(dm, (sx * 0.85, 0.55), (sx * 0.58, 0.28), cx, cy, r, fill=255, width=w)


# EIGHT MORE DEVICES (critic's first fix, 2026-09-08: "make a device unique
# across the WHOLE visible shelf, not per row" - twenty body labels plus four
# neck labels need twenty-four devices, not sixteen; see EMBLEMS and
# emblem_for_index below). Same drawing vocabulary as the first sixteen: solid
# fill=255 shapes with fill=0 rule-cuts, nothing finer than _erule(r).
def _em_wheat_sheaf(dm, cx, cy, r):
    n = 5
    for i in range(n):
        t = (i - (n - 1) / 2) / ((n - 1) / 2)
        x_top = t * 0.75
        _eline(dm, (t * 0.18, -0.05), (x_top, 0.95), cx, cy, r, fill=255, width=_erule(r) * 1.5)
        _epoly(dm, [(x_top - 0.07, 0.90), (x_top + 0.07, 0.90), (x_top, 1.02)], cx, cy, r, fill=255)
    _epoly(dm, [(-0.35, -0.15), (0.35, -0.15), (0.30, -0.55), (-0.30, -0.55)], cx, cy, r, fill=255)
    _eline(dm, (-0.32, -0.30), (0.32, -0.30), cx, cy, r, fill=0, width=_erule(r))


def _em_fleur_de_lis(dm, cx, cy, r):
    _epoly(dm, [(0.0, 1.0), (-0.30, 0.55), (-0.15, 0.30), (-0.55, 0.10), (-0.60, -0.35),
                (-0.25, -0.15), (-0.22, -0.55), (0.0, -0.30), (0.22, -0.55), (0.25, -0.15),
                (0.60, -0.35), (0.55, 0.10), (0.15, 0.30), (0.30, 0.55)], cx, cy, r, fill=255)
    _epoly(dm, [(-0.45, -0.75), (0.45, -0.75), (0.32, -0.55), (-0.32, -0.55)], cx, cy, r, fill=255)
    _eline(dm, (-0.32, -0.65), (0.32, -0.65), cx, cy, r, fill=0, width=_erule(r))


def _em_key(dm, cx, cy, r):
    _eellipse(dm, cx, cy - 0.55 * r, r * 0.32, fill=255)
    _eellipse(dm, cx, cy - 0.55 * r, r * 0.14, fill=0)
    _eline(dm, (0.0, -0.30), (0.0, 0.75), cx, cy, r, fill=255, width=_erule(r) * 2.4)
    _epoly(dm, [(0.0, 0.75), (0.28, 0.75), (0.28, 0.92), (0.12, 0.92), (0.12, 1.0), (0.0, 1.0)],
           cx, cy, r, fill=255)
    _epoly(dm, [(0.0, 0.50), (0.22, 0.50), (0.22, 0.62), (0.0, 0.62)], cx, cy, r, fill=255)


def _em_grape_cluster(dm, cx, cy, r):
    _eline(dm, (0.0, 0.95), (0.0, 0.55), cx, cy, r, fill=255, width=_erule(r) * 1.6)
    _epoly(dm, [(0.0, 0.75), (-0.45, 0.55), (-0.05, 0.35)], cx, cy, r, fill=255)
    berries = [(0.0, 0.42, 0.17), (-0.20, 0.22, 0.17), (0.20, 0.22, 0.17),
               (-0.36, -0.02, 0.17), (0.0, -0.02, 0.17), (0.36, -0.02, 0.17),
               (-0.18, -0.26, 0.17), (0.18, -0.26, 0.17), (0.0, -0.50, 0.17)]
    for nx, ny, rad in berries:
        _eellipse(dm, cx + nx * r, cy - ny * r, r * rad, fill=255)


def _em_compass_star(dm, cx, cy, r):
    _epoly(dm, _estar(8, 0.95, 0.30, rot=-math.pi / 2), cx, cy, r, fill=255)
    _eellipse(dm, cx, cy, r * 0.16, fill=0)


def _em_arrow(dm, cx, cy, r):
    _epoly(dm, [(0.0, 1.0), (-0.5, 0.35), (-0.2, 0.35), (-0.2, -0.9),
                (0.2, -0.9), (0.2, 0.35), (0.5, 0.35)], cx, cy, r, fill=255)
    _eline(dm, (-0.2, -0.35), (0.2, -0.35), cx, cy, r, fill=0, width=_erule(r))


def _em_acorn(dm, cx, cy, r):
    _eellipse(dm, cx, cy + 0.15 * r, r * 0.62, rx=0.72, ry=0.85, fill=255)
    _epoly(dm, [(-0.62, -0.35), (0.62, -0.35), (0.55, -0.70), (0.0, -0.85), (-0.55, -0.70)],
           cx, cy, r, fill=255)
    _eline(dm, (0.0, -0.85), (0.0, -1.05), cx, cy, r, fill=255, width=_erule(r) * 1.6)
    for nx in (-0.35, 0.0, 0.35):
        _eline(dm, (nx, -0.35), (nx, -0.55), cx, cy, r, fill=0, width=max(1.0, _erule(r) * 0.8))


def _em_wave_band(dm, cx, cy, r):
    _epoly(dm, [(-1.0, 0.45), (1.0, 0.45), (1.0, -0.45), (-1.0, -0.45)], cx, cy, r, fill=255)
    for i in range(3):
        cxw = -0.66 + i * 0.66
        dm.arc([cx + (cxw - 0.36) * r, cy - 0.30 * r, cx + (cxw + 0.36) * r, cy + 0.30 * r],
               200, 340, fill=0, width=max(1, int(round(_erule(r) * 1.4))))
    _eline(dm, (-1.0, 0.0), (1.0, 0.0), cx, cy, r, fill=0, width=max(1.0, _erule(r) * 0.6))


# (name, draw_fn, border) - border marks the ones set inside a thin border
# matching the label's own shape (SHAPE_INSET/_emblem_border below); roughly
# half the library, alternating, so a shelf of them is not uniform either way.
EMBLEMS = [
    ("shield-and-chevron",      _em_shield_chevron,  True),
    ("oval-medallion-star",     _em_oval_star,        False),
    ("crest-and-ribbon",        _em_crest_ribbon,     True),
    ("diamond-lozenge",         _em_diamond,          False),
    ("double-ring-roundel",     _em_roundel,          True),
    ("band-and-slash",          _em_band_slash,       False),
    ("crown",                   _em_crown,            True),
    ("laurel-ring-of-dots",     _em_laurel_dots,       False),
    ("bell",                    _em_bell,             True),
    ("stag-head",               _em_stag_head,         False),
    ("sailing-ship",            _em_ship,              True),
    ("thistle-tree",            _em_thistle_tree,      False),
    ("horse",                   _em_horse,             True),
    ("mountain",                _em_mountain,          False),
    ("sunburst",                _em_sunburst,          True),
    ("anchor",                  _em_anchor,            False),
    ("wheat-sheaf",             _em_wheat_sheaf,       True),
    ("fleur-de-lis",            _em_fleur_de_lis,      False),
    ("key",                     _em_key,               True),
    ("grape-cluster",           _em_grape_cluster,     False),
    ("compass-star",            _em_compass_star,      True),
    ("arrow",                   _em_arrow,             False),
    ("acorn",                   _em_acorn,             True),
    ("wave-band",               _em_wave_band,         False),
]


def emblem_for_index(i: int):
    """The device for label INDEX i - the whole of "deterministic ... so
    neighbours differ": consecutive labels get consecutive library entries.

    UNIQUE ACROSS THE WHOLE SHELF, NOT JUST PER ROW (critic's first fix,
    2026-09-08). `i` here is the GLOBAL position `main()` enumerates labels in
    - all twenty body labels (eleven lower, nine upper) plus the four neck
    labels, twenty-four in total - not each row's own local index. The old
    16-entry library was longer than either row taken separately (11, 9) but
    SHORTER than the shelf taken together (24), so it wrapped once partway
    through the upper row and once more through the neck labels: devices 0-7
    each drawn twice, the second copy 123-261 px from the first, both inside
    the same crop. The library is now 24 long - exactly the current label
    count - so `i % len(EMBLEMS)` is `i` itself for every label on the shelf
    today and no device repeats anywhere; the modulo stays in place only so a
    future, longer shelf degrades to repeats instead of an index error."""
    return EMBLEMS[i % len(EMBLEMS)]


def _emblem_border(dm, shape, x0, y0, x1, y1, width):
    """A thin outline matching the label's own cut - rectangle, band (same as
    rectangle, a wrap has no distinct outline shape), oval, or shield - drawn
    OUTLINE ONLY so it never competes with the device centred inside it."""
    w = max(1, int(round(width)))
    if shape == "oval":
        dm.ellipse([x0, y0, x1, y1], outline=255, width=w)
    elif shape == "shield":
        cx, yb = (x0 + x1) / 2, y1
        ay = (y1 - y0) * 0.42
        dm.polygon([(x0, y0), (x1, y0), (x1, yb - ay), (cx, yb), (x0, yb - ay)],
                   outline=255, width=w)
    else:
        dm.rectangle([x0, y0, x1, y1], outline=255, width=w)


def emblem_texture(entry, index: int):
    """One label's device, in its own flat space at SS, the same shape and
    size as label_texture() returns for a name: (ink, alpha, note). `note` is
    (device_name, size_px, 1.0) - size_px in PLATE pixels, so the caller's
    report line reads the same for either mode."""
    w_px, h_px = float(entry["widthPx"]), float(entry["heightPx"])
    Wt, Ht = max(int(round(w_px * SS)), 8), max(int(round(h_px * SS)), 8)
    mask = Image.new("L", (Wt, Ht), 0)
    dm = ImageDraw.Draw(mask)

    side, top, bot = SHAPE_INSET.get(entry.get("shape", "rectangle"), SHAPE_INSET["rectangle"])
    x0, x1 = Wt * side, Wt * (1 - side)
    y0, y1 = Ht * top, Ht * (1 - bot)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    # fit to the SNAPPED PAPER's own shorter side (widthPx/heightPx), not the
    # shape-inset safe area - a tightly-snapped label (a neck) is starved
    # twice over if the device is sized off an already-inset box on top of
    # it. Still capped to the safe area/half-extents so it never overflows
    # past a border or a shape's own point.
    r = min(min(w_px, h_px) * SS * EMBLEM_FIT_FRAC / 2, (x1 - x0) / 2, (y1 - y0) / 2)

    name, fn, has_border = emblem_for_index(index)
    if has_border:
        _emblem_border(dm, entry.get("shape", "rectangle"), x0, y0, x1, y1,
                       max(1.0, min(Wt, Ht) * EMBLEM_BORDER_W_FRAC))
    fn(dm, cx, cy, r)

    arr = np.asarray(mask, np.float32)
    size_px = round(2 * r / SS, 1)
    return arr, arr / 255.0, (name, size_px, 1.0)


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
    """Connected components of the render's bright (WHITE-ground) paper, found
    ONCE for the whole plate and reused by every label's snap() below: a light
    blur (to bridge halftone/dither noise in the render) then a fixed paper
    threshold, labelled 4-connected so two labels' paper never merges through
    a touching corner."""
    blurred = plate_img.filter(ImageFilter.GaussianBlur(SNAP_BLUR_PX))
    bright = np.asarray(blurred, np.float32) > SNAP_THRESH
    comp_ids, _ = ndimage.label(bright)
    return comp_ids


def dark_paper_components(plate: np.ndarray) -> np.ndarray:
    """Connected components of the render's BLACK-ground paper, found ONCE for
    the whole plate. Unlike the white pass, a fixed darkness threshold is not
    enough: a black label's paper sits at roughly the same darkness as the
    dark glass, wood-grain shelf and shadow around it, so thresholding on
    darkness alone floods the whole search window into one blob spanning
    several bottles. What actually sets the paper apart is that it is a FLAT
    PRINT - near-uniform - where the glass/grain/shadow around it all carry
    local texture. So the mask requires darkness AND local uniformity (a
    small windowed local standard deviation staying under SNAP_DARK_STD_MAX)
    together; the per-candidate rectangular-fill test that separates a real
    label from a stray uniform sliver is left to snap_quad, since it needs
    each component's own bounding box."""
    mean = ndimage.uniform_filter(plate, size=SNAP_DARK_STD_WIN)
    sq_mean = ndimage.uniform_filter(plate * plate, size=SNAP_DARK_STD_WIN)
    local_var = np.clip(sq_mean - mean * mean, 0.0, None)
    local_std = np.sqrt(local_var)
    dark_uniform = (plate < SNAP_DARK_THRESH) & (local_std < SNAP_DARK_STD_MAX)
    comp_ids, _ = ndimage.label(dark_uniform)
    return comp_ids


def snap_quad(entry, bright_ids: np.ndarray, dark_ids: np.ndarray, PW: int, PH: int):
    """Find the blob of painted paper that best matches this label's
    construction quad, within a window = the quad's bounding box grown by
    SNAP_MARGIN_X sideways and SNAP_MARGIN_Y vertically.

    SNAPS BY GROUND (critic, 2026-09-08): a WHITE label searches `bright_ids`
    (the fixed-brightness blobs) exactly as before. A BLACK label searches
    `dark_ids` (dark + locally-uniform blobs, see dark_paper_components)
    and additionally demands each candidate be mostly rectangular - its area
    must cover at least SNAP_DARK_MIN_FILL of its own bounding box - since
    the darkness+uniformity mask alone can still pass a stray uniform sliver
    of shadow that a real label's solid rectangle would never be confused
    with.

    Picks, in order, from whichever candidate pool applies:
      1. the component with the largest overlap with the quad, provided that
         overlap covers at least SNAP_MIN_OVERLAP_FRAC of the quad's own area
         (the model painted roughly where it was told, just offset/resized);
      2. failing that, the largest blob in the window whose height is >=
         SNAP_MIN_HEIGHT_FRAC of the quad's height and whose width falls
         within SNAP_WIDTH_RANGE of the quad's width (the model drew the
         label somewhere else in the window entirely).

    Returns None if neither candidate exists (caller skips the label rather
    than drawing on the construction quad). Otherwise returns a dict with the
    new quad (axis-aligned, clockwise from top-left, inset SNAP_SHRINK per
    side as a paper margin), its widthPx/heightPx, the raw (pre-shrink) blob
    box, and which rule fired.
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

    is_black = entry.get("ground") == "black"
    comp_ids = dark_ids if is_black else bright_ids
    require_fill = is_black

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

        if require_fill and area / (cw * ch) < SNAP_DARK_MIN_FILL:
            continue    # not rectangular enough to be a real label's paper

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


SHEET_GROUND_V = 238             # the sheet's own light background
SHEET_INK_DARK_V = 28            # "black ink" for the white-ground rows below


def render_emblem_sheet(path: str) -> None:
    """Every device in EMBLEMS, at 60 px and at 28 px, on white ground and
    inverted on black - S/emblems-sheet.png. One flat sheet, not a render:
    this is a look at the LIBRARY, not at any one bottle's label.

    BOTH GROUNDS GO THROUGH A MASK (critic's second fix, 2026-09-08). Every
    _em_* function and _emblem_border is a MASK-PAINTER - fill=255 for the
    device, fill=0 for its rule-cuts, meant to be composited through, exactly
    as emblem_texture() above uses them for a real label. The black-ground
    branch already did that (paint a mask, then `sheet.paste(238, ..., mask)`
    to lay light ink over the dark rectangle already on the sheet); the
    white-ground branch instead called fn()/`_emblem_border()` STRAIGHT onto
    the sheet's own ImageDraw, so the device's fill=255 painted white-ON-a-
    238-BACKGROUND - almost the same tone as the paper itself. Result: 0.0-6.1%
    black ink at 60 px, 0.0-1.5% at 28 px, eight of sixteen devices at exactly
    0.0%. Mirrored here: build the mask, then paste DARK ink through it, the
    white-ground row's own equivalent of the black row's light-through-mask."""
    cell, pad, label_h = 130, 18, 34
    cols = len(EMBLEMS)
    rows_spec = [(60, "white"), (60, "black"), (28, "white"), (28, "black")]
    W = cols * cell + pad
    H = len(rows_spec) * (cell + label_h) + pad
    sheet = Image.new("L", (W, H), SHEET_GROUND_V)
    d = ImageDraw.Draw(sheet)
    try:
        cap_font = _font(FONT, 13)
    except Exception:
        cap_font = ImageFont.load_default()
    for ri, (size, ground) in enumerate(rows_spec):
        y0 = pad + ri * (cell + label_h)
        d.text((6, y0), f"{size} px, {ground}", fill=40, font=cap_font)
        for ci, (name, fn, has_border) in enumerate(EMBLEMS):
            x0 = ci * cell
            cx, cy = x0 + cell / 2, y0 + label_h + cell / 2
            r = size / 2 * EMBLEM_FIT_FRAC
            mask = Image.new("L", (W, H), 0)
            dm = ImageDraw.Draw(mask)
            if has_border:
                _emblem_border(dm, "rectangle", x0 + 10, y0 + label_h + 10,
                               x0 + cell - 10, y0 + label_h + cell - 10, 2.0)
            fn(dm, cx, cy, r)
            if ground == "black":
                d.rectangle([x0 + 6, y0 + label_h, x0 + cell - 6, y0 + label_h + cell - 6], fill=42)
                sheet.paste(SHEET_GROUND_V, (0, 0), mask)     # light device on dark paper
            else:
                sheet.paste(SHEET_INK_DARK_V, (0, 0), mask)   # dark device on light paper
    Image.fromarray(np.asarray(sheet)).save(path)
    print(f"{path}: {len(EMBLEMS)} devices x {len(rows_spec)} size/ground combinations")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("plate_in", nargs="?")
    ap.add_argument("out", nargs="?")
    ap.add_argument("--labels", default=str(ROOT / "canon/room-kit/v2/labels.json"))
    ap.add_argument("--font", default=FONT)
    ap.add_argument("--mode", default="emblems", choices=("emblems", "names"),
                    help="emblems (default): one bold device per label, no words at all. "
                         "names: the old lettered pipeline (house brand, short form, monogram)")
    ap.add_argument("--brand-key", default="brand", choices=("brand", "brandForKind"),
                    help="--mode names only: which of the two names labels.json carries to set")
    ap.add_argument("--no-snap", action="store_true",
                    help="typeset onto the construction quad as-is; skip snapping to the painted paper")
    ap.add_argument("--emblem-sheet", default=None,
                    help="write every device in the library at 60/28 px, white/black ground, to this "
                         "path and exit - ignores plate_in/out/labels entirely")
    a = ap.parse_args()

    if a.emblem_sheet:
        render_emblem_sheet(a.emblem_sheet)
        return
    if not a.plate_in or not a.out:
        ap.error("plate_in and out are required unless --emblem-sheet is given")

    data = json.loads(Path(a.labels).read_text(encoding="utf8"))
    labels = data["labels"]

    base = Image.open(a.plate_in).convert("L")
    PW, PH = base.size
    plate = np.asarray(base, np.float32)
    out = plate.copy()

    bright_ids = None if a.no_snap else bright_paper_components(base)
    dark_ids = None if a.no_snap else dark_paper_components(plate)

    def skip(entry, tag, category, reason):
        print(f'  {entry["row"]:5s}{entry["index"]:3d}  {tag:25s}  brand={entry.get("brand", ""):22s} '
              f'SKIPPED: {reason}')
        skipped_reasons[category] = skipped_reasons.get(category, 0) + 1

    named = short_n = mono = 0
    device_counts: dict = {}
    snapped_n = skipped_n = 0
    skipped_reasons: dict = {}
    size_floor = CAP_MIN_PX if a.mode == "names" else EMBLEM_MIN_PX
    worst = (1e9, "")
    for idx, entry in enumerate(labels):
        entry = dict(entry, brand=entry.get(a.brand_key, entry.get("brand", "")))
        tag = entry["brand"] if a.mode == "names" else entry["kind"]

        if bright_ids is not None:
            ox0, oy0, ox1, oy1 = quad_bbox(entry["quad"])
            snap = snap_quad(entry, bright_ids, dark_ids, PW, PH)
            if snap is None:
                # NO PAPER FOUND - do NOT draw on the construction quad (that
                # is exactly the stray box the fix removes): skip the label
                # entirely instead.
                skipped_n += 1
                skip(entry, tag, "no-paper", f'no acceptable paper found near '
                                  f'orig=({ox0:.1f},{oy0:.1f})-({ox1:.1f},{oy1:.1f})')
                continue
            shorter = min(snap["widthPx"], snap["heightPx"])
            if shorter < SNAP_MIN_SHORT_PX:
                skipped_n += 1
                skip(entry, tag, "paper-too-small", f'snapped paper too small: shorter side {shorter:.1f}px '
                                  f'< {SNAP_MIN_SHORT_PX:.0f}')
                continue
            snapped_n += 1
            sx0, sy0, sx1, sy1 = quad_bbox(snap["quad"])
            dx = (sx0 + sx1) / 2 - (ox0 + ox1) / 2
            dy = (sy0 + sy1) / 2 - (oy0 + oy1) / 2
            print(f'  {entry["row"]:5s}{entry["index"]:3d}  {tag:25s}  snap[{snap["rule"]}]  '
                  f'orig=({ox0:.1f},{oy0:.1f})-({ox1:.1f},{oy1:.1f})  '
                  f'snapped=({sx0:.1f},{sy0:.1f})-({sx1:.1f},{sy1:.1f})  '
                  f'dx={dx:+.1f} dy={dy:+.1f}')
            entry["quad"] = snap["quad"]
            entry["widthPx"] = snap["widthPx"]
            entry["heightPx"] = snap["heightPx"]

        quad = entry["quad"]
        if a.mode == "names":
            ink_tex, alpha_tex, (mode, cap, sq) = label_texture(entry, a.font)
        else:
            ink_tex, alpha_tex, (mode, cap, sq) = emblem_texture(entry, idx)
            if cap < EMBLEM_MIN_DEVICE_PX:
                # the device this label's own (snapped) paper allows would be
                # unreadable - skip rather than stamp a speck (critic,
                # 2026-09-08: "neck devices come out 2.8-5.3 px").
                skipped_n += 1
                skip(entry, tag, "device-too-small", f'device would be {cap:.1f}px < {EMBLEM_MIN_DEVICE_PX:.0f}')
                continue

        if a.mode == "names":
            named += mode == "name"
            short_n += mode == "short"
            mono += mode == "monogram"
        else:
            device_counts[mode] = device_counts.get(mode, 0) + 1
        if cap < worst[0]:
            worst = (cap, f'{entry["row"]} {entry["index"]} {tag}/{mode}')
        Ht, Wt = ink_tex.shape

        ground = ground_tone(plate, quad)
        # BLACK-LABEL BOTTLES INVERT (founder): the device sits LIGHT on a
        # dark paper instead of dark on a light one. Prefer the exported
        # `ground` field (set once, in draw-room-lines.py, from the same
        # decision that painted the label dark or light); fall back to the
        # sampled tone for anything that predates that field.
        is_black = (entry["ground"] == "black") if "ground" in entry else (ground < 128.0)
        if is_black:
            ink_v = min(max(ground + (255.0 - ground) * INK_K_INV, INK_MIN_INV), INK_MAX_INV)
        else:
            ink_v = min(max(ground * INK_K, INK_MIN), INK_MAX)
        layer = ink_v * (ink_tex / 255.0)

        cf = coeffs(quad, [(0, 0), (Wt, 0), (Wt, Ht), (0, Ht)])
        warp = lambda arr, resample=Image.BICUBIC: np.asarray(
            Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
                 .transform((PW, PH), Image.PERSPECTIVE, cf, resample, fillcolor=0),
            np.float32)
        L = warp(layer)
        A = np.clip(warp(alpha_tex * 255.0) / 255.0, 0, 1)
        out = out * (1 - A) + L * A
        size_word = "cap" if a.mode == "names" else "size"
        print(f'  {entry["row"]:5s}{entry["index"]:3d}  {entry["shape"]:9s} '
              f'{entry["widthPx"]:5.1f}x{entry["heightPx"]:4.1f} px  {mode:22s} '
              f'{size_word} {cap:4.1f} px  ink {ink_v:3.0f} on {ground:3.0f} '
              f'({"black" if is_black else "white"})  {tag}')

    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(a.out)
    if a.mode == "names":
        print(f'{a.out}: {named} names set, {short_n} short forms, {mono} monograms, '
              f'from {len(labels)} labels in {a.labels}')
    else:
        counts_str = ", ".join(f'{k}={v}' for k, v in sorted(device_counts.items()))
        print(f'{a.out}: {len(labels)} labels in {a.labels} set with emblems - {counts_str}')
    if bright_ids is not None:
        reasons_str = ", ".join(f'{k}={v}' for k, v in sorted(skipped_reasons.items()))
        print(f'snapped {snapped_n}/{len(labels)} labels to painted paper, '
              f'skipped {skipped_n}/{len(labels)}' + (f' ({reasons_str})' if reasons_str else ''))
    size_word = "cap height" if a.mode == "names" else "device size"
    print(f'smallest {size_word} {worst[0]:.1f} px (floor {size_floor:.0f})  on {worst[1]}')


if __name__ == "__main__":
    main()
