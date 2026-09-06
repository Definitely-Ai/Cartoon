"""Draw the room's construction — in code, from real dimensions.

The model renders material well and reasons about joinery badly: asked for a
panelled wall it returns unequal bays, random stile widths and grain running
across the rails. So the geometry is never asked for. It is built here, in
metres, and projected through one honest camera. Equal bays, one stile width,
true horizontals and a real vanishing point are then facts, not hopes.

Two images come out. Neither is art; both are conditioning inputs.

  00-lines.png    the construction: every edge and every joint
  01-values.png   the same room with every surface carrying the TONE it should
                  hold under the room's light

Rendering against 01-values.png is what holds the lighting steady across parts:
a part cannot invent its own light when the value it must hit is already in its
input. It is also the one place to edit if the room's lighting should change.

Two rules learned the hard way:
  - NO GUIDE LINES. An eye-level guide drawn faintly for a human to read came
    straight through a render as a hard black line across the picture.
  - VALUES ARE GRADED, NOT FLAT. Flat blocks of grey produce flat renders and
    let the model mistake a counter top for a floor. Mouldings need a lit band
    and a shadow band; walls need to fall off; a surface needs to say which way
    it faces.

    python scripts/draw-room-lines.py [--out canon/room-kit/v2]
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

# ----------------------------------------------------------------- the frame
import os
W, H = 1200, int(os.environ.get("ROOM_H", "1800"))   # ROOM_H=2100 draws extra rows BELOW the
                                                       # frame - same camera - so a part the frame
                                                       # cuts off can be rendered whole

# ------------------------------------------------------- the room, in metres
# A real bar, measured. Change a number here and the drawing follows; this is
# the whole point of building the geometry instead of prompting for it.
CEILING = 3.95          # floor to ceiling. A tall room: the wall wants height
                        # above the panelling for the crown to sit on.
COUNTER_H = 1.07        # a 42-inch bar top
COUNTER_DEPTH = 0.62    # front to back
DADO_H = 0.92           # dado rail height
SKIRT_H = 0.14          # skirting
CORNICE_H = 0.32        # the crown, floor-to-ceiling depth of the whole profile
FRIEZE_RAIL = 2.45      # the upper rail. The panelling runs ALL THE WAY to the
                        # cornice (founder's ruling), and full-height panelling
                        # has to be TIERED or the main panels become 2.6 m doors.
                        # Three tiers, and every rail runs unbroken around both
                        # walls: skirting -> dado 0.92 -> frieze rail 2.45 -> crown.
BAY_W = 0.86            # one panel bay. Narrow bays make tall thin panels,
                        # and a tall thin panel is what the model turns into
                        # reeding. Wide boards read as boards.
STILE_W = 0.075         # every stile the same
MOULD_W = 0.028         # panel surround

WALL_Z = 4.00           # the back wall's distance
COUNTER_NEAR_Z = 1.146   # the counter's near edge
COUNTER_FAR_Z = COUNTER_NEAR_Z + COUNTER_DEPTH
RETURN_X = -0.80        # the window wall, to the left
RETURN_NEAR_Z = 0.30    # how far toward the camera the return is drawn (off-frame)

ARCHITRAVE = 0.13       # the frame round the opening, on the room face
PROUD = 0.035           # how far it stands off the panelling
WINDOW_SILL = COUNTER_H + 0.005   # the sash rail SITS ON the marble: one pane from bar level to the crown, one clean line (founder, 2026-09-05)
                        # counter runs under the sill instead of cutting across
                        # the bottom of the glass
WINDOW_HEAD = CEILING - CORNICE_H - ARCHITRAVE   # the glass runs up to the crown
                        # with exactly the architrave between them - the frame
                        # used to run straight INTO the cornice
TRANSOM = FRIEZE_RAIL   # and is divided by a transom at the SAME height as the
                        # frieze rail on the back wall. Every opening lines up
                        # with a rail: sill on the dado, transom on the frieze
                        # rail, head on the cornice.
WINDOW_Z0, WINDOW_Z1 = 1.62, 3.62   # how far along the return the glass runs;
                                    # wall must remain at BOTH ends or the
                                    # opening swells to fill the return and
                                    # stops reading as a window
REVEAL = 0.13           # the wall's thickness at the opening
SASH = 0.065            # the sash frame that actually holds the glass, set into
                        # the reveal. An opening with only an architrave on the
                        # room face is a hole with a picture-frame round it; the
                        # sash, stepped back from it, is what reads as a window.

# ------------------------------------------------------------- the fixtures
# All of it measured, like the joinery. The TV and the chalkboard are drawn
# BLANK on purpose: the joke decides what is on them, and the pipeline pastes
# into the quads this script measures and writes out.
# THE BACK BAR is a built unit, not two boards on brackets: side cheeks, a
# central upright, two shelves housed into them, a top rail. It sits under the
# set and the board on the same bays. The lower shelf is below the eye (its
# top shows, bottles stand on it); the upper is just above (its underside
# shows, and its front edge hides the bottles' feet).
BACKBAR_X = (RETURN_X, 2.16)     # the ledge runs all the way into the window wall (founder, 2026-09-05)
# The founder's reference (2026-09-04): two bottle shelves ABOVE a marble-edged
# working LEDGE where the drinks are made, the back of it flush into the unit,
# and CABINETS beneath the ledge down to a plinth. The carcass stands on the
# ledge; its top rail meets the frieze rail under the set.
LEDGE_H = 1.00                  # the working ledge, a little under the bar top
LEDGE_DEPTH = 0.45              # deeper than the shelves: a counter, not a shelf
LEDGE_LIP = 0.04                # a thin slab edge, like the main bar's
CABINET_DOORS = 6               # two per section, so the door joints meet the uprights above
PLINTH_H = 0.10
# --------------------------------------------------- C3-SLAB: the shelf unit
# The ledge and the cabinets are APPROVED and keep BACKBAR_X. The shelf unit
# above them is a SEPARATE build with its OWN extent, because BACKBAR_X[1] =
# 2.16 m projects to px 1386 - a hundred and eighty px outside a 1200 px frame -
# so no unit built on it can ever show a right-hand end. That missing end is
# what the founder saw as "one of the dividers on the right side of the shelf
# is gone" (2026-09-05). The unit STOPS at 1.55 m, px 1133, and the marble
# ledge runs on past it out of frame, which is how a real back bar reads: a
# shelf unit standing on a longer counter.
SHELF_X = (-0.43, 1.55)         # the SHELF UNIT's own extent, not the ledge's.
                                # left cheek  px 435.8..473.4, and 46 px of clean
                                #   lit panel field between it and the corner
                                #   stile's lit edge at px 389.4
                                # right cheek px 1085.1..1132.6, INSIDE the frame,
                                #   its cast shadow ending at px 1147 with 40 px
                                #   of clean wall before the stile at world 1.78
DIVIDER_X = 0.56                # the one divider, placed by PROJECTED clearance:
                                # it clears the stile at world 0.06 by 97 px and
                                # the stile at world 0.92 by 62 px, and it falls
                                # on the unit's centre, so the two bays come out
                                # as equal 0.81 m openings
CHEEK_W = 0.12                  # 12 cm posts: 38, 42 and 47 px of front face on
                                # the page. 4.5 cm was 15 px - a line, not a
                                # member - and 15 px of tone beside a 45 px stile
                                # is what "they look like they are a part of the
                                # wall" means
SHELF_T = 0.085                 # a HEAVY slab: 8.5 cm of solid walnut on edge,
                                # 29-31 px of front edge, so the lit arris, the
                                # board and the undercut are all members and not
                                # one of them is a hairline (round-2 critics)
SHELF_DEPTH = 0.35              # deep enough that the two posts away from the
                                # camera axis turn a 18.7 px and a 38.8 px side
                                # face. The right cheek stands 0.10 m off the
                                # camera axis and turns 2.9 px, which is edge-on:
                                # see SIDE_MIN_PX
SHELF_YS = (1.48, 2.00)         # top of each slab. Two compartments of 0.395 and
                                # 0.435 m clear - both take a 0.35 m bottle
                                # standing up, which is the tallest this script
                                # draws (the round-2 critics asked for 0.33 m)
UNIT_TOP = SHELF_YS[1] + 0.11   # THE HEAD. The posts run 11 cm - 36 px - PAST
                                # the upper slab and stop there, so the top of
                                # the unit is three solid post heads with the
                                # wall's own panelling between them. Stopping
                                # the posts flush with the slab left the head as
                                # a board, an arris and an undercut piled on a
                                # top edge: four thin horizontals and nothing
                                # solid, which is the hairline stack the round-2
                                # critics called out. Still OPEN ABOVE: no top
                                # rail, no cornice, and the panelling runs on
                                # from the post heads to the frieze rail
BACKBAR_Y = (LEDGE_H, UNIT_TOP)
# A post is FOUR strips across its 12 cm face, not one flat tone: (width, top
# value, bottom value). The two bright strips are 26 of the 47 px of the right
# cheek and they sit at 158-220 against a wall that reads 137-144 behind it, so
# the cheek is a LIT MEMBER standing in front of the opening it frames rather
# than a dark stripe that reads as the edge of a recess (round-2 critics).
POST_STRIPS = ((0.030, 220, 208),      # the lit arris down the window side
               (0.045, 190, 158),      # the face, still catching the window
               (0.021, 136, 102),      # turning away
               (0.024,  34,  24))      # the shadowed arris down the other side
POST_ARRIS = POST_STRIPS[0][0]
POST_DARK = POST_STRIPS[-1][0]
SLAB_ARRIS = 0.032              # the lit arris on a slab front edge: 11 px at 198+
SLAB_UNDER = 0.014              # the dark undercut beneath it
POST_SHADOW = 0.05              # what a post throws on the wall beside it
SLAB_SHADOW = 0.16              # and a slab beneath it: 50 px, MULTIPLIED, so
                                # the panelling still modulates through it
SLAB_CORE = 0.03                # the hard core of that shadow, at the contact
SHADOW_GAP = 0.009              # 3 px of clearance between a member's edge and
                                # the first row of the shadow it throws. PIL
                                # rasterises a polygon inclusively, so a shadow
                                # that starts on the member's own edge shares
                                # 1-2 px with its mask - and the assembler would
                                # multiply the member's render by its own
                                # shadow along that seam. The member's 2 px
                                # stop-line sits in the gap, so nothing shows
SIDE_MIN_PX = 10.0              # a side face narrower than this is edge-on: it
                                # is merged into the arris it stands on instead
                                # of being drawn as a plane of its own, which is
                                # what a collapsed sliver looks like
BOTTLE_PITCH = 0.152
# Both hang in the TOP tier and both respect the bays: the set is centred on
# the first two bays with an even margin to the stiles either side, the board
# is centred in the third. Straddling a stile at random was what made them look
# stuck on rather than hung.
TV_X, TV_Y = (-0.66, 0.78), (2.61, 3.45)     # 1.44 x 0.84 - a 16:9 set
TV_DEPTH = 0.035        # a flat panel, flush to the wall
BOARD_X, BOARD_Y = (1.03, 1.67), (2.63, 3.43)
BOARD_DEPTH = 0.03
# The sconces: (backplate point, shade centre, on the return wall?). Kept as data
# because the LIGHT FIELD below reads the same positions the lamps are drawn at.
SCONCES = (("sconce-left", (-0.80 + 0.005, 2.92, 3.875), (-0.80 + 0.19, 2.90, 3.875), True),
           ("sconce-right", (1.84, 2.92, 4.00 - 0.005), (1.84, 2.90, 4.00 - 0.18), False))   # in from the frame's edge at 14 deg
STOOL_XS = (0.52, 1.22)
STOOL_TURN = (-0.30, 0.30)      # each chair turned ~17 deg toward the other: the cast sit facing in         # where Drew and Barclay sit: frame-left, frame-right
                                # (0.38 put the left chair's edge off the frame)
STOOL_Z = 0.86
SEAT_H = 0.76

# ------------------------------------------------------------------ the camera
# Where the artist is standing and what they are pointing at. The corner where
# the window wall meets the back wall is at x = RETURN_X; aiming just to the
# RIGHT of it means LOOK_AT_X a little greater than RETURN_X.
EYE = 1.700              # a standing person's eye (2026-09-04). At 2.05 the
                        # camera looked DOWN into the chairs and every back read
                        # as a bucket; from here the backs are seen side-on.
CAM_X = 1.33            # a foot further right (2026-09-04)            # how far right of the room's centre the artist stands
CAM_Z = -0.70           # closer (founder, 2026-09-04: 'pan up a little closer')
                        # the bar, which is what makes room for the chairs and the
                        # cast in front of the counter
# 2026-09-04, from the founder's reference plates: the camera stands to the RIGHT
# of the room and looks NEARLY straight at the back bar, turned only a few
# degrees toward the window. So the back wall is close to square - the set and
# the board read as clean rectangles - while the window wall is seen steeply
# from the side. "Off to the side slightly", in his words. Not the two-point
# view aimed at the corner, and not dead frontal either: dead frontal lost the
# window wall, which is why it was rejected.
LOOK_AT_X = -0.018      # sixteen degrees toward the window (founder, 2026-09-05: the sign bigger)
F = 1555.7              # focal length in pixels
CX, CY = 600.0, 784.8   # principal point: tilted up so the legs leave the frame

import math
_YAW = math.atan2(LOOK_AT_X - CAM_X, WALL_Z - CAM_Z)   # pan; zero keeps the wall square


def P(x: float, y: float, z: float) -> tuple[float, float]:
    """World metres to page pixels, through a camera that can stand anywhere and
    look anywhere. Moving the artist right pushes the corner left; panning back
    toward the corner brings it in again, and the two together are what changes
    how obliquely the back wall is seen."""
    dx, dz = x - CAM_X, max(z - CAM_Z, 0.05)
    c, sn = math.cos(_YAW), math.sin(_YAW)
    xc = dx * c - dz * sn
    zc = max(dx * sn + dz * c, 0.05)
    return CX + F * xc / zc, CY - F * (y - EYE) / zc


_JIT = np.random.RandomState(20260904)


def hand(d, a, b, width: int = 2, fill: int = 0) -> None:
    """One line, drawn by a hand instead of a plotter.

    Ruled edges are the loudest tell that a picture was made by a machine, and
    the model faithfully reproduces whatever precision it is given. So the
    wobble goes in HERE, for the same reason the grain and the joinery do: ask
    for hand-drawn and you get a mannerism, draw it and you get the thing. The
    wobble is pinned to zero at both ends, so corners still meet exactly and the
    perspective stays true - it is the line that breathes, not the geometry.
    """
    if _SKIP:
        return
    (ax, ay), (bx, by) = a, b
    L = math.hypot(bx - ax, by - ay)
    if L < 3.0:
        d.line((ax, ay, bx, by), fill=fill, width=width)
        _LABD.line((ax, ay, bx, by), fill=_PID, width=width + 2)
        _OWND.line((ax, ay, bx, by), fill=255, width=width + 2)
        return
    ux, uy = (bx - ax) / L, (by - ay) / L
    px, py = -uy, ux
    ph1, ph2 = _JIT.uniform(0, 6.28), _JIT.uniform(0, 6.28)
    amp = min(2.0, 0.55 + L * 0.0018)
    n = max(4, min(30, int(L / 24)))
    pts = []
    for i in range(n + 1):
        s = i / n
        w = (math.sin(2.1 * math.pi * s + ph1) * 0.62
             + math.sin(4.7 * math.pi * s + ph2) * 0.38) * amp
        w *= math.sin(math.pi * s) ** 0.5
        pts.append((ax + ux * L * s + px * w, ay + uy * L * s + py * w))
    d.line(pts, fill=fill, width=width, joint="curve")
    _LABD.line(pts, fill=_PID, width=width + 2)
    _OWND.line(pts, fill=255, width=width + 2)


def poly(d: ImageDraw.ImageDraw, pts, fill=None, outline=0, width=2):
    p = [P(*q) for q in pts]
    if _SKIP:
        return p
    if fill is not None:
        d.polygon(p, fill=fill, outline=fill)
        _LABD.polygon(p, fill=_PID)
        _OWND.polygon(p, fill=255)
        return p
    for i in range(len(p)):
        hand(d, p[i], p[(i + 1) % len(p)], width)
    return p


def bays() -> list[tuple[float, float]]:
    """The module: equal bays marching right from the corner."""
    out, x = [], RETURN_X
    while x + BAY_W < 3.3:
        out.append((x + STILE_W / 2, x + BAY_W - STILE_W / 2))
        x += BAY_W
    return out


def plan_bays(a, b, width: float = BAY_W):
    """Equal bays marching along any wall, given its two ends in PLAN (x, z).

    The back wall runs in x and the window wall runs in z, so bays cannot be a
    list of x pairs any more. Working in plan lets the same module, the same
    stile width and the same rails wrap the corner - which is the whole reason
    the room reads as one built room rather than two flats.
    """
    (ax, az), (bx, bz) = a, b
    L = math.hypot(bx - ax, bz - az)
    ux, uz = (bx - ax) / L, (bz - az) / L
    out, s = [], 0.0
    while s + width <= L + 1e-9:
        e0, e1 = s + STILE_W / 2, s + width - STILE_W / 2
        out.append(((ax + ux * e0, az + uz * e0), (ax + ux * e1, az + uz * e1)))
        s += width
    return out


def panel(img: np.ndarray, d, a, b, lo: float, hi: float, v: float, w: int = 2) -> None:
    """One raised-and-fielded panel, on whichever wall the two plan points lie."""
    (ax, az), (bx, bz) = a, b
    L = math.hypot(bx - ax, bz - az)
    if L < 2.2 * MOULD_W:
        return
    ix, iz = (bx - ax) / L * MOULD_W, (bz - az) / L * MOULD_W
    A, B = (ax, az), (bx, bz)
    Ai, Bi = (ax + ix, az + iz), (bx - ix, bz - iz)
    q = lambda pt, y: (pt[0], y, pt[1])
    hm, lm = hi - MOULD_W, lo + MOULD_W
    # the field, graded across its own width: light on the window side
    field = [q(Ai, hm), q(Bi, hm), q(Bi, lm), q(Ai, lm)]
    shade(img, field, max(30, v + 6), max(22, v - 8), "x")
    grain(img, field, 8.5, int(abs(ax) * 977 + abs(az) * 613 + lo * 149 + hi * 31))
    # the surround: lit on the left and top, shadowed on the right and beneath
    shade(img, [q(A, hi), q(Ai, hm), q(Ai, lm), q(A, lo)], max(40, v + 40))
    shade(img, [q(B, hi), q(Bi, hm), q(Bi, lm), q(B, lo)], max(18, v - 34))
    shade(img, [q(A, hi), q(B, hi), q(Bi, hm), q(Ai, hm)], max(44, v + 44))
    shade(img, [q(A, lo), q(B, lo), q(Bi, lm), q(Ai, lm)], max(16, v - 30))
    poly(d, [q(A, hi), q(B, hi), q(B, lo), q(A, lo)], None, 0, w)
    poly(d, [q(Ai, hm), q(Bi, hm), q(Bi, lm), q(Ai, lm)], None, 0, 1)


# The three tiers, as (bottom, top, line weight). Rails run round both walls.
def tiers(top: float):
    return ((FRIEZE_RAIL + 0.055, top, 2),
            (DADO_H + 0.06, FRIEZE_RAIL, 2),
            (SKIRT_H + 0.05, DADO_H - 0.10, 1))


_X, _Y = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))

# ------------------------------------------------------------------- parts
# Every surface drawn is stamped with the PART it belongs to, in draw order, so
# later parts overwrite earlier ones and each label ends up being exactly the
# pixels that part is visible on. That is the mask the assembler cuts with.
# Nobody traces an outline by hand any more.
BASE_PARTS = ("ceiling", "back-wall", "return-wall", "floor")   # walls, crown, floor; nothing else
DISABLED = ("bottles-lower", "bottles-upper", "sconce-left", "sconce-right", "cabinets", "chair-left", "chair-right", "figure-drew", "figure-barclay")   # founder 2026-09-05: characters and chairs out
                                                 # bottles later; the left lamp removed
                                                 # bottles later. Still parts; just off.
# THE POSTS LAY LAST of the three. A slab is housed BETWEEN two posts, so the
# only pixels the parts could compete for are the sliver of a slab's horizontal
# face that runs on behind a post toward the wall - and there the post is in
# front. Laying the carcass first is what let a slab's render creep over a
# divider and take it off the page.
LAY_ORDER = ("cabinets", "ledge", "shelf-lower", "bottles-lower", "bottles-upper",
             "shelf-upper", "backbar", "tv", "board", "sconce-left", "sconce-right",
             "window-frame", "glass", "counter", "chair-left", "chair-right", "figure-drew", "figure-barclay")
PART_NOTES = {
    "figure-drew": "the flamingo seated in the left-hand bar chair, seen from BEHIND and a little to his left: the curve of his back and shoulders rising out of the chair's leather roll, his long neck sweeping up and to the right in a deep question-mark, his head turned so we see the far side of his face in three-quarter back view, his heavy downturned beak pointing along the bar toward his companion, and his near feathered hand resting on the marble",
    "figure-barclay": "the golden retriever seated in the right-hand bar chair, seen from BEHIND and a little to his right: his rounded shoulders and the back of his dark suit jacket rising out of the chair's leather roll, the back of his head with its drop ears turned left toward his companion so his muzzle shows in profile with the black nose, and his near hand resting on the marble",
    "cabinets": "the cabinets under the back bar's working ledge: a run of panelled walnut cupboard doors, each a raised-and-fielded panel with a small brass knob, down to a plinth",
    "ledge": "the back bar's working ledge: a marble-topped counter at waist height running the width of the unit, its polished top pale and veined, its front a slim moulded marble edge, its back flush into the cabinet - empty, nothing standing on it",
    "backbar": "the back bar's carcass: THREE THICK SOLID WALNUT POSTS standing on the marble ledge - a 12 cm post at each end and one 12 cm divider between them - each running UNBROKEN from the ledge up past the upper shelf and stopping in a solid square head above it, each catching the window light down its near side so it reads BRIGHTER than the wall showing between the posts, with a dark arris down its far side, the two left-hand posts turning a deep side face toward the camera so they read as solid square posts standing OFF the panelled wall, and each throwing a soft shadow on the panelling beside it. There is NO back panel, NO top rail, NO cornice and NO shelf drawn here: the panelled wall shows between the posts and runs on above their heads to the frieze rail",
    "shelf-lower": "the lower shelf of the back bar: a HEAVY 8.5 cm SOLID WALNUT SLAB housed between the posts, seen from a little above so a sliver of its polished top shows, its front edge a thick board with a bright lit arris along the top and a dark undercut beneath, and a soft shadow thrown down the panelled wall below it - wood, not marble, not stone",
    "shelf-upper": "the upper shelf of the back bar: a HEAVY 8.5 cm SOLID WALNUT SLAB housed between the posts, seen from BELOW so its UNDERSIDE is in deep shadow, its front edge a thick dark board with a bright arris catching reflected light along its lower edge, and a soft shadow thrown down the panelled wall below it",
    "bottles-lower": "the row of liquor bottles standing on the lower shelf: varied heights and shapes, clear and dark glass, plain blank paper labels with NO lettering",
    "bottles-upper": "the row of liquor bottles standing on the upper shelf: varied heights and shapes, clear and dark glass, plain blank paper labels with NO lettering",
    "tv": "the switched-off flat-screen television in a slim matte-black frame, flush on the panelling",
    "board": "the chalkboard in its plain wooden frame, its slate matt black and unmarked",
    "window-frame": "the window's joinery, CLEAN STRAIGHT LINES: the opening cut through the panelled wall, its reveal, a plain flat square architrave on the room face - the same simple flat band on all four sides, the bottom exactly like the sides - and, stepped back inside the reveal, the dark sash frame that holds the single pane. There is NO window sill, NO projecting ledge or shelf under the pane, NO moulded nosing, NO rail: under the pane the flat architrave band simply meets the panelled wall",
    "counter": "the bar: the polished marble counter top, its slim moulded lip and the walnut-panelled bar front beneath it",
    "glass": "the view through the window: the street, the building opposite, the hot dog cart and the people",
    "sconce-left": "a LIT brass wall sconce on the window wall's pier beside the corner: an oval brass backplate with a beaded edge, a curved brass arm, a candle-cup, and a pleated cream fabric shade glowing from within, brightest at its open lower rim, throwing light up and down the panelling round it",
    "sconce-right": "a LIT brass wall sconce on the back wall to the right of the chalkboard: an oval brass backplate with a beaded edge, a curved brass arm, a candle-cup, and a pleated cream fabric shade glowing from within, brightest at its open lower rim, throwing light up and down the panelling round it",
    "chair-left": "the left-hand bar chair seen from behind: an upright curved back to mid-back height in SMOOTH, TIGHT, POLISHED dark leather with one broad soft sheen - no streaks, no ribbing, no hatching lines running down it - a slim padded roll along its top with a fine line of small brass nailheads, standing on a padded leather SEAT cushion that shows beside and below the back; plain straight walnut legs beneath. IDENTICAL to the other chair",
    "chair-right": "the right-hand bar chair seen from behind: an upright curved back to mid-back height in SMOOTH, TIGHT, POLISHED dark leather with one broad soft sheen - no streaks, no ribbing, no hatching lines running down it - a slim padded roll along its top with a fine line of small brass nailheads, standing on a padded leather SEAT cushion that shows beside and below the back; plain straight walnut legs beneath. IDENTICAL to the other chair",
}
_LAB = Image.new("L", (W, H), 0)
_LABD = ImageDraw.Draw(_LAB)
# Each part ALSO paints into a layer of its own. A part's mask is its whole
# silhouette, not "what later parts left of it": the bar's mask used to be the
# bar minus the chairs, so every change to the chairs re-cut the bar's render
# through a different hole and exposed pixels it had drawn behind the old
# chairs. With own silhouettes the bar is rendered as if the chairs were not
# there and the chairs are laid on top; change the chairs and the bar does not
# move by a pixel. (Founder, 2026-09-05: "I thought this was all modular.")
_OWN: dict = {}
_OWND = None
_FORCE: set = set()          # parts drawn even though they are in DISABLED (per-part values, full masks)
_SHADOW: dict = {}           # per-part SHADOW layers: a multiplier (1 = no shadow) the assembler applies at lay time
_CUR: str = ""              # the part being drawn
INK: list = []               # straight edges to ink in code after the render (page px)
_NAMES: list[str] = []
_PID = 0
_SKIP = False
_ENABLED = None


def part(name: str) -> None:
    """Everything drawn from here until the next part() belongs to `name`."""
    global _PID, _SKIP
    if name not in _NAMES:
        _NAMES.append(name)
    _PID = _NAMES.index(name) + 1
    _SKIP = (_ENABLED is not None and name not in _ENABLED) or (name in DISABLED and name not in _FORCE)
    global _CUR
    _CUR = name
    global _OWND
    if name not in _OWN:
        _OWN[name] = Image.new("L", (W, H), 0)
    _OWND = ImageDraw.Draw(_OWN[name])


def reset_parts(enabled, force=()) -> None:
    global _ENABLED, _PID, _SKIP, _FORCE
    _ENABLED = set(enabled) if enabled is not None else None
    _FORCE = set(force)
    _PID, _SKIP = 0, False
    _LAB.paste(0, (0, 0, W, H))
    _OWN.clear()
    _SHADOW.clear()
    INK.clear()


def cast(img: np.ndarray, pts, k0: float, k1: float = None, axis: str = "x") -> None:
    """A CAST SHADOW. Multiplies the values inside the polygon by k (graded k0 -> k1
    along the axis), so the wall's own panels, stiles and grain survive it - and
    records that multiplier in the current part's SHADOW layer, never in its
    silhouette. The assembler applies the layer to the RENDERED plate at lay
    time (and to the conditioning), so the model is never handed a flat grey
    rectangle where a shadow falls - it renders those as smears (2026-09-05).
    Shadows are code, like the TV screen and the lettering.
    """
    if _SKIP:
        return
    k1 = k0 if k1 is None else k1
    proj = [P(*q) for q in pts]
    m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).polygon(proj, fill=255)
    mm = np.asarray(m, np.float32) / 255.0
    xs = [p[0] for p in proj]; ys = [p[1] for p in proj]
    if axis == "x":
        u = (np.arange(W, dtype=np.float32)[None, :] - min(xs)) / max(1e-6, max(xs) - min(xs))
    else:
        u = (np.arange(H, dtype=np.float32)[:, None] - min(ys)) / max(1e-6, max(ys) - min(ys))
    k = k0 + (k1 - k0) * np.clip(u, 0.0, 1.0)
    field = 1.0 - mm * (1.0 - k)
    img *= field
    prev = _SHADOW.get(_CUR)
    _SHADOW[_CUR] = field if prev is None else np.minimum(prev, field)


def part_shadows() -> dict:
    """Shadow multiplier layers, one per part that casts any."""
    return {n: f for n, f in _SHADOW.items()}


def part_masks() -> dict:
    """Own silhouettes, one per part, independent of what is laid over them."""
    return {n: (np.asarray(_OWN[n], dtype=np.uint8) > 127) for n in _NAMES if n in _OWN}


def grain(img: np.ndarray, pts, strength: float = 9.0, seed: int = 0) -> None:
    """Cathedral grain, drawn into the VALUES of one panel field.

    Four seeds in a row came back with the fields reeded like corduroy, and the
    prompt has forbidden fine parallel striping the whole time. It is the same
    lesson as the joinery: the model reasons about figure badly and renders it
    well, so the figure is built here rather than asked for. Low frequency and
    wandering - two or three broad features across a board, not twenty - which
    is exactly what separates walnut from fluting.

    This goes in the values, never in the line layer. A grain line drawn as a
    LINE comes through the render as a hard black scratch.
    """
    if _SKIP:
        return
    m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).polygon([P(*q) for q in pts], fill=255)
    mask = np.asarray(m, dtype=np.float32) / 255.0
    ys, xs = np.nonzero(mask > 0.5)
    if len(xs) < 24:
        return
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    rs = np.random.RandomState(seed % 2**31)
    u = (_X - x0) / max(x1 - x0, 1)
    v = (_Y - y0) / max(y1 - y0, 1)
    # the board wanders as it runs; that wander is what stops it being stripes
    # Barely any wander. Movement in the figure reads as drapery; walnut runs
    # STRAIGHT up the board. The sharp heart lines below are what stop the pen
    # falling back into reeding, so the straightness costs nothing.
    warp = (u + 0.014 * np.sin(2.1 * v + rs.uniform(0, 6.28))
              + 0.007 * np.sin(4.3 * v + rs.uniform(0, 6.28)))
    g = np.zeros((H, W), np.float32)
    for f, a in ((rs.uniform(1.0, 1.7), 0.14), (rs.uniform(2.1, 3.0), 0.07)):
        g += a * np.sin(2 * np.pi * (f * warp + rs.uniform(0, 1)))
    # The dark heart of the board. These have to be NARROW and DEEP: a broad
    # soft modulation just reads as more shading and the pen hatches over it,
    # but a sharp figure line is a feature the engraver has to draw around.
    for _ in range(rs.randint(2, 4)):
        g -= 2.8 * np.exp(-((warp - rs.uniform(0.12, 0.88)) / 0.030) ** 2)
    img += g * strength * mask


# --------------------------------------------------------------- the shading
def shade(img: np.ndarray, pts, v0: float, v1: float = None, axis: str = "x") -> None:
    """Fill a projected polygon with a graded value. Grading is what stops the
    render reading a surface as the wrong plane."""
    if _SKIP:
        return
    proj = [P(*q) for q in pts]
    m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).polygon(proj, fill=255)
    _LABD.polygon(proj, fill=_PID)
    _OWND.polygon(proj, fill=255)
    mask = np.asarray(m, dtype=np.float32) / 255.0
    if mask.max() <= 0:
        return
    ys, xs = np.nonzero(mask > 0.5)
    if len(xs) == 0:
        return
    if v1 is None:
        grad = np.full((H, W), v0, np.float32)
    else:
        if axis == "x":
            lo, hi = xs.min(), max(xs.max(), xs.min() + 1)
            ramp = np.clip((np.arange(W) - lo) / (hi - lo), 0, 1)
            grad = (v0 + (v1 - v0) * ramp)[None, :] * np.ones((H, 1), np.float32)
        else:
            lo, hi = ys.min(), max(ys.max(), ys.min() + 1)
            ramp = np.clip((np.arange(H) - lo) / (hi - lo), 0, 1)
            grad = (v0 + (v1 - v0) * ramp)[:, None] * np.ones((1, W), np.float32)
    img *= 1 - mask
    img += grad * mask


def moulding(img: np.ndarray, d, y_lo: float, y_hi: float,
             a, b, lit: float, dark: float) -> None:
    """A moulding is not a line. It is a lit upper face and a shadowed under
    face, and that is how the render knows it is carved. Given its ends in PLAN
    so a rail can run along the back wall and on round the return."""
    (ax, az), (bx, bz) = a, b
    mid = (y_lo + y_hi) / 2
    shade(img, [(ax, y_hi, az), (bx, y_hi, bz), (bx, mid, bz), (ax, mid, az)], lit)
    shade(img, [(ax, mid, az), (bx, mid, bz), (bx, y_lo, bz), (ax, y_lo, az)], dark)
    for y in (y_lo, mid, y_hi):
        hand(d, P(ax, y, az), P(bx, y, bz), 1)


# A real crown is a STACK of members, each catching or losing the light at a
# different angle. Drawn as one band it reads as a painted stripe; drawn as a
# profile it reads as carved timber. Fractions of the crown's depth, from the
# ceiling down, with the value each member holds.
CROWN_PROFILE = [
    (0.00, 0.16, 184),   # the fillet against the ceiling, catching light
    (0.16, 0.56, 116),   # the cove, turning away
    (0.56, 0.70, 204),   # a bead, its top face bright
    (0.70, 1.00, 58),    # the shadow it throws on the panelling below
]                        # four members: six read as TWO cornices at the close camera


def crown(img: np.ndarray, d, y_top: float, depth: float,
          a: tuple[float, float], b: tuple[float, float], scale: float = 1.0) -> None:
    """The crown moulding, run between two (x, z) points on any wall.

    A real crown is a STACK of members, each catching or losing the light at a
    different angle. Drawn as one band it reads as a painted stripe; drawn as a
    profile it reads as carved timber. It also has to TURN THE CORNER onto the
    window wall - a cornice that stops dead at the corner is the single clearest
    tell that a room was assembled rather than built, so both walls get it, the
    return darker because it is backlit.
    """
    (ax, az), (bx, bz) = a, b
    for f0, f1, v in CROWN_PROFILE:
        lo, hi = y_top - depth * f1, y_top - depth * f0
        shade(img, [(ax, hi, az), (bx, hi, bz), (bx, lo, bz), (ax, lo, az)], v * scale)
        hand(d, P(ax, lo, az), P(bx, lo, bz), 1)
    hand(d, P(ax, y_top, az), P(bx, y_top, bz), 2)


def bottle(img: np.ndarray, d, x: float, y0: float, z: float, h: float, w: float,
           v: float, kind: str = "wine") -> None:
    """One bottle, blocked in. Four profiles, because a row of one silhouette
    repeated reads as a cut-out frieze and a real back bar never has that:
    wine (sloped shoulder), square (a gin or whisky bottle, straight shoulder),
    round (a brandy bulb), tall (a thin liqueur). Lit from the window, a blank
    label, a cap. Labels carry NO lettering - the model letters any rectangle it
    is given, and it garbles it.
    """
    prof = {"wine":   (1.00, 0.62, 0.75, 0.19),
            "square": (1.25, 0.78, 0.84, 0.22),
            "round":  (1.32, 0.52, 0.68, 0.20),
            "tall":   (0.80, 0.70, 0.78, 0.16)}[kind]
    w = w * prof[0]
    hw, nw = w / 2, w * prof[3]
    ys, yn = y0 + h * prof[1], y0 + h * prof[2]
    if kind == "round":                                   # a bulb: bowed sides
        body = [(x - hw * 0.8, y0, z), (x + hw * 0.8, y0, z), (x + hw, y0 + h * 0.2, z),
                (x + hw, ys, z), (x - hw, ys, z), (x - hw * 0.8, y0 + h * 0.2, z)]
    else:
        body = [(x - hw, y0, z), (x + hw, y0, z), (x + hw, ys, z), (x - hw, ys, z)]
    shoulder = [(x - hw, ys, z), (x + hw, ys, z), (x + nw, yn, z), (x - nw, yn, z)]
    neck = [(x - nw, yn, z), (x + nw, yn, z), (x + nw, y0 + h, z), (x - nw, y0 + h, z)]
    cap = [(x - nw * 1.15, y0 + h, z), (x + nw * 1.15, y0 + h, z),
           (x + nw * 1.15, y0 + h + 0.022, z), (x - nw * 1.15, y0 + h + 0.022, z)]
    for q in (body, shoulder, neck, cap):
        poly(d, q, 255)                                   # it stands in front of the back
    shade(img, body, v + 26, v - 18, "x")
    shade(img, shoulder, v + 10, v - 14, "x")
    shade(img, neck, v + 4, v - 22, "x")
    shade(img, cap, 30)
    l0, l1 = (0.14, 0.50) if kind != "square" else (0.22, 0.60)
    label = [(x - hw + 0.008, y0 + h * l0, z), (x + hw - 0.008, y0 + h * l0, z),
             (x + hw - 0.008, y0 + h * l1, z), (x - hw + 0.008, y0 + h * l1, z)]
    shade(img, label, 216, 176, "x")
    poly(d, label, None, 0, 1)
    out = body[:2] + [body[2]] if kind != "round" else body[:3]
    outline = ([body[0], body[1]] + ([body[2]] if kind == "round" else [])
               + [(x + hw, ys, z), (x + nw, yn, z), (x + nw * 1.15, y0 + h + 0.022, z),
                  (x - nw * 1.15, y0 + h + 0.022, z), (x - nw, yn, z), (x - hw, ys, z)]
               + ([body[5]] if kind == "round" else []))
    poly(d, outline, None, 0, 1)


def bottles(img: np.ndarray, d, sy: float, seed: int) -> None:
    """A row along one shelf: mixed profiles, dark and clear glass, deterministic,
    skipping the uprights."""
    rs = np.random.RandomState(seed)
    x = SHELF_X[0] + CHEEK_W + 0.06
    ups = uprights()
    kinds = ["wine", "wine", "square", "round", "tall", "square", "wine"]
    while x < SHELF_X[1] - CHEEK_W - 0.06:
        if all(abs(x - u) > CHEEK_W * 1.4 for u in ups):
            dark = rs.uniform() < 0.45
            bottle(img, d, x, sy, WALL_Z - SHELF_DEPTH * 0.55,
                   rs.uniform(0.24, 0.35), rs.uniform(0.066, 0.084),
                   rs.uniform(38, 60) if dark else rs.uniform(96, 128),
                   kinds[rs.randint(len(kinds))])
        x += BOTTLE_PITCH * rs.uniform(0.94, 1.10)


def stile_centres() -> list[float]:
    """The x of every stile on the back wall - the same module plan_bays()
    marches, read back so the joinery IN FRONT of the wall can be kept clear of
    the joinery IN it."""
    out, x = [], RETURN_X
    while x < 3.3 + BAY_W:
        out.append(x)
        x += BAY_W
    return out


def stile_edges_px(y: float = 1.50) -> list[tuple[float, float]]:
    """Every stile group as a PROJECTED px span on the wall: the dark surround
    of the panel to its left, the stile itself, and the lit surround of the
    panel to its right. Clearance has to be judged here and not in metres - the
    same 10 cm of wall is 318 px/m at the left cheek and 399 px/m at the right,
    and that difference is the whole reason a divider that looked safe in plan
    ended up sitting on a stile."""
    h = STILE_W / 2 + MOULD_W
    return [(P(c - h, y, WALL_Z)[0], P(c + h, y, WALL_Z)[0]) for c in stile_centres()]


def uprights() -> list[float]:
    """Centre x of the internal uprights. C3-SLAB uses ONE thick divider: two
    wide bays read as a built unit, three narrow ones read as a wine rack."""
    return [DIVIDER_X]


def upright_spans() -> list[tuple[float, float]]:
    """(x0, x1) of every post: the two end cheeks and the divider."""
    return ([(SHELF_X[0], SHELF_X[0] + CHEEK_W)]
            + [(u - CHEEK_W / 2, u + CHEEK_W / 2) for u in uprights()]
            + [(SHELF_X[1] - CHEEK_W, SHELF_X[1])])


def shelf_bays() -> list[tuple[float, float, bool, bool]]:
    """The clear openings BETWEEN the posts. A slab, its end lines and its cast
    shadow are drawn ONLY here, so a post is never crossed by one and no shelf
    pixel ever lands on a divider face."""
    sp = upright_spans()
    out = []
    for i in range(len(sp) - 1):
        L, R = sp[i], sp[i + 1]
        out.append((L[1], R[0],                       # and which END is clipped
                    (L[0] + L[1]) / 2 > CAM_X,        # by the post beside it
                    (R[0] + R[1]) / 2 < CAM_X))
    return out


def x_at_px(px: float, z: float) -> float:
    """The inverse of P() in x: which world x, at depth z, lands on this column.

    Needed to CLIP a shelf where it disappears behind a post. A slab's top face
    runs on toward the wall, and at the end of a bay that back corner projects
    17 px past the post's near edge - i.e. behind it. The post is drawn last so
    the picture is right either way, but the SHELF'S OWN MASK would still claim
    those pixels, and an own-silhouette mask that claims a divider is exactly
    how a divider goes missing when the two parts are rendered separately."""
    u = (px - CX) / F
    c, sn = math.cos(_YAW), math.sin(_YAW)
    dz = z - CAM_Z
    return CAM_X + dz * (sn + u * c) / (c - u * sn)


def side_face_x(x0: float, x1: float) -> float:
    """Which side of a post the eye actually sees. Everything left of the
    camera's own x shows its RIGHT face, everything right of it its LEFT."""
    return x1 if (x0 + x1) / 2 < CAM_X else x0


