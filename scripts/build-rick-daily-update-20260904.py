"""Build Rick's scene-focused daily studio update for September 4, 2026."""

from __future__ import annotations

from io import BytesIO
from pathlib import Path
import hashlib
import json

from PIL import Image
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "tmp" / "rick-report-update-2026-09-04"
SELECTED = EVIDENCE / "images"
SEQUENCE = EVIDENCE / "recommended-room-sequence"
SITE = EVIDENCE / "site-captures"
OUT = ROOT / "output" / "pdf" / "ricks-studio-daily-update-2026-09-04.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)

PATHS = {
    "direction": SITE / "drawing-room-direction.png",
    "lines": SELECTED / "01-construction-line-plan.png",
    "values_base": SELECTED / "02-empty-room-value-plan.png",
    "values_full": SELECTED / "03-full-scene-value-plan.png",
    "values_street": SELECTED / "04-street-window-value-plan.png",
    "base": SELECTED / "05-best-empty-room-base.png",
    "window_detail": SELECTED / "06-window-and-street-module.png",
    "ledge_detail": SELECTED / "07-marble-ledge-module.png",
    "backbar_detail": SELECTED / "08-backbar-carcass-module.png",
    "lower_detail": SELECTED / "09-lower-shelf-module.png",
    "upper_detail": SELECTED / "10-upper-shelf-module.png",
    "cabinet_detail": SELECTED / "11-cabinet-module.png",
    "tv_detail": SELECTED / "12-television-module.png",
    "board_detail": SELECTED / "13-chalkboard-module.png",
    "current": SELECTED / "14-current-assembled-room.png",
    "kit_board": SELECTED / "15-modular-room-kit-board.png",
    "stage_1": SEQUENCE / "01-bare-room.png",
    "stage_2": SEQUENCE / "02-backbar-and-empty-shelves.png",
    "stage_3": SEQUENCE / "03-screen-and-board.png",
    "stage_4": SEQUENCE / "04-window-and-new-york-view.png",
    "stage_5": SEQUENCE / "05-counter.png",
    "stage_6": SEQUENCE / "06-left-chair.png",
    "stage_7": SEQUENCE / "07-complete-working-room.png",
}

for key, path in PATHS.items():
    if not path.is_file():
        raise FileNotFoundError(f"Missing approved image {key}: {path}")

for font_name, font_file in (
    ("Body", "arial.ttf"),
    ("BodyBold", "arialbd.ttf"),
    ("BodyItalic", "ariali.ttf"),
    ("Display", "georgia.ttf"),
    ("DisplayBold", "georgiab.ttf"),
    ("DisplayItalic", "georgiai.ttf"),
):
    pdfmetrics.registerFont(TTFont(font_name, str(Path("C:/Windows/Fonts") / font_file)))

pdfmetrics.registerFontFamily(
    "Body", normal="Body", bold="BodyBold", italic="BodyItalic", boldItalic="BodyBold"
)

W, H = 612, 792
M = 36
CW = W - 2 * M
TOTAL_PAGES = 11

INK = HexColor("#1f2734")
MUTED = HexColor("#666b67")
GOLD = HexColor("#ad7b26")
GREEN = HexColor("#3f705e")
PAPER = HexColor("#f8f4e9")
PALE_GREEN = HexColor("#e6eee9")
WHITE = HexColor("#fffdf8")
RULE = HexColor("#cfc4af")

c = canvas.Canvas(str(OUT), pagesize=(W, H), pageCompression=1)
c.setTitle("Rick's Studio | Scene-Building Daily Update | September 4, 2026")
c.setAuthor("The Swinging Door")
c.setSubject("A picture-led daily update showing the room built piece by piece")
c.setKeywords("Rick, The Swinging Door, room build, scene design, daily update")

page_no = 0
used_images: dict[str, dict[str, object]] = {}


def para(text, x, top, width, size=9, face="Body", color=INK, leading=None, max_h=None, align=0):
    style = ParagraphStyle(
        "report", fontName=face, fontSize=size, leading=leading or size * 1.35,
        textColor=color, alignment=align, allowWidows=0, allowOrphans=0, spaceAfter=0,
    )
    item = Paragraph(text, style)
    _, height = item.wrap(width, H)
    if max_h is not None and height > max_h + 0.2:
        raise RuntimeError(f"Text overflow on page {page_no}: {height:.1f} > {max_h:.1f}: {text[:80]}")
    if top + height > 752:
        raise RuntimeError(f"Text entered footer on page {page_no}: {text[:80]}")
    item.drawOn(c, x, H - top - height)
    return top + height


