"""Create Rick's email-ready illustrated progress report for September 4, 2026."""

from __future__ import annotations

from io import BytesIO
from pathlib import Path
import hashlib

from PIL import Image
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "tmp" / "rick-report-2026-09-04" / "images"
OUT = ROOT / "output" / "pdf" / "ricks-studio-progress-and-direction-2026-09-04.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)

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
M = 42
CW = W - 2 * M
TOTAL_PAGES = 6

INK = HexColor("#20231e")
MUTED = HexColor("#65675f")
OXBLOOD = HexColor("#7f3929")
OXBLOOD_DARK = HexColor("#56271e")
CREAM = HexColor("#f3f0e6")
PAPER = HexColor("#fbfaf6")
PALE = HexColor("#e9e6dc")
SOFT = HexColor("#d5d0c2")
BLACK = HexColor("#121410")
GREEN = HexColor("#445447")

c = canvas.Canvas(str(OUT), pagesize=(W, H), pageCompression=1)
c.setTitle("Rick's Studio | Progress and Direction | September 4, 2026")
c.setAuthor("The Swinging Door")
c.setSubject("Illustrated progress report for Rick: today's room build, studio, and publication direction")
c.setKeywords("The Swinging Door, Rick, cartoon studio, progress report, newspaper")

page_no = 0
used_images: dict[str, str] = {}


def p(
    text: str,
    x: float,
    top: float,
    width: float,
    size: float = 10,
    face: str = "Body",
    color=INK,
    lead: float | None = None,
    max_h: float | None = None,
    align: int = 0,
) -> float:
    style = ParagraphStyle(
        "report",
        fontName=face,
        fontSize=size,
        leading=lead or size * 1.38,
        textColor=color,
        alignment=align,
        allowWidows=0,
        allowOrphans=0,
        spaceAfter=0,
    )
    item = Paragraph(text, style)
    _, height = item.wrap(width, H)
    if max_h is not None and height > max_h + 0.2:
        raise RuntimeError(f"Text overflow on page {page_no}: {height:.1f} > {max_h:.1f}: {text[:80]}")
    if top + height > 744:
        raise RuntimeError(f"Text entered footer on page {page_no}: {text[:80]}")
    item.drawOn(c, x, H - top - height)
    return top + height


def rule(top: float, x: float = M, width: float = CW, color=SOFT, weight: float = 0.65) -> None:
    c.setStrokeColor(color)
    c.setLineWidth(weight)
    c.line(x, H - top, x + width, H - top)


def box(x: float, top: float, width: float, height: float, fill=CREAM, stroke=None) -> None:
    c.setFillColor(fill)
    if stroke is not None:
        c.setStrokeColor(stroke)
    c.rect(x, H - top - height, width, height, fill=1, stroke=1 if stroke is not None else 0)


def label(text: str, x: float, top: float, width: float, color=OXBLOOD) -> float:
    return p(text.upper(), x, top, width, 7.7, "BodyBold", color, 10.2)


def _image_bytes(name: str, width: float, height: float, crop=None, mode="contain"):
    path = IMAGES / name
    if not path.is_file():
        raise FileNotFoundError(path)
    raw = path.read_bytes()
    used_images[name] = hashlib.sha256(raw).hexdigest()
    im = Image.open(BytesIO(raw))
    im.load()
    if crop is not None:
        left, upper, right, lower = crop
        im = im.crop(
            (
                round(im.width * left),
                round(im.height * upper),
                round(im.width * right),
                round(im.height * lower),
            )
        )
    target_ratio = width / height
    image_ratio = im.width / im.height
    if mode == "cover":
        if image_ratio > target_ratio:
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
    px_w = max(32, round(draw_w * 2.5))
    px_h = max(32, round(draw_h * 2.5))
    if im.width > px_w or im.height > px_h:
        im.thumbnail((px_w, px_h), Image.Resampling.LANCZOS)
    if im.mode != "RGB":
        im = im.convert("RGB")
    buf = BytesIO()
    im.save(buf, format="JPEG", quality=90, subsampling=0, optimize=True)
    buf.seek(0)
    return ImageReader(buf), draw_w, draw_h, buf


def picture(
    name: str,
    x: float,
    top: float,
    width: float,
    height: float,
    *,
    crop=None,
    mode="contain",
    background=PAPER,
    border=True,
) -> None:
    box(x, top, width, height, fill=background)
    reader, draw_w, draw_h, _buf = _image_bytes(name, width, height, crop=crop, mode=mode)
    dx = x + (width - draw_w) / 2
    dtop = top + (height - draw_h) / 2
    c.drawImage(reader, dx, H - dtop - draw_h, width=draw_w, height=draw_h, mask="auto")
    if border:
        c.setStrokeColor(SOFT)
        c.setLineWidth(0.55)
        c.rect(x, H - top - height, width, height, fill=0, stroke=1)


