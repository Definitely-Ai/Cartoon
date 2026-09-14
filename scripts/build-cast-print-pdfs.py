"""Typeset shared cast data into four printable PDFs; never redraw art."""
import json
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public/gallery/cast-september-2026"
OUTPUT = ROOT / "output/pdf/cast-september-2026"
MEMBERS = json.loads((ROOT / "lib/cast-presentation.json").read_text(encoding="utf-8"))
OUTPUT.mkdir(parents=True, exist_ok=True)
for name, filename in [("CastSerif", "georgia.ttf"), ("CastItalic", "georgiai.ttf")]:
    pdfmetrics.registerFont(TTFont(name, str(Path("C:/Windows/Fonts") / filename)))
body_style = ParagraphStyle("body", fontName="Helvetica", fontSize=10, leading=14, textColor="black")
detail_style = ParagraphStyle("detail", parent=body_style, fontSize=9.6, leading=13)

def text_block(pdf, text, x, top, width, style=body_style, floor=57):
    para = Paragraph(text, style)
    _, height = para.wrap(width, 1000)
    if top - height < floor:
        raise ValueError(f"Text would clip: {text}")
    para.drawOn(pdf, x, top-height)
    return top-height

def page(pdf, member):
    pdf.setStrokeColorRGB(.2,.2,.2)
    pdf.setLineWidth(.7)
    pdf.line(40,752,572,752)
    pdf.line(40,749,572,749)
    pdf.setFont("Helvetica", 9)
    pdf.drawCentredString(306,730,"THE SWINGING DOOR  /  THE CAST")
    pdf.setFont("CastSerif", 43)
    pdf.drawCentredString(306,682,member["name"])
    pdf.setFont("CastItalic", 12)
    pdf.drawCentredString(306,659,member["role"])
    art = ImageReader(str(ASSETS / f'{member["id"]}.png'))
    width,height = art.getSize()
    scale = min(420/width, 438/height)
    drawn_width,drawn_height = width*scale,height*scale
    pdf.drawImage(art,(612-drawn_width)/2,208+(438-drawn_height)/2,drawn_width,drawn_height,mask="auto")
    pdf.setLineWidth(.4)
    pdf.line(40,201,572,201)
    pdf.setFont("Helvetica-Bold",10)
    pdf.drawString(40,184,member["species"])
    pdf.drawString(324,184,"Signature details")
    text_block(pdf,member["bio"],40,173,251)
    cursor = 173
    for detail in member["details"]:
        pdf.setFont("Helvetica",10)
        pdf.drawString(324,cursor-10,"-")
        cursor = text_block(pdf,detail,335,cursor,237,detail_style)-6
    pdf.line(40,47,572,47)
    pdf.setFont("CastItalic",8.6)
    pdf.drawString(40,31,member["voice"])
    pdf.setFont("Helvetica",8)
    pdf.drawRightString(572,31,"SEPTEMBER 2026")
    pdf.showPage()

for filename,members in [(f'{m["id"]}.pdf',[m]) for m in MEMBERS]+[("the-swinging-door-cast.pdf",MEMBERS)]:
    target = OUTPUT/filename
    pdf = canvas.Canvas(str(target),pagesize=(612,792),pageCompression=1)
    pdf.setTitle(f'The Swinging Door - {members[0]["name"] if len(members)==1 else "The Cast"}')
    pdf.setAuthor("AI Dream Builders LLC")
    pdf.setSubject("September 2026 character presentation portraits")
    for member in members:
        page(pdf,member)
    pdf.save()
    check = PdfReader(str(target))
    assert len(check.pages)==len(members)
    for i,member in enumerate(members):
        assert member["name"] in check.pages[i].extract_text()
        assert member["species"] in check.pages[i].extract_text()
        assert len(check.pages[i].images)==1
    (ASSETS/filename).write_bytes(target.read_bytes())
    print(json.dumps({"file":str(target),"pages":len(check.pages),"bytes":target.stat().st_size}))
