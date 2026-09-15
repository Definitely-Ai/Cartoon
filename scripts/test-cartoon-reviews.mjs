// Isolated fixtures only. No environment files, network, publication, or model calls.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import ts from 'typescript';
const id='22222222-2222-4222-8222-222222222222',requestId='12222222-2222-4222-8222-222222222222';
const stamp='2026-09-15T14:00:00.000Z',hash=b=>createHash('sha256').update(b).digest('hex');
const input={location:{name:'Chicago',region:'Illinois',country:'US',timezone:'America/Chicago',coverage:'city'},audience:'Local newspaper readers.',quantity:1,cast:'duo',timing:{mode:'now',date:'2026-09-15',time:'09:00',weekdays:[]}};
const image=await sharp({create:{width:1024,height:1536,channels:3,background:'#eeeeee'}}).png().toBuffer();
function load({signedIn=true,legacy=false,brokenHash=false,stale=false,hidden=false}={}){
  const modules=new Map();let saved=null,writes=0,privateReads=0;
  let report,reportBytes,artifacts;
  function compile(file){
    file=file.replaceAll('\\','/');
    if(modules.has(file))return modules.get(file);
    const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
    const module={exports:{}};modules.set(file,module.exports);
    const require=name=>{
      if(name==='server-only')return {};
      if(name==='node:crypto')return {createHash};if(name==='sharp')return sharp;
      if(name==='next/headers')return {cookies:async()=>({get:()=>({value:'fixture-only'})})};
      if(name==='next/cache')return {revalidatePath(){}};
      if(name.endsWith('backroom-auth'))return {BACKROOM_COOKIE:'sd_backroom',isDoorOpen:async()=>signedIn};
      if(name.endsWith('automation-schedules-server'))return {materializeDueSchedules:async()=>({})};
      if(name.startsWith('@/lib/'))return compile(name.replace('@/','')+'.ts');
      if(name.startsWith('.'))return compile(path.join(path.dirname(file),name)+'.ts');
      throw Error('Unexpected import '+name);
    };
    vm.runInNewContext(code,{module,exports:module.exports,require,fetch:async(url,opts={})=>{
      const u=new URL(url);
      if(u.pathname==='/rest/v1/automation_jobs')return Response.json([row()]);
      if(u.pathname==='/rest/v1/automation_workers')return Response.json([]);
      if(u.pathname==='/rest/v1/gallery_visibility')return Response.json(hidden?[{cartoon_id:publicId}]:[]);
      if(u.pathname==='/rest/v1/cartoon_reviews')return Response.json(saved&&(!u.searchParams.has('decision')||u.searchParams.get('decision')==='eq.'+saved.decision)?[saved]:[]);
      if(u.pathname==='/rest/v1/rpc/review_generated_cartoon'){
        writes++;if(stale)return Response.json({code:'40001'},{status:409});const b=JSON.parse(opts.body);
        saved={public_id:b.p_public_id,job_id:id,image_name:b.p_image_name,decision:b.p_decision,version:b.p_expected_version+1,updated_at:stamp,image_sha256:b.p_image_sha256,report_sha256:b.p_report_sha256,snapshot:b.p_snapshot};
        return Response.json(saved);
      }
      if(u.pathname.includes('/storage/v1/object/authenticated/')){
        privateReads++;const isReport=u.pathname.endsWith('.json'),bytes=isReport?reportBytes:image;
        return new Response(isReport&&brokenHash?Buffer.from('{}'):bytes,{headers:{'Content-Type':isReport?'application/json':'image/png'}});
      }
      throw Error('Unexpected fetch '+url);
    },Request,Response,URL,URLSearchParams,AbortSignal,Uint8Array,Buffer,TextDecoder,Intl,Date,process:{env:{SUPABASE_URL:'https://fixture.example',SUPABASE_SERVICE_KEY:'isolated-test-only'}}});
    modules.set(file,module.exports);return module.exports;
  }
  const core=compile('lib/cartoon-review-core.ts');
  const publicId=core.publicationId(id,'cartoon-01.png');
  report={jobId:id,input,castIdentity:legacy?'old':core.APPROVED_CAST.identity,castIdentitySha256:core.APPROVED_CAST.portrait,castHeadSha256:core.APPROVED_CAST.head,sources:[{url:'https://example.org/source',title:'Fixture evidence'}],cartoons:[{name:'cartoon-01.png',sha256:hash(image),caption:'A fixture caption.',speaker:'Drew',variant:'duo',actorId:'duo-drew',actorSha256:core.APPROVED_CAST.poses['duo-drew'],retainedStaticCast:true,tv:{headline:'FIXTURE HEADLINE'},board:{lines:['TODAY / $6']},source:{url:'https://example.org/source'},audit:{protectedChangedPixels:0,coloredPixels:0}}]};
  function rebuild(){reportBytes=Buffer.from(JSON.stringify(report));artifacts=[{name:'cartoon-01.png',kind:'image',contentType:'image/png',bytes:image.length,sha256:hash(image),path:`backroom-owner/${id}/attempt-1/cartoon-01.png`},{name:'edition-report.json',kind:'report',contentType:'application/json',bytes:reportBytes.length,sha256:hash(reportBytes),path:`backroom-owner/${id}/attempt-1/edition-report.json`}];}
  // Use the real immutable path grammar, not a hand-built approximation.
  const queue=compile('lib/automation-queue-core.ts');
  const oldRebuild=rebuild;
  function manifest(){oldRebuild();artifacts.forEach(a=>a.path=queue.artifactPath(id,1,a.name));}
  manifest();
  function row(){return {id,owner_key:'backroom-owner',request_id:requestId,input_hash:hash(JSON.stringify(input)),input,status:'succeeded',created_at:stamp,updated_at:stamp,due_at:stamp,available_at:stamp,attempt:1,progress:{stage:'Ready',completed:1,total:1},last_error:null,artifacts,lease_expires_at:null,finished_at:stamp};}
  return {core,route:compile('app/api/gallery/automation/reviews/route.ts'),jobs:compile('app/api/gallery/automation/jobs/route.ts'),publicRoute:compile('app/api/gallery/published/[id]/route.ts'),server:compile('lib/cartoon-review-server.ts'),report,manifest,publicId,get writes(){return writes},get privateReads(){return privateReads}};
}
const request=(body,origin='https://studio.example')=>new Request(`https://studio.example/api/gallery/automation/reviews?jobId=${id}`,{method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
const action=(extra={})=>({jobId:id,imageName:'cartoon-01.png',action:'approve',title:'Fixture title',expectedVersion:0,requestId,imageSha256:hash(image),checks:{artwork:true,caption:true,context:true},...extra});
const publicRequest=(fixture)=>fixture.publicRoute.GET(new Request('https://studio.example'),{params:Promise.resolve({id:fixture.publicId})});
test('owner cookie required: neither anonymous requests nor worker bearer can approve or read drafts',async()=>{
  const f=load({signedIn:false});assert.equal((await f.route.GET(request())).status,401);assert.equal((await f.route.POST(request(action()))).status,401);assert.equal(f.writes,0);assert.equal(f.privateReads,0);
});
test('cross-origin decisions and missing human checks are refused without a write',async()=>{
  const f=load();assert.equal((await f.route.POST(request(action(),'https://evil.example'))).status,403);
  assert.equal((await f.route.POST(request(action({checks:{artwork:true,caption:false,context:true}})))).status,400);
  assert.equal((await f.route.POST(request({...action(),automatic:true}))).status,400);assert.equal(f.writes,0);
});
test('legacy Chicago cast is inspectable but cannot be approved',async()=>{
  const f=load({legacy:true});const r=await f.route.GET(request());assert.equal(r.status,200);const data=await r.json();assert.equal(data.reviews[0].eligible,false);assert.match(data.reviews[0].blockReason,/Older or unverified cast/);
  assert.equal((await f.route.POST(request(action()))).status,409);assert.equal(f.writes,0);
});
test('correct head alone is insufficient: exact actor pose and protected monochrome set must match',async()=>{
  for(const change of [{actorSha256:'a'.repeat(64)},{actorId:'trio-abby'},{audit:{protectedChangedPixels:1,coloredPixels:0}},{audit:{protectedChangedPixels:0,coloredPixels:1}},{sha256:'a'.repeat(64)},{source:{url:'javascript:alert(1)'}}]){
    const f=load();Object.assign(f.report.cartoons[0],change);f.manifest();assert.equal((await f.route.POST(request(action()))).status,409);assert.equal(f.writes,0);
  }
});
test('drafts never enter public results or public image route; report tampering fails closed',async()=>{
  const f=load();assert.equal((await f.server.approvedGeneratedCartoons()).length,0);assert.equal((await publicRequest(f)).status,404);assert.equal(f.privateReads,0);
  const bad=load({brokenHash:true});assert.equal((await bad.route.POST(request(action()))).status,400);assert.equal(bad.writes,0);
});
test('explicit approval publishes only its bound image; withdrawal removes access and keeps the original private',async()=>{
  const f=load();const response=await f.route.POST(request(action()));assert.equal(response.status,200);const result=await response.json();assert.equal(result.review.decision,'approved');
  const gallery=await f.server.approvedGeneratedCartoons();assert.equal(gallery.length,1);assert.equal(gallery[0].id,f.publicId);assert.equal(gallery[0].src,`/api/gallery/published/${f.publicId}`);
  const imageResponse=await publicRequest(f);assert.equal(imageResponse.status,200);assert.equal(imageResponse.headers.get('cache-control'),'no-store, max-age=0');assert.equal(imageResponse.headers.get('location'),null);assert.equal(hash(Buffer.from(await imageResponse.arrayBuffer())),hash(image));
  assert.equal((await f.route.POST(request(action({action:'withdraw',expectedVersion:1,requestId:'33333333-3333-4333-8333-333333333333'})))).status,200);
  assert.equal((await publicRequest(f)).status,404);assert.equal((await f.server.approvedGeneratedCartoons()).length,0);assert.equal((await f.route.GET(request())).status,200);
});
test('gallery-hidden publication is inaccessible; stale reviewer sees a conflict, not a success',async()=>{
  const f=load({hidden:true});assert.equal((await f.route.POST(request(action()))).status,200);assert.equal((await publicRequest(f)).status,404);
  const stale=load({stale:true});const r=await stale.route.POST(request(action()));assert.equal(r.status,409);assert.match((await r.json()).error,/another session/);
});
test('edition identity is bound and saved request cards distinguish drafts from human approvals',async()=>{
  const bad=load();bad.report.input={...input,location:{...input.location,name:'Naples'}};bad.manifest();assert.equal((await bad.route.POST(request(action()))).status,409);
  const f=load();let summary=(await (await f.jobs.GET(request())).json()).jobs[0].editorial;assert.equal(summary.draft,1);assert.equal(summary.approved,0);
  assert.equal((await f.route.POST(request(action()))).status,200);summary=(await (await f.jobs.GET(request())).json()).jobs[0].editorial;assert.equal(summary.draft,0);assert.equal(summary.approved,1);
});
