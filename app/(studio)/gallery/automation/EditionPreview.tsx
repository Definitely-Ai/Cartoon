"use client";
import Image from 'next/image';
import {useState} from 'react';
import type {AutomationJob} from '@/lib/automation-queue-core';
import {PRINT_SIZES,printMetrics,type PrintSizeId} from '@/lib/cartoon-print';
import {artifactURL} from './RequestBoard';
import EditorialReview from './EditorialReview';
import type {ReviewDecision} from '@/lib/cartoon-review-core';

export default function EditionPreview({job}:{job:AutomationJob}){
  const images=job.artifacts.filter(a=>a.kind==='image');
  const [index,setIndex]=useState(0),[size,setSize]=useState<PrintSizeId>('fine'),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [decisions,setDecisions]=useState<Record<string,ReviewDecision>>({});
  const art=images[index]||images[0],metrics=printMetrics(1024,1536,size,'letter');
  async function download(){
    if(!art||busy)return;setBusy(true);setError('');
    try{
      const response=await fetch(artifactURL(job,art.name),{cache:'no-store',signal:AbortSignal.timeout(30000)});
      if(!response.ok)throw Error('The image could not be downloaded. Check your connection or sign in again.');
      const bytes=new Uint8Array(await response.arrayBuffer());
      const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');
      if(hash!==art.sha256)throw Error('The saved image did not pass its integrity check.');
      const {cartoonPrintPDF}=await import('@/lib/cartoon-print-pdf');
      const pdf=await cartoonPrintPDF(bytes,`${job.input.location.name} - ${art.name}`,1024,1536,size,'letter');
      const url=URL.createObjectURL(new Blob([pdf as BlobPart],{type:'application/pdf'}));
      const link=document.createElement('a');link.href=url;link.download=`${job.input.location.name}-${art.name.replace('.png','')}-${size}.pdf`;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
    }catch(e){setError(e instanceof Error?e.message:'The PDF could not be prepared. Your original is still saved.');}finally{setBusy(false);}
  }
  if(!art)return <p className="studio-notice">No image is available in this edition’s saved record.</p>;
  return <section className="generation-results" aria-label="Finished cartoons">
    <header className="edition-preview-heading"><div><span className="studio-overline">Your generated edition</span><h3>{job.input.location.name}, {job.input.location.region}</h3></div><span className="studio-pill">{decisions[art.name]==='approved'?'Human-approved':decisions[art.name]==='rejected'?'Needs changes · private':decisions[art.name]==='withdrawn'?'Withdrawn · private':decisions[art.name]==='draft'?'Draft · not published':'Checking review'}</span></header>
    <div className="edition-lightbox generation-image-grid"><figure>
      <a href={artifactURL(job,art.name)} target="_blank" rel="noreferrer" aria-label={`Open original ${index+1}`}>
        <Image key={art.name} src={artifactURL(job,art.name)} alt={`${job.input.location.name} generated cartoon ${index+1}; review draft`} width={1024} height={1536} unoptimized onError={()=>setError('This preview could not load. The original remains saved; check your connection or sign in again.')} />
      </a>
    </figure></div>
    <div className="edition-pagination"><button type="button" disabled={index===0} onClick={()=>{setIndex(i=>i-1);setError('');}} aria-label="Previous generated cartoon">←</button><span aria-live="polite">Cartoon {index+1} <span>of {images.length}</span></span><button type="button" disabled={index>=images.length-1} onClick={()=>{setIndex(i=>i+1);setError('');}} aria-label="Next generated cartoon">→</button></div>
    {images.length>1&&<div className="edition-filmstrip" aria-label="Cartoons in this edition">{images.map((a,i)=><button key={a.name} type="button" aria-label={`View cartoon ${i+1}`} aria-pressed={i===index} onClick={()=>{setIndex(i);setError('');}}><Image src={artifactURL(job,a.name)} width={64} height={96} alt="" unoptimized/><span>{String(i+1).padStart(2,'0')}</span></button>)}</div>}
    <div className="edition-export"><label>PDF artwork size<select value={size} disabled={busy} onChange={e=>setSize(e.target.value as PrintSizeId)}>{PRINT_SIZES.map(s=><option key={s.id} value={s.id}>{s.width} × {s.height} inches</option>)}</select></label><button className="studio-primary" type="button" disabled={busy} onClick={()=>void download()}>{busy?'Preparing PDF…':'Download print PDF'}</button><a href={artifactURL(job,art.name)} target="_blank" rel="noreferrer">Original PNG ↗</a></div>
    <p className="generate-note">{metrics.ppi} effective PPI · US Letter · print at Actual size. Enlarging does not add detail.</p>
    {error&&<p role="alert" className="studio-notice">{error}</p>}
    <EditorialReview key={`${job.id}/${art.name}`} jobId={job.id} imageName={art.name} onStatus={r=>setDecisions(d=>({...d,[art.name]:r.decision}))}/>
    <details className="edition-review-notes"><summary>Before publishing: the editorial check</summary><p>Review the caption, its connection to the TV and chalkboard, character likeness, and source context. Automated checks are not editorial approval.</p>{job.artifacts.filter(a=>a.kind==='report').map(a=><a key={a.name} href={artifactURL(job,a.name)} target="_blank" rel="noreferrer">Source evidence and production report ↗</a>)}</details>
  </section>;
}
