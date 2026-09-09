"""ONE WHOLE-SCENE PASS by the house edit model - v3, HEADLESS BLOCK-INS + solo P3.
THIS COPY (scene-edit-chain.py): ONE CHARACTER PER PASS, chained.

    python scripts/scene-edit-chain.py --seed 7 [--seed 41 ...] [--tag NAME]
        [--aspect 2:3|4:5] [--blockins drew,barclay,abby] [--no-blockins] [--blockin-heads none|full]
        [--abby-in-pass-a] [--pass2 canon/room-kit/v2/work/scene2-sA-final.png]
        [--edits drew,barclay] [--keep window-frame,glass] [--match-keep/--no-match-keep]
        [--p2 drew|barclay|abby|PATH] [--p3 barclay|tile|abby|none|PATH]
        [--repair drew|barclay|abby ...] [--abby-absent]
        [--bottles-crop canon/room-kit/v2/work/scene2-sA-final.png] [--bottles-p2 plate|none]
        [--chain drew,barclay,abby[,bottles] --seed N] [--chain-dry-stub PATH]
        [--head-edit/--no-head-edit] [--full] [--dry-run] [--out-dir DIR]

WHY THIS COPY EXISTS (2026-09-08, one lab session later still)
-----------------------------------------------------------------
Tonight's finding: painting all three seated block-ins into Picture 1 AT ONCE
makes the model scramble who is who (the flamingo lands behind the bar), and
text-only ADD edits with no block-in for that character never come out right
either - but a character built from ONE portrait at full size (Picture 2) and
ONE block-in comes out right, every time. So the scene now gets built ONE
CHARACTER PER PASS, each pass's render feeding the next as --pass2:
  - --blockins <names> (comma list from drew,barclay,abby; default
    drew,barclay - unchanged for a plain pass A) now names EXACTLY which
    figures get their block-in painted into Picture 1, and - new - it works
    in --pass2 mode too: the same paint_blockins() remap (100-180 grey, the
    part's own mask, blockin-heads none/full exactly as before) painted into
    the PREVIOUS RENDER instead of the plate. Left unspecified, --pass2 mode
    paints nothing (unchanged from before this flag took a name list) - a
    later pass must name its own --blockins explicitly. --no-blockins is the
    old boolean's disable side, kept working: it paints nothing, whatever
    --blockins says.
  - --p2/--p3 now resolve per pass (a new `pass_` argument on
    resolve_p2_mode/resolve_p3_mode): pass A's defaults (p2 drew, p3 barclay
    alone or the old tile) are unchanged; --pass2 mode's DEFAULT is also
    unchanged (p2 Abby's portrait in the old exact wording, p3 the plate's
    own back-bar crop when found) - but an EXPLICIT --p2/--p3 now works in
    --pass2 mode too, so a later solo pass can send THAT character's own
    portrait as Picture 2 (--p3 none, since a solo pass needs no third
    reference) instead of always Abby's.
  - The EDIT for a single later-pass character now also says the grey figure
    already in its chair/behind the ledge IS that character AND that whoever
    is already drawn in Picture 1 (the previous pass's cast) stays exactly as
    they are - blockin_identity_edits() below, added whenever --pass2 is used
    together with --blockins; pass A's own drew+barclay/abby sentences are
    untouched, verbatim, for backward compatibility.
  - --chain drew,barclay,abby[,bottles] --seed N runs those passes in
    sequence automatically: pass 1 has no --pass2 (Picture 1 is the plate);
    each later pass's Picture 1 is the PREVIOUS pass's raw render with that
    one pass's --blockins painted in; --p2 is always that pass's own
    character, --p3 always "none"; a trailing "bottles" step runs
    --bottles-crop on the chain's own last render. Outputs are tagged
    <tag>-<step>-s<seed>-raw/-final(/-room). Exactly one seed per chain run -
    the caller runs a separate --chain for each seed wanted.
  - --chain-dry-stub PATH: --dry-run + --chain only. A dry run makes no real
    render, so there is nothing for pass 2 to chain from; this path stands in
    for pass 1's (non-existent) raw render just that once. Every later step in
    a dry run chains from the PREVIOUS step's own Picture 1 instead (the only
    artifact a dry run actually produces) - ignored entirely outside
    --dry-run, where a real chain always chains its own actual raw renders.

This file is a working copy of scene-edit.py's own v4 - see below for that
file's unchanged pipeline history. scripts/scene-edit.py is mid-run and must
not be touched; the founder merges whichever of this copy's changes hold up.

WHY V4 (this same working copy, one lab session later)
-----------------------------------------------------------------
Pass A now seats both men right at every seed and gets identity right too when
Barclay is alone in Picture 3 - but a whole-plate re-roll to fix ONE head risks
the other one that is already right. So a THIRD pass joins A and B:
  - --repair <drew|barclay|abby> (repeatable; every name given lands in ONE
    pass, not one pass per name): Picture 1 is a --pass2 render (required),
    Picture 2 (and 3, 4... one per name) is that character's portrait ALONE,
    and the EDITS say only "redraw this head to match this portrait, keep the
    body/seat/pose/size/place exactly" - never touching a head that already
    reads right. --repair abby --abby-absent switches her line to "draw her
    in" for a render where she never appeared (a plain REDRAW would ask the
    model to fix a head that is not there).
  - --p2 generalizes what v3 already did for Picture 3: any character's
    portrait (or a path) can be Picture 2 too, default "drew" so every old
    call renders identically. --p3 now also accepts "none" (two references
    only) alongside barclay/tile/abby/PATH.
  - --bottles-crop runs the bottles EDIT on a tight 4:5 crop of the recess
    alone (masks/backbar.png's own box, grown 40 px, squared to 4:5 by
    height) instead of the whole plate - four times the pixels on the
    bottles for the same render - then tone-matches the patch to the ring
    just outside it (room-part.py's own tone_match(), the same primitive
    every part in that script is composited back with) and pastes it through
    the feathered union of the recess's five masks before the usual
    window-restore-then-sign finish.
  - --match-keep tone-matches a restored --keep region (the window) to the
    render's own ring just outside it after pasting the plate back in, so a
    paler scanned window does not sit against a darker re-inked room.

WHY V3 (this copy, working alongside the running scene-edit.py)
-----------------------------------------------------------------
Pass A tonight seated both characters correctly in the chairs from behind at
every seed, but IDENTITY failed: Drew's head came back as a vulture or a
turkey with a big hooked bill, and Barclay came back as a hound, a poodle, a
llama or a human. Three causes, three fixes:
  1. The painted block-in HEADS were leading the model - Drew's block-in bill
     is thick and hooked, Barclay's block-in skull is generic - so
     --blockin-heads none (the NEW DEFAULT) erases the block-in above the
     neck, per figure, from its own mask's bounding box: nothing but a bare
     grey neck stands in the chair for the portrait's head to land on.
     --blockin-heads full keeps v2's whole-figure paint.
  2. Barclay's portrait was sent HALF-SIZE in a tile with Abby - --p3 (new
     flag; default for pass A is now "barclay") sends Barclay's portrait
     ALONE at full size as Picture 3. --p3 tile keeps the old side-by-side
     behaviour; --p3 abby or a path to any image work too. Pass B's Picture 3
     (the plate's own back-bar recess, when found) is unchanged by --p3.
  3. The fast Lightning pass (8 steps, cfg 1) gives weak reference adherence
     - --full (unchanged from v2: 40-step cfg 4) already threads through to
     the bridge request as "fast": False and is recorded in the sidecar;
     --head-edit (default ON) adds one more numbered EDIT naming both heads
     explicitly, against the vulture/turkey/hound/poodle/person failures
     actually seen on the seed-7 proof.

Everything else below is v2, unchanged; see scripts/scene-edit.py's own
docstring for the full pipeline history (the whole-plate Picture 1, the
block-in construction, the post-processing order, the two-pass design).
This file is a working copy - scripts/scene-edit.py is mid-run and must not
be touched; the founder merges whichever of this file's changes hold up.

THE PIPELINE, TOP TO BOTTOM
----------------------------
 1. build_picture1()  - the plate (or, in --pass2, a previous render), with
    the seated block-ins painted in at 100-180 grey through their own masks
    (room-part.py's construction: values/figure-*-toward.png etc.) - HEADLESS
    by default (--blockin-heads none) - then cropped to --aspect if 4:5.
 2. build_references() - Picture 1 plus the portrait tile(s) for this pass,
    through cast-study.py's own prepare_reference() (grayscale, autocontrast,
    capped at 1024 w, JPEG q90) - the same treatment every house render gets.
 3. build_prompt()    - cast-study.py's roster convention, a numbered EDITS
    list assembled from --edits plus the block-in identification sentence,
    plus (--head-edit) the heads-from-portraits-alone sentence, and the LOCAL
    fence out of canon/MASTER-PROMPT.md (cs.local_fence), [SCENE]/[TV]/[BOARD]
    filled exactly as v1/v2 filled them.
 4. the render, scaled back to the plate's own 1200x1800.
 5. POST-PROCESSING, every render, in this order:
      a. percentile tone-match to the plate, fit on the union of every
         NON-FIGURE part mask (room-part.py's own mask_of/manifest) - "the
         room" - so the restored regions in step b do not sit at a different
         level than the render around them.
      b. --keep parts (default window-frame,glass) pasted back from the
         PLATE through their own mask with a 3 px feather - the window's
         street view is the plate's, never the model's invention.
      c. scripts/sign-on-glass.py, LAST, because gilding is pixels and
         anything painted after it wipes it.
    <tag>-s<seed>-raw.png is the untouched render; <tag>-s<seed>-final.png is
    the finished plate; <tag>-s<seed>.json is the sidecar (seed, pass, edits,
    keep, seconds, and the rest for the record).

TWO PASSES, ONE SCRIPT
-----------------------
PASS A (default): Picture 1 is the approved plate with Drew's and Barclay's
block-ins painted in (and Abby's too, with --abby-in-pass-a); EDITS default
to drew,barclay. PASS B (--pass2 <a pass-A final.png>): Picture 1 is that
render, already right about the room, the window and the seated cast - only
Abby and the bottles are still wrong, so EDITS default to abby,bottles and
Picture 2 becomes Abby's own portrait (Picture 3, when useful, the plate's own
back-bar recess, cropped, for the true shelves the bottles stand on).

Never the paid APIs: the AuraVision bridge at 127.0.0.1:8000 -> ComfyUI,
model local/qwen-image-edit-2511. room-part.py is IMPORTED here for
manifest()/mask_of()/load()/save() - never run as a command.
"""
from __future__ import annotations
import argparse, copy, datetime as dt, importlib.util, json, subprocess, sys, time
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
KIT = ROOT / "canon/room-kit/v2"
WORK = KIT / "work"

