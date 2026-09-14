import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {hash,atomicWrite,readJSON,inside,acquireSingleton,verifyRuntime,WorkerAPI,WorkerError,JobContext,processJob,deliverArtifacts,safeMessage,delay} from './automation/worker-core.mjs';
import {validateDraft,castAt,localJSON,approvedMachineReview} from './automation/production-adapter.mjs';

test('reviewer None sentinel is empty but actual concerns and failed criteria remain blocking',()=>{
  const review={accept:true,score:9,confidence:.98,noHumans:true,noWriting:true,clearSubject:true,sharpAndCoherent:true,reason:'A clear and coherent monochrome illustration.',problems:['None']};
  assert.equal(approvedMachineReview(review,{visual:true}),true);
  assert.equal(approvedMachineReview({...review,problems:['None except a blurry window']},{visual:true}),false);
  assert.equal(approvedMachineReview({...review,problems:['None','Visible text']},{visual:true}),false);
  assert.equal(approvedMachineReview({...review,noWriting:false},{visual:true}),false);
  assert.equal(approvedMachineReview({...review,score:7},{visual:true}),false);
});

test('Comfy memory-release success accepts an empty body without parsing JSON',async t=>{
  t.mock.method(globalThis,'fetch',async()=>new Response(null,{status:200}));
  assert.deepEqual(await localJSON('http://127.0.0.1:8188/free',{method:'POST'},undefined,true),{ok:true});
  await assert.rejects(localJSON('http://127.0.0.1:8188/queue'));
});

test('opening speakers vary across editions but stay stable across retries',()=>{
  const input={cast:'mixed'};
  const speakers=Array.from({length:20},(_,i)=>castAt(input,0,'edition-'+i).speaker);
  assert.deepEqual([...new Set(speakers)].sort(),['Abby','Barclay','Drew']);
  assert.deepEqual(castAt(input,0,'same-job'),castAt(input,0,'same-job'));
  for(let i=0;i<20;i++)assert.notEqual(castAt({cast:'duo'},0,'edition-'+i).speaker,'Abby');
});

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6AAAAAElFTkSuQmCC','base64');
const id='12345678-1234-4234-8234-123456789abc';
const job=()=>({id,attempt:1,leaseToken:'12345678-1234-4234-8234-123456789def',leaseExpiresAt:new Date(Date.now()+180000).toISOString(),input:{quantity:1,location:{name:'Naples'}}});
async function fixture(t) {
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'cartoon-worker-test-'));
  t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const runtime=path.join(dir,'runtime'),state=path.join(dir,'state');await fs.mkdir(runtime);await fs.mkdir(state);
  await fs.writeFile(path.join(runtime,'pin.txt'),'fixture runtime, not real cartoon generation');
  return {apiOrigin:'https://site.example',storageOrigin:'https://storage.example',workerId:'fixture-worker',token:'test-token-never-real',workspaceRoot:runtime,stateRoot:state,heartbeatMs:1000,runtimePins:[{path:'pin.txt',sha256:hash('fixture runtime, not real cartoon generation')}]};
}
function serverStub({complete,heartbeat,upload}={}) {
  const calls=[];
  return {calls,async call(body) {
    calls.push(body);
    if(body.action==='heartbeat')return heartbeat?heartbeat(body):{job:{leaseExpiresAt:new Date(Date.now()+180000).toISOString()}};
    if(body.action==='upload')return upload?upload(body):{uploadUrl:`https://storage.example/storage/v1/object/upload/sign/private/${body.jobId}/1/${body.artifact.name}?token=signed-test-only`,path:`${body.jobId}/1/${body.artifact.name}`};
    if(body.action==='complete')return complete?complete(body):{job:{status:'completed'}};
    if(body.action==='fail')return {job:{status:'queued'}};
    throw Error('Unexpected stub action');
  }};
}
async function fixtureAdapter(ctx) {
  await ctx.step('fixture-render',{kind:'test-only'},async()=>{await atomicWrite(path.join(ctx.dir,'fixture.png'),png);return {testOnly:true};},{recover:async()=>{}});
  return [await ctx.artifact('fixture.png','image','image/png')];
}

