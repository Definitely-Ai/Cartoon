import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as crypto from 'node:crypto';
import ts from 'typescript';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function load({secret='',materialize=async()=>({processed:0,failed:0}),signedIn=false}={}) {
  const cache=new Map();
  function compile(file) {
    if(cache.has(file))return cache.get(file);
    const module={exports:{}};cache.set(file,module.exports);
    const require=name=>{
      if(name==='node:crypto')return crypto;
      if(name==='server-only')return {};
      if(name==='next/headers')return {cookies:async()=>({get:()=>({value:'stub'})})};
      if(name.endsWith('backroom-auth'))return {BACKROOM_COOKIE:'stub',isDoorOpen:async()=>signedIn};
      if(name.endsWith('automation-schedules-server'))return {materializeDueSchedules:materialize,listSchedules:()=>{throw Error('Unauthorized database access');}};
      const local=name.replace(/^@\/lib\//,'').replace(/^\.\//,'');
      if(/^automation-(?:studio-core|schedules-core|queue-core)$/.test(local))return compile(`lib/${local}.ts`);
      throw Error(`Unexpected import ${name}`);
    };
    const source=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
    vm.runInNewContext(source,{module,exports:module.exports,require,Date,Intl,Request,Response,URL,Buffer,TextDecoder,process:{env:{CRON_SECRET:secret}}});
    return module.exports;
  }
  return {core:compile('lib/automation-schedules-core.ts'),tick:compile('app/api/gallery/automation/tick/route.ts'),route:compile('app/api/gallery/automation/schedules/route.ts')};
}
const input={location:{name:'Naples',region:'Florida',country:'US',timezone:'America/New_York',coverage:'city'},audience:'Warm local money humor.',quantity:1,cast:'duo',timing:{mode:'daily',date:'2026-09-14',time:'09:00',weekdays:[]}};
const schedule=(overrides={})=>({id:'unused',requestId:'unused',input,status:'active',createdAt:'2026-09-14T10:00:00Z',updatedAt:'2026-09-14T10:00:00Z',validatedAt:'2026-09-14T10:00:00Z',cursorAt:'2026-09-14T12:59:59.999Z',...overrides});
test('schedule cursor is exclusive and materialization is repeatable',()=>{
  const {core}=load();const now=new Date('2026-09-14T13:00:00Z');
  const first=core.scheduleBatch(schedule(),now);
  assert.equal(first.dates[0],'2026-09-14T13:00:00.000Z');assert.equal(first.dates.length,8);
  assert.deepEqual(core.scheduleBatch(schedule(),now),first);
  assert.equal(core.scheduleBatch(schedule({cursorAt:first.nextCursor}),now).dates.length,0);
});
test('long offline backlog is retained in bounded nonoverlapping batches',()=>{
  const {core}=load();const now=new Date('2026-12-20T15:00:00Z');
  const first=core.scheduleBatch(schedule(),now);assert.equal(first.dates.length,52);
  const second=core.scheduleBatch(schedule({cursorAt:first.nextCursor}),now);assert.equal(second.dates.length,52);
  assert.equal(first.dates[0],'2026-09-14T13:00:00.000Z');assert.ok(Date.parse(second.dates[0])>Date.parse(first.dates.at(-1)));
  assert.equal(new Set([...first.dates,...second.dates]).size,104);
});
test('paused schedules preserve the cursor and pending dates',()=>{
  const {core}=load();const original=schedule({status:'paused'}),batch=core.scheduleBatch(original,new Date('2026-12-20T15:00:00Z'));
  assert.equal(batch.dates.length,0);assert.equal(batch.nextCursor,original.cursorAt);
});
test('daily local wall time follows daylight saving time',()=>{
  const {core}=load();const item=schedule({input:{...input,timing:{...input.timing,date:'2026-10-31',time:'09:00'}},validatedAt:'2026-10-30T12:00:00Z',cursorAt:'2026-10-31T12:59:59.999Z'});
  const batch=core.scheduleBatch(item,new Date('2026-11-02T00:00:00Z'));
  assert.equal(batch.dates[0],'2026-10-31T13:00:00.000Z');assert.equal(batch.dates[1],'2026-11-01T14:00:00.000Z');
});
test('nonexistent spring-forward local times are skipped without shifting the schedule',()=>{
  const {core}=load();const item=schedule({input:{...input,timing:{...input.timing,date:'2027-03-13',time:'02:30'}},validatedAt:'2027-03-12T12:00:00Z',cursorAt:'2027-03-13T07:29:59.999Z'});
  const batch=core.scheduleBatch(item,new Date('2027-03-15T00:00:00Z'));
  assert.equal(batch.dates[0],'2027-03-13T07:30:00.000Z');assert.equal(batch.dates[1],'2027-03-15T06:30:00.000Z');
});
test('cron fails closed without a configured secret or with a wrong bearer',async()=>{
  for(const secret of ['', 'short', 'test-secret-'.repeat(4)]) {
    const {tick}=load({secret,materialize:()=>{throw Error('Must not run');}});
    assert.equal((await tick.GET(new Request('https://studio.example/api/gallery/automation/tick'))).status,401);
    assert.equal((await tick.GET(new Request('https://studio.example/api/gallery/automation/tick',{headers:{Authorization:'Bearer wrong'}}))).status,401);
  }
});
test('authenticated cron returns success or retryable failure without exposing internals',async()=>{
  const secret='test-secret-'.repeat(4);const req=()=>new Request('https://studio.example/api/gallery/automation/tick',{headers:{Authorization:`Bearer ${secret}`}});
  assert.equal((await load({secret}).tick.GET(req())).status,200);
  assert.equal((await load({secret,materialize:async()=>({processed:1,failed:1})}).tick.GET(req())).status,503);
  const failed=await load({secret,materialize:async()=>{throw Error('private details');}}).tick.GET(req());
  assert.equal(failed.status,503);assert.doesNotMatch(await failed.text(),/private details/);
});
test('schedule owner routes reject unauthenticated reads and mutations',async()=>{
  const {route}=load();const url='https://studio.example/api/gallery/automation/schedules';
  for(const method of ['GET','POST','PATCH'])assert.equal((await route[method](new Request(url,{method}))).status,401);
});