def footer(number: int) -> None:
    rule(754, color=SOFT, weight=0.55)
    c.setFillColor(MUTED)
    c.setFont("Body", 7.2)
    c.drawString(M, H - 771, "THE SWINGING DOOR  /  RICK'S STUDIO")
    c.setFont("BodyBold", 7.6)
    c.drawRightString(W - M, H - 771, f"{number:02d} / {TOTAL_PAGES:02d}")


def page(section: str, title: str, subtitle: str) -> None:
    global page_no
    if page_no:
        c.showPage()
    page_no += 1
    c.setFillColor(PAPER)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    p("THE SWINGING DOOR", M, 24, 250, 9, "DisplayBold", INK, 11)
    p("SEPTEMBER 4, 2026", W - 190, 26, 148, 7.5, "BodyBold", MUTED, 9, align=2)
    rule(48, color=INK, weight=0.8)
    label(section, M, 65, CW)
    bottom = p(title, M, 83, CW, 25, "DisplayBold", INK, 30, max_h=64)
    p(subtitle, M, bottom + 9, CW, 9.8, "Body", MUTED, 13.5, max_h=48)
    footer(page_no)


def small_number(value: str, caption: str, x: float, top: float, width: float) -> None:
    p(value, x, top, width, 23, "DisplayBold", INK, 25)
    p(caption, x, top + 28, width, 8.2, "Body", MUTED, 10.5, max_h=25)