def sconce(img: np.ndarray, d, plate_pt, shade_pt, on_return: bool) -> None:
    """A brass wall sconce, LIT. An oval backplate with a bead, a curved arm, a
    candle-cup, and a pleated shade whose lower rim is the brightest thing on
    the wall - the light is inside it. The shade is a cone, so its silhouette
    is the same from wherever the camera stands; only the plate follows the
    wall it hangs on."""
    px, py, pz = plate_pt
    sx, sy, sz = shade_pt
    n = 14
    if on_return:                                        # the plate lies in the y-z plane
        plate = [(px, py + 0.13 * math.cos(2 * math.pi * k / n), pz + 0.06 * math.sin(2 * math.pi * k / n)) for k in range(n)]
    else:                                                # in the x-y plane
        plate = [(px + 0.06 * math.sin(2 * math.pi * k / n), py + 0.13 * math.cos(2 * math.pi * k / n), pz) for k in range(n)]
    poly(d, plate, 255)
    shade(img, plate, 150, 62, "y")
    poly(d, plate, None, 0, 2)
    bead = [(q[0] * 0.999 + (px if not on_return else px), (py + (q[1] - py) * 0.7), (pz + (q[2] - pz) * 0.7)) for q in plate]
    poly(d, bead, None, 0, 1)
    ax, ay, az = px, py - 0.04, pz                       # the arm, in two curved strokes
    mx, my, mz = ((px + sx) / 2, py - 0.10, (pz + sz) / 2)
    hand(d, P(ax, ay, az), P(mx, my, mz), 3)
    hand(d, P(mx, my, mz), P(sx, sy - 0.06, sz), 3)
    cup = [(sx - 0.028, sy - 0.02, sz), (sx + 0.028, sy - 0.02, sz), (sx + 0.022, sy - 0.075, sz), (sx - 0.022, sy - 0.075, sz)]
    poly(d, cup, 255)
    shade(img, cup, 160, 70, "x")
    poly(d, cup, None, 0, 1)
    cone = [(sx - 0.075, sy + 0.19, sz), (sx + 0.075, sy + 0.19, sz),   # the shade, lit from within
            (sx + 0.12, sy, sz), (sx - 0.12, sy, sz)]
    poly(d, cone, 255)
    shade(img, cone, 250, 206, "y")                      # brightest at the open bottom
    poly(d, cone, None, 0, 2)
    for k in range(1, 8):                                # its pleats
        u = k / 8
        hand(d, P(sx - 0.075 + 0.15 * u, sy + 0.19, sz), P(sx - 0.12 + 0.24 * u, sy, sz), 1)
    lip = [(sx - 0.12, sy, sz), (sx + 0.12, sy, sz), (sx + 0.12, sy - 0.02, sz), (sx - 0.12, sy - 0.02, sz)]
    shade(img, lip, 255)                                 # the glowing lower rim
    top = [(sx - 0.075, sy + 0.19, sz), (sx + 0.075, sy + 0.19, sz), (sx + 0.075, sy + 0.205, sz), (sx - 0.075, sy + 0.205, sz)]
    shade(img, top, 120)


