"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { immediateEdition, generationProgress, matchingActiveEdition, US_STATES } from '@/lib/automation-simple';
import { validateEditionInput, type EditionInput } from '@/lib/automation-studio-core';
import type { AutomationJob } from '@/lib/automation-queue-core';
import {generationTimeline} from '@/lib/generation-timeline';
import EditionPreview from './EditionPreview';
import CartoonAssembly from './CartoonAssembly';
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
export default function GenerateStudio({canManage,presentation=false}:{canManage:boolean;presentation?:boolean}) {
  const [city,setCity]=useState('Naples'),[state,setState]=useState('Florida'),[quantity,setQuantity]=useState(1);
  const [jobs,setJobs]=useState<AutomationJob[]>([]),[focused,setFocused]=useState(''),[connected,setConnected]=useState<boolean|null>(null);
  const [pending,setPending]=useState<Receipt|null>(null),[ready,setReady]=useState(false),[sending,setSending]=useState(false),[error,setError]=useState(''),[pollError,setPollError]=useState('');
  const [retrying,setRetrying]=useState(''),[lastChecked,setLastChecked]=useState<string|null>(null);
  const formRef=useRef<HTMLFormElement>(null);
  const detailRef=useRef<HTMLElement>(null),retryLock=useRef(false);
  const inFlight=useRef(false),polling=useRef(false);
  const refresh=useCallback(async(signal?:AbortSignal)=>{
    if(polling.current)return;polling.current=true;
    try {
      const response=await fetch('/api/gallery/automation/jobs',{cache:'no-store',signal:AbortSignal.any([AbortSignal.timeout(12000),...(signal?[signal]:[])])});
      if(!response.ok)throw Error(response.status===401?'Sign in to view your saved requests.':'Connection interrupted. Saved work is safe; reconnecting automatically.');
      const data=await response.json();if(signal?.aborted)return;
      setJobs(data.jobs);setConnected(data.workerConnected);setLastChecked(new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}));setPollError('');
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

  const waiting=job?.status==='queued'||job?.progress.stage==='waiting-gpu';
  const connectionText=pollError?'Reconnecting':connected===null?'Connecting to studio':connected?'Local studio connected':'Local studio offline';
  function newEdition(){setFocused('new');try{localStorage.removeItem(FOCUS);}catch{}formRef.current?.querySelector('input')?.focus();}
  return <section className={`generate-studio${presentation?' generate-presentation':''}`} id="generate">
    <header className="generation-header"><div><p className="generate-eyebrow">The Swinging Door / Production studio</p><h1>A local point of view.</h1><p>Choose the place. We’ll find the conversation.</p></div>
      <div className="generation-header-tools">{canManage&&<div className={`studio-connection${connected&&!pollError?' is-connected':''}`} role="status"><span aria-hidden="true"/>{connectionText}</div>}
      {!presentation&&<Link href="/gallery/presentation">Presentation mode ↗</Link>}</div>
    </header>
    <div className="generation-workspace">
      <aside className="edition-composer">
        <div className="composer-title"><span className="studio-overline">01 / The brief</span><span className="studio-pill">Local edition</span></div>
        <h2>Create an edition</h2><p className="composer-description">Money, everyday life, and a little perspective. Made for the people who live there.</p>
        <form ref={formRef} className="generate-form" onSubmit={submit}>
          <fieldset disabled={!canManage||!!pending||sending}><label>City or town<input required maxLength={80} value={city} onChange={e=>setCity(e.target.value)} autoComplete="address-level2" placeholder="e.g. Naples"/></label>
          <label>State<select value={state} onChange={e=>setState(e.target.value)}>{US_STATES.map(s=><option key={s}>{s}</option>)}</select></label>
          <label>Cartoons<select value={quantity} onChange={e=>setQuantity(Number(e.target.value))}>{Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{i+1} {i===0?'cartoon':'cartoons'}</option>)}</select></label></fieldset>
          <div className="edition-spec"><span>Today’s edition</span><strong>{quantity} {quantity===1?'cartoon':'cartoons'} · Black & white</strong></div>
          {canManage?<button className="studio-primary generate-submit" type="submit" disabled={!ready||sending||(!!duplicateActive&&!pending)}><span>{sending?'Saving request…':pending?'Resume saved request':duplicateActive?'Edition already queued':active?'Queue cartoons':'Generate cartoons'}</span><span aria-hidden="true">{sending?'…':'↗'}</span></button>:<Link className="studio-primary generate-signin" href="/login?next=/gallery/automation">Sign in to generate ↗</Link>}
        </form>
        <p className="generate-note">{connected===false?'Your PC is offline. You can still save an edition; it waits safely until the studio returns.':'Saved to the queue first. Safe to leave this page—your edition keeps its place.'}</p>
        {pending&&<p className="studio-notice" role="status">Unconfirmed request: {pending.input.quantity} for {pending.input.location.name}, {pending.input.location.region}. Resume uses the same request ID.</p>}
        {error&&<p role="alert" className="studio-notice">{error}</p>}
        <div className="composer-guidelines"><span className="studio-overline">The editorial direction</span><p>Smart. Warm. Politically balanced.</p><ul><li>Local subjects with a human connection</li><li>Caption, TV, and chalkboard in conversation</li><li>A draft for your review—not auto-published</li></ul></div>
        <Link className="composer-schedule" href="/gallery/automation/planner">Plan a date or recurring edition <span aria-hidden="true">→</span></Link>
      </aside>
      <div className="edition-workspace-panel">
        <div className="workspace-toolbar"><span className="studio-overline">02 / The edition</span>{canManage&&<button type="button" onClick={newEdition}>New edition +</button>}</div>
        {pollError&&<div className="studio-notice connection-notice" role="status"><span>{pollError} {lastChecked&&`Last checked at ${lastChecked}.`}</span><button type="button" onClick={()=>void refresh()}>Reconnect now</button></div>}
        {job&&<CartoonAssembly key={`build-${job.id}`} job={job} connected={connected===true&&!pollError}/>}
        {job&&progress?<section ref={detailRef} tabIndex={-1} className={`generation-progress ${waiting?'is-waiting':''}`} aria-label="Generation progress">
          <div className="progress-topline"><span>{job.input.location.name}, {job.input.location.region}</span><span className="studio-pill">{job.status==='succeeded'?'Edition saved':job.status==='failed'?'Needs review':waiting?'In the queue':'In production'}</span></div>
          <div className="progress-title"><h2>{progress.label}</h2><strong>{job.status==='failed'?'Review':`${progress.percent}%`}</strong></div>
          {job.status!=='failed'&&<MilestoneBar job={job}/>}
          <p role="status" className="progress-detail">{progress.detail}</p>
          {job.status!=='succeeded'&&<ol className="production-timeline" aria-label="Production phases">{generationTimeline(job).map((step,i)=><li key={step.label} data-state={step.state} aria-current={step.state==='current'?'step':undefined}><span aria-hidden="true">{step.state==='complete'?'✓':String(i+1).padStart(2,'0')}</span><div>{step.label}<small>{step.state==='current'?'In progress':step.state==='complete'?'Checked':'Upcoming'}</small></div></li>)}</ol>}
          {waiting&&<p className="generate-note">No artificial countdown. This view advances when the studio confirms a completed step.</p>}
          {job.status==='failed'&&<div className="recovery-actions"><button className="studio-primary" type="button" disabled={!!retrying} onClick={()=>void retry(job)}>{retrying===job.id?'Confirming fresh pass…':'Retry / open fresh pass'}</button>{!pending&&<button type="button" onClick={()=>{setCity(job.input.location.name);setState(job.input.location.region);setQuantity(job.input.quantity);const field=formRef.current?.querySelector<HTMLInputElement>('input');field?.scrollIntoView({behavior:'smooth',block:'center'});field?.focus({preventScroll:true});}}>Edit place and start again</button>}<p className="generate-note">A fresh pass starts a new edition for today, or opens the existing retry. The original stays saved.</p></div>}
          {job.status==='running'&&(connected===false||!!pollError||Date.parse(job.leaseExpiresAt||'')<Date.now())&&<p className="studio-notice">Studio connection lost. Progress stays at the last confirmed milestone. Saved steps resume when the worker reconnects.</p>}
          <p className="generate-note">{job.input.location.name}, {job.input.location.region} · {job.input.quantity} requested · Progress counts completed stages, not time remaining.</p>
          <details className="request-technical"><summary>Production record</summary><dl><div><dt>Request</dt><dd>{job.id}</dd></div><div><dt>Attempt / worker stage</dt><dd>{job.attempt} / {job.progress.stage}</dd></div><div><dt>Confirmed milestones</dt><dd>{job.progress.completed} / {job.progress.total}</dd></div></dl>{job.lastError&&<p>Last production check: {job.lastError}</p>}</details>
        </section>:<div className="studio-idle"><div className="studio-idle-copy"><span className="studio-overline">{canManage?'Your next edition starts here':'A familiar room. A new conversation.'}</span><h2>One room.<br/>A thousand<br/><em>conversations.</em></h2><p>Choose a city to start a new edition. Follow production here, then inspect every cartoon at full size.</p><span className="idle-caption">Shown: an existing gallery cartoon.<br/>Your new artwork will appear after production.</span></div><Image src="/gallery/best-of-v1/previews/professional-opposition.webp" width={512} height={768} sizes="(max-width: 700px) 70vw, 350px" alt="Existing gallery example: Barclay says, I pay for financial advice so my second-guessing has professional opposition." priority/></div>}
        {job?.status==='succeeded'&&<EditionPreview key={job.id} job={job}/>}
      </div>
    </div>
    {canManage&&<RequestBoard jobs={jobs} focused={job?.id} connected={connected} pollError={pollError} loading={connected===null} retrying={retrying} onSelect={selectJob} onRetry={j=>void retry(j)}/>}
    <footer className="generate-links"><p>Built for a recurring place on the page.<span>Machine-reviewed drafts. Human editorial approval.</span></p><Link href="/gallery/best-of">Browse the approved collection ↗</Link></footer>
  </section>;
}