spec = importlib.util.spec_from_file_location("cs", ROOT / "scripts/cast-study.py")
cs = importlib.util.module_from_spec(spec); spec.loader.exec_module(cs)
# room-part.py is a MODULE here, for manifest()/mask_of()/load()/save() only -
# its main() is gated behind __name__ == "__main__" so importing it renders nothing.
rp_spec = importlib.util.spec_from_file_location("rp", ROOT / "scripts/room-part.py")
rp = importlib.util.module_from_spec(rp_spec); rp_spec.loader.exec_module(rp)

# The bridge's own SIZES (backend/providers/local_bridge.py): the plate is
# 1200x1800 = 2:3 exactly, so the whole plate goes in one pass, no crop.
BRIDGE_SIZE = {"2:3": (1232, 1840), "4:5": (1344, 1680)}
CROP_4_5 = (0, 300, 1200, 1800)          # v1's crop: the bar, chairs, back bar, window - not the ceiling
BLOCKIN_LO, BLOCKIN_HI = 100.0, 180.0    # the grey band a block-in is remapped into (the lab's own finding, 2026-09-08)
FIGURE_PART = {"drew": "figure-drew-02-toward", "barclay": "figure-barclay-02-toward", "abby": "figure-abby-01-ledge"}
DEFAULT_KEEP = ["window-frame", "glass"]

# --blockin-heads none: the fraction of EACH figure's own mask bounding-box
# height, measured down from its top, that is erased (left as the plate, not
# painted) - so only a bare grey neck stands in the chair, not a painted bill
# or skull. Drew's neck is long, so his fraction is a touch bigger than
# Barclay's or Abby's. A small table so each can be tuned on its own without
# touching the erase logic itself.
HEAD_FRAC = {"drew": 0.30, "barclay": 0.28, "abby": 0.28}

SCENE = ("Drew and Barclay seated at the marble bar of The Swinging Door in the two leather club chairs, seen from "
         "behind and turned toward each other in conversation, Abby the owner behind her working ledge in front of "
         "the inlaid back bar facing them, the street through the window")

NEGATIVE_EXTRA = "lettering, text, words, letters, caption, signature, watermark, colour, photographic"

# ---- EDIT text, cast-study.py's numbered-EDIT convention -----------------
EDIT_TEXT = {
    "abby_B": (
        "REDRAW ABBY (Picture 2) exactly matching her portrait, feature for feature, STANDING BEHIND the marble "
        "working ledge in front of the inlaid back bar, facing the room, both hands resting on her ledge, drawn "
        "from the waist up with the ledge in front of her, her closed-lip half-smile on the two of them; her pose, "
        "camera and place in the room stay exactly as Picture 1 already has them."
    ),
    "bottles": (
        "REDRAW THE BOTTLES on the two shelves of the inlaid recess as a REAL BAR'S BACK SHELF in the same "
        "engraved pen: many bottles shoulder to shoulder, of different shapes, heights and widths, clear and dark "
        "glass, corks and capsules, every one at least half full with a clean fill line, each wearing one plain "
        "paper label with a small crest or emblem and NO lettering."
    ),
}


def drew_edit_text(p2_mode: str) -> str:
    """Like barclay_edit_text below: the '(Picture 2)' citation only when
    Drew's own portrait is actually sent as Picture 2 - still the default,
    via --p2 drew, so every call that never touches --p2 reads identically
    to before --p2 existed."""
    ref = " (Picture 2)" if p2_mode == "drew" else ""
    return (
        f"ADD DREW{ref} SEATED IN the LEFT leather club chair on the NEAR side of the bar, filling it as a "
        "man fills a chair, seen from behind and a little to his left, his head turned back and across to his "
        "right toward Barclay in three-quarter so his bill and one heavy-lidded eye read against the room, the "
        "chair back standing in front of his lower body, his knit vest and white collar showing above it, his near "
        "feathered hand on the marble beside a martini."
    )


def barclay_edit_text(p3_mode: str) -> str:
    """The BARCLAY edit's Picture-3 citation depends on how Picture 3 was
    built this run: 'Picture 3, left' when it is the old side-by-side tile,
    plain 'Picture 3' when Barclay has it alone (the new default), nothing
    when Picture 3 is neither (a path, or Abby alone) so the edit never cites
    a picture that is not actually him."""
    ref = {"tile": " (Picture 3, left)", "barclay": " (Picture 3)"}.get(p3_mode, "")
    return (
        f"ADD BARCLAY{ref} SEATED IN the RIGHT leather club chair on the NEAR side of the bar, seen "
        "from behind and a little to his right, his head turned to his left toward Drew so his muzzle, one eye and "
        "a drop ear read, the chair back in front of his lower body, his blazer and collar above it, an old "
        "fashioned on the marble before him."
    )


def abby_a_edit_text(p3_mode: str) -> str:
    """Same idea for the pass-A ABBY edit (--abby-in-pass-a): 'Picture 3,
    right' only when Picture 3 is actually the old tile that holds her."""
    ref = " (Picture 3, right)" if p3_mode == "tile" else ""
    return (
        f"ADD ABBY{ref} STANDING BEHIND the marble working ledge in front of the inlaid back bar, "
        "facing the room, both hands resting on her ledge, drawn from the waist up with the ledge in front of her, "
        "her closed-lip half-smile on the two of them."
    )


KEEP_EVERYTHING_ELSE = ("KEEP EVERYTHING ELSE exactly as Picture 1: the marble bar and its edges, the two chairs, "
    "the panelled walls, the recess and its shelves, the working ledge, the window and the street, the television "
    "dark and blank, the chalkboard wiped. No lettering, no words, no caption, no signature anywhere.")
# Verbatim, per the founder's brief - EXACTLY this sentence when both are painted.
BLOCKIN_DREW_BARCLAY = ("The two pale grey figures already drawn in the two chairs ARE Drew and Barclay: draw them "
    "as their portraits exactly there, seated in those chairs on the near side of the bar, seen from behind, at "
    "that size, the chair backs in front of their lower bodies; nothing of them stands behind the bar.")
BLOCKIN_ABBY = ("The pale grey figure already drawn behind the ledge IS Abby: draw her as her portrait exactly "
    "there, standing behind the marble working ledge in front of the inlaid back bar, facing the room, at that "
    "size, drawn from the waist up.")
# ---- ONE-CHARACTER-PER-PASS block-in identity (this copy's own addition) --
# The per-name identify-and-place clause, reused whether a pass paints ONE
# block-in alone into pass A's plate (no other figure to keep untouched yet)
# or into a --pass2 render (where the founder's brief also wants the "stays
# exactly as they are" sentence below, appended once by blockin_identity_edits).
BLOCKIN_IDENTITY = {
    "drew": ("The pale grey figure already drawn in the left chair IS Drew: draw him as his portrait exactly "
             "there, seated in that chair on the near side of the bar, seen from behind, at that size, the chair "
             "back in front of his lower body."),
    "barclay": ("The pale grey figure already drawn in the right chair IS Barclay: draw him as his portrait "
                "exactly there, seated in that chair on the near side of the bar, seen from behind, at that size, "
                "the chair back in front of his lower body."),
    "abby": ("The pale grey figure already drawn behind the ledge IS Abby: draw her as her portrait exactly "
             "there, standing behind the marble working ledge in front of the inlaid back bar, facing the room, "
             "at that size, drawn from the waist up."),
}
BLOCKIN_STAY_TEXT = "The characters already drawn in Picture 1 stay exactly as they are."


def blockin_identity_edits(painted: list[str], pass_: str) -> list[str]:
    """One EDIT sentence per painted block-in, identifying it as its
    character. Pass A's classic drew+barclay pair (and Abby alone) keep the
    ORIGINAL combined sentences verbatim (BLOCKIN_DREW_BARCLAY / BLOCKIN_ABBY)
    for exact backward compatibility with every existing pass-A call; any
    other combination - a SOLO block-in in pass A (one character per pass),
    or any block-in painted into a --pass2 render - gets BLOCKIN_IDENTITY's
    sentence per name instead, and, only for a --pass2 build (pass_ == "B"),
    the founder's added sentence that whoever else is already drawn in
    Picture 1 (the previous pass's own cast) stays exactly as they are."""
    if not painted:
        return []
    edits: list[str] = []
    remaining = list(painted)
    if pass_ != "B" and "drew" in remaining and "barclay" in remaining:
        edits.append(BLOCKIN_DREW_BARCLAY)
        remaining = [n for n in remaining if n not in ("drew", "barclay")]
    for name in remaining:
        if pass_ != "B" and name == "abby":
            edits.append(BLOCKIN_ABBY)
        else:
            edits.append(BLOCKIN_IDENTITY[name])
    if pass_ == "B":
        edits.append(BLOCKIN_STAY_TEXT)
    return edits
# --head-edit (default ON), the founder's exact sentence, appended after the
# character edits: the block-ins gave the model a bill and a skull to lead
# from; this tells it, in the same numbered breath, to throw that lead away
# and draw the heads from the portraits alone.
HEAD_EDIT_TEXT = (
    "Their HEADS are drawn from the portraits alone, not from the grey figures: Drew's is the small refined head "
    "with the slender pale bill bending down to a black outer third and one heavy-lidded eye, Barclay's the "
    "golden retriever's soft muzzle, drop ear and kind eye - never a vulture, a turkey, a hound, a poodle or a "
    "person."
)

# ---- --repair <drew|barclay|abby> -----------------------------------------
# Where each figure sits, for the "REDRAW X'S HEAD AND FACE (the ...)" clause.
REPAIR_WHERE = {"drew": "bird in the left chair", "barclay": "dog in the right chair", "abby": "bartender behind the ledge"}
# The head description each repair cites, lifted VERBATIM from text already in
# this file - HEAD_EDIT_TEXT for Drew and Barclay, the portrait solo-text for
# Abby (who HEAD_EDIT_TEXT never names) - so a repair pass asks for exactly
# the same head every other pass already asks for, never a new description.
REPAIR_HEAD_DESC = {
    "drew": "the small refined head with the slender pale bill bending down to a black outer third and one heavy-lidded eye",
    "barclay": "the golden retriever's soft muzzle, drop ear and kind eye",
    "abby": ("pricked ears, dark button nose, human-looking eyes with white showing both sides of the iris and a "
             "lashed upper lid, a closed-lip half-smile"),
}


