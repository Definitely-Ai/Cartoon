"""Per-object version archive for the room kit.

Every version of every object (chair, shelf, counter, sign...) is filed under
canon/room-kit/v2/history/<object>/ so any earlier version can be found by name
and put back. Nothing here renders, rebuilds or touches parts.json.

  object-history.py snapshot <part> <candidate.png> --label s7 --note "..." --verdict "..." [--laid <laid.png>]
  object-history.py list [<part>]
  object-history.py sheet <part>
  object-history.py restore <part> v003
  object-history.py objects            # rewrite history/OBJECTS.md
"""
import argparse, datetime, json, os, re, shutil, sys
from PIL import Image, ImageDraw, ImageFont
import numpy as np

ROOT = "Z:/ImageGenerator/Cartoon"
KIT = ROOT + "/canon/room-kit/v2"
HIST = KIT + "/history"
PAD = 0.12
SHEET_COLS, THUMB_W, LABEL_H = 4, 300, 46
HDR = ("| version | date | label | note | verdict | source path |\n"
       "| --- | --- | --- | --- | --- | --- |\n")

DESCRIPTIONS = {
    "base": "the architecture alone: ceiling, back wall, return wall, floor, crown and panelling",
    "sign": "the gilded window sign, drawn in code onto the glass by scripts/sign-on-glass.py",
}


def slug(s):
    s = re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-")
    return s or "version"


def cell(s):
    return re.sub(r"\s+", " ", (s or "").replace("|", "/")).strip()


def part_dir(part):
    d = os.path.join(HIST, part)
    os.makedirs(d, exist_ok=True)
    return d


def index_path(part):
    return os.path.join(part_dir(part), "INDEX.md")


def read_index(part):
    """Return the list of version rows recorded for this object."""
    p = index_path(part)
    rows = []
    if not os.path.exists(p):
        return rows
    for line in open(p, encoding="utf-8"):
        m = re.match(r"\|\s*(v\d+)\s*\|", line)
        if not m:
            continue
        c = [x.strip() for x in line.strip().strip("|").split("|")]
        if len(c) >= 6:
            rows.append(dict(version=c[0], date=c[1], label=c[2],
                             note=c[3], verdict=c[4], source=c[5]))
    return rows


def version_file(part, version):
    for f in sorted(os.listdir(part_dir(part))):
        if f.startswith(version + "-") and f.endswith(".png") and "-in-context" not in f:
            return os.path.join(part_dir(part), f)
    return None


def context_file(part, version):
    for f in sorted(os.listdir(part_dir(part))):
        if f.startswith(version + "-") and f.endswith("-in-context.png"):
            return os.path.join(part_dir(part), f)
    return None


def mask_bbox_frac(part, tall):
    """The object's own silhouette as (l,t,r,b) fractions of the frame."""
    mp = os.path.join(KIT, "tall", "masks", part + ".png") if tall else         os.path.join(KIT, "masks", part + ".png")
    if not os.path.exists(mp):
        mp = os.path.join(KIT, "masks", part + ".png")
    if not os.path.exists(mp):
        return None
    a = np.array(Image.open(mp).convert("L"))
    ys, xs = np.nonzero(a > 127)
    if not len(xs):
        return None
    h, w = a.shape
    return (xs.min() / w, ys.min() / h, (xs.max() + 1) / w, (ys.max() + 1) / h)


def make_context(part, src_img, out_path):
    """Crop src_img to the object's padded bbox and save it at most 900 px wide."""
    im = Image.open(src_img).convert("L")
    W, H = im.size
    tall = abs(H / W - 2100 / 1200) < abs(H / W - 1800 / 1200)
    fr = mask_bbox_frac(part, tall)
    if fr:
        l, t, r, b = fr[0] * W, fr[1] * H, fr[2] * W, fr[3] * H
        pw, ph = (r - l) * PAD, (b - t) * PAD
        box = (max(0, int(l - pw)), max(0, int(t - ph)),
               min(W, int(r + pw)), min(H, int(b + ph)))
        if box[2] - box[0] > 8 and box[3] - box[1] > 8:
            im = im.crop(box)
    if im.width > 900:
        im = im.resize((900, max(1, round(im.height * 900 / im.width))), Image.LANCZOS)
    im.save(out_path)
    return out_path


