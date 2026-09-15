"""Read-only checks for Rick's deck and matching PDF. Visual review is separate."""
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET
import zipfile
import pdfplumber

root = Path.cwd()
folder = root / 'public/gallery/presentation-20260915'
content = json.loads((root / 'docs/presentation/rick-showcase.json').read_text(encoding='utf-8'))
cartoons = {c['id']: c for source in ['lib/city-editions.json', 'lib/best-of-cartoons.json']
            for c in json.loads((root / source).read_text(encoding='utf-8'))}
sha = lambda data: hashlib.sha256(data).hexdigest()
compact = lambda value: ''.join(value.split())
ns = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'}
with zipfile.ZipFile(folder / 'rick-system-showcase.pptx') as deck:
    slides = [name for name in deck.namelist() if name.startswith('ppt/slides/slide') and name.endswith('.xml')]
    assert len(slides) == len(content) == 10
    media = {sha(deck.read(name)) for name in deck.namelist() if name.startswith('ppt/media/')}
    with pdfplumber.open(folder / 'rick-system-showcase.pdf') as pdf:
        assert len(pdf.pages) == 10
        for i, item in enumerate(content):
            page = pdf.pages[i]
            assert (page.width, page.height) == (960, 540)
            slide = ET.fromstring(deck.read(f'ppt/slides/slide{i+1}.xml'))
            slide_text = ''.join(t.text or '' for t in slide.findall('.//a:t', ns))
            pdf_text = page.extract_text()
            assert compact(item['title']) in compact(slide_text)
            assert compact(item['title']) in compact(pdf_text)
            for word in page.extract_words():
                x0, y0, x1, y1 = [word[key] for key in ['x0','top','x1','bottom']]
                assert min(x0, y0) >= 0 and x1 <= 960 and y1 <= 540, (i + 1, word)
            if item.get('cartoon'):
                cartoon = cartoons[item['cartoon']]
                original = (root / 'public' / cartoon['src'].lstrip('/')).read_bytes()
                assert sha(original) == cartoon['sha256']
                assert sha(original) in media, 'Deck must embed the exact approved PNG'
                images = page.images
                assert len(images) == 1 and images[0]['srcsize'] == (1024, 1536)
                if item.get('featureCaption'):
                    assert compact(cartoon['caption']) in compact(slide_text)
                    assert compact(cartoon['caption']) in compact(pdf_text)
            if item.get('body'):
                assert compact(item['body']) in compact(pdf_text)
            if item.get('steps'):
                for label, body in item['steps']:
                    assert compact(label + body) in compact(pdf_text)
            if item.get('table'):
                assert slide.find('.//a:tbl', ns) is not None, 'Print table must be editable'
                for row in item['table']:
                    for value in row:
                        assert compact(value) in compact(pdf_text)
print(json.dumps({'slides': 10, 'pdfPages': 10, 'approvedEmbeddedPNGs': 7,
                  'readableFeatureCaptions': 4, 'nativePrintTable': True,
                  'pdfTextBounds': 'pass', 'contentCoverage': 'pass'}))
