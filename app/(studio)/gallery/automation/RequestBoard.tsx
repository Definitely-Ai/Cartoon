"use client";
import Image from 'next/image';
import Link from 'next/link';
import { generationProgress, queueGroups, recoveryReason, requestLabel } from '@/lib/automation-simple';
import type { AutomationJob } from '@/lib/automation-queue-core';

export const artifactURL=(job:AutomationJob,name:string)=>`/api/gallery/automation/assets?jobId=${job.id}&name=${encodeURIComponent(name)}`;
function when(value:string){return new Date(value).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});}
export function MilestoneBar({job}:{job:AutomationJob}){
  const {percent}=generationProgress(job);
  const waiting=job.status==='queued'||job.progress.stage==='waiting-gpu';
  return <div className={`milestone-track${waiting?' milestone-waiting':''}`}>
    <progress max={100} value={percent} aria-label={`${job.input.location.name}: confirmed production milestones`} />
    {waiting&&percent===0&&<span className="milestone-idle-mark" aria-hidden="true"/>}
  </div>;
}
function ReadyPreview({job,onSelect}:{job:AutomationJob;onSelect:()=>void}){
  const images=job.artifacts.filter(a=>a.kind==='image');
  return <article className="request-ready-card">
    <button type="button" className="request-preview" onClick={onSelect} aria-label={`View ${images.length} completed cartoon${images.length===1?'':'s'} for ${job.input.location.name}`}>
      <Image src={artifactURL(job,images[0].name)} width={1024} height={1536} unoptimized alt={`${job.input.location.name} completed cartoon preview`}/>
      <span>{images.length} ready · View cartoons ↗</span>
    </button>
    <h4>{job.input.location.name}, {job.input.location.region}</h4>
    <p>Edition {job.input.timing.date} · {when(job.finishedAt||job.updatedAt)}</p>
  </article>;
}
export default function RequestBoard({jobs,focused,connected,pollError,retrying,onSelect,onRetry}: {
  jobs:AutomationJob[];focused?:string;connected:boolean|null;pollError:string;retrying:string;
  onSelect:(job:AutomationJob)=>void;onRetry:(job:AutomationJob)=>void;
}){
  const {active,ready,attention}=queueGroups(jobs);
  const images=ready.reduce((total,j)=>total+j.artifacts.filter(a=>a.kind==='image').length,0);
  return <section className="request-board" aria-label="Your cartoon requests">
    <header className="request-board-heading"><div><p className="generate-eyebrow">The production desk</p><h2>Your requests</h2></div><span>{pollError?'Connection interrupted · showing saved status':'Updates automatically'}</span></header>
    <dl className="request-totals"><div><dt>Cartoons ready</dt><dd>{images}</dd></div><div><dt>In production & queued</dt><dd>{active.length}</dd></div><div><dt>Need another pass</dt><dd>{attention.length}</dd></div></dl>
    {jobs.length>=100&&<p className="generate-note">Showing the latest {jobs.length} requests. Counts and ordering describe this view.</p>}
    <section aria-label="Production queue" className="request-queue">
      <h3>In the studio <span>{active.length}</span></h3>
      {!active.length?<p className="request-empty">No editions in progress. Choose a city above to start.</p>:<>
        <p className="generate-note">Active work first, then queued editions in availability order. Scheduled editions wait until their start time.</p>
        <ol>{active.map(j=>{
          const progress=generationProgress(j),scheduled=Date.parse(j.dueAt)>Date.now(),delayed=Date.parse(j.availableAt)>Date.now();
          return <li key={j.id} className={`request-queue-card${focused===j.id?' request-selected':''}`}>
            <div className="request-card-top"><button type="button" className="request-title" onClick={()=>onSelect(j)}>{j.input.location.name}, {j.input.location.region}</button><span className="request-badge">{requestLabel(j)}</span></div>
            <div className="request-card-stage"><span>{j.status==='running'?progress.label:j.scheduleStatus==='paused'?'Saved · schedule is paused':scheduled?`Starts ${when(j.dueAt)}`:delayed?`Automatic retry after ${when(j.availableAt)}`:'Saved · waiting for the studio'}</span><strong>{progress.percent}%</strong></div>
            <MilestoneBar job={j}/>
            <p>{j.input.quantity} cartoon{j.input.quantity===1?'':'s'} · {j.scheduleStatus==='paused'?<>Resume in <Link href="/gallery/automation/planner">Advanced plans and schedules</Link> when ready.</>:scheduled?'Will begin at the scheduled time.':connected===false?'PC offline. Your request stays saved.':j.progress.stage==='waiting-gpu'?'Other GPU work is running. This edition will resume when it is free.':progress.detail}</p>
          </li>;
        })}</ol>
      </>}
    </section>
    <section className="request-ready" aria-label="Completed requests"><h3>Ready to view <span>{ready.length} edition{ready.length===1?'':'s'}</span></h3>
      {!ready.length?<p className="request-empty">Finished cartoons appear here automatically. Click a preview to open and print the full edition.</p>:<div className="request-ready-grid">{ready.map(j=><ReadyPreview key={j.id} job={j} onSelect={()=>onSelect(j)}/>)}</div>}
    </section>
    {!!attention.length&&<details className="request-attention"><summary>{attention.length} saved request{attention.length===1?' needs':'s need'} another pass</summary><p className="generate-note">These are not finished cartoons. Retry creates one new edition for today with fresh ideas and artwork; the original stays saved. Temporary interruptions retry automatically without this button.</p>
      <ul>{attention.map(j=><li key={j.id}><div><button className="request-title" type="button" onClick={()=>onSelect(j)}>{j.input.location.name}, {j.input.location.region}</button><p>{j.input.quantity} requested · {recoveryReason(j)}</p></div><button type="button" disabled={!!retrying} onClick={()=>onRetry(j)}>{retrying===j.id?'Confirming fresh pass…':'Retry / open fresh pass'}</button></li>)}</ul>
    </details>}
  </section>;
}