def next_version(part):
    rows = read_index(part)
    n = max([int(r["version"][1:]) for r in rows], default=0)
    return "v%03d" % (n + 1)



def _rel(p):
    """Path relative to the project where possible; absolute when it lives on another drive."""
    try:
        return os.path.relpath(p, ROOT).replace("\\", "/")
    except ValueError:
        return str(p).replace("\\", "/")

def snapshot(part, candidate, label, note, verdict, laid=None, date=None):
    if not os.path.exists(candidate):
        sys.exit("no such candidate: " + candidate)
    d = part_dir(part)
    ver = next_version(part)
    date = date or datetime.date.fromtimestamp(os.path.getmtime(candidate)).isoformat()
    stem = "%s-%s-%s" % (ver, date, slug(label))
    full = os.path.join(d, stem + ".png")
    shutil.copyfile(candidate, full)
    ctx_src = laid if (laid and os.path.exists(laid)) else (
        KIT + "/plate.png" if os.path.exists(KIT + "/plate.png") else candidate)
    make_context(part, ctx_src, os.path.join(d, stem + "-in-context.png"))
    if not os.path.exists(index_path(part)):
        desc = DESCRIPTIONS.get(part, part_note(part))
        open(index_path(part), "w", encoding="utf-8").write(
            "# %s - version history\n\n%s\n\nEvery version kept, oldest first. "
            "Put one back with `object-history.py restore %s vNNN`.\n\n%s"
            % (part, desc, part, HDR))
    with open(index_path(part), "a", encoding="utf-8") as f:
        f.write("| %s | %s | %s | %s | %s | %s |\n"
                % (ver, date, cell(label), cell(note), cell(verdict),
                   cell(_rel(candidate))))
    print("%-14s %s  %s" % (part, ver, os.path.basename(full)))
    return ver


def part_note(part):
    try:
        m = json.load(open(KIT + "/parts.json", encoding="utf-8"))
    except Exception:
        return part
    if part == "base":
        return DESCRIPTIONS["base"]
    for p in m.get("parts", []):
        if p["id"] == part:
            return p.get("note", part)
    return DESCRIPTIONS.get(part, part)


def cmd_list(part=None):
    parts = [part] if part else sorted(
        d for d in os.listdir(HIST) if os.path.isdir(os.path.join(HIST, d)))
    for p in parts:
        rows = read_index(p)
        print("\n== %s (%d versions) ==" % (p, len(rows)))
        for r in rows:
            print("  %s  %s  %-16s %-28s %s"
                  % (r["version"], r["date"], r["label"][:16],
                     r["verdict"][:28], r["note"][:70]))
        if os.path.exists(index_path(p)):
            for line in open(index_path(p), encoding="utf-8"):
                if line.startswith("- restored"):
                    print("  " + line.strip())


def _font(sz):
    for f in ("C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"):
        if os.path.exists(f):
            return ImageFont.truetype(f, sz)
    return ImageFont.load_default()


def _fit(dr, text, font, width):
    """Trim text with an ellipsis until it fits the thumbnail's width."""
    if dr.textlength(text, font=font) <= width:
        return text
    while text and dr.textlength(text + "...", font=font) > width:
        text = text[:-1]
    return text + "..."