def repair_edit_text(name: str, pic_num: int, absent: bool = False) -> str:
    """The ONE numbered edit a --repair <name> pass makes: redraw just the
    head and face against Picture `pic_num` (that character's portrait
    alone), leaving body/seat/pose/size/place untouched - never the whole
    figure, so a head already right on the OTHER man is never put at risk.

    absent=True (--abby-absent) is for a render where Abby never appeared at
    all: a plain REDRAW would ask the model to fix a head that is not in
    Picture 1, so the line instead DRAWS her in, the same wording the pass-A
    and pass-B ADD/REDRAW-ABBY edits already use."""
    if name == "abby" and absent:
        return (
            f"DRAW ABBY (Picture {pic_num}) standing behind the marble working ledge in front of the inlaid back "
            f"bar, facing the room, both hands resting on her ledge, matching her portrait feature for feature: "
            f"{REPAIR_HEAD_DESC['abby']}. Keep the ledge, the recess and everything else exactly as Picture 1 "
            "has them."
        )
    pronoun = "her" if name == "abby" else "his"
    return (
        f"REDRAW {name.upper()}'S HEAD AND FACE (the {REPAIR_WHERE[name]}) to match Picture {pic_num} feature for "
        f"feature: {REPAIR_HEAD_DESC[name]}. Keep {pronoun} body, seat, pose, size and place exactly as Picture 1 "
        "has them."
    )


# ---- Picture 3 (pass A), --p3 ---------------------------------------------
PORTRAIT_PATH = {
    "drew": "canon/vision/studies/drew.png",
    "barclay": "canon/vision/studies/barclay.png",
    "abby": "canon/vision/studies/abby.png",
}
P3_SOLO_TEXT = {
    "barclay": (
        "Picture 3 is BARCLAY ALONE, at full size, the studio's official portrait - copy THIS dog identically: "
        "the golden retriever gentleman - soft golden coat, drop ears, kind human-looking eyes, a dark blazer "
        "over an open-collared shirt with a small flag pin."
    ),
    "abby": (
        "Picture 3 is ABBY ALONE, at full size, the studio's official portrait - copy THIS lady identically: the "
        "white West Highland terrier lady who owns the bar - pricked ears, dark button nose, human-looking eyes "
        "with white showing both sides of the iris and a lashed upper lid, a closed-lip half-smile, a pale blouse "
        "and a studded collar with a pendant."
    ),
    "drew": (
        "Picture 3 is DREW ALONE, at full size, the studio's official portrait - copy THIS bird identically: the "
        "small refined head, the slender pale bill bending down with its black outer third, the heavy-lidded "
        "amiable eye."
    ),
}
P3_TILE_TEXT = (
    "Picture 3 holds TWO portraits side by side: on the LEFT is BARCLAY, the golden retriever gentleman - soft "
    "golden coat, drop ears, kind human-looking eyes, a dark blazer over an open-collared shirt with a small "
    "flag pin; on the RIGHT is ABBY, the white West Highland terrier lady who owns the bar - pricked ears, dark "
    "button nose, human-looking eyes with white showing both sides of the iris and a lashed upper lid, a "
    "closed-lip half-smile, a pale blouse and a studded collar with a pendant. Copy each of them identically."
)
# Picture 1's own text, --p2 independent (the room never changes with --p2).
ROSTER_P1_A = (
    "REFERENCES. Picture 1 is THE APPROVED ROOM of The Swinging Door, the picture being edited: its "
    "camera, its crop, its light, its marble bar with the two leather club chairs seen from behind, its "
    "inlaid back bar above the working ledge, its window and its engraved black-and-white pen are already "
    "correct - two of the chairs may already carry pale grey block-in figures marking exactly where Drew "
    "and Barclay sit; nothing else in the room has changed."
)
# The full Picture-2 sentence for DREW specifically (the --p2 default): kept
# as its own constant, verbatim from before --p2 existed, so the default call
# still reads it word for word - the fuller wardrobe/neck detail a whole
# figure being ADDED needs, not just the head detail portrait_solo_text gives
# a character whose body is already right and only the head is in question.
P2_DREW_TEXT = (
    "Picture 2 is DREW, the studio's official portrait - copy THIS bird identically: the small refined head, "
    "the slender pale bill bending down with its black outer third, the heavy-lidded amiable eye, the long "
    "S-curve neck, white plumage in fine strokes, the white collar and small black bow tie, the knitted V-neck "
    "sweater vest, feathered hands with four fingers and a thumb."
)
# ---- pass B (--pass2) roster text -----------------------------------------
# LEGACY_* is byte-for-byte v2/v3's own pass-B roster (default: no --p2/--p3
# given, so Picture 2 is always Abby, Picture 3 the back-bar crop when found)
# - kept verbatim so every existing call that never touches --p2/--p3 in
# --pass2 mode reads exactly as it always has. GENERIC_PASS_B_PREAMBLE is
# this copy's own text for when --p2/--p3 ARE given explicitly (the --chain's
# own later-pass character), since "Only Abby and the bottles still need
# work" would be wrong when the pass in question is adding Barclay alone.
LEGACY_PASS_B_PREAMBLE = ("REFERENCES. Picture 1 is a PREVIOUS RENDER of this exact scene, already correct in its "
    "camera, its crop, its light, its room, its window and its seated cast: keep every one of those exactly as "
    "they are. Only Abby and the bottles still need work. ")
LEGACY_ABBY_PASS_B_TEXT = ("Picture 2 is ABBY, the studio's official portrait - copy THIS lady identically: the "
    "round soft head with the big black nose close under the eyes, the glamorous lidded eyes with white showing "
    "both sides of the iris and a lashed upper lid, the closed-lip half-smile, the smooth open neckline, the "
    "studded collar with its pendant.")
GENERIC_PASS_B_PREAMBLE = ("REFERENCES. Picture 1 is a PREVIOUS RENDER of this exact scene: its camera, its crop, "
    "its light, its room, its window and everyone already drawn in it are already correct, apart from the pale "
    "grey block-in just painted into it for this pass. ")


def portrait_solo_text(name: str, pic_num: int) -> str:
    """P3_SOLO_TEXT's sentence for `name`, renumbered from 'Picture 3' to
    'Picture {pic_num}' - the same solo-portrait phrasing reused wherever a
    single character's portrait lands alone, whichever picture slot it falls
    in (Picture 2 via a non-default --p2, Picture 3 via --p3, Picture 2+ in
    --repair)."""
    if name not in P3_SOLO_TEXT:
        return f"Picture {pic_num} is {name.upper()}'s official portrait, at full size - copy it identically."
    return P3_SOLO_TEXT[name].replace("Picture 3", f"Picture {pic_num}")


def resolve_p3_mode(a, pass_: str = "A") -> str:
    """--p3's effective value for THIS run, now per PASS: pass A's rule is
    unchanged - explicit if given (including "none" - two references only),
    otherwise "tile" when --abby-in-pass-a needs Abby's portrait alongside
    Barclay's, else the default "barclay" alone. --pass2 mode (pass_ == "B"):
    explicit if given (new capability - the --chain's "--p3 none" for a solo
    later pass, or any other name/path/tile), else "" - a sentinel
    build_references reads as "fall back to the old back-bar-crop default",
    exactly as before this per-pass version existed."""
    if a.p3.strip():
        return a.p3.strip()
    if pass_ != "A":
        return ""
    return "tile" if a.abby_in_pass_a else "barclay"


def resolve_p2_mode(a, pass_: str = "A") -> str:
    """--p2's effective value for THIS run, now per PASS: pass A's default is
    unchanged ("drew"). --pass2 mode (pass_ == "B") defaults to "abby" -
    exactly the old hardcoded pass-B Picture 2 - but an EXPLICIT --p2 now
    takes effect there too (new capability - the --chain's own character per
    later pass), where before --p2 was silently ignored in pass B."""
    if a.p2.strip():
        return a.p2.strip()
    return "drew" if pass_ == "A" else "abby"


def resolve_pic_reference(mode: str, pic_num: int) -> tuple[Path, str]:
    """A reference image + its sentence for Picture `pic_num`, resolving
    `mode` the same way every non-default --p2/--p3 mode already resolved
    before this helper existed (factored out of build_references' pass-A
    branch, unchanged, so pass B can share it too): a name in PORTRAIT_PATH
    becomes that character's own portrait, described by portrait_solo_text();
    anything else is treated as a path, described generically by its own
    filename."""
    if mode in PORTRAIT_PATH:
        p, _ = cs.prepare_reference(ROOT / PORTRAIT_PATH[mode])
        return p, portrait_solo_text(mode, pic_num)
    src = Path(mode)
    if not src.is_absolute():
        src = ROOT / src
    p, _ = cs.prepare_reference(src)
    return p, f"Picture {pic_num} is the reference portrait {src.name} - copy it identically."


def build_tile_reference(out_dir: Path, tag: str) -> tuple[Path, str]:
    """Picture 3's old side-by-side BARCLAY+ABBY tile (--p3 tile), factored
    out of build_references' pass-A branch, unchanged, so pass B can build
    the same tile too if ever asked for it."""
    bc = Image.open(ROOT / "canon/vision/studies/barclay.png").convert("L")
    ab = Image.open(ROOT / "canon/vision/studies/abby.png").convert("L")
    h = 1024
    bc = bc.resize((round(bc.width * h / bc.height), h), Image.LANCZOS)
    ab = ab.resize((round(ab.width * h / ab.height), h), Image.LANCZOS)
    tile = Image.new("L", (bc.width + ab.width + 24, h), 255)
    tile.paste(bc, (0, 0)); tile.paste(ab, (bc.width + 24, 0))
    tp = out_dir / f"{tag}-picture3-tile.png"; tile.save(tp)
    p3, _ = cs.prepare_reference(tp)
    return p3, P3_TILE_TEXT


def resolve_blockins(a, pass_: str) -> list[str]:
    """--blockins <names> resolved for THIS pass. --no-blockins (the old
    boolean flag's disable side) always wins and paints nothing, whatever
    --blockins says. Otherwise an explicit --blockins is split on commas and
    used AS GIVEN, in any pass - pass A (the plate) or --pass2 (a previous
    render - this copy's new capability, painting a later pass's ONE
    block-in into it exactly as pass A paints onto the plate). Left
    unspecified, the default is 'drew,barclay' in pass A (unchanged from
    before --blockins took a name list) and nothing at all in --pass2 or
    --repair mode (also unchanged - neither ever painted a block-in before
    this copy existed), so a --chain step - or any other later pass wanting
    one - must name its own --blockins explicitly."""
    if a.no_blockins:
        return []
    if a.blockins is not None:
        return [x.strip() for x in a.blockins.split(",") if x.strip()]
    return ["drew", "barclay"] if pass_ == "A" else []


