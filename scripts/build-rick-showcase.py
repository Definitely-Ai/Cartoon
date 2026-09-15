"""The shared presentation content as a native-image, landscape PDF handout."""
import json, os
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from xml.sax.saxutils import escape
ROOT=Path.cwd()
pdfmetrics.registerFont(TTFont('Georgia','C:/Windows/Fonts/georgia.ttf'))
pdfmetrics.registerFont(TTFont('GeorgiaBold','C:/Windows/Fonts/georgiab.ttf'))
rows=json.loads((ROOT/'docs/presentation/rick-showcase.json').read_text(encoding='utf-8'))
cartoons={c['id']:c for p in ['lib/city-editions.json','lib/best-of-cartoons.json'] for c in json.loads((ROOT/p).read_text(encoding='utf-8'))}
revision=os.environ.get('CARTOON_ART_REVISION','')
if revision and not revision.replace('-','').isalnum(): raise ValueError('Invalid revision')
out=ROOT/'output/pdf'/revision/'rick-system-showcase.pdf';out.parent.mkdir(parents=True,exist_ok=True)
c=canvas.Canvas(str(out),pagesize=(960,540));c.setTitle('The Swinging Door - Cartoons and local edition production');c.setAuthor('Zechariah Myrick, AI Dream Builders LLC')
ink=HexColor('#26312a');bg=HexColor('#f8f6f0')
def para(value,x,y,width,size=18,bold=False):
    value=escape(value).replace('\n\n','<br/><br/>').replace('\n','<br/>')
    p=Paragraph(value,ParagraphStyle('copy',fontName='GeorgiaBold' if bold else 'Georgia',fontSize=size,leading=size*1.35,textColor=ink))
    w,h=p.wrap(width,530);p.drawOn(c,x,y-h)
for index,item in enumerate(rows):
    c.setFillColor(bg);c.rect(0,0,960,540,fill=1,stroke=0)
    if item.get('cartoon'):
        art=cartoons[item['cartoon']]
        para(item['title'],45,438 if item.get('cover') else 486,460,42 if item.get('cover') else 32,True)
        if item.get('subtitle'):para(item['subtitle'],45,319 if item.get('cover') else 386,440,20)
        para(item['body'],45,232 if item.get('cover') else 313 if item.get('subtitle') else 350,438,18)
        c.drawImage(str(ROOT/'public'/art['src'].lstrip('/')),585,27,width=324,height=486,preserveAspectRatio=True,mask='auto')
    elif item.get('steps'):
        para(item['title'],45,504,870,32,True)
        for j,(label,body) in enumerate(item['steps']):
            y=412-j*93;para(f'{j+1:02}',45,y,55,28);para(label,115,y,765,21,True);para(body,115,y-35,750,17)
    elif item.get('table'):
        para(item['title'],45,504,870,32,True)
        widths=[330,210,330];top=412
        for r,values in enumerate(item['table']):
            x=45;y=top-r*46.5
            if r==0:c.setFillColor(HexColor('#e5e9df'));c.rect(45,y-40,870,46.5,fill=1,stroke=0)
            for k,value in enumerate(values):para(value,x+10,y-7,widths[k]-20,17,r==0);x+=widths[k]
            c.setStrokeColor(HexColor('#c9ccbf'));c.line(45,y-40,915,y-40)
        para(item['body'],45,143,870,18)
    c.showPage()
c.save()
print(out)
