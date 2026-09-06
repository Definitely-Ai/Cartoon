"""Build Rick's illustrated daily report from frozen September 3 evidence."""
from pathlib import Path
from io import BytesIO
from datetime import datetime, timezone
import json
import hashlib
from xml.sax.saxutils import escape

from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'tmp/daily-report-2026-09-03'
IMAGES = EVIDENCE / 'images'
OUT = ROOT / 'output/pdf/ricks-studio-progress-report-2026-09-03.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
ART = json.loads((EVIDENCE / 'art-audit.json').read_text(encoding='utf-8-sig'))
LIB = json.loads((ROOT / 'lib/studio-library-manifest.json').read_text(encoding='utf-8-sig'))
assert LIB['summary']['uniqueImages'] == 1641, 'Reconcile inventory before rebuilding report'

for name, filename in [('Body','arial.ttf'),('BodyBold','arialbd.ttf'),('BodyItalic','ariali.ttf'),
                       ('Display','georgia.ttf'),('DisplayBold','georgiab.ttf'),('DisplayItalic','georgiai.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(Path('C:/Windows/Fonts') / filename)))
pdfmetrics.registerFontFamily('Body', normal='Body', bold='BodyBold', italic='BodyItalic', boldItalic='BodyBold')

W, H, M = 612, 792, 44
CW = W - 2*M
INK = HexColor('#252821')
MUTED = HexColor('#62645b')
RED = HexColor('#863d2b')
RULE = HexColor('#d6d4c8')
CREAM = HexColor('#f4f2e9')
PALE = HexColor('#eaece4')
LINK = '#344f5b'
c = canvas.Canvas(str(OUT), pagesize=(W,H), pageCompression=1)
c.setTitle("Rick's Studio | Progress and Direction | September 3, 2026")
c.setAuthor('The Swinging Door')
c.setSubject('Illustrated progress report: the artwork, website improvements, creative direction and next steps')
used_images = {}
page_no = 0

def para(text, x, top, width, size=10.3, face='Body', color=INK, lead=None, max_h=None):
    st = ParagraphStyle('p', fontName=face, fontSize=size, leading=lead or size*1.42,
                        textColor=color, spaceAfter=0, allowWidows=0, allowOrphans=0)
    p = Paragraph(text, st)
    _, height = p.wrap(width, H)
    if max_h is not None and height > max_h + .1:
        raise RuntimeError(f'Overflow page {page_no}, {height}>{max_h}: {text[:70]}')
    if top+height > 738:
        raise RuntimeError(f'Content below footer on page {page_no}: {text[:70]}')
    p.drawOn(c, x, H-top-height)
    return top+height

def line(y, x=M, width=CW, color=RULE, weight=.6):
    c.setStrokeColor(color); c.setLineWidth(weight); c.line(x,H-y,x+width,H-y)

def rect(x, top, w, h, fill=CREAM, stroke=None):
    c.setFillColor(fill)
    if stroke: c.setStrokeColor(stroke)
    c.rect(x,H-top-h,w,h,fill=1,stroke=int(stroke is not None))

def label(text,x,top,width=CW,color=RED):
    return para(text.upper(),x,top,width,8.1,'BodyBold',color,10.8)

def image(name,x,top,w,h,border=True):
    path = IMAGES/name
    if not path.is_file(): raise FileNotFoundError(path)
    raw = path.read_bytes()
    used_images[name] = {'path':str(path),'sha256':hashlib.sha256(raw).hexdigest()}
    im = Image.open(BytesIO(raw)); im.load()
    ratio = min(w/im.width,h/im.height)
    dw,dh = im.width*ratio, im.height*ratio
    dx=x+(w-dw)/2; dy=top+(h-dh)/2
    # Resolution adaptation belongs to PDF embedding only; source pixels are untouched.
    if im.width > dw*2.8 or im.height > dh*2.8:
        im.thumbnail((round(dw*2.8),round(dh*2.8)),Image.Resampling.LANCZOS)
    if im.mode not in ('RGB','L'): im=im.convert('RGB')
    buf=BytesIO()
    if 'lines' in name or 'values' in name:
        im.save(buf,format='PNG')
    else:
        im.save(buf,format='JPEG',quality=91,subsampling=0)
    buf.seek(0)
    c.drawImage(ImageReader(buf),dx,H-dy-dh,width=dw,height=dh,mask='auto')
    if border:
        c.setStrokeColor(RULE);c.setLineWidth(.5);c.rect(dx,H-dy-dh,dw,dh,fill=0,stroke=1)
    return dy+dh

def page(section,title,subtitle=None):
    global page_no
    if page_no: c.showPage()
    page_no+=1
    label("The Swinging Door  /  Rick's studio",M,24,color=MUTED)
    para('SEPTEMBER 3, 2026',W-190,24,146,8.1,'BodyBold',MUTED)
    line(43)
    label(section,M,61)
    bottom=para(title,M,82,CW,26,'DisplayBold',INK,31,max_h=70)
    if subtitle: para(subtitle,M,bottom+11,CW,10.3,color=MUTED,max_h=51)
    line(751)
    c.setFillColor(MUTED);c.setFont('Body',7.1)
    c.drawString(M,H-770,'PROGRESS & DIRECTION  /  THE SWINGING DOOR')
    c.setFont('BodyBold',8);c.drawRightString(W-M,H-770,f'{page_no:02d} / 09')

def entry(title,body,x,top,width=CW):
    end=para(title,x,top,width,11.3,'BodyBold')
    return para(body,x,end+5,width,9.8,lead=13.7)+15

def link(text,url):
    return f'<link href="{escape(url, {chr(34): "&quot;"})}" color="{LINK}"><u>{escape(text)}</u></link>'

# 1. The daily decision, stated before the detail.
page('Daily progress / prepared for Rick','A place to work.\nA room worth building.'.replace('\n','<br/>'))
para('The website is now organized around Rick\'s artwork, feedback and daily progress. The drawing work is moving back to a measured bare room, so each later piece can be improved without disturbing the rest.',M,169,CW,11.4,lead=16.5)
for x,value,caption in [(M,'1,641','images brought together'),(M+180,'13','room studies to explore'),(M+360,'First','the wall, window and bar')]:
    line(237,x,164)
    para(value,x,250,160,29,'DisplayBold')
    para(caption,x,290,164,8.9,color=MUTED)
image('00-lines.png',M,329,250,262)
image('01-values.png',M+274,329,250,262)
label('Planning the room',M,603,250)
label('Planning the light and shade',M+274,603,250)
para('The latest planning drawings included in this report. The proportions and lighting are still being refined.',M,624,CW,9.2,color=MUTED)
rect(M,659,CW,66)
para('<b>The direction:</b> give Rick a clear place to see the work and shape what comes next. Perfect the room first, add the pieces carefully, then develop a dependable rhythm of topical cartoons.',M+13,671,CW-26,10.0,lead=14,max_h=47)

# 2. Actual product evidence, not mockups.
page('The website','Rick\'s working studio','The redesigned website brings the project together: earlier artwork, new studies, feedback and a clear picture of the next steps. These pictures show the working preview.')
image('studio-home.png',M,164,250,191)
image('studio-library.png',M+274,164,250,191)
para('Home: Rick\'s branding and the current drawing plan.',M,365,250,8.7,color=MUTED)
para('Library: search, cast filters, dates and image history.',M+274,365,250,8.7,color=MUTED)
left=M;right=M+274;ww=250
y=409
y=entry('The archive is easier to use','1,641 drawings, studies and earlier versions are gathered in one place. Duplicate copies are grouped, and the collection can be searched by character, type of work and date.',left,y,ww)
y=entry('Each character has a place','Drew, Barclay and Abby have their own image groups. Scenes with more than one character can appear in each relevant group, making references easier to find.',left,y,ww)
entry('A calmer, clearer design','The site is presented as Rick\'s studio. The home page leads directly to artwork, progress reports, the drawing room, newspaper ideas and shared notes.',left,y,ww)
y=409
y=entry('A clear way to catch up','Progress updates bring the pictures and explanations together: what improved, what still needs feedback, and what comes next.',right,y,ww)
y=entry('Notes stay with the conversation','Private shared notes can include an image, a topic and the writer\'s name. A note can be attached directly to the picture being discussed.',right,y,ww)
entry('Ready for a closer look','The redesigned studio is available to review. Its usual website address still shows the earlier version. The new design can be refined before it becomes the main site.',right,y,ww)

# 3. Latest files are NOT paired with an older render as a false before/after.
page('The room / current direction','Start with a room a person could build.','The first drawing needs only the wall, window and bar. Shelves, television, chalkboard, street view and characters will follow once the room itself feels right.')
image('00-lines.png',M,178,250,375)
image('01-values.png',M+274,178,250,375)
label('01  Measured construction',M,568,250)
label('02  Shared lighting plan',M+274,568,250)
para('A fixed viewpoint and real measurements guide the wall panels, window opening and counter. The angled view stays while the room\'s proportions are adjusted.',M,588,250,10.0,max_h=85)
para('A shared plan for light and shade helps every later piece belong in the same room. Each drawing still needs a close look for believable shadows and consistent pen strokes.',M+274,588,250,10.0,max_h=85)
rect(M,681,CW,46)
para('<b>Still being refined:</b> these planning drawings show the newer room arrangement. The finished-looking studies on the next page explore an earlier version of the room.',M+12,691,CW-24,9.4,lead=13,max_h=30)

# 4. Chronological material exploration.
page('Progress in the drawing','What the room studies taught us.','Earlier studies helped clarify the woodwork, marble and lighting. They show useful progress while also revealing details that need another pass.')
triples=[('01-base-strip-s5.png','Strip back the old scene','An early attempt to remove furnishings and expose the room.'),('04-panelling-s4.png','Make the woodwork believable','Wood grain follows each board, with clearer panels and supporting rails.'),('06-from-values-s1.png','Bring in light and shade','A promising study of the finishes, with counter and window details still to resolve.')]
for i,(file,title,body) in enumerate(triples):
    xx=M+i*179
    image(file,xx,177,166,251)
    para(title,xx,442,166,10.4,'BodyBold',max_h=31)
    para(body,xx,478,166,9.4,max_h=67)
line(555)
label('What still requires an artist\'s eye',M,571)
checks=[('Construction','Counter depth and support, believable window thickness, clean wall junctions and consistent panel joints.'),('Mark-making','Wood grain must follow the boards. Hatching, edge weight and fur texture must hold together at newspaper size.'),('Image cleanup','The earlier rendered candidate has faint guide lines in the window. Those are defects to remove before approval.')]
y=595
for title,body in checks:
    para(title,M,y,111,9.8,'BodyBold')
    y=para(body,M+124,y,CW-124,9.7,lead=13.1)+12

# 5. Explain the modular workflow without calling unfinished parts final.
page('The drawing approach','Build the picture in replaceable parts.','The piece-by-piece approach is being tested. The aim is to improve one shelf, window or character without accidentally changing the rest of the drawing.')
image('assembled-lit.png',M,171,231,347)
para('An earlier experiment with the furnished room shows how the pieces can work together. The room and characters still need refinement.',M,531,231,9.0,color=MUTED,max_h=66)
xx=M+254;ww=270
y=174
for title,body in [
('1. Get the bare room right','Set the angle, proportions, wall, window and counter. This becomes the dependable starting point.'),
('2. Draw each piece to fit','Build each shelf and fixture against the same room, with matching perspective, lighting and style.'),
('3. Look closely, then put it together','Check the edges and pen strokes. If one piece needs another pass, change that piece while protecting the rest.'),
('4. Bring in the cast and the joke','Place the characters once the room works. Then add a short, carefully set caption that is easy to read.')]:
    y=entry(title,body,xx,y,ww)
line(620)
label('Still to build and refine',M,636)
para('<b>Room:</b> upper shelf, lower shelf, wall corner, TV and chalkboard.<br/><b>Street:</b> modern New York, a hot-dog stand and indistinct people.<br/><b>Cast:</b> Barclay\'s head and ear, then an Abby whose appearance feels right.<br/><b>Drawing:</b> use the studio\'s own computer and RTX 4090, moving away from Replicate.',M,657,CW,9.8,lead=15.1,max_h=68)

# 6. Show today's correction in its real placement.
page('The newspaper','Drew and Barclay take the page.','The newspaper now features an existing Drew-and-Barclay cartoon with its matching caption. This lets Rick see how the work might read beside a real column of type.')
image('newspaper-proof-duo.png',M,178,321,496)
xx=M+341;ww=CW-341
y=181
y=entry('What changed','The web newspaper and downloadable 11 x 17 PDF now use a Drew-and-Barclay-only cartoon. The image, credit and caption match.',xx,y,ww)
y=entry('Getting Abby right','The unwanted version of Abby has been removed. She will return to the newspaper only when her appearance is right.',xx,y,ww)
y=entry('What this proves','The cartoon can be judged in an editorial page: column width, caption size, surrounding text and grayscale balance.',xx,y,ww)
entry('Still a layout proof','This is not an issued newspaper. Final publication needs the newspaper\'s actual column width, image resolution and grayscale specifications.',xx,y,ww)
para('<b>Barclay:</b> “I don\'t mind a rate hike. I\'d just like two years of waiting for a cut counted as time served.”',M,692,CW,10.0,'DisplayItalic',lead=14,max_h=32)

# 7. Source-separated research, not invented Naples audience metrics.
page('Naples / editorial direction','Research first. Daily cartoons later.','The long-term aim is a local financial cartoon informed by search interest and actual audience response. Today\'s work establishes a research desk, not an automatic publishing system.')
label('Google Trends: observed September 3',M,173)
para('The research used the Ft. Myers-Naples metro, Web Search, all categories, and the past 90 days. Naples-city results were insufficient. These are relative growth labels, not search-volume totals or proof of readership. Google labels growth above 5,000% “Breakout.”',M,194,CW,10.2,max_h=63)
topics=[('PROPERTY TAX','“property tax exemption florida”','+80%','A possible joke about the difference between a house\'s market, assessed and taxable values.'),('HOME INSURANCE','“home insurance quotes florida”','+50%','A possible joke about what a quote appears to promise and what the actual coverage contains.'),('MORTGAGE RATES','“what are the current mortgage rates”','Breakout','A possible joke about waiting for lower rates while an ordinary purchase cannot wait forever.')]
top=274
for labeltext,query,growth,body in topics:
    rect(M,top,CW,88)
    label(labeltext,M+12,top+10,310)
    para(growth,M+405,top+12,106,18,'DisplayBold')
    para(query,M+12,top+30,380,10,'BodyBold')
    para(body,M+12,top+49,CW-24,9.4,lead=13,max_h=29)
    top+=99
label('Learning what readers respond to',M,581)
para('Website readership information still needs to be connected through Google Analytics. Regional Google searches suggest possible subjects; they do not yet tell us what Rick\'s readers enjoy.',M,603,CW,10.2,max_h=49)
line(662)
para('<b>Future sequence:</b> save dated research → choose a relevant angle → draft a short caption → generate locally from the approved scene → inspect → prepare for publication.',M,677,CW,10.0,lead=14.5,max_h=48)

# 8. A reader-facing progress board and creative priorities.
page('Where we are going','Where we go from here.','The immediate priority is a convincing room and dependable characters. Once those are right, more time can go into the observation and the joke.')
cards=[('Ready to review','The redesigned studio, organized image library, shared notes and revised newspaper layout.'),('Still being refined','The room\'s proportions, the window corner, the bar, the light and the quality of the pen strokes.'),('Coming next','Separate shelves and fixtures, the New York street view, and more consistent character appearances.')]
for i,(title,body) in enumerate(cards):
    xx=M+i*179
    rect(xx,178,166,144)
    para(title,xx+12,192,142,12,'BodyBold',max_h=37)
    para(body,xx+12,233,142,10,lead=14.3,max_h=78)
label('The next four steps',M,352)
y=377
for title,body in [
    ('01  Finish the room','Make the wall, window and counter feel physically believable. Settle the light and the viewing angle before adding anything else.'),
    ('02  Add the pieces','Perfect each liquor shelf, then the TV, chalkboard, street scene and small details. Keep every piece easy to adjust.'),
    ('03  Settle the cast','Refine Barclay\'s head and ear, keep Drew consistent, and bring Abby in only with an appearance that works.'),
    ('04  Develop the daily rhythm','Choose relevant Naples financial stories, write a strong caption, make the drawing and review it carefully before preparing it for publication.')]:
    y=entry(title,body,M,y,CW)
rect(M,674,CW,53)
para('<b>The standard:</b> a reader should notice the characters and the joke. The room, lighting and drawing should feel natural enough to support them quietly.',M+13,686,CW-26,10.0,lead=14,max_h=35)

# 9. A friendly visual record of the studies.
page('The drawing board','Thirteen room studies.','These studies explore the room, woodwork, light and shade. Some are earlier experiments; the last two show the newer outline and lighting plan. All are work in progress.')
names=['01-base-strip-s1.png','01-base-strip-s2.png','01-base-strip-s5.png','02-base-scratch-s2.png',
       '02-base-scratch-s5.png','04-panelling-s1.png','04-panelling-s4.png','06-from-values-s1.png',
       '06-from-values-s4.png','01-values-B.png','01-values-C.png','00-lines.png','01-values.png']
study_labels=['Bare room A','Bare room B','Bare room C','Layout study A','Layout study B','Woodwork A','Woodwork B','Finish study A','Finish study B','Lighting study A','Lighting study B','Newer room outline','Newer lighting plan']
for i,name in enumerate(names):
    row,col=divmod(i,5);xx=M+col*107;yy=172+row*148
    image(name,xx,yy,96,114)
    para(study_labels[i],xx,yy+120,99,7.4,'Body',MUTED,9.5,max_h=20)
label('Explore the work',M,625)
sources=(
    link('Current studio preview','https://cartoon-hja8nhsun-definitely-ais-projects.vercel.app')+'<br/>'+
    link('Google Trends: Ft. Myers-Naples research','https://trends.google.com/trends/explore?date=today%203-m&geo=US-FL-571&q=mortgage%20rates,home%20insurance,property%20tax,retirement,stock%20market')+'  |  '+
    link('Collier property-value guide','https://www.collierappraiser.com/trim/understandtrim.html')+'<br/>'+
    'The studio preview uses the existing sign-in. This report brings together the September 3 work; the drawings will continue to evolve as details are refined.'
)
para(sources,M,647,CW,9.2,lead=13.2,max_h=88)

assert page_no==9
c.save()
record={'report':'2026-09-03','timezone':'America/New_York','createdAt':datetime.now(timezone.utc).isoformat(),
        'output':str(OUT),'pages':page_no,'bytes':OUT.stat().st_size,'sha256':hashlib.sha256(OUT.read_bytes()).hexdigest(),
        'images':used_images,'artAuditSha256':hashlib.sha256((EVIDENCE/'art-audit.json').read_bytes()).hexdigest()}
(EVIDENCE/'progress-report-manifest.json').write_text(json.dumps(record,indent=2),encoding='utf-8')
print(json.dumps({'output':str(OUT),'pages':page_no,'bytes':OUT.stat().st_size},indent=2))