# --------------------------------------------------------------- Picture 1
def paint_blockins(plate: np.ndarray, man: dict, figs: list[str], blockin_heads: str = "none") -> np.ndarray:
    """The construction's seated-pose values, remapped linearly into
    [BLOCKIN_LO, BLOCKIN_HI] on EACH part's own min/max inside its own mask,
    replacing the plate's pixels there. Hard-edged - the mask IS the seam the
    model is told about, not a thing to feather away.

    blockin_heads "none" (the new default): the block-in is painted WITHOUT
    its head. For each figure, take its mask's own bounding box (top, height)
    and drop everything above y = top + HEAD_FRAC[fig] * height - leave the
    plate exactly as it was there - so only a bare grey neck stands in the
    chair for the portrait's head to land on, instead of a painted bill or
    skull leading the model toward a vulture or a hound. blockin_heads "full"
    keeps v2's whole-figure paint, head included."""
    out = plate.copy()
    rows = np.arange(plate.shape[0])[:, None]
    for fig in figs:
        part = next(p for p in man["parts"] if p["id"] == FIGURE_PART[fig])
        mask = rp.mask_of(part) > 0.5
        values = rp.load(KIT / part["values"])
        lo, hi = float(values[mask].min()), float(values[mask].max())
        remapped = BLOCKIN_LO + (values - lo) / max(hi - lo, 1e-6) * (BLOCKIN_HI - BLOCKIN_LO)
        paint_mask = mask
        if blockin_heads == "none":
            ys = np.where(mask.any(axis=1))[0]
            top, bottom = int(ys.min()), int(ys.max())
            cutoff = top + HEAD_FRAC.get(fig, 0.28) * (bottom - top + 1)
            paint_mask = mask & (rows >= cutoff)
        out = np.where(paint_mask, remapped, out)
    return out


def build_picture1(a, man: dict, out_dir: Path) -> tuple[Path, list[str], str]:
    """Returns (picture1 path, figures painted as block-ins, pass "A"/"B"/"R").

    "R" (--repair) loads from --pass2 exactly like "B" does - no block-ins,
    the render as it stands - it only differs from "B" in what build_references
    and build_prompt do with it afterwards (one or more single-head fixes
    instead of Abby-and-bottles).

    --blockins now works in EITHER "A" or "B": whichever figures
    resolve_blockins() names for this pass are painted into Picture 1 -
    the plate itself in pass A, the --pass2 render in pass B - with the
    SAME paint_blockins() (same 100-180 remap, same masks, same
    --blockin-heads treatment) either way. "R" never paints a block-in,
    same as before this flag took a name list."""
    pass_ = "R" if a.repair else ("B" if a.pass2 else "A")
    painted: list[str] = []
    if a.pass2:
        src = Path(a.pass2)
        if not src.is_absolute():
            src = ROOT / src
        plate = rp.load(src)                      # room-part.py's load(): grayscale, resized to 1200x1800 if not already
    else:
        plate = rp.load(KIT / "plate.png")
    if pass_ != "R":
        figs = resolve_blockins(a, pass_)
        if pass_ == "A" and a.abby_in_pass_a and "abby" not in figs:
            figs = figs + ["abby"]
        if figs:
            plate = paint_blockins(plate, man, figs, a.blockin_heads)
            painted = figs
    if a.aspect == "4:5":
        x0, y0, x1, y1 = CROP_4_5
        plate = plate[y0:y1, x0:x1]
    # --chain (getattr, since ordinary calls never set this attribute) always
    # gets the tag-prefixed name even under --dry-run: a chain's own steps
    # can share the same pass_ label (every character-added-to-a--pass2-render
    # step is pass "B"), and the untagged dry-run shorthand below would then
    # have step 3 silently overwrite step 2's Picture 1.
    untagged_dry_run = a.dry_run and not getattr(a, "chain_step", False)
    fname = f"picture1-pass{pass_}.png" if untagged_dry_run else f"{a.tag}-picture1-pass{pass_}.png"
    p1_path = out_dir / fname
    rp.save(plate, p1_path)
    return p1_path, painted, pass_


# ------------------------------------------------------------- references
def backbar_crop(man: dict, out_dir: Path, tag: str) -> Path | None:
    """The plate's own back-bar recess (both shelves, both bottle rows),
    cropped from the APPROVED plate - pass B's reminder of the true shelves
    the bottles have to stand on, not the render's own guess."""
    ids = ("backbar", "shelf-lower", "shelf-upper", "bottles-lower", "bottles-upper")
    m = np.zeros((1800, 1200), bool)
    for pid in ids:
        part = next((p for p in man["parts"] if p["id"] == pid), None)
        if part:
            m |= rp.mask_of(part) > 0.5
    ys, xs = np.where(m)
    if ys.size == 0:
        return None
    pad = 20
    x0, x1 = max(0, int(xs.min()) - pad), min(1200, int(xs.max()) + pad)
    y0, y1 = max(0, int(ys.min()) - pad), min(1800, int(ys.max()) + pad)
    crop = rp.load(KIT / "plate.png")[y0:y1, x0:x1]
    p = out_dir / f"{tag}-picture3-backbar.png"
    rp.save(crop, p)
    return p


def build_references(a, man: dict, p1_path: Path, pass_: str, out_dir: Path, p3_mode: str = "",
                      p2_mode: str = "") -> tuple[list[str], str]:
    p1, _ = cs.prepare_reference(p1_path)
    if pass_ == "R":
        # One reference per --repair name, Picture 2 upward, that character's
        # portrait alone - no Picture beyond the last name given (a single
        # --repair sends exactly two references, matching the founder's brief).
        images = [p1]
        sentences = []
        for i, name in enumerate(a.repair):
            p, _ = cs.prepare_reference(ROOT / PORTRAIT_PATH[name])
            images.append(p)
            sentences.append(portrait_solo_text(name, i + 2))
        roster = ("REFERENCES. Picture 1 is a PREVIOUS RENDER of this exact scene: its camera, its crop, its "
                  "light, its room, its window, the bar and every figure's body, seat, pose, size and place are "
                  "already correct - only the head(s) named below still need work. " + " ".join(sentences))
        return images, roster
    if pass_ == "A":
        if p2_mode == "drew":
            p2, _ = cs.prepare_reference(ROOT / "canon/vision/studies/drew.png")
            p2_text = P2_DREW_TEXT
        else:
            p2, p2_text = resolve_pic_reference(p2_mode, 2)
        images = [p1, p2]
        p3_text = ""
        if p3_mode == "none" or not p3_mode:
            pass                                    # two references only
        elif p3_mode == "tile":
            p3, p3_text = build_tile_reference(out_dir, a.tag)
            images.append(p3)
        else:
            p3, p3_text = resolve_pic_reference(p3_mode, 3)
            images.append(p3)
        roster = ROSTER_P1_A + " " + p2_text + (" " + p3_text if p3_text else "")
        return images, roster
    # pass B (--pass2). DEFAULT (p2_mode "abby", p3_mode "" - i.e. neither
    # --p2 nor --p3 given): Picture 2 is Abby's own portrait in the OLD exact
    # wording, Picture 3 (when found) the plate's own back-bar crop - byte for
    # byte the v2/v3 behaviour, unchanged. An EXPLICIT --p2/--p3 (this copy's
    # new capability, for a --chain's later solo pass) is built the same
    # general way pass A's own Picture 2/3 already are, so a later pass can
    # send THAT character's own portrait as Picture 2 instead of always Abby's.
    legacy_p2_p3 = (p2_mode == "abby" and p3_mode == "")
    if p2_mode == "abby":
        p2, _ = cs.prepare_reference(ROOT / "canon/vision/studies/abby.png")
        p2_text = LEGACY_ABBY_PASS_B_TEXT
    elif p2_mode == "drew":
        p2, _ = cs.prepare_reference(ROOT / "canon/vision/studies/drew.png")
        p2_text = P2_DREW_TEXT
    else:
        p2, p2_text = resolve_pic_reference(p2_mode, 2)
    images = [p1, p2]
    p3_text = ""
    if p3_mode == "":
        bb = backbar_crop(man, out_dir, a.tag)
        if bb:
            p3, _ = cs.prepare_reference(bb)
            images.append(p3)
            p3_text = (" Picture 3 is the approved plate's OWN back-bar recess, cropped close - the true shape of "
                       "its two shelves - for the bottles' scale and placement only, not for anything else in it.")
    elif p3_mode == "none":
        pass                                        # two references only
    elif p3_mode == "tile":
        p3, p3_text = build_tile_reference(out_dir, a.tag)
        images.append(p3)
        p3_text = " " + p3_text
    else:
        p3, extra_text = resolve_pic_reference(p3_mode, 3)
        images.append(p3)
        p3_text = " " + extra_text
    preamble = LEGACY_PASS_B_PREAMBLE if legacy_p2_p3 else GENERIC_PASS_B_PREAMBLE
    roster = preamble + p2_text + p3_text
    return images, roster


# ------------------------------------------------------------------ prompt
def build_prompt(a, roster: str, painted: list[str], edits_selected: list[str], pass_: str, p3_mode: str = "",
                  p2_mode: str = "") -> str:
    edits: list[str] = []
    if pass_ == "R":
        for i, name in enumerate(a.repair):
            edits.append(repair_edit_text(name, i + 2, absent=(name == "abby" and a.abby_absent)))
    else:
        for key in ("drew", "barclay", "abby", "bottles"):
            if key not in edits_selected:
                continue
            if key == "drew":
                edits.append(drew_edit_text(p2_mode))
            elif key == "barclay":
                edits.append(barclay_edit_text(p3_mode))
            elif key == "abby":
                edits.append(EDIT_TEXT["abby_B"] if pass_ == "B" else abby_a_edit_text(p3_mode))
            else:
                edits.append(EDIT_TEXT[key])
        edits.extend(blockin_identity_edits(painted, pass_))
        if a.head_edit and ("drew" in edits_selected or "barclay" in edits_selected):
            edits.append(HEAD_EDIT_TEXT)
    edits.append(KEEP_EVERYTHING_ELSE)
    body = ("MAKE THESE CHANGES TO PICTURE 1 AND KEEP EVERYTHING ELSE. The result is Picture 1 itself with the cast "
            "added, one unbroken scene edge to edge, in the same engraved black-and-white pen.\n"
            + "\n".join(f"{i + 1}. {e}" for i, e in enumerate(edits)))
    master = (ROOT / "canon/MASTER-PROMPT.md").read_text(encoding="utf8")
    fence = cs.local_fence(master).replace("[SCENE]", SCENE) \
        .replace("[TV]", "nothing - the screen is dark and blank").replace("[BOARD]", "nothing - the slate is wiped")
    return roster + "\n\n" + body + "\n\nTHE RULES THE FINISHED PICTURE OBEYS:\n" + fence


