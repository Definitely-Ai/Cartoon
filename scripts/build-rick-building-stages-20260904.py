"""Rick's illustrated work-in-progress report. Source art is preserved unchanged."""
from pathlib import Path
from io import BytesIO
import hashlib,json
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph

ROOT=Path(__file__).resolve().parents[1]
WORK=ROOT/'tmp/pdfs/rick-building-stages-20260904'
SRC=WORK/'sources'
OUT=ROOT/'output/pdf/ricks-studio-daily-update-2026-09-04.pdf'
for name,fn in [('Body','arial.ttf'),('Bold','arialbd.ttf'),('Display','georgiab.ttf')]:
    pdfmetrics.registerFont(TTFont(name,str(Path('C:/Windows/Fonts')/fn)))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Bold')
W,H,M,CW=612,792,36,540
TOTAL=11
PAPER,INK,MUTED,GREEN,GOLD,RULE,PALE,WHITE=[HexColor(s) for s in ['#faf7ef','#243136','#626864','#365e51','#947042','#d5cdbd','#e6ece6','#ffffff']]
c=canvas.Canvas(str(OUT),pagesize=(W,H),pageCompression=1)
c.setTitle("Rick's Studio | Building the Scene | September 4, 2026")
c.setAuthor('The Swinging Door')
c.setCreator("Rick's Studio")
c.setSubject('Drawing stages, modular component studies and the selected current work in progress')
page=0
views=[]
texts=[]
hashes={}
image_cache={}

def p(text,x,top,width,size=9,face='Body',color=MUTED,leading=None,max_h=None):
    q=Paragraph(text,ParagraphStyle('copy',fontName=face,fontSize=size,leading=leading or size*1.35,textColor=color))
    _,h=q.wrap(width,H)
    assert top+h<=745,(page,text,top,h)
    if max_h is not None: assert h<=max_h+.1,(page,text,h,max_h)
    q.drawOn(c,x,H-top-h)
    texts.append({'page':page,'text':text,'bounds':[x,top,x+width,top+h]})
    return top+h

def label(text,x,top,width,color=GREEN): return p(text.upper(),x,top,width,7.5,'Bold',color,10)
def rule(top,x=M,w=CW,color=RULE):
    c.setStrokeColor(color);c.setLineWidth(.6);c.line(x,H-top,x+w,H-top)
def box(x,top,w,h,color=PALE):
    c.setFillColor(color);c.roundRect(x,H-top-h,w,h,6,fill=1,stroke=0)

def pic(key,path,x,top,w,h,crop=None):
    path=Path(path)
    raw=path.read_bytes()
    hashes[str(path.relative_to(ROOT))]=hashlib.sha256(raw).hexdigest()
    im=Image.open(BytesIO(raw)).convert('RGB')
    crop=tuple(crop or [0,0,*im.size])
    l,t,r,b=crop
    assert 0<=l<r<=im.width and 0<=t<b<=im.height,(key,crop,im.size)
    cache_key=(str(path),crop,round(w,2),round(h,2))
    if cache_key not in image_cache:
        im=im.crop(crop)
        scale=min(w/im.width,h/im.height)
        dw,dh=im.width*scale,im.height*scale
        im.thumbnail((max(1,round(dw*2.8)),max(1,round(dh*2.8))),Image.Resampling.LANCZOS)
        buf=BytesIO();im.save(buf,format='JPEG',quality=93,subsampling=0,optimize=True);buf.seek(0)
        image_cache[cache_key]=(ImageReader(buf),dw,dh,buf)
    reader,dw,dh,_=image_cache[cache_key]
    c.setFillColor(WHITE);c.rect(x,H-top-h,w,h,fill=1,stroke=0)
    c.drawImage(reader,x+(w-dw)/2,H-top-(h+dh)/2,width=dw,height=dh)
    c.setStrokeColor(RULE);c.setLineWidth(.5);c.rect(x,H-top-h,w,h,fill=0,stroke=1)
    views.append({'page':page,'key':key,'path':str(path.relative_to(ROOT)),'crop':crop,'bounds':[x,top,x+w,top+h]})

def start(section,title,subtitle):
    global page
    if page:c.showPage()
    page+=1
    c.setFillColor(PAPER);c.rect(0,0,W,H,fill=1,stroke=0)
    c.bookmarkPage(f'p{page}');c.addOutlineEntry(section,f'p{page}')
    p('THE SWINGING DOOR',M,22,300,9,'Display',INK,11)
    p('SEPTEMBER 4, 2026  /  WORK IN PROGRESS',350,24,226,7,'Bold',MUTED,9)
    rule(46,color=INK)
    label(section,M,62,CW)
    y=p(title,M,80,CW,22,'Display',INK,26,max_h=52)
    y=p(subtitle,M,y+8,CW,9.2,'Body',MUTED,12.4,max_h=38)
    assert y<159,(page,y)
    rule(752)
    c.setFont('Body',7);c.setFillColor(MUTED);c.drawString(M,18,"RICK'S STUDIO  /  BUILDING THE SCENE")
    c.setFont('Bold',7);c.drawRightString(576,18,f'{page:02d} / {TOTAL:02d}')

