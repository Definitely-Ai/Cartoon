"""ABBY'S EYE, DRAWN BY HAND - Step 5 of the look card, and it had been skipped.

reports/2026-09-05/CAST-LOOK-CARDS.md section 1: "Her corrected eye must be
HAND-BUILT once from the section 2 table and become her permanent paste source
(Step 5), not copied from any existing picture." Every tile in the set carries
the failing eye instead - measured on the card, abby-face-reference.jpg is 87.6%
and 83.5% of each opening below luminance 60; canon/vision/studies/abby.png is
52.3% / 39.7% with no white at either side of the iris. A correct eye can never
arrive from a reference that does not contain one, at any seed.

So this file DRAWS it, from the section 2 wording and nothing else:

    a wide almond WIDER THAN IT IS TALL, tilted up at the outer corner; a clear
    WHITE OF THE EYE showing AT EACH SIDE of the iris; a drawn IRIS circle,
    mid-tone, with fine radiating lines inside it; a distinct round PUPIL at the
    iris centre, SMALLER than the iris and never filling it; EXACTLY ONE small
    white catchlight high on the iris; and a defined upper lid with a heavy lash
    line above it sweeping up and out at the corner, a soft lower lid below. Two
    or three fine strokes in a shallow arch above each eye carry the beat.

One eye is built in a 512x512 cell and MIRRORED for the pair, so both eyes are
the same size, the same shape and at the same height by construction. Everything
is line work - the iris mid-tone is made of radiating strokes, not a grey wash -
so the tile is already in the house's engraved pen. NO LETTERING ANYWHERE on the
tile: a label would be copied into the picture as pseudo-text.

Drawn at 3x and downsampled for the anti-aliasing the engraving needs.
"""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path("C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/"
           "7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/abby/round-3/"
           "abby-eye-tile.png")

S = 3                       # supersample
W, H = 1024, 470            # the pair, at the resolution the bridge accepts unresized
CELL = 512                  # one eye is built in a 512x512 cell, per the look card

PAPER = 255
INK = 18
LID = 24
LASH = 30
IRIS_LINE = 62
LIMBAL = 48
IRIS_GROUND = 228
PUPIL = 8
FUR = 150

# --- one eye, in cell coordinates, outer corner to the RIGHT ----------------
IN_CORNER = (-175.0, 14.0)
OUT_CORNER = (175.0, -26.0)
H_UP = 96.0                 # how far the upper lid arches above the corner line
H_DN = 72.0                 # how far the lower lid falls below it
IRIS_C = (8.0, -18.0)
IRIS_R = 80.0
PUPIL_R = 30.0
CATCH_C = (-26.0, -32.0)    # relative to the iris centre: HIGH on the iris
CATCH_R = 15.0


def lid_points(up: bool, n: int = 96) -> list[tuple[float, float]]:
    """The almond. Both lids run inner corner -> outer corner so the two curves
    close into one opening; the upper is the deeper and more sharply peaked."""
    pts = []
    for i in range(n + 1):
        t = i / n
        x = IN_CORNER[0] + (OUT_CORNER[0] - IN_CORNER[0]) * t
        y = IN_CORNER[1] + (OUT_CORNER[1] - IN_CORNER[1]) * t
        bow = math.sin(math.pi * t)
        if up:
            y -= H_UP * bow ** 0.82          # peak pulled toward the inner half
        else:
            y += H_DN * bow ** 1.15          # the lower lid is the shallower curve
        pts.append((x, y))
    return pts


def place(pts, cx, cy, sign):
    return [((cx + sign * x) * S, (cy + y) * S) for x, y in pts]