# ------------------------------------------------------------- post-process
def non_figure_mask(man: dict) -> np.ndarray:
    """THE ROOM: every part's mask except the figures - the region a tone
    match is fit on, and never a figure that just changed under the model's
    hand."""
    m = np.zeros((1800, 1200), bool)
    for relpath in man["base"]["masks"].values():
        m |= rp.mask_of({"mask": relpath}) > 0.5
    for part in man["parts"]:
        if not part["id"].startswith("figure-"):
            m |= rp.mask_of(part) > 0.5
    return m


def percentile_tone_match(render: np.ndarray, plate: np.ndarray, region: np.ndarray) -> np.ndarray:
    """A LUT built from matching percentiles of `render` to `plate`, ON the
    given region only, then applied to the WHOLE render - so the render's
    overall level and contrast are pulled onto the plate's before any part is
    pasted back into it."""
    pct = np.linspace(0, 100, 21)
    src = np.percentile(render[region], pct)
    dst = np.percentile(plate[region], pct)
    src = np.maximum.accumulate(src)               # np.interp wants x non-decreasing
    lut = np.interp(np.arange(256), src, dst, left=dst[0], right=dst[-1])
    return lut[np.clip(render, 0, 255).astype(np.uint8)].astype(np.float32)


def restore_parts(image: np.ndarray, plate: np.ndarray, man: dict, keep_ids: list[str], feather: float = 3.0,
                   match_keep: bool = False, band_px: float = 40.0) -> np.ndarray:
    """--keep parts pasted back from the PLATE. --match-keep (match_keep=True)
    first releveled: the plate's own pixels in a `band_px`-wide ring just
    outside the part's own mask are percentile-matched to the RENDER's
    (already-restored-so-far) pixels in that same ring, so the pasted plate
    content picks up the re-inked room's level right where the two abut,
    instead of sitting paler (or darker) than its neighbours."""
    out = image.copy()
    for pid in keep_ids:
        if pid in man["base"]["masks"]:
            mask_arg = {"mask": man["base"]["masks"][pid]}
        else:
            part = next((p for p in man["parts"] if p["id"] == pid), None)
            if part is None:
                raise SystemExit(f"--keep: no such part or base region {pid!r}")
            mask_arg = part
        soft = rp.mask_of(mask_arg, feather=feather)
        plate_src = plate
        if match_keep:
            hard = rp.mask_of(mask_arg, feather=0.0) > 0.5
            ring = ndimage.binary_dilation(hard, np.ones((3, 3)), iterations=int(band_px)) & ~hard
            if ring.sum() >= 800:
                plate_src = percentile_tone_match(plate, out, ring)
        out = out * (1 - soft) + plate_src * soft
    return out


# ------------------------------------------------------------- --room-from-plate
# The APPROVED PLATE stays the finished plate everywhere; the render is let
# through only inside (a) the three seated-figure masks, dilated so the
# model's own edge (never exactly the mask's) is covered, and (b) the recess
# where the bottles live - both soft-edged so the seam is never visible.
FIGURES_FOR_ROOM = tuple(FIGURE_PART.values())          # figure-drew-02-toward, figure-barclay-02-toward, figure-abby-01-ledge
FURNITURE_OVER_FIGURES = ("chair-left", "chair-right", "counter")   # the plate's OWN furniture, re-applied on top


def figures_union_mask(man: dict, ids: tuple[str, ...], dilate: int = 0, feather: float = 0.0) -> np.ndarray:
    """The HARD union of the given parts' masks, dilated by `dilate` px as one region (never dilated part by
    part, which would blur three separate rings where the figures sit close together), then feathered once."""
    hard = np.zeros((1800, 1200), bool)
    for pid in ids:
        part = next(p for p in man["parts"] if p["id"] == pid)
        hard |= rp.mask_of(part) > 0.5
    if dilate:
        hard = ndimage.binary_dilation(hard, iterations=dilate)
    if not feather:
        return hard.astype(np.float32)
    return np.asarray(Image.fromarray((hard * 255).astype(np.uint8)).filter(
        ImageFilter.GaussianBlur(feather)), np.float32) / 255.0


def room_from_plate_mask(man: dict, dilate_figures: int = 10) -> np.ndarray:
    """--room-from-plate's WINDOW onto the render: the three seated-figure masks' union dilated
    `dilate_figures` px, combined (np.maximum) with the recess's five-mask union (backbar_union_mask, defined
    below under --bottles-crop - the same primitive, reused) - both feathered 4 px. Everywhere else in the
    composite this builds is the plate, untouched."""
    fig = figures_union_mask(man, FIGURES_FOR_ROOM, dilate=dilate_figures, feather=4.0)
    recess = backbar_union_mask(man, feather=4.0)
    return np.maximum(fig, recess)


def build_room_from_plate(render_toned: np.ndarray, plate: np.ndarray, man: dict, keep_ids: list[str],
                           dilate_figures: int = 10, match_keep: bool = False) -> np.ndarray:
    """The plate everywhere, the (already plate-tone-matched) render showing only through
    room_from_plate_mask()'s window, with the plate's OWN chair-left/chair-right/counter masks re-pasted on top
    (small 3 px feather, the same the rest of this file's restores use) so the furniture standing in front of the
    seated figures - the chair backs, the counter edge - stays the plate's crisp engraving, never the render's
    softer redraw of it; then the usual --keep parts (the window, the glass) restored exactly as -final.png gets
    them. render_toned must already be percentile-matched to the plate (build_prompt's callers already do this
    once, before both -final.png and this composite are built from the same toned array) - this function only
    decides WHERE that toned render is allowed to show, never re-levels it again."""
    window = room_from_plate_mask(man, dilate_figures=dilate_figures)
    out = plate * (1 - window) + render_toned * window
    for pid in FURNITURE_OVER_FIGURES:
        part = next(p for p in man["parts"] if p["id"] == pid)
        soft = rp.mask_of(part, feather=3.0)
        out = out * (1 - soft) + plate * soft
    return restore_parts(out, plate, man, keep_ids, feather=3.0, match_keep=match_keep)


# ------------------------------------------------------------------ report
def report(image: Path, title: str, ask: str = "", thought: str = "", prompt_file: Path | None = None,
           settings: str = "", verdict: str = "") -> None:
    args = [sys.executable, str(ROOT / "scripts/report-log.py"), str(image), "--title", title]
    for k, v in (("--ask", ask), ("--thought", thought), ("--settings", settings), ("--verdict", verdict)):
        if v:
            args += [k, v]
    if prompt_file and prompt_file.exists():
        args += ["--prompt-file", str(prompt_file)]
    subprocess.run(args, capture_output=True, text=True)


# --------------------------------------------------------------- --bottles-crop
BOTTLES_CROP_PAD = 40.0     # grow masks/backbar.png's own bounding box by this many px on every side


def bottles_crop_box(pad: float = BOTTLES_CROP_PAD) -> tuple[int, int, int, int]:
    """canon/room-kit/v2/masks/backbar.png's OWN bounding box (not the union
    used for pasting back below), grown by `pad` px on every side, then made
    4:5 by extending the HEIGHT only, never the width - the tight crop a
    --bottles-crop pass sends as Picture 1, so the bottles get four times the
    pixels a whole-plate pass gives them."""
    m = rp.load(KIT / "masks/backbar.png") > 127
    ys, xs = np.where(m)
    if ys.size == 0:
        raise SystemExit("masks/backbar.png is empty - nothing to crop")
    x0, x1 = max(0, int(xs.min() - pad)), min(1200, int(xs.max() + pad))
    y0, y1 = max(0, int(ys.min() - pad)), min(1800, int(ys.max() + pad))
    target_h = round((x1 - x0) * 5 / 4)
    extra = max(0, target_h - (y1 - y0))
    top, bot = extra // 2, extra - extra // 2
    y0, y1 = max(0, y0 - top), min(1800, y1 + bot)
    if y1 - y0 < target_h:                              # ran off one edge - take the shortfall from the other side
        y0, y1 = (0, min(1800, target_h)) if y0 == 0 else (max(0, 1800 - target_h), 1800)
    return x0, y0, x1, y1


def backbar_union_mask(man: dict, feather: float = 3.0) -> np.ndarray:
    """The union of the recess and its two shelves and two bottle rows -
    masks/backbar.png, shelf-lower.png, shelf-upper.png, bottles-lower.png,
    bottles-upper.png - soft-edged: the ONLY region a --bottles-crop result
    is ever pasted back into."""
    ids = ("backbar", "shelf-lower", "shelf-upper", "bottles-lower", "bottles-upper")
    soft = np.zeros((1800, 1200), np.float32)
    for pid in ids:
        part = next(p for p in man["parts"] if p["id"] == pid)
        soft = np.maximum(soft, rp.mask_of(part, feather=feather))
    return soft