def lamplight(img: np.ndarray) -> None:
    """THE LIGHT FIELD. Two lit sconces on top of the window's daylight.

    Each lamp throws a pool onto the wall round it: a fan of light UPWARD out
    of the open top of the shade, a wider, softer cone DOWNWARD out of the
    bottom, and a small bright halo hard round the shade itself, all falling
    off with distance. Multiplied over the values, so every surface in the
    pool - panelling, the edge of the set, the board's frame - is lit by it,
    and every part rendered against the plate inherits that. The window's
    daylight is already in the walls' left-to-right gradient; the lamps are
    what light the RIGHT of the room, which daylight does not reach.
    """
    L = np.ones((H, W), np.float32)
    for name, _plate, (sx, sy, sz), _ret in SCONCES:
        if name in DISABLED:
            continue                                     # no lamp, no pool
        px, py = P(sx, sy, sz)
        ppm = F / max(sz - CAM_Z, 0.5)                   # pixels per metre at the lamp's depth
        dx, dy = (_X - px) / ppm, (_Y - py) / ppm        # metres, in the picture plane
        r = np.hypot(dx, dy)
        # The fan and the cone are SOFT in angle as well as in distance. Built as
        # hard wedges, their straight edges came through the render as real
        # edges on the panelling - a lamp does not throw a triangle.
        ang = np.arctan2(np.abs(dx), -dy)                # 0 straight up, pi straight down
        upw = np.clip(1.0 - (ang - 0.50) / 0.45, 0, 1)   # full within ~29 deg of up, gone by ~54
        downw = np.clip(1.0 - ((np.pi - ang) - 0.70) / 0.55, 0, 1)   # wider below
        soft = np.exp(-(r / 0.78) ** 2)
        L += soft * (0.48 * upw + 0.36 * downw) + np.exp(-(r / 0.22) ** 2) * 0.28
    np.multiply(img, L, out=img)
    np.clip(img, 0, 255, out=img)


