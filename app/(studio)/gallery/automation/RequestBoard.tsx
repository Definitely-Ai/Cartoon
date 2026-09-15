"use client";
import Image from 'next/image';
import Link from 'next/link';
import {useState} from 'react';
import {generationProgress,queueGroups,recoveryReason,requestLabel} from '@/lib/automation-simple';
import type {AutomationJob} from '@/lib/automation-queue-core';

export const artifactURL=(job:AutomationJob,name:string)=>`/api/gallery/automation/assets?jobId=${job.id}&name=${encodeURIComponent(name)}`;
function when(value:string){return new Date(value).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});}
export function MilestoneBar({job}:{job:AutomationJob}){
  const {percent}=generationProgress(job),waiting=job.status==='queued'||job.progress.stage==='waiting-gpu';
  return <div className={`milestone-track${waiting?' milestone-waiting':''}`}><progress max={100} value={percent} aria-label={`${job.input.location.name}: confirmed production milestones`}/>{waiting&&percent===0&&<span className="milestone-idle-mark" aria-hidden="true"/>}</div>;
}
function ReadyPreview({job,selected,onSelect}:{job:AutomationJob;selected:boolean;onSelect:()=>void}){
  const images=job.artifacts.filter(a=>a.kind==='image');
  return <article className={`request-ready-card${selected?' request-selected':''}`}>
    <button type="button" className="request-preview" onClick={onSelect} aria-pressed={selected} aria-label={`View ${images.length} completed cartoon${images.length===1?'':'s'} for ${job.input.location.name}`}>
      {images[0]?<Image src={artifactURL(job,images[0].name)} width={1024} height={1536} unoptimized alt={`${job.input.location.name} completed cartoon preview`}/>:<span>No preview in record</span>}
      <span className="request-preview-action">Review edition <span aria-hidden="true">↗</span></span>
    </button>
    <div className="request-ready-info"><div><h4>{job.input.location.name}</h4><p>{job.input.location.region} · {job.input.timing.date}</p></div><span className="studio-pill">{images.length} {images.length===1?'cartoon':'cartoons'}</span></div>
    {job.editorial&&<p className="request-editorial-status">{[job.editorial.draft?`${job.editorial.draft} awaiting review`:'',job.editorial.approved?`${job.editorial.approved} human-approved`:'',job.editorial.rejected?`${job.editorial.rejected} need changes`:'',job.editorial.withdrawn?`${job.editorial.withdrawn} withdrawn`:''].filter(Boolean).join(' · ')}</p>}
  </article>;
}
type Filter='all'|'active'|'ready'|'attention';
export default function RequestBoard({jobs,focused,connected,pollError,loading,retrying,onSelect,onRetry}:{
  jobs:AutomationJob[];focused?:string;connected:boolean|null;pollError:string;loading?:boolean;retrying:string;
  onSelect:(job:AutomationJob)=>void;onRetry:(job:AutomationJob)=>void;
}){
  const [filter,setFilter]=useState<Filter>('all'),[search,setSearch]=useState('');
  const groups=queueGroups(jobs),term=search.trim().toLowerCase();
  const matches=(j:AutomationJob)=>`${j.input.location.name} ${j.input.location.region} ${j.input.timing.date}`.toLowerCase().includes(term);
  const active=groups.active.filter(matches),ready=groups.ready.filter(matches).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),attention=groups.attention.filter(matches);
  const filters:[Filter,string,number][]=[['all','All editions',jobs.length],['active','In the studio',groups.active.length],['ready','Finished editions',groups.ready.length],['attention','Another pass',groups.attention.length]];
  const count=filter==='all'?active.length+ready.length+attention.length:filter==='active'?active.length:filter==='ready'?ready.length:attention.length;
  return <section className="request-board" aria-label="Your cartoon requests">
    <header className="request-board-heading"><div><p className="generate-eyebrow">03 / Your production desk</p><h2>Your requests</h2></div><span className="request-sync">{loading?'Loading saved editions…':pollError?'Showing last saved status':'Updates automatically · every 4 seconds'}</span></header>
    <div className="request-controls"><div className="request-filters" role="group" aria-label="Filter editions">{filters.map(([value,label,n])=><button key={value} type="button" aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}<span>{loading?'—':n}</span></button>)}</div><label className="request-search"><span className="sr-only">Search saved editions</span><span aria-hidden="true">⌕</span><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find a city or date…"/></label></div>
    {jobs.length>=100&&<p className="generate-note">Showing the latest {jobs.length} requests. Counts and ordering describe this view.</p>}
    {loading?<div className="request-empty" role="status">Connecting to your saved editions. No progress is estimated.</div>:!count?<div className="request-empty"><h3>{term?'No matching editions':filter==='all'?'Your production desk is ready':'Nothing here yet'}</h3><p>{term?'Try another city, state, or date.':'Create an edition above. Its status and finished cartoons will appear here.'}</p>{term&&<button type="button" onClick={()=>setSearch('')}>Clear search</button>}</div>:<>
      {(filter==='all'||filter==='active')&&active.length>0&&<section aria-label="Production queue" className="request-queue"><h3>In the studio <span>{active.length}</span></h3><ol>{active.map((j,i)=>{
        const progress=generationProgress(j),scheduled=Date.parse(j.dueAt)>Date.now(),delayed=Date.parse(j.availableAt)>Date.now();
        return <li key={j.id} className={`request-queue-card${focused===j.id?' request-selected':''}`}>
          <span className="request-order" aria-hidden="true">{String(i+1).padStart(2,'0')}</span>
          <div className="request-queue-content"><div className="request-card-top"><button type="button" className="request-title" aria-pressed={focused===j.id} onClick={()=>onSelect(j)}>{j.input.location.name}, {j.input.location.region}</button><span className="request-badge">{requestLabel(j)}</span></div>
          <div className="request-card-stage"><span>{j.status==='running'?progress.label:j.scheduleStatus==='paused'?'Saved · schedule is paused':scheduled?`Starts ${when(j.dueAt)}`:delayed?`Automatic retry after ${when(j.availableAt)}`:'Saved · waiting for the studio'}</span><strong>{progress.percent}%</strong></div><MilestoneBar job={j}/>
          <p>{j.input.quantity} cartoon{j.input.quantity===1?'':'s'} · {j.scheduleStatus==='paused'?<>Resume in <Link href="/gallery/automation/planner">Advanced plans and schedules</Link> when ready.</>:scheduled?'Will begin at the scheduled time.':pollError?'Showing last confirmed progress. Reconnecting.':connected===false?'PC offline. Your request stays saved.':j.progress.stage==='waiting-gpu'?'Other GPU work is running. This edition will resume when it is free.':progress.detail}</p></div>
        </li>;
      })}</ol><p className="queue-order-note">Running work first. Remaining editions are ordered by availability; paused schedules stay at the end.</p></section>}
      {(filter==='all'||filter==='ready')&&ready.length>0&&<section className="request-ready" aria-label="Completed requests"><h3>Ready to view <span>{ready.length} {ready.length===1?'edition':'editions'}</span></h3><div className="request-ready-grid">{ready.map(j=><ReadyPreview key={j.id} job={j} selected={focused===j.id} onSelect={()=>onSelect(j)}/>)}</div></section>}
      {(filter==='all'||filter==='attention')&&attention.length>0&&<details key={filter} className="request-attention" open={filter==='attention'?true:undefined}><summary>{attention.length} saved request{attention.length===1?' needs':'s need'} another pass</summary><p className="generate-note">These are unfinished editions. A fresh pass tries new ideas for today; the original stays saved. Temporary interruptions retry automatically.</p><ul>{attention.map(j=><li key={j.id}><div><button className="request-title" type="button" onClick={()=>onSelect(j)}>{j.input.location.name}, {j.input.location.region}</button><p>{j.input.quantity} requested · {recoveryReason(j)}</p></div><button type="button" disabled={!!retrying} onClick={()=>onRetry(j)}>{retrying===j.id?'Confirming fresh pass…':'Retry / open fresh pass'}</button></li>)}</ul></details>}
    </>}
  </section>;
}
