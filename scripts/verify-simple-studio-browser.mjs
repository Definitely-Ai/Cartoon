// Read-only production QA. Optional local-only login verifies the root redirect;
// no production credentials, saved preferences, or generation jobs are submitted.
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.QA_BASE_URL || 'http://localhost:21361';
const dir = 'output/simple-studio-verified';
await fs.mkdir(dir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const expected = ['Cartoons', 'Generate', 'Cast', 'Presentation'];
  const paths = ['/gallery/best-of', '/gallery/automation', '/gallery/cast', '/gallery/presentation'];
  for (let i = 0; i < paths.length; i++) {
    await page.goto(base + paths[i]);
    const nav = page.getByRole('navigation', { name: 'Studio', exact: true });
    assert.deepEqual(await nav.getByRole('link').allTextContents(), expected);
    assert.equal(await nav.locator('[aria-current="page"]').innerText(), expected[i]);
    assert.equal(await page.getByRole('navigation', { name: 'Elsewhere' }).count(), 0);
    assert.equal(await page.locator('h1').count(), 1);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${paths[i]} overflow at ${width}`);
      const rects = await nav.locator('a').evaluateAll(links => links.map(a => {
        const r = a.getBoundingClientRect(); return { x: r.x, right: r.right, y: r.y, width: r.width, height: r.height, after: getComputedStyle(a, '::after').content };
      }));
      assert.ok(rects.every(r => r.height >= 44 && r.width >= 44 && ['none', 'normal'].includes(r.after)), 'Tap targets must be real and non-overlapping');
      assert.ok(rects.slice(1).every((r, n) => r.x >= rects[n].right && r.y === rects[n].y), 'All four tabs must fit on one line');
      if (i === 0 && [390, 1440].includes(width)) await page.screenshot({ path: `${dir}/cartoons-${width}.png` });
    }
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.locator('.studio-footer').isVisible(), false);
    assert.equal(await page.locator('.br-head').isVisible(), false);
    await page.emulateMedia({ media: 'screen' });
  }
  await page.goto(base + '/gallery/automation/planner');
  assert.equal(await page.locator('.br-nav [aria-current="page"]').innerText(), 'Generate');
  await page.goto(base + '/gallery/cast/print/barclay');
  assert.equal(await page.locator('.br-nav [aria-current="page"]').innerText(), 'Cast');
  await page.goto(base + '/gallery/best-of');
  assert.equal(await page.locator('.best-of-card').count(), 40);
  assert.equal(await page.getByRole('group', { name: 'Who’s speaking?' }).isVisible(), false);
  await page.getByRole('button', { name: 'Filters', exact: false }).click();
  await page.getByRole('button', { name: 'Abby', exact: true }).click();
  assert.ok(await page.locator('.best-of-card').count() > 0 && await page.locator('.best-of-card').count() < 40);
  await page.getByRole('button', { name: 'Filters (1)', exact: false }).click();
  assert.equal(await page.getByRole('group', { name: 'Who’s speaking?' }).isVisible(), false);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByRole('searchbox', { name: /Find a cartoon/i }).fill('suitcase');
  assert.ok(await page.locator('.best-of-card').count() < 40);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  assert.equal(await page.locator('.best-of-card').count(), 40);
  assert.equal(await page.getByRole('link', { name: /Print & size options/ }).count(), 40);
  assert.equal(await page.getByRole('link', { name: /Download PNG/ }).count(), 40);
  await page.getByRole('navigation', { name: 'Studio', exact: true }).getByRole('link', { name: 'Generate', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.waitForURL('**/gallery/automation');
  await page.locator('.studio-resources summary').click();
  assert.equal(await page.getByRole('link', { name: 'Image archive', exact: true }).isVisible(), true);
  assert.equal(await page.getByRole('link', { name: 'Progress reports', exact: true }).isVisible(), true);
  const local = ['localhost', '127.0.0.1'].includes(new URL(base).hostname);
  if (local && process.env.ADMIN_PASSWORD) {
    const login = await page.request.post(base + '/api/backroom/login', {
      form: { username: process.env.ADMIN_USERNAME || 'theswingingdoor', password: process.env.ADMIN_PASSWORD }, maxRedirects: 0,
    });
    assert.equal(login.status(), 303);
    await page.goto(base + '/');
    await page.waitForURL('**/gallery/best-of');
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ base, tabs: expected, widths: [320, 390, 768, 1440], collection: 40, preservedPrintControls: true, keyboard: true, printChromeHidden: true, rootRedirect: local && !!process.env.ADMIN_PASSWORD, errors }));
} finally { await browser.close(); }