def label(text, x, top, width, color=GREEN, align=0):
    return para(text.upper(), x, top, width, 7.4, "BodyBold", color, 9.4, align=align)


def line(top, x=M, width=CW, color=RULE, weight=0.6):
    c.setStrokeColor(color)
    c.setLineWidth(weight)
    c.line(x, H - top, x + width, H - top)


def rect(x, top, width, height, fill=WHITE, stroke=None, radius=0):
    c.setFillColor(fill)
    if stroke is not None:
        c.setStrokeColor(stroke)
    if radius:
        c.roundRect(x, H - top - height, width, height, radius, fill=1, stroke=1 if stroke else 0)
    else:
        c.rect(x, H - top - height, width, height, fill=1, stroke=1 if stroke else 0)


def _image_reader(path, width, height, mode):
    raw = path.read_bytes()
    used_images[path.relative_to(ROOT).as_posix()] = {
        "sha256": hashlib.sha256(raw).hexdigest(), "bytes": len(raw)
    }
    im = Image.open(BytesIO(raw))
    im.load()
    target_ratio = width / height
    source_ratio = im.width / im.height
    if mode == "cover":
        if source_ratio > target_ratio:
            new_width = round(im.height * target_ratio)
            left = (im.width - new_width) // 2
            im = im.crop((left, 0, left + new_width, im.height))
        else:
            new_height = round(im.width / target_ratio)
            upper = (im.height - new_height) // 2
            im = im.crop((0, upper, im.width, upper + new_height))
        draw_w, draw_h = width, height
    else:
        scale = min(width / im.width, height / im.height)
        draw_w, draw_h = im.width * scale, im.height * scale
    pixel_w = max(64, round(draw_w * 3.0))
    pixel_h = max(64, round(draw_h * 3.0))
    if im.width > pixel_w or im.height > pixel_h:
        im.thumbnail((pixel_w, pixel_h), Image.Resampling.LANCZOS)
    if im.mode != "RGB":
        background = Image.new("RGB", im.size, "white")
        if "A" in im.getbands():
            background.paste(im, mask=im.getchannel("A"))
        else:
            background.paste(im)
        im = background
    buf = BytesIO()
    im.save(buf, format="JPEG", quality=92, subsampling=0, optimize=True)
    buf.seek(0)
    return ImageReader(buf), draw_w, draw_h, buf


def picture(key, x, top, width, height, *, mode="contain", background=WHITE, border=True):
    rect(x, top, width, height, fill=background)
    reader, draw_w, draw_h, _ = _image_reader(PATHS[key], width, height, mode)
    dx = x + (width - draw_w) / 2
    dtop = top + (height - draw_h) / 2
    c.drawImage(reader, dx, H - dtop - draw_h, width=draw_w, height=draw_h, mask="auto")
    if border:
        c.setStrokeColor(RULE)
        c.setLineWidth(0.55)
        c.rect(x, H - top - height, width, height, fill=0, stroke=1)


def footer():
    line(756, color=RULE, weight=0.55)
    c.setFillColor(MUTED)
    c.setFont("Body", 7)
    c.drawString(M, H - 773, "RICK'S STUDIO  /  SCENE-BUILDING UPDATE  /  SEPTEMBER 4, 2026")
    c.setFont("BodyBold", 7.2)
    c.drawRightString(W - M, H - 773, f"{page_no:02d} / {TOTAL_PAGES:02d}")


def new_page(kicker, title, subtitle=""):
    global page_no
    if page_no:
        c.showPage()
    page_no += 1
    c.setFillColor(PAPER)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    para("THE SWINGING DOOR", M, 22, 250, 9, "DisplayBold", INK, 11)
    para("SEP 3, 5:07 PM - SEP 4, 5:07 PM ET", W - 265, 24, 229, 7.1, "BodyBold", MUTED, 9, align=2)
    line(46, color=INK, weight=0.8)
    label(kicker, M, 62, CW, color=GREEN)
    title_bottom = para(title, M, 78, CW, 23, "DisplayBold", INK, 27, max_h=58)
    if subtitle:
        para(subtitle, M, title_bottom + 7, CW, 9.3, "Body", MUTED, 12.5, max_h=38)
    footer()


