"""One STANDALONE CHARACTER STUDY, drawn on the house model.

    python scripts/cast-study.py --character drew|barclay|abby --seed 41
        [--pose "what he is doing"] [--extra-edit "one more numbered change"]
        [--out DIR] [--rolls N] [--full] [--tag NAME] [--dry-run]

WHY THIS EXISTS
---------------
The founder's note of 2026-09-06 — "its a flamingo you did a terrible job you
must perfect each character" — followed a night of cast renders made by
`room-part.py` on `local/sensenova-u1.5` from crude block-ins, which came back
as swans and geese. The plates Rick ACCEPTED were not made that way. They were
made by the house model, `local/qwen-image-edit-2511`, through
`lib/generate.ts` — an EDIT model handed a finished picture as Picture 1, the
character's own portrait tile after it, and a short numbered list of changes.
The recorded recipe is `canon/vision/studies/duo-behind.txt` (fast Lightning
8-step, cfg 1, seed 41).

This script is that recipe, in Python, aimed at ONE character instead of a
panel: Picture 1 is a clean chest-up staging of that character alone at the bar,
cut straight out of the plate Rick approved, so the model has nothing to
invent about the camera, the crop or the room — only the character to draw
beautifully.

WHAT IS COPIED FROM lib/generate.ts, VERBATIM
---------------------------------------------
  * DEFAULT_MODEL                 -> MODEL
  * LOCAL_NEGATIVE                -> LOCAL_NEGATIVE (character for character)
  * multiRefInput()'s local branch-> the request body built in build_request()
  * fencesOf()                    -> local_fence(): the 4th ```text fence of
                                     canon/MASTER-PROMPT.md, CRLF-normalised
  * localPrompt()                 -> build_prompt(): the roster line, the
                                     numbered EDITS (television, chalkboard,
                                     bottles, cast, business, everything-else),
                                     then "THE RULES THE FINISHED PICTURE
                                     OBEYS:" and the filled LOCAL fence
  * uploadReferences()            -> prepare_reference(): grayscale, normalise,
                                     max width 1024 without enlarging, JPEG q90,
                                     sent inline as a data URI
  * VISION_REFS                   -> VISION_REFS (same paths, same order, same
                                     labels)
  * the 4:5 house shape           -> aspect_ratio "4:5", which the local bridge
                                     resolves to 1344x1680
  * the grayscale + crop-at-the-counter finish of generateCartoonArt()

THE ONE DELIBERATE DEVIATION, and why
-------------------------------------
The LOCAL fence's THE STAGE and DREW/BARCLAY paragraphs describe TWO gentlemen
seated side by side, because every cartoon has at least the duo in it. A
character study has exactly one figure, so those paragraphs are re-pointed at
the single character by SOLO edits held in SOLO_STAGE / character block
splitting below. Each edit is an exact-string replacement into canon's own
sentences; every one that FAILS to find its sentence is recorded in the JSON
sidecar under "solo_edits_missed", so a canon rewrite shows up as data instead
of silently drawing the duo again. Nothing else in the fence is touched.

Everything the run sends (minus the image bytes) is written beside the PNG as
`<name>.json`, and the exact prompt as `<name>.prompt.txt`, so a render can be
filed with scripts/report-log.py --prompt-file.
"""
from __future__ import annotations

import argparse
import base64
import datetime as dt
import hashlib
import io
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent          # Z:/ImageGenerator/Cartoon
SCRATCH = Path(
    "C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/"
    "7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies"
)
SERVER = "http://127.0.0.1:8000"                       # .env.development.local AURAVISION_URL
MODEL = "local/qwen-image-edit-2511"                   # lib/generate.ts DEFAULT_MODEL

# lib/generate.ts LOCAL_NEGATIVE, character for character. Read only at cfg > 1;
# the fast Lightning pass runs at cfg 1 and never sees it, which is exactly how
# the studio found out the list was steering the room away.
LOCAL_NEGATIVE = (
    "color, colour, photograph, photorealistic, 3D render, oil painting, watercolor, soft airbrush shading, "
    "blurry, low detail, flat cel shading, extra people, humans, a second bartender, duplicate character, "
    "merged characters, deformed hands, extra fingers, claws, nails, tail, garbled text, misspelled words, "
    "gibberish lettering, speech bubble, caption text, watermark, signature, legs, feet"
)

