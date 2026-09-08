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
# ------------------------------------------------- I1-FLUSH: the inlaid unit
# The founder, 2026-09-08: "i dont like the shelf now that i see what you
# pointed out we need a inlaid shelf that has 2 rows of bottle and then an area
# to make drinks below it on the bartenders bar make sure it looks inlaid into
# the wall dont messup the walls look or carry the walls look into the shelf".
#
# So the unit stops being a carcass STANDING ON the ledge. It is a HOLE cut into
# the panelling with a slim flat band round it, and four things follow:
#
#   FLUSH.  The face frame lies IN the wall plane, ZF_REC = WALL_Z. Nothing is
#           proud of the panelling, so the unit throws NOTHING on the wall
#           outside it and the wall is not disturbed, only cut - which is what
#           "dont messup the walls look" asks for. What makes the frame read is
#           its tone and a joint line at each edge, nothing else.
#   ITS OWN MATERIAL.  The lining is plain vertical walnut boards at ZB_REC,
#           quiet and a little darker than the wall, with NO raised-and-fielded
#           panels: "dont ... carry the walls look into the shelf". And a dark
#           rectangle inside a frame renders as a picture or a switched-off
#           screen, so the interior is given real texture - ten wide boards, a
#           joint between each, grain in every one - and both rows of bottles
#           stand IN FRONT of it. It is never handed over empty.
#   TWO ROWS.  Two 3 cm boards, 0.49 m and 0.39 m clear: both well over the
#           0.33 m a standing bottle needs.
#   THE DRINKS AREA.  The marble ledge runs on underneath as the bartender's
#           bar, and between the marble and the bottom of the opening the WALL'S
#           OWN PANELLING is the back of it. Round 3 deleted the plain band this
#           unit used to draw there: see FRAME_Y below.
RECESS_D = 0.40                 # how far the recess is cut back into the wall.
                                # 0.40 turns a 39.6 px left reveal at this
                                # camera; the right reveal is edge-on whatever
                                # this number is - see RIGHT_ARRIS
ZF_REC = WALL_Z                 # THE FACE FRAME IS FLUSH. No architrave, no
                                # proud member, no cast shadow on the panelling
ZB_REC = WALL_Z + RECESS_D      # the lining, at the back of the cut
FACE_W = 0.085                  # the face frame: ONE slim flat band, 8.5 cm.
                                # 24.9 px down its left side, 31.3 px down its
                                # right, 28.0 px top and bottom - every side
                                # over the 20 px under which a member vanishes.
                                # 6 cm would have been 18 px on the left
RECESS_Y = (1.32, 2.23)         # the opening: bottom, head. The head came DOWN
                                # 3 cm in round 3. The bare wall over the frame
                                # was quoted as 34.6 rows, but that was one
                                # subtraction taken at the MIDDLE column: the
                                # frieze rail runs 31 rows downhill from the
                                # right of the opening to the left and the
                                # frame's top edge runs downhill with it, so the
                                # gap has to be measured column by column
                                # against 01-values-base.png. Measured that way
                                # it was 29 px at its worst against the mask and
                                # 22 px against the footprint the conditioning
                                # actually lays (the mask grown 4 and feathered
                                # 1.5) - under the 25 px the wall needs to read
                                # as wall. 3 cm is 8 px here and buys both back.
                                # The opening shrinks from the TOP ONLY: both
                                # boards stay where they are and the upper
                                # compartment still clears 0.36 m, well over the
                                # 0.33 a standing bottle needs
FRAME_Y = (RECESS_Y[0] - FACE_W, RECESS_Y[1] + FACE_W)
# THERE IS NO SPLASHBACK. The unit stops dead at FRAME_Y[0] - the frame's outer
# bottom edge - and the WALL'S OWN PANELLING runs on untouched from there down to
# the marble at LEDGE_H. The plain band this unit used to draw in that gap was
# not "inlaid", it was a patch: 53,161 px of finished panelling re-rendered over
# 91 rows, and it ran into the marble ledge's own mask on the way down. An inlaid
# unit cuts the wall and stops; it does not repaint the wall under itself.
SHELF_T = 0.03                  # the founder's 3 cm board. 9.8 px of front edge
                                # is UNDER the 20 px rule, so the thickness is
                                # not asked to carry the shelf on its own: the
                                # lower board reads as a lit 8.6 px top face
                                # over a dark 9.8 px edge, the upper as a lit
                                # 9.8 px edge over 3.4 px of underside and 30 px
                                # of its own cast shadow. ONE member each way,
                                # never three hairlines stacked
SHELF_YS = (1.35, 1.87)         # TOP of each board. The lower board IS the
                                # floor of the recess - nothing is left under it
                                # for the model to read as an empty dark field -
                                # and the upper one is 0.17 m ABOVE the eye, so
                                # its underside shows. Anything within 0.15 m of
                                # EYE 1.70 projects edge-on and reads as a line
BOARD_W = 0.235                 # one board of the lining: 68 px at the left of
                                # the opening, 84 px at the right. EIGHT across,
                                # so the seven joints are 68-84 px apart. At
                                # 14.5 cm the joints came out 40 px apart and the
                                # lining read as reeding; at 19 cm they were
                                # 53-64 and ten boards each carrying up to four
                                # narrow hearts put it back there (founder,
                                # 2026-09-08: "clean up the wood grain around the
                                # shelf"). Wider boards are ALSO what a polished
                                # walnut lining is made of: two fewer joints, two
                                # fewer sets of figure, and the vertical
                                # repetition down 20 per cent
BOARD_JOINT = 0.006             # the joint between two boards: 1.7-2.0 px on
                                # the page, and never wider. It was 0.018 (5 px)
                                # with a hand() line ruled down the middle of it
                                # at value 0, and those nine lines ran the full
                                # height of the recess as black wires straight
                                # across both bottle rows. The boards keep their
                                # pitch (53-63 px) and their alternating tones -
                                # only the joint got thin, and it stopped being
                                # ink
JOINT_K = 0.86                  # AND IT STOPPED BEING A VALUE. The joint and the
GRAIN_K = 0.91                  # figure are MULTIPLIERS on the board's own tone
FIGURE_DROP = 14.0              # now, k 0.86, floored so that neither can take a
                                # board more than 14 below ITSELF AT THAT PIXEL
                                # - not below the board's nominal tone, which
                                # pins the floor above the board's own shaded
                                # edge and leaves a joint landing there one
                                # value deep instead of twelve. Nothing inside
                                # the recess is written as an absolute value
                                # except the boards: at the lining's tone
                                # (84-118) grain()'s additive heart line lands in
                                # the 60s and prints as a wire, and a hand() line
                                # prints as a wire at 0 whatever the board under
                                # it is doing. A multiplier cannot do either -
                                # it is the same rule cast() has always followed
# THE TWO PITCHES walnut is drawn at. Same construction (_figure_field), same
# narrow-deep-heart idea, different scale - and the difference is the whole of
# the founder's "clean up the wood grain around the shelf" (2026-09-08).
#   THE WALL, unchanged and not to be changed: its panel fields are already in
#         the approved plate. Two to three cycles across a 90 px field and two
#         to four hearts 0.030 of it wide - 2.7 px - is cathedral grain on a
#         lit panel.
#   THE LINING, new: UNDER ONE CYCLE across a board, ONE OR TWO hearts, each
#         0.095 of the board wide (6-8 px of sigma). Polished walnut with sparse
#         soft figure. At the wall's numbers ten boards carried up to forty
#         narrow near-vertical marks across the opening and the recess read as
#         REEDING - the one thing the prompt has forbidden all along.
GRAIN_FREQS = ((1.0, 1.7, 0.14), (2.1, 3.0, 0.07))
GRAIN_HEARTS, GRAIN_HEART_W = (2, 4), 0.030
LINING_FREQS = ((0.28, 0.52, 0.10), (0.62, 0.95, 0.05))
LINING_HEARTS, LINING_HEART_W = (1, 3), 0.095
LINING_V = (74.0, 60.0)         # the lining's tone, left to right - AND IT WENT
                                # DOWN 44 (critic, 2026-09-08: "clear glass sits
                                # ON the lining"). At 118-84 it ran through the
                                # same values as a clear bottle's liquid and the
                                # row read as a pattern painted on the back of
                                # the box. At 60-74 it is what the back of a box
                                # is - the darkest large field inside the frame -
                                # and both materials clear it, the clear glass
                                # from above and the dark spirits from below.
                                # The wall's panel fields in the same bays read
                                # about 130-155, so the interior now sits ~80
                                # under the wall: a cut, and never a hole, since
                                # its boards, joints and figure all survive
FRAME_V = (186.0, 150.0)        # the flat band, left to right. It has to clear
                                # the panel fields it is cut into by enough to
                                # be a band and not a patch: measured on
                                # 01-values.png it runs 26 over the wall on the
                                # left and 20 on the right, and still sits below
                                # the panels' own lit surrounds (~198), so it
                                # reads as one quiet polished band of walnut and
                                # never as another moulding
HEAD_SHADE = 0.17               # what the head throws down the lining
REVEAL_SHADE = 0.22             # and what the left reveal throws across it
SHADOW_GAP = 0.009              # 3 px of clearance between a member's edge and
                                # the first row of the shadow it throws. PIL
                                # rasterises a polygon inclusively, so a shadow
                                # that starts on the member's own edge shares
                                # 1-2 px with its mask - and the assembler would
                                # multiply the member's render by its own shadow
                                # along that seam
SHELF_SHADOW = 0.12             # the upper board's shadow on the lining: 36 px
BOTTLE_Z = WALL_Z + 0.16        # where a bottle stands: 16 cm back from the
                                # face, 24 cm in front of the lining. Far enough
                                # in that the frame reads in front of the row,
                                # near enough out that no bottle is swallowed by
                                # the left reveal and none is cut by the frame
RIGHT_ARRIS = 0.012             # the right reveal stands 0.19 m from the
                                # camera's own x and projects to 5 px - edge-on.
                                # It is drawn as ONE lit arris on the opening's
                                # right edge instead of as a plane of its own,
                                # because a 5 px plane is not a plane, it is
                                # what a collapsed member looks like
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

# ---------------------------------------------------------------- the poses
# WHERE ABBY STANDS. The bible puts her "on the far service side, DIRECTLY
# ACROSS THE MARBLE from the two seated gentlemen", with "the counter's far
# edge crossing her at the waist". Solved, that is z = 2.00: her waist (y 1.02)
# lands on page row 1175 and the marble's far edge on row 1177, so the counter
# crosses her exactly where the bible says it does. She is BETWEEN them in x,
# but at 0.66 rather than the midpoint 0.87 - at 0.87 her head projects to
# px 773 and sits straight on the shelf unit's divider (px 742..784, the one
# the founder has already watched go missing once). At 0.66 her head is at
# px 656, clear of it by 32 px, and still reads as centred between the chairs.
ABBY_X, ABBY_Z = 0.66, 2.00
ABBY_CROWN = 1.76       # she stands and they sit, so her head must be HIGHER in
                        # the frame than either of theirs: crown row 751 against
                        # Barclay's 775 and Drew's 828

# THE POSE SET, from CAST-PLAN.md. Three numbers per pose and everything else
# is derived from them (figure() below). Body yaw, head yaw and pitch are the
# plan's own, unrounded; `hand` is where the near hand comes to rest ON the
# marble (COUNTER_H 1.07, the top running z 1.146..1.766); `occluder` is the
# part that stands in front of this one and cuts its silhouette.
POSES = {
    "figure-drew-01-rest": dict(
        who="drew", body=146, head=132, pitch=56, iris=(0.002, -0.006),
        at=(STOOL_XS[0], STOOL_Z + 0.03), hand=(0.740, 1.090, 1.300),
        occluder="chair-left"),
    "figure-drew-02-toward": dict(
        who="drew", body=146, head=118, pitch=42, iris=(0.007, 0.000),
        at=(STOOL_XS[0], STOOL_Z + 0.03), hand=(0.740, 1.090, 1.300),
        occluder="chair-left"),
    "figure-barclay-01-rest": dict(
        who="barclay", body=-144, head=-130, pitch=34,
        at=(STOOL_XS[1], STOOL_Z + 0.03), hand=(1.050, 1.090, 1.320),
        occluder="chair-right"),
    "figure-barclay-02-toward": dict(
        who="barclay", body=-144, head=-118, pitch=26,
        at=(STOOL_XS[1], STOOL_Z + 0.03), hand=(1.050, 1.090, 1.320),
        occluder="chair-right"),
    "figure-abby-01-ledge": dict(
        who="abby", body=-22, head=-34, pitch=10,
        at=(ABBY_X, ABBY_Z), hand=(0.860, 1.090, 1.660),
        occluder="counter"),
}

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


def _solve(f, target: float, lo: float, hi: float) -> float:
    """Bisect for the world x whose PROJECTION lands on a page column.

    Every number the founder and the critics argue about is in pixels and every
    number this file is written in is in metres. Solving rather than guessing is
    what keeps the unit's right-hand end inside the frame.
    """
    for _ in range(90):
        m = (lo + hi) / 2
        if f(m) < target:
            lo = m
        else:
            hi = m
    return round((lo + hi) / 2, 4)


# WHERE THE CUT STARTS AND STOPS, solved in pixels and kept in metres.
#   LEFT  outer edge at page 468. The corner stile is built 352.6..389.4 and
#         renders about 24 px further right, so 468 leaves ~55 px of clean lit
#         panel between the wall's own stile and the band - the band can never
#         merge into it.
#   RIGHT outer edge at page 1146. The stile at world 1.78 begins at 1187.2, so
#         the unit stops 41 px clear of it AND 44 px inside the 1190 px line
#         beyond which the frame cuts an object and the model re-imagines it.
# The two stiles at world 0.06 and 0.92 fall INSIDE the opening and are simply
# cut away by it - which is what an inlaid unit does to the panelling it is let
# into. They run on above the frame and below it, untouched.
FRAME_X = (_solve(lambda v: P(v, EYE, ZF_REC)[0], 468.0, -1.6, 1.0),
           _solve(lambda v: P(v, EYE, ZF_REC)[0], 1146.0, 0.5, 3.0))
RECESS_X = (FRAME_X[0] + FACE_W, FRAME_X[1] - FACE_W)


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
DISABLED = (("sconce-left", "sconce-right",
             "cabinets") + tuple(POSES))   # I1-FLUSH: BOTH BOTTLE ROWS ARE ON.
                                                 # An inlaid unit with empty shelves is a
                                                 # framed dark field, and the model renders
                                                 # one of those as a picture or a screen   # the chairs are ON in this copy: a seated
                                                 # pose has to be cut by the leather that
                                                 # stands in front of it, so the chair must
                                                 # be drawn to have a mask to cut with.
                                                 # Every pose stays OFF until the founder
                                                 # passes the staging (STEP 2).
                                                 # bottles later; the left lamp removed
                                                 # bottles later. Still parts; just off.
# THE POSTS LAY LAST of the three. A slab is housed BETWEEN two posts, so the
# only pixels the parts could compete for are the sliver of a slab's horizontal
# face that runs on behind a post toward the wall - and there the post is in
# front. Laying the carcass first is what let a slab's render creep over a
# divider and take it off the page.
LAY_ORDER = (("cabinets", "ledge", "backbar", "shelf-lower", "bottles-lower",
              "bottles-upper", "shelf-upper", "tv", "board", "sconce-left", "sconce-right",
              "window-frame", "glass", "counter", "chair-left", "chair-right")
             + tuple(POSES))   # every pose AFTER the chairs: its own values block-in is
                               # then drawn with the chair already standing behind it
