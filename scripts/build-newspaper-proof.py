"""An 11 x 17 editorial placement proof, not a press-approved newspaper edition."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph, Frame, KeepTogether
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT
from reportlab.lib.colors import HexColor
import shutil

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "output/pdf/newspaper-editorial-proof.pdf"
DEST.parent.mkdir(parents=True, exist_ok=True)
c = canvas.Canvas(str(DEST), pagesize=(792, 1224))
c.setTitle("The Swinging Door - Naples editorial design proof")
c.setAuthor("The Swinging Door Studio")
c.setSubject("11 x 17 inch editorial placement proof; original sample copy; not a published edition")
ink = HexColor("#151812")
c.setFillColor(ink)
c.setStrokeColor(ink)
left, right = 38, 754
def rule(y, weight=0.6):
    c.setLineWidth(weight)
    c.line(left, y, right, y)
def txt(x, y, value, face="Times-Roman", size=10):
    c.setFont(face, size)
    c.drawString(x,y,value)

rule(1183,1.6)
txt(left,1168,"THE NAPLES EDITION","Helvetica",8)
c.setFont("Helvetica",8)
c.drawRightString(right,1168,"OPINION  /  MARKETS  /  EVERYDAY LIFE")
c.setFont("Times-Bold",64)
c.drawCentredString(396,1098,"The Swinging Door")
rule(1080,1.5)
rule(1077,.45)
txt(left,1062,"Thursday, September 3, 2026","Helvetica",8)
c.setFont("Helvetica-Bold",8)
c.drawCentredString(396,1062,"OPINION & PERSPECTIVE")
c.drawRightString(right,1062,"PAGE 1")
rule(1051)
txt(left,1024,"THE EDITORIAL PAGE","Helvetica-Bold",8)
txt(left,969,"Where the headlines","Times-Bold",49)
txt(left,919,"meet the household.","Times-Bold",49)
txt(left,889,"The numbers make the news. What we make of them is another story.","Times-Italic",13)
rule(871)

body = ParagraphStyle("body",fontName="Times-Roman",fontSize=10.2,leading=14.1,alignment=TA_JUSTIFY,spaceAfter=11,textColor=ink)
heading = ParagraphStyle("heading",fontName="Times-Bold",fontSize=22,leading=22,spaceAfter=12,textColor=ink)
sub = ParagraphStyle("sub",fontName="Times-Bold",fontSize=13,leading=15,spaceBefore=8,spaceAfter=9,textColor=ink)
byline = ParagraphStyle("byline",fontName="Times-Italic",fontSize=8.5,leading=12,spaceAfter=13,textColor=ink)

left_copy = [
    (heading,"The price of paying attention"), (byline,"From the editor's desk"),
    (body,"A financial headline can travel halfway around the world before it reaches the kitchen table. By then, it has acquired a different unit of measurement: a monthly payment, an insurance renewal or the price on a familiar menu."),
    (body,"That is where this page begins. The economy is more than a chart on a screen. It is also the small calculation before a decision and the conversation that follows it."),
    (body,"In Naples, there is room for a financial cartoon that recognizes those conversations without turning every reader into an analyst. A good drawing needs an observation. A good caption leaves something for the reader to discover."),
    (sub,"A smaller stage"),
    (body,"The Swinging Door gives that conversation a room of its own. Drew supplies the dry observation. Barclay brings the bill back to human scale. Abby has heard enough of both to know when the discussion is over."),
    (body,"The bar is a setting for the joke, not its subject. The subject is the distance between an announcement and the ordinary day it eventually reaches."),
    (body,"There is no need to shout across that distance. Sometimes the quietest sentence carries furthest."),
]
right_copy = [
    (byline,"AROUND THE TABLE"),(heading,"A number is only the beginning"),
    (body,"A house can have a market value, an assessed value and a taxable value. An insurance quote can look simple until the coverage is compared. A familiar asking price can imply an unfamiliar payment."),
    (body,"Those distinctions are worth explaining. They are also fertile ground for a cartoon, provided the joke rests on the difference itself and not on somebody's misfortune."),
    (sub,"What earns a place here"),
    (body,"A specific observation. A clear visual scene. Characters with different ways of seeing the same piece of news. A line short enough to read once and interesting enough to read again."),
    (body,"The point is recognition: that slight pause when a reader realizes the person at the next stool has been doing the same arithmetic."),
    (sub,"Three seats. One conversation."),
    (body,"<b>Drew</b><br/>The measured observer.<br/><br/><b>Barclay</b><br/>The number on the receipt.<br/><br/><b>Abby</b><br/>The last word, when needed."),
]
for x, blocks in [(38,left_copy),(606,right_copy)]:
    flow = [Paragraph(value,style) for style,value in blocks]
    Frame(x,90,148,759,leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0).addFromList(flow,c)
    if flow:
        raise RuntimeError("Newspaper column overflows the page")

c.setStrokeColor(HexColor("#c6c8bb"))
c.setLineWidth(.45)
c.line(198,108,198,846)
c.line(594,108,594,846)
c.setFillColor(ink)
txt(211,832,"The Swinging Door","Times-Bold",19)
c.setFont("Helvetica",7)
c.drawRightString(581,834,"AN EDITORIAL CARTOON")
# 900-pixel archive artwork is deliberately identified as a placement proof.
c.drawImage(str(ROOT/"public/gallery/final/A01-preview.jpg"),211,353,width=370,height=462.5,mask="auto")
caption_style=ParagraphStyle("caption",fontName="Times-Italic",fontSize=15,leading=21,alignment=1,textColor=ink)
caption=Paragraph('<b>Barclay:</b> "I don\'t mind a rate hike. I\'d just like two years of waiting for a cut counted as time served."',caption_style)
_, caption_height = caption.wrapOn(c,350,70)
if caption_height > 70:
    raise RuntimeError("Newspaper caption overflows its space")
caption.drawOn(c,221,335-caption_height)
c.setFont("Helvetica",7)
c.drawCentredString(396,319-caption_height,"THE SWINGING DOOR  /  ARCHIVE ARTWORK A01")
c.setStrokeColor(ink)
c.line(234,241,558,241)
c.setFont("Times-Italic",23)
c.drawCentredString(396,207,'"The conversation is local.')
c.drawCentredString(396,180,'The absurdity travels."')
c.line(234,157,558,157)
rule(66)
txt(left,52,"THE SWINGING DOOR / NAPLES EDITORIAL DESIGN PROOF","Helvetica",6.6)
c.setFont("Helvetica",6.6)
c.drawRightString(right,52,"ORIGINAL SAMPLE COPY / NOT A PUBLISHED EDITION")
c.showPage()
c.save()
public=ROOT/"public/studio-print"
public.mkdir(parents=True,exist_ok=True)
shutil.copyfile(DEST,public/DEST.name)
print(DEST)