# ---------------------------------------------------------------- Picture 1
#
# The plate crop. canon/plates/duo.png and trio.png are the blank plates Rick
# APPROVED (canon/plates/README.md) — screen off, slate wiped, mouths closed —
# so a crop out of one is a finished, on-model, house-lit staging of that
# character at the counter in the canonical camera, with nothing to argue about.
# Boxes are (left, top, width, height) in the plates' own 1200x1800 pixels, cut
# 4:5 to the house shape and checked by eye so no second character is in frame.
PLATE_CROPS = {
    "drew":    {"plate": "canon/plates/duo.png",  "box": (140, 540, 640, 800)},
    "barclay": {"plate": "canon/plates/duo.png",  "box": (680, 640, 520, 650)},
    "abby":    {"plate": "canon/plates/trio.png", "box": (486, 470, 360, 450)},
}

PICTURE1_LABEL = {
    "drew": (
        "a crop of this strip's own APPROVED plate: DREW the white flamingo gentleman ALONE at the marble "
        "counter of The Swinging Door, chest-up, his head and bill in profile against the back bar, his "
        "martini on the slab. KEEP this exact camera, this crop, this pose, this lighting and this engraved "
        "pen — this IS the picture being edited"
    ),
    "barclay": (
        "a crop of this strip's own APPROVED plate: BARCLAY the golden retriever gentleman ALONE at the "
        "marble counter of The Swinging Door, chest-up, his head in three-quarter against the back bar, his "
        "old fashioned on the slab. KEEP this exact camera, this crop, this pose, this lighting and this "
        "engraved pen — this IS the picture being edited"
    ),
    "abby": (
        "a crop of this strip's own APPROVED plate: ABBY the West Highland White Terrier proprietor ALONE "
        "behind the marble counter of The Swinging Door on the far service side, chest-up, her head in "
        "three-quarter against the back bar. KEEP this exact camera, this crop, this pose, this lighting and "
        "this engraved pen — this IS the picture being edited"
    ),
}

# ------------------------------------------------------- the identity tiles
#
# lib/generate.ts VISION_REFS, path for path, label for label, in the studio's
# order. ONE SOURCE OF TRUTH: these are the same files the cast page shows.
VISION_REFS = {
    "drew": [
        {
            "path": "canon/vision/studies/drew.png",
            "label": (
                "Drew, exactly as the studio's official portrait — copy THIS bird identically: the bill, the black "
                "bow tie, the knitted sweater vest, and the feathered hands with four fingers and a thumb and no "
                "claws. The cartoon's Drew must be indistinguishable from this one"
            ),
        },
    ],
    "barclay": [
        {
            "path": "canon/vision/studies/barclay.png",
            "label": (
                "Barclay, exactly as the studio's official portrait — copy THIS dog identically: both eyes on the "
                "paper, the closed mouth, the flag pin on his left lapel, the wristwatch, the fur-backed clawless "
                "hands. The cartoon's Barclay must be indistinguishable from this one"
            ),
        },
    ],
    "abby": [
        {
            "path": "canon/vision/studies/abby.png",
            "label": (
                "Abby, exactly as the studio's official portrait — copy THIS lady identically: the round soft head "
                "with the big black nose close under the eyes and no muzzle, the glamorous lidded eyes, the smooth "
                "open neckline, the studded collar with its gem, the towel. The cartoon's Abby must be "
                "indistinguishable from this one"
            ),
        },
    ],
}

# The local bridge takes THREE references for the qwen family and drops the rest
# off the END of the list (backend/providers/local_bridge.py, max_refs). Picture 1
# plus one identity tile is two, so nothing is ever dropped — but the guard is
# here because a second Drew tile has been proposed more than once.
MAX_REFS = 3

NEWLINE = chr(10)

DEFAULT_POSE = {
    "drew": (
        "Drew sits alone at the marble with his martini in front of him, his long neck in its one easy "
        "S-curve, his head turned a little toward the back bar, heavy-lidded and amiable, one feathered "
        "hand resting on the slab."
    ),
    "barclay": (
        "Barclay sits alone at the marble with his old fashioned in front of him, his head turned a little "
        "toward the back bar, worried-earnest with the worry only in his raised inner brows, one fur-backed "
        "hand resting on the slab."
    ),
    "abby": (
        "Abby stands alone behind the counter on the far service side, polishing a glass with the towel from "
        "her left shoulder, smiling warmly across the empty marble."
    ),
}