def slab(img: np.ndarray, d, x0, x1, y0, y1, z0, z1,
         front_v: float, face_v: float) -> None:
    """A rectangular member on the wall: its front face, plus whichever of its
    top or its underside the eye can actually see. Which one that is depends on
    the eye height, so it is decided here rather than guessed."""
    f = [(x0, y1, z0), (x1, y1, z0), (x1, y0, z0), (x0, y0, z0)]
    shade(img, f, front_v, front_v * 0.7, "x")
    poly(d, f, None, 0, 2)
    y = y1 if EYE > y1 else y0
    s = [(x0, y, z1), (x1, y, z1), (x1, y, z0), (x0, y, z0)]
    shade(img, s, face_v, face_v * 0.62, "x")
    poly(d, s, None, 0, 1)


def y_at_px(row: float, x: float, z: float) -> float:
    """The inverse of P() in y: which world y, at (x, z), lands on this row.

    A shadow has to START WHERE THE WALL COMES OUT from behind the thing that
    throws it, and that is not the caster's own y. A slab below the eye hides
    the wall down to the row of its FRONT bottom edge, which is lower on the
    page than the row where its underside meets the wall; a slab above the eye
    hides it the other way round. Beginning the band at the caster's y put 5300
    px of shadow map inside the slab's own mask - the assembler would have
    darkened the member with its own shadow."""
    dx, dz = x - CAM_X, max(z - CAM_Z, 0.05)
    c, sn = math.cos(_YAW), math.sin(_YAW)
    zc = max(dx * sn + dz * c, 0.05)
    return EYE - (row - CY) * zc / F


def slab_bay(img: np.ndarray, d, x0: float, x1: float, sy: float,
             zf: float, zb: float, clip_l: bool = False, clip_r: bool = False) -> None:
    """One bay of a heavy floating slab, drawn in the order the light works.

    First the shadow it throws on the panelling under it - through cast(), so it
    MULTIPLIES the wall instead of replacing it and lands in this part's SHADOW
    layer instead of its silhouette. Drawn with shade() it did both wrong things
    at once: the mask claimed a flat grey rectangle over the wall, the model was
    handed that rectangle as the thing to render, and it rendered a smear
    (2026-09-05). Then the ONE horizontal face the eye can see: the top if the
    slab is below the eye, the underside if it is above. At EYE 1.70 that face
    is only 6-7 px, and no height between the ledge and the frieze rail makes it
    more (20 px would need the board 0.80 m off eye level, i.e. below 0.90 or
    above 2.50), so the THICKNESS is carried by the front edge instead: 29-31 px
    of it, stacked as a lit arris, the board, and a dark undercut. A flat grey
    bar reads as a line; that stack reads as timber.
    """
    y0, y1 = sy - SHELF_T, sy
    # everything laid ON THE WALL - the shadow as well as the slab's own
    # horizontal face - has to stop where the post beside it hides the wall, or
    # the shelf's own mask claims a strip of the post.
    bx0 = x_at_px(P(x0, y1, zf)[0], zb) if clip_l else x0
    bx1 = x_at_px(P(x1, y1, zf)[0], zb) if clip_r else x1
    # and it starts BELOW the lowest row the slab itself covers, not at the
    # slab's own y: see y_at_px(). min() picks the right one either way round -
    # the front edge for a slab under the eye, the soffit line for one above it.
    tL = min(y0, y_at_px(P(x0, y0, zf)[1], bx0, zb)) - SHADOW_GAP
    tR = min(y0, y_at_px(P(x1, y0, zf)[1], bx1, zb)) - SHADOW_GAP
    # and it stops just clear of the post at each end of the bay, on the same
    # rule: the wall x that projects to the post's outermost drawn column.
    sx0 = x_at_px(max(P(x0, 0.0, zf)[0], P(x0, 0.0, zb)[0]), zb) + SHADOW_GAP
    sx1 = x_at_px(min(P(x1, 0.0, zf)[0], P(x1, 0.0, zb)[0]), zb) - SHADOW_GAP
    cast(img, [(sx0, tL, zb), (sx1, tR, zb),
               (sx1, tR - SLAB_CORE, zb), (sx0, tL - SLAB_CORE, zb)], 0.50, 0.62, "y")
    cast(img, [(sx0, tL - SLAB_CORE, zb), (sx1, tR - SLAB_CORE, zb),
               (sx1, tR - SLAB_SHADOW, zb), (sx0, tL - SLAB_SHADOW, zb)], 0.64, 1.0, "y")
    top_face = EYE > y1
    yf = y1 if top_face else y0
    face = [(bx0, yf, zb), (bx1, yf, zb), (x1, yf, zf), (x0, yf, zf)]
    poly(d, face, 255)
    if top_face:
        shade(img, face, 176, 198, "y")   # a lit top, seen almost edge-on -
                                          # kept close to the arris above it so the
                                          # two read as ONE lit top and not as a
                                          # 6 px grey hairline stacked on an 11 px
                                          # white one
    else:
        shade(img, face, 20, 11, "y")     # an underside, in deep shadow
    hand(d, P(bx0, yf, zb), P(bx1, yf, zb), 1)
    if top_face:
        stack = ((y1 - SLAB_ARRIS, y1, 208, 194),          # the lit arris
                 (y0 + SLAB_UNDER, y1 - SLAB_ARRIS, 86, 44),
                 (y0, y0 + SLAB_UNDER, 20, 13))            # the undercut
    else:
        stack = ((y0 + SLAB_ARRIS, y1, 78, 42),            # the board, dark
                 (y0, y0 + SLAB_ARRIS, 206, 192))          # a lit lower arris:
    for a, b, v0, v1 in stack:                             # light off the ledge
        if b - a < 1e-6:
            continue
        q = [(x0, b, zf), (x1, b, zf), (x1, a, zf), (x0, a, zf)]
        poly(d, q, 255)
        shade(img, q, v0, v1, "x")
    for yy in (y1, y0):                    # the slab's own top and bottom lines,
        hand(d, P(x0 + 0.006, yy, zf), P(x1 - 0.006, yy, zf), 2)   # stopped just
    for xe in (x0 + 0.014, x1 - 0.014):    # short of the posts, and the housing
        hand(d, P(xe, y1, zf), P(xe, y0, zf), 2)   # joint just inside the bay -
                                           # the post's own stop-line closes both