# The inventory contains manually inspected crop boxes in native source coordinates.
inventory=json.loads((WORK/'stages-and-module-crop-inventory.json').read_text(encoding='utf-8-sig'))
CROPS=inventory['parts']
if isinstance(CROPS,list):CROPS={a['id']:a for a in CROPS}
assert len(CROPS)==16
def module(id,x,top,w,h):
    item=CROPS[id]
    bounds=item['crop_box_source_pixels']
    pic('module-'+id,SRC/'parts'/f'{id}.png',x,top,w,h,bounds)

# 1 - Nominated version and explicit work still under way.
start('Today\'s progress / for Rick','Building the scene, piece by piece.',
      'This is the version we reached today. The report follows the drawings and individual parts behind it, with the sign, chairs and camera angle still being refined.')
pic('selected-current-version',SRC/'current-selected.png',M,168,350,530)
rx,rw=406,170
label('Current working version',rx,171,rw,color=GOLD)
p('Rick, the setting is coming together.',rx,198,rw,13.8,'Display',INK,18,max_h=57)
p('Today I worked through the room\'s structure, lighting and separate components. The scene now gives us something concrete to refine before the characters come in.',rx,272,rw,9.2,'Body',MUTED,12.8,max_h=106)
box(rx,398,rw,122)
label('Still in progress',rx+12,412,rw-24)
p('The sign, chairs and camera angle are the immediate focus. The wall lights have been removed from the current version.',rx+12,438,rw-24,8.7,'Body',MUTED,12,max_h=72)
box(rx,542,rw,141)
label('Tomorrow\'s plan',rx+12,556,rw-24)
p('Begin work on the characters once the scene is right. I want the setting settled before their placement and expressions are developed.',rx+12,582,rw-24,8.7,'Body',MUTED,12,max_h=87)
p('Selected current version. This is a scene in development; it is not being presented as the finished cartoon.',M,717,CW,8.5,'Body',MUTED,11.5,max_h=25)

# 2 - Actual drawing stages.
start('Stages 1-4 / planning the drawing','The scene starts with structure and light.',
      'These drawings work through the camera angle, the room\'s proportions, the placement of its features and the light coming through the window.')
for i,(key,filename,title,body) in enumerate([
    ('construction','00-lines.png','1. Construction drawing','Lines establish the walls, bar, opening and furniture positions.'),
    ('empty-values','01-values-base.png','2. Bare-room light plan','Simple tones describe the architecture before detail is added.'),
    ('full-values','01-values.png','3. Full placement plan','The fixtures and furniture are checked together in the same room.'),
    ('street-values','01-values-street.png','4. Street and window plan','Earlier outside-view plan. The wall lights shown here have since been removed.'),
]):
    row,col=divmod(i,2);x=M+col*278;top=166+row*279
    box(x,top,262,265,color=WHITE)
    pic(key,SRC/filename,x+8,top+8,144,216)
    label('Drawing stage',x+165,top+15,85,color=GOLD)
    p(title,x+165,top+44,85,9.1,'Bold',INK,11.7,max_h=60)
    p(body,x+165,top+119,85,8,'Body',MUTED,10.5,max_h=95)

# 3 - The bare shell and four architectural regions.
start('Camera angle / the next framing concept','Moving closer to the conversation.',
      'I am bringing the camera in so the chair legs fall out of frame. The closer drawing is the composition being developed next; the selected artwork remains today\'s working version.')
pic('selected-current-camera',SRC/'current-selected.png',M,169,262,393)
pic('values-closer-requested',SRC/'concepts/values-closer.png',314,169,262,393)
label('Selected current artwork',M,576,262,color=GOLD)
label('Closer camera / concept in progress',314,576,262,color=GOLD)
p('The current artwork still includes the lower chairs and legs.',M,598,262,8.6,'Body',MUTED,11.6,max_h=36)
p('The tighter view keeps the chair backs and bar in the foreground while taking the legs out of the picture.',314,598,262,8.6,'Body',MUTED,11.6,max_h=48)
box(M,666,CW,70)
label('What I am working toward',M+13,678,CW-26)
p('A closer view of the room and the eventual characters, with the sign and chairs refined to suit the composition. The wall lights are removed from the current direction.',M+13,700,CW-26,8.7,'Body',GREEN,11.5,max_h=28)

