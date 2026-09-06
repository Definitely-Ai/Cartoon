"""Fill canon/room-kit/v2/history/ from what the studio has already made.

Reads every canon/room-kit/v2/work/<part>-sN.png candidate, the approved
canon/room-kit/v2/parts/<part>.png, and the sign's window crops in reports/*/images,
and files each as a version through object-history.py, taking the note and the
verdict from the matching entry in reports/2026-09-0*/REPORT.md.

  object-history-backfill.py [--dry]
Re-runnable only on an empty history/ - it appends, it does not de-duplicate.
"""
import importlib.util, os, re, sys, glob

ROOT = "Z:/ImageGenerator/Cartoon"
KIT = ROOT + "/canon/room-kit/v2"
WORK, PARTS = KIT + "/work", KIT + "/parts"
REPORTS = ROOT + "/reports"
DRY = "--dry" in sys.argv

spec = importlib.util.spec_from_file_location("oh", ROOT + "/scripts/object-history.py")
oh = importlib.util.module_from_spec(spec)
spec.loader.exec_module(oh)

OBJECTS = ["base", "cabinets", "ledge", "backbar", "shelf-lower", "shelf-upper",
           "tv", "board", "window-frame", "glass", "counter", "chair-left",
           "chair-right", "sign", "bottles-lower", "bottles-upper",
           "sconce-left", "sconce-right"]

# what each object is called in the daily reports
ALIAS = {
    "base": "base-walls-crown-floor", "cabinets": "cabinet-doors-under-ledge",
    "ledge": "bartenders-marble-ledge", "backbar": "back-bar-carcass",
    "shelf-lower": "back-bar-lower-shelf", "shelf-upper": "back-bar-upper-shelf",
    "tv": "television-blank", "board": "chalkboard-blank",
    "window-frame": "window-frame-and-reveal", "glass": "window-glass-street-view",
    "counter": "main-bar-marble-counter", "chair-left": "left-leather-club-chair",
    "chair-right": "right-leather-club-chair", "bottles-lower": "bottles-on-lower-shelf",
    "bottles-upper": "bottles-on-upper-shelf", "sconce-left": "wall-lamp-left",
    "sconce-right": "wall-lamp-right",
}
BOILER = ("the model's full-plate output", "rendered in context", "candidates side by side")


def parse_reports():
    """Every report entry as {date, num, title, ntitle, ask, thinking, settings, verdict}."""
    out = []
    for rp in sorted(glob.glob(REPORTS + "/*/REPORT.md")):
        date = os.path.basename(os.path.dirname(rp))
        text = open(rp, encoding="utf-8").read()
        for blk in text.split("\n## ")[1:]:
            head, body = blk.split("\n", 1)
            m = re.match(r"(\d+)\.\s*(.*)", head)
            if not m:
                continue
            def field(name):
                f = re.search(r"\*\*%s\*\*\s*(.*?)(?=\n\n|\n\*\*|\n\*Logged)" % name,
                              body, re.S)
                return re.sub(r"\s+", " ", f.group(1)).strip() if f else ""
            out.append(dict(date=date, num=m.group(1), title=m.group(2).strip(),
                            ntitle=oh.slug(m.group(2)), ask=field("The ask."),
                            thinking=field("The thinking."), settings=field("Settings."),
                            verdict=field("Verdict.")))
    return out


ENTRIES = parse_reports()


def seeds_in(ntitle):
    """Every seed number named in a report title - 'seed-7', 'seeds-7-and-4', '4-7-21'."""
    out = set()
    for m in re.finditer(r"seeds?-((?:\d+|and|-)+)", ntitle):
        out.update(int(x) for x in re.findall(r"\d+", m.group(1)))
    return out


def lookup(part, seed):
    """The report entries for this object at this seed, best last."""
    alias = ALIAS.get(part)
    if not alias:
        return []
    others = [a for k, a in ALIAS.items() if k != part and a != alias]
    hits = [e for e in ENTRIES if alias in e["ntitle"] and seed in seeds_in(e["ntitle"])]
    # a solo entry describes this object; one that names two objects may not
    hits.sort(key=lambda e: (bool(e["verdict"]),
                             not any(o in e["ntitle"] for o in others),
                             "laid" in e["ntitle"]))
    return hits


def clip(text, n):
    """Cut to n characters, ending on a sentence or a word, never mid-word."""
    text = text.strip()
    if len(text) <= n:
        return text
    cut = text[:n]
    dot = cut.rfind(". ")
    return (cut[:dot + 1] if dot > n * 0.4 else cut[:cut.rfind(" ")] + " ...").strip()


