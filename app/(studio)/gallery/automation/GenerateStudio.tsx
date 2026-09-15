"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { immediateEdition, generationProgress, matchingActiveEdition, US_STATES } from '@/lib/automation-simple';
import { validateEditionInput, type EditionInput } from '@/lib/automation-studio-core';
import type { AutomationJob } from '@/lib/automation-queue-core';
import { PRINT_SIZES, printMetrics, type PrintSizeId } from '@/lib/cartoon-print';
import RequestBoard, { MilestoneBar } from './RequestBoard';
const RECEIPT='swinging-door-quick-generation-v1';
const FOCUS='swinging-door-active-edition-v1';
type Receipt={requestId:string;input:EditionInput;recordedAt:string};
function readReceipt():Receipt|null {
  const raw=localStorage.getItem(RECEIPT);if(!raw)return null;
  const value=JSON.parse(raw) as Receipt;
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value.requestId)||!Number.isFinite(Date.parse(value.recordedAt)))throw Error('The saved request needs checking before another is sent.');
  return {...value,input:validateEditionInput(value.input,new Date(value.recordedAt))};
}
function asset(job:AutomationJob,name:string){return `/api/gallery/automation/assets?jobId=${job.id}&name=${encodeURIComponent(name)}`;}
function CompletedImages({job}:{job:AutomationJob}) {
  const [size,setSize]=useState<PrintSizeId>('fine'),[busy,setBusy]=useState(''),[error,setError]=useState('');
  const metrics=printMetrics(1024,1536,size,'letter');
  async function download(name:string,sha256:string) {
    setBusy(name);setError('');
    try {
      const response=await fetch(asset(job,name),{cache:'no-store'});if(!response.ok)throw Error('The image could not be downloaded. Please sign in again if your session expired.');
      const bytes=new Uint8Array(await response.arrayBuffer());
      const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');
      if(hash!==sha256)throw Error('The saved image did not pass its integrity check.');
      const {cartoonPrintPDF}=await import('@/lib/cartoon-print-pdf');
      const pdf=await cartoonPrintPDF(bytes,`${job.input.location.name} - ${name}`,1024,1536,size,'letter');
      const url=URL.createObjectURL(new Blob([pdf as BlobPart],{type:'application/pdf'}));const link=document.createElement('a');link.href=url;link.download=`${job.input.location.name}-${name.replace('.png','')}-${size}.pdf`;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
    }catch(e){setError(e instanceof Error?e.message:'Download failed.');}finally{setBusy('');}
  }
  return <section className="generation-results" aria-label="Finished cartoons">
    <h3>{job.input.location.name}, {job.input.location.region}</h3>
    <p>New, machine-reviewed drafts. Review the joke, source context, and artwork before publishing.</p>
    <label>PDF artwork size <select value={size} onChange={e=>setSize(e.target.value as PrintSizeId)}>{PRINT_SIZES.map(s=><option key={s.id} value={s.id}>{s.width} × {s.height} inches</option>)}</select></label>
    <p className="generate-note">{metrics.ppi} effective PPI · US Letter · print at Actual size. Enlarging does not add detail.</p>
    {error&&<p role="alert">{error}</p>}
    <div className="generation-image-grid">{job.artifacts.filter(a=>a.kind==='image').map((a,i)=><figure key={a.name}>
      <Image src={asset(job,a.name)} alt={`${job.input.location.name} generated cartoon ${i+1}; review draft`} width={1024} height={1536} unoptimized onError={()=>setError('A saved image could not load. Check your connection or sign in again; the completed request remains saved.')} />
      <figcaption><a href={asset(job,a.name)} target="_blank" rel="noreferrer">Open original {i+1}</a> <button type="button" disabled={!!busy} onClick={()=>void download(a.name,a.sha256)}>{busy===a.name?'Preparing PDF…':'Download print PDF'}</button></figcaption>
    </figure>)}</div>
    {job.artifacts.filter(a=>a.kind==='report').map(a=><a key={a.name} href={asset(job,a.name)} target="_blank" rel="noreferrer">Source evidence and production report</a>)}
  </section>;
}
export default function GenerateStudio({canManage,presentation=false}:{canManage:boolean;presentation?:boolean}) {
  const [city,setCity]=useState('Naples'),[state,setState]=useState('Florida'),[quantity,setQuantity]=useState(1);
  const [jobs,setJobs]=useState<AutomationJob[]>([]),[focused,setFocused]=useState(''),[connected,setConnected]=useState<boolean|null>(null);
  const [pending,setPending]=useState<Receipt|null>(null),[ready,setReady]=useState(false),[sending,setSending]=useState(false),[error,setError]=useState(''),[pollError,setPollError]=useState('');
  const [retrying,setRetrying]=useState('');
  const detailRef=useRef<HTMLElement>(null),retryLock=useRef(false);
  const inFlight=useRef(false),polling=useRef(false);
  const refresh=useCallback(async(signal?:AbortSignal)=>{
    if(polling.current)return;polling.current=true;
    try {
      const response=await fetch('/api/gallery/automation/jobs',{cache:'no-store',signal:AbortSignal.any([AbortSignal.timeout(12000),...(signal?[signal]:[])])});
      if(!response.ok)throw Error(response.status===401?'Sign in to view your saved requests.':'Connection interrupted. Saved work is safe; reconnecting automatically.');
      const data=await response.json();if(signal?.aborted)return;
      setJobs(data.jobs);setConnected(data.workerConnected);setPollError('');
      const receipt=readReceipt();
      const found=receipt&&data.jobs.find((j:AutomationJob)=>j.requestId===receipt.requestId);
      if(found){localStorage.removeItem(RECEIPT);localStorage.setItem(FOCUS,found.id);setPending(null);setFocused(found.id);}
    }catch(e){if(!signal?.aborted)setPollError(e instanceof Error?e.message:'Could not check progress.');}finally{polling.current=false;}
  },[]);
  useEffect(()=>{
    if(!canManage)return;
    try {const saved=readReceipt();setPending(saved);if(saved){setCity(saved.input.location.name);setState(saved.input.location.region);setQuantity(saved.input.quantity);}setFocused(presentation?'':localStorage.getItem(FOCUS)||'');if(!navigator.locks)throw Error('This browser cannot safely save a duplicate-proof request. Use a current browser.');setReady(true);}catch(e){setError(e instanceof Error?e.message:'Browser storage is unavailable.');}
    const controller=new AbortController();void refresh(controller.signal);
    const timer=setInterval(()=>{if(!document.hidden)void refresh(controller.signal);},4000);
    const resume=()=>void refresh(controller.signal);document.addEventListener('visibilitychange',resume);
    return()=>{controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',resume);};
  },[canManage,presentation,refresh]);
  const job=focused?jobs.find(j=>j.id===focused):presentation?undefined:jobs.find(j=>j.status==='running')||jobs.find(j=>j.status==='queued'&&j.scheduleStatus!=='paused'&&Date.parse(j.dueAt)<=Date.now())||jobs.find(j=>j.status==='succeeded');
  const active=jobs.some(j=>(j.status==='running'||j.status==='queued'&&j.scheduleStatus!=='paused')&&Date.parse(j.dueAt)<=Date.now());
  const duplicateActive=matchingActiveEdition(jobs,city,state,quantity);
  function selectJob(selected:AutomationJob){
    setFocused(selected.id);
    try{localStorage.setItem(FOCUS,selected.id);}catch{/* The in-memory selection still works. */}
    requestAnimationFrame(()=>{detailRef.current?.scrollIntoView({behavior:'smooth',block:'start'});detailRef.current?.focus({preventScroll:true});});
  }
  async function retry(original:AutomationJob){
    if(retryLock.current)return;retryLock.current=true;setRetrying(original.id);setError('');
    try{
      const response=await fetch('/api/gallery/automation/retry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jobId:original.id}),signal:AbortSignal.timeout(20000)});
      const body=await response.json();
      if(!response.ok)throw Error(body.error||'The fresh pass is not confirmed yet. Retry the same saved request safely.');
      const resumed=body.job as AutomationJob;
      if(!resumed?.id)throw Error('The fresh pass is being confirmed. Retry the same saved request safely.');
      setJobs(old=>[resumed,...old.filter(j=>j.id!==resumed.id)]);selectJob(resumed);void refresh();
    }catch(e){setError(e instanceof Error?e.message:'Connection interrupted. Retry this same request; it will not create a duplicate fresh pass.');}
    finally{retryLock.current=false;setRetrying('');}
  }
  async function submit(event:React.FormEvent) {
    event.preventDefault();if(inFlight.current||!ready)return;inFlight.current=true;setSending(true);setError('');
    try {
      await navigator.locks.request(RECEIPT,async()=>{
        let receipt=readReceipt();
        if(!receipt){
          const check=await fetch('/api/gallery/automation/jobs',{cache:'no-store',signal:AbortSignal.timeout(12000)});
          if(!check.ok)throw Error('The queue cannot be checked yet. No new request was sent.');
          const queue=await check.json();
          const alreadyActive=matchingActiveEdition(queue.jobs,city,state,quantity);
          if(alreadyActive){setJobs(queue.jobs);setFocused(alreadyActive.id);localStorage.setItem(FOCUS,alreadyActive.id);throw Error('This same edition is already queued or running. Its current status is shown below; no duplicate was created.');}
          receipt={requestId:crypto.randomUUID(),input:immediateEdition(city,state,quantity),recordedAt:new Date().toISOString()};
        }
        localStorage.setItem(RECEIPT,JSON.stringify(receipt));setPending(receipt);
        const response=await fetch('/api/gallery/automation/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId:receipt.requestId,input:receipt.input}),signal:AbortSignal.timeout(20000)});
        const body=await response.json();
        if(!response.ok){if(response.status===400){localStorage.removeItem(RECEIPT);setPending(null);}throw Error(body.error||'Request not yet confirmed. Use Resume request to check the same request safely.');}
        const created=body.job as AutomationJob;if(!created?.id)throw Error('The saved request is being confirmed.');
        localStorage.setItem(FOCUS,created.id);localStorage.removeItem(RECEIPT);setPending(null);setFocused(created.id);setJobs(old=>[created,...old.filter(j=>j.id!==created.id)]);
      });
      void refresh();
    }catch(e){setError(e instanceof Error?e.message:'Could not confirm the request. Resume it without creating a duplicate.');}finally{inFlight.current=false;setSending(false);}
  }
  const progress=job?generationProgress(job):null;
  return <section className="generate-studio" id="generate">
    <header><p className="generate-eyebrow">Your local edition</p><h1>Choose a place. Make a cartoon.</h1><p>The room and cast stay familiar. The caption, television picture, and chalkboard change together.</p></header>
    {!canManage?<p className="generate-callout"><Link href="/login?next=/gallery/automation">Sign in to generate cartoons</Link>. The presentation and existing cartoons are available to view.</p>:<>
      <p className="studio-connection" role="status">{connected===null?'Checking the local studio…':connected?'● Local studio connected':'○ Local studio offline · requests stay saved until it returns'}</p>
      <form className="generate-form" onSubmit={submit}>
        <label>City or town<input required maxLength={80} value={city} onChange={e=>setCity(e.target.value)} disabled={!!pending||sending} autoComplete="address-level2" /></label>
        <label>State<select value={state} onChange={e=>setState(e.target.value)} disabled={!!pending||sending}>{US_STATES.map(s=><option key={s}>{s}</option>)}</select></label>
        <label>Cartoons<select value={quantity} onChange={e=>setQuantity(Number(e.target.value))} disabled={!!pending||sending}>{Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></label>
        <button type="submit" disabled={!ready||sending||(!!duplicateActive&&!pending)}>{sending?'Saving request…':pending?'Resume saved request':duplicateActive?'Edition already queued':active?'Queue cartoons':'Generate cartoons'}</button>
      </form>
      <p className="generate-note">One click saves your request. The studio works through queued editions, waiting for other GPU work when needed. Each cartoon takes several minutes; larger batches run in sequence. You can close this page and return.</p>
      {pending&&<p role="status">Unconfirmed request: {pending.input.quantity} for {pending.input.location.name}, {pending.input.location.region}. Resume uses the same request ID.</p>}
      {error&&<p role="alert">{error}</p>}{pollError&&<p role="status">{pollError}</p>}
      {job&&progress&&<section ref={detailRef} tabIndex={-1} className="generation-progress" aria-label="Generation progress">
        <div><h2>{progress.label}</h2><strong>{job.status==='failed'?'Review':`${progress.percent}%`}</strong></div>
        {job.status!=='failed'&&<MilestoneBar job={job}/>}
        <p role="status">{progress.detail}</p>
        {job.status==='failed'&&<><button type="button" disabled={!!retrying} onClick={()=>void retry(job)}>{retrying===job.id?'Confirming fresh pass…':'Retry / open fresh pass'}</button>{!pending&&<button type="button" className="request-edit-place" onClick={()=>{setCity(job.input.location.name);setState(job.input.location.region);setQuantity(job.input.quantity);const field=document.querySelector<HTMLInputElement>('.generate-form input');field?.scrollIntoView({behavior:'smooth',block:'center'});field?.focus({preventScroll:true});}}>Edit place and start again</button>}<p className="generate-note">Starts a new edition for today, or opens the existing fresh pass. The original record is preserved.</p></>}
        {job.status==='running'&&(!connected||Date.parse(job.leaseExpiresAt||'')<Date.now())&&<p>Studio connection lost. The bar is paused at the last confirmed milestone; saved steps will resume when the worker reconnects.</p>}
        <p className="generate-note">{job.input.location.name}, {job.input.location.region} · {job.input.quantity} requested · Progress counts completed stages, not time remaining.</p>
        <details><summary>Request details</summary><p>Request {job.id} · attempt {job.attempt} · {job.progress.stage}</p>{job.lastError&&<p>Last production check: {job.lastError}</p>}</details>
      </section>}
      {job?.status==='succeeded'&&<CompletedImages key={job.id} job={job}/>}
      {connected!==null&&<RequestBoard jobs={jobs} focused={job?.id} connected={connected} pollError={pollError} retrying={retrying} onSelect={selectJob} onRetry={j=>void retry(j)}/>}
    </>}
    {!presentation&&<footer className="generate-links"><Link href="/gallery/automation/planner">Advanced plans and schedules</Link><Link href="/gallery/presentation">Presentation for Rick</Link></footer>}
    <p className="generate-note">Progress reflects confirmed production milestones, not an estimated wait. Finished images appear automatically. Editions that need more research or creative work remain saved with a recovery option. Publication still needs your review.</p>
  </section>;
}
