// Bounded file / HTTP checks. No browser automation or physical printing.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = '/gallery/cast-september-2026';
const local = path.resolve(`public${root}`);
const members = JSON.parse(await fs.readFile('lib/cast-presentation.json', 'utf8'));
const manifest = JSON.parse(await fs.readFile(path.join(local, 'manifest.json'), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
assert.deepEqual(members.map(member => member.id), ['drew', 'barclay', 'abby']);
const files = [];
for (const member of members) {
  const bytes = await fs.readFile(path.join(local, `${member.id}.png`));
  const record = manifest.portraits.find(portrait => portrait.id === member.id);
  assert.equal(sha(bytes), record.sha256, `${member.name}: published portrait hash`);
  const { data, info } = await sharp(bytes).toColourspace('srgb').removeAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 1024);
  assert.equal(info.height, 1536);
  for (let i = 0; i < data.length; i += 3) {
    assert.ok(data[i] === data[i + 1] && data[i] === data[i + 2], `${member.name}: grayscale`);
  }
  assert.equal(member.details.length, 3);
  files.push(`${member.id}.png`, `${member.id}.pdf`);
}
files.push('the-swinging-door-cast.pdf');
for (const file of files.filter(file => file.endsWith('.pdf'))) {
  assert.equal((await fs.readFile(path.join(local, file))).subarray(0, 5).toString(), '%PDF-');
}
console.log('PASS: three versioned grayscale portraits and four PDF assets.');

if (process.argv[2]) {
  const base = new URL(process.argv[2]);
  const routes = ['/gallery/cast', '/gallery/cast/print/all', ...members.map(member => `/gallery/cast/print/${member.id}`)];
  for (const route of routes) {
    const response = await fetch(new URL(route, base), { redirect: 'manual', signal: AbortSignal.timeout(30000) });
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get('content-type'), /text\/html/);
    await response.body.cancel();
    console.log(`PASS: ${route} is public and returns HTML.`);
  }
  const missing = await fetch(new URL('/gallery/cast/print/not-a-character', base), { redirect: 'manual', signal: AbortSignal.timeout(30000) });
  // The production pre-rendered route rejects unknown character IDs.
  assert.equal(missing.status, 404);
  await missing.body.cancel();
  for (const file of files) {
    const response = await fetch(new URL(`${root}/${file}`, base), { redirect: 'manual', signal: AbortSignal.timeout(30000) });
    assert.equal(response.status, 200, file);
    assert.match(response.headers.get('content-type'), file.endsWith('.pdf') ? /application\/pdf/ : /image\/png/);
    const actual = Buffer.from(await response.arrayBuffer());
    assert.equal(sha(actual), sha(await fs.readFile(path.join(local, file))), `${file}: exact delivered bytes`);
    console.log(`PASS: ${file} downloads without sign-in and matches the checked file.`);
  }
}