PART_NOTES = {
    "figure-drew-01-rest": "DREW-01 REST / LISTENING DOWN. Drew - the white-plumed anthropomorphic flamingo in a V-neck knitted sweater vest, crisp white turned-down collar and small solid-black silk bow tie - SEATED IN THE LEFT-HAND CHAIR AT THE MARBLE COUNTER, SEEN FROM BEHIND AND SLIGHTLY TO HIS RIGHT: body turned 146 degrees from the lens so his right shoulder is toward us and the chair back stands in front of him, head yaw 132 degrees and THE HEAD CARRIED DOWN, the line from the centre of his eye to the black tip of his bill lying 56 degrees below horizontal. His eye is on his own martini on its coaster; the lid is heavy and THE BILL IS CLOSED. One neck reversal, the head forward of where the neck left the body. Near feathered hand on the marble at the martini stem. Shoulders 1.32 m, crown 1.65 m on a 0.76 m seat. Cropped at the counter: chest-up, no legs, no stools. He is a PATRON on the room side of the marble. He never looks at us.",
    "figure-drew-02-toward": "DREW-02 TURNED TO BARCLAY, HEAD UP - the anchor pose. Drew SEATED IN THE LEFT-HAND CHAIR AT THE MARBLE COUNTER, SEEN FROM BEHIND AND SLIGHTLY TO HIS RIGHT - body turned 146 degrees from the lens so his right shoulder is toward us and the chair back stands in front of him - HIS HEAD TURNED BACK AND ACROSS TO BARCLAY IN THE RIGHT-HAND CHAIR: head yaw 118 degrees, and THE HEAD IS CARRIED UP, the line from the centre of his eye to the black tip of his bill lying 42 degrees below horizontal. His eye slides sideways at Barclay's face; the bill is CLOSED, a slender even-taper wedge whose BLACK OUTER THIRD IS THE OUTLINE with one bright highlight ribbon inside it. One neck reversal, the head carried forward of where the neck left the body. Near hand on the martini stem, at least three digits closed on it and one crossing in front. Shoulders 1.32 m, crown 1.65 m on a 0.76 m seat. Cropped at the counter: chest-up, no legs, no stools. He never looks at us.",
    "figure-barclay-01-rest": "BARCLAY-01 REST / LISTENING. Barclay - the golden retriever in a dark suit jacket over a pale open-collared shirt, no tie - SEATED IN THE RIGHT-HAND CHAIR AT THE MARBLE COUNTER, SEEN FROM BEHIND AND SLIGHTLY TO HIS LEFT: body turned -144 degrees from the lens so his left shoulder is toward us, head yaw -130 degrees, the line from eye-centre to nose tip 34 degrees below horizontal. MOUTH CLOSED WITH THE CORNER HOOK UP, brows up with one faint forehead crease, lids clear of the dark; the black lip band a FINE LINE running two nose-widths to under the front corner of the eye. One full drop ear on the near side, the far ear a tuft at most. Both fur-backed hands on the marble round the old fashioned. Shoulders 1.36 m, crown 1.71 m on a 0.76 m seat. Cropped at the counter: chest-up, no legs, no stools. He never looks out of the panel.",
    "figure-barclay-02-toward": "BARCLAY-02 TURNED TO DREW - the second anchor. Barclay SEATED IN THE RIGHT-HAND CHAIR AT THE MARBLE COUNTER, SEEN FROM BEHIND AND SLIGHTLY TO HIS LEFT - body turned -144 degrees from the lens - HIS HEAD TURNED BACK AND ACROSS TO DREW IN THE LEFT-HAND CHAIR: head yaw -118 degrees, the line from eye-centre to nose tip 26 degrees below horizontal. NEAR-PROFILE TO THREE-QUARTER, WITH BOTH EYES DRAWN AND WHOLE, the far one at least half the width of the near one, and the black lip band still running its full two nose-widths to under the front corner of the near eye as the head comes round. MOUTH CLOSED, CORNER UP. One full drop ear on the near side rooting level with the top of the eye and finishing level with the bottom of the jaw; the far ear a tuft. Both fur-backed hands on the marble round the old fashioned. Shoulders 1.36 m, crown 1.71 m on a 0.76 m seat. Cropped at the counter: chest-up, no legs, no stools.",
    "figure-abby-01-ledge": "ABBY-01 NEUTRAL AT THE LEDGE. Abby - the West Highland terrier proprietor, round soft show-groomed westie head with NO PROJECTING MUZZLE, her big black nose sitting DIRECTLY UNDER HER EYES, two small pricked ears both up, a studded leather collar with one teardrop gem, a fitted light blouse open two buttons with the sleeves rolled back - STANDING ON THE FAR SERVICE SIDE, DIRECTLY ACROSS THE MARBLE FROM THE TWO SEATED GENTLEMEN, body turned -22 degrees into the frame toward them, head yaw -34 degrees and looking DOWN at them, the line from eye-centre to nose tip 10 degrees below horizontal - she stands while they sit, so her head is HIGHER in the frame than either of theirs. BOTH EYES ARE DRAWN, the far one at least half the width of the near one. A warm closed-lip smile, corners clearly up. One hand closed on a working object on the marble; the towel over her LEFT shoulder and her hands empty of it. THE COUNTER'S FAR EDGE CROSSES HER AT THE WAIST AND HIDES HER BELOW IT - she is COVERED BY the counter, never covering it, and the back bar's ledge and shelves stand BEHIND her. Nothing on her is lettered. She is looking at the gentlemen, never out of the panel.",
    "cabinets": "the cabinets under the back bar's working ledge: a run of panelled walnut cupboard doors, each a raised-and-fielded panel with a small brass knob, down to a plinth",
    "ledge": "the back bar's working ledge: a marble-topped counter at waist height running the width of the unit, its polished top pale and veined, its front a slim moulded marble edge, its back flush into the cabinet - empty, nothing standing on it",
    "backbar": "the back bar's INLAID RECESS: a wide rectangular opening CUT INTO the panelled walnut wall above the marble ledge, its face frame ONE slim FLAT walnut band lying FLUSH with the panelling - no architrave, no bolection, no bead, nothing standing proud of the wall, just a plain flat band with a fine dark joint line where it meets the panelling - and the inside of the cut LINED WITH PLAIN VERTICAL WALNUT BOARDS, quiet, close-grained, a little darker and calmer than the wall, with NO raised-and-fielded panels, NO mouldings and NO frame inside the frame; a deep dark soffit across its head, the left reveal returning back into the wall in shadow, a bright arris down the right-hand edge of the opening, and BENEATH THE FRAME THE WALL'S OWN PANELLING RUNNING ON UNTOUCHED down to the marble ledge - the unit stops dead at its own bottom rail, there is no splashback and no panel of its own below it. This is JOINERY AND A HOLE IN A WALL - it is NEVER a picture, a painting, a mirror, a window, a doorway, a poster, a screen, a television or an empty dark panel. The lining boards and the face band are SMOOTH POLISHED WALNUT, SPARSE SOFT FIGURE, NO REEDING, NO FLUTING, NO FINE PARALLEL STRIPING - a few broad soft sweeps of grain in a wide board, and the flat face band plain",
    "shelf-lower": "the lower shelf inside the inlaid recess: a plain 3 cm walnut board running the full width of the opening from reveal to reveal, and it IS THE FLOOR OF THE RECESS - nothing shows beneath it. Seen from a little above, so its polished top catches the daylight and a dark square front edge runs under it - wood, not marble, not stone, and no bracket, no moulding, no nosing",
    "shelf-upper": "the upper shelf inside the inlaid recess: a plain 3 cm walnut board running the full width of the opening from reveal to reveal, seen from BELOW so its bright front edge stands over its own dark underside, and throwing a soft shadow down the boarded back of the recess beneath it",
    "bottles-lower": "the row of ELEVEN real liquor bottles standing shoulder to shoulder on the lower shelf of the inlaid recess, well in front of its boarded back - A NORMAL BAR'S BACK SHELF, crowded and mixed: EVERY BOTTLE A DIFFERENT SHAPE, HEIGHT AND WIDTH, no two neighbours alike - squat flasks beside tall slim bottles, square shoulders beside round, a decanter, a long-necked bottle, a stubby one - with different closures: foil capsules under dark caps, pale rounded cork stoppers, tall black caps. The glass is mixed too: CLEAR bottles pale with a bright highlight down the window side, DARK-GLASS bottles deep, glassy and clearly darker than their clear neighbours, all reading against the darker boards behind. EVERY BOTTLE IS AT LEAST HALF FULL and the levels differ: the liquid inside is DARKER than the empty glass above it and the two meet at a clean horizontal FILL LINE. Each bottle STANDS ON THE BOARD with a small pool of contact shadow at its foot and a soft shadow up the boarding behind it, leaning away from the window at frame-left. Each wears ONE paper label - most white paper, a few BLACK paper - placed high or low as the block-in places it, some with a small second label on the neck; the labels are PLAIN AND BLANK: no lettering, no words, no letters, no numerals, no pseudo-text, no drawing - their emblems are stamped on in code afterwards, exactly as the window is gilded",
    "bottles-upper": "the row of NINE real liquor bottles standing shoulder to shoulder on the upper shelf of the inlaid recess, well in front of its boarded back - A NORMAL BAR'S BACK SHELF, crowded and mixed: EVERY BOTTLE A DIFFERENT SHAPE, HEIGHT AND WIDTH, no two neighbours alike - squat flasks beside tall slim bottles, square shoulders beside round, a decanter, a long-necked bottle, a stubby one - with different closures: foil capsules under dark caps, pale rounded cork stoppers, tall black caps. The glass is mixed too: CLEAR bottles pale with a bright highlight down the window side, DARK-GLASS bottles deep, glassy and clearly darker than their clear neighbours, all reading against the darker boards behind. EVERY BOTTLE IS AT LEAST HALF FULL and the levels differ: the liquid inside is DARKER than the empty glass above it and the two meet at a clean horizontal FILL LINE. Each bottle STANDS ON THE BOARD with a small pool of contact shadow at its foot and a soft shadow up the boarding behind it, leaning away from the window at frame-left. Each wears ONE paper label - most white paper, a few BLACK paper - placed high or low as the block-in places it, some with a small second label on the neck; the labels are PLAIN AND BLANK: no lettering, no words, no letters, no numerals, no pseudo-text, no drawing - their emblems are stamped on in code afterwards, exactly as the window is gilded",
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
    LABELS.clear()
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


def _figure_field(pts, seed: int, freqs, hearts, heart_w: float,
                  heart_a: float = 2.8):
    """THE FIGURE OF ONE BOARD, as a field. The house construction, shared.

    The wall's grain() and the recess's lining both draw walnut, and there is
    now one function that knows how: a straight warp with barely any wander, a
    couple of broad sine modulations, and NARROW DEEP HEART LINES - the sharp
    figure the engraver has to draw around, which is the one thing that stops
    the pen falling back into reeding.

    What differs between them is PITCH and COUNT, not construction. A wall panel
    field is 90 px wide and wants two or three features across it; a lining board
    is 68-84 px of POLISHED walnut and wants one or two soft wide ones - the
    founder, 2026-09-08: "clean up the wood grain around the shelf".

    THE DRAW ORDER OFF THE RandomState IS FIXED AND MUST NOT CHANGE - both
    frequencies first, then both phases, then the hearts - because the wall's
    panels are already in the approved plate and reordering it redraws every one
    of them.
    """
    mask = _rast(pts)
    ys, xs = np.nonzero(mask > 0.5)
    if len(xs) < 24:
        return None, None
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    rs = np.random.RandomState(seed % 2**31)
    u = (_X - x0) / max(x1 - x0, 1)
    v = (_Y - y0) / max(y1 - y0, 1)
    # the board wanders as it runs; barely any wander. Movement in the figure
    # reads as drapery; walnut runs STRAIGHT up the board.
    warp = (u + 0.014 * np.sin(2.1 * v + rs.uniform(0, 6.28))
              + 0.007 * np.sin(4.3 * v + rs.uniform(0, 6.28)))
    fs = [rs.uniform(a, b) for a, b, _amp in freqs]
    g = np.zeros((H, W), np.float32)
    for f, (_a, _b, amp) in zip(fs, freqs):
        g += amp * np.sin(2 * np.pi * (f * warp + rs.uniform(0, 1)))
    for _ in range(rs.randint(hearts[0], hearts[1])):
        g -= heart_a * np.exp(-((warp - rs.uniform(0.12, 0.88)) / heart_w) ** 2)
    return g, mask


def grain(img: np.ndarray, pts, strength: float = 9.0, seed: int = 0,
          freqs=GRAIN_FREQS, hearts=GRAIN_HEARTS,
          heart_w: float = GRAIN_HEART_W) -> None:
    """Cathedral grain, drawn into the VALUES of one panel field.

    Four seeds in a row came back with the fields reeded like corduroy, and the
    prompt has forbidden fine parallel striping the whole time. It is the same
    lesson as the joinery: the model reasons about figure badly and renders it
    well, so the figure is built here rather than asked for. Low frequency and
    wandering - two or three broad features across a board, not twenty - which
    is exactly what separates walnut from fluting.

    This goes in the values, never in the line layer. A grain line drawn as a
    LINE comes through the render as a hard black scratch.

    The defaults are the wall's and they are unchanged: same seeds, same draws,
    same pixels. The keywords exist so the lining can borrow the construction at
    a lower strength and a lower pitch.
    """
    if _SKIP:
        return
    g, mask = _figure_field(pts, seed, freqs, hearts, heart_w)
    if g is None:
        return
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


BOTTLE_PITCH = 0.152            # RETIRED as a spacing rule (2026-09-08). A row is
                                # laid out from the bottles' OWN widths now - see
                                # bottle_row() - because one fixed pitch put a
                                # wide rum shoulder to shoulder with a wide flask
                                # and left the slim vodka swimming. Kept as a
                                # number in case anything downstream reads it
# --------------------------------------------------------------- THE BOTTLES
# The founder, 2026-09-08: "improve the bottles drastically they should look
# like they have real labels like real liquor bottles they should have
# different shapes and sizes and they should all be at least half full".
#
# ROUND 2 (founder, 2026-09-08, verbatim): "the bottles shouldnt all the look
# the same it should be like a normal bar with lots of differnet bottles the
# bottles shouldnt have creative names or even names at all on them they just
# need emblems". FOURTEEN REAL SILHOUETTES now (up from eight), a normal bar's
# worth of variety on the shelf, and NAMES ARE GONE from the default path: the
# label carries one bold EMBLEM (scripts/label-bottles.py --mode emblems), not
# a house brand. `--mode names` keeps the old lettered pipeline alive for
# whoever still wants it - see BRANDS / BRAND_BY_KIND below, unchanged in kind.
#
# Each kind is drawn as the four things the model actually renders from:
#
#   THE GLASS, BY KIND. Clear glass is pale with a bright rim down its lit edge;
#         a dark spirit is mid-dark. Both are graded left to right, because the
#         light comes from the window at frame-left, and both carry one narrow
#         dark edge on the other side so the cylinder turns.
#   THE FILL LINE. A horizontal cut across the silhouette with the liquid BELOW
#         it darker than the empty glass above. That is the whole of "visibly
#         filled to different levels", and it is the one thing a blank cylinder
#         cannot fake. Never below half: FILL_RANGE.
#   THE CLOSURE. `cap_style` is its OWN field now, alongside shape and glass,
#         not inferred from (cap_h, cap_k) after the fact (critic, 2026-09-08:
#         "all 20 caps render as the same short dark rectangle" - cap_h/cap_k
#         alone only changed a rectangle's size, never its shape or tone, so
#         the three styles never actually read as different things). Three
#         real styles, three different shapes in bottle():
#           "capsule" - the original foil sleeve down the neck (CAPSULE_V)
#                       under a short dark rectangle cap (CAP_V) - unchanged.
#           "cork"    - NO foil sleeve (a real corked bottle has none): a
#                       ROUNDED dome (CORK_SIL, through the same _sil() a
#                       body's own silhouette uses) in a LIGHT tone (CORK_V) -
#                       a pale bulb where every other bottle has a dark block.
#           "tall"    - the capsule's sleeve-plus-rectangle again, but cap_h
#                       and cap_k are both pushed well past the capsule kinds'
#                       (0.027-0.034 / 1.45-1.65 against 0.016-0.023 / 1.16-
#                       1.34), so the black rectangle itself stands taller and
#                       wider, not just a few page pixels more of the same
#                       short block.
#         cap_h and cap_k still set the closure's own height and width, same
#         as always; cap_style only decides which of the three shapes those
#         two numbers get drawn as.
#   THE LABEL. A LIGHTER (or, for a black-label bottle, DARKER) patch -
#         rectangle, band, oval or shield - sized to the bottle it is on. THE
#         VALUES CARRY A BLANK PATCH AND NOTHING ELSE: the model letters or
#         emblems any rectangle it is handed and it garbles it, so both names
#         and emblems are set in code, onto this same blank patch.
#
# A silhouette is a list of (v, r): v runs up the GLASS (base 0, top of neck 1;
# the cap sits above that) and r is the half-width as a fraction of w/2. The
# points are joined straight, so a square shoulder is one short steep run and a
# round one is four shallow ones - the profile IS the drawing, and no kind here
# shares another's.
#
# HEIGHT AND WIDTH NOW SPAN THE FULL REAL RANGE (critic's brief, 2026-09-08:
# "from a squat half-height rum to a tall slim vodka nearly to the shelf
# above"). The lower shelf clears 0.46 m before a bottle touches the board
# above it (SHELF_HEADROOM already spent); `vodka` stands 0.430 m, 3 cm short
# of that - "nearly to the shelf above", read literally. `rum` stands 0.205 m,
# not quite half of that - the squat half-height kind, wide enough (0.238 m)
# that the two read as opposite ends of one shelf, not two sizes of the same
# bottle. Every other kind falls between them, no two alike, so ELEVEN LOWER
# reads as a normal bar's shelf and not a repeat.
#
# WIDTH IS NOW THE KIND'S OWN METRE, NOT A SCALED FRACTION (BOTTLE_W_SCALE
# retired to 1.0, see below) - eleven and nine bottles across the same 1.80 m
# opening need real width variety to sit close without a fixed multiplier
# fighting it: 0.088 m (vodka) to 0.238 m (rum), calibrated by hand against
# bottle_row()'s own gap arithmetic so the lower row's gaps average ~3 cm and
# the upper row's ~6 cm - SMALL AND UNEVEN, not the 7-17 cm gaps eight-and-six
# bottles left in this same opening.
#
# SHOULDER_V, the round's first fix (critic, 2026-09-08). `fill` used to split
# the WHOLE glass, base 0 to the top of the neck 1, and on eleven of twenty
# bottles the line landed in the NECK - which is not a liquid level, it is a
# bottle with a stripe on it. `shoulder` is the v at which THE BODY ENDS: the
# last height at which the glass is still near its full width, read off the
# silhouette below it. The fill line is f * shoulder, so f is a fraction OF THE
# BODY and the level is always in the glass a bottle actually holds liquid in.
# `label` is the label's height as a fraction of THE BODY, floored in PAGE
# PIXELS (LABEL_MIN_PX) - a fraction alone gave a 0.24 m rum an 18 px label.
BOTTLE_KINDS = {
    "bourbon": dict(h=0.320, w=0.140, glass="dark", cap=(0.020, 1.28), shape="shield",
                    cap_style="capsule",
                    label=0.58, shoulder=0.61,
                    sil=[(0.00, 0.96), (0.03, 1.00), (0.55, 1.00), (0.60, 0.99),
                         (0.65, 0.58), (0.69, 0.30), (0.72, 0.27), (1.00, 0.26)]),
    "scotch":  dict(h=0.325, w=0.122, glass="dark", cap=(0.027, 1.45), shape="oval",
                    cap_style="tall",
                    label=0.56, shoulder=0.63,
                    sil=[(0.00, 0.95), (0.03, 1.00), (0.50, 1.00), (0.59, 0.96),
                         (0.67, 0.80), (0.74, 0.55), (0.80, 0.34), (0.85, 0.26),
                         (1.00, 0.25)]),
    # THE SQUAT HALF-HEIGHT KIND (founder's own example, 2026-09-08). Wide and
    # low - a broad flagon shoulder, a short neck, a cork stopper - so the
    # shelf's low end is a real shape and not just a scaled-down bourbon.
    "rum":     dict(h=0.205, w=0.238, glass="dark", cap=(0.030, 1.55), shape="band",
                    cap_style="cork",
                    label=0.58, shoulder=0.66,
                    sil=[(0.00, 0.90), (0.05, 1.00), (0.55, 1.00), (0.62, 0.96),
                         (0.70, 0.75), (0.78, 0.48), (0.84, 0.30), (1.00, 0.28)]),
    # THE GIN IS A SQUARE FLASK (critic, 2026-09-08: it was the one silhouette
    # with no shoulder at all - a cone that tapered from its foot to its cap,
    # which is a carafe and not a bottle). Parallel sides at full width the
    # whole height of the body, then ONE short steep run into the neck. That
    # corner is the shoulder, and it is what says flask rather than cylinder.
    "gin":     dict(h=0.310, w=0.112, glass="clear", cap=(0.017, 1.20), shape="rectangle",
                    cap_style="capsule",
                    label=0.58, shoulder=0.62,
                    sil=[(0.00, 0.97), (0.02, 1.00), (0.58, 1.00), (0.62, 0.99),
                         (0.68, 0.66), (0.73, 0.36), (0.76, 0.30), (1.00, 0.29)]),
    "rye":     dict(h=0.360, w=0.132, glass="dark", cap=(0.030, 1.50), shape="oval",
                    cap_style="tall",
                    label=0.62, shoulder=0.50,
                    sil=[(0.00, 0.72), (0.06, 0.86), (0.16, 0.97), (0.28, 1.00),
                         (0.40, 0.98), (0.50, 0.88), (0.58, 0.72), (0.66, 0.50),
                         (0.72, 0.34), (0.78, 0.27), (1.00, 0.26)]),
    # THE TALL SLIM KIND (founder's other example). Nearly to the shelf above:
    # 0.430 m against a 0.460 m clearance, 3 cm to spare - the tallest thing on
    # either shelf, and the narrowest (0.088 m) so it never reads as a stretched
    # copy of a normal bottle.
    "vodka":   dict(h=0.430, w=0.088, glass="clear", cap=(0.016, 1.16), shape="band",
                    cap_style="capsule",
                    label=0.52, shoulder=0.72,
                    sil=[(0.00, 0.97), (0.02, 1.00), (0.70, 1.00), (0.75, 0.95),
                         (0.80, 0.70), (0.85, 0.42), (0.89, 0.26), (1.00, 0.24)]),
    "whiskey": dict(h=0.300, w=0.156, glass="dark", cap=(0.023, 1.34), shape="rectangle",
                    cap_style="cork",
                    label=0.58, shoulder=0.58,
                    sil=[(0.00, 0.88), (0.05, 1.00), (0.40, 1.00), (0.54, 0.98),
                         (0.64, 0.90), (0.72, 0.72), (0.79, 0.48), (0.85, 0.30),
                         (1.00, 0.28)]),
    "tequila": dict(h=0.290, w=0.127, glass="clear", cap=(0.028, 1.46), shape="shield",
                    cap_style="cork",
                    label=0.56, shoulder=0.60,
                    sil=[(0.00, 0.96), (0.03, 1.00), (0.58, 1.00), (0.65, 0.98),
                         (0.70, 0.70), (0.74, 0.42), (0.77, 0.30), (1.00, 0.29)]),
    # SIX NEW KINDS (2026-09-08), so eleven-lower/nine-upper never has to repeat
    # a silhouette within a row. Bulbous snifter-necked brandy; a wide short
    # sherry flagon; a tall slim triple sec under a tall black cap; a
    # shield-labelled amaro; a slim absinthe, also under a tall black cap; a
    # short wide port.
    "brandy":  dict(h=0.340, w=0.120, glass="dark", cap=(0.022, 1.30), shape="oval",
                    cap_style="capsule",
                    label=0.60, shoulder=0.55,
                    sil=[(0.00, 0.90), (0.05, 0.98), (0.42, 1.00), (0.50, 0.97),
                         (0.58, 0.86), (0.66, 0.62), (0.73, 0.40), (0.79, 0.28),
                         (1.00, 0.26)]),
    "sherry":  dict(h=0.240, w=0.177, glass="dark", cap=(0.028, 1.50), shape="band",
                    cap_style="cork",
                    label=0.58, shoulder=0.66,
                    sil=[(0.00, 0.93), (0.04, 1.00), (0.60, 1.00), (0.66, 0.95),
                         (0.73, 0.70), (0.80, 0.44), (0.85, 0.30), (1.00, 0.28)]),
    "triple_sec": dict(h=0.375, w=0.092, glass="clear", cap=(0.032, 1.60), shape="rectangle",
                    cap_style="tall",
                    label=0.56, shoulder=0.68,
                    sil=[(0.00, 0.96), (0.02, 1.00), (0.62, 1.00), (0.68, 0.97),
                         (0.74, 0.68), (0.80, 0.40), (0.84, 0.27), (1.00, 0.26)]),
    # AMARO'S SHOULDER IS NOW A SMOOTH ROUND CURVE (critic's second fix,
    # 2026-09-08: at render scale it read the same as bourbon's and gin's
    # abrupt single-corner shoulder, three "identical rounded shoulders" in a
    # row on the upper shelf). MORE POINTS over a LONGER v-span than either of
    # those two - the radius bleeds off gradually instead of turning a hard
    # corner, which is what a round-shouldered shape needs to read as round
    # rather than as one more flask.
    "amaro":   dict(h=0.300, w=0.150, glass="dark", cap=(0.026, 1.42), shape="shield",
                    cap_style="cork",
                    label=0.58, shoulder=0.66,
                    sil=[(0.00, 0.94), (0.04, 1.00), (0.48, 1.00), (0.56, 0.99),
                         (0.62, 0.94), (0.68, 0.80), (0.73, 0.58), (0.78, 0.38),
                         (0.83, 0.28), (1.00, 0.27)]),
    # ABSINTHE'S SHOULDER IS NOW A LONG STRAIGHT DIAGONAL (critic's second
    # fix): whiskey already owns the long MULTI-STEP curved taper on this
    # shelf, so absinthe's taper is stretched to start much lower on the body
    # (v 0.50 instead of 0.66) and run in three long straight segments rather
    # than whiskey's many short ones - a slim wine-bottle slope beside
    # whiskey's rounder one, not a repeat of it.
    "absinthe": dict(h=0.295, w=0.130, glass="clear", cap=(0.034, 1.65), shape="band",
                    cap_style="tall",
                    label=0.55, shoulder=0.60,
                    sil=[(0.00, 0.95), (0.04, 1.00), (0.44, 1.00), (0.50, 0.97),
                         (0.60, 0.86), (0.68, 0.68), (0.76, 0.48), (0.82, 0.32),
                         (1.00, 0.27)]),
    "port":    dict(h=0.230, w=0.180, glass="dark", cap=(0.023, 1.34), shape="rectangle",
                    cap_style="cork",
                    label=0.58, shoulder=0.58,
                    sil=[(0.00, 0.90), (0.05, 1.00), (0.50, 1.00), (0.58, 0.97),
                         (0.66, 0.80), (0.73, 0.52), (0.79, 0.32), (1.00, 0.29)]),
}
# WIDTH IS NOW THE KIND'S OWN NUMBER (critic, 2026-09-08). The old 1.75
# multiplier existed to inflate eight generic widths into "fewer, bigger"
# bottles; now every kind's `w` IS its true width in metres, hand-calibrated
# against bottle_row()'s gap arithmetic (see the block comment above), so the
# scale is kept at 1.0 rather than deleted - anything downstream that still
# multiplies by it is unaffected.
BOTTLE_W_SCALE = 1.0
# The glass, as (empty left, empty right, liquid left, liquid right). The empty
# half is LIGHTER than the liquid half in both materials - that is what draws
# the fill line - and clear glass clears the lining (84-118) at both ends while
# a dark spirit sits under it at both.
#
# THE GLASS CLEARS THE LINING (critic, 2026-09-08: "clear glass sits ON the
# lining"). At the old numbers a clear bottle's liquid ran 118-92 and a dark
# glass ran 118-92 and the lining it stood against ran 118-84: the same tone, so
# a whole row of bottles read as a pattern painted on the back of the box. THREE
# things moved, and the gate is GLASS_SEP_MIN - every bottle body's median must
# sit that far from the lining beside it. The lining went DOWN to 60-74, which is
# where the back of a box belongs anyway (the darkest large field inside the
# frame); the clear glass came UP; and THE DARK SPIRITS CAME UP TOO, because a
# dark spirit under a lamp is a warm mid-tone with a bright edge, not a hole -
# taken down with the lining they landed in it and the gate read 14.
#
# ROUND 2's FIRST NUMBERS STILL FAILED THE GATE (critic, 2026-09-08: "only ~4
# of 20 read as dark"). Dark liquid at 74-54, median 64, sits 3 LEVELS from the
# lining's own median (67) - inside GLASS_SEP_MIN's 25-level gate, not past it;
# the "100-level fill step" comment above was true of the STEP (empty-to-liquid
# CONTRAST) but said nothing about where the liquid tone sat relative to the
# lining BEHIND it, and that is what a bottle needs to read as a bottle rather
# than a gap in the lining. So the dark liquid tone comes DOWN again - the
# opposite direction from round 2's own fix, because round 2 was correcting a
# too-DARK liquid that matched the CAP, and this corrects a too-LIGHT one that
# matches the LINING; both are "make it distinct from its neighbour," aimed at
# different neighbours. Below, median 38 clears the lining's 67 by 29, past the
# gate; the empty-glass tone comes down with it (198-176 to 168-148) so the
# small band above the fill line does not read as a different, paler glass.
# THE FILL STEP STAYS >= 100 LEVELS EITHER WAY (168-46=122, 148-30=118) - the
# rule this round was told to keep.
GLASS_V = {"clear": (228.0, 206.0, 148.0, 126.0),
           "dark":  (168.0, 148.0, 46.0, 30.0)}  # FILL STEP >= 100 levels, AND
                                                  # the liquid median (38) clears
                                                  # the lining's (67) by >= GLASS_SEP_MIN
MENISCUS_V = 34.0               # a 2.5 px dark line where liquid meets glass
# THE SPECULAR HIGHLIGHT WAS COVERING THE DARK BODY (critic, same round): at
# RIM_V["dark"]=206 the dark bottle's own lit edge read almost as bright as the
# CLEAR bottle's (250) - on a narrow dark bottle that one bright stripe down
# the window side, run the FULL height including the liquid, read as "half of
# this bottle is pale glass" and the liquid tone underneath never got seen.
# Dimmed to 130 (a highlight, not a near-white blaze) and narrowed - RIM_F is
# now per-glass, and dark's strip is little over half clear glass's width - so
# the true body tone (46-30) is what a reader's eye lands on, not the shine.
RIM_V = {"clear": 250.0, "dark": 130.0}      # the lit edge, down the window side
EDGE_V = {"clear": 58.0, "dark": 22.0}       # and the dark turn on the other -
                                              # dark's edge came down too, clear
                                              # of the new body tone (46-30)
GLASS_SEP_MIN = 25.0            # levels between a body's median and its lining
RIM_F = {"clear": 0.30, "dark": 0.17}   # each as a fraction of the half-width AT
EDGE_F = 0.18                           # THAT HEIGHT, so a neck's highlight is
                                # narrower than a belly's - which is what makes
                                # it a cylinder. RIM_F is per-glass (above); a
                                # dark bottle's specular strip is narrower as
                                # well as dimmer, so it never eats "most of the
                                # body" the way a clear-width strip did at 206
CAP_V = (26.0, 16.0)            # the cap: the darkest thing on the bottle
CAPSULE_V = (52.0, 32.0)        # the foil down the neck under it
CAPSULE_H = 0.09                # of the glass height
# THE CORK STOPPER (founder: "the cork ... rounded, light" - see cap_style in
# BOTTLE_KINDS and bottle() below). LIGHT is relative to CAP_V/CAPSULE_V, not
# to the page: 168 sits well above both of those and above the new dark-glass
# body tone, so a cork instantly reads as a pale dome where every other bottle
# on the shelf shows a dark block. CORK_SIL is its own tiny silhouette, run
# through the same _sil() a bottle's own body uses - full width at the base,
# tapering to a rounded crown - not a rectangle at all.
CORK_V = (168.0, 140.0)
CORK_SIL = [(0.00, 1.00), (0.35, 1.00), (0.62, 0.88), (0.82, 0.62), (1.00, 0.32)]
LABEL_V = (244.0, 216.0)        # WHITE paper: the lightest thing in the recess,
                                # and it has to stay clear of clear EMPTY glass
# BLACK-LABEL PAPER (founder, 2026-09-08: "a few BLACK-LABEL bottles ... among
# the white-label ones"). Dark paper, a light emblem inked onto it later by
# label-bottles.py --mode emblems (it inverts: white device on black paper).
# Set BELOW the dark spirit's own liquid tone (now 46-30) and the lining
# (60-74) so it still reads as the darkest large patch on its own bottle,
# second only to the cap - a black label that sat AT the lining's tone would
# vanish into it. Brought down with the liquid tone in this round, same
# reasoning: it has to stay the darkest LARGE patch on ITS bottle even now
# that the liquid under it reads much darker than it used to.
LABEL_V_BLACK = (30.0, 20.0)
LABEL_W_F = 0.88                # of the body's width where the label sits, so a
                                # sliver of lit glass survives either side of it
LABEL_MIN_PX = 34.0             # THE LABEL FLOOR, IN PAGE PIXELS, and it is now
LABEL_MIN_W_PX = 34.0           # a floor in BOTH directions (critic: at 22 px a
                                # label carries a rule pair and no name at all).
                                # 34 px each way is what a set brand name needs.
                                # ELEVEN-UP-FROM-EIGHT (2026-09-08): the height
                                # floor still holds everywhere (span_m below is
                                # forced up to it), but the WIDTH floor no
                                # longer can be, on the narrowest kinds (vodka,
                                # triple_sec) at this many-bottles-per-shelf
                                # width - measured, not assumed: see the build
                                # log. scripts/label-bottles.py's emblem mode
                                # carries its own lower floor, EMBLEM_MIN_PX =
                                # 26.0, for exactly those labels: a bold device
                                # still reads at 26 px where a set word would not.
LABEL_PX_MARGIN = 0.8           # asked for over the floor, so rounding cannot
                                # land a label at 33.9 px
LABEL_FOOT_PX = 2.0             # glass left under the label, on the page
LIQUID_PX = 4.0                 # AND THE LIQUID SHOWING ABOVE IT. Without this
                                # the label's top edge IS the fill line and the
                                # step across it is paper against glass
FILL_RANGE = (0.50, 0.78)       # "at least half full", now read on THE BODY:
                                # the split is at f * shoulder, so 0.50 is the
                                # literal floor and 0.78 leaves a real empty
                                # band. WIDENED FROM 0.55 (critic, 2026-09-08:
                                # "fill spans only 0.64-0.78 ... widen it
                                # toward the 0.5 floor") - the achieved spread
                                # also depends on each kind's own `need_v`
                                # below, which is a real per-bottle floor a
                                # short label-bearing body cannot get under
EMPTY_BAND_MIN_PX = 8.0         # of empty glass between the fill line and the
FILL_STEP_MIN = 40.0            # shoulder, and this much tone across the line
# LABEL POSITION, high or low on the body (founder, 2026-09-08: "some labels
# high on the shoulder, some low"). "high" is the original rule: the label's
# top is pinned just under the fill line (so a strip of liquid always shows
# above it) and never above the shoulder. "low" anchors the label's top well
# down the body instead - LOW_TOP_FRAC of the shoulder height - and only lets
# it rise off that anchor when the label's own minimum span needs the room.
LOW_TOP_FRAC = 0.46
# NECK LABELS (founder: "3-4 bottles with a small extra neck label"). A small
# band wrapped around the NECK, between the shoulder and the capsule, on a few
# bottles only. NECK_LABEL_MARGIN keeps it clear of both; NECK_LABEL_SPAN_FRAC
# is how much of that clear band the label itself actually spans - the rest is
# bare neck above and below it, which is what makes it read as an extra label
# and not a second body label pushed up.
NECK_LABEL_MARGIN = 0.03
NECK_LABEL_SPAN_FRAC = 0.46
NECK_LABEL_MIN_V = 0.07          # skip the neck label if less than this much of
                                  # hb's v-range is clear between shoulder and capsule
# THE BOTTLES' OWN SHADOWS (critic, 2026-09-08: "they are stickers"). Two per
# bottle, both through cast() inside the row's own part, so masks/ hold members
# and shadows/ hold the shading: a CONTACT shadow on the board the bottle
# stands on, and a soft CAST shadow up the lining behind it. The window is at
# frame-left, so both lean right, and the cast one leans further the higher it
# climbs - which is what a light source at one side of a room does.
BOTTLE_CONTACT_K = (0.34, 0.74)   # darkest at the foot, opening away from it
BOTTLE_CAST_K = (0.92, 0.56)      # top of the lining shadow, then its foot
BOTTLE_CONTACT_DX = 0.030         # how far the pool leans off the foot
BOTTLE_CAST_DX = (0.022, 0.085)   # and the lining shadow, at the foot and head
BOTTLE_CAST_H = 0.82              # how far up the bottle the lining shadow runs
BOTTLE_EDGE_M = 0.045           # the clearance between a row's end bottle and
                                # the reveal beside it, IN WORLD METRES. Anything
                                # whose world x lies between the two reveals is
                                # inside the cut and in front of both of them;
                                # held back by the opening's PAGE columns instead
                                # the end bottle stands through the left reveal
BOTTLE_GAP_MIN = 0.030          # and between two neighbours: 9 px of lining
SHELF_HEADROOM = 0.03           # the founder's rule: a row's tallest bottle
                                # clears the board or the head above it by 3 cm
# THE TWO ROWS, WRITTEN OUT AND NOT SAMPLED (still true, 2026-09-08 round 2).
# ELEVEN LOWER, NINE UPPER (up from eight and six) - "a normal bar's back
# shelf", per the founder, and enough bottles that a random draw could no
# longer be trusted not to put two similar shapes side by side, so the order
# below was picked by hand: no two NEIGHBOURS share a KIND, a LABEL SHAPE, or
# (mostly) a GLASS TONE, and the heights zig-zag rather than climb or fall, so
# the skyline reads as a real shelf and not a sorted one.
#
# The upper row reuses six of the eleven lower kinds (scotch, tequila, rum,
# bourbon, gin, whiskey - the same six the eight-bottle round shared) plus the
# three new kinds too tall for the lower row's company to bother with up here
# (amaro, absinthe, port all clear the upper ceiling, 0.33 m, with room to
# spare) - which is exactly what a real bar does: some bottles are one of a
# kind, some styles repeat shelf to shelf. `vodka`, `rye` and `triple_sec` -
# the three tallest kinds - are LOWER ONLY: at 0.430/0.360/0.375 m they clear
# the lower shelf's 0.46 m ceiling but not the upper's 0.33 m one.
#
# `labelpos` is per bottle: "high" pins the label just under the fill line (the
# original rule), "low" anchors it down the body instead - see LOW_TOP_FRAC.
# `ground` is per bottle: "white" (the paper the model was already painting) or
# "black" (LABEL_V_BLACK, a dark label with a light emblem) - four of the
# twenty, spread across both rows, per the founder's "a few ... among the
# white-label ones". `neck` marks the (four, of twenty) bottles that also carry
# a small extra label on the neck.
#
# THE UPPER ROW'S dh WAS TOO SMALL TO SPREAD ANYTHING (critic's third fix,
# 2026-09-08: "heights 0.199-0.324 m on paper, but 6 of 9 bottles top out on
# the same line"). On the LOWER row a few mm of dh is enough because the
# ELEVEN KINDS' OWN heights already span 0.205-0.379 m - dh only zig-zags the
# order. The upper row reuses six of those eleven kinds, but six of the nine
# it draws from (scotch, tequila, bourbon, gin, amaro, whiskey) all stand
# 0.290-0.325 m tall on their own - a real bar reuses styles shelf to shelf,
# but that reuse leaves nothing here to do the lower row's job of spreading
# the SKYLINE. So upper dh is no longer a few mm: it runs -0.055 to +0.020,
# deliberately spending the headroom up to the 0.33 m ceiling (bourbon +0.008
# -> 0.328 m, scotch -0.004 -> 0.321 m) on one end and pulling two more
# (tequila -0.040, whiskey -0.055) DOWN into the 0.24-0.25 m middle the row
# previously had nothing in - between amaro's untouched 0.300 and rum/port's
# own low 0.20/0.23. `gin` moves only -0.015 (0.295, not the -0.045 first
# tried): gin's own label-vs-body arithmetic (need_v in bottle()) needs its
# body kept above ~0.28 m or its fill line gets shoved to FILL_RANGE's ceiling
# regardless of what `fills` below asks for, undoing the OTHER half of this
# same round's fix. Final skyline, sorted: 0.215(rum), 0.235(port),
# 0.245(whiskey), 0.250(tequila), 0.295(gin), 0.300(amaro), 0.315(absinthe),
# 0.321(scotch), 0.328(bourbon) - a real climb across the row, not two clumps
# with a gap in the middle.
BOTTLE_ROWS = {
    "lower": dict(
        kinds=("bourbon", "gin", "rum", "scotch", "vodka", "whiskey", "tequila",
               "brandy", "triple_sec", "sherry", "rye"),
        # WIDENED TOWARD THE 0.5 FLOOR (critic's fifth fix, 2026-09-08: "fill
        # spans only 0.64-0.78 with 7 of 20 pinned at 0.78"). Four of these
        # eleven (rum, whiskey, tequila, sherry) cannot get under ~0.78-1.10
        # regardless of what `fills` asks for - their own body is too short
        # for LABEL_MIN_PX's floor to fit any lower (bottle()'s `need_v`) - so
        # they are left at the ceiling on purpose. The other seven are set at
        # a small margin over their OWN need_v (vodka's own floor is 0.583,
        # triple_sec's 0.638, and so on up to gin's 0.744), which is what
        # actually staggers the fill LINE across the shelf instead of the
        # seven of them all landing on 0.78 by the same label-size floor.
        fills=(0.730, 0.750, 0.780, 0.710, 0.600, 0.780, 0.780,
               0.735, 0.650, 0.780, 0.740),
        dh=(0.004, -0.005, 0.006, -0.004, 0.003, -0.006, 0.005,
            -0.003, 0.004, -0.005, 0.006),
        jit=(0.00, -0.12, 0.09, -0.08, 0.14, -0.10, 0.07,
             -0.13, 0.10, -0.09, 0.00),
        labelpos=("high", "low", "high", "low", "high", "low", "high",
                  "high", "low", "high", "low"),
        ground=("white", "white", "black", "white", "white", "white", "white",
                "black", "white", "white", "white"),
        neck=(False, True, False, False, False, False, True,
              False, False, False, False)),
    "upper": dict(
        kinds=("scotch", "tequila", "rum", "bourbon", "gin", "amaro", "whiskey",
               "absinthe", "port"),
        # See the lower row's own note above `fills`: four of these nine
        # (tequila, rum, whiskey, port) sit at the ceiling because their body
        # cannot clear their own need_v under it. The other five, absinthe
        # included now that its redrawn shoulder (see BOTTLE_KINDS) sits at
        # 0.60 rather than the first attempt's 0.56, are set a small margin
        # over their own floor.
        fills=(0.735, 0.780, 0.780, 0.700, 0.755, 0.715, 0.780,
               0.745, 0.780),
        dh=(-0.004, -0.040, 0.010, 0.008, -0.015, 0.000, -0.055,
            0.020, 0.005),
        jit=(0.00, 0.13, -0.10, 0.08, -0.14, 0.11, -0.09,
             0.12, 0.00),
        labelpos=("low", "high", "low", "high", "low", "high", "low",
                  "high", "low"),
        ground=("white", "white", "white", "white", "white", "white", "black",
                "white", "black"),
        neck=(False, True, False, False, False, False, False,
              False, True)),
}
# The house brands: the LOCAL fence of canon/MASTER-PROMPT.md and the published
# set in canon/showcase-retired/. NOTHING IS INVENTED HERE. RETAINED for
# --mode names (scripts/label-bottles.py); the default path (--mode emblems)
# never reads BRANDS or BRAND_BY_KIND at all.
BRANDS = ("BIRDIE BOURBON", "DIVOT DRIVE GIN", "PAR-TEE SCOTCH", "19TH HOLE RYE",
          "ROUGH RIDER GIN", "TEE TIME TENNESSEE WHISKEY", "EAGLE EYE VODKA",
          "CADDY'S CHOICE RUM", "BACK NINE", "BUNKER")
# AND WHICH OF THEM BELONGS ON WHICH KIND OF BOTTLE. The task's own assignment
# rule is by SIZE - largest label, longest name, cycling - so a bourbon can end
# up carrying EAGLE EYE VODKA. That is the rule and `brand` follows it; this
# second reading is exported alongside it as `brandForKind` so a later pass can
# swap to a kind-true shelf without re-deriving anything. The tequila has no
# category name in the canon list, so it takes the two that carry none. The six
# kinds added in round 2 have no canon category name either, so each is mapped
# onto whichever existing brand reads least wrong for it - none of this is used
# by the default --mode emblems path; it exists only so --mode names still
# works on every kind on the shelf and brandForKind's export never KeyErrors.
BRAND_BY_KIND = {
    "bourbon": ("BIRDIE BOURBON",),
    "scotch":  ("PAR-TEE SCOTCH",),
    "rum":     ("CADDY'S CHOICE RUM",),
    "gin":     ("DIVOT DRIVE GIN", "ROUGH RIDER GIN"),
    "rye":     ("19TH HOLE RYE",),
    "vodka":   ("EAGLE EYE VODKA",),
    "whiskey": ("TEE TIME TENNESSEE WHISKEY",),
    "tequila": ("BACK NINE", "BUNKER"),
    "brandy":  ("BIRDIE BOURBON",),
    "sherry":  ("CADDY'S CHOICE RUM",),
    "triple_sec": ("DIVOT DRIVE GIN",),
    "amaro":   ("19TH HOLE RYE",),
    "absinthe": ("EAGLE EYE VODKA",),
    "port":    ("BACK NINE",),
}
LABELS: list = []               # what bottles() measures, for labels.json



def _rad(sil, v: float) -> float:
    """The half-width fraction at height v, straight-line between the nodes."""
    v = min(max(v, 0.0), 1.0)
    for i in range(len(sil) - 1):
        v0, r0 = sil[i]
        v1, r1 = sil[i + 1]
        if v0 <= v <= v1:
            t = 0.0 if v1 <= v0 else (v - v0) / (v1 - v0)
            return r0 + (r1 - r0) * t
    return sil[-1][1]


def _label_top(sil) -> float:
    """The highest v a label may reach: where the glass is still near full
    width. A label never climbs onto a shoulder, whatever fraction it asks for -
    on the tapered gin that is 0.58, on the bulbous rye 0.50."""
    best = 0.50
    for v, r in sil:
        if r >= 0.80:
            best = max(best, v)
    return min(0.72, best)


def px_per_m(x: float, y: float, z: float) -> float:
    """Page rows to one world metre of HEIGHT at (x, z). 303 at the left of the
    recess and 336 at the right, which is a tenth - and a tenth is the whole
    margin a 34 px label has on a 51 px body. Every label and every fill line is
    sized from the number AT ITS OWN BOTTLE, not from an average."""
    return abs(P(x, y + 0.10, z)[1] - P(x, y, z)[1]) * 10.0


def _sil(x: float, y0: float, z: float, hb: float, hw: float, sil,
         a: float = 0.0, b: float = 1.0, k0: float = -1.0, k1: float = 1.0):
    """A slice of one silhouette, as a closed world polygon.

    a..b cuts it horizontally - which is how the fill line gets to be a real
    edge across the glass instead of a line drawn on it - and k0..k1 cuts it in
    from the sides as a FRACTION OF THE HALF-WIDTH AT EACH HEIGHT, which is how
    the lit rim narrows into the neck with the glass instead of running up it as
    a stripe of one constant width. A stripe of constant width is what a flat
    sheet has; a cylinder's highlight tapers.
    """
    vs = sorted({a, b} | {v for v, _ in sil if a < v < b})
    right = [(x + hw * _rad(sil, v) * k1, y0 + hb * v, z) for v in vs]
    left = [(x + hw * _rad(sil, v) * k0, y0 + hb * v, z) for v in reversed(vs)]
    return right + left


def _label_box(x: float, y0: float, z: float, hb: float, hw: float, sil,
               lo: float, hi: float):
    """The label's box in world metres - and it is as wide as the NARROWEST part
    of the glass it spans, so a label on a tapering gin does not hang off the
    bottle at its top edge. Clockwise from top-left, like every other quad in
    this kit."""
    r = min(_rad(sil, lo), _rad(sil, hi))
    a = hw * r * LABEL_W_F
    ylo, yhi = y0 + hb * lo, y0 + hb * hi
    return [(x - a, yhi, z), (x + a, yhi, z), (x + a, ylo, z), (x - a, ylo, z)]


def _label_face(shape: str, quad):
    """The paper itself, cut to its shape inside the box the quad measures.

    The BOX is what labels.json exports and what label-bottles.py typesets into;
    the SHAPE is what the engraver sees. Four of them, so a row of labels is not
    a row of identical white rectangles - which is exactly how the last round's
    read, and it is why the founder called the bottles fake.
    """
    (xl, yt, z), (xr, _b, _c) = quad[0], quad[1]
    yb = quad[2][1]
    cx, cy = (xl + xr) / 2, (yt + yb) / 2
    ax, ay = (xr - xl) / 2, (yt - yb) / 2
    if shape == "oval":
        return [(cx + ax * math.cos(2 * math.pi * i / 28),
                 cy + ay * math.sin(2 * math.pi * i / 28), z) for i in range(28)]
    if shape == "shield":
        return [(xl, yt, z), (xr, yt, z), (xr, yb + ay * 0.42, z),
                (cx, yb, z), (xl, yb + ay * 0.42, z)]
    if shape == "band":                        # a wrap: it runs the full width of
        return [(xl, yt, z), (xr, yt, z),      # the glass and is short for its
                (xr, yb, z), (xl, yb, z)]      # width, a hoop rather than a panel
    return [(xl, yt, z), (xr, yt, z), (xr, yb, z), (xl, yb, z)]


def _neck_zone(sh: float):
    """The v-range (base 0..1) a NECK LABEL may occupy: a small band centred in
    the clear neck between the shoulder and the capsule, MARGIN clear of each.
    None if that gap is too tight to bother (a few kinds' necks are short)."""
    lo = sh + NECK_LABEL_MARGIN
    hi = 1.0 - CAPSULE_H - NECK_LABEL_MARGIN
    if hi - lo < NECK_LABEL_MIN_V:
        return None
    span = (hi - lo) * NECK_LABEL_SPAN_FRAC
    mid = (lo + hi) / 2
    return mid - span / 2, mid + span / 2


def bottle(img: np.ndarray, d, x: float, y0: float, z: float, kind: str,
           h: float, fill: float, labelpos: str = "high", ground: str = "white",
           neck: bool = False) -> dict:
    """ONE REAL BOTTLE, blocked in - and it hands back its label's geometry.

    The order is the order glass is actually read in: the silhouette knocks the
    lining out of the line layer, the empty glass and the liquid go in as two
    graded fields with a hard edge between them, the lit rim and the dark turn
    come down the sides, the foil and the cap close the neck, and the LABEL GOES
    ON LAST because paper covers glass. With the rim laid after the label every
    label came back with a white bite out of its window-side edge.

    `labelpos` ("high"/"low") and `ground` ("white"/"black") vary the body
    label bottle to bottle - see LOW_TOP_FRAC and LABEL_V_BLACK above. `neck`
    adds a small second label on the neck, when the kind's neck has the room
    (`_neck_zone`); its geometry rides back on the returned dict's
    `_neckRecord` key, for bottle_row() to lift out and append to LABELS in
    its own right - a neck label is its own emblem, not part of the body one.
    """
    k = BOTTLE_KINDS[kind]
    sil, hw = k["sil"], k["w"] * BOTTLE_W_SCALE / 2
    cap_h, cap_k = k["cap"]
    hb = h - cap_h                                   # base to the top of the neck
    sh = k["shoulder"]                               # and THE TOP OF THE BODY
    pxm = px_per_m(x, y0, z)
    # THE FILL LINE IS ON THE BODY. f is a fraction of the body, never of the
    # glass, so f * shoulder is the split and the line cannot climb the neck.
    # It is then held high enough to clear the label and the strip of liquid
    # that has to show above it - a label whose top edge IS the fill line puts
    # paper against empty glass there, and the step stops meaning anything.
    span_m = max(k["label"] * sh * hb, (LABEL_MIN_PX + LABEL_PX_MARGIN) / pxm)
    need_v = ((LABEL_FOOT_PX + LIQUID_PX) / pxm + span_m) / (sh * hb)
    f = min(max(fill, FILL_RANGE[0]), FILL_RANGE[1])
    f = min(max(f, need_v), FILL_RANGE[1])
    fv = f * sh
    body = _sil(x, y0, z, hb, hw, sil)
    poly(d, body, 255)                               # it stands in front of the lining
    ev0, ev1, lv0, lv1 = GLASS_V[k["glass"]]
    shade(img, _sil(x, y0, z, hb, hw, sil, fv, 1.0), ev0, ev1, "x")
    shade(img, _sil(x, y0, z, hb, hw, sil, 0.0, fv), lv0, lv1, "x")
    dv = 2.5 / (pxm * hb)                            # the fill line itself, as ink
    shade(img, _sil(x, y0, z, hb, hw, sil, max(0.0, fv - dv), min(1.0, fv + dv)), MENISCUS_V)
    shade(img, _sil(x, y0, z, hb, hw, sil, 0.0, 1.0, -1.0, -1.0 + RIM_F[k["glass"]]),
          RIM_V[k["glass"]], RIM_V[k["glass"]] * 0.86, "y")
    shade(img, _sil(x, y0, z, hb, hw, sil, 0.0, 1.0, 1.0 - EDGE_F, 1.0),
          EDGE_V[k["glass"]])
    # THE CLOSURE, by cap_style (see the block comment above BOTTLE_KINDS).
    # "capsule" and "tall" both wear the foil sleeve down the neck under a
    # dark rectangle cap - "tall" is only bigger, via its own kind's cap_h/
    # cap_k. "cork" skips the sleeve entirely (a real corked bottle has no
    # foil under it) and draws a rounded, LIGHT dome instead of a rectangle -
    # CORK_SIL run through the same _sil() the body itself uses, so the dome
    # tapers rather than being a stack of straight edges.
    cap_style = k.get("cap_style", "capsule")
    if cap_style != "cork":
        caps = _sil(x, y0, z, hb, hw, sil, 1.0 - CAPSULE_H, 1.0)
        poly(d, caps, 255)
        shade(img, caps, CAPSULE_V[0], CAPSULE_V[1], "x")
    nw = hw * _rad(sil, 1.0) * cap_k
    if cap_style == "cork":
        cap = _sil(x, y0 + hb, z, cap_h, nw, CORK_SIL, 0.0, 1.0)
        poly(d, cap, 255)
        shade(img, cap, CORK_V[0], CORK_V[1], "x")
    else:
        cap = [(x - nw, y0 + h, z), (x + nw, y0 + h, z),
               (x + nw, y0 + hb, z), (x - nw, y0 + hb, z)]
        poly(d, cap, 255)
        shade(img, cap, CAP_V[0], CAP_V[1], "x")
    # THE LABEL. Its height is a fraction of the BODY floored at LABEL_MIN_PX
    # PAGE PIXELS. "high" hangs it DOWNWARD from a top set by the fill line, not
    # upward from a fraction: a label pushed up from below climbs onto the
    # shoulder, and a label sized in metres comes out 24 px on one bottle and 36
    # on another because the recess is a tenth deeper at one end than the other.
    # "low" anchors its top down at LOW_TOP_FRAC of the shoulder instead - well
    # clear of the fill line, since FILL_RANGE guarantees liquid behind it
    # either way - rising off that anchor only as far as its own span needs.
    liquid_ceiling = fv - LIQUID_PX / (pxm * hb)
    if labelpos == "low":
        hi = max(min(sh * LOW_TOP_FRAC, liquid_ceiling),
                  LABEL_FOOT_PX / (pxm * hb) + span_m / hb)
        hi = min(hi, sh, liquid_ceiling)
    else:
        hi = min(_label_top(sil), sh, liquid_ceiling)
    lo = max(LABEL_FOOT_PX / (pxm * hb), hi - span_m / hb)
    label_v = LABEL_V if ground == "white" else LABEL_V_BLACK
    quad = _label_box(x, y0, z, hb, hw, sil, lo, hi)
    face = _label_face(k["shape"], quad)
    shade(img, face, label_v[0], label_v[1], "x")
    poly(d, face, None, 0, 1)
    # THE NECK LABEL, on the few bottles that carry one - drawn in the same
    # pass, its own small band of paper on the bare neck between the shoulder
    # and the capsule (see _neck_zone). Its geometry rides back on
    # `_neckRecord`; bottle_row() lifts it into LABELS as its own entry, kind
    # "neck", because label-bottles.py sets one emblem per PAPER, not per
    # bottle.
    neck_rec = None
    if neck:
        zone = _neck_zone(sh)
        if zone is not None:
            nlo, nhi = zone
            nquad = _label_box(x, y0, z, hb, hw, sil, nlo, nhi)
            nface = _label_face("band", nquad)
            shade(img, nface, label_v[0], label_v[1], "x")
            poly(d, nface, None, 0, 1)
            npx = [P(*q) for q in nquad]
            neck_rec = {
                "kind": "neck", "bottleKind": kind, "shape": "band",
                "glass": k["glass"], "ground": ground,
                "quad": [[round(v, 1) for v in p] for p in npx],
                "widthPx": round(abs(npx[1][0] - npx[0][0]), 1),
                "heightPx": round(abs(npx[3][1] - npx[0][1]), 1),
                "world": {"x": round(x, 4), "z": round(z, 4),
                          "labelY": [round(y0 + hb * nlo, 4), round(y0 + hb * nhi, 4)]},
            }
    poly(d, body, None, 0, 1)
    poly(d, cap, None, 0, 1)
    px = [P(*q) for q in quad]
    fill_row = P(x, y0 + hb * fv, z)[1]
    sh_row = P(x, y0 + hb * sh, z)[1]
    return {"kind": kind, "shape": k["shape"], "glass": k["glass"],
            "fill": round(f, 3), "shoulder": sh, "fillV": round(fv, 4),
            "height": round(h, 4), "width": round(k["w"] * BOTTLE_W_SCALE, 4),
            "quad": [[round(v, 1) for v in p] for p in px],
            "widthPx": round(abs(px[1][0] - px[0][0]), 1),
            "heightPx": round(abs(px[3][1] - px[0][1]), 1),
            "labelPos": labelpos, "ground": ground,
            # the empty glass between the fill line and the top of the body, and
            # the strip of liquid showing between the fill line and the label
            "emptyBandPx": round(abs(fill_row - sh_row), 1),
            "liquidAboveLabelPx": round(abs(fill_row - px[0][1]), 1),
            "world": {"x": round(x, 4), "base": round(y0, 4), "z": round(z, 4),
                      "labelY": [round(y0 + hb * lo, 4), round(y0 + hb * hi, 4)],
                      "fillY": round(y0 + hb * fv, 4),
                      "shoulderY": round(y0 + hb * sh, 4),
                      "fillPx": round(fill_row, 1),
                      "shoulderPx": round(sh_row, 1),
                      "topPx": round(P(x, y0 + h, z)[1], 1),
                      "basePx": round(P(x, y0, z)[1], 1)},
            "_neckRecord": neck_rec}


def bottle_shadow(img: np.ndarray, x: float, y0: float, kind: str, h: float) -> None:
    """WHAT ONE BOTTLE THROWS, and it is two marks and not one.

    THE CONTACT SHADOW is on the BOARD, in the board's own horizontal plane at
    the bottle's foot: the small dense pool that says an object is standing on a
    surface rather than pasted in front of it. On the lower board, which is
    below the eye and read top-down, that pool is the four or five rows of lit
    top face beside the foot. On the upper board, read from underneath, the top
    face is not visible at all - the pool is drawn anyway, in the right plane,
    and the board laid after this row takes it back off the page. It is not
    faked onto somewhere it could be seen.

    THE CAST SHADOW is on the LINING behind, and it starts where the lining
    comes out from behind the board - y_at_px()'s rule, the same one the shelf's
    own shadow follows - so no row of it lands inside the board. It leans RIGHT,
    because the window is at frame-left, and it leans further the higher it
    climbs; it softens upward (BOTTLE_CAST_K) because a shadow does.

    Both go through cast(), so they MULTIPLY the boards and the lining and every
    joint and every run of figure survives underneath; and both are drawn BEFORE
    the row's own glass, so a bottle is never darkened by its neighbour's
    shadow. What falls inside the row's own silhouette is cleared out of the
    shadow layer at export, on the rule that a part never shades itself.
    """
    k = BOTTLE_KINDS[kind]
    hw = k["w"] * BOTTLE_W_SCALE / 2
    dx = BOTTLE_CONTACT_DX
    zf = max(ZF_REC + 0.012, BOTTLE_Z - 0.080)
    zb = min(ZB_REC - 0.004, BOTTLE_Z + 0.17)
    cast(img, [(x - hw * 0.55 + dx, y0, zf), (x + hw * 1.15 + dx, y0, zf),
               (x + hw * 1.15 + dx, y0, zb), (x - hw * 0.55 + dx, y0, zb)],
         BOTTLE_CONTACT_K[0], BOTTLE_CONTACT_K[1], "y")
    yb = max(y0, y_at_px(P(x, y0, ZF_REC)[1], x, ZB_REC)) + 0.006
    yt = y0 + h * BOTTLE_CAST_H
    if yt <= yb:
        return
    d0, d1 = BOTTLE_CAST_DX
    cast(img, [(x - hw * 0.75 + d1, yt, ZB_REC), (x + hw * 0.75 + d1, yt, ZB_REC),
               (x + hw * 1.02 + d0, yb, ZB_REC), (x - hw * 1.02 + d0, yb, ZB_REC)],
         BOTTLE_CAST_K[0], BOTTLE_CAST_K[1], "y")


def bottle_row(img: np.ndarray, d, sy: float, row: str, ceiling: float) -> None:
    """A ROW STANDING ON ONE SHELF, laid out from the bottles' OWN widths.

    The row is half of what stops the lining reading as a framed dark field, so
    it runs the whole width of the opening; the ends are held back by the RECESS
    WALLS THEMSELVES, in world metres, BOTTLE_EDGE_M in from each reveal. Held
    back by the opening's PAGE columns instead - which is what this did first -
    the end bottle stood 4 cm THROUGH the left reveal, because at the bottles'
    own depth the reveal plane projects 16 px right of where the frame's inner
    edge does.

    What is left over after the widths is shared out evenly as GAPS and then
    nudged by a written jitter that sums to zero, so both ends stay exactly where
    the arithmetic put them and the pitch still never repeats. A fixed pitch
    cannot do this: the widths now run 0.078 to 0.104 and a constant centre
    spacing puts the two widest neighbours 1 cm apart and the two narrowest 4.
    """
    spec = BOTTLE_ROWS[row]
    kinds, fills, dhs, jits = spec["kinds"], spec["fills"], spec["dh"], spec["jit"]
    labelposes = spec.get("labelpos", ("high",) * len(kinds))
    grounds = spec.get("ground", ("white",) * len(kinds))
    necks = spec.get("neck", (False,) * len(kinds))
    n = len(kinds)
    top = ceiling - sy - SHELF_HEADROOM
    hs = [min(BOTTLE_KINDS[k]["h"] + dh, top) for k, dh in zip(kinds, dhs)]
    ws = [BOTTLE_KINDS[k]["w"] * BOTTLE_W_SCALE for k in kinds]
    lo = RECESS_X[0] + BOTTLE_EDGE_M
    hi = RECESS_X[1] - BOTTLE_EDGE_M
    gap = (hi - lo - sum(ws)) / (n - 1)
    gaps = [gap * (1.0 + j) for j in jits[:n - 1]]
    gaps = [g + (gap * (n - 1) - sum(gaps)) / (n - 1) for g in gaps]   # ends pinned
    xs, x = [], lo
    for i in range(n):
        xs.append(x + ws[i] / 2)
        x += ws[i] + (gaps[i] if i < n - 1 else 0.0)
    # THE SHADOWS GO DOWN FIRST, onto the board and the lining, and the glass is
    # laid over them. Run the other way round - after the row, which is where
    # this started - a bottle's cast shadow darkened the NEIGHBOUR standing in
    # it, because cast() multiplies the values as it is called and the export
    # can only clear the shadow LAYER afterwards, never the plate.
    for i in range(n):
        bottle_shadow(img, xs[i], sy, kinds[i], hs[i])
    for i in range(n):
        rec = bottle(img, d, xs[i], sy, BOTTLE_Z, kinds[i], hs[i], fills[i],
                     labelpos=labelposes[i], ground=grounds[i], neck=necks[i])
        neck_rec = rec.pop("_neckRecord", None)
        rec.update({"part": "bottles-" + row, "row": row, "index": i,
                    "gapLeft": round(gaps[i - 1], 4) if i else None,
                    "headroom": round(ceiling - sy - hs[i], 4)})
        if not _SKIP:
            LABELS.append(rec)
            if neck_rec is not None:
                neck_rec.update({"part": "bottles-" + row, "row": row,
                                 "index": i, "parentIndex": i})
                LABELS.append(neck_rec)


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


def dim(img: np.ndarray, mask: np.ndarray, k) -> None:
    """Darken what is ALREADY THERE by MULTIPLYING it, and never past a floor.

    This is cast()'s rule applied to a material instead of to a shadow, and it
    is here because every dark mark inside the recess has to survive being drawn
    on a board that is only 84-118 to begin with. shade() and hand() both WRITE
    a number: shade() writes the value it is given, hand() writes 0. On the
    wall, at 130-200, a written 44 is a joint. On the lining it is a black wire,
    and nine of them ran the full height of the cut straight across both rows of
    bottles.

    `k` may be a scalar or a field. The floor is FIGURE_DROP below the board's
    own tone AT THAT PIXEL, so no mark may take a board more than 14 values
    below itself however light the board is, and a mark on a dark board is never
    deeper than the same mark on a light one - the thing an additive figure gets
    wrong. Floored against the board's NOMINAL tone instead, which is where this
    started, the floor bit hardest exactly where the board is already darkest:
    a joint landing on a board's shaded edge came out ONE value deep instead of
    twelve - present in the arithmetic and invisible on the page.
    """
    if _SKIP:
        return
    floor = 1.0 - FIGURE_DROP / np.maximum(img, 1.0)
    f = np.minimum(np.maximum(k, floor), 1.0)
    img *= 1.0 - mask * (1.0 - f)


def _rast(pts=None, line=None, width: int = 2) -> np.ndarray:
    """0..1 coverage for a projected polygon, or for a projected line of a fixed
    PAGE width - which is how a joint gets to be 2 px wide and not 2 px wide at
    one end of the wall and 5 px at the other."""
    m = Image.new("L", (W, H), 0)
    dd = ImageDraw.Draw(m)
    if pts is not None:
        dd.polygon([P(*q) for q in pts], fill=255)
    else:
        dd.line([P(*q) for q in line], fill=255, width=width)
    return np.asarray(m, np.float32) / 255.0


def lining_figure(img: np.ndarray, pts, seed: int) -> None:
    """The boards' figure, as a MULTIPLIER on the board's own tone.

    Same construction as the wall's grain() - _figure_field() is now the one
    place that knows how walnut is drawn - but at a LOWER STRENGTH AND A LOWER
    PITCH, and applied through dim(). grain() ADDS `g * strength`, and at
    strength 8 on a board of 84 its hearts land at 62: on a lit wall that is
    figure, inside a dark recess it is a wire. Here the same hearts become
    k 0.91 and stop there.

    THE PITCH IS THE ROUND (founder, 2026-09-08: "clean up the wood grain around
    the shelf"). At the wall's own numbers - 1.0-1.7 and 2.1-3.0 cycles across
    the board, two to four hearts 1.7 px wide - ten boards carried up to forty
    narrow near-vertical marks across the opening and the lining read as
    REEDING, the one thing the prompt has forbidden all along. Now: under one
    cycle across a board, ONE OR TWO hearts, and each of them 0.095 of the
    board's width - 6-8 px of sigma, a soft sweep of figure a hand's breadth
    wide instead of a scratch. Wider boards on top of that (BOARD_W), so there
    are eight of them and seven joints where there were ten and nine.
    """
    if _SKIP:
        return
    g, mask = _figure_field(pts, seed, LINING_FREQS, LINING_HEARTS,
                            LINING_HEART_W)
    if g is None:
        return
    # the broad modulation is worth about k 0.985; only the wide soft hearts
    # reach GRAIN_K, and nothing goes past it
    dim(img, mask, 1.0 - np.clip(-g, 0.0, 1.0) * (1.0 - GRAIN_K))


def lining(img: np.ndarray, d) -> None:
    """THE INSIDE OF THE CUT: plain vertical walnut boards.

    Not the wall's raised-and-fielded panels - the founder's "dont ... carry the
    walls look into the shelf" - and not one flat dark rectangle either, which
    is what the model turns into a picture or a switched-off screen. So: real
    boards, a joint between each, figure in every one, board-to-board variation
    so no two neighbours share a tone, and an overall value that falls left to
    right with the room's own light and sits about 80 below the panel fields
    the recess is cut into - the back of a box is the darkest large field
    inside its own frame, and at 118-84 it was not: it ran through exactly the
    values a clear bottle's liquid runs through, and twenty bottles read as a
    pattern painted on it. Calmer than the wall, and a great deal darker.

    EVERY DARK MARK IN HERE IS A MULTIPLIER. The joints and the figure go on
    through dim() at k 0.86, floored FIGURE_DROP below the board under them,
    so the darkest thing inside the recess is still the head's shade and not a
    line. Written values and hand() lines are what put nine black wires down the
    face of the last round's lining, across both rows of bottles.

    The two shades the cut throws on this lining are NOT here: they go on last,
    in recess_shade(), so that they fall on the bottles standing in front of the
    boards as well as on the boards. Through cast() either way, so they MULTIPLY
    what is under them and every joint and every run of grain survives - a flat
    grey band handed to the model comes back as a smear (2026-09-05).
    """
    x0, x1 = RECESS_X
    y0, y1 = RECESS_Y
    n = max(2, int(round((x1 - x0) / BOARD_W)))
    rs = np.random.RandomState(90811)
    vs = [LINING_V[0] + (LINING_V[1] - LINING_V[0]) * ((i + 0.5) / n)
          + rs.uniform(-8.0, 8.0)      # no two neighbours share a tone: boards
          for i in range(n)]           # cut from one log still differ, and a
                                       # run of identical strips is reeding
    for i in range(n):
        a = x0 + (x1 - x0) * i / n
        b = x0 + (x1 - x0) * (i + 1) / n
        v = vs[i]
        q = [(a, y1, ZB_REC), (b, y1, ZB_REC), (b, y0, ZB_REC), (a, y0, ZB_REC)]
        poly(d, q, 255)
        shade(img, q, v + 7, v - 7, "x")
        lining_figure(img, q, int(abs(a) * 811 + 97 * i + 17))
    # THE JOINTS, and they go on AFTER every board is painted. 2 px of page,
    # never more, and a multiplier floored on whichever of the two boards it
    # lies between is the darker - not a written value, and NOT a hand() line:
    # nine ruled lines at value 0 is what the last round put across both rows of
    # bottles. Drawn inside the loop, as they were first written, a joint lost
    # its right-hand half the moment the next board was laid, because shade()
    # OVERWRITES the values it fills rather than multiplying them - and the
    # joints measured LIGHTER than the boards they divide.
    for i in range(n - 1):
        bx = x0 + (x1 - x0) * (i + 1) / n
        dim(img, _rast(line=[(bx, y1, ZB_REC), (bx, y0, ZB_REC)], width=2), JOINT_K)


def recess_shade(img: np.ndarray) -> None:
    """The soft shade the cut throws INSIDE itself: one under the head, one down
    the left reveal.

    It is drawn LAST, after the boards and both rows, and that is the point.
    cast() multiplies whatever is already under it, so run here it darkens the
    tops of the upper bottles standing under the head and the left-hand bottles
    standing beside the reveal, exactly as it darkens the lining behind them.
    Run before them - which is where it started - the boards and the bottles
    were laid over their own shade at full value and each row came out lit by a
    different lamp from the wall behind it.

    Both bands stop clear of the two boards, and where a band begins at a board
    it begins BELOW the lowest row that board covers - y_at_px()'s rule - so no
    row of shade lands inside a member's own mask.
    """
    x0, x1 = RECESS_X
    y0, y1 = RECESS_Y
    cast(img, [(x0, y1 - SHADOW_GAP, ZB_REC), (x1, y1 - SHADOW_GAP, ZB_REC),
               (x1, y1 - SHADOW_GAP - HEAD_SHADE, ZB_REC),
               (x0, y1 - SHADOW_GAP - HEAD_SHADE, ZB_REC)], 0.52, 1.0, "y")
    xs = x0 + SHADOW_GAP
    lo_a = max(SHELF_YS[0], y_at_px(P(x0, SHELF_YS[0], ZF_REC)[1], x0, ZB_REC)) + SHADOW_GAP
    lo_b = min(SHELF_YS[1] - SHELF_T,
               y_at_px(P(x0, SHELF_YS[1] - SHELF_T, ZF_REC)[1], x0, ZB_REC)) - SHADOW_GAP
    up_a = max(SHELF_YS[1], y_at_px(P(x0, SHELF_YS[1], ZF_REC)[1], x0, ZB_REC)) + SHADOW_GAP
    for a, b in ((lo_a, lo_b), (up_a, y1 - SHADOW_GAP)):
        cast(img, [(xs, b, ZB_REC), (xs + REVEAL_SHADE, b, ZB_REC),
                   (xs + REVEAL_SHADE, a, ZB_REC), (xs, a, ZB_REC)], 0.70, 1.0, "x")


def reveals(img: np.ndarray, d) -> None:
    """The three faces of the cut itself.

    THE LEFT REVEAL is a real plane, 39.6 px of return, and it faces AWAY from
    the window: it is in shade and falls off going back, which is the single
    clearest thing saying the opening has depth.

    THE SOFFIT across the head is seen from below and is the darkest surface in
    the unit. It is only 13.9 px on its own - a flush recess cannot make it more
    without raking it into a pelmet - so it is not asked to work alone: the
    head's cast shade continues it down the lining for another 50 px, and the
    two read as one shadowed head.

    THE RIGHT REVEAL is edge-on. That jamb stands 0.19 m from the camera's own x
    and its plane projects to 5 px, so it is drawn as ONE lit arris on the
    opening's right edge instead - the same rule the old SIDE_MIN_PX stated for
    a post's side face. It faces the window, so it is the bright one.
    """
    x0, x1 = RECESS_X
    y0, y1 = RECESS_Y
    lr = [(x0, y1, ZF_REC), (x0, y1, ZB_REC), (x0, y0, ZB_REC), (x0, y0, ZF_REC)]
    poly(d, lr, 255)
    shade(img, lr, 92, 34, "x")
    poly(d, lr, None, 0, 1)
    sf = [(x0, y1, ZF_REC), (x1, y1, ZF_REC), (x1, y1, ZB_REC), (x0, y1, ZB_REC)]
    poly(d, sf, 255)
    shade(img, sf, 30, 17, "y")
    poly(d, sf, None, 0, 1)
    ar = [(x1 - RIGHT_ARRIS, y1, ZF_REC), (x1, y1, ZF_REC),
          (x1, y0, ZF_REC), (x1 - RIGHT_ARRIS, y0, ZF_REC)]
    poly(d, ar, 255)
    shade(img, ar, 210, 186, "y")
    poly(d, ar, None, 0, 1)


def shelf_board(img: np.ndarray, d, sy: float) -> None:
    """One 3 cm board, housed across the recess from reveal to reveal.

    Below the eye it is read TOP-DOWN: a lit top face running back to the
    lining, then the dark front edge under it. Above the eye it is read the
    other way up: a lit front edge, then its own underside, then the shadow it
    throws on the lining - one contiguous dark band. Either way the thickness is
    ONE member and not a stack: at 3 cm there are ten pixels to spend, and three
    members in ten pixels are three scratches (the round-2 hairline stack).
    """
    x0, x1 = RECESS_X
    y0, y1 = sy - SHELF_T, sy
    if EYE > y1:
        face = [(x0, y1, ZB_REC), (x1, y1, ZB_REC), (x1, y1, ZF_REC), (x0, y1, ZF_REC)]
        poly(d, face, 255)
        shade(img, face, 178, 200, "y")     # lit, and brightest at its front
        poly(d, face, None, 0, 1)
        edge = [(x0, y1, ZF_REC), (x1, y1, ZF_REC), (x1, y0, ZF_REC), (x0, y0, ZF_REC)]
        poly(d, edge, 255)
        shade(img, edge, 64, 42, "x")       # the dark square edge under it
        poly(d, edge, None, 0, 2)
    else:
        under = [(x0, y0, ZB_REC), (x1, y0, ZB_REC), (x1, y0, ZF_REC), (x0, y0, ZF_REC)]
        poly(d, under, 255)
        shade(img, under, 20, 12, "y")
        poly(d, under, None, 0, 1)
        edge = [(x0, y1, ZF_REC), (x1, y1, ZF_REC), (x1, y0, ZF_REC), (x0, y0, ZF_REC)]
        poly(d, edge, 255)
        shade(img, edge, 200, 166, "x")
        poly(d, edge, None, 0, 2)
        # and what it throws on the lining. It starts BELOW the lowest row the
        # board itself covers, not at the board's own y: y_at_px() is what keeps
        # the first rows of a shadow out of its caster's own mask.
        t = min(y0, y_at_px(P(x0, y0, ZF_REC)[1], x0, ZB_REC)) - SHADOW_GAP
        cast(img, [(x0, t, ZB_REC), (x1, t, ZB_REC),
                   (x1, t - SHELF_SHADOW, ZB_REC), (x0, t - SHELF_SHADOW, ZB_REC)],
             0.44, 1.0, "y")


def face_frame(img: np.ndarray, d) -> None:
    """THE FACE FRAME, FLUSH: one slim flat band of walnut lying IN the wall
    plane.

    No architrave, no bead, no bolection, nothing proud - and therefore nothing
    thrown on the panelling outside it. That is the whole of "inlaid": the wall
    is not disturbed, it is cut. What makes the band read is tone (above the
    panel fields it interrupts, below their lit surrounds) and a joint line at
    each of its four edges, and the straight ones are INKED IN CODE after the
    render like the marble's are.
    """
    fx0, fx1 = FRAME_X
    fy0, fy1 = FRAME_Y
    x0, x1 = RECESS_X
    y0, y1 = RECESS_Y
    lv, rv = FRAME_V
    bands = ((fx0, x0, fy0, fy1, lv + 4, lv - 8, "y"),      # the left stile
             (x1, fx1, fy0, fy1, rv + 4, rv - 8, "y"),      # the right
             (x0, x1, y1, fy1, lv + 2, rv + 2, "x"),        # the head
             (x0, x1, fy0, y0, lv - 6, rv - 6, "x"))        # the bottom rail
    for a, b, c, e, v0, v1, ax in bands:
        q = [(a, e, ZF_REC), (b, e, ZF_REC), (b, c, ZF_REC), (a, c, ZF_REC)]
        poly(d, q, 255)
        shade(img, q, v0, v1, ax)
    poly(d, [(fx0, fy1, ZF_REC), (fx1, fy1, ZF_REC),
             (fx1, fy0, ZF_REC), (fx0, fy0, ZF_REC)], None, 0, 2)
    poly(d, [(x0, y1, ZF_REC), (x1, y1, ZF_REC),
             (x1, y0, ZF_REC), (x0, y0, ZF_REC)], None, 0, 2)
    for a, b, y_, v in ((fx0, fx1, fy1, 30), (fx0, fx1, fy0, 30),
                        (x0, x1, y1, 24), (x0, x1, y0, 24)):
        INK.append({"part": "backbar", "width": 2, "value": v,
                    "points": [P(a, y_, ZF_REC), P(b, y_, ZF_REC)]})
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


# --------------------------------------------------------------- the cast
# ONE POSE PER LAYER. Every angle below is the plan's own number in the plan's
# own convention (reports/2026-09-05/CAST-PLAN.md): BODY YAW measured from
# camera-forward, 0 deg = chest square to the lens, 180 deg = back square to
# the lens, + = chest rotated toward frame-right, with the 16 degree camera pan
# already inside the number; HEAD YAW in the same frame; PITCH = degrees BELOW
# horizontal of the line eye-centre -> bill tip (Drew) or eye-centre -> nose tip
# (Barclay, Abby), negative meaning the look is raised.
#
# The angles are not decoration. Everything the block-in draws - which shoulder
# is toward us, which eye is the near one, which ear is the full leather and
# which is the tuft, where the bill lands - is DERIVED from them, so changing a
# pose is changing three numbers and nothing else.
_RIMG = (math.cos(_YAW), -math.sin(_YAW))    # frame-right, in plan
_FCAM = (math.sin(_YAW), math.cos(_YAW))     # the way the camera looks


def _yawdir(yaw_deg: float) -> tuple[float, float]:
    """The plan direction a chest or a head faces at the plan's yaw."""
    t = math.radians(yaw_deg)
    d0 = (-math.sin(_YAW), -math.cos(_YAW))          # square to the lens
    return (d0[0] * math.cos(t) + _RIMG[0] * math.sin(t),
            d0[1] * math.cos(t) + _RIMG[1] * math.sin(t))


def _side(v: tuple[float, float]) -> tuple[float, float]:
    """The figure's OWN right hand side, given the way he faces. Facing away
    from the camera a man's right hand is on our right, which is what fixes the
    sign: at body +146 Drew turns his right shoulder to the lens and at -144
    Barclay turns his left, exactly as the plan says they do."""
    return (v[1], -v[0])


def _depth(p) -> float:
    """Camera depth of a world point. Bigger is further away. This is what
    decides near from far - the near eye, the near ear, the near shoulder -
    instead of a hand-written guess that has to be re-guessed every pose."""
    return (p[0] - CAM_X) * _FCAM[0] + (p[2] - CAM_Z) * _FCAM[1]


def _skull_rx(a: float, b: float, hd: tuple[float, float]) -> float:
    """The PAGE half-width of a skull turned to `hd`. A head is an ellipsoid,
    longer front-to-back than it is wide, so a head in profile is WIDER on the
    page than a head square to us - the opposite of what a flat card turned with
    the yaw would do, which is why the head is drawn as a billboard whose radius
    is solved here rather than as a card that collapses to a line at 90 degrees."""
    hr = _side(hd)
    return math.hypot(a * (hd[0] * _RIMG[0] + hd[1] * _RIMG[1]),
                      b * (hr[0] * _RIMG[0] + hr[1] * _RIMG[1]))


def _face(c, rx: float, ry: float, n: int = 30):
    """An oval standing in the world, square to the camera: a skull, a hand, an
    eye. Built on the camera's own right vector so it projects as an ellipse
    instead of foreshortening away."""
    return [(c[0] + _RIMG[0] * rx * math.cos(2 * math.pi * i / n),
             c[1] + ry * math.sin(2 * math.pi * i / n),
             c[2] + _RIMG[1] * rx * math.cos(2 * math.pi * i / n)) for i in range(n)]


def _band(a, b, wa: float, wb: float):
    """A tapered quad between two world points, its width laid across the page:
    a neck segment, an arm, an ear, a lip band."""
    return [(a[0] - _RIMG[0] * wa / 2, a[1], a[2] - _RIMG[1] * wa / 2),
            (a[0] + _RIMG[0] * wa / 2, a[1], a[2] + _RIMG[1] * wa / 2),
            (b[0] + _RIMG[0] * wb / 2, b[1], b[2] + _RIMG[1] * wb / 2),
            (b[0] - _RIMG[0] * wb / 2, b[1], b[2] - _RIMG[1] * wb / 2)]


def _lattice(img, pts3, step: int, v: int) -> None:
    """A diamond knit lattice drawn INTO the values inside a polygon (no contour)."""
    proj = [P(*p) for p in pts3]
    m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).polygon(proj, fill=255)
    mask = np.asarray(m) > 127
    li = Image.new("L", (W, H), 255); dl = ImageDraw.Draw(li)
    xs = [p[0] for p in proj]; ys = [p[1] for p in proj]
    x0, x1, y0, y1 = int(min(xs)) - 2, int(max(xs)) + 2, int(min(ys)) - 2, int(max(ys)) + 2
    for k in range(x0 - (y1 - y0), x1 + (y1 - y0), step):
        dl.line([(k, y0), (k + (y1 - y0), y1)], fill=0, width=1)
        dl.line([(k, y1), (k + (y1 - y0), y0)], fill=0, width=1)
    lines = np.asarray(li) < 128
    img[mask & lines] = v


