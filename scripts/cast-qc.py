"""Cast QC judging tool.

Builds a judging sheet for a cast pose: each render's figure crop (at 1:1)
sits in a row beside reference bust/head tiles at the same height, labelled
with the seed parsed from the filename; beneath the rows sits the checklist
pulled from the character's QUALITY-CONTROL.md pass/fail lines plus the
founder's three, printed as numbered boxes for a judge to tick.

A second subcommand, `file`, snapshots a chosen render into the room-kit's
per-object history for that pose via scripts/object-history.py, carrying the
verdict text along.

    cast-qc.py sheet --character drew|barclay|abby --pose <pose id> \
        --render <laid plate png> [--render ... more seeds] \
        --refs <bust.png> <head.png> --out <png> [--box x0,y0,x1,y1]

    cast-qc.py file --character drew|barclay|abby --pose <pose id> \
        --render <chosen png> --verdict "..." [--label s7] [--note "..."]

Plain Python, PIL only.
"""
import argparse
import os
import re
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = "Z:/ImageGenerator/Cartoon"
KIT = ROOT + "/canon/room-kit/v2"
MASKS = KIT + "/masks"
OBJECT_HISTORY = ROOT + "/scripts/object-history.py"
PYTHON = "C:/Python313/python.exe"

# --character value -> canon/characters/<dir>
CHARACTER_DIRS = {"drew": "flamingo", "barclay": "dog", "abby": "abby"}

FOUNDER_CHECKS = [
    "Friendly — reads as warm and approachable, not stiff or sour.",
    "Beautiful texture for the species — fur/feather/skin rendering is specific to this animal, not generic.",
    "Eyes are human and huggable — readable, warm, inviting a hug, not glassy or beady.",
]

PAD = 0.10  # bbox padding fraction, each side
ROW_H = 460  # target row height for image tiles
GUTTER = 18
MARGIN = 24
LABEL_H = 30


def _font(sz, bold=False):
    names = (["C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf"] if bold
             else ["C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"])
    for f in names:
        if os.path.exists(f):
            return ImageFont.truetype(f, sz)
    return ImageFont.load_default()


def parse_seed(path):
    m = re.search(r"-s(\d+)", os.path.basename(path))
    return "s" + m.group(1) if m else os.path.splitext(os.path.basename(path))[0]


def parse_box_arg(s):
    parts = [float(x) for x in s.split(",")]
    if len(parts) != 4:
        sys.exit("--box needs x0,y0,x1,y1")
    return tuple(parts)


def mask_bbox(pose, pad=PAD):
    mp = os.path.join(MASKS, pose + ".png")
    if not os.path.exists(mp):
        return None
    import numpy as np
    a = np.array(Image.open(mp).convert("L"))
    ys, xs = np.nonzero(a > 127)
    if not len(xs):
        return None
    h, w = a.shape
    l, t, r, b = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    pw, ph = (r - l) * pad, (b - t) * pad
    return (max(0, l - pw), max(0, t - ph), min(w, r + pw), min(h, b + ph))


def crop_figure(render_path, pose, box_arg):
    im = Image.open(render_path).convert("L")
    W, H = im.size
    if box_arg:
        box = box_arg
    else:
        box = mask_bbox(pose)
        if box is None:
            sys.exit("no mask for pose '%s' at %s/%s.png -- pass --box x0,y0,x1,y1"
                      % (pose, MASKS, pose))
    l, t, r, b = box
    l, t = max(0, int(l)), max(0, int(t))
    r, b = min(W, int(r)), min(H, int(b))
    if r - l < 4 or b - t < 4:
        sys.exit("crop box degenerate for %s: %s" % (render_path, box))
    return im.crop((l, t, r, b))


def resize_to_height(im, h):
    w = max(1, round(im.width * h / im.height))
    return im.resize((w, h), Image.LANCZOS)


def qc_lines(character):
    dirn = CHARACTER_DIRS.get(character)
    if not dirn:
        sys.exit("unknown --character '%s' (want drew|barclay|abby)" % character)
    qc_path = os.path.join(ROOT, "canon/characters", dirn, "QUALITY-CONTROL.md")
    lines = []
    if os.path.exists(qc_path):
        for raw in open(qc_path, encoding="utf-8"):
            m = re.match(r"\s*-\s*\[ \]\s*(.+?)\s*$", raw)
            if m:
                text = re.sub(r"\*\*", "", m.group(1))
                text = re.sub(r"`([^`]+)`", r"\1", text)
                lines.append(text)
    return lines, qc_path


