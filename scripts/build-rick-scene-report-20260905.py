"""September 5 scene-only progress report; preserve source artwork unchanged."""
from pathlib import Path
from io import BytesIO
import hashlib, json, shutil
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph

ROOT=Path(__file__).resolve().parents[1]
DAY=ROOT/'reports/2026-09-05'
WORK=ROOT/'tmp/pdfs/rick-scene-report-20260905'
SRC=WORK/'sources'
OUT=ROOT/'output/pdf/ricks-studio-daily-update-2026-09-05.pdf'
for folder in [SRC,OUT.parent,ROOT/'output/email']:
    folder.mkdir(parents=True,exist_ok=True)

sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
source_manifest=[]
def freeze(name,path):
    target=SRC/name
    if not target.exists():
        shutil.copyfile(path,target)
    source_manifest.append({'name':name,'original':str(path),'snapshot':str(target),'sha256':sha(target)})
    return target
for number,name in [(181,'scene.png'),(167,'chairs-in-room.png'),(161,'shelf-choice.png'),(96,'chairs-drawing.png'),(142,'bar-study.png')]:
    matches=list((DAY/'images').glob(f'{number:03d}-*.png'))
    assert len(matches)==1,(number,matches)
    freeze(name,matches[0])
freeze('shelf-construction.png',Path('C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/shelf3-C-slab/zoom-unit.png'))
for name in ['backbar','shelf-upper','shelf-lower','ledge','counter','window-frame','glass','tv','board']:
    freeze('part-'+name+'.png',ROOT/'canon/room-kit/v2/stickers'/f'{name}.png')
for name,path in [('REPORT.md',DAY/'REPORT.md'),('STEPS.md',DAY/'STEPS.md'),('stickers-manifest.json',ROOT/'canon/room-kit/v2/stickers/manifest.json')]:
    freeze(name,path)
(WORK/'source-manifest.json').write_text(json.dumps(source_manifest,indent=2),encoding='utf-8')

for name,filename in [('Body','arial.ttf'),('Bold','arialbd.ttf'),('Display','georgiab.ttf')]:
    pdfmetrics.registerFont(TTFont(name,str(Path('C:/Windows/Fonts')/filename)))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Bold')
W,H,M,CW,TOTAL=612,792,36,540,7
PAPER,INK,MUTED,GREEN,GOLD,RULE,PALE,WHITE=[HexColor(s) for s in ['#faf7ef','#243136','#626864','#365e51','#947042','#d5cdbd','#e6ece6','#ffffff']]
c=canvas.Canvas(str(OUT),pagesize=(W,H),pageCompression=1)
c.setTitle("Rick's Studio | Still Perfecting the Scene | September 5, 2026")
c.setAuthor('The Swinging Door')
c.setSubject('Daily progress on the bar setting, shelving, window, signage and furniture')
page=0
views=[]
texts=[]
cache={}

def p(text,x,top,width,size=9,face='Body',color=MUTED,leading=None,max_h=None):
    q=Paragraph(text,ParagraphStyle('copy',fontName=face,fontSize=size,leading=leading or size*1.35,textColor=color))
    _,h=q.wrap(width,H)
    assert 0<=x<x+width<=W and top+h<=742,(page,text,top,h)
    if max_h is not None:assert h<=max_h+.1,(page,text,h,max_h)
    q.drawOn(c,x,H-top-h)
    texts.append({'page':page,'text':text,'bounds':[x,top,x+width,top+h]})
    return top+h

def label(text,x,top,width,color=GREEN):return p(text.upper(),x,top,width,7.7,'Bold',color,10.4)
def rule(top,x=M,w=CW,color=RULE):
    c.setStrokeColor(color);c.setLineWidth(.6);c.line(x,H-top,x+w,H-top)
def box(x,top,w,h):
    c.setFillColor(PALE);c.roundRect(x,H-top-h,w,h,6,fill=1,stroke=0)

