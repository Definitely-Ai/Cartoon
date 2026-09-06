"""End-of-day report for Rick, September 5, 2026: what we did, where we are, the
little things perfected, and Monday's plan (the characters go into the scene).

    C:/Python313/python.exe scripts/build-rick-end-of-day-20260905.py [--draft]

--draft writes to tmp/pdfs/ (for the founder's approval); without it the final
goes to output/pdf/ricks-studio-end-of-day-2026-09-05.pdf. Source artwork is
frozen unchanged beside the PDF with a sha256 manifest, like the earlier reports.
"""
import argparse, hashlib, json, shutil, sys
from pathlib import Path
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph

ap = argparse.ArgumentParser(); ap.add_argument("--draft", action="store_true"); A = ap.parse_args()
ROOT = Path(__file__).resolve().parents[1]
DAY = ROOT / "reports/2026-09-05"
KIT = ROOT / "canon/room-kit/v2"
SP = Path("C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad")
WORK = ROOT / "tmp/pdfs/rick-end-of-day-20260905"; SRC = WORK / "sources"
OUT = (WORK / "DRAFT-ricks-studio-end-of-day-2026-09-05.pdf") if A.draft else (ROOT / "output/pdf/ricks-studio-end-of-day-2026-09-05.pdf")
for f in (SRC, OUT.parent): f.mkdir(parents=True, exist_ok=True)

manifest = []
def freeze(name, path):
    path = Path(path); target = SRC / name
    shutil.copyfile(path, target)
    manifest.append({"name": name, "original": str(path), "sha256": hashlib.sha256(target.read_bytes()).hexdigest()})
    return target
def report_image(number):
    m = list((DAY / "images").glob(f"{number:03d}-*.png")); assert len(m) == 1, (number, m); return m[0]

plate = freeze("plate-end-of-day.png", KIT / "plate-signed.png")
P = Image.open(plate).convert("L")
def crop(name, box):
    t = SRC / name; P.crop(box).save(t); manifest.append({"name": name, "original": "plate-end-of-day.png crop", "box": box}); return t
sign = crop("window-and-sign.png", (0, 0, 560, 1250))
corner = crop("corner-ledge-meets-wall.png", (0, 760, 640, 1240))
slabs = crop("floating-slab-back-bar.png", (400, 560, 1200, 1100))
bar = crop("marble-bar.png", (0, 1080, 1200, 1500))
screens = crop("tv-and-chalkboard.png", (380, 60, 1200, 520))
arched = freeze("before-bar-arched-end.png", report_image(112))
highlight = freeze("highlight-shelf-choice.png", report_image(161))
sweep = freeze("shelf-round3-candidates.png", report_image(158))
sillsweep = freeze("window-before-after.png", report_image(197))
history = freeze("history-sheet-counter.png", KIT / "history/counter/SHEET.png")
for n, pth in (("REPORT.md", DAY / "REPORT.md"), ("STEPS.md", DAY / "STEPS.md"), ("CAST-PLAN.md", DAY / "CAST-PLAN.md")):
    if pth.exists(): freeze(n, pth)
(WORK / "source-manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf8")

for name, fn in (("Body", "arial.ttf"), ("Bold", "arialbd.ttf"), ("Display", "georgiab.ttf")):
    pdfmetrics.registerFont(TTFont(name, str(Path("C:/Windows/Fonts") / fn)))
pdfmetrics.registerFontFamily("Body", normal="Body", bold="Bold")
W, H, M, CW = 612, 792, 36, 540
PAPER, INK, MUTED, GREEN, GOLD, RULE = [HexColor(s) for s in ("#faf7ef", "#243136", "#626864", "#365e51", "#947042", "#d5cdbd")]
c = canvas.Canvas(str(OUT), pagesize=(W, H), pageCompression=1)
c.setTitle("Rick's Studio | End of Day | September 5, 2026"); c.setAuthor("The Swinging Door")
TOTAL = 7; page = 0

