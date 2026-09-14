import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {REQUIRED_PRODUCTION_FILES} from './automation/production-adapter.mjs';
const json=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const identity=await json('lib/cast-identity.json');
const acting=await json(identity.actingManifest);
const proof=await json('docs/artwork/barclay-reference-rollout.json');
const items=[...await json('lib/best-of-cartoons.json'),...await json('lib/city-editions.json')];
const crop={left:712,top:620,width:312,height:370};
const face=async input=>sharp(input).extract(crop).removeAlpha().toColourspace('srgb').raw().toBuffer();

test('the exact approved portrait is shared by the website and versioned automation canon',async()=>{
 assert.equal(identity.portraitSha256,'938dcdb8d4fb191ddd7551c2a231b13596db645995fe57e722dfac5ebfb88493');
 assert.equal(sha(await fs.readFile(identity.portraitPath)),identity.portraitSha256);
 assert.equal(sha(await fs.readFile('public/gallery/cast-september-2026/barclay.png')),identity.portraitSha256);
 assert.equal(acting.identitySha256,identity.portraitSha256);
 assert.equal(proof.portraitSha256,identity.portraitSha256);
 assert.match(proof.ownerApproval,/fully implement/);
});

test('all five pinned poses preserve the speaking and gaze contract',async()=>{
 assert.equal(acting.reports.length,5);
 for(const a of acting.reports){
  assert.equal(sha(await fs.readFile(a.framePath)),a.sha256,a.id);
  assert.ok(REQUIRED_PRODUCTION_FILES.includes(a.framePath),a.id);
  assert.equal(a.audit.protectedChangedPixels,0);assert.equal(a.audit.coloredPixels,0);
  const speaker=a.id.split('-')[1];
  for(const [name,pose]of Object.entries(a.acting)){
   assert.equal(pose.mouth,name.toLowerCase()===speaker?'open':'closed');
   if(name.toLowerCase()!==speaker)assert.equal(pose.lookAt.toLowerCase(),speaker);
  }
 }
 assert.ok(REQUIRED_PRODUCTION_FILES.includes(identity.actingManifest));
 assert.ok(REQUIRED_PRODUCTION_FILES.includes(identity.portraitPath));
 assert.ok(!REQUIRED_PRODUCTION_FILES.some(p=>p.includes('best-of-v1/acting')));
 for(const speaker of ['drew','barclay']){
  assert.deepEqual(await face(acting.reports.find(a=>a.id==='duo-'+speaker).framePath),await face(acting.reports.find(a=>a.id==='trio-'+speaker).framePath));
 }
});

test('every selected and city cartoon carries the new matching face with its published hash',async()=>{
 assert.equal(items.length,40);assert.deepEqual(proof.scope,{bestOf:38,cityEditions:2,actingPlates:5});
 for(const item of items){
  const bytes=await fs.readFile('public'+item.src),record=proof.cartoons.find(c=>c.id===item.id);
  assert.equal(sha(bytes),item.sha256,item.id);assert.equal(record.sha256,item.sha256);
  assert.notEqual(record.sourceSha256,record.sha256);assert.equal(record.audit.protectedChangedPixels,0);
  const actor=acting.reports.find(a=>a.id===item.variant+'-'+item.speaker.toLowerCase());
  assert.deepEqual(await face(bytes),await face(actor.framePath),item.id+' exact face region');
  const m=await sharp(bytes).metadata();assert.equal(m.width,1024);assert.equal(m.height,1536);
 }
});