def pic(key,filename,x,top,w,h,crop=None,alpha=False):
    path=SRC/filename
    im=Image.open(path).convert('RGBA')
    if alpha:
        assert im.getchannel('A').getextrema()[0]==0,filename
        crop=im.getchannel('A').getbbox()
    crop=tuple(crop or [0,0,*im.size])
    l,t,r,b=crop
    assert 0<=l<r<=im.width and 0<=t<b<=im.height,(key,crop,im.size)
    token=(filename,crop,w,h)
    if token not in cache:
        im=im.crop(crop)
        scale=min(w/im.width,h/im.height)
        dw,dh=im.width*scale,im.height*scale
        im.thumbnail((max(1,round(dw*3)),max(1,round(dh*3))),Image.Resampling.LANCZOS)
        bg=Image.new('RGBA',im.size,'white');bg.alpha_composite(im)
        buf=BytesIO();bg.convert('RGB').save(buf,format='JPEG',quality=94,subsampling=0,optimize=True);buf.seek(0)
        cache[token]=(ImageReader(buf),dw,dh,buf)
    reader,dw,dh,_=cache[token]
    c.setFillColor(WHITE);c.rect(x,H-top-h,w,h,fill=1,stroke=0)
    c.drawImage(reader,x+(w-dw)/2,H-top-(h+dh)/2,width=dw,height=dh)
    c.setStrokeColor(RULE);c.setLineWidth(.5);c.rect(x,H-top-h,w,h,fill=0,stroke=1)
    views.append({'page':page,'key':key,'file':filename,'sha256':sha(path),'crop':crop,'bounds':[x,top,x+w,top+h],'isolatedAlpha':alpha})

def start(section,title,subtitle):
    global page
    if page:c.showPage()
    page+=1
    c.setFillColor(PAPER);c.rect(0,0,W,H,fill=1,stroke=0)
    c.bookmarkPage(f'p{page}');c.addOutlineEntry(section,f'p{page}')
    p('THE SWINGING DOOR',M,22,300,9,'Display',INK,11)
    p('SEPTEMBER 5, 2026  /  WORK IN PROGRESS',345,24,231,7,'Bold',MUTED,9)
    rule(46,color=INK)
    label(section,M,62,CW)
    y=p(title,M,80,CW,22,'Display',INK,26,max_h=52)
    y=p(subtitle,M,y+8,CW,9.2,'Body',MUTED,12.4,max_h=38)
    assert y<160,(page,y)
    rule(751)
    c.setFont('Body',7);c.setFillColor(MUTED);c.drawString(M,18,"RICK'S STUDIO  /  DAILY SCENE PROGRESS")
    c.setFont('Bold',7);c.drawRightString(576,18,f'{page:02d} / {TOTAL:02d}')

start('Today\'s progress / for Rick','Still perfecting the scene.',
      'Today I concentrated on the bar setting: a stronger shelf design, cleaner marble edges, a revised window sill and clearer signage. The room is still being refined.')
pic('current-background','scene.png',M,168,338,507)
rx,rw=398,178
label('The setting tonight',rx,171,rw,color=GOLD)
p('A clearer direction for the room.',rx,198,rw,14,'Display',INK,18,max_h=58)
p('Rick, today\'s biggest step was choosing the open walnut shelf design and bringing it into the room. I also worked through the smaller details that make the setting feel believable.',rx,276,rw,9.2,'Body',MUTED,12.8,max_h=115)
box(rx,415,rw,104)
label('What is taking shape',rx+12,428,rw-24)
p('Two substantial shelves, visible wall panelling and a simpler treatment below the rear ledge.',rx+12,454,rw-24,8.8,'Body',GREEN,12,max_h=57)
box(rx,540,rw,135)
label('Still in progress',rx+12,553,rw-24)
p('I am still perfecting the scene: checking the proportions, materials, lettering and joins so the whole room feels consistent.',rx+12,579,rw-24,8.8,'Body',GREEN,12,max_h=85)
p('Current background study, recorded at 9:01 p.m. Eastern. This report shows the setting in development.',M,702,CW,8.7,'Body',MUTED,11.7,max_h=30)

