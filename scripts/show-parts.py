"""The founder's per-part show: one self-contained page with, for every modular
layer of the room in lay order, the object as it stands in the plate, its version
strip, what was done to it today (from the day's REPORT.md), the reviewer's
verdict and the next step.

    C:/Python313/python.exe scripts/show-parts.py --date 2026-09-05 [--review <journal.jsonl>] [--steps STEPS.md]

Writes reports/<date>/SHOW.html (an artifact fragment: title + style + body,
images embedded as JPEG data URIs) and SHOW-images/ beside it for the PDF agent.
"""
import argparse, base64, io, json, re
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
KIT = ROOT / "canon/room-kit/v2"
HUMAN = {"base": "Base: walls, crown, ceiling, floor", "ledge": "Bartender's marble ledge", "cabinets": "Cabinets under the ledge",
         "backbar": "Back bar posts (C slab)", "shelf-lower": "Lower slab shelf", "shelf-upper": "Upper slab shelf",
         "tv": "Television, blank", "board": "Chalkboard, blank", "window-frame": "Window frame and sill",
         "glass": "Window glass and the street", "counter": "Main marble bar", "chair-left": "Left chair",
         "chair-right": "Right chair", "sign": "The sign on the glass", "figure-drew": "Drew, seated",
         "figure-barclay": "Barclay, seated", "bottles-lower": "Bottles, lower shelf", "bottles-upper": "Bottles, upper shelf",
         "sconce-left": "Wall lamp, left", "sconce-right": "Wall lamp, right"}
REVIEW_KEY = {"base": "base", "counter": "counter", "ledge": "ledge", "backbar": "shelf unit", "shelf-lower": "shelf unit",
              "shelf-upper": "shelf unit", "tv": "television", "board": "chalkboard", "window-frame": "window", "glass": "window",
              "sign": "window"}
REPORT_KEY = {"backbar": ["back-bar", "back bar", "shelf unit", "slab"], "counter": ["counter", "bar clean", "bar alone"],
              "ledge": ["ledge"], "tv": ["television", " tv"], "board": ["chalkboard"], "glass": ["street", "glass"],
              "window-frame": ["window", "sill"], "sign": ["sign"], "chair-left": ["chair"], "chair-right": ["chair"],
              "base": ["wall", "base"], "shelf-lower": ["shelf", "slab"], "shelf-upper": ["shelf", "slab"], "cabinets": ["cabinet"],
              "figure-drew": ["drew"], "figure-barclay": ["barclay"], "bottles-lower": ["bottle"], "bottles-upper": ["bottle"],
              "sconce-left": ["lamp", "sconce"], "sconce-right": ["lamp", "sconce"]}