def cmd_sheet(a):
    boxes = parse_box_arg(a.box) if a.box else None
    rows = []
    for rp in a.render:
        if not os.path.exists(rp):
            sys.exit("no such render: " + rp)
        seed = parse_seed(rp)
        fig = crop_figure(rp, a.pose, boxes)
        rows.append((seed, os.path.basename(rp), resize_to_height(fig, ROW_H)))

    ref_tiles = []
    ref_labels = ["bust ref", "head ref"]
    for i, rp in enumerate(a.refs):
        if not os.path.exists(rp):
            sys.exit("no such ref: " + rp)
        im = Image.open(rp).convert("L")
        ref_tiles.append(resize_to_height(im, ROW_H))

    checklist, qc_path = qc_lines(a.character)
    checklist = checklist + FOUNDER_CHECKS

    tile_row_w = sum(im.width for _, _, im in rows) if rows else 0
    tile_row_w += len(rows) * GUTTER
    ref_row_w = sum(im.width for im in ref_tiles) + max(0, len(ref_tiles) - 1) * GUTTER
    img_area_w = tile_row_w + GUTTER + ref_row_w

    f_title = _font(26, bold=True)
    f_label = _font(17)
    f_item = _font(16)
    f_hdr = _font(19, bold=True)

    checklist_col_w = 620
    n_cols = 2 if len(checklist) > 26 else 1
    per_col = (len(checklist) + n_cols - 1) // n_cols
    checklist_h = MARGIN + 30 + per_col * 24 + MARGIN

    W = max(img_area_w, checklist_col_w * n_cols) + 2 * MARGIN
    img_band_h = LABEL_H + ROW_H + 40
    H = MARGIN + 40 + img_band_h + 20 + checklist_h

    sheet = Image.new("L", (W, H), 255)
    dr = ImageDraw.Draw(sheet)
    dr.text((MARGIN, MARGIN),
            "%s / %s -- QC judging sheet" % (a.character, a.pose), 0, font=f_title)

    y = MARGIN + 40 + LABEL_H
    x = MARGIN
    for seed, fname, im in rows:
        dr.text((x, y - LABEL_H), "%s  (%s)" % (seed, fname), 0, font=f_label)
        sheet.paste(im, (x, y))
        dr.rectangle([x, y, x + im.width - 1, y + im.height - 1], outline=140)
        x += im.width + GUTTER
    x += GUTTER
    for label, im in zip(ref_labels, ref_tiles):
        dr.text((x, y - LABEL_H), label, 0, font=f_label)
        sheet.paste(im, (x, y))
        dr.rectangle([x, y, x + im.width - 1, y + im.height - 1], outline=140)
        x += im.width + GUTTER

    cy = y + ROW_H + 40
    dr.text((MARGIN, cy), "Checklist  (from %s + founder's three)" % qc_path, 0, font=f_hdr)
    cy0 = cy + 30
    for i, text in enumerate(checklist):
        col = i // per_col
        row = i % per_col
        bx = MARGIN + col * checklist_col_w
        by = cy0 + row * 24
        dr.rectangle([bx, by + 3, bx + 14, by + 17], outline=0)
        num = "%d." % (i + 1)
        dr.text((bx + 20, by), num, 0, font=f_item)
        num_w = dr.textlength(num, font=f_item)
        avail = checklist_col_w - 20 - num_w - 10
        txt = text
        while txt and dr.textlength(txt, font=f_item) > avail:
            txt = txt[:-1]
        if txt != text:
            txt = txt[:-3] + "..."
        dr.text((bx + 20 + num_w + 6, by), txt, 0, font=f_item)

    out_dir = os.path.dirname(a.out)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
    sheet.save(a.out)
    print("%s  %d render(s), %d checklist items -> %s"
          % (a.pose, len(rows), len(checklist), a.out))


def cmd_file(a):
    if not os.path.exists(a.render):
        sys.exit("no such render: " + a.render)
    label = a.label or parse_seed(a.render)
    note = a.note or ("cast-qc file: %s / %s" % (a.character, a.pose))
    cmd = [PYTHON, OBJECT_HISTORY, "snapshot", a.pose, a.render,
           "--label", label, "--note", note, "--verdict", a.verdict]
    if a.laid:
        cmd += ["--laid", a.laid]
    print("running:", " ".join(cmd))
    subprocess.run(cmd, check=True)


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                  formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    sh = sub.add_parser("sheet")
    sh.add_argument("--character", required=True)
    sh.add_argument("--pose", required=True)
    sh.add_argument("--render", action="append", required=True, dest="render")
    sh.add_argument("--refs", nargs=2, required=True, metavar=("BUST", "HEAD"))
    sh.add_argument("--out", required=True)
    sh.add_argument("--box", help="x0,y0,x1,y1 override for the figure crop")
    sh.set_defaults(func=cmd_sheet)

    fl = sub.add_parser("file")
    fl.add_argument("--character", required=True)
    fl.add_argument("--pose", required=True)
    fl.add_argument("--render", required=True)
    fl.add_argument("--verdict", required=True)
    fl.add_argument("--label")
    fl.add_argument("--note")
    fl.add_argument("--laid")
    fl.set_defaults(func=cmd_file)

    a = ap.parse_args()
    a.func(a)


if __name__ == "__main__":
    main()
