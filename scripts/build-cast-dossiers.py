"""Three-page, canon-grounded cast dossiers. Art is placed, never regenerated."""
import json, shutil, os
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public/gallery/cast-dossiers-20260914-v1'
OUTPUT=ROOT/'output/pdf/cast-dossiers-20260914-v1'
if os.environ.get('CARTOON_ART_REVISION'):
    revision=os.environ['CARTOON_ART_REVISION']
    if not revision.replace('-','').isalnum(): raise ValueError('Invalid revision')
    OUTPUT=OUTPUT/revision
OUTPUT.mkdir(parents=True,exist_ok=True)
base=json.loads((ROOT/'lib/cast-presentation.json').read_text(encoding='utf-8'))
details=json.loads((ROOT/'lib/cast-dossiers.json').read_text(encoding='utf-8'))
members=[dict(m,**next(d for d in details if d['id']==m['id'])) for m in base]
for name,file in [('Serif','georgia.ttf'),('Italic','georgiai.ttf')]:
    pdfmetrics.registerFont(TTFont(name,str(Path('C:/Windows/Fonts')/file)))

def para(c,text,x,top,width,size=10.2,leading=14.4,font='Helvetica',floor=52):
    p=Paragraph(text,ParagraphStyle('body',fontName=font,fontSize=size,leading=leading,textColor='#252923'))
    _,h=p.wrap(width,1000)
    if top-h<floor: raise ValueError(f'Text clips at {top-h}: {text[:80]}')
    p.drawOn(c,x,top-h)
    return top-h

def heading(c,m,kicker,title,sub):
    c.setStrokeColorRGB(.2,.2,.2);c.setLineWidth(.6)
    c.line(42,752,570,752);c.line(42,749,570,749)
    c.setFont('Helvetica',8.5);c.drawString(42,731,'THE SWINGING DOOR / '+kicker.upper())
    c.setFont('Serif',34);c.drawString(42,685,title)
    para(c,escape(sub),42,668,528,11.5,15,'Italic')

def footer(c,m,n):
    c.setStrokeColorRGB(.65,.65,.65);c.line(42,44,570,44)
    c.setFont('Helvetica',8);c.drawString(42,28,m['name']+' / CHARACTER REFERENCE')
    c.drawRightString(570,28,f'SEPTEMBER 2026 / {n} OF 3')
    c.showPage()

def art(c,file,x,y,w,h,minppi=0):
    im=ImageReader(str(file));iw,ih=im.getSize();scale=min(w/iw,h/ih)
    if minppi: scale=min(scale,72/minppi)
    dw,dh=iw*scale,ih*scale
    c.drawImage(im,x+(w-dw)/2,y+(h-dh)/2,dw,dh,mask='auto')
    return iw/(dw/72)

def bullet_list(c,items,x,top,w,size=9.5,leading=13.5):
    for text in items:
        top=para(c,'- '+escape(text),x,top,w,size,leading)-6
    return top

def profile(c,m):
    heading(c,m,'The cast / character profile',m['name'],m['premise'])
    ppi=art(c,ROOT/f'public/gallery/cast-september-2026/{m["id"]}.png',42,255,260,385)
    top=625
    top=para(c,escape(m['role']),330,top,240,17,22,'Serif')-19
    for label,value in [('SPECIES',m['species']),('AGE',m['age'])]:
        top=para(c,label,330,top,240,8,11,'Helvetica-Bold')-4
        top=para(c,escape(value),330,top,240,10.5,14)-14
    top=para(c,'PERSONALITY',330,top,240,8,11,'Helvetica-Bold')-8
    top=bullet_list(c,m['temperament'],330,top,235)-9
    para(c,escape(m['voice']),330,top,230,13,18,'Italic')
    c.setStrokeColorRGB(.7,.7,.7);c.line(42,246,570,246)
    top=para(c,'Background &amp; place in the story',42,230,528,12,16,'Helvetica-Bold')-9
    for text in m['backstory']: top=para(c,escape(text),42,top,528,10.2,14.3)-9
    para(c,f'Current portrait: 1024 x 1536 pixels, placed at approximately {ppi:.0f} PPI. No upscaling.',42,62,528,7,9,floor=48)
    footer(c,m,1)

def signatures(c,m):
    heading(c,m,m['name']+' / visual identity','Signature details.','The small things that make this character unmistakable.')
    for index,s in enumerate(m['signature']):
        top=630-index*176
        art(c,PUBLIC/f'{m["id"]}-{s["key"]}.png',42,top-141,174,137,minppi=180)
        text_top=para(c,escape(s['title']),238,top,332,15,19,'Serif')-10
        para(c,escape(s['text']),238,text_top,332,10.2,14.5)
        c.setStrokeColorRGB(.78,.78,.78);c.line(42,top-155,570,top-155)
    para(c,'Unretouched details from the current presentation portrait. Crops reveal existing marks; they do not add resolution.',42,84,528,8.3,11)
    footer(c,m,2)

def acting(c,m):
    heading(c,m,m['name']+' / performance','In the conversation.','One speaker. Every listener knows who has the floor.')
    for index,p in enumerate(m['poses']):
        x=42+index*182
        art(c,PUBLIC/f'{m["id"]}-{p["key"]}.png',x,446,164,195)
        top=para(c,escape(p['title']),x,435,163,10.2,13,'Helvetica-Bold')-7
        para(c,escape(p['text']),x,top,163,9,12)
    para(c,'Facial acting crops from current Best Of masters, not retired concept sheets or newly invented full-body gestures.',42,345,528,8,11)
    c.setStrokeColorRGB(.7,.7,.7);c.line(42,318,570,318)
    top=para(c,'How '+m['name']+' speaks',42,301,249,12,15,'Helvetica-Bold')-8
    top=bullet_list(c,m['voiceNotes'],42,top,249,9,12)-4
    top=para(c,'Relationships',42,top,249,12,15,'Helvetica-Bold')-8
    for r in m['relationships']:
        top=para(c,'<b>'+escape(r['name'])+'.</b> '+escape(r['text']),42,top,249,8.8,12)-8
    top=para(c,'Keep consistent',320,301,250,12,15,'Helvetica-Bold')-8
    bullet_list(c,m['continuity'],320,top,250,9,12.4)
    footer(c,m,3)

for filename,group in [(m['id']+'.pdf',[m]) for m in members]+[('the-swinging-door-cast.pdf',members)]:
    target=OUTPUT/filename
    c=canvas.Canvas(str(target),pagesize=(612,792),pageCompression=1)
    c.setTitle('The Swinging Door - '+(group[0]['name'] if len(group)==1 else 'The Complete Cast')+' - Character Dossier')
    c.setAuthor('AI Dream Builders LLC')
    c.setSubject('Current character backgrounds, illustrated details and verified speaking/listening studies')
    for m in group: profile(c,m);signatures(c,m);acting(c,m)
    c.save()
    pdf=PdfReader(target)
    assert len(pdf.pages)==len(group)*3
    for index,m in enumerate(group):
        for i in range(3):
            page=pdf.pages[index*3+i]
            assert m['name'] in page.extract_text()
            assert len(page.images)==(1 if i==0 else 3)
            assert list(page.mediabox)==[0,0,612,792]
    shutil.copyfile(target,PUBLIC/filename)
    print(json.dumps({'file':str(target),'pages':len(pdf.pages),'bytes':target.stat().st_size}))