def run_bottles_crop(a, man: dict, out_dir: Path) -> None:
    """--bottles-crop: the bottles EDIT alone, on a tight 4:5 crop of the
    recess, instead of the whole plate. Picture 1 is that crop from the given
    render; Picture 2 (--bottles-p2 plate, the default) is the SAME crop of
    the approved plate, the true shape of the two shelves, for scale and
    placement only. After the render, the patch is releveled to the ring just
    outside the recess with room-part.py's own tone_match() - the same
    primitive every part in that script is composited back with, not the
    whole-frame percentile match a full re-render needs - then pasted through
    the feathered union of the five recess masks, and only THEN does the
    usual finish run: --keep parts restored from the plate, the sign last."""
    src = Path(a.bottles_crop)
    if not src.is_absolute():
        src = ROOT / src
    box = bottles_crop_box()
    x0, y0, x1, y1 = box
    render = rp.load(src)
    crop = render[y0:y1, x0:x1]
    p1_name = "picture1-passC.png" if a.dry_run else f"{a.tag}-picture1-passC.png"
    p1_path = out_dir / p1_name
    rp.save(crop, p1_path)

    images = [cs.prepare_reference(p1_path)[0]]
    p2_text = ""
    if a.bottles_p2 == "plate":
        plate_crop = rp.load(KIT / "plate.png")[y0:y1, x0:x1]
        p2_name = "picture2-passC.png" if a.dry_run else f"{a.tag}-picture2-passC.png"
        p2_path = out_dir / p2_name
        rp.save(plate_crop, p2_path)
        images.append(cs.prepare_reference(p2_path)[0])
        p2_text = (" Picture 2 is the approved plate's OWN crop of this same recess - the true shape of its two "
                   "shelves - for scale and placement only, not for anything else in it.")

    roster = ("REFERENCES. Picture 1 is a close 4:5 crop of the inlaid recess and its two shelves, cropped from a "
              "previous render of The Swinging Door, in the same engraved black-and-white pen - its camera, its "
              "crop and its light are already correct." + p2_text)
    body = ("MAKE THESE CHANGES TO PICTURE 1 AND KEEP EVERYTHING ELSE. The result is Picture 1 itself with the "
            "bottles added, one unbroken crop edge to edge, in the same engraved black-and-white pen.\n"
            f"1. {EDIT_TEXT['bottles']}\n2. {KEEP_EVERYTHING_ELSE}")
    prompt = roster + "\n\n" + body
    prompt_name = "picture1-passC.prompt.txt" if a.dry_run else f"{a.tag}-passC-bottles.prompt.txt"
    prompt_path = out_dir / prompt_name
    prompt_path.write_text(prompt, encoding="utf8")

    print(f"Picture 1 (bottles-crop): {p1_path.relative_to(ROOT) if p1_path.is_relative_to(ROOT) else p1_path}")
    print(f"crop box (x0,y0,x1,y1): {box}, aspect 4:5, bottles-p2: {a.bottles_p2!r}, match-keep: {a.match_keep}")

    if a.dry_run:
        sidecar = {
            "generated_at": dt.datetime.now().isoformat(timespec="seconds"),
            "script": "scripts/scene-edit-next.py", "dry_run": True, "mode": "bottles-crop",
            "bottles_crop_source": str(src), "crop_box": list(box), "bottles_p2": a.bottles_p2,
            "keep": [k.strip() for k in a.keep.split(",") if k.strip()], "match_keep": a.match_keep,
            "seeds": a.seed, "picture1": str(p1_path), "references": len(images),
        }
        (out_dir / (f"{a.tag}-picture1-passC.json" if a.tag else "picture1-passC.json")).write_text(
            json.dumps(sidecar, indent=2), encoding="utf8")
        print("[dry run] no render made")
        return

    plate_truth = rp.load(KIT / "plate.png")
    room = non_figure_mask(man)
    hard_union = backbar_union_mask(man, feather=0.0) > 0.5
    soft_union = backbar_union_mask(man, feather=3.0)
    keep_ids = [k.strip() for k in a.keep.split(",") if k.strip()]
    for seed in a.seed:
        req = {
            "prompt": prompt, "model": cs.MODEL, "provider": "local", "aspect_ratio": "4:5",
            "input_images": images, "negative_prompt": cs.LOCAL_NEGATIVE + ", " + NEGATIVE_EXTRA,
            "output_format": "png", "fast": not a.full, "tag": f"{a.tag}-s{seed}-bottles", "seed": seed,
        }
        if getattr(a, "steps_override", 0):
            req["steps"] = a.steps_override; req["fast"] = False
        if getattr(a, "cfg_override", 0.0):
            req["guidance"] = a.cfg_override; req["fast"] = False
        t0 = time.time()
        res = cs.post(req, a.server)
        png = cs.fetch(res["image_url"], a.server)
        raw_path = WORK / f"{a.tag}-s{seed}-bottles-raw.png"
        raw_path.write_bytes(png)
        im = Image.open(raw_path).convert("L")
        piece = np.asarray(im.resize((x1 - x0, y1 - y0), Image.LANCZOS), np.float32)
        candidate_full = render.copy()
        candidate_full[y0:y1, x0:x1] = piece
        leveled, gain, off = rp.tone_match(render, candidate_full, hard_union)
        pasted = render * (1 - soft_union) + leveled * soft_union
        restored = restore_parts(pasted, plate_truth, man, keep_ids, feather=3.0, match_keep=a.match_keep)
        presign = WORK / f"{a.tag}-s{seed}-bottles-presign.png"
        rp.save(restored, presign)
        final_path = WORK / f"{a.tag}-s{seed}-final.png"
        subprocess.run([sys.executable, str(ROOT / "scripts/sign-on-glass.py"), str(presign), str(final_path)], check=True)
        seconds = round(time.time() - t0, 1)
        sidecar = {
            "generated_at": dt.datetime.now().isoformat(timespec="seconds"), "script": "scripts/scene-edit-next.py",
            "seed": seed, "seed_used": res.get("seed_used"), "mode": "bottles-crop", "crop_box": list(box),
            "bottles_crop_source": str(src), "bottles_p2": a.bottles_p2, "keep": keep_ids,
            "match_keep": a.match_keep, "full": a.full, "model": cs.MODEL, "tone_gain": gain, "tone_offset": off,
            "tag": a.tag, "seconds": seconds, "server_metadata": res.get("metadata"),
        }
        (WORK / f"{a.tag}-s{seed}.json").write_text(json.dumps(sidecar, indent=2), encoding="utf8")
        report(final_path, f"{a.tag} bottles-crop seed {seed} recess-only edit",
               ask="Redraw the bottles as a real back shelf without risking the room, the window or the seated "
                   "cast that a whole-plate re-roll would put at risk.",
               thought=(f"Picture 1 is a 4:5 crop of the recess alone from {a.bottles_crop} (box {box}); Picture 2 "
                        f"is {'the plate' if a.bottles_p2 == 'plate' else 'not sent'}. After the render, the crop "
                        "was scaled back and tone-matched to the ring just outside the recess (room-part.py's own "
                        f"tone_match, gain {gain:.2f} offset {off:+.0f}), then pasted through the feathered union "
                        f"of the recess's five masks; {keep_ids} restored from the plate"
                        + (" (tone-matched to the render's own ring)" if a.match_keep else "")
                        + " before the gilded sign went on last."),
               prompt_file=prompt_path,
               settings=f"{cs.MODEL}, seed {seed}, {'fast 8-step cfg 1' if not a.full else 'full 40-step cfg 4'}, "
                        f"crop {box} -> 4:5, bottles-p2 {a.bottles_p2}, match-keep {a.match_keep}, {seconds}s")
        print(f"  {final_path.relative_to(ROOT)}  seed={seed}  {seconds}s")


