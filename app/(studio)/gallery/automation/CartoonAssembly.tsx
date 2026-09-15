"use client";
import Image from 'next/image';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {AutomationJob} from '@/lib/automation-queue-core';
import {generationProgress} from '@/lib/automation-simple';
import {BUILD_STAGES,BUILD_LABELS,type SavedBuildFrame,type BuildStage} from '@/lib/cartoon-build-core';

const DESCRIPTIONS:Record<BuildStage,string>={
  cast:'The permanent room and approved cast pose are in place. These are retained originals—not a new character redraw.',
  story:'A local subject, a clear point of view, and one connected idea. The selected caption has passed machine editorial checks; human review comes later.',
  tv:'The new black-and-white TV picture has passed its machine visual check and is fitted to the screen.',
  chalk:'A small, hand-lettered menu observation. Exact chalk lettering is fitted to the existing board.',
  lettering:'The caption is set in type at the foot of the picture. This is still a private draft, awaiting the completed edition and human review.',
};
const frameKey=(f:SavedBuildFrame)=>`${f.index}:${f.stage}`;
// Bounding boxes of the unchanged, approved reference-v2 display surfaces.
const DETAILS:Partial<Record<BuildStage,{label:string;x:number;y:number;width:number;height:number}>>={tv:{label:'Television close-up',x:330,y:86,width:388,height:254},chalk:{label:'Chalkboard close-up',x:810,y:65,width:200,height:249}};
export default function CartoonAssembly({job,connected}:{job:AutomationJob;connected:boolean}){
  const [frames,setFrames]=useState<SavedBuildFrame[]>([]),[error,setError]=useState(''),[loaded,setLoaded]=useState(false);
  const [selected,setSelected]=useState(''),[following,setFollowing]=useState(true),[replaying,setReplaying]=useState(false),[imageError,setImageError]=useState(''),[fullScreen,setFullScreen]=useState(false);
  const shell=useRef<HTMLElement>(null),busy=useRef(false),initialized=useRef(false),hadFrames=useRef(false);
  useEffect(()=>{const update=()=>setFullScreen(document.fullscreenElement===shell.current);document.addEventListener('fullscreenchange',update);return()=>document.removeEventListener('fullscreenchange',update);},[]);
  const refresh=useCallback(async(signal?:AbortSignal)=>{
    if(busy.current)return;busy.current=true;
    try{
      const response=await fetch(`/api/gallery/automation/build?jobId=${job.id}`,{cache:'no-store',signal:AbortSignal.any([AbortSignal.timeout(12000),...(signal?[signal]:[])])});
      if(!response.ok)throw Error(response.status===401?'Sign in again to view this private build.':'Preview connection interrupted. The last saved frame stays visible.');
      const data=await response.json();if(!Array.isArray(data.frames)||data.frames.length>60)throw Error('The saved build record needs checking.');
      if(signal?.aborted)return;
      setFrames(data.frames);setError('');setLoaded(true);
      if(!initialized.current&&data.frames.length){setSelected(frameKey(data.frames.at(-1)));initialized.current=true;}
      else if(!hadFrames.current&&data.frames.length){setSelected(frameKey(data.frames[0]));initialized.current=true;}
      hadFrames.current=data.frames.length>0;
    }catch(e){if(!signal?.aborted){setError(e instanceof Error?e.message:'Build previews are reconnecting.');setLoaded(true);}}
    finally{busy.current=false;}
  },[job.id]);
  useEffect(()=>{
    const controller=new AbortController();void refresh(controller.signal);
    const timer=setInterval(()=>{if(!document.hidden)void refresh(controller.signal);},4000);
    const resume=()=>{if(!document.hidden)void refresh(controller.signal);};document.addEventListener('visibilitychange',resume);
    return()=>{controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',resume);};
  },[refresh]);
  // Step through only frames already saved by the worker. This animation never
  // supplies invented work, time estimates, or a simulated generation result.
  const position=frames.findIndex(f=>frameKey(f)===selected),current=frames[position]||frames.at(-1);
  useEffect(()=>{
    if(!frames.length||(!following&&!replaying))return;
    if(position>=frames.length-1){if(replaying)setReplaying(false);return;}
    const timer=setTimeout(()=>setSelected(frameKey(frames[Math.max(0,position+1)])),2000);
    return()=>clearTimeout(timer);
  },[frames,position,following,replaying]);
  function choose(frame:SavedBuildFrame){setFollowing(false);setReplaying(false);setSelected(frameKey(frame));setImageError('');}
  async function expand(){try{if(document.fullscreenElement)await document.exitFullscreen();else await shell.current?.requestFullscreen();}catch{setError('Your browser could not open full screen. The build is still available here.');}}
  const active=job.status==='running'||job.status==='queued';
  const caughtUp=position===frames.length-1;
  const live=following&&!replaying&&active&&caughtUp;
  const chosenIndex=current?.index||1;
  const imageUrl=current?`/api/gallery/automation/build?${new URLSearchParams({jobId:job.id,index:String(current.index),stage:current.stage,sha256:current.artifact.sha256})}`:'';
  const detail=current?DETAILS[current.stage]:undefined;
  const progress=generationProgress(job);
  return <section className="cartoon-assembly" ref={shell} aria-label="Live cartoon assembly">
    <header className="assembly-heading"><div><span className="assembly-overline">The making of an edition</span><h3>Inside the cartoon.</h3></div><div className="assembly-tools"><span className={`assembly-mode ${live&&connected?'is-live':''}`} role="status"><i aria-hidden="true"/>{replaying?'Replay · saved stages':live?(connected?'Live · saved progress':'Connection paused'):following&&!caughtUp?'Showing saved stages':active?'Inspecting a saved stage':'Saved build'}</span><button type="button" onClick={()=>void expand()} aria-label={fullScreen?'Exit full-screen assembly':'Expand cartoon assembly'}>⛶ <span>{fullScreen?'Exit full screen':'Expand'}</span></button></div></header>
    <div className="assembly-live-progress"><span>{job.input.location.name}, {job.input.location.region} · {progress.label}</span><strong>{job.status==='failed'?'Needs review':`${progress.percent}%`}</strong><progress max={100} value={progress.percent} aria-label="Confirmed edition milestones"/></div>
    {error&&<div className="assembly-warning" role="status">{error} <button type="button" onClick={()=>void refresh()}>Reconnect previews</button></div>}
    {!current?<div className="assembly-waiting"><div className="assembly-empty-sheet" aria-hidden="true"><span>THE SWINGING DOOR</span><div/><div/><p>Private production canvas</p></div><div><span className="assembly-overline">No invented previews</span><h4>{!loaded?'Opening the studio…':job.status==='succeeded'?'This earlier edition has no build recording.':'Waiting for the first saved frame.'}</h4><p>{job.status==='succeeded'?'Build recordings are captured by the updated worker for new editions. The finished original remains available below.':'The actual approved set and cast appear here first. Then the idea, television picture, chalkboard, and final caption arrive as the worker saves them.'}</p><small>Refreshing or leaving this page does not discard saved production.</small></div></div>:<>
      <div className="assembly-body">
        <div className="assembly-art"><div className="assembly-paper" key={imageUrl}><Image src={imageUrl} width={1024} height={1536} unoptimized alt={`Cartoon ${current.index}: ${BUILD_LABELS[current.stage]} checkpoint with ${current.speaker} speaking`} onLoad={()=>setImageError('')} onError={()=>setImageError('This preview could not be loaded. Reconnect to retrieve the saved frame.')} priority/><span className="assembly-paper-label">{String(current.index).padStart(2,'0')} / {String(job.input.quantity).padStart(2,'0')} <span>PRIVATE BUILD</span></span></div>{imageError&&<p role="status" className="assembly-warning">{imageError}</p>}</div>
        <div className="assembly-notes" key={`${current.index}:${current.stage}`}><span className="assembly-overline">Checkpoint {String(BUILD_STAGES.indexOf(current.stage)+1).padStart(2,'0')} / 05</span><h4>{BUILD_LABELS[current.stage]}</h4><p>{DESCRIPTIONS[current.stage]}</p>
          {detail&&<figure className="assembly-detail"><div style={{aspectRatio:`${detail.width}/${detail.height}`}}><Image src={imageUrl} width={1024} height={1536} unoptimized alt={detail.label+' from this saved frame'} style={{width:`${1024/detail.width*100}%`,left:`${-detail.x/detail.width*100}%`,top:`${-detail.y/detail.height*100}%`}}/></div><figcaption>{detail.label} · same saved artwork</figcaption></figure>}
          <div className="assembly-cast"><span>{current.variant==='trio'?'Drew · Barclay · Abby':'Drew · Barclay'}</span><strong>{current.speaker} has the floor.</strong><small>Speaker’s mouth open. Listeners facing the speaker. Approved reference cast.</small></div>
          {current.caption&&<div className="assembly-caption"><span>Selected dialogue</span><blockquote>“{current.caption}”</blockquote></div>}
          {current.tvHeadline&&<div className="assembly-screen-copy"><div><span>On the television</span><strong>{current.tvHeadline}</strong></div><div><span>On the chalkboard</span><p>{current.boardLines.map((line,i)=><span key={i}>{line}</span>)}</p></div></div>}
          {current.sourceUrl&&<details className="assembly-source"><summary>The local connection</summary><a href={current.sourceUrl} target="_blank" rel="noreferrer">{current.sourceTitle} ↗</a><p>{current.sourceScope}</p><small>Source context, not evidence that a fictional character’s experience actually happened.</small></details>}
        </div>
      </div>
      <div className="assembly-playback"><div><button type="button" disabled={frames.length<2} onClick={()=>{setFollowing(false);setReplaying(true);setSelected(frameKey(frames[0]));}}>↺ Replay saved stages</button>{active&&!following&&<button type="button" onClick={()=>{setReplaying(false);setFollowing(true);setSelected(frameKey(frames.at(-1)!));}}>Follow live →</button>}{replaying&&<button type="button" onClick={()=>setReplaying(false)}>Pause replay</button>}</div>{job.input.quantity>1&&<label>Cartoon<select value={chosenIndex} onChange={e=>{const group=frames.filter(f=>f.index===Number(e.target.value));if(group.length)choose(group.at(-1)!);}}>{Array.from({length:job.input.quantity},(_,i)=><option value={i+1} key={i+1} disabled={!frames.some(f=>f.index===i+1)}>{i+1} of {job.input.quantity}{!frames.some(f=>f.index===i+1)?' · waiting':''}</option>)}</select></label>}</div>
      <ol className="assembly-stages" aria-label="Saved cartoon parts">{BUILD_STAGES.map((stage,i)=>{const frame=frames.find(f=>f.index===chosenIndex&&f.stage===stage);return <li key={stage}><button type="button" disabled={!frame} aria-pressed={current.stage===stage} onClick={()=>frame&&choose(frame)}><span>{frame?'✓':String(i+1).padStart(2,'0')}</span><strong>{BUILD_LABELS[stage]}</strong><small>{frame?'Saved · view stage':'Awaiting checkpoint'}</small></button></li>;})}</ol>
      <footer className="assembly-footnote"><span>Every reveal is a saved worker checkpoint. Replay changes only what you’re viewing.</span><strong>Human approval still required.</strong></footer>
    </>}
  </section>;
}