def jpeg_uri(img: Image.Image, max_w: int = 900, q: int = 76) -> str:
    img = img.convert("L")
    if img.width > max_w:
        img = img.resize((max_w, int(img.height * max_w / img.width)), Image.LANCZOS)
    b = io.BytesIO(); img.save(b, "JPEG", quality=q, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


def crop_to_mask(plate: Image.Image, part: str) -> Image.Image | None:
    mp = KIT / "masks" / f"{part}.png"
    if not mp.exists():
        return None
    m = np.asarray(Image.open(mp).convert("L")) > 127
    if not m.any():
        return None
    ys, xs = np.nonzero(m)
    pad = int(0.12 * max(xs.max() - xs.min(), ys.max() - ys.min()))
    return plate.crop((max(0, xs.min() - pad), max(0, ys.min() - pad), min(plate.width, xs.max() + pad), min(plate.height, ys.max() + pad)))


def report_entries(report: Path, part: str) -> list[dict]:
    if not report.exists():
        return []
    out = []
    for b in re.split(r"\n(?=## )", report.read_text(encoding="utf8")):
        head = b.split("\n", 1)[0]
        if not head.startswith("## "):
            continue
        low = head.lower()
        if any(k in low for k in REPORT_KEY.get(part, [part])):
            verdict = re.search(r"\*\*Verdict:?\*\*:?\s*(.+)", b)
            out.append({"title": head.lstrip("# ").strip(), "verdict": verdict.group(1).strip() if verdict else ""})
    return out


def reviews_from(journal: Path | None) -> dict:
    got = {}
    if not journal or not journal.exists():
        return got
    for line in journal.read_text(encoding="utf8").splitlines():
        try:
            r = json.loads(line)
        except Exception:
            continue
        if r.get("type") != "result":
            continue
        res = r.get("result")
        if isinstance(res, str):
            try:
                res = json.loads(res)
            except Exception:
                continue
        if isinstance(res, dict) and "part" in res:
            got[res["part"]] = res
    return got


def esc(s: str) -> str:
    return (s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


STYLE = """
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500;6..96,700&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
:root{--paper:#EDEBE6;--ink:#1A1A1A;--pencil:#6B6965;--rule:#C9C6BF;--brass:#8F7326;--well:#E3E0D9;--proof:#F6F5F1;
 --display:'Bodoni Moda','Bodoni 72','Didot',Georgia,serif;--body:'Libre Caslon Text','Iowan Old Style',Georgia,serif;--mono:'IBM Plex Mono','Consolas',monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--paper:#151617;--ink:#E4E1DA;--pencil:#A19D95;--rule:#3B3C3E;--brass:#CFAE52;--well:#1E1F21;--proof:#0F1011}}
:root[data-theme="dark"]{--paper:#151617;--ink:#E4E1DA;--pencil:#A19D95;--rule:#3B3C3E;--brass:#CFAE52;--well:#1E1F21;--proof:#0F1011}
body{background:var(--paper);color:var(--ink);font:16px/1.55 var(--body);margin:0}
.wrap{max-width:1180px;margin:0 auto;padding:40px 24px 80px}
header{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:end;border-bottom:1px solid var(--ink);padding-bottom:18px;margin-bottom:28px}
h1{font:700 44px/1.05 var(--display);margin:0;text-wrap:balance;letter-spacing:-.01em}
.eyebrow{font:500 12px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--brass)}
.lede{max-width:62ch;color:var(--pencil);margin:10px 0 0}
.plate{display:grid;grid-template-columns:minmax(0,420px) 1fr;gap:28px;align-items:start;margin:0 0 36px}
.plate img{width:100%;border:1px solid var(--rule);background:var(--proof)}
.legend{font-size:15px}.legend dl{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;margin:0}
.legend dt{font:500 12px/1.7 var(--mono);color:var(--brass);letter-spacing:.06em}.legend dd{margin:0}
nav.layers{display:flex;flex-wrap:wrap;gap:6px 14px;font:400 13px/1.6 var(--mono);border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);padding:10px 0;margin-bottom:36px}
nav.layers a{color:var(--ink);text-decoration:none;border-bottom:1px solid transparent}nav.layers a:hover,nav.layers a:focus-visible{border-color:var(--brass);outline:none}
nav.layers a.off{color:var(--pencil)}
section.steps ol{padding-left:1.4em;max-width:78ch}section.steps li{margin:0 0 10px}
section.steps li::marker{font:500 13px var(--mono);color:var(--brass)}
section.steps .rules{border-left:3px solid var(--brass);padding:4px 0 4px 16px;color:var(--pencil);max-width:74ch;margin-top:18px}
h2{font:700 30px/1.15 var(--display);margin:0;text-wrap:balance}
section.layer{border-top:1px solid var(--ink);padding-top:16px;margin-top:44px}
.layerhead{display:flex;justify-content:space-between;align-items:baseline;gap:16px;flex-wrap:wrap}
.state{font:500 12px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;padding:6px 10px;border:1px solid var(--rule);color:var(--pencil);border-radius:2px}
.state.on{border-color:var(--brass);color:var(--brass)}
.proof{display:grid;grid-template-columns:minmax(0,380px) 1fr;gap:28px;align-items:start;margin-top:18px}
.proof figure{margin:0}.proof img{width:100%;border:1px solid var(--rule);background:var(--proof)}
figcaption{font:400 12px/1.5 var(--mono);color:var(--pencil);margin-top:6px}
h3{font:500 12px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--brass);margin:18px 0 8px}
.notes p{margin:0 0 10px;max-width:68ch}.notes ul,.notes ol{margin:0 0 8px;padding-left:1.3em;max-width:68ch}.notes li{margin:0 0 6px}
.notes .verdict{font-style:italic;color:var(--pencil)}
.strip{margin-top:18px;overflow-x:auto;background:var(--well);border:1px solid var(--rule);padding:10px}
.strip img{display:block;max-width:none;height:220px}
.empty{color:var(--pencil);font-style:italic}
@media (max-width:820px){.plate,.proof{grid-template-columns:1fr}h1{font-size:34px}}
@media (prefers-reduced-motion:no-preference){nav.layers a{transition:border-color .15s}}
</style>"""


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", required=True)
    ap.add_argument("--review", default=None)
    ap.add_argument("--steps", default=None)
    a = ap.parse_args()
    day = ROOT / "reports" / a.date
    out_dir = day / "SHOW-images"; out_dir.mkdir(parents=True, exist_ok=True)
    plate = Image.open(KIT / "plate-signed.png").convert("L")
    plate.save(out_dir / "00-plate.png")
    man = json.loads((KIT / "parts.json").read_text(encoding="utf8"))
    order = ["base"] + [p["id"] for p in man["parts"]] + ["sign"]
    enabled = {p["id"]: p.get("enabled", True) for p in man["parts"]}; enabled["base"] = True; enabled["sign"] = True
    source = {p["id"]: Path(p["source"]).name if p.get("source") else "" for p in man["parts"]}
    reviews = reviews_from(Path(a.review) if a.review else None)

    steps_html = ""
    if a.steps and Path(a.steps).exists():
        txt = Path(a.steps).read_text(encoding="utf8")
        items = re.findall(r"^\s*\d+\.\s+(.+?)(?=^\s*\d+\.\s|\Z|^Standing rules)", txt, re.S | re.M)
        rules = re.search(r"^Standing rules.*", txt, re.S | re.M)
        steps_html = "<section class=steps><div class=eyebrow>The day, in order</div><h2>What was asked, what was done, what came of it</h2><ol>" + \
            "".join(f"<li>{esc(' '.join(i.split()))}</li>" for i in items) + "</ol>" + \
            (f"<p class=rules>{esc(' '.join(rules.group(0).split()))}</p>" if rules else "") + "</section>"

    nav = "<nav class=layers>" + "".join(
        f"<a href='#{p}' class='{'' if enabled.get(p, True) else 'off'}'>{i:02d} {esc(HUMAN.get(p, p))}</a>" for i, p in enumerate(order)) + "</nav>"

    sections = []
    for i, part in enumerate(order):
        if part == "sign":
            q = json.loads((KIT / "quads.json").read_text(encoding="utf8"))["windowQuad"]
            xs = [pt[0] for pt in q]; ys = [pt[1] for pt in q]
            crop = plate.crop((max(0, int(min(xs)) - 20), max(0, int(min(ys)) - 20), int(max(xs)) + 20, int(max(ys)) + 20))
        elif part == "base":
            crop = plate
        else:
            crop = crop_to_mask(plate, part) if enabled.get(part, True) else None
        if crop is not None:
            crop.save(out_dir / f"{i:02d}-{part}-now.png")
        sheet = KIT / "history" / part / "SHEET.png"
        index = KIT / "history" / part / "INDEX.md"
        versions = sum(1 for ln in index.read_text(encoding="utf8").splitlines() if ln.startswith("| v")) if index.exists() else 0
        entries = report_entries(day / "REPORT.md", part)
        rv = next((v for k, v in reviews.items() if REVIEW_KEY.get(part, "\x00") in k.lower()), None)
        on = enabled.get(part, True)
        h = [f"<section class=layer id='{part}'><div class=eyebrow>Layer {i:02d} of {len(order) - 1}" + (f" &middot; approved {esc(source[part])}" if source.get(part) else "") + "</div>",
             f"<div class=layerhead><h2>{esc(HUMAN.get(part, part))}</h2><span class='state {'on' if on else ''}'>{'in the plate' if on else 'switched off'} &middot; {versions} versions on file</span></div>",
             "<div class=proof>"]
        if crop is not None:
            h.append(f"<figure><img src='{jpeg_uri(crop, 700)}' alt='{esc(HUMAN.get(part, part))} as it stands'><figcaption>as it stands in the plate</figcaption></figure>")
        else:
            h.append("<figure><p class=empty>Not in the plate today; its last renders are in the strip below.</p></figure>")
        h.append("<div class=notes>")
        if entries:
            h.append("<h3>Today, on this layer</h3><ol>")
            for e in entries[:8]:
                h.append(f"<li>{esc(e['title'])}" + (f" <span class=verdict>&mdash; {esc(e['verdict'])}</span>" if e["verdict"] else "") + "</li>")
            h.append("</ol>")
        if rv:
            h.append("<h3>Reviewer's verdict</h3>")
            h.append(f"<p>{esc(rv.get('state', ''))}</p>")
            if rv.get("good"):
                h.append("<p><b>Keep.</b></p><ul>" + "".join(f"<li>{esc(g)}</li>" for g in rv["good"][:3]) + "</ul>")
            h.append("<p><b>Issues.</b></p><ul>" + "".join(f"<li>{esc(x)}</li>" for x in rv.get("issues", [])[:5]) + "</ul>")
            h.append(f"<p><b>Recommendation.</b> {esc(rv.get('recommendation', ''))}</p>")
            h.append(f"<p><b>Next.</b> {esc(rv.get('nextStep', ''))}</p>")
        if not entries and not rv:
            h.append("<p class=empty>Nothing was done to this layer today.</p>")
        h.append("</div></div>")
        if sheet.exists():
            h.append(f"<div class=strip><img src='{jpeg_uri(Image.open(sheet), 1800, 68)}' alt='every version of {esc(part)}'></div>"
                     f"<figcaption>every version in order, oldest first &middot; canon/room-kit/v2/history/{part}/</figcaption>")
        h.append("</section>")
        sections.append("\n".join(h))

    on_count = sum(1 for p in order if enabled.get(p, True))
    html = f"""<title>The Swinging Door, Layer by Layer</title>{STYLE}
<div class=wrap>
<header><div><div class=eyebrow>The Swinging Door &middot; room kit v2 &middot; {a.date}</div><h1>The room, layer by layer</h1>
<p class=lede>Every object in the bar is a separate layer laid through its own silhouette, so any one can be re-rolled, moved or put back to an earlier version without touching the rest. This is each layer as it stands tonight, every version it has been through, what was done to it today and why, and the reviewer's verdict.</p></div>
<div class=legend><dl><dt>layers</dt><dd>{len(order) - 1} in lay order, {on_count} in the plate</dd><dt>renderer</dt><dd>local, RTX 4090, no paid API</dd><dt>plate</dt><dd>1200 &times; 1800, black and white</dd></dl></div></header>
<div class=plate><figure><img src='{jpeg_uri(plate, 840)}' alt='the plate as it stands'><figcaption>the plate as it stands: sill, sign, floating slabs, Drew and Barclay in the chairs</figcaption></figure>
<div class=legend><h3>How to read this page</h3><p>Layers are numbered in the order they are laid, back to front. A layer marked <em>switched off</em> is still on file with every version; it can be switched on without a render. Version strips scroll sideways. Seeds are the render's random seed; pixel figures come from the straight-edge and mask checks.</p></div></div>
{nav}
{steps_html}
{''.join(sections)}
</div>"""
    (day / "SHOW.html").write_text(html, encoding="utf8")
    print(f"wrote {day / 'SHOW.html'} ({len(html) // 1024} KB), {len(order)} layers, images in {out_dir}")


if __name__ == "__main__":
    main()