def post_shadow(img: np.ndarray, x0: float, x1: float, zf: float, zb: float) -> None:
    """What one post throws on the panelling beside it. It is BROKEN wherever a
    slab's own shadow crosses it, because two parts must not darken the same
    pixel: each part's shadow layer is multiplied onto the plate as that part is
    laid, so an overlap is applied twice and prints as a black notch.

    It also starts at the wall x that projects to the post's OUTERMOST drawn
    column, not at the post's own x1. For the two posts left of the camera those
    are the same thing - their side face runs back to the wall at x1 - but the
    right cheek is right of the camera, so its front face at z=3.65 projects 7 px
    FURTHER RIGHT than the wall does at the same x, and a band begun at x1 laid
    2600 px of shadow map over the cheek's own dark arris."""
    xs = x_at_px(max(P(x1, 0.0, zf)[0], P(x1, 0.0, zb)[0]), zb) + SHADOW_GAP
    for a, b in ((BACKBAR_Y[0], SHELF_YS[0] - SHELF_T - SLAB_SHADOW),
                 (SHELF_YS[0], SHELF_YS[1] - SHELF_T - SLAB_SHADOW),
                 (SHELF_YS[1], UNIT_TOP)):
        # a segment that starts at a slab's top starts BELOW the lowest row that
        # slab covers, on the same rule y_at_px() states, or the band's first two
        # rows land inside the slab's own mask.
        if a in SHELF_YS:
            a = max(a, y_at_px(P(x1, a, zf)[1], x1, zb)) + SHADOW_GAP
        if b - a < 0.02:
            continue
        cast(img, [(xs, b, zb), (xs + POST_SHADOW, b, zb),
                   (xs + POST_SHADOW, a, zb), (xs, a, zb)], 0.46, 0.94, "x")


def post(img: np.ndarray, d, x0: float, x1: float, zf: float, zb: float) -> None:
    """One post, as a SOLID 12 cm member standing on the ledge.

    The front face runs UNBROKEN from the ledge to the head - that is the answer
    to a divider disappearing - and is drawn as POST_STRIPS: a lit arris down
    the window side, two strips of face turning away from it, a shadowed arris
    down the other side, with a hard dark stop-line on both edges. The two
    bright strips sit ABOVE the value of the wall showing between the posts, so
    a post reads as a lit member in front of the opening rather than as the dark
    edge of a recess. The side face is 35 cm of return, BROKEN wherever a slab is
    housed into it; on a post within 0.20 m of the camera's own x it is edge-on
    and would project as a 3 px sliver, so there it is merged into the arris it
    stands on - bright if that is the window side, dark if it is not - instead of
    being drawn as a plane of its own.
    """
    sx = side_face_x(x0, x1)
    wpx = abs(P(sx, BACKBAR_Y[0], zb)[0] - P(sx, BACKBAR_Y[0], zf)[0])
    if wpx >= SIDE_MIN_PX:
        for a, b in ((BACKBAR_Y[0], SHELF_YS[0] - SHELF_T),
                     (SHELF_YS[0], SHELF_YS[1] - SHELF_T),
                     (SHELF_YS[1], UNIT_TOP)):
            if b - a < 0.012:
                continue
            s = [(sx, b, zf), (sx, b, zb), (sx, a, zb), (sx, a, zf)]
            poly(d, s, 255)
            # graded ALONG THE RETURN, not down it: light where the arris turns
            # the corner and falling away into the wall. A side face at one flat
            # dark value is a black stripe beside a post; a side face that goes
            # off toward the wall is the thing that says the post stands in
            # front of the panelling rather than on it. Both posts that show a
            # side face stand left of the camera axis, so the front of the
            # return is the LOW column and the wall end is the high one.
            shade(img, s, 84, 28, "x")
            poly(d, s, None, 0, 1)
    a = x0
    for w, v0, v1 in POST_STRIPS:
        b = a + w
        q = [(a, UNIT_TOP, zf), (b, UNIT_TOP, zf), (b, BACKBAR_Y[0], zf), (a, BACKBAR_Y[0], zf)]
        poly(d, q, 255)
        shade(img, q, v0, v1, "y")
        a = b
    if wpx < SIDE_MIN_PX:                  # the edge-on sliver, merged in
        s = [(sx, UNIT_TOP, zf), (sx, UNIT_TOP, zb),
             (sx, BACKBAR_Y[0], zb), (sx, BACKBAR_Y[0], zf)]
        poly(d, s, 255)
        lit = abs(sx - x0) < abs(sx - x1)  # the window side of the post
        shade(img, s, 210, 198, "y") if lit else shade(img, s, 30, 20, "y")
    grain(img, [(x0 + POST_ARRIS, UNIT_TOP, zf), (x1 - POST_DARK, UNIT_TOP, zf),
                (x1 - POST_DARK, BACKBAR_Y[0], zf), (x0 + POST_ARRIS, BACKBAR_Y[0], zf)],
          7.5, int(abs(x0) * 1097 + 313))
    poly(d, [(x0, UNIT_TOP, zf), (x1, UNIT_TOP, zf),
             (x1, BACKBAR_Y[0], zf), (x0, BACKBAR_Y[0], zf)], None, 0, 2)
    for sy in SHELF_YS:                    # the through housings, on the face
        hand(d, P(x0, sy, zf), P(x1, sy, zf), 1)
        hand(d, P(x0, sy - SHELF_T, zf), P(x1, sy - SHELF_T, zf), 1)


def ring(x: float, y: float, z: float, r: float, n: int = 24):
    """A horizontal circle in world space. A seat is round; drawn as a square
    quad it projects to a parallelogram and reads as a sheet of glass."""
    return [(x + r * math.cos(2 * math.pi * i / n), y,
             z + r * math.sin(2 * math.pi * i / n)) for i in range(n)]


def stool(img: np.ndarray, d, x: float, z: float) -> None:
    """A backless bar stool: seat, four splayed legs, a foot rail.

    Backless on purpose. A tall back at this distance would rear up over the
    counter and fight the cast for the same piece of frame - and the cast is
    what the picture is about.
    """
    for ang in (0.9, 2.3, 3.9, 5.4):                     # legs, back ones first
        c, s = math.cos(ang), math.sin(ang)
        leg = [(x + 0.13 * c - 0.020, SEAT_H - 0.07, z + 0.13 * s),
               (x + 0.13 * c + 0.020, SEAT_H - 0.07, z + 0.13 * s),
               (x + 0.23 * c + 0.026, 0.0, z + 0.23 * s),
               (x + 0.23 * c - 0.026, 0.0, z + 0.23 * s)]
        shade(img, leg, 74 if s < 0 else 46)
        poly(d, leg, None, 0, 2)
    for rr, yy, v in ((0.175, 0.255, 96), (0.175, 0.225, 54)):   # the foot rail
        poly(d, ring(x, yy, z, rr), None, 0, 1)
        shade(img, ring(x, yy, z, rr), v)
    seat, rim = ring(x, SEAT_H, z, 0.19), ring(x, SEAT_H - 0.07, z, 0.19)
    for i in range(len(seat)):                           # the seat's turned edge
        j = (i + 1) % len(seat)
        shade(img, [seat[i], seat[j], rim[j], rim[i]], 52)
    d.polygon([P(*q) for q in seat], fill=255, outline=255)   # it occludes the bar
    shade(img, seat, 128, 86, "x")
    poly(d, seat, None, 0, 2)


def _blob(img, d, pts3, v0, v1=None, axis="y", outline=2):
    """A filled, outlined figure element in world space."""
    poly(d, pts3, 255)
    shade(img, pts3, v0, v1, axis)
    poly(d, pts3, None, 0, outline)


def _oval(cx, cy, cz, rx, ry, n=28):
    return [(cx + rx * math.cos(2 * math.pi * i / n), cy + ry * math.sin(2 * math.pi * i / n), cz) for i in range(n)]


def figure(img: np.ndarray, d, who: str, x: float, z: float) -> None:
    """A seated figure from behind: a block-in the character prompt is rendered
    from. Torso in the chair, one arm forward to the marble, neck, head. Drew is
    the brightest thing in the picture (white plumage); Barclay a dark jacket
    under a furred head. Geometry from the cast plan (2026-09-05): shoulders at
    1.32 / 1.36 m, heads to 1.65 / 1.71 m, on SEAT_H 0.76 chairs."""
    zb = z + 0.02                                    # the body plane, just inside the chair's back
    if who == "drew":
        hips, sh, top = 0.40, 0.34, 1.32
        torso = [(x - hips / 2, 0.92, zb), (x + hips / 2, 0.92, zb), (x + sh / 2 + 0.02, top - 0.06, zb),
                 (x + sh / 2 - 0.04, top, zb), (x, top + 0.02, zb), (x - sh / 2 + 0.04, top, zb), (x - sh / 2 - 0.02, top - 0.06, zb)]
        _blob(img, d, torso, 150, 176, "y")          # the knitted vest across his back
        # near arm forward to the marble, and the hand
        _blob(img, d, [(x + 0.10, top - 0.03, zb), (x + 0.18, top - 0.10, zb), (x + 0.30, 1.10, 1.03), (x + 0.22, 1.08, 1.03)], 200, 214, "y")
        _blob(img, d, _oval(x + 0.27, 1.095, 1.05, 0.055, 0.02), 210)
        _blob(img, d, [(x - 0.07, top + 0.01, zb), (x + 0.07, top + 0.01, zb), (x + 0.06, top + 0.06, zb), (x - 0.06, top + 0.06, zb)], 240)  # collar band
        # the question-mark neck: a curve from the collar up and to the right
        pts = [(x + 0.00, 1.40), (x + 0.02, 1.46), (x + 0.06, 1.52), (x + 0.10, 1.56), (x + 0.11, 1.60)]
        w = [0.09, 0.08, 0.07, 0.065, 0.06]
        for (a, b), (c, e), wa, wb in zip(pts[:-1], pts[1:], w[:-1], w[1:]):
            _blob(img, d, [(a - wa / 2, b, zb - 0.04), (a + wa / 2, b, zb - 0.04), (c + wb / 2, e, zb - 0.06), (c - wb / 2, e, zb - 0.06)], 214, 224, "y", 1)
        _blob(img, d, _oval(x + 0.10, 1.60, zb - 0.06, 0.095, 0.062), 222)          # the head
        _blob(img, d, [(x + 0.17, 1.575, zb - 0.06), (x + 0.26, 1.52, zb - 0.08), (x + 0.17, 1.545, zb - 0.06)], 196, 196, "x", 2)   # the beak
        _blob(img, d, [(x + 0.235, 1.535, zb - 0.08), (x + 0.26, 1.52, zb - 0.08), (x + 0.235, 1.515, zb - 0.08)], 20)             # its black tip
    else:
        hips, sh, top = 0.44, 0.44, 1.36
        torso = [(x - hips / 2, 0.92, zb), (x + hips / 2, 0.92, zb), (x + sh / 2 + 0.02, top - 0.07, zb),
                 (x + sh / 2 - 0.05, top, zb), (x, top + 0.02, zb), (x - sh / 2 + 0.05, top, zb), (x - sh / 2 - 0.02, top - 0.07, zb)]
        _blob(img, d, torso, 48, 68, "y")            # the dark suit jacket, rounded shoulders
        hand(d, P(x, 0.94, zb), P(x, top - 0.02, zb), 1)                            # the jacket's centre seam
        _blob(img, d, [(x - 0.14, top - 0.04, zb), (x - 0.22, top - 0.11, zb), (x - 0.22, 1.10, 1.03), (x - 0.14, 1.08, 1.03)], 46, 60, "y")   # near arm to the marble
        _blob(img, d, _oval(x - 0.20, 1.095, 1.05, 0.06, 0.022), 150)              # the furred hand
        _blob(img, d, [(x - 0.07, top + 0.01, zb), (x + 0.07, top + 0.01, zb), (x + 0.06, top + 0.07, zb), (x - 0.06, top + 0.07, zb)], 226)  # pale shirt collar
        _blob(img, d, [(x - 0.06, 1.42, zb - 0.02), (x + 0.06, 1.42, zb - 0.02), (x + 0.05, 1.52, zb - 0.04), (x - 0.05, 1.52, zb - 0.04)], 140, 150, "y", 1)  # short neck, fur
        _blob(img, d, _oval(x - 0.08, 1.62, zb - 0.04, 0.12, 0.10), 148, 160, "y")  # the head, turned left
        for ex in (x - 0.19, x + 0.03):                                              # drop ears with fringe
            _blob(img, d, [(ex - 0.03, 1.66, zb - 0.03), (ex + 0.03, 1.66, zb - 0.03), (ex + 0.035, 1.42, zb - 0.02), (ex - 0.035, 1.42, zb - 0.02)], 112, 128, "y", 1)
        _blob(img, d, [(x - 0.19, 1.60, zb - 0.05), (x - 0.30, 1.585, zb - 0.06), (x - 0.30, 1.555, zb - 0.06), (x - 0.19, 1.54, zb - 0.05)], 138, 138, "x", 2)   # the muzzle in profile
        _blob(img, d, _oval(x - 0.305, 1.575, zb - 0.06, 0.02, 0.014), 24)         # the black nose


