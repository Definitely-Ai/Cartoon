"""End-of-day report for Rick, September 8, 2026: how long we worked, the good
things that came out of the day, what went wrong, how we fix it, and the dated
plan that ends on the fifteenth with a working system.

    C:/Python313/python.exe scripts/build-rick-end-of-day-20260908.py [--draft]

--draft writes to tmp/pdfs/ (for the founder's approval); without it the final
goes to output/pdf/ricks-studio-end-of-day-2026-09-08.pdf. Source artwork is
frozen unchanged beside the PDF with a sha256 manifest, like the earlier
reports. Structure and typography follow build-rick-end-of-day-20260905.py.
"""
import argparse, hashlib, json, shutil
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
DAY = ROOT / "reports/2026-09-08"
WORK = ROOT / "tmp/pdfs/rick-end-of-day-20260908"; SRC = WORK / "sources"; EMB = WORK / "embedded"
OUT = (WORK / "DRAFT-ricks-studio-end-of-day-2026-09-08.pdf") if A.draft else (ROOT / "output/pdf/ricks-studio-end-of-day-2026-09-08.pdf")
for f in (SRC, EMB, OUT.parent): f.mkdir(parents=True, exist_ok=True)

manifest = []
def freeze(name, path):
    path = Path(path); target = SRC / name
    shutil.copyfile(path, target)
    manifest.append({"name": name, "original": str(path), "sha256": hashlib.sha256(target.read_bytes()).hexdigest()})
    return target
def report_image(number):
    m = sorted((DAY / "images").glob(f"{number:03d}-*.png"))
    m = [p for p in m if p.name[:4] == f"{number:03d}-"]
    assert len(m) == 1, (number, m); return m[0]

# --- the pictures the day earned -------------------------------------------
morning   = freeze("plate-this-morning.png", report_image(1))     # floating slabs, 09:42
shelf_ok  = freeze("back-bar-approved.png", report_image(12))     # the inlaid recess, approved
plate_now = freeze("plate-tonight.png", report_image(30))         # the room with the real bottles
bottles   = freeze("bottles-before-after.png", report_image(31))  # shapes -> real bottles, typeset labels
crowded   = freeze("crowded-shelf.png", report_image(44))         # twenty bottles, emblems only
allthree  = freeze("all-three-stickers.png", report_image(85))    # the patchwork, rejected
proof     = freeze("whole-scene-proof.png", report_image(114))    # one hand, all three
seated    = freeze("seated-from-behind.png", report_image(119))   # pass A seed 44, seating solved
accepted  = freeze("plate-rick-accepted.png", ROOT / "canon/plates/duo.png")
for n, pth in (("REPORT.md", DAY / "REPORT.md"), ("CAST-STATUS.md", DAY / "CAST-STATUS.md")):
    if pth.exists(): freeze(n, pth)

def crop(name, src, box):
    t = SRC / name; Image.open(src).convert("L").crop(box).save(t)
    manifest.append({"name": name, "original": Path(src).name + " crop", "box": list(box)}); return t

# the same framing as the approved shelf, cut from this morning's plate
_before = crop("back-bar-this-morning.png", morning, (260, 220, 1160, 1091))
_recess = crop("bottles-in-the-recess.png", plate_now, (455, 585, 1155, 945))
(WORK / "source-manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf8")

# --- house typography -------------------------------------------------------
for name, fn in (("Body", "arial.ttf"), ("Bold", "arialbd.ttf"), ("Display", "georgiab.ttf")):
    pdfmetrics.registerFont(TTFont(name, str(Path("C:/Windows/Fonts") / fn)))
pdfmetrics.registerFontFamily("Body", normal="Body", bold="Bold")
W, H, M, CW = 612, 792, 36, 540
PAPER, INK, MUTED, GREEN, GOLD, RULE = [HexColor(s) for s in ("#faf7ef", "#243136", "#626864", "#365e51", "#947042", "#d5cdbd")]
c = canvas.Canvas(str(OUT), pagesize=(W, H), pageCompression=1)
c.setTitle("Rick's Studio | End of Day | September 8, 2026"); c.setAuthor("The Swinging Door")
TOTAL = 11; page = 0
# Body copy is written against a 112pt baseline; OFF slides a whole page down when
# its standfirst runs to a second line, so the header rule never crowds the text.
OFF = 0