# ------------------------------------------------------------ --composite-only
def run_composite_only(a, man: dict) -> None:
    """--composite-only <render>: no bridge call, no GPU - just re-run the post-processing (the percentile tone
    match, the --keep restore, the gilded sign, and --room-from-plate's extra composite when that flag is set) on
    an EXISTING raw render, the way to test a post-processing change for free. The render is expected to be a
    `<tag>-s<seed>-raw.png` written by a previous run of this script; its own tag-seed prefix names the outputs,
    written beside it in the same directory, exactly like a real render would - <prefix>-final.png always, plus
    <prefix>-room.png when --room-from-plate is set."""
    src = Path(a.composite_only)
    if not src.is_absolute():
        src = ROOT / src
    if not src.exists():
        raise SystemExit(f"--composite-only: no such file {src}")
    prefix = src.stem[:-4] if src.stem.endswith("-raw") else src.stem
    out_dir = src.parent

    plate_truth = rp.load(KIT / "plate.png")
    room = non_figure_mask(man)
    keep_ids = [k.strip() for k in a.keep.split(",") if k.strip()]

    im = Image.open(src).convert("L")
    if a.aspect == "2:3":
        render_full = np.asarray(im.resize((1200, 1800), Image.LANCZOS), np.float32)
    else:
        x0, y0, x1, y1 = CROP_4_5
        piece = np.asarray(im.resize((x1 - x0, y1 - y0), Image.LANCZOS), np.float32)
        render_full = plate_truth.copy()
        render_full[y0:y1, x0:x1] = piece
    toned = percentile_tone_match(render_full, plate_truth, room)

    restored = restore_parts(toned, plate_truth, man, keep_ids, feather=3.0, match_keep=a.match_keep)
    presign = out_dir / f"{prefix}-presign.png"
    rp.save(restored, presign)
    final_path = out_dir / f"{prefix}-final.png"
    subprocess.run([sys.executable, str(ROOT / "scripts/sign-on-glass.py"), str(presign), str(final_path)], check=True)
    print(f"[composite-only] source: {src.relative_to(ROOT) if src.is_relative_to(ROOT) else src}")
    print(f"  {final_path.relative_to(ROOT) if final_path.is_relative_to(ROOT) else final_path}  keep={keep_ids} match-keep={a.match_keep}")

    if a.room_from_plate:
        room_img = build_room_from_plate(toned, plate_truth, man, keep_ids,
                                          dilate_figures=a.dilate_figures, match_keep=a.match_keep)
        room_presign = out_dir / f"{prefix}-room-presign.png"
        rp.save(room_img, room_presign)
        room_path = out_dir / f"{prefix}-room.png"
        subprocess.run([sys.executable, str(ROOT / "scripts/sign-on-glass.py"), str(room_presign), str(room_path)], check=True)
        print(f"  {room_path.relative_to(ROOT) if room_path.is_relative_to(ROOT) else room_path}  "
              f"dilate-figures={a.dilate_figures}")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--seed", type=int, action="append", default=[],
                     help="required unless --composite-only is given (composite-only makes no render, so no "
                          "seed is needed - the output names come off the given render's own tag-seed prefix)")
    ap.add_argument("--aspect", choices=["2:3", "4:5"], default="2:3")
    ap.add_argument("--blockins", default=None,
                     help="comma list from drew,barclay,abby: which block-in(s) to paint into Picture 1 - the "
                          "plate in pass A, or (this copy's new capability) a --pass2 render, exactly the same "
                          "remap/masks/blockin-heads either way. Default: 'drew,barclay' in pass A (unchanged); "
                          "nothing at all in --pass2/--repair mode (also unchanged) - name your own here for a "
                          "later solo pass, e.g. --blockins barclay with --pass2 <pass-1 render>.")
    ap.add_argument("--no-blockins", dest="no_blockins", action="store_true",
                     help="paint no block-in at all, whatever --blockins says (the old --blockins/--no-blockins "
                          "boolean's disable side, still honoured)")
    ap.add_argument("--blockin-heads", choices=["none", "full"], default="none",
                     help="none (default): erase the block-in above the neck per figure, so only the portrait's "
                          "head lands there; full: v2's old whole-figure paint, head included")
    ap.add_argument("--abby-in-pass-a", action="store_true")
    ap.add_argument("--pass2", default="", help="a previous PASS-A final.png: this run is PASS B")
    ap.add_argument("--edits", default="", help="comma list from drew,barclay,abby,bottles (default per pass)")
    ap.add_argument("--keep", default=",".join(DEFAULT_KEEP), help="part ids restored from the plate after the render")
    ap.add_argument("--match-keep", action=argparse.BooleanOptionalAction, default=False,
                     help="default OFF: after restoring --keep parts from the plate, percentile-match the restored "
                          "region's tone to a 40px band of the render just outside it, so a paler scan does not sit "
                          "against a darker re-inked room")
    ap.add_argument("--p2", default="", help="Picture 2: a name (drew/barclay/abby) or a path to an image. "
                     "Default when unset: 'drew' in pass A (unchanged from v3), 'abby' in --pass2 mode (also "
                     "unchanged - the old hardcoded pass-B Picture 2); an explicit value now works in --pass2 "
                     "mode too (this copy's new capability), for a later solo pass sending THAT character's own "
                     "portrait, e.g. --p2 barclay.")
    ap.add_argument("--p3", default="", help="Picture 3: 'tile' (old Barclay+Abby side by side), a name "
                     "(barclay/abby/drew), 'none' (two references only), or a path to an image. Default when "
                     "unset: pass A - 'barclay' alone at full size, unless --abby-in-pass-a is set, which "
                     "defaults to 'tile' so Abby's portrait is still sent; --pass2 mode - the plate's own "
                     "back-bar crop when found (unchanged). An explicit value now works in --pass2 mode too - "
                     "e.g. --p3 none for a solo later pass that needs no third reference.")
    ap.add_argument("--repair", action="append", default=[], choices=["drew", "barclay", "abby"],
                     help="repeatable: a head-only fix pass (requires --pass2). Every name given lands in ONE pass "
                          "- Picture 1 is --pass2's render, Picture 2 (and 3, 4...) is each name's own portrait "
                          "alone, and the EDITS redraw only that head, keeping body/seat/pose/size/place as Picture "
                          "1 has them.")
    ap.add_argument("--abby-absent", action="store_true",
                     help="with --repair abby: she is absent from Picture 1, so the edit DRAWS her in instead of "
                          "redrawing a head that is not there")
    ap.add_argument("--bottles-crop", default="", help="a previous render (a *-final.png) to run a bottles-only "
                     "pass on the RECESS crop alone (masks/backbar.png's own box, grown 40px, squared to 4:5 by "
                     "height) instead of the whole plate; independent of --pass2/--repair")
    ap.add_argument("--bottles-p2", choices=["plate", "none"], default="plate",
                     help="--bottles-crop's Picture 2: 'plate' (default) sends the approved plate's own crop of "
                          "the same recess, for the true shelf shape; 'none' sends the render's crop alone")
    ap.add_argument("--chain", default="", help="comma list from drew,barclay,abby[,bottles]: run those passes "
                     "in sequence automatically, one character block-in and one character portrait per pass "
                     "(--p2 that character, --p3 none), each pass's raw render feeding the next as --pass2; a "
                     "trailing 'bottles' runs --bottles-crop on the chain's own last render. Outputs are tagged "
                     "<tag>-<step>-s<seed>-raw/-final(/-room). Requires exactly one --seed - run a separate "
                     "--chain per seed wanted.")
    ap.add_argument("--chain-dry-stub", default="", help="--chain --dry-run only: a stand-in image path used as "
                     "pass 1's (non-existent, in a dry run) raw render when building pass 2's Picture 1. Every "
                     "later step in a dry run chains from the PREVIOUS step's own Picture 1 instead. Ignored "
                     "outside --dry-run, where a real chain always chains its own actual raw renders.")
    ap.add_argument("--steps-override", type=int, default=0, help="explicit sampler steps (no Lightning LoRA)")
    ap.add_argument("--cfg-override", type=float, default=0.0, help="explicit guidance (no Lightning LoRA)")
    ap.add_argument("--room-from-plate", action="store_true",
                     help="also save <tag>-s<seed>-room.png (or <prefix>-room.png under --composite-only): the "
                          "APPROVED PLATE everywhere, with the (plate-tone-matched) render showing only inside "
                          "the union of the three seated-figure masks (dilated --dilate-figures px) and the "
                          "recess's five bottle/shelf masks - both feathered 4px - and the plate's own "
                          "chair-left/chair-right/counter masks re-applied on top so the furniture in front of "
                          "the figures stays the plate's; --final.png is still written exactly as before")
    ap.add_argument("--dilate-figures", type=int, default=10,
                     help="px the union of the three figure masks is grown by for --room-from-plate (default 10)")
    ap.add_argument("--composite-only", default="", help="an existing raw render (a <tag>-s<seed>-raw.png from a "
                     "previous run of this script): skip the bridge entirely and just re-run the post-processing "
                     "on it - writes <prefix>-final.png beside it (and <prefix>-room.png too, when "
                     "--room-from-plate is set), where <prefix> is that file's own name minus '-raw'")
    ap.add_argument("--tag", default="scene2")
    ap.add_argument("--full", action="store_true", help="40-step cfg 4 instead of the Lightning 8-step pass")
    ap.add_argument("--head-edit", action=argparse.BooleanOptionalAction, default=True,
                     help="default ON: one extra numbered EDIT, after the character edits, naming both heads as "
                          "drawn from the portraits alone, not the grey block-ins")
    ap.add_argument("--server", default=cs.SERVER)
    ap.add_argument("--dry-run", action="store_true", help="write Picture 1 and the prompt; render nothing")
    ap.add_argument("--out-dir", default="", help="where Picture 1 / prompt / dry-run sidecar go (default: work/)")
    a = ap.parse_args()
    if not a.composite_only and not a.seed:
        ap.error("the following arguments are required: --seed")

    man = rp.manifest()
    out_dir = Path(a.out_dir) if a.out_dir else WORK
    out_dir.mkdir(parents=True, exist_ok=True)
    WORK.mkdir(exist_ok=True)

    if a.composite_only:
        run_composite_only(a, man)
        return

    if a.bottles_crop:
        run_bottles_crop(a, man, out_dir)
        return

    if a.chain:
        run_chain(a, man)
        return

    if a.repair and not a.pass2:
        raise SystemExit("--repair requires --pass2 <a previous render> - Picture 1 for a repair pass IS that render")

    run_pass(a, man, out_dir)