def chair(img: np.ndarray, d, x: float, z: float, turn: float = 0.0) -> None:
    """A bar-height leather CLUB chair, seen from behind and a little above.

    Drawn in PAINTER'S ORDER, far faces first, and only the faces the camera
    can see. The last attempt painted the seat interior and the far skirt
    straight through the back, so the model saw a translucent cone and drew a
    bowl. What the eye actually sees from here: the outer skin of the back and
    arms, wrapping round from the far arm to the near; the padded roll along
    the top, lit, with the top of the roll visible as a band; inside the roll a
    dark cavity (the seat is hidden below the sightline); a line of nailheads
    on the roll's seam; turned legs and a foot rail beneath.
    """
    R0, R1 = 0.26, 0.27                                  # no flare
    HB, ROLL, TOPW = 0.46, 0.045, 0.05                   # an upright back to mid-back height, a slim roll
    CEN = 1.5 * math.pi + turn                           # the sweep is centred on the camera side, then turned
    HALF = 1.30                                          # a back, not a tub: it wraps only a little past the sides
    SB = SEAT_H + 0.005                                  # the back SITS ON the seat: its leather ends at the cushion's top
    t0, t1 = CEN - HALF, CEN + HALF                      # the open side faces the bar
    N = 26
    ths = [t0 + (t1 - t0) * k / N for k in range(N + 1)]
    def top(th):                                         # high at the back, dropping to the arms
        u = abs(th - CEN) / HALF
        return SEAT_H + HB - 0.10 * u ** 1.6
    pt = lambda th, y, r: (x + r * math.cos(th), y, z + r * math.sin(th))

    for ang in sorted((0.7 + turn, 2.45 + turn, 3.85 + turn, 5.6 + turn), key=lambda a_: -math.sin(a_)):   # legs, far first
        c, s = math.cos(ang), math.sin(ang)
        lx, lz = x + 0.19 * c, z + 0.19 * s              # the leg's line, near vertical
        fx, fz = x + 0.20 * c, z + 0.20 * s
        lit = 84 if s > 0 else 54
        # A PLAIN LEG. The turned profile - block, bulb, foot - read as spindly and
        # odd from behind on every seed (founder, 2026-09-04). A straight,
        # slightly tapered square leg is what a modern club stool stands on.
        q = [(lx - 0.030, SEAT_H - 0.07, lz), (lx + 0.030, SEAT_H - 0.07, lz),
             (fx + 0.022, 0.0, fz), (fx - 0.022, 0.0, fz)]
        poly(d, q, 255)
        shade(img, q, lit + 24, lit - 16, "x")
        poly(d, q, None, 0, 2)
    for rr, yy, v in ((0.20, 0.27, 100), (0.20, 0.24, 54)):     # the foot rail
        poly(d, ring(x, yy, z, rr), None, 0, 1)
        shade(img, ring(x, yy, z, rr), v)

    # THE SEAT: a padded leather cushion the back stands on, drawn first. From
    # behind you see the back, then the cushion's 8 cm edge beneath it, then the
    # legs - the cushion's top shows only as a sliver past the arm ends.
    seat_t, seat_b = ring(x, SEAT_H, z, R0 + 0.02), ring(x, SEAT_H - 0.08, z, R0 + 0.02)
    d.polygon([P(*q) for q in seat_t], fill=255, outline=255)
    shade(img, seat_t, 66, 48, "x")                     # dark leather, a shade lighter than the back
    for i in range(len(seat_t)):
        j2 = (i + 1) % len(seat_t)
        if math.sin(2 * math.pi * (i + 0.5) / len(seat_t)) > 0.05:
            continue
        q = [seat_t[i], seat_t[j2], seat_b[j2], seat_b[i]]
        d.polygon([P(*v) for v in q], fill=255, outline=255)
        shade(img, q, 52 + 24 * (-math.cos(2 * math.pi * (i + 0.5) / len(seat_t))))
    poly(d, seat_t, None, 0, 2)
    near_s = [i for i in range(len(seat_t)) if math.sin(2 * math.pi * i / len(seat_t)) <= 0.05]
    for a_, b_ in zip(near_s, near_s[1:]):
        hand(d, P(*seat_b[a_]), P(*seat_b[b_]), 2)

    # the cavity inside the roll: the inner faces, in shadow. Drawn as the disc
    # the rim encloses; the near surfaces painted afterwards cover their share.
    cav = [pt(th, top(th), R1 - TOPW) for th in ths]
    d.polygon([P(*q) for q in cav], fill=255, outline=255)
    shade(img, cav, 30, 46, "y")

    # every strip of the outer skin, far ones first
    order = sorted(range(N), key=lambda k: -math.sin((ths[k] + ths[k + 1]) / 2))
    for k in order:
        a, b = ths[k], ths[k + 1]
        mid = (a + b) / 2
        facing = -math.cos(mid)                          # +1 faces the window, left
        v = 44 + 30 * facing + 40 * max(0.0, facing) ** 2   # smooth leather: a broad soft sheen, no hard band
        skin = [pt(a, top(a) - ROLL, R1), pt(b, top(b) - ROLL, R1),
                pt(b, SB, R0), pt(a, SB, R0)]   # down over the seat's side
        d.polygon([P(*q) for q in skin], fill=255, outline=255)
        _OWND.polygon([P(*q) for q in skin], fill=255)
        shade(img, skin, v, v * 0.78, "y")
        face = [pt(a, top(a), R1), pt(b, top(b), R1),
                pt(b, top(b) - ROLL, R1), pt(a, top(a) - ROLL, R1)]
        d.polygon([P(*q) for q in face], fill=255, outline=255)
        shade(img, face, min(190, v + 64))               # the roll, lit
        cap = [pt(a, top(a), R1), pt(b, top(b), R1),
               pt(b, top(b), R1 - TOPW), pt(a, top(a), R1 - TOPW)]
        d.polygon([P(*q) for q in cap], fill=255, outline=255)
        shade(img, cap, min(150, v + 34))                # its top: lit, not a white slab
    # contours: the rim's outer and inner edges, the roll seam, the skirt's foot
    for r_, dy in ((R1, 0.0), (R1 - TOPW, 0.0), (R1, -ROLL)):
        for k in range(N):
            hand(d, P(*pt(ths[k], top(ths[k]) + dy, r_)), P(*pt(ths[k + 1], top(ths[k + 1]) + dy, r_)), 2 if dy == 0 else 1)
    for k in range(N):                                   # the piped seam along the seat's underside
        hand(d, P(*pt(ths[k], SB, R0)), P(*pt(ths[k + 1], SB, R0)), 2)
    for th in (t0, t1):                                  # the arm ends
        hand(d, P(*pt(th, top(th), R1)), P(*pt(th, SB, R0)), 2)
    # No cushion band and no apron below the skin: from behind a club chair
    # shows leather down to the seat's underside, then its legs.
    # the arm-end faces, LIT: two bright verticals that cut the chair's silhouette
    # off the dark bar front behind it - without them the block-in merged into it
    # no separate arm-end faces: on every seed they rendered as pale planks.
    # The side of the back is a SEAM instead - where the arm's panel meets the
    # back's, stitched - which is what a club chair shows from the side.
    for th in (CEN - HALF * 0.55, CEN + HALF * 0.55):
        hand(d, P(*pt(th, top(th) - ROLL, R1)), P(*pt(th, SB, R0)), 2)
    # a centre seam down the back: leather is stitched, and a seam is a cue the
    # model reads as upholstery at any size
    hand(d, P(*pt(CEN, top(CEN) - ROLL, R1)), P(*pt(CEN, SB, R0)), 2)
    n = max(1, int((t1 - t0) * R1 / 0.032))              # nailheads every 3 cm, on the seam
    for k in range(n + 1):
        th = t0 + (t1 - t0) * k / n
        if math.sin(th) > 0.15:                          # only where the seam faces us
            continue
        px, py = P(*pt(th, top(th) - ROLL + 0.014, R1))
        d.ellipse((px - 3.2, py - 3.2, px + 3.2, py + 3.2), fill=0)
        img[int(py) - 2:int(py) + 2, int(px) - 2:int(px) + 2] = 240