def number_badge(number, x, top):
    c.setFillColor(GREEN)
    c.circle(x + 12, H - top - 12, 12, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("BodyBold", 8.2)
    c.drawCentredString(x + 12, H - top - 15, number)


def caption_card(number, heading, body, x, top, width, height):
    rect(x, top, width, height, fill=WHITE, stroke=RULE, radius=7)
    number_badge(number, x + 10, top + 11)
    para(heading, x + 48, top + 11, width - 60, 9.5, "BodyBold", INK, 11.6, max_h=25)
    para(body, x + 13, top + 45, width - 26, 8.2, "Body", MUTED, 10.8, max_h=height - 55)


# 1 - Cover
new_page(
    "Daily update for Rick",
    "I rebuilt the room as a scene we can control.",
    "Today I moved from one fragile picture to a real, repeatable build: measured room, fixed light, separate parts and one clean assembly.",
)
picture("current", M, 171, 326, 489, background=WHITE)
label("Current assembly check", M, 670, 326, color=GOLD)
para("The room is together for review. The shelves are deliberately empty while the bottle rows receive their own clean pass.", M, 689, 326, 8.4, "Body", MUTED, 11.1, max_h=38)

rx, rw = 382, 194
para("Rick, the biggest step today was control.", rx, 174, rw, 14.5, "DisplayBold", INK, 18, max_h=42)
para("I can now improve a shelf, chair, window or character without redrawing the rest of the scene. That gives us a stable room and a much better way to reach the finished cartoon.", rx, 228, rw, 9.3, "Body", MUTED, 13, max_h=94)
line(338, rx, rw, color=GOLD, weight=1.2)
for value, copy, top in (
    ("7", "clean build stages", 360),
    ("12", "active replaceable pieces", 437),
    ("20", "exact placement shapes", 514),
):
    para(value, rx, top, 58, 25, "DisplayBold", INK, 28)
    para(copy, rx + 59, top + 7, 135, 8.6, "BodyBold", MUTED, 11.3, max_h=29)
rect(rx, 600, rw, 102, fill=PALE_GREEN, radius=7)
label("Today's result", rx + 12, 613, rw - 24, color=GREEN)
para("One base room, a modern New York view, a logical back bar, two chairs and a clear order for everything that comes next.", rx + 12, 636, rw - 24, 8.4, "Body", INK, 11.5, max_h=55)


# 2 - Direction
new_page(
    "The new direction",
    "Build the room. Then bring it to life.",
    "The website now explains the same order the artwork follows: wall, window and bar first. Shelves, fixtures, cast and caption come only after the room holds together.",
)
picture("direction", M, 169, CW, 306, mode="contain", background=WHITE)
cards = (
    ("01", "Wall", "Fix the camera, corner, crown, floor and panel rhythm."),
    ("02", "Window", "Give the opening depth, glass, joinery and a believable street."),
    ("03", "Bar", "Build the cabinet run, marble ledge and two shelf levels logically."),
)
for index, (num, heading, body) in enumerate(cards):
    caption_card(num, heading, body, M + index * 181, 498, 169, 111)
rect(M, 631, CW, 85, fill=PALE_GREEN, radius=7)
para("I am treating the room like a real set.", M + 14, 646, CW - 28, 12.5, "DisplayBold", INK, 15, max_h=23)
para("Every part has one job and one place. That is what keeps the perspective, materials, lighting and pen strokes consistent while the scene develops.", M + 14, 677, CW - 28, 8.7, "Body", MUTED, 11.8, max_h=29)


# 3 - Plans
new_page(
    "Before the finished pen strokes",
    "I fixed the structure and light on paper first.",
    "These are the working drawings behind the room. They let me solve the hard decisions before asking the finished illustration to carry them.",
)
plan_cards = (
    ("lines", "1", "Measured construction", "Perspective, wall turn, floor and joinery."),
    ("values_base", "2", "Empty-room values", "One daylight direction across the bare architecture."),
    ("values_full", "3", "Full placement plan", "The complete room checked under the same light."),
    ("values_street", "4", "Street and window plan", "Modern frontage, hot dog cart and passersby."),
)
for index, (key, num, heading, body) in enumerate(plan_cards):
    row, col = divmod(index, 2)
    x = M + col * 275
    top = 166 + row * 279
    rect(x, top, 264, 263, fill=WHITE, stroke=RULE, radius=7)
    picture(key, x + 9, top + 9, 145, 218, background=WHITE, border=False)
    number_badge(num, x + 168, top + 15)
    para(heading, x + 168, top + 52, 84, 9.2, "BodyBold", INK, 11.4, max_h=35)
    para(body, x + 168, top + 100, 84, 7.8, "Body", MUTED, 10.2, max_h=64)
    label("Plan", x + 168, top + 204, 84, color=GOLD)


# 4 - Bare room
new_page(
    "Build stage 1 of 7",
    "Start with a believable empty room.",
    "The selected base holds the corner, wall panels, crown moulding and floor together before a single shelf, screen, chair or street detail is added.",
)
picture("stage_1", M, 166, 354, 531, background=WHITE)
label("The foundation", 410, 171, 166, color=GOLD)
para("A stable room gives every later piece the same camera and the same physical rules.", 410, 196, 166, 10.2, "DisplayBold", INK, 14, max_h=72)
for heading, body, top in (
    ("Corner", "The return wall turns naturally instead of collapsing into a flat seam.", 300),
    ("Joinery", "The crown and panel rails continue through the room with a consistent rhythm.", 392),
    ("Light", "Window daylight falls across the empty space before the fixtures arrive.", 484),
    ("Why it matters", "This is the part I can protect while every other item changes around it.", 576),
):
    line(top - 12, 410, 166)
    para(heading, 410, top, 166, 8.7, "BodyBold", GREEN, 10.8)
    para(body, 410, top + 22, 166, 8.1, "Body", MUTED, 10.8, max_h=52)


def two_stage_page(kicker, title, subtitle, left, right):
    new_page(kicker, title, subtitle)
    for col, (key, num, heading, body) in enumerate((left, right)):
        x = M + col * 275
        picture(key, x, 169, 264, 396, background=WHITE)
        number_badge(num, x, 582)
        para(heading, x + 36, 580, 228, 10.4, "BodyBold", INK, 12.8, max_h=30)
        para(body, x, 622, 264, 8.5, "Body", MUTED, 11.5, max_h=69)
    line(708, color=GOLD, weight=1.0)


# 5 - Stages two and three
two_stage_page(
    "Build stages 2 and 3",
    "Build the back bar, then add the quiet fixtures.",
    "The largest wall feature is assembled in a carpenter's order. The television and chalkboard arrive afterward as separate, blank pieces.",
    ("stage_2", "2", "Back bar and empty shelves", "Six lower cabinets, a marble working ledge, a walnut frame and two shelf levels establish a construction that a real person could build."),
    ("stage_3", "3", "Television and chalkboard", "Both fixtures are restrained and independent. Their size, position or content can change without touching the shelves or the wall."),
)


# 6 - Stages four and five
two_stage_page(
    "Build stages 4 and 5",
    "Open the room to modern New York, then place the counter.",
    "The street sits behind a deep window assembly. The counter then arrives as its own marble-and-walnut foreground piece.",
    ("stage_4", "4", "Window and present-day street", "The opening has a head, jamb, sill, sash and subtle glass tone. Outside are a modern building, hot dog cart and small anonymous pedestrians."),
    ("stage_5", "5", "Counter and chair positions", "The marble top and walnut front lock in first. The two open floor shapes reserve clean front-layer positions for the chairs."),
)


# 7 - Stages six and seven
two_stage_page(
    "Build stages 6 and 7",
    "Seat the room only after the architecture is stable.",
    "The chairs are the last major room pieces. This protects their scale and placement and leaves the character work for the next controlled pass.",
    ("stage_6", "6", "First chair", "The left chair fills one reserved position and tests height, distance from the counter and the amount of floor that remains visible."),
    ("stage_7", "7", "Complete working room", "The matching pair gives Drew and Barclay believable seats. This is the current clean assembly check, before bottles, cast and caption."),
)


# 8 - Modular board
new_page(
    "The new production system",
    "The room is now a kit.",
    "This is the practical breakthrough: the architecture, window, bar, fixtures and seating can be improved as individual drawings and fitted back into the same scene.",
)
picture("kit_board", M, 162, CW, 344, mode="contain", background=WHITE, border=False)
line(527, color=GOLD, weight=1.0)
for index, (value, heading, body) in enumerate((
    ("1", "architectural base", "The protected foundation."),
    ("16", "replaceable pieces", "Each can be remade alone."),
    ("20", "exact placements", "Every visible area is controlled."),
    ("12", "pieces active now", "Only reviewed parts are on."),
)):
    x = M + index * 137
    para(value, x, 548, 48, 21, "DisplayBold", INK, 24)
    para(heading, x + 45, 550, 86, 7.7, "BodyBold", GREEN, 9.8, max_h=24)
    para(body, x, 588, 126, 7.8, "Body", MUTED, 10.2, max_h=31)
rect(M, 641, CW, 74, fill=PALE_GREEN, radius=7)
para("If the upper shelf needs work, I can replace the upper shelf.", M + 14, 654, CW - 28, 11.2, "DisplayBold", INK, 14, max_h=22)
para("The wall, window, counter, chairs and every approved pen stroke around it stay intact.", M + 14, 685, CW - 28, 8.5, "Body", MUTED, 11.3, max_h=23)


def detail_grid_page(kicker, title, subtitle, items):
    new_page(kicker, title, subtitle)
    for index, (key, heading, body) in enumerate(items):
        row, col = divmod(index, 2)
        x = M + col * 275
        top = 166 + row * 276
        picture(key, x, top, 264, 205, mode="contain", background=WHITE)
        label(heading, x, top + 216, 264, color=GOLD)
        para(body, x, top + 238, 264, 8.2, "Body", MUTED, 10.8, max_h=33)


# 9 - Closeups one
detail_grid_page(
    "Piece-by-piece checks",
    "I reviewed the window and the bar as separate jobs.",
    "These close views make the perspective and materials easier to judge than a single full-room image.",
    (
        ("window_detail", "Window and street", "Modern frontage, cart, people and glass read together through the opening."),
        ("backbar_detail", "Walnut back-bar frame", "The main carcass fixes the bays before the shelf boards and bottles."),
        ("ledge_detail", "Marble working ledge", "The narrow stone surface has its own edge, weight and perspective."),
        ("cabinet_detail", "Lower cabinet run", "Raised panels and knobs align as one believable built-in unit."),
    ),
)


# 10 - Closeups two
detail_grid_page(
    "Piece-by-piece checks",
    "The shelf levels and wall fixtures stay independent.",
    "The empty spaces are intentional. Bottles, screen content and chalk marks will be added only after their supporting pieces pass review.",
    (
        ("lower_detail", "Lower shelf", "The first shelf board aligns inside the fixed walnut frame."),
        ("upper_detail", "Upper shelf", "The second level can be tuned without changing the lower one."),
        ("tv_detail", "Television", "A blank, switched-off screen keeps the current room study quiet."),
        ("board_detail", "Chalkboard", "A clean board is ready for final editorial content later."),
    ),
)


# 11 - Current position and next work
new_page(
    "Where the room stands tonight",
    "The structure is working. The refinement can now be precise.",
    "This assembly is the review checkpoint I wanted: a coherent room, a clear build order and the freedom to improve one part at a time.",
)
picture("current", M, 166, 302, 453, background=WHITE)
rx, rw = 356, 220
label("Next focus", rx, 169, rw, color=GOLD)
next_steps = (
    ("1", "Perfect both bottle rows", "Build the upper and lower rows separately and turn them on only when they look believable."),
    ("2", "Decide on the wall lights", "Keep them out unless they strengthen the room and the overall light."),
    ("3", "Bring in Drew and Barclay", "Place the cast after the room passes the full-size art review."),
    ("4", "Add caption and newspaper", "Typeset the words after the finished cartoon is locked."),
)
for index, (num, heading, body) in enumerate(next_steps):
    top = 198 + index * 103
    number_badge(num, rx, top)
    para(heading, rx + 37, top - 1, rw - 37, 9.2, "BodyBold", INK, 11.4, max_h=24)
    para(body, rx + 37, top + 25, rw - 37, 8.0, "Body", MUTED, 10.5, max_h=51)
rect(rx, 627, rw, 89, fill=GREEN, radius=7)
para("Tomorrow's work can be smaller, cleaner and easier to judge.", rx + 13, 643, rw - 26, 11.1, "DisplayBold", white, 14, max_h=47)
para("That is exactly what this new method was built to make possible.", rx + 13, 690, rw - 26, 7.9, "Body", white, 10.5, max_h=22)
label("Current assembly check - bottles, cast and caption still to come", M, 633, 302, color=GOLD)
para("The room now reads as one place even though its major features remain independently replaceable.", M, 656, 302, 8.4, "Body", MUTED, 11.2, max_h=36)


assert page_no == TOTAL_PAGES
c.save()

if not OUT.is_file() or OUT.stat().st_size < 250_000:
    raise RuntimeError(f"PDF was not created correctly: {OUT}")

manifest = {
    "output": str(OUT),
    "pages": page_no,
    "bytes": OUT.stat().st_size,
    "sha256": hashlib.sha256(OUT.read_bytes()).hexdigest(),
    "usedImages": used_images,
}
(EVIDENCE / "daily-pdf-build-manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

print(f"Created {OUT}")
print(f"Pages: {page_no}")
print(f"Bytes: {OUT.stat().st_size}")
print(f"Unique images used: {len(used_images)}")
