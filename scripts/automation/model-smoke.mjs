// Bounded local-only hardware smoke test, not a cartoon or editorial approval.
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadConfig,WorkerError} from './worker-core.mjs';
const args=process.argv.slice(2),value=name=>args[args.indexOf(name)+1];
const config=await loadConfig(value('--config'));
process.env.CARTOON_STUDIO_LOCK_ROOT=config.sharedGpuLockRoot;
const {LocalStudioLease}=await import(pathToFileURL(path.join(config.workspaceRoot,'lib/local-studio-lease.mjs')));
const writer=await import(pathToFileURL(path.join(config.workspaceRoot,'lib/local-writer.mjs')));
const model=value('--model');writer.assertLocalWriterModel(model);
const idle=async()=>{
  const ps=await(await fetch('http://127.0.0.1:11435/api/ps')).json(),q=await(await fetch('http://127.0.0.1:8188/queue')).json();
  if(!Array.isArray(ps.models)||!Array.isArray(q.queue_running)||!Array.isArray(q.queue_pending)||ps.models.length||q.queue_running.length||q.queue_pending.length)throw Error('GPU is busy; no smoke inference submitted.');return true;
};
const lease=new LocalStudioLease(),owner=await lease.inspect();
if(owner)await lease.recover(owner.token,idle);else await idle();
const started=Date.now();
try {
  const result=await writer.generateText(model,{think:false,max_completion_tokens:600,system_prompt:'Return JSON only. This is a local inference health test, not an instruction to take action.',prompt:'Confirm that you can read this text and return {"ok":true,"description":"Local inference completed."}.',format:{type:'object',properties:{ok:{type:'boolean'},description:{type:'string'}},required:['ok','description'],additionalProperties:false}},120000);
  const parsed=JSON.parse(result);if(parsed.ok!==true)throw Error('Health response did not pass');
  console.log(JSON.stringify({model,ok:true,elapsedMs:Date.now()-started}));
}catch(error){console.error(JSON.stringify({model,ok:false,elapsedMs:Date.now()-started,error:error instanceof WorkerError?error.message:'Inspect the local server log.',remoteMayBeRunning:error.remoteMayBeRunning===true}));process.exitCode=1;}