test('atomic checkpoints retain complete JSON and reject escaping runtime paths',async t=>{
  const config=await fixture(t),file=path.join(config.stateRoot,'state.json');
  await atomicWrite(file,{revision:1});await atomicWrite(file,{revision:2});
  assert.equal((await readJSON(file)).revision,2);
  await assert.rejects(inside(config.workspaceRoot,'../state/state.json'),/escapes/);
  await verifyRuntime(config);await fs.writeFile(path.join(config.workspaceRoot,'pin.txt'),'changed');
  await assert.rejects(verifyRuntime(config),/changed/);
});
test('singleton rejects a second live worker and recovers a reused PID with different birth time',async t=>{
  const config=await fixture(t),birth=async()=> 'current-process-birth';
  const release=await acquireSingleton(config.stateRoot,{birth});
  await assert.rejects(acquireSingleton(config.stateRoot,{birth}),/already owns/);
  await release();
  await atomicWrite(path.join(config.stateRoot,'worker.lock'),{pid:process.pid,processBirth:'old-boot-different-process',token:'previous',startedAt:'2000-01-01'});
  const recovered=await acquireSingleton(config.stateRoot,{birth});
  assert.equal((await readJSON(path.join(config.stateRoot,'worker.lock'))).processBirth,'current-process-birth');
  await recovered();
});
test('completed stages replay their retained value and running effects need an explicit recovery rule',async t=>{
  const config=await fixture(t),api=serverStub(),ctx=new JobContext(config,job(),api,new AbortController().signal);await ctx.initialize();
  let count=0;assert.equal(await ctx.step('one',{x:1},async()=>++count),1);
  const second=new JobContext(config,job(),api,new AbortController().signal);await second.initialize();
  assert.equal(await second.step('one',{x:1},async()=>++count),1);assert.equal(count,1);
  await assert.rejects(second.step('one',{x:2},async()=>2),/request changed/);
  second.state.stages.uncertain={status:'running',requestHash:hash({x:3})};await second.flush();
  await assert.rejects(second.step('uncertain',{x:3},async()=>3),/recovery route/);
});
test('fixture work completes with one unsigned binary upload and exact retained manifest',async t=>{
  const config=await fixture(t),api=serverStub();let uploads=0;
  const result=await processJob(config,job(),api,fixtureAdapter,{fetchImpl:async(url,init)=>{
    uploads++;assert.equal(new URL(url).origin,config.storageOrigin);assert.equal(init.method,'PUT');
    assert.equal(init.headers.Authorization,undefined);assert.equal(init.headers.apikey,undefined);
    assert.equal(hash(init.body),hash(png));return new Response(null,{status:200});
  }});
  assert.equal(result.status,'completed');assert.equal(uploads,1);
  const manifest=api.calls.find(c=>c.action==='complete').artifacts;
  assert.equal(manifest[0].sha256,hash(png));assert.equal(manifest[0].file,undefined);
  assert.equal((await readJSON(path.join(config.stateRoot,'jobs',id,'checkpoint.json'))).completed.manifestHash,hash(manifest));
});
test('lost completion response retries the same manifest without new rendering or binary upload',async t=>{
  const config=await fixture(t);let completeCalls=0,uploads=0,renders=0;const accepted=new Set();
  const api=serverStub({complete:async body=>{completeCalls++;accepted.add(hash(body.artifacts));if(completeCalls===1)throw new WorkerError('Response lost',{retryable:true});return {job:{status:'completed'}};}});
  const adapter=async ctx=>{await ctx.step('counted-render',{},async()=>{renders++;await atomicWrite(path.join(ctx.dir,'fixture.png'),png);return true;},{recover:async()=>{}});return [await ctx.artifact('fixture.png','image','image/png')];};
  const options={fetchImpl:async()=>{uploads++;return new Response(null,{status:200});}};
  assert.equal((await processJob(config,job(),api,adapter,options)).status,'failed');
  assert.equal((await processJob(config,job(),api,adapter,options)).status,'completed');
  assert.equal(completeCalls,2);assert.equal(accepted.size,1);assert.equal(renders,1);assert.equal(uploads,1);
});
test('fencing loss aborts subsequent effects and never completes or fails with a stale lease',async t=>{
  const config=await fixture(t);let effects=0;
  const api=serverStub({heartbeat:async()=>{throw new WorkerError('stale',{leaseLost:true,status:409});}});
  const result=await processJob(config,job(),api,async ctx=>{await delay(30,ctx.signal);ctx.assertLease();effects++;return fixtureAdapter(ctx);});
  assert.equal(result.status,'lease-lost');assert.equal(effects,0);
  assert.equal(api.calls.some(c=>['complete','fail','upload'].includes(c.action)),false);
});
test('shutdown does not prematurely report completion or enqueue failure while inference may continue',async t=>{
  const config=await fixture(t),api=serverStub(),stop=new AbortController();
  const result=await processJob(config,job(),api,async ctx=>{stop.abort(new Error('test SIGTERM'));await delay(10,ctx.signal);return [];},{signal:stop.signal});
  assert.equal(result.status,'lease-lost');assert.equal(api.calls.some(c=>['complete','fail'].includes(c.action)),false);
});
test('upload destination must match configured origin and job-attempt artifact path',async t=>{
  for(const wrong of ['origin','path']) {
    const config=await fixture(t),api=serverStub({upload:async body=>({uploadUrl:`https://${wrong==='origin'?'attacker':'storage'}.example/storage/v1/object/upload/sign/private/${body.jobId}/1/${body.artifact.name}`,path:wrong==='path'?'other/1/fixture.png':`${body.jobId}/1/${body.artifact.name}`})});
    let sends=0;const result=await processJob(config,job(),api,fixtureAdapter,{fetchImpl:async()=>{sends++;return new Response();}});
    assert.equal(result.status,'failed');assert.equal(sends,0);
  }
});
test('only documented duplicate storage errors advance to server hash verification',async t=>{
  for(const [response,expected] of [[new Response(null,{status:409}),'completed'],[Response.json({statusCode:'409',error:'Duplicate',message:'The resource already exists'},{status:400}),'completed'],[Response.json({code:'already_exists'},{status:400}),'completed'],[Response.json({error:'BadInput'},{status:400}),'failed']]) {
    const config=await fixture(t),api=serverStub();
    assert.equal((await processJob(config,job(),api,fixtureAdapter,{fetchImpl:async()=>response})).status,expected);
  }
});
test('API credentials stay on the control endpoint and raw failures are redacted',async()=>{
  let sent;
  const api=new WorkerAPI({apiOrigin:'https://site.example',token:'secret-control'},async(url,init)=>{sent={url,init};return Response.json({job:null});});
  assert.deepEqual(await api.call({action:'claim'}),{job:null});
  assert.equal(sent.url,'https://site.example/api/gallery/automation/worker');assert.equal(sent.init.headers.Authorization,'Bearer secret-control');
  assert.equal(sent.init.redirect,'error');
  assert.doesNotMatch(safeMessage(new WorkerError('Failure Bearer secret-control https://storage.example/?token=secret-control'),['secret-control']),/secret-control|storage\.example/);
});
test('actual killed fixture process resumes completed work without repeating its effect',async t=>{
  const config=await fixture(t),coreURL=pathToFileURL(path.join(root,'scripts/automation/worker-core.mjs')).href;
  const code=`import fs from 'node:fs/promises';import path from 'node:path';import {JobContext,atomicWrite} from ${JSON.stringify(coreURL)};const config=${JSON.stringify(config)},job=${JSON.stringify(job())};const ctx=new JobContext(config,job,{},new AbortController().signal);await ctx.initialize();await ctx.step('committed',{},async()=>{await atomicWrite(path.join(ctx.dir,'effect.json'),{count:1});return 'retained';});await ctx.step('interrupted',{},async()=>{process.stdout.write('ready\\n');await new Promise(()=>{});});`;
  const child=spawn(process.execPath,['--input-type=module','-e',code],{windowsHide:true,stdio:['ignore','pipe','pipe']});
  let errorOutput='';child.stderr.on('data',b=>errorOutput+=b);
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Fixture did not reach checkpoint: '+errorOutput)),10000);child.stdout.on('data',()=>{clearTimeout(timer);resolve();});child.once('exit',()=>{clearTimeout(timer);reject(Error('Fixture exited early: '+errorOutput));});});
  const exited=new Promise(resolve=>child.once('exit',resolve));child.kill();await exited;
  const ctx=new JobContext(config,job(),{},new AbortController().signal);await ctx.initialize();
  const value=await ctx.step('committed',{},async()=>{throw Error('Committed effect repeated');});assert.equal(value,'retained');
  assert.equal((await readJSON(path.join(ctx.dir,'effect.json'))).count,1);
  assert.equal(ctx.state.stages.interrupted.status,'running');
  await ctx.step('interrupted',{},async()=>({recoveredFixture:true}),{recover:async()=>{}});
  assert.equal(ctx.state.stages.interrupted.status,'done');
});
test('production mechanical checks reject weak formats and preserve clear source-independent caption structure',()=>{
  const draft={caption:'My retirement plan now includes a separate retirement plan for the boat.',speaker:'Barclay',tvHeadline:'BOAT OWNERSHIP',tvBrief:'An empty wooden marina with a modest sailing boat at its dock.',boardLines:['Fish sandwich','$18','Dockside extra'],explanation:'The boat creates a second household budget beyond the owner’s retirement budget.'};
  assert.equal(validateDraft(draft,'Barclay').speaker,'Barclay');
  assert.throws(()=>validateDraft(draft,'Drew'),/mechanical/);
  assert.throws(()=>validateDraft(draft,'Barclay',[draft.caption]),/duplicate/);
  assert.throws(()=>validateDraft({...draft,boardLines:['Fish sandwich','$2/hour']},'Barclay'),/Chalk/);
  assert.throws(()=>validateDraft({...draft,tvHeadline:'BOAT PRICES UP 20%'},'Barclay'),/headline/);
});