def draw_eye(canvas: Image.Image, cx: float, cy: float, sign: int) -> None:
    """sign=+1 draws the outer corner to the right; sign=-1 is the mirror."""
    up = lid_points(True)
    dn = lid_points(False)
    opening = place(up, cx, cy, sign) + place(list(reversed(dn)), cx, cy, sign)

    # 1. THE OPENING IS PAPER. Paper-white at BOTH sides of the iris is the whole
    #    point of the tile, so the sclera is the untouched ground, not a light grey.
    mask = Image.new("L", canvas.size, 0)
    ImageDraw.Draw(mask).polygon(opening, fill=255)
    canvas.paste(Image.new("L", canvas.size, PAPER), (0, 0), mask)

    # 2. THE IRIS, on its own layer, clipped to the opening so the lids cut it.
    iris = Image.new("L", canvas.size, PAPER)
    di = ImageDraw.Draw(iris)
    icx = (cx + sign * IRIS_C[0]) * S
    icy = (cy + IRIS_C[1]) * S
    r = IRIS_R * S
    di.ellipse([icx - r, icy - r, icx + r, icy + r], fill=IRIS_GROUND)
    for k in range(72):                      # the mid-tone is MADE OF LINES
        a = 2 * math.pi * k / 72 + 0.031
        r0, r1 = PUPIL_R * S + 2 * S, r - 2 * S
        di.line([(icx + r0 * math.cos(a), icy + r0 * math.sin(a)),
                 (icx + r1 * math.cos(a), icy + r1 * math.sin(a))],
                fill=IRIS_LINE, width=max(1, round(0.9 * S)))
    di.ellipse([icx - r, icy - r, icx + r, icy + r], outline=LIMBAL, width=round(2.2 * S))
    pr = PUPIL_R * S                          # the pupil: round, dark, SMALLER than the iris
    di.ellipse([icx - pr, icy - pr, icx + pr, icy + pr], fill=PUPIL)
    ccx = icx + sign * CATCH_C[0] * S
    ccy = icy + CATCH_C[1] * S
    cr = CATCH_R * S                          # EXACTLY ONE catchlight, high on the iris
    di.ellipse([ccx - cr, ccy - cr, ccx + cr, ccy + cr], fill=PAPER)
    canvas.paste(iris, (0, 0), mask)

    d = ImageDraw.Draw(canvas)

    # 3. THE LIDS. Upper heavy and defined, lower soft.
    d.line(place(up, cx, cy, sign), fill=LID, width=round(3.6 * S), joint="curve")
    d.line(place(dn, cx, cy, sign), fill=LID + 40, width=round(1.9 * S), joint="curve")

    # 4. THE LASH LINE, sweeping UP AND OUT at the outer corner.
    for i in range(6):
        t = 0.60 + 0.075 * i
        bx = IN_CORNER[0] + (OUT_CORNER[0] - IN_CORNER[0]) * t
        by = IN_CORNER[1] + (OUT_CORNER[1] - IN_CORNER[1]) * t - H_UP * math.sin(math.pi * t) ** 0.82
        L = 30 + 7 * i
        ang = math.radians(-34 + 5 * i)
        d.line([( (cx + sign * bx) * S, (cy + by) * S ),
                ( (cx + sign * (bx + L * math.cos(ang))) * S, (cy + by + L * math.sin(ang)) * S )],
               fill=LASH, width=round(1.5 * S))

    # 5. THE BROW: two or three fine strokes in a SHALLOW arch, no heavier than
    #    the lash line, clearly separate from the coat.
    for j, (dy, span, wdt) in enumerate(((-186, 150, 1.3), (-202, 128, 1.1), (-218, 96, 1.0))):
        arc = []
        for i in range(41):
            t = i / 40
            x = -span + 2 * span * t
            y = dy - 16 * math.sin(math.pi * t) - 26 * t
            arc.append((x + 18, y))
        d.line(place(arc, cx, cy, sign), fill=FUR - 20, width=round(wdt * S), joint="curve")

    # 6. A few short fur strokes seat the eye in a face instead of floating it.
    for i in range(26):
        t = i / 25
        x = IN_CORNER[0] + (OUT_CORNER[0] - IN_CORNER[0]) * t
        y = IN_CORNER[1] + (OUT_CORNER[1] - IN_CORNER[1]) * t + H_DN * math.sin(math.pi * t) ** 1.15
        d.line([((cx + sign * x) * S, (cy + y + 14) * S),
                ((cx + sign * (x + 6)) * S, (cy + y + 34) * S)], fill=FUR, width=max(1, S))


def main() -> None:
    canvas = Image.new("L", (W * S, H * S), PAPER)
    cy = H / 2 + 26
    draw_eye(canvas, 268, cy, -1)      # her right eye: outer corner to the LEFT
    draw_eye(canvas, 756, cy, +1)      # her left eye: the same eye, mirrored
    out = canvas.resize((W, H), Image.LANCZOS)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT)
    print(f"{OUT}  {out.size}  cell={CELL}")


if __name__ == "__main__":
    main()
