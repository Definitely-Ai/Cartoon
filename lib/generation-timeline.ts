import type {AutomationJob} from './automation-queue-core';

const STEPS=['Research','Caption','TV artwork','Composition','Delivery'] as const;
// The active phase comes from the worker, never elapsed time or the progress %.
// When a worker is waiting/recovering, its phase is unknown: do not invent checks.
export function generationTimeline(job:AutomationJob){
  const phase=job.progress.stage.split('-')[0];
  const index=({history:0,sources:0,draft:1,critique:1,tv:2,vision:2,compose:3,composed:3,uploading:4} as Record<string,number>)[phase];
  return STEPS.map((label,i)=>({label,state:job.status==='succeeded'?'complete':job.status==='running'&&index!==undefined?(i<index?'complete':i===index?'current':'pending'):'pending'}));
}
