"""Current bar setting showcase. Detail views use exact crops of one frozen plate."""
from pathlib import Path
from io import BytesIO
import hashlib
import json

from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / 'tmp/pdfs/rick-bar-showcase-20260904'
OUT = ROOT / 'output/pdf/ricks-studio-daily-update-2026-09-04.pdf'
CURRENT = WORK / 'current-room.png'
BASE = WORK / 'selected-base.png'
assert hashlib.sha256(CURRENT.read_bytes()).hexdigest() == '96f32aca6d84b06c725d2ea385fcdea8305d7aa35f12513860a315fba160bc53'

for name, filename in [('Body','arial.ttf'), ('Bold','arialbd.ttf'), ('Serif','georgia.ttf'), ('Display','georgiab.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(Path('C:/Windows/Fonts') / filename)))
pdfmetrics.registerFontFamily('Body', normal='Body', bold='Bold')

W,H = 612,792
M,CW = 36,540
PAPER = HexColor('#faf7ef')
INK = HexColor('#222e32')
MUTED = HexColor('#5d6563')
GREEN = HexColor('#365e51')
PALE = HexColor('#e7ede7')
GOLD = HexColor('#92713e')
RULE = HexColor('#cfc7b7')
WHITE = HexColor('#ffffff')
TOTAL=7

c=canvas.Canvas(str(OUT),pagesize=(W,H),pageCompression=1)
c.setTitle("Rick's Studio | The Bar as It Stands Today | September 4, 2026")
c.setAuthor('The Swinging Door')
c.setCreator("Rick's Studio")
c.setSubject('Current bar setting, evening chair update, furniture, shelves and architectural details')
page=0
views=[]
text_boxes=[]
source_readers={}

def p(text,x,top,width,size=9,face='Body',color=MUTED,leading=None,max_h=None):
    style=ParagraphStyle('p',fontName=face,fontSize=size,leading=leading or size*1.36,textColor=color)
    item=Paragraph(text,style)
    _,height=item.wrap(width,H)
    assert top+height<747, (page,text,top,height)
    if max_h is not None:
        assert height<=max_h+0.1, (page,text,height,max_h)
    item.drawOn(c,x,H-top-height)
    text_boxes.append({'page':page,'text':text,'bounds':[x,top,x+width,top+height]})
    return top+height

def label(text,x,top,width,color=GREEN):
    return p(text.upper(),x,top,width,7.5,'Bold',color,10)

def rule(top,x=M,width=CW,color=RULE):
    c.setStrokeColor(color)
    c.setLineWidth(0.6)
    c.line(x,H-top,x+width,H-top)

def box(x,top,w,h,color=PALE):
    c.setFillColor(color)
    c.roundRect(x,H-top-h,w,h,6,stroke=0,fill=1)

def pic(key,x,top,w,h,crop=None,source=CURRENT):
    """PDF clipping preserves source pixels and aspect ratio; no art regeneration."""
    if source not in source_readers:
        im=Image.open(source)
        im.load()
        source_readers[source]=(ImageReader(im), im.width, im.height)
    reader,iw,ih=source_readers[source]
    l,t,r,b=crop or (0,0,iw,ih)
    assert 0<=l<r<=iw and 0<=t<b<=ih, (key,crop)
    scale=min(w/(r-l), h/(b-t))
    dw,dh=(r-l)*scale,(b-t)*scale
    dx=x+(w-dw)/2
    dt=top+(h-dh)/2
    c.setFillColor(WHITE)
    c.rect(x,H-top-h,w,h,fill=1,stroke=0)
    c.saveState()
    path=c.beginPath()
    path.rect(dx,H-dt-dh,dw,dh)
    c.clipPath(path,stroke=0,fill=0)
    c.drawImage(reader,dx-l*scale,H-dt-(ih-t)*scale,width=iw*scale,height=ih*scale)
    c.restoreState()
    c.setStrokeColor(RULE)
    c.setLineWidth(.5)
    c.rect(x,H-top-h,w,h,fill=0,stroke=1)
    views.append({'page':page,'key':key,'source':source.name,'crop':[l,t,r,b],'bounds':[x,top,x+w,top+h]})

def start(section,title,subtitle):
    global page
    if page:
        c.showPage()
    page+=1
    c.setFillColor(PAPER)
    c.rect(0,0,W,H,fill=1,stroke=0)
    c.bookmarkPage('page-'+str(page))
    c.addOutlineEntry(section,'page-'+str(page),level=0)
    p('THE SWINGING DOOR',M,22,280,9,'Display',INK,11)
    p('SEPTEMBER 4, 2026  /  EVENING UPDATE',365,24,211,7.1,'Bold',MUTED,9)
    rule(46,color=INK)
    label(section,M,62,CW)
    end=p(title,M,80,CW,23,'Display',INK,27,max_h=54)
    end=p(subtitle,M,end+9,CW,9.4,'Body',MUTED,12.7,max_h=39)
    assert end<157,(page,end)
    rule(753)
    c.setFont('Body',7)
    c.setFillColor(MUTED)
    c.drawString(M,18,"RICK'S STUDIO  /  CURRENT BAR SETTING")
    c.setFont('Bold',7)
    c.setFillColor(MUTED)
    c.drawRightString(576,18,f'{page:02d} / {TOTAL:02d}')

def note(title,body,x,top,width):
    label(title,x,top,width)
    return p(body,x,top+20,width,8.6,'Body',MUTED,11.7,max_h=60)

# 1. Present-day visual checkpoint.
start('For Rick / current setting','The bar, as it stands today.',
      'The latest room study, including this evening\'s chair refinements. Here is how the setting looks now, with a closer look at the details I am building into it.')
pic('complete-current-room',M,164,350,525)
rx,rw=406,170
p('Rick, the room is taking shape.',rx,168,rw,14,'Display',INK,18,max_h=54)
p('The wall, window, shelving, counter and two chairs are now assembled in one scene. I am working through the individual pieces so the setting can become a consistent home for the cartoons.',rx,237,rw,9.3,'Body',MUTED,13,max_h=130)
rule(375,rx,rw,color=GOLD)
label('Look closer',rx,393,rw)
for index,(heading,body) in enumerate([
    ('The chairs','Curved backs, trim and turned legs.'),
    ('The bar','Marble veining, a slim edge and panelled front.'),
    ('The back wall','Two shelf levels, cabinet doors and wall fixtures.'),
    ('The street','A hot dog cart and passersby beyond the window.'),
]):
    top=419+index*58
    p(heading,rx,top,rw,9,'Bold',INK,11)
    p(body,rx,top+18,rw,8.2,'Body',MUTED,10.6,max_h=32)
label('Latest assembled study / 6:34 p.m. ET',M,702,350,color=GOLD)
p('The shelves are intentionally empty. Bottles, characters and the caption follow the room review.',M,721,CW,8.4,'Body',MUTED,11.1,max_h=24)

# 2. Chairs: contemporary pair and actual detail crops.
start('01 / seating','The chairs now have their own character.',
      'This evening\'s seating study brings the upholstery, rounded top rails, nailhead trim and turned supports into sharper focus.')
pic('current-chair-pair',M,165,CW,345,(0,1020,1200,1800))
label('Current seating study',M,522,CW,color=GOLD)
p('I can refine either chair on its own. Their final angle and scale will be checked again when the characters are placed.',M,541,CW,8.7,'Body',MUTED,11.6,max_h=25)
for i,(key,title,body,crop) in enumerate([
    ('chair-trim','Nailhead trim','A fine row follows the curved top.',(20,1030,450,1210)),
    ('chair-leather','Leather and light','Curved shading gives the back volume.',(105,1190,420,1450)),
    ('chair-supports','Turned supports','Legs and rails give the seat a base.',(65,1630,405,1800)),
]):
    x=M+i*184
    pic(key,x,582,172,94,crop)
    label(title,x,687,172)
    p(body,x,707,172,8.2,'Body',MUTED,10.7,max_h=33)

# 3. Marble and visible walnut counter details.
start('02 / the bar','Stone above. Walnut below.',
      'The bar has a pale marble surface, a narrow moulded lip and a darker panelled front. These close views show the materials where they meet.')
pic('bar-in-room',M,167,CW,173,(380,1070,840,1217))
label('The counter in the current room',M,353,CW,color=GOLD)
p('The chairs sit in front of the counter. The visible surface and central front panel establish the bar\'s material direction.',M,373,CW,8.8,'Body',MUTED,11.8,max_h=28)
pic('walnut-bar-front',M,423,196,292,(475,1235,680,1780))
label('Panelled bar front',M,726,196)
pic('marble-veining',253,423,323,107,(435,1095,680,1176))
note('Marble veining','Light, irregular veins keep the stone distinct from the wood around it.',253,541,323)
pic('slim-counter-lip',253,608,323,62,(470,1181,687,1223))
note('The counter edge','A slim layered profile gives the top a readable thickness.',253,682,323)

# 4. Shelves and cabinetry in one current-context view.
start('03 / shelves and cabinetry','The back bar is built in separate pieces.',
      'The walnut frame, two shelf boards, working ledge and lower cupboard doors are all part of the current assembly. Each can be refined independently.')
pic('current-backbar',M,166,CW,373,(350,507,1200,1094))
label('Current back-bar study / bottle rows to follow',M,551,CW,color=GOLD)
p('I am settling the shelf structure before filling it. The empty bays make the edges, uprights and spacing easier to review.',M,571,CW,8.7,'Body',MUTED,11.5,max_h=26)
for i,(key,title,body,crop) in enumerate([
    ('upper-shelf','Upper shelf','A separate board within the frame.',(365,630,950,735)),
    ('lower-shelf','Lower shelf','Its own edge and supporting bays.',(365,785,950,885)),
    ('cabinet-doors','Cabinet doors','Raised panels and small round knobs.',(365,975,785,1090)),
]):
    x=M+i*184
    pic(key,x,612,172,64,crop)
    label(title,x,688,172)
    p(body,x,708,172,8.2,'Body',MUTED,10.6,max_h=33)

# 5. Street/window, close and in context.
start('04 / the window','A New York street beyond the glass.',
      'The outside view now includes a city facade, a hot dog cart and anonymous passersby. The opening and its trim connect that street to the room.')
pic('window-in-context',M,166,207,528,(0,135,365,1066))
pic('cart-and-pedestrians',262,166,314,335,(0,617,330,969))
label('Hot dog cart and passersby',262,513,314)
p('Small figures give the view everyday activity while leaving attention inside the bar.',262,534,314,8.5,'Body',MUTED,11.5,max_h=30)
pic('window-sill-and-return',262,583,314,117,(0,915,365,1051))
label('Sill, frame and wall connection',262,713,314)
label('Window within the room',M,707,207,color=GOLD)
p('The opening stays its own piece.',M,727,207,8.1,'Body',MUTED,10.7,max_h=16)

# 6. Architecture and smaller fixtures.
start('05 / the smaller details','The details that make it feel like a place.',
      'Crown moulding, panel rails, a recessed window surround and simple wall fixtures give the setting its visual rhythm.')
pic('crown-moulding',M,167,CW,118,(250,0,1200,208))
label('Crown moulding / the ceiling-to-wall transition',M,297,CW,color=GOLD)
pic('television-frame',M,328,300,221,(372,204,822,532))
pic('chalkboard-frame',354,328,222,221,(864,183,1110,500))
label('Television',M,561,300)
label('Chalkboard',354,561,222)
p('A dark screen in a narrow frame.',M,582,300,8.5,'Body',MUTED,11.5)
p('Left clear for the right words later.',354,582,222,8.5,'Body',MUTED,11.5)
pic('panel-rail-grain',M,620,300,79,(390,469,825,584))
pic('upper-window-joinery',354,620,222,79,(150,135,465,247))
label('Wood grain and panel rails',M,711,300)
label('Window joinery',354,711,222)

# 7. Assembly direction, with current result and honest next work.
start('06 / where I go next','One room. More control over every part.',
      'I have moved from the bare architectural base to a furnished room study. The next passes can concentrate on the details without replacing the whole setting.')
pic('selected-foundation',M,166,262,393,source=BASE)
pic('current-room-comparison',314,166,262,393)
label('Selected architectural base',M,571,262,color=GOLD)
label('Current assembled room',314,571,262,color=GOLD)
p('New drawing work is running locally on the RTX 4090. The room is organized into separate pieces so a shelf, chair or window can be improved and fitted back into place.',M,597,CW,9,'Body',MUTED,12.2,max_h=38)
for i,(title,body) in enumerate([
    ('Refine the room','Review the joins, chair placement and consistency of the pen work.'),
    ('Finish the bottle rows','Create and check each row against its own shelf.'),
    ('Bring in the cast','Add the accepted characters, then the caption and newspaper page.'),
]):
    x=M+i*184
    box(x,647,172,90)
    label(title,x+11,659,150)
    p(body,x+11,680,150,8.1,'Body',MUTED,10.8,max_h=49)

assert page==TOTAL
c.save()
manifest={
    'pdf':str(OUT),'pages':page,'bytes':OUT.stat().st_size,
    'pdf_sha256':hashlib.sha256(OUT.read_bytes()).hexdigest(),
    'scene_time':'2026-09-04T18:34:03-04:00',
    'sources':{str(path):hashlib.sha256(path.read_bytes()).hexdigest() for path in [CURRENT,BASE]},
    'views':views,'text_boxes':text_boxes,
}
(WORK/'build-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in manifest.items() if k not in ['views','text_boxes']},indent=2))