def para(text, x, top, width, size=9.5, face="Body", color=MUTED, leading=None):
    q = Paragraph(text, ParagraphStyle("t", fontName=face, fontSize=size, leading=leading or size * 1.38, textColor=color))
    _, h = q.wrap(width, H); q.drawOn(c, x, H - (top + OFF) - h); return h
def label(text, x, top, width, color=GREEN): return para(text.upper(), x, top, width, 7.6, "Bold", color, 10)
def rule(top, x=M, w=CW):
    c.setStrokeColor(RULE); c.setLineWidth(.6); c.line(x, H - (top + OFF), x + w, H - (top + OFF))
PLATE_DPI = 300          # artwork is embedded at 300 dpi of its printed size
_plates = {}
def plate(path, w):
    """A grey JPEG of `path` sized for a `w`-point-wide box, cached on disk.

    The engraved plates are 1200 x 1800 line art; embedding them whole put the
    finished PDF three times over the size of the earlier reports, which have to
    travel by e-mail. Resampling to the printed size and encoding once at high
    quality keeps the hatching clean and the file sendable."""
    key = (str(path), round(w))
    if key not in _plates:
        im = Image.open(path).convert("L")
        target = int(round(w / 72.0 * PLATE_DPI))
        if im.width > target: im = im.resize((target, int(round(target * im.height / im.width))), Image.LANCZOS)
        out = EMB / f"{Path(path).stem}-{round(w)}.jpg"
        im.save(out, "JPEG", quality=90, optimize=True)
        _plates[key] = out
    return _plates[key]
def pic(path, x, top, maxw, maxh=None):
    """Draw the picture as large as it goes inside (maxw x maxh); return (w, h)."""
    im = Image.open(path); r = im.height / im.width
    w = maxw; h = w * r
    if maxh and h > maxh: h = maxh; w = h / r
    y = H - (top + OFF) - h
    c.setFillColor(HexColor("#ffffff")); c.rect(x, y, w, h, stroke=0, fill=1)
    c.drawImage(ImageReader(str(plate(path, w))), x, y, w, h, preserveAspectRatio=True, anchor="c")
    c.setStrokeColor(RULE); c.rect(x, y, w, h, stroke=1, fill=0); return w, h
def start(section, title, sub):
    global page, OFF
    if page: c.showPage()
    page += 1
    OFF = 0
    c.setFillColor(PAPER); c.rect(0, 0, W, H, stroke=0, fill=1)
    label(section, M, 30, CW)
    th = para(title, M, 44, CW, 21, "Display", INK, 25)
    sub_top = 44 + th + 8
    sh = para(sub, M, sub_top, CW, 10, "Body", MUTED, 14)
    line = sub_top + sh + 12
    rule(line)
    c.setFont("Body", 7); c.setFillColor(MUTED); c.drawString(M, 18, "RICK'S STUDIO  /  END OF DAY  /  SEPTEMBER 8, 2026")
    c.setFont("Bold", 7); c.drawRightString(W - M, 18, f"{page:02d} / {TOTAL:02d}")
    OFF = max(0, round(line + 14 - 112))

# 1 cover -------------------------------------------------------------------
start("End of day", "The bar is built. Tonight we sat down in it.",
      "Thirteen hours today. The shelves went in and were approved, the bottles are nearly right, and for the first time the three of them were in the room together.")
