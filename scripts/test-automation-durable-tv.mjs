import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import {durableTV} from './automation/durable-tv.mjs';
import {hash,atomicWrite,readJSON} from './automation/worker-core.mjs';

const brief='Empty house with a neatly stacked tower of moving boxes.',seed=4;
const tv={TV_MODEL:{id:'synthetic-test',width:8,height:4},tvRequestKey:(brief,seed)=>hash({brief,seed}),tvPicturePrompt:brief=>brief,tvGraph:()=>({})};
class Lease{async run(_name,fn){return fn();}}
async function fixture(t){const work=await fs.mkdtemp(path.join(os.tmpdir(),'swd-render-test-'));t.after(()=>fs.rm(work,{recursive:true,force:true}));return {work,ctx:{signal:new AbortController().signal,assertLease(){}},m:{tv,Lease,sharp},bytes:await sharp({create:{width:8,height:4,channels:3,background:'#ddd'}}).png().toBuffer()};}
const terminal=a=>({prompt:[0,a.promptId,{}, {client_id:a.clientId}],status:{completed:true,status_str:'success'},outputs:{60:{images:[{filename:'test.png',subfolder:'swd',type:'output'}]}}});
test('lost submission response recovers the exact terminal render without resubmitting',async t=>{
  const f=await fixture(t),attempt={promptId:'stored-id',clientId:'stored-client',server:'same-process'};
  await atomicWrite(path.join(f.work,'durable-render.json'),{requestHash:tv.tvRequestKey(brief,seed),attempts:[attempt]});
  let posts=0;
  const fetchImpl=async(url,options)=>{if(options.method==='POST'){posts++;throw Error('Must not submit');}if(url.includes('/history/'))return Response.json({[attempt.promptId]:terminal(attempt)});if(url.includes('/view?'))return new Response(f.bytes);throw Error('Unexpected request');};
  const result=await durableTV(f.ctx,f.m,{brief,seed,work:f.work},{identity:()=>attempt.server,fetchImpl,pollMs:1,checkWeights:async()=>{}});
  assert.equal(posts,0);assert.equal(result.attemptCount,1);assert.equal(result.sha256,hash(await fs.readFile(result.path)));
  const cached=await durableTV(f.ctx,f.m,{brief,seed,work:f.work},{fetchImpl:()=>{throw Error('Cached render must stay local');}});assert.equal(cached.reused,true);
});
test('a verified new server process permits one replacement for its lost queue',async t=>{
  const f=await fixture(t),old={promptId:'old-id',clientId:'old-client',server:'old-process'};
  await atomicWrite(path.join(f.work,'durable-render.json'),{requestHash:tv.tvRequestKey(brief,seed),attempts:[old]});
  let submitted,posts=0;
  const fetchImpl=async(url,options)=>{
    if(url.endsWith('/prompt')){posts++;submitted=JSON.parse(options.body);return Response.json({prompt_id:submitted.prompt_id});}
    if(url.includes('/history/'))return Response.json(submitted?{[submitted.prompt_id]:terminal({promptId:submitted.prompt_id,clientId:submitted.client_id})}:{});
    if(url.endsWith('/queue'))return Response.json({queue_running:[],queue_pending:[]});
    if(url.endsWith('/api/ps'))return Response.json({models:[]});
    if(url.includes('/view?'))return new Response(f.bytes);throw Error('Unexpected request');
  };
  const result=await durableTV(f.ctx,f.m,{brief,seed,work:f.work},{identity:()=> 'new-process',fetchImpl,pollMs:1,checkWeights:async()=>{}});
  assert.equal(posts,1);assert.equal(result.attemptCount,2);assert.notEqual(submitted.prompt_id,old.promptId);
});
test('an unaccounted-for live-server request is never blindly resubmitted',async t=>{
  const f=await fixture(t),old={promptId:'old-id',clientId:'old-client',server:'same-process'};
  await atomicWrite(path.join(f.work,'durable-render.json'),{requestHash:tv.tvRequestKey(brief,seed),attempts:[old]});
  let posts=0;
  await assert.rejects(durableTV(f.ctx,f.m,{brief,seed,work:f.work},{identity:()=>old.server,fetchImpl:async(_url,options)=>{if(options.method==='POST')posts++;return Response.json({});},pollMs:1,timeoutMs:15}),error=>error.remoteMayBeRunning===true);
  assert.equal(posts,0);assert.equal((await readJSON(path.join(f.work,'durable-render.json'))).attempts.length,1);
});