start('The main advance / open walnut shelves','The shelves now have a direction.',
      'After exploring several approaches, I chose two thick walnut slabs supported by three posts. The wall stays visible behind them, giving the room a more open feel.')
pic('current-shelf-and-open-wall','scene.png',M,168,CW,290,(382,565,1190,1130))
label('The chosen design in the room',M,471,CW)
p('The cabinet doors beneath the rear ledge have been removed. The shelving and surrounding wall can now be reviewed together.',M,493,CW,8.7,'Body',MUTED,11.7,max_h=27)
pic('shelf-construction-stage','shelf-construction.png',M,545,262,147,(0,0,800,448))
pic('selected-shelf-drawing','shelf-choice.png',314,545,262,147,(413,607,1170,1032))
label('Construction / thickness and depth',M,704,262,color=GOLD)
label('Drawing / wood, edges and shadow',314,704,262,color=GOLD)
p('The same design moves from simple forms to the finished drawing style; the overall scene remains in progress.',M,723,CW,8,'Body',MUTED,10.6,max_h=18)

start('The bar / surface and construction','Getting the bar itself right.',
      'I worked on the marble top, its edge and the rear ledge as separate pieces, checking each one against the room before bringing the furniture back into the study.')
pic('current-bar-marble-and-front','scene.png',M,168,CW,299,(0,1080,1200,1760))
label('Current bar study',M,480,CW)
p('A cleaner run across the marble, with the top and front edge reading as one continuous surface. I am still refining the material and line work.',M,501,CW,9,'Body',MUTED,12.2,max_h=29)
pic('bar-refinement-stage','bar-study.png',M,554,262,153,(0,0,800,465))
pic('current-rear-ledge','scene.png',314,554,262,153,(355,975,1195,1170))
label('Earlier bar study / cabinets later removed',M,719,262,color=GOLD)
label('Rear ledge / current detail',314,719,262,color=GOLD)

start('The window / sill and signage','Making the window feel convincing.',
      'The window received a simpler sill design and a new lettering treatment. I am checking the relationship between the stone, the frame, the sign and the street outside.')
pic('current-window-sign','scene.png',M,168,253,485,(0,210,414,1060))
rx,rw=314,262
label('A more readable sign',rx,170,rw)
p('I changed the letter style and raised the wording to give it more space above the hot dog cart. The sign reads in reverse from inside the room, as lettering on the outside of glass would.',rx,195,rw,9,'Body',MUTED,12.2,max_h=94)
pic('current-window-sill','scene.png',rx,308,rw,195,(0,875,490,1239))
label('One marble sill',rx,519,rw)
p('The new design replaces the stack of rails under the window with a projecting stone sill. Its edge, shadow and join to the wall are still being reviewed.',rx,545,rw,9,'Body',MUTED,12.2,max_h=89)
box(M,678,CW,56)
p('The street view remains part of the atmosphere: city buildings, a hot dog cart and anonymous passersby beyond the glass. The wall lights remain removed.',M+12,691,CW-24,8.7,'Body',GREEN,11.8,max_h=32)

start('Furniture studies / proportion and finish','The chairs are still being refined.',
      'I worked through the chair backs, visible seat cushions, leather and trim. These are furniture studies within the setting, with the shapes and finish still under review.')
pic('chair-proportion-drawing','chairs-drawing.png',M,169,CW,240,(0,140,800,600))
label('Drawing stage / the seat and back',M,422,CW,color=GOLD)
p('The construction study makes the seat cushion and back separate, readable forms.',M,444,CW,8.8,'Body',MUTED,11.8,max_h=27)
pic('chair-finish-study','chairs-in-room.png',M,489,CW,207,(0,1250,1200,1800))
label('Furniture study / leather, trim and scale',M,709,CW,color=GOLD)
p('I am continuing to refine the proportions and how naturally the chairs fit at the bar.',M,728,CW,8,'Body',MUTED,10.6,max_h=14)