def para(text, x, top, width, size=9.5, face="Body", color=MUTED, leading=None):
    q = Paragraph(text, ParagraphStyle("t", fontName=face, fontSize=size, leading=leading or size * 1.38, textColor=color))
    _, h = q.wrap(width, H); q.drawOn(c, x, H - top - h); return h
def label(text, x, top, width, color=GREEN): return para(text.upper(), x, top, width, 7.6, "Bold", color, 10)
def rule(top, x=M, w=CW): c.setStrokeColor(RULE); c.setLineWidth(.6); c.line(x, H - top, x + w, H - top)
def pic(path, x, top, w, h=None):
    im = Image.open(path); r = im.height / im.width
    h = h or w * r
    if w * r > h: w = h / r
    c.setFillColor(HexColor("#ffffff")); c.rect(x, H - top - h, w, h, stroke=0, fill=1)
    c.drawImage(ImageReader(im), x, H - top - h, w, h, preserveAspectRatio=True, anchor="c")
    c.setStrokeColor(RULE); c.rect(x, H - top - h, w, h, stroke=1, fill=0); return h
def start(section, title, sub):
    global page
    if page: c.showPage()
    page += 1
    c.setFillColor(PAPER); c.rect(0, 0, W, H, stroke=0, fill=1)
    label(section, M, 30, CW); para(title, M, 44, CW, 21, "Display", INK, 25); para(sub, M, 76, CW, 10, "Body", MUTED, 14)
    rule(100)
    c.setFont("Body", 7); c.setFillColor(MUTED); c.drawString(M, 18, "RICK'S STUDIO  /  END OF DAY  /  SEPTEMBER 5, 2026")
    c.setFont("Bold", 7); c.drawRightString(W - M, 18, f"{page:02d} / {TOTAL:02d}")

# 1 cover
start("Where we are", "The bar is in a good place", "Every piece of the room is now its own layer, perfected one at a time and approved by you. Monday the characters go into the scene.")
pic(plate, M, 112, 300, 450)
x2 = M + 318
label("Tonight's plate", x2, 112, 220)
para("The floating-slab back bar you chose, the marble bars with straight edges, the window as one pane from the bar to the crown with the mirrored sign, the bartender's ledge run clean into the window wall. Chairs and characters are out on purpose until they are recreated from the bibles.", x2, 126, 222)
label("The little things perfected today", x2, 250, 220)
for i, t in enumerate(["The arched bar end that read as a second chair back: found at the root and gone.", "The shelf unit: three designs, three rounds, yours is the floating slabs.", "No cabinets under the ledge; the ledge runs into the window wall.", "The sill and the rail under the pane: replaced by one clean line on the marble.", "The sign: Franklin Gothic, lifted clear of the hot-dog cart.", "Every object versioned, every version restorable, a desk to move layers."]):
    para("&bull; " + t, x2, 264 + i * 34, 222, 9)
label("Monday", x2, 476, 220)
para("Drew and Barclay take their chairs, recreated from their character bibles with a pose set for the captions, Abby when the joke needs her.", x2, 490, 222)

# 2 the highlight
start("Highlight of the day", "The floating-slab back bar", "Two heavy walnut slabs housed into three posts on the marble ledge, the wall's own panelling open behind and above them.")
pic(slabs, M, 112, CW, 340)
para("Three designs were drawn in code and torn apart by critics before any render: a built-in niche, a framed carcass, and these slabs. The first renders failed for a mechanical reason we then fixed for good: shadows drawn into a layer's outline reach the model as flat grey and come back as smears, so shadows are now a separate layer applied to the rendered wall. You chose the slabs at seed 7.", M, 462, CW)
pic(sweep, M, 520, CW, 200)