# ------------------------------------------------------------- the SOLO edits
#
# Exact-string surgery into canon's own sentences. (needle, replacement) — a
# needle that no longer appears is reported, never patched around.
SOLO_CAMERA = (
    "THE CAMERA stands on the CUSTOMER SIDE, just behind and above the two gentlemen, looking ACROSS one "
    "long marble slab that runs left to right out of frame at both ends, to the back bar beyond."
)
SOLO_SEATING = (
    "DREW sits frame-LEFT and BARCLAY frame-RIGHT at the slab's NEAR side, close and large, seen from behind "
    "and turned toward each other so each face reads in three-quarter over his own shoulder; each man's body "
    "blocks the counter's near edge where he sits, so the marble shows only between and beside them, never as "
    "a strip in front of their chests, and the back bar is never behind them."
)
SOLO_HEIGHT = (
    "The bar is TALL: the marble's top edge crosses each gentleman at MID-CHEST, a hand's width below the bow "
    "tie; forearms rest ON the slab; drinks stand on it in front of them; nobody sits ON the counter, nobody "
    "hangs back from it, no shoulder dissolves into it."
)
SOLO_MARBLE = (
    "On the marble: Drew's martini (conical stemmed glass, one olive on one pick, on a coaster), Barclay's old "
    "fashioned (short rocks glass, one large cube, one dark cherry), the shared nut bowl between the two "
    "drinks, napkins."
)

# Applied for every character. A study letters NOTHING: the fence's two-label
# shelf and its "the six bottle labels" lettering licence would otherwise
# contradict edits 1-3, and small labels at this resolution come back as
# pseudo-text — the fault INSPECTION.md check 17 calls fatal.
SHARED_SOLO = {
    (
        "EXACTLY TWO labels are lettered, large and legible — BIRDIE BOURBON on the leftmost bottle of the top "
        "shelf and DIVOT DRIVE GIN on the rightmost — and EVERY OTHER LABEL IS BLANK, a plain empty paper "
        "panel with no marks at all."
    ): (
        "EVERY LABEL IS BLANK in a character study — a plain empty paper panel with no marks at all, and no "
        "lettering of any kind on the shelf."
    ),
    (
        "No speech balloon, caption or typeset words anywhere; the only lettering in the picture is the "
        "mirrored window name, the six bottle labels, the television chyron and the chalkboard."
    ): (
        "No speech balloon, caption or typeset words anywhere; the ONLY lettering in the whole picture is the "
        "house name mirrored on the window — the bottle labels, the television and the chalkboard carry no "
        "words at all."
    ),
}

SOLO_STAGE = {
    "drew": {
        SOLO_CAMERA: (
            "THE CAMERA stands on the CUSTOMER SIDE, close in on DREW and a little above him, looking ACROSS "
            "one long marble slab that runs left to right out of frame at both ends, to the back bar beyond."
        ),
        SOLO_SEATING: (
            "DREW sits ALONE at the slab's NEAR side, CENTRED in the frame, close and large — a chest-up "
            "study of him and nobody else — his head carried high on the long neck and turned so the bill "
            "reads in clean profile or near-profile against the back bar; his body blocks the counter's near "
            "edge where he sits, so the marble shows only beside him, never as a strip in front of his chest, "
            "and the back bar is never behind him. NO SECOND FIGURE of any kind is in the picture."
        ),
        SOLO_HEIGHT: (
            "The bar is TALL: the marble's top edge crosses him at MID-CHEST, a hand's width below the bow "
            "tie; his forearms rest ON the slab; his drink stands on it in front of him; he does not sit ON "
            "the counter, he does not hang back from it, no shoulder dissolves into it."
        ),
        SOLO_MARBLE: (
            "On the marble: Drew's martini (conical stemmed glass, one olive on one pick, on a coaster), the "
            "nut bowl, napkins."
        ),
    },
    "barclay": {
        SOLO_CAMERA: (
            "THE CAMERA stands on the CUSTOMER SIDE, close in on BARCLAY and a little above him, looking "
            "ACROSS one long marble slab that runs left to right out of frame at both ends, to the back bar "
            "beyond."
        ),
        SOLO_SEATING: (
            "BARCLAY sits ALONE at the slab's NEAR side, CENTRED in the frame, close and large — a chest-up "
            "study of him and nobody else — his face reading in three-quarter over his own shoulder against "
            "the back bar; his body blocks the counter's near edge where he sits, so the marble shows only "
            "beside him, never as a strip in front of his chest, and the back bar is never behind him. NO "
            "SECOND FIGURE of any kind is in the picture."
        ),
        SOLO_HEIGHT: (
            "The bar is TALL: the marble's top edge crosses him at MID-CHEST, a hand's width below the open "
            "collar; his forearms rest ON the slab; his drink stands on it in front of him; he does not sit "
            "ON the counter, he does not hang back from it, no shoulder dissolves into it."
        ),
        SOLO_MARBLE: (
            "On the marble: Barclay's old fashioned (short rocks glass, one large cube, one dark cherry), the "
            "nut bowl, napkins."
        ),
    },
    "abby": {
        SOLO_CAMERA: (
            "THE CAMERA stands on the CUSTOMER SIDE, close in on ABBY and level with her, looking ACROSS one "
            "long marble slab that runs left to right out of frame at both ends, to the back bar beyond."
        ),
        SOLO_SEATING: (
            "NOBODY SITS at the slab's NEAR side: the near marble is empty in the immediate foreground, and "
            "ABBY alone stands BEHIND the counter on the FAR service side, CENTRED in the frame, close and "
            "large — a chest-up study of her and nobody else — her face in three-quarter against the back "
            "bar. NO SECOND FIGURE of any kind is in the picture, and no customer is on her side of the bar."
        ),
        SOLO_HEIGHT: (
            "The bar is TALL: the marble's far edge crosses ABBY at the WAIST and hides her below it; she "
            "stands, so her head sits high in the frame; nobody sits ON the counter and no shoulder dissolves "
            "into it."
        ),
        SOLO_MARBLE: (
            "On the marble: a clean folded napkin and the glass she is working on, nothing else."
        ),
    },
}


