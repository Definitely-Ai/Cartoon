import fs from 'node:fs/promises';
import path from 'node:path';
import {loadConfig,acquireSingleton,WorkerAPI,processJob,delay,safeMessage,atomicWrite} from './worker-core.mjs';
import {generateProductionEdition} from './production-adapter.mjs';

const args=process.argv.slice(2),configIndex=args.indexOf('--config');
if(configIndex<0||!args[configIndex+1])throw Error('Usage: node scripts/automation/worker.mjs --config ABSOLUTE_CONFIG [--once]');
const config=await loadConfig(args[configIndex+1]);
if (!path.isAbsolute(config.sharedGpuLockRoot || '')) throw Error('An absolute shared GPU lock directory is required.');
process.env.CARTOON_STUDIO_LOCK_ROOT = config.sharedGpuLockRoot;
const release=await acquireSingleton(config.stateRoot);
const stop=new AbortController();
for(const event of ['SIGINT','SIGTERM'])process.once(event,()=>stop.abort(new Error('Worker shutdown requested.')));
process.chdir(config.workspaceRoot);
const api=new WorkerAPI(config);
const log=async entry=>{
  const row={at:new Date().toISOString(),workerId:config.workerId,...entry};
  await atomicWrite(path.join(config.stateRoot,'latest-worker-status.json'),row);
  // Only bounded operational messages, never request bodies, prompts, API tokens,
  // signed URLs, or model reasoning. Logs rotate by UTC day.
  await fs.appendFile(path.join(config.stateRoot,`worker-${new Date().toISOString().slice(0,10)}.jsonl`),JSON.stringify(row)+'\n',{mode:0o600});
  process.stdout.write(JSON.stringify(row)+'\n');
};
try {
  await log({event:'ready',mode:'private-generation-worker'});
  do {
    try {
      const result=await api.call({action:'claim'},{signal:stop.signal});
      if(result.job) {
        const completed=await processJob(config,result.job,api,generateProductionEdition,{signal:stop.signal,log});
        if(completed.restartRequired){process.exitCode=75;break;}
      }
      else await log({event:'idle'});
    } catch(error) {
      if(!stop.signal.aborted)await log({event:'connection-wait',message:safeMessage(error,[config.token])});
      if(error.status===401)break;
    }
    if(args.includes('--once')||stop.signal.aborted)break;
    await delay(config.pollMs,stop.signal).catch(()=>{});
  } while(!stop.signal.aborted);
} finally {await log({event:'stopped'});await release();}