pic(plate_now, M, 112, 326, 489)
x2 = M + 344
label("The room tonight", x2, 112, 196)
para("The back bar is now cut into the wall - two shelves in a recess above the bartender's ledge, with the wall's own panelling running on untouched around it. The bottles have real shapes, real fill levels and labels set by hand. The window, the street and the gilded sign are drawn in code, so they never wander.", x2, 126, 196)
label("Today, in short", x2, 260, 196)
for i, t in enumerate([
    "The inlaid back bar: designed, drawn, approved first time.",
    "The bottles rebuilt twice over.",
    "All three in the room together for the first time.",
    "That version rejected, and rightly: a collage, not a drawing.",
    "The rethink: one hand draws the whole plate.",
    "Both gentlemen seated in their own chairs, seen from behind.",
]):
    para("&bull; " + t, x2, 274 + i * 30, 196, 9)
label("The aim", x2, 462, 196)
para("A complete working system by Monday the fifteenth: a caption goes in one end and a finished cartoon comes out the other - funny, with a real idea underneath, and detail worth looking at twice.", x2, 476, 196)
rule(566, x2, 196)
para("One hundred and seventy-three pictures were made and judged today, every one of them written down.", x2, 576, 196, 9, "Body", GREEN)

# 2 how long we worked --------------------------------------------------------
start("How long we worked", "Thirteen hours today, six days on this room",
      "The studio keeps a diary. Every picture is logged as it happens, with what was asked for, what we were thinking, and what we made of the result.")
label("Today", M, 112, 300)
para("Work started at twenty to ten this morning and the last picture was logged at ten to eleven tonight - thirteen hours, near enough without a break. A hundred and seventy-three pictures were made and judged in that time, and eight batches of finished work were put away for good.", M, 126, 300)
label("The week", M, 226, 300)
para("This room has been in the works since the second of September. The plates came first. Then the room was taken apart and rebuilt in code, so that every piece of it - the counter, the ledge, the window, the corner, the lamps - could be perfected on its own and put back without disturbing anything else. Four full working days are written up that way: the fourth, the fifth, the sixth and today. Six hundred and thirty-eight pictures in all.", M, 240, 300)
top = 388
for k, v in (("Today", "09:42 to 22:51 &mdash; thirteen hours"),
             ("Pictures made and judged today", "173"),
             ("Days logged on this room", "four (4th, 5th, 6th, 8th September)"),
             ("Pictures this week", "638"),
             ("Approved and put away today", "the back bar, its two shelves, both rows of bottles")):
    rule(top - 4, M, 300)
    para(k, M, top + 2, 170, 8.5, "Bold", INK)
    para(v, M + 176, top + 2, 124, 8.5, "Body", MUTED)
    top += 32
rule(top - 4, M, 300)
pic(accepted, M + 316, 112, 224)
label("The plate you accepted", M + 316, 452, 224)
para("Everything drawn tonight was scored against this: the two of them seated at the bar, seen from behind, one engraved hand throughout. It is the target, not an ambition.", M + 316, 466, 224, 9)

# 3 the good: the back bar ---------------------------------------------------
start("The good", "The back bar, cut into the wall",
      "Two shelves in a recess in the panelling, with the drinks ledge running underneath. Designed in the morning, drawn once, approved.")
pic(_before, M, 112, 240); pic(shelf_ok, M + 300, 112, 240)
label("This morning", M, 358, 240); label("Approved by lunchtime", M + 300, 358, 240)
para("Until this morning the bottles stood on two slabs hung on the wall. The note was for something inlaid instead - two rows of bottles set into the wall, with room to make a drink underneath, and the wall's own look left alone. Two designs were drawn and pulled apart by critics before a single picture was made. The one we kept cuts a plain opening into the panelling with one flat band lying flush in the wall, lines the inside with quiet vertical boards a shade darker than the room, stands two rows of bottles in it, and lets the panelling run on untouched down to the marble. It went in first time. The verdict in the studio was short: I love those shelves.", M, 378, CW)
pic(_recess, M + 50, 470, 440)
label("The recess, close up", M + 50, 704, 440)

# 4 the good: the bottles ----------------------------------------------------
start("The good", "Real bottles, and then a real bar",
      "Eight true silhouettes at their true sizes, filled to the shoulder, with the lettering set afterwards by hand. Then twenty of them, crowded, with no names at all.")
