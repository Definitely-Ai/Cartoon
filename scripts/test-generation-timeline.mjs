import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const code=ts.transpileModule(fs.readFileSync('lib/generation-timeline.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const module={exports:{}};new Function('exports',code)(module.exports);
const {generationTimeline}=module.exports;
const job=(status,stage)=>({status,progress:{stage,completed:6,total:7}});
test('timeline follows worker phase, never percentage or elapsed time',()=>{
  assert.deepEqual(generationTimeline(job('running','tv-02-1')).map(s=>s.state),['complete','complete','current','pending','pending']);
  assert.deepEqual(generationTimeline(job('running','draft-03-2')).map(s=>s.state),['complete','current','pending','pending','pending']);
  assert.equal(generationTimeline(job('running','uploading'))[4].state,'current');
});
test('unknown, waiting, paused and failed phases do not invent completed steps',()=>{
  for(const [status,stage] of [['queued','tv-02-1'],['running','waiting-gpu'],['running','unrecognized'],['failed','compose-01']])assert.ok(generationTimeline(job(status,stage)).every(s=>s.state==='pending'));
});
test('all phases complete only after successful delivery',()=>{
  assert.ok(generationTimeline(job('succeeded','Ready')).every(s=>s.state==='complete'));
  assert.equal(generationTimeline(job('running','uploading')).filter(s=>s.state==='complete').length,4);
});