def concept_page(section,title,subtitle,items):
    start(section,title,subtitle)
    for i,(filename,heading,body) in enumerate(items):
        row,col=divmod(i,2);x=M+col*278;top=166+row*142
        box(x,top,262,132,color=WHITE)
        source=SRC/'concepts'/filename
        with Image.open(source) as im:
            landscape=im.width/im.height>=1.3
        if landscape:
            pic('concept-'+filename,source,x+7,top+7,248,86)
            p(heading,x+7,top+97,248,8.8,'Bold',INK,11.4,max_h=12)
            p(body,x+7,top+112,248,7.8,'Body',MUTED,9.7,max_h=20)
        else:
            pic('concept-'+filename,source,x+7,top+7,90,118)
            p(heading,x+109,top+11,141,8.8,'Bold',INK,11.4,max_h=34)
            p(body,x+109,top+56,141,8,'Body',MUTED,10.6,max_h=64)

concept_page('Concept history / room and viewpoint','The ideas behind the room.',
    'These earlier drawing studies show the work on camera height, wall depth, cabinetry and furniture proportions. They record the alternatives explored during development.',[
    ('values-base.png','Early base study','The original architectural layout and light distribution.'),
    ('values-eye170.png','Lower viewpoint','An early test of the camera height and sightline across the bar.'),
    ('values-eye205.png','Raised viewpoint','A second viewpoint for comparing the wall, counter and seating.'),
    ('values-window.png','Window depth','A focused drawing of the opening, its surround and the wall turn.'),
    ('values-backbar.png','Back-bar layout','An early arrangement of the cabinetry and shelves.'),
    ('values-backbar2.png','Back-bar revision','A further test of the built-in structure.'),
    ('values-backbar3.png','Shelf framework','A closer study of the uprights, shelf levels and lower cabinets.'),
    ('values-chairs3.png','Early seating shapes','A first pass at how the chair forms relate to the counter.'),
])
concept_page('Concept history / proportion and detail','Working through the proportions.',
    'These studies develop the framing, chair height, counter and back bar. They are steps in the design process, including ideas that have since been set aside.',[
    ('values-chairs5.png','Chair proportion test','A later seating study before the move to the closer framing.'),
    ('values-chairs6.png','Full-back chairs','Testing a fuller back shape within the composition.'),
    ('values-chairs7.png','Earlier chair placement','The wider study still shows legs; the closer concept removes them.'),
    ('values-pan14.png','Camera pan study','Testing the balance between the window, bar wall and seating.'),
    ('values-tallbar.png','Back-bar scale','A closer study of the shelving and counter proportions.'),
    ('values-tallbar-full.png','Room-scale check','The larger back bar reviewed within the complete composition.'),
    ('values-ledge.png','Working ledge','Testing the stone ledge against the cabinet run.'),
    ('values-lamps.png','Light test / set aside','Earlier fixture exploration. The lights are removed from the current version.'),
])

start('Stage 5 / the architectural base','The bare room comes before the dressing.',
      'The selected foundation study lets me work on the ceiling, walls and floor before the window, bar, shelves, screens or characters compete for attention.')
pic('bare-foundation',SRC/'base.png',M,167,346,519)
rx,rw=405,171
for i,(title,body) in enumerate([
    ('Ceiling and crown','The upper edge and moulding establish how the room meets overhead.'),
    ('Back wall','Panel spacing and horizontal rails give the bar wall a consistent structure.'),
    ('Window wall','The return and corner establish the opening\'s place in the room.'),
    ('Floor','Direction and tone ground the room before the furniture is placed.'),
]):
    top=176+i*120
    label(title,rx,top,rw)
    p(body,rx,top+25,rw,8.8,'Body',MUTED,12,max_h=72)
    if i<3:rule(top+102,rx,rw)
p('Foundation study. Later pieces can be developed against this structure while the room continues through review.',M,708,CW,8.6,'Body',MUTED,11.6,max_h=25)

# 4 - Six backbar/counter modules.
start('Stage 6 / the modular bar','Six pieces make up the bar and shelving.',
      'These are individual component studies from the build. They show what each part contributes; they are not a claim that every detail has been approved.')
items=[
    ('backbar','Walnut back-bar frame','The main frame and its recessed bays.'),
    ('cabinets','Lower cabinet run','Panelled doors and small round knobs.'),
    ('shelf-upper','Upper shelf','A separate board that can be revised on its own.'),
    ('shelf-lower','Lower shelf','Its own height, edge and relation to the uprights.'),
    ('ledge','Working ledge','The narrow stone surface above the cupboards.'),
    ('counter','Bar counter','The foreground top and its layered edge.'),
]
for i,(id,title,body) in enumerate(items):
    row,col=divmod(i,2);x=M+col*278;top=167+row*188
    module(id,x,top,262,113)
    label(title,x,top+124,262)
    p(body,x,top+145,262,8.2,'Body',MUTED,10.9,max_h=28)