start('The modular approach / organized pieces','Each part can be worked on separately.',
      'The scene now has a clearer set of named pieces and saved versions. That makes it easier to compare a change, keep the strongest result and continue refining the room.')
parts=[('backbar','Walnut posts'),('shelf-upper','Upper shelf'),('shelf-lower','Lower shelf'),('ledge','Rear marble ledge'),('counter','Main bar'),('window-frame','Window sill / in place'),('glass','Street view'),('tv','Television / in place'),('board','Chalkboard')]
for i,(name,title) in enumerate(parts):
    row,col=divmod(i,3);x=M+col*184;top=169+row*175
    if name=='window-frame':
        pic('fixture-'+name,'scene.png',x,top,172,132,(0,905,418,1105))
    elif name=='tv':
        pic('fixture-'+name,'scene.png',x,top,172,132,(390,180,875,523))
    else:
        pic('module-'+name,'part-'+name+'.png',x,top,172,132,alpha=True)
    label(title,x,top+144,172)
box(M,704,CW,36)
p('Seven separate art pieces and two fixtures shown in place. Keeping the parts organized lets me improve one detail at a time.',M+12,713,CW-24,8.4,'Body',GREEN,11.2,max_h=25)

start('Where the work stands / next refinements','I am still perfecting the scene.',
      'Today established a stronger direction for the setting. I am continuing to refine how the materials, proportions and smaller details work together.')
pic('closing-current-setting','scene.png',M,169,326,489)
rx,rw=388,188
for i,(title,body) in enumerate([
    ('Shelves and wall','Keep refining the depth, shadows and wood texture so the shelving belongs naturally against the panelling.'),
    ('Window and lettering','Check the sill, frame and sign together, especially their edges, spacing and relationship to the street view.'),
    ('Bar and seating','Continue refining the marble, leather and proportions so the room feels coherent at the chosen camera angle.'),
]):
    top=181+i*158
    label(title,rx,top,rw)
    p(body,rx,top+28,rw,9,'Body',MUTED,12.4,max_h=103)
    if i<2:rule(top+139,rx,rw)
box(M,688,CW,51)
p('The goal is a setting that feels convincing down to the small details. I want to keep improving the scene until its construction, atmosphere and drawing style all feel right.',M+12,700,CW-24,8.9,'Body',GREEN,12,max_h=30)

assert page==TOTAL
c.save()
manifest={'output':str(OUT),'pages':page,'bytes':OUT.stat().st_size,'sha256':sha(OUT),'views':views,'textBoxes':texts,'sourceSnapshot':str(SRC),'reportDate':'2026-09-05','sceneRecord':'181','sceneRecordedAt':'2026-09-05T21:01:00-04:00','noCastIncluded':True}
(WORK/'build-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
email="""Subject: Today's Swinging Door progress - still perfecting the scene

Hi Rick,

I spent today refining the bar setting and getting the individual pieces to work together more convincingly. The attached report shows the scene's progress, with close-ups of the shelves, marble bar, window, signage and furniture studies.

The biggest step was choosing the open walnut shelf design: two substantial shelves supported by three posts, with the wall visible behind them. I also removed the cabinet doors beneath the rear ledge, cleaned up the bar edge, and worked on a simpler window sill and clearer lettering.

The pieces are now organized so I can refine one detail at a time while keeping the rest of the setting consistent. The report includes the drawing stages and separate components so you can see how it is being built.

I'm still perfecting the scene. My focus is on the proportions, materials, shadows and small joins so the whole room feels natural and cohesive. There is more refinement to do, but today's work has given the setting a much clearer direction.
"""
(ROOT/'output/email/ricks-studio-progress-email-2026-09-05.txt').write_text(email,encoding='utf-8')
print(json.dumps({k:v for k,v in manifest.items() if k not in ['views','textBoxes']},indent=2))