# --------------------------------------------------------------- the fence
def local_fence(master: str) -> str:
    """lib/generate.ts fencesOf(): the 4th ```text fence is the LOCAL block.
    CRLF is normalised first — a Windows checkout breaks every split otherwise."""
    fences = [m.group(1).strip() for m in re.finditer(r"```text\n([\s\S]*?)```", master.replace("\r\n", "\n"))]
    if len(fences) < 4:
        raise SystemExit(
            f"canon/MASTER-PROMPT.md has {len(fences)} text fences; the LOCAL block is the 4th. "
            "The local model cannot be prompted without it."
        )
    return fences[3]


def build_prompt(character: str, pose: str, extra_edits: list[str] | None, refs: list[dict],
                 repair: bool = False, character_edit: str = "", cast_count: int = 1,
                 keep_duo: bool = False) -> tuple[str, list[str]]:
    """localPrompt() for a cast of one. Returns (prompt, solo_edits_missed).

    repair=True is PASS 2: Picture 1 is pass 1's own render and the only edits
    are the ones passed in. The set edits, the character edit, the business and
    the whole LOCAL fence are dropped, because re-stating them is what loses the
    neck and the wardrobe that pass 1 already got right."""
    if repair:
        roster = " ".join(f"Picture {i + 1} is {r['label']}." for i, r in enumerate(refs))
        edits = [e.strip() for e in (extra_edits or []) if e.strip()]
        head = f"REFERENCES. {roster}"
        body = [
            "PICTURE 1 IS ALREADY FINISHED AND ALREADY CORRECT EXCEPT FOR ONE THING. Redraw it exactly "
            "as it is, in the same engraved pen, the same camera, the same crop, the same light, the "
            "same figure, the same clothes, the same counter and the same back bar, and make ONLY these "
            "changes:",
        ]
        body += [f"{i + 1}. {e}" for i, e in enumerate(edits)]
        body.append(
            "CHANGE NOTHING ELSE IN THE PICTURE. The neck, the shoulders, the collar, the bow tie, the "
            "knitted sweater vest, the hands, the counter, the glass, the bottles, the room and every "
            "line of the drawing stay exactly as they are in Picture 1."
        )
        return head + NEWLINE + NEWLINE + NEWLINE.join(body), []

    master = (ROOT / "canon" / "MASTER-PROMPT.md").read_text(encoding="utf8")
    block = local_fence(master)
    has_abby = character == "abby"
    missed: list[str] = []

    # localPrompt's own per-paragraph rules: no TV slot -> the set stands the
    # television down; no board slot -> the slate is wiped; ABBY's paragraph is
    # replaced by the empty-service-side sentence when she is not cast. A study
    # never letters anything, so both slots are always empty here.
    def shared(p: str) -> str:
        for needle, replacement in SHARED_SOLO.items():
            if needle in p:
                p = p.replace(needle, replacement)
        return p

    for needle in SHARED_SOLO:
        if needle not in block:
            missed.append(needle[:60] + "…")

    out = []
    for p in (shared(par) for par in block.split("\n\n")):
        if p.startswith("ABBY "):
            out.append(p if has_abby else (
                "Nobody stands on the service side: the back bar stands across the counter behind no one, and "
                "no bartender, server or second figure of any kind is in the room."
            ))
            continue
        if p.startswith("THE TELEVISION"):
            out.append(
                "THE TELEVISION above the back bar is SWITCHED OFF: plain dark glass with nothing on it — no "
                "network bug, no chyron, no picture, and no lettering of any kind on or around the screen."
            )
            continue
        if p.startswith("THE CHALKBOARD"):
            out.append(
                "THE CHALKBOARD is WIPED CLEAN: bare dark slate inside its wooden frame, no chalk marks, no "
                "lettering."
            )
            continue
        if p.startswith("THE STAGE."):
            # THE ONE DEVIATION: re-point the duo's staging at one figure. ABBY
            # ROUND 3 turns it OFF (--keep-duo): when Picture 1 is a FULL PLATE
            # rather than a bust crop, canon's own staging paragraph already
            # describes exactly that plate — the gentlemen seated at the near
            # side, Abby behind the counter on the far one — and re-pointing it
            # at one figure is what told the model to throw the room away.
            if keep_duo:
                out.append(p)
                continue
            for needle, replacement in SOLO_STAGE[character].items():
                if needle in p:
                    p = p.replace(needle, replacement)
                else:
                    missed.append(needle[:60] + "…")
            out.append(p)
            continue
        if p.startswith("DREW (frame-left)"):
            if keep_duo:
                out.append(p)
                continue
            # The character block. One paragraph carries both gentlemen; keep
            # only the one being studied, and drop it entirely for Abby (her own
            # paragraph is the character block in that case).
            drew_part, sep, barclay_part = p.partition(" BARCLAY (frame-right)")
            if not sep:
                missed.append("DREW/BARCLAY paragraph split on ' BARCLAY (frame-right)'")
                out.append(p)
                continue
            if character == "drew":
                out.append(drew_part.strip())
            elif character == "barclay":
                out.append(("BARCLAY (frame-right)" + barclay_part).strip())
            # abby: neither gentleman is in the picture, so the block goes.
            continue
        out.append(p)

    scene = pose.strip().replace("as THE SIDES describes", "as THE STAGE describes")
    body = "\n\n".join(out).replace("[TV]", "BREAKING").replace("[BOARD]", "HAPPY HOUR 4–?").replace("[SCENE]", scene)

    roster = " ".join(f"Picture {i + 1} is {r['label']}." for i, r in enumerate(refs))
    action = re.split(r" IN THIS PANEL, CAMERA", scene)[0].strip()

    # AN EDIT MODEL WANTS EDITS — same order localPrompt uses: screen, board,
    # bottles, cast, business, everything-else.
    edits: list[str] = [
        "THE TELEVISION: leave it switched OFF — plain dark glass, no words, no picture.",
        "THE CHALKBOARD: leave it a blank wiped slate.",
        (
            "THE BOTTLES on the back bar: fill every bottle to a different level — some near full, some half, "
            "a few low, the liquid line showing through the glass — and leave EVERY label a blank paper panel "
            "with no marks and no lettering anywhere in the picture."
        ),
        (
            f"THE CHARACTER: redraw {character.upper()} to match Picture 2, the studio's official portrait, "
            "feature for feature — the head, the eye, the muzzle or bill, the coat or plumage and the wardrobe "
            "are Picture 2's, carried into Picture 1's camera, crop, pose and light. He is the ONLY figure in "
            "the picture."
            if character != "abby" else
            "THE CHARACTER: redraw ABBY to match Picture 2, the studio's official portrait, feature for "
            "feature — the round soft head, the big black nose close under the glamorous lidded eyes, the "
            "studded collar with its gem, the open blouse and smooth throat, the towel — carried into Picture "
            "1's camera, crop, pose and light. She is the ONLY figure in the picture."
        ) if not character_edit.strip() else
        # ABBY ROUND 2: the shipped wording of EDIT 4 describes "the round soft head" and "the
        # towel" — the Maltese drift the breed EDIT has to undo, and the shoulder towel the towel
        # EDIT has to strip, both stated four items before the corrections. --character-edit
        # re-points edit 4 for one round without changing anyone else's default.
        f"THE CHARACTER: {character_edit.strip()}",
        f"THE BUSINESS: {action}",
    ]
    for e in (extra_edits or []):
        if e.strip():
            edits.append(e.strip())
    edits.append(
        "EVERYTHING ELSE stays exactly as Picture 1: the camera, the crop at the marble, the seat, the pose, "
        "the back bar, the panelling and the sconces, and the engraved pen the plate is drawn in. Nobody looks "
        "out of the picture. No paper, card or phone appears unless the business names it."
    )

    prompt = (
        f"REFERENCES. {roster}\n\n"
        # ABBY ROUND 4: --cast-count was parsed and written into the sidecar but
        # never reached this sentence, so round 3 asked for "EXACTLY 1 character"
        # while its Picture 1 was a three-character plate and its own EDITS said
        # to keep Drew and Barclay. The flag is spent here now.
        "MAKE THESE CHANGES TO PICTURE 1 AND KEEP EVERYTHING ELSE. The result is ONE new single-panel "
        "character study in the same engraved style, one unbroken scene edge to edge, containing EXACTLY "
        f"{cast_count} character{'' if cast_count == 1 else 's'}.\n"
        + "\n".join(f"{i + 1}. {e}" for i, e in enumerate(edits))
        + "\n\nTHE RULES THE FINISHED PICTURE OBEYS:\n\n"
        + body
    )
    return prompt, missed


