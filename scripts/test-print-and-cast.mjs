import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import path from 'node:path';
import ts from 'typescript';
import sharp from 'sharp';
import { PDFDocument, PDFName, PrintScaling } from 'pdf-lib';

const require = createRequire(import.meta.url);
function loadTS(file) {
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => id === './cartoon-print' ? loadTS('lib/cartoon-print.ts') : require(id), mod, mod.exports);
  return mod.exports;
}
const { printMetrics, PRINT_SIZES, PRINT_PAPERS } = loadTS('lib/cartoon-print.ts');
const { cartoonPrintPDF } = loadTS('lib/cartoon-print-pdf.ts');
const json = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const cartoons = [...await json('lib/city-editions.json'), ...await json('lib/best-of-cartoons.json')];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

test('four physical sizes preserve the whole cartoon and report native effective PPI on both papers', () => {
  for (const paper of PRINT_PAPERS) {
    for (const [i, size] of PRINT_SIZES.entries()) {
      const m = printMetrics(1024, 1536, size.id, paper.id);
      assert.ok(Math.abs(m.width - size.width) < 1e-10);
      assert.ok(Math.abs(m.height - size.height) < 1e-10);
      assert.equal(m.ppi, [301, 256, 205, 171][i]);
      assert.ok(m.width <= paper.width - 1 && m.height <= paper.height - 1);
    }
  }
  assert.equal(printMetrics(2048, 1024, 'fine', 'letter').height, 1.7);
  for (const args of [[0,1536,'fine','letter'],[1024,NaN,'fine','letter'],[Infinity,1536,'fine','letter'],[1024,1536,'unknown','letter'],[1024,1536,'fine','unknown']]) {
    assert.throws(() => printMetrics(...args), /Invalid print configuration/);
  }
});

test('exact-size PDFs retain native embedded pixels, correct paper and no automatic scaling', async () => {
  const bytes = await fs.readFile('public' + cartoons[0].src);
  for (const paper of PRINT_PAPERS) for (const size of PRINT_SIZES) {
    const pdf = await PDFDocument.load(await cartoonPrintPDF(bytes, cartoons[0].title, 1024, 1536, size.id, paper.id));
    assert.equal(pdf.getPageCount(), 1);
    assert.ok(Math.abs(pdf.getPage(0).getWidth() - paper.width * 72) < 1e-8);
    assert.ok(Math.abs(pdf.getPage(0).getHeight() - paper.height * 72) < 1e-8);
    assert.equal(pdf.catalog.getOrCreateViewerPreferences().getPrintScaling(), PrintScaling.None);
    const objects = pdf.getPage(0).node.Resources().lookup(PDFName.of('XObject'));
    assert.equal(objects.entries().length, 1);
    const embedded = objects.lookup(objects.keys()[0]);
    assert.equal(embedded.dict.lookup(PDFName.of('Width')).asNumber(), 1024);
    assert.equal(embedded.dict.lookup(PDFName.of('Height')).asNumber(), 1536);
  }
  await assert.rejects(cartoonPrintPDF(bytes, 'Mismatch', 1000, 1536, 'fine', 'letter'), /dimensions changed/);
});

test('all 40 print sources match the existing published cartoons', async () => {
  assert.equal(cartoons.length, 40);
  assert.equal(new Set(cartoons.map(c => c.id)).size, 40);
  for (const c of cartoons) {
    const bytes = await fs.readFile('public' + c.src);
    assert.equal(hash(bytes), c.sha256, c.id);
    const meta = await sharp(bytes).metadata();
    assert.equal(meta.width, c.width); assert.equal(meta.height, c.height);
  }
});

test('cast packet uses nine current speaking/listening crops and nine matching signature crops', async () => {
  const cast = await json('lib/cast-dossiers.json');
  assert.deepEqual(cast.map(c => c.id), ['drew', 'barclay', 'abby']);
  const root = 'public/gallery/cast-dossiers-20260914-v1';
  const manifest = await json(root + '/manifest.json');
  assert.equal(manifest.assets.length, 18);
  for (const member of cast) {
    const assets = manifest.assets.filter(a => a.character === member.id);
    assert.equal(assets.filter(a => a.kind === 'pose').length, 3);
    assert.equal(assets.filter(a => a.kind === 'detail').length, 3);
    for (const a of assets) {
      const bytes = await fs.readFile(root + '/' + a.filename);
      assert.equal(hash(bytes), a.sha256);
      const meta = await sharp(bytes).metadata();
      assert.equal(meta.width, a.width); assert.equal(meta.height, a.height);
      if (a.kind === 'pose') {
        assert.match(a.source, /^canon\/fixed-set\/barclay-reference-v1\/acting\/trio-(drew|barclay|abby)\.png$/);
        const pose = member.poses.find(p => p.key === a.key);
        assert.equal(pose.actor, a.actorId);
        assert.equal(a.acting.mouth, a.key === 'speaking' ? 'open' : 'closed');
        if (a.key.startsWith('listening-')) assert.equal(a.acting.lookAt.toLowerCase(), a.key.slice(10));
      } else assert.equal(a.source, `public/gallery/cast-september-2026/${member.id}.png`);
      // Optional studio provenance check: CI can validate deliverables without the Windows art drive.
      const source = a.kind === 'detail' ? a.source : path.join(process.env.CARTOON_STUDIO_ROOT || 'Z:/ImageGenerator/Cartoon', a.source);
      if (a.kind === 'detail' || process.env.CARTOON_STUDIO_ROOT || await fs.stat(source).then(() => true, () => false)) {
        const original = await fs.readFile(source);
        assert.equal(hash(original), a.sourceSha256);
        const [left,top,width,height] = a.crop;
        const expected = await sharp(original).extract({left,top,width,height}).raw().toBuffer();
        assert.deepEqual(await sharp(bytes).raw().toBuffer(), expected, a.filename);
      }
    }
    const pdf = await PDFDocument.load(await fs.readFile(`${root}/${member.id}.pdf`));
    assert.equal(pdf.getPageCount(), 3);
  }
  assert.equal((await PDFDocument.load(await fs.readFile(root + '/the-swinging-door-cast.pdf'))).getPageCount(), 9);
});