pic(bottles, M + 30, 112, 480)
label("Left: this morning. Right: rebuilt - real shapes, fill lines, labels set in type", M + 30, 322, 480)
para("The first bottles were shapes in a row. They are now stocked the way a bar is stocked: square bourbon, round-shouldered scotch, squat rum, a gin flask, a decanter, a slim vodka. Each is filled between a little over half and three-quarters, and the fill line is built as a real step in the glass with an ink line on top - the version before came back dark to the shoulder on every bottle. The labels are set in type afterwards, onto the paper the drawing actually made, because lettering left to a machine comes back as scribble.", M, 340, CW, 9)
pic(crowded, M + 30, 428, 480)
label("Left: the typeset names. Right: twenty bottles, no names, emblems only", M + 30, 620, 480)
para("Then the note that a real bar does not carry fourteen matching bottles with clever names on them. So the shelf was crowded: twenty bottles, eleven below and nine above, shoulder to shoulder with uneven gaps, from a squat rum to a tall slim vodka, the dark glass properly darker than the lining. The names came off and a small emblem went on each label instead - a crest, an anchor, a stag - none used twice.", M, 638, CW, 9)
para("This version did not survive the evening: beside the characters the emblems read as stamped on rather than drawn, and the shelf went back on the bench. Redrawing it is the first job of tomorrow, and it is running as this report is written.", M, 712, CW, 9, "Body", GREEN)

# 5 the good, and the rejection ----------------------------------------------
start("The good, and the day's worst hour", "The first time all three were in the room",
      "Drew in the left chair, Barclay in the right, Abby behind the ledge. Rejected the same evening, and rightly.")
pic(allthree, M, 112, 330, 495)
x2 = M + 348
para("Three teams worked the afternoon, one for each character. Each drew its character onto a white sheet, cut it out and laid it into the approved room like a sticker.", x2, 112, 192)
para("What that solved is real and we keep it: the seat, the pose and the size came out right on every attempt, and the room behind was never disturbed.", x2, 186, 192)
para("What it could not solve is the look. Every piece of this picture was drawn on its own and pasted in, and it shows. The bird's head belongs to a different drawing from the bird's body. The dog is not the golden retriever we own. The light on each of the three comes from a different place. It is a collage of good parts.", x2, 260, 192)
label("Kept from this attempt", x2, 392, 192)
para("The measurements. Where each of the three sits, how big they are and how they turn to each other are now known numbers rather than guesses.", x2, 406, 192, 9)
rule(626)
para("The verdict was: one of the worst things I have ever seen - rethink your approach. That was the right call, and everything good about the rest of the evening came out of it.", M, 636, CW, 10, "Body", GREEN, 14)

# 6 the whole-scene proof ----------------------------------------------------
start("The rethink", "One drawing, one hand",
      "The same room and the same three, drawn whole by the model that made the plates you already accepted.")
pic(proof, M, 112, 330, 495)
x2 = M + 348
para("The rethink took about an hour. Instead of assembling a picture out of separately drawn pieces, we hand over the approved room and the three portraits and let one hand draw the whole thing in a single pass.", x2, 112, 192)
para("This is the first attempt. All three read as themselves at once, in one pen, with real bottles on the shelf behind them and the room's layout kept. Nothing here is pasted in.", x2, 208, 192)
para("What is wrong with it is easy to say: they are lined up facing us like a photograph instead of sitting at the bar, and there is a seam across the top where the picture was set back into the plate. Both are fixed by the next pass.", x2, 292, 192)
rule(626)
para("This is why we are confident about the fifteenth. The hard part - three characters, one room, one hand, one drawing - happened tonight.", M, 636, CW, 10, "Body", GREEN, 14)

# 7 seated from behind -------------------------------------------------------
start("The good", "Sat down, and seen from behind",
      "Six more passes put the two gentlemen in their own chairs on our side of the bar - the staging of the plate you accepted, reproduced.")