def _tone(img, d, pts3, v0, v1=None, axis="y"):
    """A filled value with NO contour line. A line drawn where the picture has
    no edge comes through the render as a black scratch; the bill's highlight
    ribbon is a value, not an edge."""
    poly(d, pts3, 255)
    shade(img, pts3, v0, v1, axis)


# The physiques, in metres, on the camera solve: shoulders 1.32 / 1.36, crowns
# 1.65 / 1.71 on a 0.76 m seat; Abby stands, so her crown is the highest head in
# the frame. skull = (front-to-back, across, top-to-bottom) half-axes.
PHYSIQUE = {
    "drew":    dict(hip_y=0.92, hip_hw=0.200, sh_y=1.32, sh_hw=0.175, neck_y=1.335,
                    crown=1.65, skull=(0.088, 0.078, 0.066), fwd=0.11, wave=0.055,
                    neck_w=(0.098, 0.058), arm_w=0.132,
                    v=dict(torso=(104, 128), collar=244, neck=(212, 226), head=222,
                           arm=(200, 216), hand=212)),
    "barclay": dict(hip_y=0.92, hip_hw=0.220, sh_y=1.36, sh_hw=0.215, neck_y=1.345,
                    crown=1.71, skull=(0.115, 0.100, 0.098), fwd=0.02, wave=0.012,
                    neck_w=(0.126, 0.104), arm_w=0.150,
                    v=dict(torso=(48, 68), collar=226, neck=(138, 150), head=150,
                           arm=(50, 66), hand=150)),
    "abby":    dict(hip_y=0.98, hip_hw=0.190, sh_y=1.50, sh_hw=0.170, neck_y=1.500,
                    crown=ABBY_CROWN, skull=(0.100, 0.100, 0.093), fwd=0.03, wave=0.008,
                    neck_w=(0.088, 0.076), arm_w=0.104,
                    v=dict(torso=(200, 218), collar=64, neck=(206, 214), head=224,
                           arm=(204, 216), hand=210)),
}