def step(number: str, title: str, body: str, x: float, top: float, width: float) -> float:
    c.setFillColor(OXBLOOD)
    c.circle(x + 10, H - top - 10, 10, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("BodyBold", 7.4)
    c.drawCentredString(x + 10, H - top - 12.7, number)
    p(title, x + 29, top - 1, width - 29, 9.7, "BodyBold", INK, 12, max_h=26)
    bottom = p(body, x + 29, top + 15, width - 29, 8.6, "Body", MUTED, 11.7, max_h=38)
    return max(bottom + 11, top + 51)


# Page 1: concise cover letter and a real snapshot of the current room.
page("Progress & direction / prepared for Rick", "The room is becoming a system.",
     "A clear record of what moved forward today, what the current drawing proves, and what we should improve next.")
picture("09-current-assembled-room.png", M, 163, 294, 441, background=white)
label("Today's assembled room", M, 614, 294)
p("Working study, captured this afternoon. The room is assembled; the bottles and cast are being held back.",
  M, 633, 294, 8.7, color=MUTED, lead=11.8, max_h=38)

rx, rw = 360, 210
box(rx, 163, rw, 55, fill=OXBLOOD_DARK)
p("REVIEW COPY", rx + 13, 175, rw - 26, 8, "BodyBold", white, 10)
p("The room is not approved yet.", rx + 13, 192, rw - 26, 9.1, "Body", white, 12)
p("Rick, today the project moved from whole-picture experiments into a working piece-by-piece build. The viewpoint, room, lighting and each major object can now be handled separately.",
  rx, 239, rw, 10.2, lead=14.4, max_h=93)
rule(343, rx, rw)
label("What changed", rx, 360, rw)
y = 382
for title, body in (
    ("Measured first", "The construction and lighting plans now guide the image before detail is added."),
    ("Built in pieces", "Shelves, fixtures, street, counter and chairs can be replaced one at a time."),
    ("New York is outside", "A modern street, hot-dog cart and indistinct people now sit behind the window."),
):
    y = p(title, rx, y, rw, 10.1, "BodyBold", INK, 12) + 3
    y = p(body, rx, y, rw, 8.9, "Body", MUTED, 12.1, max_h=40) + 13
box(rx, 565, rw, 97, fill=CREAM)
p("<b>The decision now:</b> settle the wall, window and bar as one believable room. Then finish the shelves and bottles. The cast comes after the room holds together.",
  rx + 12, 578, rw - 24, 9.1, lead=12.8, max_h=71)


# Page 2: the three-stage foundation workflow.
page("Today's biggest step", "Draw it. Light it. Render it.",
     "The room now begins with fixed geometry and a shared lighting plan. That gives the local drawing process a dependable target instead of asking it to invent the architecture each time.")

cards = (
    ("01-construction-lines.png", "01  Construction", "One measured drawing fixes the wall, window, counter, furniture and every replaceable area."),
    ("02-lighting-values.png", "02  Light & shade", "A separate value study establishes the bright window, darker room and shared direction of the light."),
    ("03-rendered-architecture.png", "03  Empty room", "The room can be rendered by itself before shelves, fixtures, street, bottles or characters are accepted."),
)
for idx, (name, heading, body) in enumerate(cards):
    x = M + idx * 178
    picture(name, x, 173, 168, 252, background=white)
    label(heading, x, 440, 168)
    p(body, x, 460, 168, 8.8, lead=12.2, max_h=66)

box(M, 636, CW, 85, fill=CREAM)
label("Why this matters", M + 14, 649, CW - 28)
p("If the upper shelf needs another pass, the window and counter can stay untouched. If the lighting changes, the same plan can be carried through each piece. The method protects good work while one problem is corrected.",
  M + 14, 671, CW - 28, 9.5, lead=13.2, max_h=43)


# Page 3: actual independently controlled parts.
page("The modular build", "Built like a puzzle.",
     "Today's files show the exact direction we wanted: a stable room with separate pieces that can be reviewed, replaced and assembled again.")

picture("04-backbar-part-checkpoint.png", M, 167, 252, 166,
        crop=(0.15, 0.28, 1.0, 0.66), mode="cover", background=white)
picture("05-street-part-checkpoint.png", 318, 167, 252, 166,
        crop=(0.0, 0.28, 0.65, 0.57), mode="cover", background=white)
label("The backbar", M, 344, 252)
label("The street outside", 318, 344, 252)
p("The cabinet and two empty shelves can be replaced without redrawing the street, counter or room.",
  M, 364, 252, 8.7, lead=11.8, max_h=39)
p("The window now carries a modern building, hot-dog cart and anonymous passersby on its own layer.",
  318, 364, 252, 8.7, lead=11.8, max_h=39)
p("This is an earlier checkpoint; the outside view remains while the room pieces continue to change.",
  318, 397, 252, 7.7, "BodyItalic", MUTED, 10.4, max_h=23)

picture("07-bottles-lower-test.png", M, 430, 252, 113,
        crop=(0.18, 0.33, 0.98, 0.57), mode="cover", background=white)
picture("08-bottles-upper-test.png", 318, 430, 252, 113,
        crop=(0.18, 0.33, 0.98, 0.57), mode="cover", background=white)
label("Lower bottle-row test", M, 554, 252)
label("Upper bottle-row test", 318, 554, 252)
p("These bottle rows prove they can be rebuilt independently. Both are deliberately switched off while spacing, scale and shelf contact are corrected.",
  M, 575, CW, 9.1, lead=12.7, max_h=40)

rule(626, color=INK, weight=0.8)
small_number("14", "named room pieces", M, 642, 150)
small_number("12", "placed in today's assembly", M + 187, 642, 154)
small_number("2", "bottle rows held back", M + 378, 642, 150)


# Page 4: full assembly and candid visual review.
page("The current drawing", "Proof of the method. Still a study.",
     "The assembled room is useful because it shows both the progress and the exact problems to solve before this becomes the permanent scene.")

picture("09-current-assembled-room.png", M, 166, 300, 450, background=white)
p("Current working assembly — no cast, bottle rows held back, and still awaiting Rick's review.",
  M, 626, 300, 8.5, "BodyItalic", MUTED, 11.5, max_h=28)

rx, rw = 365, 205
label("Working now", rx, 167, rw, color=GREEN)
y = 189
for text in (
    "The wall, window, shelves, fixtures, street, counter and chairs assemble into one scene.",
    "The street stays inside the window and can be replaced on its own.",
    "The shelves can be reviewed empty before any bottles return.",
):
    y = p("• " + text, rx, y, rw, 8.8, lead=12.1, max_h=43) + 7

rule(y + 1, rx, rw)
label("What still looks wrong", rx, y + 17, rw)
y += 41
for number, text in (
    ("1", "Clean the wall/window corner and the left lamp's overlap."),
    ("2", "Soften the hard triangular lamp light, especially on the right."),
    ("3", "Unify the two chairs; their ink and tone do not match."),
    ("4", "Remove the dark/light seams around the shelf cabinet."),
    ("5", "Reduce the mechanical wall hatching and improve the window name."),
):
    y = step(number, "", text, rx, y, rw)

box(M, 684, CW, 43, fill=OXBLOOD_DARK)
p("The right order protects the picture: room first → shelves and bottles → cast → caption.",
  M + 14, 697, CW - 28, 10, "BodyBold", white, 13, max_h=22, align=1)


# Page 5: Rick's private studio and the organized archive.
page("Rick's studio", "The work now has a home.",
     "The redesigned private studio brings the archive, current room, progress reports, newspaper work and shared notes into one calm place.")

picture("studio-home.png", M, 168, 252, 193, mode="cover", background=white)
picture("studio-library.png", 318, 168, 252, 193, mode="cover", background=white)
label("A clear front door", M, 373, 252)
label("Every version in one place", 318, 373, 252)
p("The site is centered on Rick's independent cartoon studio and the work currently on the drawing board.",
  M, 393, 252, 8.7, lead=11.8, max_h=38)
p("Search, dates and cast filters make finished work, experiments and room pieces easier to inspect.",
  318, 393, 252, 8.7, lead=11.8, max_h=38)

rule(451, color=INK, weight=0.8)
small_number("1,641", "unique images available to explore", M, 466, 150)
small_number("1,926", "source files accounted for", M + 187, 466, 154)
small_number("285", "duplicate copies grouped", M + 378, 466, 150)

label("What Rick can do there", M, 543, CW)
for idx, (heading, body) in enumerate((
    ("Find the cast", "Browse Drew, Barclay, Abby and shared scenes without hunting through folders."),
    ("Follow the work", "See room studies, daily explanations and the decisions still open for review."),
    ("Shape what comes next", "Use private notes, the newspaper page and Naples topic desk as one working conversation."),
)):
    x = M + idx * 178
    box(x, 565, 168, 104, fill=CREAM)
    p(heading, x + 11, 578, 146, 10.2, "BodyBold", INK, 13, max_h=27)
    p(body, x + 11, 607, 146, 8.5, "Body", MUTED, 11.6, max_h=51)

box(M, 682, CW, 45, fill=PALE)
p("Next archive safeguard: give every new drawing its own dated version so an earlier image is never overwritten. Today's room work joins the private studio after the review set is settled.",
  M + 12, 692, CW - 24, 8.6, lead=11.6, max_h=30)


# Page 6: the publication goal and the next sequence.
page("The publication goal", "A real newspaper page is the finish line.",
     "The editorial proof shows how a finished cartoon can live beside real columns, a headline and a readable caption. The current proof uses Drew and Barclay; Abby returns only when her appearance is right.")

picture("11-newspaper-proof-duo.png", M, 167, 252, 378, background=white)
label("Editorial layout proof", M, 557, 252)
p("Drew and Barclay appear with the matching rate-hike caption. This is a design proof, not a published edition.",
  M, 577, 252, 8.7, lead=11.8, max_h=39)

rx, rw = 319, 251
label("The path from here", rx, 168, rw)
y = 191
for number, title, body in (
    ("1", "Approve the base room", "Judge the wall, window and counter together before accepting detail."),
    ("2", "Finish the shelves", "Make both cabinets logical, then rebuild and review each bottle row."),
    ("3", "Bring in the cast", "Place Drew and Barclay after the room is stable. Abby returns only with the right likeness."),
    ("4", "Choose the day's subject", "Use timely Naples financial interest as a lead, then confirm what readers respond to."),
    ("5", "Set the newspaper page", "Write a short caption, build locally on the RTX 4090, inspect closely and prepare the page."),
):
    y = step(number, title, body, rx, y, rw)

box(rx, 520, rw, 100, fill=CREAM)
label("Current Naples leads", rx + 12, 533, rw - 24)
p("Property tax  •  Home insurance  •  Mortgage rates", rx + 12, 554, rw - 24, 9.2, "BodyBold", INK, 12.5)
p("Google Trends can surface possible subjects. The correct Analytics view still needs to be connected before audience response guides the daily choice.",
  rx + 12, 578, rw - 24, 8.5, lead=11.5, max_h=37)

box(M, 648, CW, 79, fill=OXBLOOD_DARK)
p("<b>The aim:</b> a believable room, dependable characters and one clear observation that earns its place on the page.",
  M + 16, 662, CW - 32, 12.2, "Display", white, 17, max_h=46, align=1)


assert page_no == TOTAL_PAGES
c.save()

if not OUT.is_file() or OUT.stat().st_size < 100_000:
    raise RuntimeError(f"PDF was not created correctly: {OUT}")

print(f"Created {OUT}")
print(f"Pages: {page_no}")
print(f"Bytes: {OUT.stat().st_size}")
print(f"Images: {len(used_images)}")