pic(seated, M, 112, 330, 495)
x2 = M + 348
para("Before the drawing starts we paint a pale shape into each chair, so that whoever draws knows who sits where and how big they are.", x2, 112, 192)
para("It works. On five of six attempts both gentlemen are seated on the near side with the chair backs across their laps and their heads turned to each other. The window and the street are put back from the approved room afterwards, and the gilded sign is drawn last in code, so those two never wander.", x2, 174, 192)
para("What is still wrong is who they are. Here the heads have drifted into other birds, and the two of them have swapped clothes with each other. That is the whole of tomorrow's problem, and we know what causes it.", x2, 288, 192)
label("Where the picture stands", x2, 404, 192)
para("Seating: solved. Room, window and sign: solved. Bottles: in hand. The faces are the one real job left.", x2, 418, 192, 9)
rule(626)
para("Everything in this picture except the two heads is where it should be. That is a good place to be at the end of a hard day.", M, 636, CW, 10, "Body", GREEN, 14)

# 8 what went wrong ----------------------------------------------------------
start("What went wrong today", "Three things, plainly",
      "None of them are hidden in the diary and none of them should be hidden here.")
label("We built the picture out of pieces", M, 112, CW)
para("Most of the afternoon went on drawing each object and each character separately and pasting them together. It was the wrong idea. A picture made of pieces never reads as one drawing, however good each piece is, and the evening's rejection was fair. About four hours went that way. What we kept from them is the measurements - who sits where, at what size - and those are now doing real work.", M, 126, CW)
label("The faces drift", M, 218, CW)
para("Now that the whole picture is drawn in one pass, the characters keep sliding away from themselves: the flamingo comes back as a vulture, the retriever as a bird, the Westie as a stranger behind the bar. The reason is plain. The three of them were designed for the online service we used in August; the machine that runs here in the studio draws every picture from scratch and cannot hold a face from a photograph the same way. They have to be built again for the machine we actually use - which is now the plan rather than a surprise.", M, 232, CW)
label("We misread a pause as a crash", M, 342, CW)
para("This is the plain waste of the day. When the studio machine loads a model it has not used recently, the first picture takes ten to twenty minutes while the model is read into the graphics card; every picture after that takes about a minute. For much of the day we read that first long pause as a hung machine and restarted it - which threw the loading away and started the same long pause over again. That cost us hours in the afternoon. It is now understood: a watchdog tells a genuine hang from a slow load, and the work is grouped so a model is loaded once and used for everything it is needed for before we move on.", M, 356, CW)
rule(486)
para("The good news buried in the third one: the studio machine is not slow. Once a model is loaded, a full plate takes about a minute. Nearly all of today's waiting was a mistake of ours, not the equipment.", M, 496, CW, 10, "Body", GREEN, 14)

# 9 how we fix it -----------------------------------------------------------
start("How we fix it", "Simplify, then finish one thing at a time",
      "The direction from the studio tonight is to stop widening the work and start closing it.")
label("One: the bottles, on their own", M, 112, CW)
para("The shelf is redrawn by itself, without touching the room, the window or the two figures already seated, and it is judged against the plate you accepted rather than against our own taste. Nothing else moves until it is right and approved. That pass is running as this report is written.", M, 126, CW)
label("Two: the cast, rebuilt for this machine, one at a time", M, 210, CW)
para("Drew, Barclay and Abby were designed for a different machine. They will be drawn again for this one from their reference photographs and their written descriptions, until each is unmistakably himself on his own - the slender pale bill with its black outer third bending down, the retriever's heavy drop ear and broad muzzle, the Westie's upright ears and dark button eyes. One character at a time, each shown to you and approved before the next begins. No more running three teams at once.", M, 224, CW)
label("Three: the picture stays whole", M, 330, CW)
para("The room, the chairs, the window and the sign stay built in code, because those must be exact and must never drift between cartoons. The finished plate is then drawn in one pass, by one hand, from that room and those portraits. Code for what must be exact; one hand for everything that must look drawn. That is the whole of the simplification, and the evening proved it works.", M, 344, CW)
rule(444)
label("What that buys", M, 458, CW)
para("Changing a cartoon stops meaning a rebuild. The layout is a set of numbers - who sits where, what stands on the shelf, which way each head turns - and the drawing is one pass over those numbers. That is what makes a caption-to-cartoon pipeline possible at all.", M, 472, CW)

