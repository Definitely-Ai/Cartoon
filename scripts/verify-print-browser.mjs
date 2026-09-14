// Optional browser QA. Set PLAYWRIGHT_MODULE to an installed Playwright module path.
// Uses a fresh headless profile, never a signed-in user browser or physical printer.
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://127.0.0.1:21361';
const dir = 'output/print-browser-verified';
await fs.mkdir(dir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ acceptDownloads: true, viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(base + '/gallery/best-of/print/austin-taking-offers');
  for (const [size,paper,width,height] of [['fine','letter',612,792],['large','a4',210/25.4*72,297/25.4*72]]) {
    await page.getByRole('combobox', { name: /Artwork size/ }).selectOption(size);
    await page.getByRole('combobox', { name: /^Paper/ }).selectOption(paper);
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download exact-size PDF' }).click();
    const download = await pending;
    assert.equal(await download.failure(), null);
    const destination = dir + '/' + download.suggestedFilename();
    await download.saveAs(destination);
    const pdf = await PDFDocument.load(await fs.readFile(destination));
    assert.equal(pdf.getPageCount(), 1);
    assert.ok(Math.abs(pdf.getPage(0).getWidth() - width) < .01);
    assert.ok(Math.abs(pdf.getPage(0).getHeight() - height) < .01);
    console.log('Downloaded', download.suggestedFilename(), width, height);
  }
  await page.evaluate(async () => { await document.fonts.ready; await document.querySelector('.cartoon-print-image').decode(); });
  const css = await PDFDocument.load(await page.pdf({ path: dir + '/a4-css-print.pdf', preferCSSPageSize: true, printBackground: true }));
  assert.equal(css.getPageCount(), 1);
  // Chromium rounds its CSS page box by a fraction of a point.
  assert.ok(Math.abs(css.getPage(0).getWidth() - 210/25.4*72) < 1);
  assert.ok(Math.abs(css.getPage(0).getHeight() - 297/25.4*72) < 1);
  await page.goto(base + '/gallery/best-of');
  assert.equal(await page.getByRole('link', { name: /^Print & size options/ }).count(), 40);
  await page.goto(base + '/gallery/cast/print/all');
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.querySelectorAll('.dossier-sheet img')].map(i => i.decode())); });
  assert.equal(await page.locator('.dossier-sheet').count(), 9);
  const packet = await PDFDocument.load(await page.pdf({ path: dir + '/cast-browser-nine-pages.pdf', preferCSSPageSize: true, printBackground: true }));
  assert.equal(packet.getPageCount(), 9);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(errors, []);
  console.log('PASS: real downloads, A4 CSS page size, 40 print links, nine cast print pages, mobile overflow, no browser exceptions.');
} finally { await browser.close(); }