# ----------------------------------------------------------- the references
def prepare_reference(path: Path, box=None) -> tuple[str, dict]:
    """uploadReferences(): crop, grayscale, normalise, cap the width at 1024
    without enlarging, JPEG q90, inline as a data URI."""
    im = Image.open(path)
    if box:
        left, top, w, h = box
        im = im.crop((left, top, left + w, top + h))
    im = ImageOps.autocontrast(im.convert("L"), cutoff=0)          # sharp .grayscale().normalise()
    if im.width > 1024:
        im = im.resize((1024, max(1, round(im.height * 1024 / im.width))), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, format="JPEG", quality=90)
    raw = buf.getvalue()
    return (
        "data:image/jpeg;base64," + base64.b64encode(raw).decode("ascii"),
        {"size": list(im.size), "bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest()[:16]},
    )


def reference_list(character: str, p1_box=None, p1_label: str = "", extra_tiles=None, p1_path: str = "",
                   p2_box=None, p2_label: str = "", p2_path: str = "", drop_portrait: bool = False) -> list[dict]:
    """Picture 1 = the plate crop; then the character's VISION_REFS tiles in the
    studio's order. Capped at the bridge's three.

    A round may re-point Picture 1 (--picture1-box / --picture1-label) or hang
    another identity tile on the end (--ref). Both are recorded in the sidecar's
    references block, so the roster in the prompt and the tiles on the wire stay
    the same list."""
    crop = PLATE_CROPS[character]
    box = list(p1_box) if p1_box else list(crop["box"])
    path = p1_path.strip() if p1_path else crop["plate"]
    if p1_path and not p1_box:
        box = None                       # a pre-composited Picture 1 is already the crop
    refs = [{
        "picture": 1,
        "path": path,
        "box": box,
        "label": p1_label.strip() or PICTURE1_LABEL[character],
        "box_overridden": bool(p1_box),
        "path_overridden": bool(p1_path),
    }]
    if not drop_portrait:
        for i, tile in enumerate(VISION_REFS[character]):
            # ROUND 4: the identity tile may be RE-CUT. The full-body portrait
            # carries a belt, trousers and a hand gripping the martini stem, and
            # every round the model copied that staging back out of it; a
            # head-and-shoulders crop cannot.
            refs.append({
                "picture": len(refs) + 1,
                "path": (p2_path.strip() or tile["path"]) if i == 0 else tile["path"],
                "box": list(p2_box) if (i == 0 and p2_box) else None,
                "label": (p2_label.strip() or tile["label"]) if i == 0 else tile["label"],
                "box_overridden": bool(i == 0 and p2_box),
                "path_overridden": bool(i == 0 and p2_path),
            })
    for tile in (extra_tiles or []):
        refs.append({"picture": len(refs) + 1, "path": tile["path"], "box": tile["box"], "label": tile["label"]})
    return refs[:MAX_REFS]


def parse_box(text: str) -> tuple[int, int, int, int]:
    parts = [int(x) for x in re.split(r"[,x ]+", text.strip()) if x != ""]
    if len(parts) != 4:
        raise SystemExit(f"--picture1-box wants LEFT,TOP,WIDTH,HEIGHT — got {text!r}")
    return tuple(parts)  # type: ignore[return-value]


def parse_ref(text: str) -> dict:
    """PATH[@L,T,W,H]::LABEL — an extra identity tile for this round."""
    head, sep, label = text.partition("::")
    if not sep:
        raise SystemExit(f"--ref wants PATH[@L,T,W,H]::LABEL — got {text!r}")
    path, at, boxtext = head.partition("@")
    return {"path": path.strip(), "box": list(parse_box(boxtext)) if at else None, "label": label.strip()}


# --------------------------------------------------------------- the finish
def finish(png: bytes) -> Image.Image:
    """generateCartoonArt(): the local model draws the engraving with a faint
    colour cast, so the tint goes; then cropAtTheCounter trims the paper margin
    and caps the height at width*1.25 (a no-op at a true 4:5)."""
    im = Image.open(io.BytesIO(png)).convert("L")
    a = np.asarray(im).astype(np.int16)
    corner = int(a[0, 0])
    keep_rows = np.where(np.abs(a - corner).max(axis=1) > 12)[0]
    keep_cols = np.where(np.abs(a - corner).max(axis=0) > 12)[0]
    if keep_rows.size and keep_cols.size:
        im = im.crop((int(keep_cols[0]), int(keep_rows[0]), int(keep_cols[-1]) + 1, int(keep_rows[-1]) + 1))
    tallest = round(im.width * 1.25)
    if im.height > tallest:
        im = im.crop((0, 0, im.width, tallest))
    return im


# ------------------------------------------------------------------ the wire
def build_request(prompt: str, images: list[str], seed: int, fast: bool, tag: str, negative_extra: str = "") -> dict:
    """multiRefInput()'s local branch, through generateImageAuraVision()'s
    payload. Keys JSON.stringify would drop as undefined are omitted."""
    return {
        "prompt": prompt,
        "model": MODEL,
        "provider": "local",
        "aspect_ratio": "4:5",                 # the house shape -> 1344x1680 on the bridge
        "input_images": images,
        "negative_prompt": LOCAL_NEGATIVE + (", " + negative_extra.strip() if negative_extra.strip() else ""),
        "output_format": "png",
        "fast": fast,                          # Lightning 8-step, cfg 1 — duo-behind.txt's recipe
        "tag": tag,
        "seed": seed,
    }


def post(req: dict, server: str) -> dict:
    body = json.dumps(req).encode("utf8")
    r = urllib.request.Request(
        server.rstrip("/") + "/api/generate",
        data=body,
        headers={"Content-Type": "application/json", "Connection": "close"},
        method="POST",
    )
    with urllib.request.urlopen(r, timeout=20 * 60) as resp:
        return json.load(resp)


def fetch(url: str, server: str) -> bytes:
    if url.startswith("http"):
        full = url
    else:
        full = server.rstrip("/") + url
    with urllib.request.urlopen(full, timeout=300) as resp:
        return resp.read()


def next_round(character: str) -> Path:
    base = SCRATCH / character
    n = 1
    while (base / f"round-{n}").exists():
        n += 1
    return base / f"round-{n}"


def main() -> None:
    ap = argparse.ArgumentParser(description="One standalone character study on the house model.")
    ap.add_argument("--character", required=True, choices=sorted(PLATE_CROPS))
    ap.add_argument("--seed", type=int, required=True)
    ap.add_argument("--pose", default="")
    ap.add_argument("--extra-edit", action="append", default=[], help="one more numbered EDIT (repeatable)")
    ap.add_argument("--out", default="")
    ap.add_argument("--rolls", type=int, default=1, help="seed, seed+1, … in one run")
    ap.add_argument("--full", action="store_true", help="40-step cfg 4 instead of the Lightning 8-step pass")
    ap.add_argument("--tag", default="")
    ap.add_argument("--server", default=SERVER)
    ap.add_argument("--dry-run", action="store_true", help="write the prompt and the sidecar, draw nothing")
    ap.add_argument("--picture1-box", default="", help="L,T,W,H — re-point Picture 1's crop for this round")
    ap.add_argument("--picture1-label", default="", help="replace Picture 1's roster label")
    ap.add_argument("--picture1-path", default="", help="use THIS image file as Picture 1 (a pre-composite)")
    ap.add_argument("--negative-extra", default="", help="appended to LOCAL_NEGATIVE (INERT on the fast cfg-1 pass)")
    ap.add_argument("--ref", action="append", default=[], help="extra tile: PATH[@L,T,W,H]::LABEL (repeatable)")
    ap.add_argument("--picture2-box", default="", help="L,T,W,H — re-cut the identity tile for this round")
    ap.add_argument("--picture2-label", default="", help="replace the identity tile's roster label")
    ap.add_argument("--picture2-path", default="", help="use THIS file as the identity tile")
    ap.add_argument("--character-edit", default="",
                    help="replace EDIT 4, THE CHARACTER, for this round")
    ap.add_argument("--drop-portrait", action="store_true", help="no VISION_REFS tile at all (--ref supplies it)")
    ap.add_argument("--cast-count", type=int, default=1,
                    help="how many characters the finished picture holds (the header line)")
    ap.add_argument("--keep-duo", action="store_true",
                    help="do NOT re-point the fence's staging at one figure — for a FULL-PLATE Picture 1")
    ap.add_argument("--repair", action="store_true",
                    help="PASS 2: Picture 1 is a finished render; send ONLY --extra-edit and 'change nothing else'")
    a = ap.parse_args()

    who = a.character
    pose = a.pose.strip() or DEFAULT_POSE[who]
    refs = reference_list(
        who,
        p1_box=parse_box(a.picture1_box) if a.picture1_box else None,
        p1_label=a.picture1_label,
        extra_tiles=[parse_ref(t) for t in a.ref],
        p1_path=a.picture1_path,
        p2_box=parse_box(a.picture2_box) if a.picture2_box else None,
        p2_label=a.picture2_label,
        p2_path=a.picture2_path,
        drop_portrait=a.drop_portrait,
    )
    prompt, missed = build_prompt(who, pose, a.extra_edit, refs, repair=a.repair,
                                  character_edit=a.character_edit, cast_count=a.cast_count,
                                  keep_duo=a.keep_duo)
    if missed:
        print("[canon drift] these sentences were not found in the LOCAL fence, so their SOLO edit did not apply:")
        for m in missed:
            print("   -", m)

    out = Path(a.out) if a.out else next_round(who)
    out.mkdir(parents=True, exist_ok=True)

    images, meta = [], []
    for r in refs:
        rp = Path(r["path"])
        uri, info = prepare_reference(rp if rp.is_absolute() else ROOT / r["path"], r["box"])
        images.append(uri)
        meta.append({**{k: v for k, v in r.items()}, **info})

    for i in range(max(1, a.rolls)):
        seed = a.seed + i
        tag = a.tag or f"study-{who}"
        req = build_request(prompt, images, seed, not a.full, tag, a.negative_extra)
        name = f"{who}-seed{seed}{'-full' if a.full else ''}"
        (out / f"{name}.prompt.txt").write_text(prompt, encoding="utf8")
        sidecar = {
            "generated_at": dt.datetime.now().isoformat(timespec="seconds"),
            "script": "scripts/cast-study.py",
            "character": who,
            "pose": pose,
            "extra_edit": a.extra_edit or None,
            "picture1_path_override": a.picture1_path or None,
            "negative_extra": a.negative_extra or None,
            "picture1_box_override": a.picture1_box or None,
            "picture1_label_override": a.picture1_label or None,
            "extra_refs": a.ref or None,
            "picture2_box_override": a.picture2_box or None,
            "picture2_label_override": a.picture2_label or None,
            "picture2_path_override": a.picture2_path or None,
            "drop_portrait": a.drop_portrait,
            "cast_count": a.cast_count,
            "keep_duo": a.keep_duo,
            "repair_pass": a.repair,
            "server": a.server,
            "request": {**req, "input_images": f"<{len(images)} data URIs — see references>"},
            "references": meta,
            "expected_size": [1344, 1680],
            "sampler_expected": {"steps": 8, "cfg": 1.0} if not a.full else {"steps": 30, "cfg": 4.0},
            "solo_edits_missed": missed,
        }
        if a.dry_run:
            (out / f"{name}.json").write_text(json.dumps(sidecar, indent=2, ensure_ascii=False), encoding="utf8")
            print(f"[dry run] {out / (name + '.json')}")
            continue

        t0 = time.time()
        res = post(req, a.server)
        if not res.get("success"):
            print(f"FAILED seed {seed}: {res.get('error')}", file=sys.stderr)
            sidecar["error"] = res.get("error")
            (out / f"{name}.json").write_text(json.dumps(sidecar, indent=2, ensure_ascii=False), encoding="utf8")
            continue
        png = fetch(res["image_url"], a.server)
        img = finish(png)
        png_path = out / f"{name}.png"
        img.save(png_path)
        sidecar["result"] = {
            "seed_used": res.get("seed_used"),
            "elapsed_seconds": round(time.time() - t0, 1),
            "server_metadata": res.get("metadata"),
            "server_local_path": res.get("local_path"),
            "saved": str(png_path),
            "final_size": list(img.size),
        }
        (out / f"{name}.json").write_text(json.dumps(sidecar, indent=2, ensure_ascii=False), encoding="utf8")
        print(f"{png_path}  ({img.size[0]}x{img.size[1]}, {sidecar['result']['elapsed_seconds']}s, "
              f"seed {res.get('seed_used')})")


if __name__ == "__main__":
    main()