# 5 - Four independently drawn fixtures/window pieces.
start('Stage 6 / window and wall fixtures','The window and fixtures, piece by piece.',
      'The window joinery, street view, television and chalkboard are separate design jobs. Their studies help us review one feature at a time.')
for i,(id,title,body) in enumerate([
    ('window-frame','Window joinery','The opening, surround and frame are developed together.'),
    ('glass','Street view','City frontage, a hot dog cart and anonymous passersby.'),
    ('tv','Television','A quiet screen shape that can receive content later.'),
    ('board','Chalkboard','A separate framed surface for the eventual words.'),
]):
    row,col=divmod(i,2);x=M+col*278;top=167+row*281
    if id=='window-frame':
        pic('module-window-frame',SRC/'parts/window-frame.png',x,top,125,210,(240,155,420,395))
        pic('frame-sill-detail',SRC/'parts/window-frame.png',x+137,top,125,210,(200,840,400,1030))
    else:
        module(id,x,top,262,210)
    label(title,x,top+221,262)
    p(body,x,top+242,262,8.2,'Body',MUTED,10.9,max_h=28)

# 6 - Individual chairs and chosen current pair, explicitly being revised.
start('Stage 6 / seating studies','The chairs are still being improved.',
      'The separate chair studies let me work on each shape and finish. The lower view shows the pair in today\'s selected version, with further refinement still planned.')
for i,(id,title) in enumerate([('chair-left','Left chair / component study'),('chair-right','Right chair / component study')]):
    x=M+i*278
    module(id,x,166,262,293)
    label(title,x,471,262)
pic('selected-chair-pair',SRC/'current-selected.png',M,513,CW,147,(0,1030,1184,1352))
label('Chairs in the selected current version',M,673,CW,color=GOLD)
p('I am continuing to refine the chair shapes, trim and consistency so they sit naturally in the scene before character work begins.',M,696,CW,9,'Body',MUTED,12.2,max_h=37)

# 7 - The remaining four studies are openly marked as under consideration.
start('Stage 6 / earlier component studies','Bottle studies and lights that were set aside.',
      'The bottle rows remain separate development studies. The wall-light designs are included as part of the drawing history; the lights have been removed from the current version.')
for i,(id,title,body) in enumerate([
    ('bottles-upper','Upper bottle row / study','A row study to review against the upper shelf.'),
    ('bottles-lower','Lower bottle row / study','A separate row for the lower shelf.'),
]):
    top=167+i*145
    module(id,M,top,CW,94)
    label(title,M,top+104,262)
    p(body,314,top+104,262,8.2,'Body',MUTED,10.9,max_h=30)
for i,(id,title,body) in enumerate([
    ('sconce-left','Earlier left light / removed','Retained to show the design work. Removed from the current version.'),
    ('sconce-right','Earlier right light / removed','An earlier companion study. Removed from the current version.'),
]):
    x=M+i*278
    module(id,x,474,262,188)
    label(title,x,674,262)
    p(body,x,695,262,8.3,'Body',MUTED,11,max_h=33)

# 8 - Current chosen version and specific sequence of remaining work.
start('Stage 7 / bringing the pieces together','The current version is a checkpoint.',
      'The drawing stages and modular designs are leading toward one consistent scene. Today\'s chosen version is the point we are refining from.')
pic('selected-current-checkpoint',SRC/'current-selected.png',M,167,337,510)
rx,rw=398,178
for i,(heading,body) in enumerate([
    ('Now: camera angle','Move in closer so the chair legs are out of frame, as shown in the closer concept drawing.'),
    ('Now: the sign','I am working on how the sign sits in the window and how the lettering belongs in the scene.'),
    ('Now: the chairs','I am refining the seating and checking its shape, finish and fit with the bar.'),
    ('Tomorrow: the characters','Begin character work once the scene is settled, then develop the finished cartoon around it.'),
]):
    top=174+i*127
    label(heading,rx,top,rw)
    p(body,rx,top+26,rw,8.7,'Body',MUTED,12,max_h=78)
    if i<3:rule(top+109,rx,rw)
box(M,702,CW,39)
p('The aim is a dependable setting we can improve one piece at a time. New drawing work is running locally on the RTX 4090.',M+12,712,CW-24,8.5,'Body',GREEN,11.2,max_h=25)

assert page==TOTAL
assert {v['key'].replace('module-','') for v in views if v['key'].startswith('module-')}==set(CROPS)
c.save()
manifest={'output':str(OUT),'pages':page,'bytes':OUT.stat().st_size,'sha256':hashlib.sha256(OUT.read_bytes()).hexdigest(),'sourceHashes':hashes,'views':views,'textBoxes':texts,'selectedVersion':'gen_1788561495306772600_fa23c7_room-part_local_sensenova-u1.5.png','all16ModulesIncluded':True}
(WORK/'build-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in manifest.items() if k not in ['sourceHashes','views','textBoxes']},indent=2))
