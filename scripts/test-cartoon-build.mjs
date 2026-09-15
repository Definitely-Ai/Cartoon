// Private assembly contract tests. All HTTP and storage are isolated fixtures.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import ts from 'typescript';
const id='22222222-2222-4222-8222-222222222222',worker='33333333-3333-4333-8333-333333333333',lease='44444444-4444-4444-8444-444444444444';
const stamp=new Date().toISOString(),hash=b=>createHash('sha256').update(b).digest('hex');
const input={location:{name:'Naples',region:'Florida',country:'US',timezone:'America/New_York',coverage:'city'},audience:'Local readers.',quantity:1,cast:'duo',timing:{mode:'now',date:stamp.slice(0,10),time:'09:00',weekdays:[]}};
const bytes=await sharp({create:{width:1024,height:1536,channels:3,background:'#ededed'}}).png().toBuffer();
const coloredBytes=await sharp({create:{width:1024,height:1536,channels:3,background:'#dd0011'}}).png().toBuffer();
function fixture({signedIn=true,broken=false,expired=false,colored=false}={}){
  const storedBytes=colored?coloredBytes:bytes;
  const modules=new Map(),rows=[];let writes=0,reads=0;
  const job={id,owner_key:'backroom-owner',request_id:'12222222-2222-4222-8222-222222222222',input_hash:hash(JSON.stringify(input)),input,status:'running',created_at:stamp,updated_at:stamp,due_at:stamp,available_at:stamp,attempt:1,progress:{stage:'tv-01',completed:3,total:7},last_error:null,artifacts:[],worker_id:worker,lease_token:lease,lease_expires_at:new Date(Date.now()+180000).toISOString(),finished_at:null};
  function compile(file){
    file=file.replaceAll('\\','/');if(modules.has(file))return modules.get(file);
    const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
    const module={exports:{}};modules.set(file,module.exports);
    const require=name=>{if(name==='server-only')return {};if(name==='node:crypto')return {createHash};if(name==='sharp')return sharp;
      if(name==='next/headers')return {cookies:async()=>({get:()=>({value:'test'})})};
      if(name.endsWith('backroom-auth'))return {BACKROOM_COOKIE:'sd_backroom',isDoorOpen:async()=>signedIn};
      if(name.endsWith('automation-schedules-server'))return {materializeDueSchedules:async()=>({})};
      if(name.startsWith('@/lib/'))return compile(name.replace('@/','')+'.ts');
      if(name.startsWith('.'))return compile(path.join(path.dirname(file),name)+'.ts');throw Error('Unexpected module '+name);};
    vm.runInNewContext(source,{module,exports:module.exports,require,fetch:async(url,opts={})=>{
      const u=new URL(url);
      if(u.pathname==='/rest/v1/automation_jobs')return Response.json([job]);
      if(u.pathname==='/rest/v1/cartoon_build_frames')return Response.json(rows);
      if(u.pathname==='/rest/v1/rpc/automation_update_job')return expired?Response.json({code:'40001'},{status:409}):Response.json(job);
      if(u.pathname==='/rest/v1/rpc/save_cartoon_build_frame'){writes++;const frame=JSON.parse(opts.body).p_frame;const row={attempt:1,cartoon_index:frame.index,stage:frame.stage,frame,created_at:stamp};rows.push(row);return Response.json(row);}
      if(u.pathname.includes('/storage/v1/object/authenticated/')){reads++;return new Response(broken?Buffer.from('wrong'):storedBytes,{headers:{'Content-Type':'image/png'}});}
      throw Error('Unexpected fetch '+url);
    },Request,Response,URL,URLSearchParams,AbortSignal,Uint8Array,Buffer,TextDecoder,Intl,Date,process:{env:{SUPABASE_URL:'https://fixture.example',SUPABASE_SERVICE_KEY:'test-only-secret'}}});
    return module.exports;
  }
  const core=compile('lib/cartoon-build-core.ts'),review=compile('lib/cartoon-review-core.ts');
  const name=`build-01-${hash(storedBytes).slice(0,20)}.png`;
  const frame={index:1,stage:'story',variant:'duo',speaker:'Drew',actorSha256:review.APPROVED_CAST.poses['duo-drew'],artifact:{name,kind:'image',contentType:'image/png',bytes:storedBytes.length,sha256:hash(storedBytes),path:`${id}/1/${name}`},caption:'A test caption.',tvHeadline:'HOUSING',boardLines:['House special','$6','Room to spare'],sourceTitle:'Isolated QA source',sourceUrl:'https://example.org/fixture',sourceScope:'Fixture only. Not a real news report.'};
  return {core,frame,job,rows,route:compile('app/api/gallery/automation/build/route.ts'),server:compile('lib/automation-queue-server.ts'),get writes(){return writes},get reads(){return reads}};
}
const request=(query,origin='https://studio.example')=>new Request('https://studio.example/api/gallery/automation/build?'+query,{headers:{Origin:origin}});
const publish=f=>f.server.runWorkerCommand({id:worker,tokenHash:'a'.repeat(64)},{action:'build',jobId:id,leaseToken:lease,frame:f.frame});
test('previews require approved exact cast and bounded typed metadata',()=>{
  const f=fixture();assert.equal(f.core.buildFrame(f.frame).speaker,'Drew');
  for(const patch of [{actorSha256:'a'.repeat(64)},{variant:'duo',speaker:'Abby'},{index:13},{stage:'published'},{sourceUrl:'javascript:alert(1)'},{sourceUrl:'https://user:pass@example.org/'},{caption:'<script>'},{automaticPublication:true}])assert.throws(()=>f.core.buildFrame({...f.frame,...patch}));
});
test('anonymous and cross-site preview reads fail before storage access',async()=>{
  const f=fixture({signedIn:false});assert.equal((await f.route.GET(request('jobId='+id))).status,401);assert.equal(f.reads,0);
  const owner=fixture();assert.equal((await owner.route.GET(request('jobId='+id,'https://other.example'))).status,403);
});
test('worker saves a real verified frame without completing or publishing the job',async()=>{
  const f=fixture();assert.equal((await publish(f)).saved,true);assert.equal(f.writes,1);assert.equal(f.job.status,'running');assert.equal(f.job.artifacts.length,0);
  const result=await f.route.GET(request('jobId='+id));assert.equal(result.status,200);assert.equal((await result.json()).frames.length,1);
  const image=await f.route.GET(request(new URLSearchParams({jobId:id,index:'1',stage:'story',sha256:hash(bytes)})));
  assert.equal(image.status,200);assert.equal(image.headers.get('location'),null);assert.equal(image.headers.get('cache-control'),'private, no-store');assert.equal(hash(Buffer.from(await image.arrayBuffer())),hash(bytes));
});
test('stale leases, wrong attempts, tampering and unknown image hashes cannot save or serve a frame',async()=>{
  const expired=fixture({expired:true});await assert.rejects(()=>publish(expired));assert.equal(expired.reads,0);assert.equal(expired.writes,0);
  const wrong=fixture();wrong.frame.artifact.path=wrong.frame.artifact.path.replace('/1/','/2/');await assert.rejects(()=>publish(wrong));assert.equal(wrong.writes,0);
  const broken=fixture({broken:true});await assert.rejects(()=>publish(broken));assert.equal(broken.writes,0);
  const f=fixture();await publish(f);assert.equal((await f.route.GET(request(new URLSearchParams({jobId:id,index:'1',stage:'story',sha256:'f'.repeat(64)})))).status,404);
});
test('recovery retains older saved parts while selecting the newest verified attempt per stage',()=>{
  const f=fixture(),old={...f.frame,attempt:1,savedAt:stamp};
  const current={...old,attempt:2},cast={...old,stage:'cast'};
  const frames=f.core.latestBuildFrames([old,current,cast]);assert.equal(frames.length,2);assert.equal(frames[0].stage,'cast');assert.equal(frames[1].attempt,2);
});
test('a valid image hash cannot smuggle a colored TV or cast preview into the build',async()=>{
  const f=fixture({colored:true});await assert.rejects(()=>publish(f),/strictly black and white/);assert.equal(f.writes,0);
});
