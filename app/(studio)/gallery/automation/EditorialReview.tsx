"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import type {CartoonReview,ReviewAction} from '@/lib/cartoon-review-core';
const unchecked=()=>({artwork:false,caption:false,context:false});
export default function EditorialReview({jobId,imageName,onStatus}:{jobId:string;imageName:string;onStatus:(review:CartoonReview)=>void}){
  const [review,setReview]=useState<CartoonReview|null>(null),[checks,setChecks]=useState(unchecked),[title,setTitle]=useState('');
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[pending,setPending]=useState<ReviewAction|null>(null);
  const statusRef=useRef(onStatus);statusRef.current=onStatus;
  const apply=useCallback((r:CartoonReview)=>{setReview(r);setTitle(r.title);setChecks(unchecked());statusRef.current(r);},[]);
  const refresh=useCallback(async(signal:AbortSignal)=>{
    setLoading(true);setError('');
    try{const response=await fetch(`/api/gallery/automation/reviews?jobId=${encodeURIComponent(jobId)}`,{cache:'no-store',signal:AbortSignal.any([signal,AbortSignal.timeout(15000)])});
      const data=await response.json();if(!response.ok)throw Error(data.error||'The review could not be loaded.');
      const r=data.reviews?.find((r:CartoonReview)=>r.imageName===imageName);if(!r)throw Error('This image’s review is unavailable.');
      if(!signal.aborted){apply(r);setPending(null);}
    }catch(e){if(!signal.aborted)setError(e instanceof Error?e.message:'Review unavailable.');}finally{if(!signal.aborted)setLoading(false);}
  },[jobId,imageName,apply]);
  useEffect(()=>{const controller=new AbortController();void refresh(controller.signal);return()=>controller.abort();},[refresh]);
  async function decide(action:ReviewAction['action'],retry?:ReviewAction){
    if(!review||busy)return;setBusy(true);setError('');
    const request=retry||{jobId,imageName,action,title,expectedVersion:review.version,requestId:crypto.randomUUID(),imageSha256:review.imageSha256,checks};
    setPending(request);
    try{const response=await fetch('/api/gallery/automation/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request),signal:AbortSignal.timeout(45000)});
      const data=await response.json();if(!response.ok){if(response.status<500)setPending(null);throw Error(data.error||'This decision is not confirmed.');}
      if(!data.review)throw Error('The decision could not be confirmed.');apply(data.review);setPending(null);
    }catch(e){setError(e instanceof Error?e.message:'The decision is not confirmed. Reload to check, or retry the same decision safely.');}finally{setBusy(false);}
  }
  return <section className="editorial-review" aria-label="Human editorial approval">
    <header><div><span className="studio-overline">Human approval required</span><h4>One last editorial look.</h4></div><button type="button" className="studio-text-button" disabled={busy||loading} onClick={()=>void refresh(new AbortController().signal)}>Reload review</button></header>
    {loading&&<p role="status">Checking the saved review…</p>}
    {!loading&&review&&<>
      <p className="editorial-state" role="status">{review.decision==='approved'?(review.isPublic?'Approved and published on the Cartoons page.':'Human-approved, but currently hidden in Manage gallery. Restore it there to show it publicly.'):review.decision==='rejected'?'Needs changes · saved privately.':review.decision==='withdrawn'?'Withdrawn from the gallery · original kept privately.':'Private draft. Finishing generation does not publish it.'}</p>
      {review.blockReason&&<p className="studio-notice editorial-block">{review.blockReason}</p>}
      <details className="editorial-evidence"><summary>Read the caption, TV, chalkboard & source together</summary><dl>
        <div><dt>Caption</dt><dd>{review.caption||'Not recorded'}</dd></div><div><dt>TV</dt><dd>{review.tv||'Not recorded'}</dd></div><div><dt>Chalkboard</dt><dd>{review.board.join(' / ')||'Not recorded'}</dd></div>
        {review.explanation&&<div><dt>Writer’s intent · verify it yourself</dt><dd>{review.explanation}</dd></div>}
        <div><dt>Source</dt><dd>{review.sourceUrl?<a href={review.sourceUrl} target="_blank" rel="noreferrer">{review.sourceTitle||'Open supporting source'} ↗</a>:'No verifiable source recorded'}</dd></div>
      </dl><p>Automated checks are not a reader rating or a substitute for your judgment.</p></details>
      {review.decision!=='approved'&&review.eligible&&<fieldset disabled={busy||!!pending} className="editorial-checklist"><legend>Your review of this specific cartoon</legend>
        <label><input type="checkbox" checked={checks.artwork} onChange={e=>setChecks(c=>({...c,artwork:e.target.checked}))}/>The approved cast, hands, set, and monochrome artwork look right.</label>
        <label><input type="checkbox" checked={checks.caption} onChange={e=>setChecks(c=>({...c,caption:e.target.checked}))}/>The grammar is correct, and the caption, TV, and chalkboard make sense together.</label>
        <label><input type="checkbox" checked={checks.context} onChange={e=>setChecks(c=>({...c,context:e.target.checked}))}/>I checked the source and local relevance; the tone is fair, warm, and publication-ready.</label>
        <label className="editorial-title">Gallery title<input type="text" value={title} maxLength={100} onChange={e=>setTitle(e.target.value)}/></label>
      </fieldset>}
      <div className="editorial-actions">
        {review.decision==='approved'?<><a className="studio-primary" href={`/gallery/best-of#cartoon-${review.publicId}`} target="_blank" rel="noreferrer">View in Cartoons ↗</a><button type="button" disabled={busy||!!pending} onClick={()=>void decide('withdraw')}>Withdraw from gallery</button></>:<><button type="button" className="studio-primary" disabled={busy||!!pending||!review.eligible||!title.trim()||!Object.values(checks).every(Boolean)} onClick={()=>void decide('approve')}>Approve & publish</button><button type="button" disabled={busy||!!pending||review.decision==='rejected'} onClick={()=>void decide('reject')}>Needs changes · keep private</button></>}
      </div>
      {busy&&<p role="status">Saving your editorial decision…</p>}
      {review.updatedAt&&<p className="generate-note">Last decision: {new Date(review.updatedAt).toLocaleString()} · Review {review.version}</p>}
    </>}
    {error&&<p role="alert" className="studio-notice">{error}</p>}
    {pending&&!busy&&<button type="button" onClick={()=>void decide(pending.action,pending)}>Retry the same decision</button>}
  </section>;
}