# 10 the plan to the fifteenth ------------------------------------------------
start("The plan", "A complete working system by the fifteenth",
      "A caption goes in at one end and a finished cartoon comes out at the other. One thing a day, each approved before the next begins.")
plan = [
    ("Tuesday 9 September", "The bottles.",
     "The shelf redrawn on its own and judged against your plate, then approved. Nothing else moves that day."),
    ("Wednesday 10 - Thursday 11", "The cast, one at a time.",
     "Drew, then Barclay, then Abby - each rebuilt for this machine from photographs and description, each shown on his own and approved before the next one starts. Two days, three characters, no parallel teams."),
    ("Friday 12 September", "The three in the room.",
     "The seating is already solved; this is the day the right three faces are in the right chairs. With it come the poses a joke needs: turned to each other, one speaking, one reacting, both looking up at the television, Abby leaning in over the ledge."),
    ("Saturday 13 - Sunday 14", "The pipeline, end to end.",
     "A caption goes in and a finished plate comes out, with the day's report and the studio desk filled in as it goes. We run a batch of real captions through it and read them cold the next morning, the way you would."),
    ("Monday 15 September", "The system.",
     "Captions in, finished cartoons out: single panel, engraved, black and white, funny on the surface, with a real idea underneath and detail worth looking at twice."),
]
top = 112
for date, head, body in plan:
    rule(top - 6)
    label(date, M, top, 150, GOLD)
    para(head, M, top + 14, 150, 11, "Display", INK, 13)
    para(body, M + 166, top, CW - 166, 9.5)
    top += 84
rule(top - 6)
para("Every day on this list ends the same way: something finished, shown to you, and either approved or done again. If a day slips you will hear it on the day it slips, not on the fifteenth.", M, top + 8, CW, 10, "Body", GREEN, 14)

# 11 closing -----------------------------------------------------------------
start("Closing", "Where that leaves us tonight",
      "The room is done and it is good. The cast is the one real piece of work left.")
para("The room is finished and it holds up: panelled walls, marble bars, the window with its street and its gilded sign, and now a proper back bar cut into the wall with real bottles on it. All of it is built in code, which means it is exact, it never drifts from one cartoon to the next, and any part of it can be put back to an earlier version if you ever prefer one.", M, 112, 300)
para("The cast is the one thing still open, and we know precisely why. They were designed for a different machine. Rebuilding them for this one is two days of honest work, not a mystery - and tonight we proved the important part, which is that this machine will draw all three of them into the room in one hand, one drawing, no seams.", M, 200, 300)
para("Today cost us four hours on an approach that had to be thrown away, and more on a pause we mistook for a crash. Both are worth knowing about, and neither changes the date.", M, 288, 300)
para("Everything above comes out of the studio's own diary for today - a hundred and seventy-three pictures, each with what was asked for, what we were thinking, and what we made of the result. It is all on file if you ever want to read the whole of it.", M, 352, 300)
rule(430, M, 300)
para("A complete working system by Monday the fifteenth, turning out funny cartoons with real meaning and real detail. That is the promise, and the plan is how it gets kept.", M, 444, 300, 10, "Body", GREEN, 14)
pic(plate_now, M + 316, 112, 224)
label("The Swinging Door, tonight", M + 316, 452, 224)
para("The room as it stands at the end of the day. Tomorrow the shelf behind the bar gets its last pass, and then the three of them come home to it.", M + 316, 466, 224, 9)

c.save()
print("wrote", OUT, "pages", page)