def run_pass(a, man: dict, out_dir: Path) -> tuple[Path, list[tuple[Path, Path]]]:
    """ONE pass, exactly as main() always ran it (build Picture 1 -> references -> prompt -> either the dry-run
    sidecar or a real render per --seed) - factored out so --chain can run this once per step with its own private
    copy of the parsed args, threading each step's raw render into the next as --pass2. Returns (picture1 path, a
    list of (raw_path, final_path) per seed actually rendered - empty under --dry-run, since nothing is rendered)."""
    p1_path, painted, pass_ = build_picture1(a, man, out_dir)
    p3_mode = resolve_p3_mode(a, pass_) if pass_ in ("A", "B") else ""
    p2_mode = resolve_p2_mode(a, pass_) if pass_ in ("A", "B") else ""

    if pass_ == "R":
        edits_selected = list(a.repair)
    elif a.edits:
        edits_selected = [e.strip() for e in a.edits.split(",") if e.strip()]
    elif pass_ == "A":
        edits_selected = ["drew", "barclay"] + (["abby"] if a.abby_in_pass_a else [])
    else:
        edits_selected = ["abby", "bottles"]
    bad = [e for e in edits_selected if e not in ("drew", "barclay", "abby", "bottles")]
    if bad:
        raise SystemExit(f"--edits: unknown edit(s) {bad} - choose from drew,barclay,abby,bottles")
    keep_ids = [k.strip() for k in a.keep.split(",") if k.strip()]

    images, roster = build_references(a, man, p1_path, pass_, out_dir, p3_mode, p2_mode)
    prompt = build_prompt(a, roster, painted, edits_selected, pass_, p3_mode, p2_mode)
    untagged_dry_run = a.dry_run and not getattr(a, "chain_step", False)
    prompt_path = out_dir / (f"picture1-pass{pass_}.prompt.txt" if untagged_dry_run
                              else f"{a.tag}-pass{pass_}-edit.prompt.txt")
    prompt_path.write_text(prompt, encoding="utf8")

    print(f"Picture 1: {p1_path.relative_to(ROOT) if p1_path.is_relative_to(ROOT) else p1_path}")
    print(f"pass {pass_}, aspect {a.aspect}, blockins painted: {painted or 'none'} (heads: {a.blockin_heads}), "
          f"edits: {edits_selected}, keep: {keep_ids}, match-keep: {a.match_keep}")
    if pass_ in ("A", "B"):
        print(f"p2: {p2_mode!r}, p3: {p3_mode!r}, head-edit: {a.head_edit}")
    if pass_ == "R":
        print(f"repair: {a.repair}, abby-absent: {a.abby_absent}")

    if a.dry_run:
        sidecar = {
            "generated_at": dt.datetime.now().isoformat(timespec="seconds"),
            "script": "scripts/scene-edit-next.py", "dry_run": True, "pass": pass_, "aspect": a.aspect,
            "blockins_painted": painted, "blockin_heads": a.blockin_heads, "abby_in_pass_a": a.abby_in_pass_a,
            "edits": edits_selected, "keep": keep_ids, "match_keep": a.match_keep, "seeds": a.seed,
            "pass2_source": a.pass2 or None, "p2_mode": p2_mode or None, "p3_mode": p3_mode or None,
            "head_edit": a.head_edit, "repair": a.repair, "abby_absent": a.abby_absent,
            "picture1": str(p1_path), "references": len(images),
        }
        (out_dir / (f"picture1-pass{pass_}.json" if not a.tag else f"{a.tag}-picture1-pass{pass_}.json")).write_text(
            json.dumps(sidecar, indent=2), encoding="utf8")
        print("[dry run] no render made")
        return p1_path, []

    plate_truth = rp.load(KIT / "plate.png")
    room = non_figure_mask(man)
    results: list[tuple[Path, Path]] = []
    for seed in a.seed:
        req = {
            # "fast": not a.full is this script's own version of cast-study.py's
            # build_request(fast=...) - --full (40-step cfg 4) sends fast=False
            # through to the bridge exactly as cast-study.py's does, and is
            # recorded below in the sidecar's "full" key and the report's
            # "settings" string.
            "prompt": prompt, "model": cs.MODEL, "provider": "local", "aspect_ratio": a.aspect,
            "input_images": images, "negative_prompt": cs.LOCAL_NEGATIVE + ", " + NEGATIVE_EXTRA,
            "output_format": "png", "fast": not a.full, "tag": f"{a.tag}-s{seed}", "seed": seed,
        }
        if getattr(a, "steps_override", 0):
            req["steps"] = a.steps_override; req["fast"] = False
        if getattr(a, "cfg_override", 0.0):
            req["guidance"] = a.cfg_override; req["fast"] = False
        t0 = time.time()
        res = cs.post(req, a.server)
        png = cs.fetch(res["image_url"], a.server)
        raw_path = WORK / f"{a.tag}-s{seed}-raw.png"
        raw_path.write_bytes(png)
        im = Image.open(raw_path).convert("L")
        if a.aspect == "2:3":
            render_full = np.asarray(im.resize((1200, 1800), Image.LANCZOS), np.float32)
        else:
            x0, y0, x1, y1 = CROP_4_5
            piece = np.asarray(im.resize((x1 - x0, y1 - y0), Image.LANCZOS), np.float32)
            render_full = plate_truth.copy()
            render_full[y0:y1, x0:x1] = piece
        toned = percentile_tone_match(render_full, plate_truth, room)
        restored = restore_parts(toned, plate_truth, man, keep_ids, feather=3.0, match_keep=a.match_keep)
        presign = WORK / f"{a.tag}-s{seed}-presign.png"
        rp.save(restored, presign)
        final_path = WORK / f"{a.tag}-s{seed}-final.png"
        subprocess.run([sys.executable, str(ROOT / "scripts/sign-on-glass.py"), str(presign), str(final_path)], check=True)

        room_path = None
        if a.room_from_plate:
            room_img = build_room_from_plate(toned, plate_truth, man, keep_ids,
                                              dilate_figures=a.dilate_figures, match_keep=a.match_keep)
            room_presign = WORK / f"{a.tag}-s{seed}-room-presign.png"
            rp.save(room_img, room_presign)
            room_path = WORK / f"{a.tag}-s{seed}-room.png"
            subprocess.run([sys.executable, str(ROOT / "scripts/sign-on-glass.py"), str(room_presign), str(room_path)],
                            check=True)

        seconds = round(time.time() - t0, 1)
        sidecar = {
            "generated_at": dt.datetime.now().isoformat(timespec="seconds"), "script": "scripts/scene-edit-next.py",
            "seed": seed, "seed_used": res.get("seed_used"), "pass": pass_, "aspect": a.aspect,
            "blockins_painted": painted, "blockin_heads": a.blockin_heads, "abby_in_pass_a": a.abby_in_pass_a,
            "edits": edits_selected, "keep": keep_ids, "match_keep": a.match_keep, "full": a.full, "model": cs.MODEL,
            "pass2_source": a.pass2 or None, "p2_mode": p2_mode or None, "p3_mode": p3_mode or None,
            "head_edit": a.head_edit, "repair": a.repair, "abby_absent": a.abby_absent,
            "room_from_plate": a.room_from_plate, "dilate_figures": a.dilate_figures if a.room_from_plate else None,
            "tag": a.tag, "seconds": seconds, "server_metadata": res.get("metadata"),
        }
        (WORK / f"{a.tag}-s{seed}.json").write_text(json.dumps(sidecar, indent=2), encoding="utf8")
        who = " and ".join(f"{n.capitalize()}'s" for n in painted)
        plural = "s" if len(painted) != 1 else ""
        if pass_ == "A":
            p1_desc = (f"the approved plate with {who} block-in{plural} painted in at 100-180 grey, heads "
                       f"{a.blockin_heads}" if painted else "the approved plate, no block-in painted")
            extra_note = f"; p2={p2_mode}, p3={p3_mode}, head-edit={a.head_edit}"
        elif pass_ == "R":
            p1_desc = f"a previous render ({a.pass2}), already right except the head(s) being repaired"
            extra_note = f"; repair={a.repair}, abby-absent={a.abby_absent}"
        elif painted:
            p1_desc = (f"a previous render ({a.pass2}) with {who} block-in{plural} painted in at 100-180 grey, "
                       f"heads {a.blockin_heads} - everyone else already drawn in it kept exactly as is")
            extra_note = f"; p2={p2_mode}, p3={p3_mode}, head-edit={a.head_edit}"
        else:
            p1_desc = "a previous pass-A render, already right about the room and the cast"
            extra_note = ""
        title_kind = "head-repair edit" if pass_ == "R" else "whole-plate edit"
        report(final_path, f"{a.tag} pass {pass_} seed {seed} {title_kind}",
               ask="Founder's note on the seed-7 proof: restore the approved window, gild THE SWINGING DOOR, put "
                   "Abby behind the ledge and Drew/Barclay seated on the near side in their own chairs, redraw the "
                   "bottles as a real back shelf - and fix the IDENTITY failure (Drew a vulture/turkey, Barclay a "
                   "hound/poodle/llama/human).",
               thought=(f"Pass {pass_}: Picture 1 is {p1_desc}; EDITS carried this pass: {edits_selected}{extra_note}. "
                        f"After the render, tone-matched to the plate over the room and {keep_ids} restored from "
                        f"the plate through their own masks"
                        + (" (tone-matched to the render's own ring just outside each)" if a.match_keep else "")
                        + " before the gilded sign went on last."),
               prompt_file=prompt_path,
               settings=f"{cs.MODEL}, seed {seed}, {'fast 8-step cfg 1' if not a.full else 'full 40-step cfg 4'}, "
                        f"aspect {a.aspect} -> bridge {BRIDGE_SIZE[a.aspect]}, blockin-heads {a.blockin_heads}, "
                        f"p2 {p2_mode or 'n/a'}, p3 {p3_mode or 'n/a'}, head-edit {a.head_edit}, "
                        f"match-keep {a.match_keep}, room-from-plate {a.room_from_plate}"
                        + (f" (dilate {a.dilate_figures}px)" if a.room_from_plate else "") + f", {seconds}s")
        print(f"  {final_path.relative_to(ROOT)}  seed={seed}  {seconds}s"
              + (f"  + {room_path.relative_to(ROOT)}" if room_path else ""))
        results.append((raw_path, final_path))
    return p1_path, results


# --------------------------------------------------------------------- --chain
def run_chain(a, man: dict) -> None:
    """--chain drew,barclay,abby[,bottles] --seed N: the founder's one-character-per-pass finding, automated.
    Pass 1 has no --pass2 (Picture 1 is the plate, --blockins/--edits/--p2 that first character alone, --p3
    none); every later character pass's Picture 1 is the PREVIOUS pass's raw render with THAT pass's one
    --blockins painted in, --p2 that character, --p3 none - exactly the "paint one block-in, show one portrait"
    combination tonight's lab session found comes out right. A trailing "bottles" step runs --bottles-crop on
    the chain's own last render. Each step is tagged <tag>-<step> (1-based), so its own outputs land at
    <tag>-<step>-s<seed>-raw/-final(/-room, and -bottles for the bottles step).

    --chain-dry-stub stands in for pass 1's (non-existent, under --dry-run) raw render only when building pass
    2's Picture 1; pass 3 onward, in a dry run, chains from the PREVIOUS step's own Picture 1 instead - the only
    artifact a dry run actually produces. A real (non-dry-run) chain always chains its own actual raw renders and
    never touches --chain-dry-stub."""
    steps = [s.strip() for s in a.chain.split(",") if s.strip()]
    bad = [s for s in steps if s not in ("drew", "barclay", "abby", "bottles")]
    if bad:
        raise SystemExit(f"--chain: unknown step(s) {bad} - choose from drew,barclay,abby,bottles")
    if "bottles" in steps and steps.index("bottles") != len(steps) - 1:
        raise SystemExit("--chain: 'bottles' may only appear once, last")
    char_steps = [s for s in steps if s != "bottles"]
    if not char_steps:
        raise SystemExit("--chain: at least one character step (drew/barclay/abby) is required")
    if len(a.seed) != 1:
        raise SystemExit("--chain: exactly one --seed is required - the caller runs a separate --chain per seed")
    seed = a.seed[0]
    out_dir = Path(a.out_dir) if a.out_dir else WORK
    out_dir.mkdir(parents=True, exist_ok=True)

    prev_source: Path | None = None    # what the NEXT character step's --pass2 should point to
    prev_final: Path | None = None     # the last character step's -final.png (bottles needs a real render)
    for i, name in enumerate(char_steps):
        print(f"--chain step {i + 1}/{len(char_steps)}: {name}")
        step = copy.copy(a)
        step.tag = f"{a.tag}-{i + 1}"
        step.seed = [seed]
        step.blockins = name
        step.no_blockins = False
        step.edits = name
        step.p2 = name
        step.p3 = "none"
        step.repair = []
        step.bottles_crop = ""
        step.chain = ""
        step.chain_step = True         # tag-prefixed Picture 1 / prompt names even under --dry-run - see build_picture1
        step.abby_in_pass_a = False
        if i == 0:
            step.pass2 = ""
        elif i == 1 and a.dry_run and a.chain_dry_stub:
            step.pass2 = a.chain_dry_stub          # only when pass 1 (a dry run) made no real render to chain from
        else:
            step.pass2 = str(prev_source)
        p1_path, results = run_pass(step, man, out_dir)
        if results:                                # a real render happened this step
            prev_source, prev_final = results[0]
        else:                                       # dry run: chain from this step's own Picture 1
            prev_source = p1_path

    if "bottles" in steps:
        if not prev_final:
            raise SystemExit("--chain: the 'bottles' step needs a real render from the last character step - "
                              "it cannot run under --dry-run")
        print("--chain step (final): bottles")
        bottles_a = copy.copy(a)
        bottles_a.tag = f"{a.tag}-bottles"
        bottles_a.seed = [seed]
        bottles_a.bottles_crop = str(prev_final)
        bottles_a.chain = ""
        run_bottles_crop(bottles_a, man, out_dir)


if __name__ == "__main__":
    main()