# 3 the bar and its edges
start("Perfected", "The marble bars and their straight edges", "What looked like a duplicate chair back on the bar was a flaw in how the parts were cut; the bar's edge now measures straight.")
pic(arched, M, 112, 262, 200); pic(bar, M + 278, 112, 262, 200)
label("Before", M, 318, 262); label("After", M + 278, 318, 262)
para("Every part's block-in used to be cut from one drawing the chairs had painted over, so the counter, the cabinets and the ledge each carried a chair back inside their own outline and drew it as bar. Each part now has its own drawing with nothing in front of it; the three were re-rendered in order and judged on a rebuilt plate by a straight-edge check: 6 pixels of deviation, down from 31. The marble's meeting with the wall and both edges of its lip are inked from the geometry after the render, so they stay straight whatever the model does.", M, 336, CW)
pic(history, M, 470, CW, 250)
label("Every version of the counter, on file", M, 726, CW)

# 4 the window, the sign, the corner
start("Perfected", "The window, the sign and the corner", "One pane from the marble to the crown, the sign readable and classy, the ledge run clean into the wall.")
pic(sign, M, 112, 200, 446); pic(corner, M + 216, 112, 324, 243)
para("Under the pane there used to be four stacked members that read as a railing, then a marble sill you disliked. Now the sash sits on the marble: one line, then stone. The bartender's ledge runs all the way into the window wall, its edge one thin square lip like the main bar's, its shadow on the panelling a layer rather than a drawn band. The sign is Franklin Gothic Medium, mirrored as you asked, lifted so DOOR clears the cart's umbrella.", M + 216, 366, 324)
pic(sillsweep, M + 216, 500, 324, 230)

# 5 the screens and the system
start("Perfected", "The screens, and how the room is built now", "Blank by design: the joke fills them. Underneath, every object is a layer you can swap, move, hide or roll back.")
pic(screens, M, 112, CW, 300)
para("The television and the chalkboard stay blank in the plate; the day's footage and chalk go in last, on measured corners. The room itself is now a kit: each object is rendered from its own construction drawing against the finished plate and laid through its own silhouette, so re-rolling one never moves another. Every candidate of every object is filed with its seed and verdict, any earlier version can be put back with one command, and a local desk lets a layer be dragged, hidden or swapped to an older version without a render. Today's full record is in the daily report, entries 088 to 197.", M, 424, CW)

# 6 the day in order
start("The day, in order", "What was asked, what was done, what came of it", "Including the misses, because that is where the rules came from.")
steps = (DAY / "STEPS.md").read_text(encoding="utf8") if (DAY / "STEPS.md").exists() else ""
import re
items = re.findall(r"^\s*\d+\.\s+(.+?)(?=^\s*\d+\.\s|\Z|^Standing rules)", steps, re.S | re.M)
top = 112
for i, it in enumerate(items[:8]):
    txt = " ".join(it.split())
    h = para(f"<b>{i + 1}.</b> " + txt, M, top, CW, 9); top += h + 8
rules = re.search(r"^Standing rules.*", steps, re.S | re.M)
if rules and top < 660:
    rule(top + 4); para(" ".join(rules.group(0).split()), M, top + 12, CW, 8.5, "Body", GREEN)

# 7 monday
start("Monday", "The characters go into the scene", "Drew and Barclay in their chairs, recreated from the bibles; Abby when the caption needs her.")
para("The three character bibles were read end to end and the plan is written. Because the local renderer draws every pixel from noise and cannot hold a face from a reference, each character is rendered in context from a posed block-in with the bust and head tile as references, and the approved head is then placed in code. Seventeen poses across the three - resting, turned to the other, speaking, reacting, looking at the television, deferring to Abby - each a layer of its own, so a caption changes who looks at whom by swapping layers, never by re-rendering. The eyes come from the bibles: knowing, human, huggable; the plumage and the fur each their own texture.", M, 112, CW)
label("Two decisions needed first", M, 236, CW)
para("&bull; Drew's bill: the master prompt calls the black a marking with a blunt cap; the bible says it is the outer third of the bill with one bright ribbon. Which wins?<br/>&bull; Drew's locked master: the manifest names the full-body sheet; the bible says the approved plates supersede the sheets. Which is the reference?", M, 250, CW)
pic(highlight, M, 330, CW, 400)
c.save()
print("wrote", OUT, "pages", page)
