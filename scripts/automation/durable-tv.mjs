import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {atomicWrite,readJSON,hash,delay,WorkerError} from './worker-core.mjs';

const COMFY='http://127.0.0.1:8188';
export function imageServerIdentity() {
  if(process.platform!=='win32')throw new WorkerError('Install a verified image-server identity adapter for this host.');
  const command="$ErrorActionPreference='Stop'; $owners=@(Get-NetTCPConnection -LocalPort 8188 -State Listen | Select-Object -ExpandProperty OwningProcess -Unique); if($owners.Count -ne 1){throw 'Image server identity is ambiguous'}; $imageProcess=Get-Process -Id $owners[0]; Write-Output ($imageProcess.Id.ToString()+':'+$imageProcess.StartTime.ToUniversalTime().ToString('o'))";
  return execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',command],{windowsHide:true,timeout:15000,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
}

/** A persisted client-selected prompt ID closes the lost-response window.
 * A disappeared server may be retried; an unaccounted-for live server is never
 * resubmitted to blindly. Exactly-once GPU execution is not claimed. */
export async function durableTV(ctx,m,{brief,seed,work},{fetchImpl=fetch,identity=imageServerIdentity,checkWeights=()=>m.tv.verifyTvWeights(),pollMs=2000,timeoutMs=1200000}={}) {
  const requestHash=m.tv.tvRequestKey(brief,seed),statePath=path.join(work,'durable-render.json');
  await fs.mkdir(work,{recursive:true});
  let state=await readJSON(statePath,{requestHash,attempts:[]});
  if(state.requestHash!==requestHash)throw new WorkerError('Retained TV request changed.');
  const picturePath=path.join(work,'picture.png');
  if(state.result){if(hash(await fs.readFile(picturePath))!==state.result.sha256)throw new WorkerError('Retained TV image changed.');return {...state.result,path:picturePath,reused:true};}
  const json=async(url,options={})=>{
    const response=await fetchImpl(url,{redirect:'error',signal:AbortSignal.any([ctx.signal,AbortSignal.timeout(45000)]),...options});
    if(!response.ok)throw new WorkerError('Local image service is temporarily unavailable.',{retryable:response.status>=500||response.status===429});
    return response.json();
  };
  const finish=async entry=>{
    if(entry.status?.status_str==='error')throw new WorkerError('The image server rejected this render; its terminal record is retained.');
    const images=entry.outputs?.['60']?.images;
    if(!entry.status?.completed||images?.length!==1)throw new WorkerError('One completed TV illustration is required.');
    const image=images[0];
    if(image.type!=='output'||!/^[-a-zA-Z0-9_.]+\.png$/.test(image.filename)||typeof image.subfolder!=='string'||image.subfolder.includes('..')||!/^[-a-zA-Z0-9_/]*$/.test(image.subfolder))throw new WorkerError('Unexpected image output location.');
    const response=await fetchImpl(COMFY+'/view?'+new URLSearchParams(image),{redirect:'error',signal:AbortSignal.any([ctx.signal,AbortSignal.timeout(45000)])});
    if(!response.ok)throw new WorkerError('Completed render download needs retry.',{retryable:true});
    const bytes=Buffer.from(await response.arrayBuffer()),meta=await m.sharp(bytes).metadata();
    if(bytes.length>16*1024*1024||meta.width!==m.tv.TV_MODEL.width||meta.height!==m.tv.TV_MODEL.height||meta.pages>1)throw new WorkerError('Unexpected TV dimensions or file size.');
    const picture=await m.sharp(bytes).grayscale().toColourspace('srgb').removeAlpha().png().toBuffer();
    await atomicWrite(path.join(work,'raw.png'),bytes);await atomicWrite(picturePath,picture);
    ctx.assertLease();
    state.result={requestHash,sha256:hash(picture),rawSha256:hash(bytes),model:m.tv.TV_MODEL.id,width:meta.width,height:meta.height,ownerApproval:false,automaticPublication:false,requiresVisualReview:true,
      prompt:m.tv.tvPicturePrompt(brief),description:brief,attemptCount:state.attempts.length};
    await atomicWrite(statePath,state);return {...state.result,path:picturePath,reused:false};
  };
  if(state.terminal)return finish(state.terminal);
  return new m.Lease().run('image:durable-tv',async()=>{
    let outstanding=false;
    try {
      const deadline=Date.now()+timeoutMs;
      while(Date.now()<deadline) {
        ctx.assertLease();
        const server=await identity();
        let attempt=state.attempts.at(-1);
        if(attempt) {
          // Even after restart, recover a retained terminal result if available.
          const entries=await json(COMFY+'/history/'+attempt.promptId),entry=entries[attempt.promptId];
          if(entry?.status?.completed||entry?.status?.status_str==='error') {
            if(entry.prompt?.[1]!==attempt.promptId||entry.prompt?.[3]?.client_id!==attempt.clientId)throw new WorkerError('Image result identity does not match this job.');
            outstanding=false;state.terminal=entry;await atomicWrite(statePath,state);return finish(entry);
          }
          if(attempt.server===server) {outstanding=true;await delay(pollMs,ctx.signal);continue;}
          // The bound listener process has a new PID or process birth time.
          // The old server cannot still own this port or run the queued graph.
        }
        const [queue,ps]=await Promise.all([json(COMFY+'/queue'),json('http://127.0.0.1:11435/api/ps')]);
        if(!Array.isArray(queue.queue_running)||!Array.isArray(queue.queue_pending)||!Array.isArray(ps.models)||queue.queue_running.length||queue.queue_pending.length||ps.models.length)throw new WorkerError('The GPU is occupied; the retained render will wait.',{retryable:true});
        if(await identity()!==server)throw new WorkerError('Image server restarted during readiness checking.',{retryable:true});
        await checkWeights();ctx.assertLease();
        attempt={promptId:randomUUID(),clientId:randomUUID(),server,at:new Date().toISOString()};
        state.attempts.push(attempt);await atomicWrite(statePath,state);
        const graph=m.tv.tvGraph(m.tv.tvPicturePrompt(brief),seed,'swd/automation-'+attempt.promptId);
        await atomicWrite(path.join(work,'workflow-'+attempt.promptId+'.json'),graph);
        outstanding=true;
        const submitted=await json(COMFY+'/prompt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:graph,prompt_id:attempt.promptId,client_id:attempt.clientId})});
        if(submitted.prompt_id!==attempt.promptId)throw new WorkerError('Image server does not support the installed durable prompt-ID contract.');
        attempt.acknowledgedAt=new Date().toISOString();await atomicWrite(statePath,state);
      }
      throw new WorkerError('Render is still unconfirmed; its exact prompt ID is retained.',{retryable:true});
    }catch(error){if(outstanding)error.remoteMayBeRunning=true;throw error;}
  });
}
