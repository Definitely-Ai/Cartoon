// Local, explicitly labeled interface fixtures. No model or production API calls.
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {buildCanvas,saveBuildFrame} from './automation/build-progress.mjs';
import {composeProductionPanel} from './automation/production-adapter.mjs';
import {JobContext,hash} from './automation/worker-core.mjs';
const release=process.cwd(),runtime='Z:/ImageGenerator/CartoonRuntime/releases/20260915-v18';
const out=path.join(release,'output/cartoon-assembly-verified/fixtures');await fs.mkdir(out,{recursive:true});
process.chdir(runtime);
const m={sharp,core:await import(pathToFileURL(path.join(runtime,'scripts/fixed-set/core.mjs'))),typography:await import(pathToFileURL(path.join(runtime,'scripts/fixed-set/typography.mjs')))};
const acting=JSON.parse(await fs.readFile('canon/fixed-set/barclay-reference-v2/acting/verification.json','utf8'));
const regions=JSON.parse(await fs.readFile('canon/fixed-set/v1/regions.json','utf8'));
process.chdir(release);
const id='92222222-2222-4222-8222-222222222222',frames=[],uploads=new Map();
const ctx=new JobContext({workspaceRoot:runtime,stateRoot:out,storageOrigin:'https://fixture.example',buildPreviews:true},{id,attempt:1,leaseToken:'44444444-4444-4444-8444-444444444444',leaseExpiresAt:new Date(Date.now()+600000).toISOString(),input:{quantity:1}},null,new AbortController().signal);
await ctx.initialize();ctx.state.buildReceipts={};ctx.state.uploads={};
ctx.api={call:async body=>{
  if(body.action==='upload')return {path:`${id}/1/${body.artifact.name}`,uploadUrl:`https://fixture.example/storage/v1/object/upload/sign/automation-drafts/${id}/1/${body.artifact.name}?token=fixture`};
  assert.equal(body.action,'build');frames.push({...body.frame,attempt:1,savedAt:new Date().toISOString()});return {saved:true};
}};
const previousFetch=globalThis.fetch;
globalThis.fetch=async(url,opts)=>{assert.equal(new URL(url).hostname,'fixture.example');uploads.set(path.posix.basename(new URL(url).pathname),Buffer.from(opts.body));return new Response('{}');};
try{
  const cast={variant:'duo',speaker:'Barclay'},actor=acting.reports.find(a=>a.id==='duo-barclay');
  const canvas=await buildCanvas(ctx,m,actor,acting,regions);
  await saveBuildFrame(ctx,m,{stage:'cast',index:0,cast,actor,pixels:canvas.pixels});
  const selected={caption:'I pay for financial advice so my second-guessing has professional opposition.',tvHeadline:'FINANCIAL ADVICE',boardLines:['Second opinion','$8','Same bartender'],source:{title:'UI verification fixture — retained cartoon copy',url:'https://example.org/fixture',scope:'Interface test only. Retained artwork and caption; not new local research.'}};
  await saveBuildFrame(ctx,m,{stage:'story',index:0,cast,actor,selected,pixels:canvas.pixels});
  const tv=await sharp(path.join(runtime,actor.framePath)).extract({left:355,top:125,width:340,height:145}).png().toBuffer();
  const tvPath=path.join(out,'fixture-tv.png');await fs.writeFile(tvPath,tv);
  const episode={id:'cartoon-01',...cast,line:selected.caption,tv:{headline:selected.tvHeadline,timestamp:'1:00 ET',picture:'QA fixture only'},board:{lines:selected.boardLines}};
  const result=await composeProductionPanel(ctx,m,episode,tvPath,actor,acting,regions,0,selected);
  assert.equal(result.audit.protectedChangedPixels,0);assert.equal(result.audit.coloredPixels,0);
  assert.deepEqual(frames.map(f=>f.stage),['cast','story','tv','chalk','lettering']);
  for(const frame of frames){const stored=uploads.get(frame.artifact.name);assert.equal(hash(stored),frame.artifact.sha256);const meta=await sharp(stored).metadata();assert.equal(meta.width,1024);assert.equal(meta.height,1536);await fs.writeFile(path.join(out,frame.stage+'.png'),stored);}
  // Same confirmed receipt does not send again; a changed receipt is rejected.
  await saveBuildFrame(ctx,m,{stage:'story',index:0,cast,actor,selected,pixels:canvas.pixels});assert.equal(frames.length,5);
  await assert.rejects(()=>saveBuildFrame(ctx,m,{stage:'story',index:0,cast,actor,selected:{...selected,caption:'Changed fixture.'},pixels:canvas.pixels}),/checkpoint changed/);
  await fs.writeFile(path.join(out,'frames.json'),JSON.stringify(frames,null,2));
  console.log(JSON.stringify({frames:frames.length,audit:result.audit,persistentUploads:uploads.size,output:out}));
}finally{globalThis.fetch=previousFetch;process.chdir(release);}
