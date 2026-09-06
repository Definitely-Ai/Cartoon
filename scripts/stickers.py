"""Every object in the room as a transparent STICKER over the rendered base.

The founder, 2026-09-05: "maybe we need to generate the room then use all of
these as stickers we can drag and drop into the correct space in the room then
we can remove that layer later on if needed and modify it."

room-part.py lays each part onto the plate with a different recipe per part -
a ring-fitted gamma for the chairs and the bottles, a flat level to the wall
for the marble and the board, a high-key level plus a mirrored ghost plus a
raking sheen for the glass - and then the television's blank screen is drawn
in code over the lot. None of that is a plain paste, so a sticker cannot be
"the part's render with its mask stuck on": it has to be the part AS THE PLATE
RECEIVED IT.

So this does not re-implement any of it. It replays room-part.py's own
assemble() one layer at a time and, at each layer, SOLVES for the sticker:

    plate_after = plate_before * (1 - alpha) + rgb * alpha
    =>  rgb = plate_before + (plate_after - plate_before) / alpha

with alpha the part's own feathered mask (mask_of(grow=1, feather)). That
inversion is exact for every recipe, including the glass's sheen and the
screen's drawn slab, because every one of them only touches pixels the mask
covers. Lay the stickers back down in order over base.png and you get plate.png
back - compose-layers.py measures that and prints the number.

A part that is DISABLED in parts.json still gets a sticker if it has an
approved parts/<id>.png, so the founder can drag a switched-off chair back in
and look at it; its tone is solved against the plate as it stands at that
layer with the enabled parts behind it.

The window sign is NOT a sticker - see SIGN_NOTE below.

    C:/Python313/python.exe scripts/stickers.py export
    C:/Python313/python.exe scripts/stickers.py export --quiet
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from datetime import datetime
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
KIT = ROOT / "canon/room-kit/v2"
OUT = KIT / "stickers"

# Below this the mask contributes nothing a byte of alpha could carry, and
# dividing by it would only amplify rounding into the fringe.
ALPHA_FLOOR = 1.5 / 255.0

SIGN_NOTE = (
    "THE SWINGING DOOR is not a sticker: sign-on-glass.py typesets it at 4x in the "
    "glass's own flat space and warps it ONCE onto the measured windowQuad, so it is "
    "tied to that quad's perspective and there is nothing to drag - moved by a pixel it "
    "stops lying on the pane. It stays the last BUILD STEP: compose-layers.py runs "
    "sign-on-glass.py on the composed plate and writes plate-layers-signed.png."
)


def load_room_part():
    """Import scripts/room-part.py as a module (the hyphen bars a plain import).

    Safe: its argparse lives in main() behind an __main__ guard, so importing
    it runs nothing. We never call render/approve/build - only the pure image
    functions - so the GPU and parts.json are untouched.
    """
    spec = importlib.util.spec_from_file_location("room_part", ROOT / "scripts/room-part.py")
    mod = importlib.util.module_from_spec(spec)
    sys.modules["room_part"] = mod
    spec.loader.exec_module(mod)
    if hasattr(mod, "main") and getattr(mod, "MAN", None) is None:
        pass
    return mod


def solve_sticker(before: np.ndarray, after: np.ndarray, alpha: np.ndarray):
    """rgb such that before*(1 - alpha) + rgb*alpha == after, wherever alpha bites.

    One wrinkle, and only the glass has it. The pane's sheen adds
    (255 - out) * s * mask, so in the fringe of the mask - alpha a few hundredths -
    the layer is asked to lift the plate further than a paint of that opacity can
    reach even if the paint were pure white. There rgb would solve above 255, and
    clipping it would lose the lift. So where the solve runs off the end of the
    range the ALPHA is raised to the least opacity that can carry the change, and
    rgb comes back inside 0..255 exactly. It only ever happens in the feather -
    the silhouette itself is untouched - and it keeps the composite exact, which
    is the whole point of the sticker.
    """
    a0 = np.where(alpha < ALPHA_FLOOR, 0.0, alpha).astype(np.float32)
    d = (after - before).astype(np.float32)
    head = np.where(d > 0, 255.0 - before, before)              # how far a full-opacity paint could move it
    need = np.abs(d) / np.maximum(head, 1e-6)
    a = np.where(a0 > 0, np.minimum(1.0, np.maximum(a0, need)), 0.0).astype(np.float32)
    lifted = float((a - a0)[a0 > 0].max()) if (a0 > 0).any() else 0.0
    rgb = np.where(a > 0, before + d / np.maximum(a, ALPHA_FLOOR), before)
    clipped = np.clip(rgb, 0.0, 255.0)
    # what is still lost, weighted by the alpha it is seen through
    cost = float((np.abs(rgb - clipped) * a).max()) if a.any() else 0.0
    # and anything the layer changed OUTSIDE its own mask, which nothing should
    outside = float(np.abs(d[a0 <= 0]).max()) if (a0 <= 0).any() else 0.0
    return clipped, a, cost, lifted, outside


def geometry_for_disabled(quiet: bool = False) -> Path | None:
    """Masks for the parts that are switched OFF, without touching anything.

    draw-room-lines.py skips every name in its DISABLED tuple, so masks/chair-left.png
    and the rest are all black on disk and a switched-off part has no silhouette to
    cut a sticker with - even though parts/chair-left.png is an approved render the
    founder may well want to drag back in. DISABLED is a module constant with no
    switch, and that file is not ours to edit, so this takes a COPY of it into the
    system temp with DISABLED emptied and runs the copy with --out beside itself.
    It writes only into that temp directory; the kit is not touched, and neither is
    the real script. The geometry is deterministic, so the masks it produces are the
    ones the kit would hold with the parts switched back on.
    """
    import re
    import subprocess
    import tempfile

    home = Path(tempfile.gettempdir()) / "swd-sticker-geometry"
    home.mkdir(parents=True, exist_ok=True)
    src = (ROOT / "scripts/draw-room-lines.py").read_text(encoding="utf8")
    copy_text, n = re.subn(r"^DISABLED = \(.*?\)(\s*#.*)?$",
                           "DISABLED = ()  # emptied by scripts/stickers.py - scratch copy, nothing else changed",
                           src, count=1, flags=re.M)
    if n != 1:
        print("  ! could not find the DISABLED tuple in draw-room-lines.py: "
              "switched-off parts get no sticker", file=sys.stderr)
        return None
    # draw-room-lines.py resolves --out against ITS OWN parent.parent, so the copy
    # goes in a bin/ directory one level down and --out is named from there.
    (home / "bin").mkdir(exist_ok=True)
    script = home / "bin" / "draw-room-lines-all-parts.py"
    script.write_text(copy_text, encoding="utf8")
    out = home / "all-parts"
    r = subprocess.run([sys.executable, str(script), "--out", "all-parts"],
                       capture_output=True, text=True)
    if r.returncode != 0 or not (out / "masks").is_dir():
        print(f"  ! geometry for the switched-off parts failed: {r.stderr.strip()[:300]}", file=sys.stderr)
        return None
    if not quiet:
        print(f"geometry for the switched-off parts drawn in {out}")
    return out


def bbox_of(a: np.ndarray):
    ys, xs = np.nonzero(a > 0)
    if len(xs) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def write_sticker(path: Path, rgb: np.ndarray, alpha: np.ndarray, box):
    x0, y0, x1, y1 = box
    g = np.clip(rgb[y0:y1, x0:x1], 0, 255).astype(np.uint8)
    a = np.clip(alpha[y0:y1, x0:x1] * 255.0 + 0.5, 0, 255).astype(np.uint8)
    Image.fromarray(np.dstack([g, g, g, a])).save(path)


def cmd_export(args) -> None:
    rp = load_room_part()
    man = rp.manifest()                       # also sets rp.MAN, which lay() reads
    rp.APPLY_SHADOWS = False                  # shadows are a code layer compose-layers.py applies from shadows/<part>.png
    OUT.mkdir(parents=True, exist_ok=True)

    src = man["base"].get("source")
    if not src:
        raise SystemExit("no approved base in parts.json: nothing to build stickers over")
    # exactly assemble()'s first line: the base, levelled so the back wall reads WALL_TONE
    plate = rp.level_to(rp.load(ROOT / src), rp.wall_mask(man), rp.WALL_TONE)
    H, W = plate.shape
    Image.fromarray(np.clip(plate, 0, 255).astype(np.uint8)).convert("RGB").save(OUT / "base.png")
    if not args.quiet:
        print(f"base.png    {W}x{H}  from {src}")

    # Any part whose kit mask is blank is a part draw-room-lines.py skipped as
    # DISABLED. Redraw the geometry with nothing disabled, in a scratch copy, so
    # the switched-off parts have silhouettes to cut stickers with.
    blank = [p["id"] for p in man["parts"]
             if p.get("source") and (ROOT / p["source"]).exists()
             and np.asarray(Image.open(KIT / p["mask"]).convert("L")).max() == 0]
    geom = None
    if blank and not args.no_disabled:
        if not args.quiet:
            print(f"blank masks (switched off in draw-room-lines.py): {', '.join(blank)}")
        geom = geometry_for_disabled(args.quiet)

    entries = []
    order = 0
    worst = worst_lift = worst_outside = 0.0
    for part in man["parts"]:
        pid = part["id"]
        source = part.get("source")
        approved = ROOT / source if source else None
        order += 1
        if not source or not approved.exists():
            if not args.quiet:
                print(f"{pid:14s} skipped: no approved parts/{pid}.png")
            continue

        mask_source = part["mask"]
        if pid in blank:
            if geom is None or not (geom / "masks" / f"{pid}.png").exists():
                if not args.quiet:
                    print(f"{pid:14s} skipped: mask is blank and no redrawn geometry")
                continue
            # mask_of() does KIT / part["mask"]; an absolute path on the right wins
            part = dict(part, mask=str(geom / "masks" / f"{pid}.png"))
            mask_source = f"redrawn: {geom.name}/masks/{pid}.png"

        before = plate.copy()
        after = rp.lay(before, part, approved, quiet=True)
        alpha = rp.mask_of(part, grow=1, feather=part.get("feather", 3))
        rgb, alpha, cost, lift, outside = solve_sticker(before, after, alpha)
        worst, worst_lift, worst_outside = max(worst, cost), max(worst_lift, lift), max(worst_outside, outside)
        box = bbox_of(alpha)
        if box is None:
            if not args.quiet:
                print(f"{pid:14s} skipped: empty mask")
            continue
        write_sticker(OUT / f"{pid}.png", rgb, alpha, box)
        x0, y0, x1, y1 = box
        entries.append({
            "part": pid, "file": f"{pid}.png", "x": x0, "y": y0, "w": x1 - x0, "h": y1 - y0,
            "layerOrder": order, "enabled": bool(part.get("enabled", True)),
            "source": source, "note": part.get("note", ""),
            "toneMatch": bool(part.get("toneMatch")), "feather": part.get("feather", 3),
            "mask": mask_source,
        })
        if not args.quiet:
            state = "on " if part.get("enabled", True) else "OFF"
            print(f"{pid:14s} {state}  {x1 - x0:4d}x{y1 - y0:4d} at {x0:4d},{y0:4d}  "
                  f"clip {cost:.2f}  alpha lifted {lift:.3f}  outside mask {outside:.2f}")

        # only an ENABLED part actually goes into the plate, so only an enabled
        # part becomes the ground the next layer is toned against - same rule
        # as assemble(). A disabled part is solved against this plate and then
        # dropped, exactly as room-part.py drops it.
        if part.get("enabled", True):
            plate = after

    # The television's blank screen. Not a render at all: room-part.py draws it
    # into the measured screenQuad in code, after every part, because six seeds
    # would not give a dark screen. It composites cleanly through its own blurred
    # quad, so it inverts to a sticker like the rest.
    tv = next((p for p in man["parts"] if p["id"] == "tv"), None)
    if tv and tv.get("source") and tv.get("enabled", True):
        order += 1
        before = plate.copy()
        after = rp.blank_screen(before)
        q = json.loads((KIT / "quads.json").read_text(encoding="utf8"))["screenQuad"]
        from PIL import ImageDraw, ImageFilter
        m = Image.new("L", (W, H), 0)
        ImageDraw.Draw(m).polygon([tuple(p) for p in q], fill=255)
        alpha = np.asarray(m.filter(ImageFilter.GaussianBlur(1.2)), np.float32) / 255.0
        rgb, alpha, cost, lift, outside = solve_sticker(before, after, alpha)
        worst, worst_lift, worst_outside = max(worst, cost), max(worst_lift, lift), max(worst_outside, outside)
        box = bbox_of(alpha)
        write_sticker(OUT / "tv-screen.png", rgb, alpha, box)
        x0, y0, x1, y1 = box
        entries.append({
            "part": "tv-screen", "file": "tv-screen.png", "x": x0, "y": y0, "w": x1 - x0, "h": y1 - y0,
            "layerOrder": order, "enabled": True, "source": "code: room-part.py blank_screen()",
            "note": "the switched-off screen, drawn in code into quads.json screenQuad - the joke's footage is pasted here later",
            "toneMatch": False, "feather": 0, "mask": "quads.json screenQuad, blurred 1.2",
        })
        if not args.quiet:
            print(f"{'tv-screen':14s} on   {x1 - x0:4d}x{y1 - y0:4d} at {x0:4d},{y0:4d}  "
                  f"clip {cost:.2f}  (drawn in code)")
        plate = after

    doc = {
        "_doc": "Written by scripts/stickers.py export. Every object in the room as an RGBA sticker "
                "over base.png: RGB is the layer exactly as room-part.py's lay() toned it for the "
                "plate, alpha is the part's feathered mask, cropped to the alpha bbox and placed "
                "at x,y. Lay them down in layerOrder over base.png and you get plate.png back - "
                "scripts/compose-layers.py does that and measures the difference.",
        "generated": datetime.now().isoformat(timespec="seconds"),
        "plate": {"w": W, "h": H},
        "base": "base.png",
        "baseSource": src,
        "wallTone": rp.WALL_TONE,
        "sign": {"sticker": False, "step": "scripts/sign-on-glass.py", "note": SIGN_NOTE},
        "stickers": entries,
    }
    (OUT / "manifest.json").write_text(json.dumps(doc, indent=2), encoding="utf8")
    if not args.quiet:
        on = sum(1 for e in entries if e["enabled"])
        print(f"\nwrote {len(entries)} stickers ({on} on, {len(entries) - on} switched off) "
              f"+ base.png + manifest.json to {OUT}")
        print(f"worst alpha-weighted clip left over: {worst:.3f} grey levels")
        print(f"worst alpha lifted out of the feather: {worst_lift:.3f}")
        print(f"worst change a layer made outside its own mask: {worst_outside:.3f} grey levels")
        print(f"sign: {SIGN_NOTE}")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    e = sub.add_parser("export", help="write canon/room-kit/v2/stickers/")
    e.add_argument("--quiet", action="store_true")
    e.add_argument("--no-disabled", action="store_true",
                   help="do not redraw geometry for the switched-off parts; skip them instead")
    e.set_defaults(f=cmd_export)
    a = ap.parse_args()
    a.f(a)


if __name__ == "__main__":
    main()
