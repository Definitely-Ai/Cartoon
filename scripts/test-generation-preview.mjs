import test from 'node:test';
import assert from 'node:assert/strict';
import {verifiedPreview,defaultGenerationJob,approvedThumbnail} from '../lib/generation-preview.ts';

const art={name:'cartoon-01.png',sha256:'a'.repeat(64),kind:'image'};
const review={imageName:art.name,imageSha256:art.sha256,eligible:true,decision:'draft'};
test('artwork stays hidden until the exact image has passed the current review',()=>{
  assert.equal(verifiedPreview(art),false);
  assert.equal(verifiedPreview(art,{...review,eligible:false}),false);
  assert.equal(verifiedPreview(art,{...review,imageName:'cartoon-02.png'}),false);
  assert.equal(verifiedPreview(art,{...review,imageSha256:'b'.repeat(64)}),false);
  assert.equal(verifiedPreview(art,review),true); // Private review does not require publishing.
});
test('the studio never selects a historical completed cartoon by default',()=>{
  const old={id:'old',status:'succeeded'},running={id:'running',status:'running'};
  const queued={id:'queued',status:'queued',dueAt:'2026-09-15T00:00:00Z'};
  const now=Date.parse('2026-09-15T12:00:00Z');
  assert.equal(defaultGenerationJob([old],now),undefined);
  assert.equal(defaultGenerationJob([old,queued,running],now),running);
  assert.equal(defaultGenerationJob([old,queued],now),queued);
  assert.equal(defaultGenerationJob([old,{...queued,scheduleStatus:'paused'}],now),undefined);
  assert.equal(defaultGenerationJob([old,{...queued,dueAt:'2026-09-16T12:00:00Z'}],now),undefined);
});
test('request cards do not fetch unchecked or partially approved batch thumbnails',()=>{
  const job={artifacts:[art],editorial:{draft:0,approved:1,rejected:0,withdrawn:0}};
  assert.equal(approvedThumbnail(job),art);
  assert.equal(approvedThumbnail({...job,editorial:undefined}),undefined);
  assert.equal(approvedThumbnail({...job,editorial:{...job.editorial,approved:0,draft:1}}),undefined);
  assert.equal(approvedThumbnail({...job,artifacts:[art,{...art,name:'cartoon-02.png'}]}),undefined);
  assert.equal(approvedThumbnail({...job,editorial:{...job.editorial,withdrawn:1}}),undefined);
});
