import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash, randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {workProgress} from './work-progress.mjs';

export const hash = value => createHash('sha256').update(Buffer.isBuffer(value) ? value : typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
export const delay = (ms, signal) => new Promise((resolve, reject) => {
  if (signal?.aborted) return reject(signal.reason || new Error('Stopped'));
  const timer = setTimeout(done, ms);
  function done() { signal?.removeEventListener('abort', stop); resolve(); }
  function stop() { clearTimeout(timer); signal?.removeEventListener('abort', stop); reject(signal.reason || new Error('Stopped')); }
  signal?.addEventListener('abort', stop, {once:true});
});
export class WorkerError extends Error {
  constructor(message, {retryable = false, status, leaseLost = false} = {}) { super(message); Object.assign(this, {retryable,status,leaseLost}); }
}
export function safeMessage(error, secrets = []) {
  let message = error instanceof WorkerError ? error.message : 'Local operation failed; retained diagnostic checkpoint needs inspection.';
  for (const secret of secrets.filter(Boolean)) message = message.split(secret).join('[redacted]');
  return message.replace(/Bearer\s+\S+/gi, 'Bearer [redacted]').replace(/https?:\/\/\S+/gi, '[URL omitted]').slice(0,600);
}
export async function atomicWrite(file, data) {
  await fs.mkdir(path.dirname(file), {recursive:true,mode:0o700});
  const temporary = `${file}.${randomUUID()}.tmp`;
  const handle = await fs.open(temporary, 'wx', 0o600);
  try { await handle.writeFile(Buffer.isBuffer(data) ? data : JSON.stringify(data,null,2)); await handle.sync(); }
  finally { await handle.close(); }
  await fs.rename(temporary,file);
  // Windows does not expose directory fsync through Node. File bytes are flushed
  // before the same-volume atomic rename; POSIX also flushes the parent entry.
  try { const directory = await fs.open(path.dirname(file),'r'); try { await directory.sync(); } finally { await directory.close(); } }
  catch(error) { if (!['EPERM','EISDIR','EINVAL','ENOTSUP','EACCES'].includes(error.code)) throw error; }
}
export async function readJSON(file, fallback) { try { return JSON.parse(await fs.readFile(file,'utf8')); } catch(error) { if(error.code==='ENOENT')return fallback; throw error; } }
export async function inside(root, relative, {existing = true} = {}) {
  if(typeof relative!=='string'||!relative||path.isAbsolute(relative))throw new WorkerError('Expected a relative runtime path.');
  const base=await fs.realpath(root), resolved=path.resolve(base,relative), rel=path.relative(base,resolved);
  if(rel.startsWith('..')||path.isAbsolute(rel))throw new WorkerError('Runtime path escapes its root.');
  const actual=existing?await fs.realpath(resolved):resolved;
  const realRel=path.relative(base,actual);
  if(realRel.startsWith('..')||path.isAbsolute(realRel))throw new WorkerError('Runtime link escapes its root.');
  return actual;
}
async function processBirth(pid) {
  if(!Number.isSafeInteger(pid)||pid<1)throw new WorkerError('Invalid worker process identity.');
  if(process.platform==='win32')return execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',`(Get-Process -Id ${pid} -ErrorAction Stop).StartTime.ToUniversalTime().ToString('o')`],{windowsHide:true,timeout:10000,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  if(process.platform==='linux') {const value=await fs.readFile(`/proc/${pid}/stat`,'utf8');return value.slice(value.lastIndexOf(')')+2).split(' ')[19];}
  throw new WorkerError('This host cannot verify worker process birth times.');
}
export async function acquireSingleton(root,{birth=processBirth}={}) {
  await fs.mkdir(root,{recursive:true,mode:0o700});
  const file=path.join(root,'worker.lock'), owner={pid:process.pid,processBirth:await birth(process.pid),token:randomUUID(),startedAt:new Date().toISOString()};
  for(let attempt=0;attempt<2;attempt++) {
    const temp=path.join(root,`.worker-owner-${owner.token}.tmp`);
    await atomicWrite(temp,owner);
    try { await fs.link(temp,file); await fs.unlink(temp); break; }
    catch(error) {
      await fs.unlink(temp).catch(()=>{});
      if(error.code!=='EEXIST')throw error;
      const guard=await fs.open(path.join(root,'worker-recovery.lock'),'wx',0o600).catch(()=>{throw new WorkerError('Worker ownership recovery is already in progress.');});
      try {
        const prior=await readJSON(file);
        if(!Number.isSafeInteger(prior?.pid)||prior.pid<1||typeof prior.token!=='string')throw new WorkerError('Unverifiable worker lock; refusing overlapping workers.');
        let live=true;try{process.kill(prior.pid,0);}catch(e){if(e.code==='ESRCH')live=false;else throw e;}
        if(live&&(!prior.processBirth||await birth(prior.pid)===prior.processBirth))throw new WorkerError('A local worker already owns this state directory.');
        if((await readJSON(file)).token!==prior.token)throw new WorkerError('Worker ownership changed during recovery.');
        await fs.rename(file,path.join(root,`recovered-worker-${prior.token}.json`));
      }finally{await guard.close();await fs.unlink(path.join(root,'worker-recovery.lock'));}
      if(attempt===1)throw new WorkerError('Worker ownership recovery was contested.');
    }
  }
  return async()=>{if((await readJSON(file))?.token===owner.token)await fs.unlink(file);};
}
export async function verifyRuntime(config) {
  if(!Array.isArray(config.runtimePins)||!config.runtimePins.length)throw new WorkerError('An installed, hash-pinned runtime is required.');
  for(const item of config.runtimePins) {
    if(!/^[a-f0-9]{64}$/.test(item.sha256)||hash(await fs.readFile(await inside(config.workspaceRoot,item.path)))!==item.sha256)
      throw new WorkerError('Installed runtime or artwork changed. Reinstall the reviewed snapshot.');
  }
}
export async function loadConfig(file) {
  const config=await readJSON(path.resolve(file));
  if(!config||!path.isAbsolute(config.workspaceRoot||'')||!path.isAbsolute(config.stateRoot||'')||!path.isAbsolute(config.tokenFile||''))throw new WorkerError('Absolute workspace, state and token-file paths are required.');
  const url=new URL(config.apiOrigin);
  if((url.protocol!=='https:'&&!(url.protocol==='http:'&&url.hostname==='127.0.0.1'))||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new WorkerError('Invalid worker API origin.');
  if(!/^[a-zA-Z0-9_-]{1,80}$/.test(config.workerId||''))throw new WorkerError('A bounded worker identity is required.');
  const storage=new URL(config.storageOrigin);
  if(storage.protocol!=='https:'||storage.username||storage.password||storage.pathname!=='/'||storage.search||storage.hash)throw new WorkerError('A pinned HTTPS storage origin is required.');
  const token=(await fs.readFile(config.tokenFile,'utf8')).trim();
  if(!/^[a-zA-Z0-9_-]{40,200}$/.test(token))throw new WorkerError('Worker token file is missing or invalid.');
  await verifyRuntime(config);
  return {...config,apiOrigin:url.origin,storageOrigin:storage.origin,token,pollMs:Math.max(1000,Math.min(config.pollMs||10000,60000)),heartbeatMs:Math.max(1000,Math.min(config.heartbeatMs||30000,30000))};
}
export class WorkerAPI {
  constructor(config,fetchImpl=fetch) {this.config=config;this.fetch=fetchImpl;}
  async call(body,{signal}={}) {
    let response;
    try {response=await this.fetch(this.config.apiOrigin+'/api/gallery/automation/worker',{
      method:'POST',redirect:'error',signal:AbortSignal.any([AbortSignal.timeout(body.action==='complete'?90000:15000),...(signal?[signal]:[])]),
      headers:{Authorization:`Bearer ${this.config.token}`,'Content-Type':'application/json'},body:JSON.stringify(body),
    });} catch(error) {if(signal?.aborted)throw signal.reason;throw new WorkerError('Worker API unavailable; local progress retained.',{retryable:true});}
    if(!response.ok)throw new WorkerError(response.status===409?'Job lease no longer belongs to this worker.':response.status===401?'Worker authorization failed.':'Worker API rejected the operation.',{status:response.status,retryable:response.status>=500||response.status===429,leaseLost:[401,409].includes(response.status)});
    let data;try{data=await response.json();}catch{throw new WorkerError('Worker API returned an unreadable response.',{retryable:true});}
    return data;
  }
}
export class JobContext {
  constructor(config,job,api,signal) {Object.assign(this,{config,job,api,signal});this.dir=path.join(config.stateRoot,'jobs',job.id);this.file=path.join(this.dir,'checkpoint.json');this.progress={stage:'starting',completed:0,total:job.input.quantity};}
  async initialize() {
    if(!/^[a-f0-9-]{36}$/i.test(this.job.id)||!Number.isSafeInteger(this.job.attempt)||this.job.attempt<1||typeof this.job.leaseToken!=='string')throw new WorkerError('Unrecognized leased job.');
    const inputHash=hash(this.job.input);
    this.state=await readJSON(this.file,{schema:1,id:this.job.id,inputHash,stages:{},uploads:{}});
    if(this.state.schema!==1||this.state.id!==this.job.id||this.state.inputHash!==inputHash)throw new WorkerError('Retained job input changed.');
    await atomicWrite(this.file,this.state);
  }
  assertLease() {if(this.signal.aborted)throw this.signal.reason||new WorkerError('Worker stopped.');if(Date.now()>Date.parse(this.job.leaseExpiresAt)-5000)throw new WorkerError('Job lease expired.',{leaseLost:true});}
  async flush() {this.assertLease();await atomicWrite(this.file,this.state);}
  async step(name,request,operation,{recover}={}) {
    this.assertLease();
    if(!/^[a-z0-9_-]{1,80}$/.test(name))throw new WorkerError('Invalid checkpoint stage.');
    const requestHash=hash(request),old=this.state.stages[name];
    if(old&&old.requestHash!==requestHash)throw new WorkerError('A retained stage request changed.');
    this.progress=workProgress(name,this.job.input.quantity);
    if(old?.status==='done')return old.value;
    if(old?.status==='running'&&!recover)throw new WorkerError('An interrupted effect has no verified recovery route.');
    if(old?.status==='running')await recover(old);
    this.state.stages[name]={requestHash,status:'running',startedAt:old?.startedAt||new Date().toISOString()};await this.flush();
    const value=await operation();this.assertLease();
    this.state.stages[name]={requestHash,status:'done',value,completedAt:new Date().toISOString()};await this.flush();return value;
  }
  async artifact(relative,kind,contentType) {
    const file=await inside(this.dir,relative),bytes=await fs.readFile(file),name=path.basename(relative);
    if(!/^[a-z0-9][a-z0-9._-]{0,79}$/.test(name)||name.includes('..')||bytes.length>(kind==='image'?8*1024*1024:256*1024))throw new WorkerError('Artifact exceeds delivery bounds.');
    return {file,name,kind,contentType,bytes:bytes.length,sha256:hash(bytes)};
  }
}
export async function deliverArtifacts(ctx, artifacts, fetchImpl=fetch) {
  if(!Array.isArray(artifacts)||artifacts.length>24||artifacts.filter(a=>a.kind==='image').length!==ctx.job.input.quantity)throw new WorkerError('The completed image count does not match the request.');
  const delivered=[];
  for(const artifact of artifacts) {
    ctx.assertLease();
    const bytes=await fs.readFile(artifact.file);
    if(hash(bytes)!==artifact.sha256||bytes.length!==artifact.bytes)throw new WorkerError('A completed artifact changed before delivery.');
    const {file,...metadata}=artifact,key=`${ctx.job.attempt}:${metadata.name}`;
    let receipt=ctx.state.uploads[key];
    if(receipt&&receipt.sha256!==metadata.sha256)throw new WorkerError('Upload checkpoint does not match the artifact.');
    if(!receipt?.uploaded) {
      const signed=await ctx.api.call({action:'upload',jobId:ctx.job.id,leaseToken:ctx.job.leaseToken,artifact:metadata},{signal:ctx.signal});
      const url=new URL(signed.uploadUrl);
      const expectedPath=`${ctx.job.id}/${ctx.job.attempt}/${metadata.name}`;
      if(url.origin!==ctx.config.storageOrigin||url.username||url.password||!url.pathname.startsWith('/storage/v1/object/upload/sign/')||signed.path!==expectedPath||!decodeURIComponent(url.pathname).endsWith('/'+expectedPath))throw new WorkerError('Unexpected signed storage destination.');
      receipt={...metadata,path:signed.path,uploaded:false};ctx.state.uploads[key]=receipt;await ctx.flush();
      let response;try{response=await fetchImpl(url,{method:'PUT',redirect:'error',signal:AbortSignal.any([ctx.signal,AbortSignal.timeout(90000)]),headers:{'Content-Type':metadata.contentType,'Cache-Control':'max-age=3600'},body:bytes});}
      catch{throw new WorkerError('Artifact upload outcome is unconfirmed; retained bytes will be checked on retry.',{retryable:true});}
      let duplicate=response.status===409;
      if(response.status===400) {
        const raw=await response.text();
        if(raw.length<=2048)try{const error=JSON.parse(raw);duplicate=error.code==='already_exists'||String(error.statusCode)==='409'&&['Duplicate','AssetAlreadyExists','already_exists'].includes(error.error);}catch{}
      }
      if(!response.ok&&!duplicate)throw new WorkerError('Artifact upload failed.',{retryable:response.status>=500||response.status===429});
      receipt.uploaded=true;await ctx.flush();
    }
    const {uploaded,...item}=receipt;delivered.push(item);
  }
  ctx.assertLease();
  const result=await ctx.api.call({action:'complete',jobId:ctx.job.id,leaseToken:ctx.job.leaseToken,artifacts:delivered},{signal:ctx.signal});
  ctx.state.completed={at:new Date().toISOString(),manifestHash:hash(delivered),artifacts:delivered};await ctx.flush();
  return result;
}
export async function processJob(config,job,api,adapter,{signal=new AbortController().signal,fetchImpl=fetch,log=async()=>{}}={}) {
  const cancel=new AbortController();
  const linked=AbortSignal.any([signal,cancel.signal]);
  const ctx=new JobContext(config,job,api,linked);await ctx.initialize();
  let done=false;
  const heartbeat=async()=>{
    while(!done&&!linked.aborted) {
      try {
        const result=await api.call({action:'heartbeat',jobId:job.id,leaseToken:job.leaseToken,progress:ctx.progress},{signal:linked});
        if(!result.job?.leaseExpiresAt)throw new WorkerError('Heartbeat omitted the leased job.',{leaseLost:true});
        ctx.job={...ctx.job,leaseExpiresAt:result.job.leaseExpiresAt};
      } catch(error) {
        await log({event:'heartbeat-unconfirmed',jobId:job.id,message:safeMessage(error,[config.token])});
        if(error.leaseLost||Date.now()>Date.parse(ctx.job.leaseExpiresAt)-20000){cancel.abort(new WorkerError('Lease lost; no further generation or publication is authorized.',{leaseLost:true}));return;}
      }
      await delay(config.heartbeatMs,linked).catch(()=>{});
    }
  };
  const heart=heartbeat();
  try {
    await verifyRuntime(config);ctx.assertLease();
    const artifacts=await adapter(ctx);
    ctx.progress=workProgress('uploading',job.input.quantity);
    await deliverArtifacts(ctx,artifacts,fetchImpl);
    await log({event:'completed',jobId:job.id,count:job.input.quantity});
    return {status:'completed'};
  } catch(error) {
    if(error.remoteMayBeRunning===true)error.retryable=true;
    const message=safeMessage(error,[config.token,job.leaseToken]);
    await log({event:'job-interrupted',jobId:job.id,message});
    if(!linked.aborted&&!error.leaseLost) {
      await api.call({action:'fail',jobId:job.id,leaseToken:job.leaseToken,error:message,retryable:error.retryable===true},{signal:linked}).catch(()=>{});
    }
    return {status:linked.aborted||error.leaseLost?'lease-lost':'failed',retryable:error.retryable===true,restartRequired:error.remoteMayBeRunning===true};
  } finally {done=true;cancel.abort(new WorkerError('Job observation finished.'));await heart;}
}