_ARM = None      # the pixels of the pose's near arm and hand. They reach PAST
                 # the thing that cuts the rest of the figure - the hand lies ON
                 # the marble - so the counter may hide Abby's waist and must not
                 # touch her hand.


def figure(img: np.ndarray, d, who: str, pose: dict) -> None:
    """ONE POSE, blocked in as graded values: the silhouette, the scale, the
    light and the gaze the character prompt is then rendered inside.

    Built from the pose's three numbers and nothing else. Torso and shoulders on
    the body yaw; the neck (Drew's one-reversal question mark, Barclay's short
    furred neck, Abby's slim one) carrying the head to where the head yaw puts
    it; the skull as a billboard whose width is solved for that yaw; the bill,
    the muzzle or the nose swung out along the head yaw and dropped by the
    PITCH, which is the plan's own definition of the line eye-centre -> tip; the
    near arm forward onto the marble. Near and far - which eye, which ear, which
    shoulder - are decided by camera depth, not by hand.
    """
    global _ARM
    q = PHYSIQUE[who]
    v = q["v"]
    bx, bz = pose["at"]
    body = _yawdir(pose["body"])
    bside = _side(body)
    hdir = _yawdir(pose["head"])
    hside = _side(hdir)
    pit = math.radians(pose["pitch"])
    hip_y, sh_y, sh_hw = q["hip_y"], q["sh_y"], q["sh_hw"]

    B = lambda s, y, f=0.0: (bx + bside[0] * s + body[0] * f, y,
                             bz + bside[1] * s + body[1] * f)

    # ---- torso and shoulders, square to the BODY yaw ------------------------
    torso_pts = [B(-q["hip_hw"], hip_y), B(q["hip_hw"], hip_y),
                 B(sh_hw * 1.04, sh_y - 0.09), B(sh_hw * 0.72, sh_y),
                 B(0.058, sh_y + 0.02), B(-0.058, sh_y + 0.02),
                 B(-sh_hw * 0.72, sh_y), B(-sh_hw * 1.04, sh_y - 0.09)]
    _blob(img, d, torso_pts, v["torso"][0], v["torso"][1], "y")
    if who == "drew":
        # THE VEST IS A GARMENT: a honeycomb knit lattice over the whole back and a
        # ribbed band at each armhole and the V. Two rounds rendered the vest as
        # plumage when it was only a tone (2026-09-06); a knit is a texture the
        # engraving model follows, as it follows the wood's grain.
        _lattice(img, torso_pts, 9, 62)
        for sx_ in (-1, 1):
            rib = [B(sx_ * sh_hw * 1.04, sh_y - 0.09), B(sx_ * sh_hw * 0.72, sh_y),
                   B(sx_ * sh_hw * 0.72 - sx_ * 0.035, sh_y - 0.01), B(sx_ * sh_hw * 1.04 - sx_ * 0.035, sh_y - 0.10)]
            _tone(img, d, rib, 86, 70, "y")
            hand(d, P(*rib[2]), P(*rib[3]), 1)
    if who == "barclay":
        hand(d, P(*B(0.0, hip_y + 0.02)), P(*B(0.0, sh_y - 0.03)), 1)   # the jacket's centre seam
    # ---- the neck: base at the shoulders, top under the skull ---------------
    # ONE polygon, not a stack of quads. Segment quads leave a seam and an
    # outline at every joint and the block-in came back reading as folded card
    # rather than as a neck; the two rails are sampled finely and closed into a
    # single contour instead.
    hy = q["crown"] - q["skull"][2]
    nb = (bx, bz)
    ht = (bx + hdir[0] * q["fwd"], bz + hdir[1] * q["fwd"])
    w0, w1 = q["neck_w"]
    segs, rail_l, rail_r = 16, [], []
    for i in range(segs + 1):
        t = i / segs
        # ONE REVERSAL, and one only: the sweep leans BACK out of the shoulders
        # and comes FORWARD at the top, so the head is carried forward of where
        # the neck left the body. A single sine does exactly that and cannot
        # accidentally grow a second bend.
        off = -q["wave"] * math.sin(2 * math.pi * t)
        cur = (nb[0] + (ht[0] - nb[0]) * t + hdir[0] * off,
               q["neck_y"] + (hy - q["neck_y"]) * t,
               nb[1] + (ht[1] - nb[1]) * t + hdir[1] * off)
        wc = w0 + (w1 - w0) * t
        rail_l.append((cur[0] - _RIMG[0] * wc / 2, cur[1], cur[2] - _RIMG[1] * wc / 2))
        rail_r.append((cur[0] + _RIMG[0] * wc / 2, cur[1], cur[2] + _RIMG[1] * wc / 2))
    _blob(img, d, rail_l + rail_r[::-1], v["neck"][0], v["neck"][1], "y", 2)
    # THE COLLAR LAST of the three. Drawn before the neck it is covered by it,
    # and the shirt collar has to show on BOTH sides of the neck it circles.
    _blob(img, d, [B(-0.062, sh_y + 0.005), B(0.062, sh_y + 0.005),
                   B(0.052, sh_y + 0.053), B(-0.052, sh_y + 0.053)], v["collar"])

    # ---- the head, turned per the yaw ---------------------------------------
    a3, b3, c3 = q["skull"]
    rx = _skull_rx(a3, b3, hdir)
    hc = (ht[0], hy, ht[1])
    # the near side of the face: the eye that is drawn, the ear that is a whole
    # leather. Decided by depth, so it follows the yaw on its own.
    es = 1 if _depth((hc[0] + hside[0] * b3, hy, hc[2] + hside[1] * b3)) < \
              _depth((hc[0] - hside[0] * b3, hy, hc[2] - hside[1] * b3)) else -1
    eye = (hc[0] + hdir[0] * a3 * 0.42 + hside[0] * es * b3 * 0.60,
           hy + c3 * 0.22,
           hc[2] + hdir[1] * a3 * 0.42 + hside[1] * es * b3 * 0.60)
    far = (hc[0] + hdir[0] * a3 * 0.52 - hside[0] * es * b3 * 0.34,
           hy + c3 * 0.22,
           hc[2] + hdir[1] * a3 * 0.52 - hside[1] * es * b3 * 0.34)
    tip_of = lambda L: (eye[0] + hdir[0] * L * math.cos(pit),
                        eye[1] - L * math.sin(pit),
                        eye[2] + hdir[1] * L * math.cos(pit))
    lerp = lambda A, Z, t: (A[0] + (Z[0] - A[0]) * t, A[1] + (Z[1] - A[1]) * t,
                            A[2] + (Z[2] - A[2]) * t)
    up = lambda p, dy: (p[0], p[1] + dy, p[2])

    # AN EAR ROOTS BEHIND THE EYE, never over the face. Rooted on the skull's
    # equator alone it projects onto the middle of a head turned in profile and
    # comes back as a slab across the muzzle; pulled back along the head's own
    # axis it hangs where a retriever's ear hangs.
    ear_x = lambda s: (hc[0] + hside[0] * s * b3 * 0.70 - hdir[0] * a3 * 0.75,
                       hc[2] + hside[1] * s * b3 * 0.70 - hdir[1] * a3 * 0.75)
    if who == "barclay":                       # the far drop ear, BEHIND the skull
        er = ear_x(-es)
        _blob(img, d, _band((er[0], hy + c3 * 0.30, er[1]),
                            (er[0], hy - c3 * 0.55, er[1]), 0.026, 0.030),
              118, 128, "y", 1)                # a tuft at most, never a second full ear

    _blob(img, d, _face(hc, rx, c3), v["head"], v["head"] - 14, "y")

    if who == "drew":
        # THE BILL. A slender wedge of EVEN taper, its depth at the feathers one
        # third of its length from eye-centre to tip, bending in one line to the
        # tip; the BLACK IS THE OUTER THIRD OF THAT LENGTH AND IS THE OUTLINE
        # there, with ONE bright ribbon inside it. Bible wording, not the master
        # prompt's cap. The pitch IS the drop of this line: 42 degrees below
        # horizontal on DREW-02, 56 on DREW-01 with the eye down in the martini.
        L = 0.190
        tip, dep = tip_of(L), 0.46 * 0.190     # HEAVIER than the bible's third: the approved plates and the
        tip = (tip[0], tip[1] - 0.022, tip[2]) # published set carry a deep bill bending down to a black tip, and a
        root = lerp(eye, tip, 0.12)            # thin wedge here left the mask reaching past every rendered bill (2026-09-06)
        _blob(img, d, [up(root, dep / 2), tip,  # the wedge floated off the head
                       up(root, -dep / 2)], 196, 208, "x")
        b0 = lerp(eye, tip, 0.667)
        db = dep * (1 - 0.667) / (1 - 0.12)
        _blob(img, d, [up(b0, db / 2), tip, up(b0, -db / 2)], 22)
        r0, r1 = lerp(eye, tip, 0.715), lerp(eye, tip, 0.945)
        _tone(img, d, [up(r0, db * 0.30), up(r1, db * 0.055),
                       up(r1, db * 0.005), up(r0, db * 0.14)], 232)
        # THE EYE IS BUILT WHITE FIRST. A dark dot on a pale head is a bird dot,
        # and a bird dot is a redraw in every bible in the folder - and the
        # block-in is the conditioning, so what is drawn here is what comes
        # back. Visible white, then a distinct dark iris inside it; no closed
        # outline round it and no lash, which is Drew's own rule.
        gx, gy = pose.get("iris", (0.0, 0.0))
        _tone(img, d, _face(up(eye, 0.004), 0.024, 0.0160), 240)
        _tone(img, d, _face((eye[0] + _RIMG[0] * gx, eye[1] + 0.004 + gy,
                             eye[2] + _RIMG[1] * gx), 0.0105, 0.0105), 68)
    elif who == "barclay":
        L = 0.135                              # the muzzle, blunt, not a point
        tip = tip_of(L)
        root = lerp(eye, tip, 0.20)
        _blob(img, d, [up(root, 0.048), up(tip, 0.026), up(tip, -0.026), up(root, -0.040)],
              136, 150, "y")
        nose = (tip[0] + hdir[0] * 0.010, tip[1] + 0.004, tip[2] + hdir[1] * 0.010)
        _blob(img, d, _face(nose, 0.024, 0.020), 26)                # the blackest mark on his head
        lip = lerp(eye, tip, 0.29)             # TWO NOSE-WIDTHS, ending under the
        _tone(img, d, _band(up(tip, -0.016), up(lip, -0.012), 0.010, 0.010), 44)  # eye's front corner
        # HIS EYE IN THREE MARKS, in the bible's own order: paper-white sclera
        # filling the rear 60 per cent, one solid dark mass pressed against the
        # FRONT corner and taking the front 40 and no more.
        _blob(img, d, _face(up(eye, 0.002), 0.023, 0.016), 242, 236, "y", 1)
        _tone(img, d, _face((eye[0] + hdir[0] * 0.0092, eye[1] + 0.002,
                             eye[2] + hdir[1] * 0.0092), 0.0092, 0.0130), 34)
        _blob(img, d, _face(up(far, 0.002), 0.013, 0.012), 240, 234, "y", 1)   # HALF the near one
        _tone(img, d, _face((far[0] + hdir[0] * 0.005, far[1] + 0.002,
                             far[2] + hdir[1] * 0.005), 0.005, 0.010), 46)
        er = ear_x(es)
        _blob(img, d, _band((er[0], hy + c3 * 0.30, er[1]),         # the near drop ear, rooting
                            (er[0], hy - c3 - 0.012, er[1]), 0.058, 0.070),   # level with the top of
              98, 118, "y", 1)                                      # the eye, ending at the jaw
    else:
        # ABBY. A round soft show-groomed westie head: her big black nose sits
        # DIRECTLY UNDER HER EYES and there is no muzzle to draw at all. The fur
        # silhouette is a shade darker than the face inside it so the groomed
        # head reads as fur and not as a bald oval.
        _blob(img, d, _face(hc, rx * 1.13, c3 * 1.11), 204, 214, "y")
        for s in (1, -1):                       # two small PRICKED ears, both up
            ep = (hc[0] + hside[0] * s * b3 * 0.62, hc[2] + hside[1] * s * b3 * 0.62)
            _blob(img, d, [(ep[0] - _RIMG[0] * 0.034, hy + c3 * 0.48, ep[1] - _RIMG[1] * 0.034),
                           (ep[0] + _RIMG[0] * 0.034, hy + c3 * 0.48, ep[1] + _RIMG[1] * 0.034),
                           (ep[0] + _RIMG[0] * 0.008, hy + c3 + 0.072, ep[1] + _RIMG[1] * 0.008)],
                  198, 210, "y", 1)
        _blob(img, d, _face(hc, rx * 0.93, c3 * 0.92), v["head"], v["head"] - 12, "y")
        nose = (hc[0] + hdir[0] * a3 * 0.55, eye[1] - 0.036, hc[2] + hdir[1] * a3 * 0.55)
        _blob(img, d, _face(nose, 0.022, 0.018), 24)
        # HER EYES ARE THE MOST BEAUTIFUL THING IN THE PANEL and they are built
        # like a HUMAN eye, not an animal's button: the WHITE first, a drawn
        # iris inside it, a distinct pupil SMALLER than the iris. Two dark
        # rounds on a white head is the eerie read her negatives name, and a
        # block-in that carries it teaches the model to draw it.
        for c_, ex, ey, ir, pu in ((eye, 0.028, 0.0185, 0.0140, 0.0058),
                                   (far, 0.016, 0.0115, 0.0082, 0.0034)):
            _blob(img, d, _face(c_, ex, ey), 244, 238, "y", 1)      # wider than it is tall
            _tone(img, d, _face(c_, ir, ir), 120)                   # the iris, mid-tone
            _tone(img, d, _face(c_, pu, pu), 34)                    # a smaller pupil
        _tone(img, d, _band((hc[0], q["neck_y"] + 0.030, hc[2]),    # the studded collar
                            (hc[0], q["neck_y"] + 0.008, hc[2]), 0.098, 0.098), v["collar"])

    # ---- the near arm, forward onto the marble ------------------------------
    # From here on the pixels are exempt from the occluder: the hand lies ON the
    # counter, so the counter that hides Abby's waist must not take her hand.
    own0 = np.array(_OWN[_CUR], dtype=np.uint8) > 127
    shl, shr = B(-sh_hw * 0.94, sh_y - 0.04), B(sh_hw * 0.94, sh_y - 0.04)
    near = shl if _depth(shl) < _depth(shr) else shr
    hp = pose["hand"]
    elb = (near[0] * 0.45 + hp[0] * 0.55, near[1] * 0.55 + hp[1] * 0.45 - 0.03,
           near[2] * 0.45 + hp[2] * 0.55)
    aw = q["arm_w"]
    _blob(img, d, _band(near, elb, aw, aw * 0.80), v["arm"][0], v["arm"][1], "y", 1)
    _blob(img, d, _band(elb, up(hp, 0.022), aw * 0.80, aw * 0.60), v["arm"][0], v["arm"][1], "y", 1)
    _blob(img, d, _face(hp, 0.060, 0.025), v["hand"])
    _ARM = (np.array(_OWN[_CUR], dtype=np.uint8) > 127) & ~own0

    # ---- the shadows: a SEPARATE layer, never the silhouette ----------------
    # The light is the window, at frame-left, so the hand throws back and to the
    # right. Started clear of the hand's own mask (the SHADOW_GAP lesson): a
    # shadow that shares pixels with its caster darkens the caster.
    cast(img, [(hp[0] - 0.010, COUNTER_H + 0.001, hp[2] + 0.075),
               (hp[0] + 0.175, COUNTER_H + 0.001, hp[2] + 0.075),
               (hp[0] + 0.175, COUNTER_H + 0.001, hp[2] + 0.210),
               (hp[0] - 0.010, COUNTER_H + 0.001, hp[2] + 0.210)], 0.62, 0.97, "x")
    if pose["occluder"] != "counter":          # the contact shadow in the chair
        cast(img, [B(-sh_hw * 0.98, hip_y + 0.16), B(sh_hw * 0.98, hip_y + 0.16),
                   B(sh_hw * 0.98, hip_y + 0.03), B(-sh_hw * 0.98, hip_y + 0.03)],
             0.58, 0.92, "y")


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

    # ---- THE INLAID UNIT: variant I1-FLUSH -----------------------------------
    # Back to front, which is also the order the light works in: the lining at
    # the back of the cut with the head's shade and the left reveal's on it,
    # then the faces of the cut itself; then the two boards and the two rows
    # standing in front of the lining; and last the flat band that lies in the
    # wall plane round the whole thing.
    #
    # NOTHING is drawn outside FRAME_X / FRAME_Y - there is no splashback and no
    # member of any kind below the bottom rail. The frame is flush, so the unit
    # throws nothing on the panelling and the wall's look is untouched; the
    # panelling simply runs on under the frame to the marble, and the wall's
    # stiles at world 0.06 and 0.92 stop at the frame and run on again above and
    # below it, which is what being let into a wall looks like.
    #
    # EVERY shadow this unit throws goes through cast(), inside the part that
    # throws it, so masks/<part>.png hold members only and shadows/<part>.png
    # hold the shading - the model is never handed a flat grey rectangle.
    part("backbar")
    lining(img, d)
    reveals(img, d)

    # the boards, in painter's order for THIS eye height: the lower board is
    # below the eye and is drawn BEFORE its row (the bottles stand on its lit
    # top face); the upper is above the eye and drawn AFTER (its front edge
    # hides their feet, which is what says they are standing on it)
    # THE COMPARTMENT CEILING travels with the row: the lower row must clear the
    # underside of the upper board (SHELF_YS[1] - SHELF_T) and the upper row the
    # head of the cut (RECESS_Y[1]), and bottle_row() holds every bottle
    # SHELF_HEADROOM under whichever of the two is over it.
    for name, sy, ceil in (("shelf-lower", SHELF_YS[0], SHELF_YS[1] - SHELF_T),
                           ("shelf-upper", SHELF_YS[1], RECESS_Y[1])):
        rname = name.split("-")[1]
        def board(sy=sy, name=name):
            part(name)
            shelf_board(img, d, sy)
        def row(sy=sy, rname=rname, ceil=ceil):
            part("bottles-" + rname)
            bottle_row(img, d, sy, rname, ceil)
        if EYE > sy:
            board(); row()
        else:
            row(); board()

    part("backbar")
    recess_shade(img)          # last, so it falls on the bottles too
    face_frame(img, d)

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
    for pid, pose in POSES.items():
        part(pid)
        if _SKIP:
            continue
        was_img = img.copy()
        was_ln = np.array(line, dtype=np.uint8)
        figure(img, d, pose["who"], pose)
        # WHAT STANDS IN FRONT OF THE POSE CUTS IT, and the same operation does
        # both cases. The sitter is INSIDE the chair: the leather stands in
        # front of his body, so his silhouette is what shows above and beside
        # it. Abby stands BEHIND the marble: the counter's far edge crosses her
        # at the waist and hides her below it - she is covered BY the counter,
        # never covering it. Her near arm and hand are the one exemption: they
        # lie ON the marble, and a blanket cut takes the hand off the counter
        # it is resting on.
        # The block-in itself is restored too, not just the mask. Leaving the
        # figure painted over the chair would hand the model a conditioning
        # picture of a man sitting THROUGH the leather and then throw the
        # answer away - which is the shared-values bug wearing a different hat.
        occ = pose["occluder"]
        if occ in _OWN and pid in _OWN:
            cut = np.asarray(_OWN[occ], dtype=np.uint8) > 127
            if occ == "counter" and _ARM is not None:
                cut = cut & ~_ARM
            fig = np.asarray(_OWN[pid], dtype=np.uint8) > 127
            _OWN[pid] = Image.fromarray(((fig & ~cut) * 255).astype(np.uint8))
            img[cut] = was_img[cut]
            ln = np.array(line, dtype=np.uint8)
            ln[cut] = was_ln[cut]
            line.paste(Image.fromarray(ln), (0, 0))

    # THE RECESS IS BEHIND WHAT STANDS IN IT, and the bookkeeping has to say so
    # twice - once in the masks, once in the shadow layers.
    #
    # MASKS. A part's silhouette is its OWN, drawn as if nothing stood in front
    # of it, and that is right for a chair in front of a bar. It is NOT right
    # inside a recess: the lining runs on behind both boards and both rows
    # because it is drawn first, and left in the mask it would be laid straight
    # back OVER the bottles the moment the carcass was laid - the same bug as a
    # figure's mask carrying the chair that stands in front of it. So every part
    # of the unit is cut by every part of the unit laid AFTER it.
    #
    # SHADOWS. A part's shadow layer is multiplied onto the plate as that part
    # is laid, so it can only mean anything where something is ALREADY there.
    # A shadow on the part's own body would darken its render twice, and one on
    # a part laid later is thrown away when that part is laid - and lands twice
    # in the conditioning. Both are cleared here, on the same rule.
    _UNIT = [p for p in LAY_ORDER
             if p in ("backbar", "shelf-lower", "bottles-lower",
                      "bottles-upper", "shelf-upper")]
    # NOT ONE PIXEL OUTSIDE THE FRAME, and in particular not one BELOW it. The
    # unit's outer edge is inked by hand(), which records itself 4 px wide in the
    # silhouette and wanders up to 2 px on top of that, so the frame's bottom
    # edge alone used to hang 3-4 rows of mask over panelling this unit must not
    # touch. Everything the unit is lives inside the face frame's outer
    # rectangle, so every one of its masks is cut to it.
    _fb = Image.new("L", (W, H), 0)
    ImageDraw.Draw(_fb).polygon(
        [P(FRAME_X[0], FRAME_Y[1], ZF_REC), P(FRAME_X[1], FRAME_Y[1], ZF_REC),
         P(FRAME_X[1], FRAME_Y[0], ZF_REC), P(FRAME_X[0], FRAME_Y[0], ZF_REC)],
        fill=255)
    _fbm = np.asarray(_fb, dtype=np.uint8) > 127
    for _p in _UNIT:
        if _p in _OWN:
            _OWN[_p] = Image.fromarray(
                (((np.asarray(_OWN[_p], dtype=np.uint8) > 127) & _fbm) * 255
                 ).astype(np.uint8))
    for _i, _p in enumerate(_UNIT):
        if _p not in _OWN:
            continue
        _after = np.zeros((H, W), bool)
        for _q in _UNIT[_i + 1:]:
            if _q in _OWN:
                _after |= np.asarray(_OWN[_q], dtype=np.uint8) > 127
        _self = np.asarray(_OWN[_p], dtype=np.uint8) > 127
        if _p in _SHADOW:
            _SHADOW[_p] = np.where(_self | _after, 1.0, _SHADOW[_p]).astype(np.float32)
            if float(_SHADOW[_p].min()) > 0.999:
                del _SHADOW[_p]          # it threw nothing on anything already laid
        if _after.any():
            _OWN[_p] = Image.fromarray((((_self & ~_after)) * 255).astype(np.uint8))

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
    # THE LABEL GEOMETRY, for scripts/label-bottles.py. Every bottle's label as
    # a PAGE QUAD - four corners, clockwise from top-left, exactly as quads.json
    # gives the screen and the board - plus its shape, its bottle kind and the
    # house brand that belongs on it. The brands are assigned by LABEL AREA:
    # sorted largest first and given the canon names longest first, cycling
    # through the list, so the longest name never lands on the smallest patch.
    # Lettering is code. The model is handed a blank patch and nothing else.
    _labels = [dict(r) for r in LABELS]
    _order = sorted(range(len(_labels)), key=lambda i: -(_labels[i]["widthPx"] * _labels[i]["heightPx"]))
    _names = sorted(BRANDS, key=lambda s: -len(s))
    for _rank, _i in enumerate(_order):
        _labels[_i]["brand"] = _names[_rank % len(_names)]
        _labels[_i]["areaRank"] = _rank
        _labels[_i]["letterable"] = (_labels[_i]["heightPx"] >= LABEL_MIN_PX
                                     and _labels[_i]["widthPx"] >= LABEL_MIN_W_PX)
    _seen: dict = {}
    for _r in _labels:
        _bkind = _r["bottleKind"] if _r["kind"] == "neck" else _r["kind"]
        _opts = BRAND_BY_KIND[_bkind]
        _seen[_bkind] = _seen.get(_bkind, -1) + 1
        _r["brandForKind"] = _opts[_seen[_bkind] % len(_opts)]
    (out / "labels.json").write_text(json.dumps({
        "_doc": "Measured in scripts/draw-room-lines.py. One entry per label in the "
                "inlaid recess - a body label per bottle (`kind` = the bottle's own "
                "kind, e.g. \"rum\") plus one extra entry per neck label (`kind` = "
                "\"neck\", `bottleKind` names the bottle it rides on; see `neck` "
                "below). `quad` is the label's box on the page - four corners, "
                "CLOCKWISE FROM TOP-LEFT - in the same convention as quads.json, so a "
                "typeset name or emblem is warped onto THOSE corners the way "
                "sign-on-glass.py warps the gilding onto the pane. `shape` is how the "
                "paper is cut (rectangle, band, oval, shield): inset the design for "
                "oval and shield. `ground` is \"white\" or \"black\" - a black-label "
                "bottle's paper is drawn dark (LABEL_V_BLACK) and its device inverts, "
                "light on dark. `labelPos` is \"high\" (pinned under the fill line) "
                "or \"low\" (anchored down the body) - see LOW_TOP_FRAC. DEFAULT PATH "
                "is scripts/label-bottles.py --mode emblems: no words at all, one "
                "device per label from its emblem library, chosen deterministically "
                "by label index so neighbours never match. `brand` and `brandForKind` "
                "remain, for --mode names only: `brand` is the house name assigned by "
                "LABEL AREA - labels sorted largest first, the canon names sorted "
                "longest first, cycled, so the longest name never lands on the "
                "smallest patch, and a name can repeat on a shelf this size as a real "
                "back bar's do; `brandForKind` is the same list read the other way, "
                "one whose category word matches the bottle's own kind (`neck` "
                "entries use their `bottleKind`). Regenerate whenever the camera, the "
                "recess or the rows move.",
        "font": {"minLabelPx": LABEL_MIN_PX, "minLabelWidthPx": LABEL_MIN_W_PX,
                 "capHeightMinPx": 6.0, "emblemMinPx": 26.0,
                 "note": "for --mode names: every label clears both floors where the "
                         "row's own width budget allows it (some of the eleven-lower/"
                         "nine-upper shelf's narrowest labels do not - see the build "
                         "log's own count). Set the brand's LONGEST WORD to the "
                         "label's inner width at a cap height of at least "
                         "capHeightMinPx; under that, set the brand's initials as a "
                         "monogram between the rules instead. For --mode emblems: a "
                         "bold device reads down to emblemMinPx, well under the name "
                         "floor, which is the whole reason the founder asked for "
                         "devices instead of words on a shelf this crowded"},
        "brands": list(BRANDS),
        "brandsByKind": {k: list(v) for k, v in BRAND_BY_KIND.items()},
        "labels": _labels,
    }, indent=2), encoding="utf8")
    # A VALUES IMAGE PER PART. The block-in a part is rendered from must never
    # contain what stands in front of it: the counter's block-in once carried the
    # chairs' silhouette and the model drew a chair back into the bar
    # (2026-09-05). Each part is drawn with only the ENABLED parts behind it
    # and itself - forced on if it is switched off, so it can still be rendered.
    (out / "values").mkdir(exist_ok=True)
    for i, name in enumerate(LAY_ORDER):
        behind = [p for p in LAY_ORDER[:i] if p not in DISABLED]
        if name == "backbar":
            # THE RECESS IS NEVER HANDED TO THE MODEL EMPTY. Its boards and
            # both rows are laid AFTER it, so LAY_ORDER[:i] does not carry
            # them - and a dark field inside a frame is exactly what comes
            # back as a picture or a switched-off screen. They go into its
            # block-in anyway; they are cut out of its mask above, so not
            # one of their pixels is ever taken from its render.
            behind = behind + [p for p in ("shelf-lower", "bottles-lower",
                                           "bottles-upper", "shelf-upper")
                               if p not in DISABLED]
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