def cmd_sheet(part):
    rows = read_index(part)
    thumbs = []
    for r in rows:
        c = context_file(part, r["version"]) or version_file(part, r["version"])
        if c:
            im = Image.open(c).convert("L")
            thumbs.append((r, im.resize((THUMB_W, max(1, round(im.height * THUMB_W / im.width))),
                                        Image.LANCZOS)))
    if not thumbs:
        print("no versions for " + part)
        return
    cols = min(SHEET_COLS, len(thumbs))
    bands = [thumbs[i:i + cols] for i in range(0, len(thumbs), cols)]
    heights = [max(im.height for _, im in b) + LABEL_H for b in bands]
    sheet = Image.new("L", (cols * (THUMB_W + 14) + 14, sum(heights) + 14 * len(bands) + 54), 255)
    dr = ImageDraw.Draw(sheet)
    f1, f2 = _font(17), _font(14)
    dr.text((14, 14), "%s - every version, oldest first" % part, 0, font=_font(24))
    y = 54
    for band, bh in zip(bands, heights):
        for i, (r, im) in enumerate(band):
            x = 14 + i * (THUMB_W + 14)
            sheet.paste(im, (x, y))
            dr.rectangle([x, y, x + THUMB_W - 1, y + im.height - 1], outline=140)
            ly = y + bh - LABEL_H + 4
            dr.text((x, ly), _fit(dr, "%s  %s" % (r["version"], r["label"]), f1, THUMB_W), 0, font=f1)
            dr.text((x, ly + 21), _fit(dr, r["verdict"], f2, THUMB_W), 90, font=f2)
        y += bh + 14
    out = os.path.join(part_dir(part), "SHEET.png")
    sheet.save(out)
    print("%-14s %d versions -> %s" % (part, len(thumbs), out))


def cmd_restore(part, version):
    src = version_file(part, version)
    if not src:
        sys.exit("no %s for %s" % (version, part))
    dst = os.path.join(KIT, "parts", part + ".png")
    if os.path.exists(dst):
        a, b = Image.open(dst).size, Image.open(src).size
        if a != b:
            print("WARNING: %s is %s but parts/%s.png is %s - check before assembling"
                  % (version, b, part, a))
    shutil.copyfile(src, dst)
    with open(index_path(part), "a", encoding="utf-8") as f:
        f.write("\n- restored %s (%s) to parts/%s.png on %s\n"
                % (version, os.path.basename(src), part, datetime.date.today().isoformat()))
    print("restored %s %s -> %s" % (part, version, dst))
    cmd_objects()


def cmd_objects():
    parts = sorted(d for d in os.listdir(HIST) if os.path.isdir(os.path.join(HIST, d)))
    out = ["# Objects in the room - where every version lives", "",
           "One folder per object under `canon/room-kit/v2/history/`. Each folder holds every",
           "version as a full-frame png, the same version cropped to the object in context,",
           "an INDEX.md of what changed and why, and SHEET.png - all versions side by side.",
           "", "Put an earlier version back with:", "",
           "    C:/Python313/python.exe Z:/ImageGenerator/Cartoon/scripts/object-history.py restore <object> vNNN",
           ""]
    for p in parts:
        rows = read_index(p)
        appr = [r for r in rows if r["verdict"].lower().startswith("approved")]
        cur = appr[-1] if appr else (rows[-1] if rows else None)
        out += ["## %s" % p, "", part_note(p), "",
                "- versions: %d" % len(rows),
                "- current: %s" % ("%s (%s, %s) - %s" % (cur["version"], cur["date"],
                                                         cur["label"], cur["verdict"])
                                   if cur else "none"),
                "- [INDEX.md](%s/INDEX.md) - [SHEET.png](%s/SHEET.png)" % (p, p), ""]
    open(os.path.join(HIST, "OBJECTS.md"), "w", encoding="utf-8").write("\n".join(out))
    print("wrote " + os.path.join(HIST, "OBJECTS.md"))


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("snapshot")
    s.add_argument("part"); s.add_argument("candidate")
    s.add_argument("--label", required=True); s.add_argument("--note", default="")
    s.add_argument("--verdict", default="candidate"); s.add_argument("--laid")
    s.add_argument("--date")
    l = sub.add_parser("list"); l.add_argument("part", nargs="?")
    h = sub.add_parser("sheet"); h.add_argument("part")
    r = sub.add_parser("restore"); r.add_argument("part"); r.add_argument("version")
    sub.add_parser("objects")
    a = ap.parse_args()
    os.makedirs(HIST, exist_ok=True)
    if a.cmd == "snapshot":
        snapshot(a.part, a.candidate, a.label, a.note, a.verdict, a.laid, a.date)
        cmd_objects()
    elif a.cmd == "list":
        cmd_list(a.part)
    elif a.cmd == "sheet":
        cmd_sheet(a.part)
    elif a.cmd == "restore":
        cmd_restore(a.part, a.version)
    else:
        cmd_objects()


if __name__ == "__main__":
    main()