def build(values: bool, enabled=None, force=()) -> Image.Image:
    reset_parts(enabled, force)
    img = np.full((H, W), 255.0, np.float32)
    line = Image.new("L", (W, H), 255)
    d = ImageDraw.Draw(line)

    LEFT, RIGHT = RETURN_X, 3.3
    part("ceiling")
    # the ceiling above the cornice, so the top of the frame is not bare paper
    # The ceiling is a CEILING: plain pale plaster, lit by the window, seen from
    # below. Drawn as a dark band it read as a shadow or a second cornice.
    shade(img, [(LEFT, CEILING, WALL_Z), (RIGHT, CEILING, WALL_Z),
                (RIGHT, CEILING + 1.2, WALL_Z), (LEFT, CEILING + 1.2, WALL_Z)], 212, 176, "x")

    part("back-wall")
    # ---- the back wall -------------------------------------------------------
    # Daylight arrives from the window at the left, so the wall falls away to the
    # right. One gradient across the whole wall, then the joinery on top of it.
    shade(img, [(LEFT, CEILING, WALL_Z), (RIGHT, CEILING, WALL_Z),
                (RIGHT, 0, WALL_Z), (LEFT, 0, WALL_Z)], 118, 44, "x")

    crown(img, d, CEILING, CORNICE_H, (LEFT, WALL_Z), (RIGHT, WALL_Z))
    panel_top = CEILING - CORNICE_H          # the panelling meets the crown

    for i, (a, b) in enumerate(plan_bays((RETURN_X, WALL_Z), (RIGHT, WALL_Z))):
        for lo, hi, w in tiers(panel_top):
            panel(img, d, a, b, lo, hi, 158 - i * 10, w)

    moulding(img, d, FRIEZE_RAIL, FRIEZE_RAIL + 0.055, (LEFT, WALL_Z), (RIGHT, WALL_Z), 152, 44)
    moulding(img, d, DADO_H - 0.10, DADO_H + 0.06, (LEFT, WALL_Z), (RIGHT, WALL_Z), 146, 40)
    moulding(img, d, 0.0, SKIRT_H, (LEFT, WALL_Z), (RIGHT, WALL_Z), 92, 30)

    # ---- the back bar, the set and the board ---------------------------------
    # ---- the cabinets, the ledge, then the carcass standing on it -------------
    zc = WALL_Z - LEDGE_DEPTH                            # the unit's front below the ledge
    part("cabinets")
    span = (BACKBAR_X[1] - BACKBAR_X[0]) / CABINET_DOORS
    for i in range(CABINET_DOORS):
        x0, x1 = BACKBAR_X[0] + span * i, BACKBAR_X[0] + span * (i + 1)
        v = 104 - i * 6
        door = [(x0, LEDGE_H - LEDGE_LIP, zc), (x1, LEDGE_H - LEDGE_LIP, zc), (x1, PLINTH_H, zc), (x0, PLINTH_H, zc)]
        poly(d, door, 255)
        shade(img, door, v, v * 0.7, "x")
        poly(d, door, None, 0, 2)
        m = 0.05                                          # its raised-and-fielded panel
        fld = [(x0 + m, LEDGE_H - LEDGE_LIP - m, zc), (x1 - m, LEDGE_H - LEDGE_LIP - m, zc),
               (x1 - m, PLINTH_H + m, zc), (x0 + m, PLINTH_H + m, zc)]
        shade(img, fld, v + 14, v - 10, "x")
        poly(d, fld, None, 0, 1)
        hand(d, P(x0 + m + 0.03, LEDGE_H - LEDGE_LIP - m - 0.03, zc), P(x1 - m - 0.03, LEDGE_H - LEDGE_LIP - m - 0.03, zc), 1)
        kx, ky = x1 - 0.07, (LEDGE_H + PLINTH_H) / 2 + 0.12
        knob = ring(kx, ky, zc, 0.012, 10)
        knob = [(q[0], q[1] + (q[2] - zc), zc) for q in knob]   # a disc facing the room
        poly(d, knob, 255)
        shade(img, knob, 200)
        poly(d, knob, None, 0, 1)
    plinth = [(BACKBAR_X[0], PLINTH_H, zc), (BACKBAR_X[1], PLINTH_H, zc), (BACKBAR_X[1], 0.0, zc), (BACKBAR_X[0], 0.0, zc)]
    poly(d, plinth, 255)
    shade(img, plinth, 42, 28, "x")
    poly(d, plinth, None, 0, 2)

    part("ledge")
    ltop = [(BACKBAR_X[0], LEDGE_H, WALL_Z), (BACKBAR_X[1], LEDGE_H, WALL_Z),
            (BACKBAR_X[1], LEDGE_H, zc), (BACKBAR_X[0], LEDGE_H, zc)]
    poly(d, ltop, 255)
    shade(img, ltop, 244, 220, "y")                      # pale marble, brightest at the back under the shelves
    poly(d, ltop, None, 0, 2)
    # THE EDGE: one thin square lip, one clean plane - the same 4 cm slab edge as
    # the main bar. Nothing is drawn beneath it: the eye stands above the ledge
    # and cannot see its underside, and the two dark bands that used to hang
    # under the lip rendered as a heavy rail (founder, 2026-09-05: "the straight
    # lines of the wall meeting the bartender's counter ... should look clean").
    # Its shadow on the wall below is a MULTIPLIER on the rendered panelling.
    nose = [(BACKBAR_X[0], LEDGE_H, zc), (BACKBAR_X[1], LEDGE_H, zc),
            (BACKBAR_X[1], LEDGE_H - LEDGE_LIP, zc), (BACKBAR_X[0], LEDGE_H - LEDGE_LIP, zc)]
    poly(d, nose, 255)
    shade(img, nose, 228, 196, "x")
    poly(d, nose, None, 0, 2)
    cast(img, [(BACKBAR_X[0], LEDGE_H - 0.005, WALL_Z), (BACKBAR_X[1], LEDGE_H - 0.005, WALL_Z),
               (BACKBAR_X[1], LEDGE_H - 0.30, WALL_Z), (BACKBAR_X[0], LEDGE_H - 0.30, WALL_Z)], 0.55, 1.0, "y")
    # THE STRAIGHT EDGES ARE INKED IN CODE after the render (room-part.py build reads
    # ink.json): the marble's meeting with the wall and both edges of its lip.
    for y_, z_ in ((LEDGE_H, WALL_Z), (LEDGE_H, zc), (LEDGE_H - LEDGE_LIP, zc)):
        INK.append({"part": "ledge", "width": 2, "value": 26, "points": [P(BACKBAR_X[0], y_, z_), P(BACKBAR_X[1], y_, z_)]})

    # ---- THE SHELF UNIT: variant C3-SLAB, thick floating slabs ---------------
    # The founder's three complaints (2026-09-05) and the three answers.
    #   "they look like they are a part of the wall"  ->  THICK, AND LIT LIKE
    #   SOLIDS. 12 cm posts and 8.5 cm slabs, every member turning a lit arris
    #   and a shadowed arris to the camera and casting a MULTIPLIED shadow on the
    #   panelling beside and beneath it. A member with a shadow is standing off a
    #   surface; a member without one is painted on it.
    #   "one of the dividers on the right side of the shelf is gone"  ->  the
    #   unit ENDS INSIDE THE FRAME. Its right cheek's front face lands at
    #   px 1085..1133 and the marble ledge runs on past it; and every post is
    #   placed by PROJECTED clearance from the wall's stiles, so none of them
    #   stands on the one thing that can swallow it.
    #   "the shelves dont look like they were built into the wall it just looks
    #   flat"  ->  HOUSED, AND DRAWN WITH DEPTH. A slab is drawn only in the
    #   clear bay BETWEEN two posts, with a hard housing line at each end; the
    #   posts run unbroken past it and their side faces are cut where it goes in.
    # And there is NO back, NO top rail and NOTHING in the compartments: the
    # wall's own panelling shows between the posts and runs on above their heads
    # to the frieze rail. Nothing is drawn in the openings, so nothing there
    # belongs to these parts' masks and there is nothing for the model to invent
    # a back panel, a picture or a screen in.
    # EVERY shadow this unit throws goes through cast(), inside the part that
    # throws it: a slab's shadow on the wall belongs to that slab, a post's to
    # the backbar. So masks/<part>.png hold members only - cheeks, dividers,
    # slab faces, arrises - and shadows/<part>.png hold the shading, and the
    # model is never handed a flat grey rectangle to render.
    zf, zb = WALL_Z - SHELF_DEPTH, WALL_Z

    part("backbar")
    for x0, x1 in upright_spans():
        post_shadow(img, x0, x1, zf, zb)

    # the slabs, in painter's order for THIS eye height: a shelf below the eye is
    # drawn before its bottles (they stand on its top); one above the eye after
    # (its front edge hides their feet)
    for name, sy, seed in (("shelf-lower", SHELF_YS[0], 11), ("shelf-upper", SHELF_YS[1], 23)):
        bname = "bottles-" + name.split("-")[1]
        def shelf(sy=sy, name=name):
            part(name)
            for bx0, bx1, cl, cr in shelf_bays():
                slab_bay(img, d, bx0, bx1, sy, zf, zb, cl, cr)
        def row(sy=sy, seed=seed, bname=bname):
            part(bname)
            bottles(img, d, sy, seed)
        if EYE > sy:
            shelf(); row()
        else:
            row(); shelf()

    part("backbar")
    # THE POSTS LAST. A slab's horizontal face runs on behind the post toward the
    # wall and the post is in front of that; drawn in the other order the slab
    # paints over the divider, which is precisely what the founder watched happen
    # to the one on the right.
    for x0, x1 in upright_spans():
        post(img, d, x0, x1, zf, zb)

    # The set and the board are BLANK. The joke fills them, so the base must not
    # invent a picture or a word - and the quads are written out below so the
    # paste lands on the real surface instead of a guessed rectangle.
    part("tv")
    slab(img, d, *TV_X, *TV_Y, WALL_Z - TV_DEPTH, WALL_Z, 22, 38)
    screen = [(TV_X[0] + 0.05, TV_Y[1] - 0.05, WALL_Z - TV_DEPTH),
              (TV_X[1] - 0.05, TV_Y[1] - 0.05, WALL_Z - TV_DEPTH),
              (TV_X[1] - 0.05, TV_Y[0] + 0.05, WALL_Z - TV_DEPTH),
              (TV_X[0] + 0.05, TV_Y[0] + 0.05, WALL_Z - TV_DEPTH)]
    shade(img, screen, 44, 30, "x")     # darker still: at this camera the set came back pale
    poly(d, screen, None, 0, 2)

    part("board")
    slab(img, d, *BOARD_X, *BOARD_Y, WALL_Z - BOARD_DEPTH, WALL_Z, 96, 124)
    board = [(BOARD_X[0] + 0.07, BOARD_Y[1] - 0.07, WALL_Z - BOARD_DEPTH),
             (BOARD_X[1] - 0.07, BOARD_Y[1] - 0.07, WALL_Z - BOARD_DEPTH),
             (BOARD_X[1] - 0.07, BOARD_Y[0] + 0.07, WALL_Z - BOARD_DEPTH),
             (BOARD_X[0] + 0.07, BOARD_Y[0] + 0.07, WALL_Z - BOARD_DEPTH)]
    shade(img, board, 34, 24, "x")
    poly(d, board, None, 0, 2)

    part("sconce-right")
    sconce(img, d, *SCONCES[1][1:])

    part("return-wall")
    # ---- the window wall, returning toward us --------------------------------
    # A WALL WITH A WINDOW IN IT IS BACKLIT, so its inner face is the DARKEST
    # surface in the room, not the lightest. Drawn pale, it merged with the
    # marble and the pair read as one continuous floor.
    # Only as far down as the counter: everything below is hidden behind it, and
    # drawing it anyway put a long diagonal straight through the marble.
    # The whole return, to the floor and right across: the window and the bar
    # are PARTS laid over it now, so the wall has to exist behind them.
    ret = [(RETURN_X, CEILING, WALL_Z), (RETURN_X, CEILING, RETURN_NEAR_Z),
           (RETURN_X, 0.0, RETURN_NEAR_Z), (RETURN_X, 0.0, WALL_Z)]
    shade(img, ret, 62, 26, "x")
    poly(d, ret, None, 0, 3)

    # The return is panelled too, on the same module and the same rails. Left as
    # a bare graded field it came back as blank paper on every seed: a large flat
    # area is exactly what the model bleaches. Joinery gives the tone something
    # to hang on, and the rails running round the corner are what make the two
    # walls read as one room. Values well below the back wall's - this face is
    # BACKLIT and is the darkest thing in the picture.
    # With the glass now running sill to cornice, the return keeps panelling
    # only on its PIERS - the wall left either side of the opening. Panelling
    # across the full return would draw its joinery straight over the window.
    for i, (a, b) in enumerate(plan_bays((RETURN_X, WALL_Z), (RETURN_X, RETURN_NEAR_Z))):
        for lo, hi, w in tiers(CEILING - CORNICE_H):
            panel(img, d, a, b, lo, hi, 58 - i * 3, w)
    # NO RAILS on the return. The dado ran from the corner along under the
    # window and the founder read it as a lip (2026-09-04); the window's own
    # frame is all the horizontal this wall needs. Skirting only.
    moulding(img, d, 0.0, SKIRT_H, (RETURN_X, WALL_Z), (RETURN_X, RETURN_NEAR_Z), 60, 20)
    crown(img, d, CEILING, CORNICE_H,
          (RETURN_X, WALL_Z), (RETURN_X, COUNTER_NEAR_Z), scale=0.58)

    part("floor")
    # The floor is BASE: the counter and the chairs stand on it as parts, so if
    # the bar is ever re-rolled shallower, what shows is floor and not paper.
    fl = [(RETURN_X, 0.0, WALL_Z), (RIGHT, 0.0, WALL_Z),
          (RIGHT, 0.0, RETURN_NEAR_Z), (RETURN_X, 0.0, RETURN_NEAR_Z)]
    shade(img, fl, 122, 66, "x")             # boards, lit from the window side
    poly(d, fl, None, 0, 2)
    for bx in np.arange(RETURN_X + 0.18, RIGHT, 0.18):   # boards run to the back wall
        hand(d, P(bx, 0.0, WALL_Z), P(bx, 0.0, RETURN_NEAR_Z), 1)

    part("window-frame")
    # the opening: the reveal is the wall's thickness, and it is what makes the
    # window read as a hole in a wall rather than a picture hung on it
    op = [(RETURN_X, WINDOW_HEAD, WINDOW_Z1), (RETURN_X, WINDOW_HEAD, WINDOW_Z0),
          (RETURN_X, WINDOW_SILL, WINDOW_Z0), (RETURN_X, WINDOW_SILL, WINDOW_Z1)]
    # the window sits IN FRONT of the wall's joinery in the line layer: clear the
    # whole extent of the frame first, or panel outlines show through the glass
    ext = [(RETURN_X, WINDOW_HEAD + ARCHITRAVE, WINDOW_Z1 + ARCHITRAVE),
           (RETURN_X, WINDOW_HEAD + ARCHITRAVE, WINDOW_Z0 - ARCHITRAVE),
           (RETURN_X, WINDOW_SILL - ARCHITRAVE, WINDOW_Z0 - ARCHITRAVE),
           (RETURN_X, WINDOW_SILL - ARCHITRAVE, WINDOW_Z1 + ARCHITRAVE)]
    if not _SKIP:
        d.polygon([P(*q) for q in ext], fill=255, outline=255)
    shade(img, op, 58, 34, "x")          # the reveal, deeper in shadow still
    poly(d, op, None, 0, 3)
    GZ0, GZ1 = WINDOW_Z0 + SASH, WINDOW_Z1 - SASH
    gl = [(RETURN_X + REVEAL, WINDOW_HEAD - SASH, GZ1), (RETURN_X + REVEAL, WINDOW_HEAD - SASH, GZ0),
          (RETURN_X + REVEAL, WINDOW_SILL + SASH, GZ0), (RETURN_X + REVEAL, WINDOW_SILL + SASH, GZ1)]
    # ONE pane, bar level to crown. I had put a transom on the frieze rail;
    # the founder wants the glass undivided, so it is undivided.
    part("glass")
    shade(img, gl, 252, 246, "x")            # the glass: the brightest thing in the room
    poly(d, gl, None, 0, 2)
    part("window-frame")
    sx = RETURN_X + REVEAL - 0.03
    # THE REVEAL, as surfaces. An opening whose thickness is only four lines is
    # a picture; one whose head is in shadow, whose far jamb is lit by the
    # daylight coming through, and whose inner sill catches it, is a hole in a
    # thick wall - which is what a window is.
    head = [(RETURN_X, WINDOW_HEAD, WINDOW_Z1), (RETURN_X, WINDOW_HEAD, WINDOW_Z0),
            (sx, WINDOW_HEAD, WINDOW_Z0), (sx, WINDOW_HEAD, WINDOW_Z1)]
    poly(d, head, 255)
    shade(img, head, 36, 52, "x")                        # the underside of the head, dark
    poly(d, head, None, 0, 1)
    jamb = [(RETURN_X, WINDOW_HEAD, WINDOW_Z1), (sx, WINDOW_HEAD, WINDOW_Z1),
            (sx, WINDOW_SILL, WINDOW_Z1), (RETURN_X, WINDOW_SILL, WINDOW_Z1)]
    poly(d, jamb, 255)
    shade(img, jamb, 196, 150, "y")                      # the far jamb, daylit
    poly(d, jamb, None, 0, 1)
    # no inner sill wedge: under the pane there is the sash rail and the architrave, nothing else (founder 2026-09-05: clean lines)
    for (z0, z1, y0, y1) in ((WINDOW_Z0, WINDOW_Z1, WINDOW_HEAD - SASH, WINDOW_HEAD),   # head
                             (WINDOW_Z0, WINDOW_Z1, WINDOW_SILL, WINDOW_SILL + SASH),   # bottom rail
                             (WINDOW_Z1 - SASH, WINDOW_Z1, WINDOW_SILL, WINDOW_HEAD),   # far stile
                             (WINDOW_Z0, WINDOW_Z0 + SASH, WINDOW_SILL, WINDOW_HEAD)):  # near stile
        q = [(sx, y1, z1), (sx, y1, z0), (sx, y0, z0), (sx, y0, z1)]
        poly(d, q, 255)
        shade(img, q, 78, 46, "y")
        poly(d, q, None, 0, 2)
    for k in range(4):   # the reveal's four returning edges, wall face to sash
        hand(d, P(*op[k]), P(sx, op[k][1], op[k][2]), 1)

    # THE FRAME. An opening with a reveal is a hole; a window is a hole with
    # joinery round it. A wide architrave on the room face of the wall, proud of
    # the panelling, its outer edge lit and its inner edge in shadow, and a deep
    # sill board projecting into the room with a bright top face. Without these
    # the street read as a mural painted on the wall.
    AW, PR = ARCHITRAVE, PROUD
    fx = RETURN_X + PR
    for (z0, z1, y0, y1, v) in (
            (WINDOW_Z0 - AW, WINDOW_Z1 + AW, WINDOW_HEAD, WINDOW_HEAD + AW, 96),   # head
            (WINDOW_Z1, WINDOW_Z1 + AW, WINDOW_SILL, WINDOW_HEAD, 84),             # far jamb
            (WINDOW_Z0 - AW, WINDOW_Z0, WINDOW_SILL, WINDOW_HEAD, 70),             # near jamb
            (WINDOW_Z0 - AW, WINDOW_Z1 + AW, WINDOW_SILL - AW, WINDOW_SILL, 104)):   # sill member
        q = [(fx, y1, z1), (fx, y1, z0), (fx, y0, z0), (fx, y0, z1)]
        shade(img, q, v, v * 0.62, "y")
        poly(d, q, None, 0, 2)
        inner = [(fx, y1 - 0.04, z1 - 0.04), (fx, y1 - 0.04, z0 + 0.04),
                 (fx, y0 + 0.04, z0 + 0.04), (fx, y0 + 0.04, z1 - 0.04)]
        poly(d, inner, None, 0, 1)         # the architrave's own moulded step
    # No projecting sill board. It ran the length of the window as a bright
    # ledge and the founder read it as a lip; the architrave's bottom member is
    # the sill now, flush with the rest of the frame.

    part("sconce-left")
    sconce(img, d, *SCONCES[0][1:])

    part("counter")
    # ---- the counter ---------------------------------------------------------
    # the counter runs out of frame at both ends: far enough left to pass behind
    # the window wall, far enough right to leave the picture
    CL, CR = RETURN_X, RIGHT                # the counter ENDS at the window wall
    top = [(CL, COUNTER_H, COUNTER_FAR_Z), (CR, COUNTER_H, COUNTER_FAR_Z),
           (CR, COUNTER_H, COUNTER_NEAR_Z), (CL, COUNTER_H, COUNTER_NEAR_Z)]
    # A MODERN marble bar is a thin polished slab with a clean square edge - the
    # 7.5 cm moulded nosing rendered as a padded bolster (founder, 2026-09-05).
    lip = [(CL, COUNTER_H, COUNTER_NEAR_Z), (CR, COUNTER_H, COUNTER_NEAR_Z),
           (CR, COUNTER_H - 0.04, COUNTER_NEAR_Z), (CL, COUNTER_H - 0.04, COUNTER_NEAR_Z)]
    front = [(CL, COUNTER_H - 0.04, COUNTER_NEAR_Z), (CR, COUNTER_H - 0.04, COUNTER_NEAR_Z),
             (CR, 0, COUNTER_NEAR_Z), (CL, 0, COUNTER_NEAR_Z)]
    # The counter stands in FRONT of the wall, so it has to occlude the wall's
    # joinery in the line layer as well as in the values. Without this the lower
    # panels' outlines come through the marble as stray scratches - they were
    # already there, faintly, on every plate.
    for q in (top, lip, front):
        d.polygon([P(*pt) for pt in q], fill=255, outline=255)
    shade(img, top, 244, 222, "y")          # pale polished marble, brightest at the far edge
    poly(d, top, None, 0, 3)
    shade(img, lip, 226, 190, "y")          # the slab's edge face: one clean plane
    poly(d, lip, None, 0, 2)
    for y_, z_ in ((COUNTER_H, COUNTER_FAR_Z), (COUNTER_H, COUNTER_NEAR_Z), (COUNTER_H - 0.04, COUNTER_NEAR_Z)):
        INK.append({"part": "counter", "width": 2, "value": 26, "points": [P(CL, y_, z_), P(CR, y_, z_)]})
    shade(img, front, 74, 40, "x")          # in its own shadow, and it is NOT a wall
    poly(d, front, None, 0, 3)
    # A PLAIN front. The panelled bar front read as a run of cupboard doors under
    # the main bar (founder, 2026-09-05); a modern bar front is one smooth face
    # of walnut with a dark plinth at the floor.
    plinth = [(CL, 0.10, COUNTER_NEAR_Z), (CR, 0.10, COUNTER_NEAR_Z), (CR, 0.0, COUNTER_NEAR_Z), (CL, 0.0, COUNTER_NEAR_Z)]
    shade(img, plinth, 34, 24, "x")
    hand(d, P(CL, 0.10, COUNTER_NEAR_Z), P(CR, 0.10, COUNTER_NEAR_Z), 2)
    grain(img, [(CL, COUNTER_H - 0.06, COUNTER_NEAR_Z), (CR, COUNTER_H - 0.06, COUNTER_NEAR_Z),
                (CR, 0.12, COUNTER_NEAR_Z), (CL, 0.12, COUNTER_NEAR_Z)], 6.0, 4242)

    for name, sx, turn in zip(("chair-left", "chair-right"), STOOL_XS, STOOL_TURN):
        part(name)
        if not _SKIP:
            chair(img, d, sx, STOOL_Z, turn)
    for name, who, sx, ch in zip(("figure-drew", "figure-barclay"), ("drew", "barclay"), STOOL_XS, ("chair-left", "chair-right")):
        part(name)
        if not _SKIP:
            figure(img, d, who, sx, STOOL_Z)
            # the sitter is INSIDE the chair: the chair's back stands in front of his
            # body, so his own silhouette is cut to what shows above and beside it
            if ch in _OWN and name in _OWN:
                fig = np.asarray(_OWN[name], dtype=np.uint8) > 127
                sit = np.asarray(_OWN[ch], dtype=np.uint8) > 127
                _OWN[name] = Image.fromarray(((fig & ~sit) * 255).astype(np.uint8))
                _OWND = ImageDraw.Draw(_OWN[name])

    lamplight(img)
    ln = np.asarray(line, dtype=np.float32)
    if not values:
        return Image.fromarray(np.clip(ln, 0, 255).astype(np.uint8))
    out = np.minimum(img, ln)               # the construction lines sit on the values
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="canon/room-kit/v2")
    a = ap.parse_args()
    out = Path(__file__).resolve().parent.parent / a.out
    out.mkdir(parents=True, exist_ok=True)
    quad = lambda pts: [[round(v, 1) for v in P(*q)] for q in pts]
    zf = WALL_Z - TV_DEPTH
    (out / "quads.json").write_text(json.dumps({
        "_doc": "Measured in scripts/draw-room-lines.py. The TV and the board are "
                "not square to the camera, so a paste has to be warped onto THESE "
                "corners - clockwise from top-left. Regenerate whenever the camera "
                "or the fixtures move.",
        "screenQuad": quad([(TV_X[0] + 0.05, TV_Y[1] - 0.05, zf), (TV_X[1] - 0.05, TV_Y[1] - 0.05, zf),
                            (TV_X[1] - 0.05, TV_Y[0] + 0.05, zf), (TV_X[0] + 0.05, TV_Y[0] + 0.05, zf)]),
        "boardQuad": quad([(BOARD_X[0] + 0.07, BOARD_Y[1] - 0.07, WALL_Z - BOARD_DEPTH),
                           (BOARD_X[1] - 0.07, BOARD_Y[1] - 0.07, WALL_Z - BOARD_DEPTH),
                           (BOARD_X[1] - 0.07, BOARD_Y[0] + 0.07, WALL_Z - BOARD_DEPTH),
                           (BOARD_X[0] + 0.07, BOARD_Y[0] + 0.07, WALL_Z - BOARD_DEPTH)]),
        "windowQuad": quad([(RETURN_X + REVEAL, WINDOW_HEAD - SASH, WINDOW_Z1 - SASH),
                            (RETURN_X + REVEAL, WINDOW_HEAD - SASH, WINDOW_Z0 + SASH),
                            (RETURN_X + REVEAL, WINDOW_SILL + SASH, WINDOW_Z0 + SASH),
                            (RETURN_X + REVEAL, WINDOW_SILL + SASH, WINDOW_Z1 - SASH)]),
    }, indent=2), encoding="utf8")
    build(False).save(out / "00-lines.png")
    build(True).save(out / "01-values.png")
    (out / "ink.json").write_text(json.dumps([{**e, "points": [[round(x, 1), round(y, 1)] for x, y in e["points"]]} for e in INK]), encoding="utf8")
    # A VALUES IMAGE PER PART. The block-in a part is rendered from must never
    # contain what stands in front of it: the counter's block-in once carried the
    # chairs' silhouette and the model drew a chair back into the bar
    # (2026-09-05). Each part is drawn with only the ENABLED parts behind it
    # and itself - forced on if it is switched off, so it can still be rendered.
    (out / "values").mkdir(exist_ok=True)
    for i, name in enumerate(LAY_ORDER):
        behind = [p for p in LAY_ORDER[:i] if p not in DISABLED]
        build(True, list(BASE_PARTS) + behind + [name], force=(name,)).save(out / "values" / f"{name}.png")
    # MASKS from a build with every part forced on: a switched-off object keeps
    # its full silhouette on disk, so it can be cut as a sticker, previewed or
    # rendered without switching it on in the plate.
    build(True, None, force=tuple(LAY_ORDER))
    masks = part_masks()                      # every part, base ones included
    (out / "masks").mkdir(exist_ok=True)
    for name in set(LAY_ORDER) | set(BASE_PARTS):
        m = masks.get(name, np.zeros((H, W), bool))
        Image.fromarray((m * 255).astype(np.uint8)).save(out / "masks" / f"{name}.png")
    shadows = part_shadows()                  # from the same everything-on build
    (out / "shadows").mkdir(exist_ok=True)
    for name, f in shadows.items():
        Image.fromarray((np.clip(f, 0.0, 1.0) * 255).astype(np.uint8)).save(out / "shadows" / f"{name}.png")
    build(True, BASE_PARTS).save(out / "01-values-base.png")
    # the manifest: keep any approvals already recorded
    mp = out / "parts.json"
    old = json.loads(mp.read_text(encoding="utf8")) if mp.exists() else {}
    prev = {q["id"]: q for q in old.get("parts", [])}
    manifest = {
        "_doc": "Written by scripts/draw-room-lines.py. The base is the architecture only; "
                "every other part is rendered against the finished plate and laid back "
                "through its mask by scripts/room-part.py. Masks are exact visible pixels, "
                "stamped as the construction was drawn. Regenerate after any geometry change.",
        "base": {"parts": list(BASE_PARTS), "values": "01-values-base.png", "prompt": "08-base.prompt.txt",
                 "masks": {n: f"masks/{n}.png" for n in BASE_PARTS if n in masks},
                 "source": old.get("base", {}).get("source")},
        "parts": [{
            "id": n, "mask": f"masks/{n}.png", "note": PART_NOTES.get(n, n),
            "mode": "full", "feather": 3, "toneMatch": n not in ("glass", "counter", "tv", "board", "backbar", "shelf-lower", "shelf-upper", "cabinets", "ledge"),
            "enabled": n not in DISABLED,
            "values": "01-values-street.png" if n == "glass" else f"values/{n}.png",
            "shadow": f"shadows/{n}.png" if n in shadows else None,
            "prompt": "07-street.prompt.txt" if n == "glass" else "05-render-from-values.prompt.txt",
            "source": prev.get(n, {}).get("source"),
        } for n in LAY_ORDER],
    }
    mp.write_text(json.dumps(manifest, indent=2), encoding="utf8")
    print(f"  {len(masks)} part masks, base = {', '.join(BASE_PARTS)}")
    cn, cf = P(0, COUNTER_H, COUNTER_NEAR_Z)[1], P(0, COUNTER_H, COUNTER_FAR_Z)[1]
    print(f"wrote {a.out}/00-lines.png and 01-values.png")
    print(f"  {len(bays())} equal bays of {BAY_W*100:.0f}cm, stile {STILE_W*100:.1f}cm")
    print(f"  counter top {COUNTER_H*100:.0f}cm high, {COUNTER_DEPTH*100:.0f}cm deep "
          f"-> reads y {cf:.0f}..{cn:.0f} ({cn-cf:.0f}px band)")
    print(f"  camera eye {EYE*100:.0f}cm, back wall {WALL_Z:.1f}m away")
