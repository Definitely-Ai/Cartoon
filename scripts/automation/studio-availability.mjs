import {delay} from './worker-core.mjs';
// Keep the lease and real progress while another application is using the GPU.
// Recheck availability; never cancel, unload, or take over another render.
export async function waitForStudio(ctx,check,{pause=delay,waitMs=5000,maxWaitMs=15*60000}={}) {
  const progress=ctx.progress,deadline=Date.now()+maxWaitMs;
  for(;;) {
    ctx.signal.throwIfAborted();
    try {await check();ctx.progress=progress;return;}
    catch(error) {
      if(!error.retryable||ctx.signal.aborted||Date.now()>=deadline)throw error;
      ctx.progress={...progress,stage:'waiting-gpu'};
      await pause(waitMs,ctx.signal);
    }
  }
}