def note_of(part, hits, fallback):
    bits, e = [], (hits[-1] if hits else None)
    if e:
        if e["ask"]:
            bits.append("asked for: " + e["ask"])
        th = e["thinking"]
        if "Part note:" in th:
            bits.append(clip(th.split("Part note:", 1)[1], 220))
        elif th and not any(th.lower().startswith(b) for b in BOILER):
            bits.append(clip(th, 300))
    if not bits:
        bits.append(oh.part_note(part) if part != "sign" else fallback)
    if e:
        if e["settings"]:
            bits.append("settings: " + e["settings"].split(", negative")[0])
        bits.append("reports/%s #%s" % (e["date"], e["num"]))
    elif fallback not in bits:
        bits.append(fallback)
    return " - ".join(bits)


def verdict_of(hits, default="candidate", seed=None):
    for e in reversed(hits):
        v = e["verdict"]
        if not v:
            continue
        named = set(int(x) for x in re.findall(r"seeds?\s+(\d+)", v.lower()))
        if seed is not None and named and seed not in named:
            return "candidate - that entry's verdict is about seed %s: %s" % (
                "/".join(str(n) for n in sorted(named)), v)
        lv = v.lower()
        if "founder" in lv:
            return "founder: " + v
        if "approved" in lv:
            return "approved - " + v
        if "reject" in lv:
            return "rejected - " + v
        return "candidate - " + v
    return default


def snap(part, cand, label, note, verdict, laid=None, date=None):
    if DRY:
        print("%-13s %-10s %-34s %s" % (part, label, verdict[:34], note[:110]))
        return
    oh.snapshot(part, cand, label, note, verdict, laid, date)


def enabled(part):
    import json
    try:
        m = json.load(open(KIT + "/parts.json", encoding="utf-8"))
    except Exception:
        return True
    for x in m.get("parts", []):
        if x["id"] == part:
            return bool(x.get("enabled", True))
    return True


def backfill_part(part):
    cands = []
    for f in os.listdir(WORK):
        m = re.match(r"^%s-s(\d+)(-tall)?\.png$" % re.escape(part), f)
        if m:
            cands.append((int(m.group(1)), bool(m.group(2)), os.path.join(WORK, f)))
    cands.sort(key=lambda c: (os.path.getmtime(c[2]), c[0], c[1]))
    for seed, tall, path in cands:
        laid = None
        for suf in ("-laid.png", "-preview.png"):
            p = os.path.join(WORK, "%s-s%d%s" % (part, seed, suf))
            if os.path.exists(p):
                laid = p
        if tall:
            laid = path
        hits = lookup(part, seed)
        note = note_of(part, hits, "candidate from work/")
        if tall:
            note = "tall canvas 1200x2100 build (the -tall file is the part laid " \
                   "into the taller frame, not a 1200x1800 part png) - " + note
        snap(part, path, "s%d%s" % (seed, "-tall" if tall else ""), note,
             verdict_of(hits, seed=seed), laid)
    appr = os.path.join(PARTS, part + ".png")
    if os.path.exists(appr):
        hits = [e for e in ENTRIES if ALIAS.get(part, "\0") in e["ntitle"] and e["verdict"]]
        snap(part, appr, "approved", "the version standing in parts/%s.png - the source "
             "room-part.py lays for this object%s - %s"
             % (part, "" if enabled(part) else " (currently switched OFF in parts.json)",
                note_of(part, hits[-1:], "")), "approved", KIT + "/plate.png")


def backfill_sign(_part="sign"):
    imgs = []
    for p in sorted(glob.glob(REPORTS + "/*/images/*sign*.png")):
        n = os.path.basename(p)
        if "whole-plate" in n or "full-plate" in n:
            continue          # those are whole rooms, not the sign
        imgs.append((os.path.basename(os.path.dirname(os.path.dirname(p))), n, p))
    for date, name, path in imgs:
        num = name.split("-")[0]
        label = re.sub(r"^\d+-(window-close-up-|window-|comparison-sheet-)?", "", name[:-4])[:44]
        e = [x for x in ENTRIES if x["date"] == date and x["num"] == num]
        note = note_of("sign", e, "sign version from reports/%s #%s" % (date, num))
        snap("sign", path, label, note, verdict_of(e), path, date)


for o in OBJECTS:
    print("--- " + o)
    (backfill_sign if o == "sign" else backfill_part)(o)
if not DRY:
    oh.cmd_objects()
