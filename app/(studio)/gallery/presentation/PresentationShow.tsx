"use client";

import Image from 'next/image';
import Link from 'next/link';
import {useCallback,useEffect,useRef,useState} from 'react';
import {flushSync} from 'react-dom';
import type {BestOfCartoon} from '@/lib/best-of-cartoons';
import GenerateStudio from '../automation/GenerateStudio';

type Slide={kind:'opening'|'places'|'cartoon'|'system'|'demo'|'closing';title:string;cartoon?:BestOfCartoon};
// The approved collection only. Withdrawn city studies never enter the show.
const ORDER=['professional-opposition','individual-flakes','quiet-arrivals','divide-the-credit','austin-taking-offers','los-angeles-view-included'];
export default function PresentationShow({cartoons,canManage}:{cartoons:BestOfCartoon[];canManage:boolean}){
  const featured=ORDER.map(id=>cartoons.find(c=>c.id===id)).filter((c):c is BestOfCartoon=>!!c);
  const cities=featured.length?featured:cartoons.slice(0,6);
  const slides:Slide[]=[{kind:'opening',title:'A familiar place to see ourselves'},{kind:'system',title:'The system behind the scene'},{kind:'demo',title:'Make the next local edition'},{kind:'places',title:'A few worth spending time with'},...cities.map(cartoon=>({kind:'cartoon' as const,title:cartoon.title,cartoon})),{kind:'closing',title:'A reason to return'}];
  const [open,setOpen]=useState(false),[index,setIndex]=useState(0),[notes,setNotes]=useState(false),[imageError,setImageError]=useState('');
  const stage=useRef<HTMLDivElement>(null),previousFocus=useRef<HTMLElement|null>(null),content=useRef<HTMLDivElement>(null);
  const slide=slides[index],demoIndex=slides.findIndex(s=>s.kind==='demo');
  const cover=cities.find(c=>c.id==='professional-opposition')||cartoons[0];
  const leave=useCallback(async()=>{setOpen(false);if(document.fullscreenElement===stage.current)try{await document.exitFullscreen();}catch{/* Escape may already have exited. */}requestAnimationFrame(()=>previousFocus.current?.focus());},[]);
  const move=useCallback((next:number)=>{setIndex(Math.max(0,Math.min(slides.length-1,next)));setNotes(false);setImageError('');content.current?.scrollTo(0,0);},[slides.length]);
  async function start(at=0){previousFocus.current=document.activeElement as HTMLElement;move(at);flushSync(()=>setOpen(true));try{await stage.current?.requestFullscreen();}catch{/* Accessible fixed-screen fallback uses the same stage. */}}
  useEffect(()=>{
    if(!open)return;
    const overflow=document.body.style.overflow;document.body.style.overflow='hidden';stage.current?.focus();
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();void leave();return;}
      const editing=(event.target as HTMLElement).closest('input,select,textarea,[contenteditable="true"]');
      if(!editing&&['ArrowRight','PageDown'].includes(event.key)){event.preventDefault();move(index+1);}
      if(!editing&&['ArrowLeft','PageUp'].includes(event.key)){event.preventDefault();move(index-1);}
      if(!editing&&event.key==='Home'){event.preventDefault();move(0);}
      if(!editing&&event.key==='End'){event.preventDefault();move(slides.length-1);}
      if(event.key==='Tab'){
        const controls=Array.from(stage.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),summary,[tabindex="0"]')||[]).filter(el=>el.getClientRects().length>0);
        const first=controls[0],last=controls[controls.length-1];if(!first)return;
        if(event.shiftKey&&(document.activeElement===first||document.activeElement===stage.current)){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===stage.current)){event.preventDefault();first.focus();}
      }
    };
    window.addEventListener('keydown',onKey);
    return()=>{window.removeEventListener('keydown',onKey);document.body.style.overflow=overflow;};
  },[open,index,slides.length,move,leave]);
  useEffect(()=>{if(!open)previousFocus.current?.focus();},[open]);
  useEffect(()=>{const changed=()=>{if(!document.fullscreenElement){setOpen(false);requestAnimationFrame(()=>previousFocus.current?.focus());}};document.addEventListener('fullscreenchange',changed);return()=>document.removeEventListener('fullscreenchange',changed);},[]);

  return <>
    <section className="presentation-launch" aria-labelledby="show-launch-title">
      <div><p className="showcase-kicker">The Swinging Door · Cartoon &amp; system presentation</p><h2 id="show-launch-title">Made for the big screen.</h2><p>{cities.length} selected cartoons from the collection, a clear system walkthrough, and a live generation demonstration—all on this page.</p></div>
      <div className="presentation-launch-actions"><button className="showcase-primary" onClick={()=>void start()}>Start presentation</button><button onClick={()=>void start(demoIndex)}>Go to live demo</button><small>Arrow keys or presentation clicker · Escape to exit</small></div>
    </section>
    <div ref={stage} className={`presentation-show ${open?'presentation-show-open':''}`} hidden={!open} tabIndex={-1} role="dialog" aria-modal={open?true:undefined} aria-label="The Swinging Door large-screen presentation">
      {open&&<>
        <header className="presentation-masthead"><span>THE SWINGING DOOR</span><span>September 15, 2026 <i aria-hidden="true">/</i> {slide.kind==='demo'?'Live website workflow':'Presentation edition'}</span></header>
        <div className={`presentation-content presentation-${slide.kind}`} ref={content}>
          {slide.kind==='opening'&&<div className="presentation-split">
            <div className="presentation-copy"><p className="presentation-eyebrow">Money. Everyday life. A little perspective.</p><h2>A familiar place<br/>to see ourselves.</h2><p className="presentation-lead">The same room. The same three personalities.<br/>A different conversation in every city.</p><p className="presentation-subtle">Warm, observant, and politically balanced.<br/>Sometimes a laugh. Sometimes a knowing smile.</p></div>
            <Image className="presentation-art" src={cover.src} width={cover.width} height={cover.height} alt={cover.caption} unoptimized priority/>
          </div>}
          {slide.kind==='places'&&<><p className="presentation-eyebrow">From the collection</p><h2>A few worth spending time with.</h2><p className="presentation-lead">Money, everyday life, and a familiar room full of different perspectives.</p><div className="presentation-city-grid">{cities.map(c=><button key={c.id} onClick={()=>move(slides.findIndex(s=>s.cartoon?.id===c.id))}><strong>{c.title}</strong><span>{c.cityLabel||`${c.speaker} · ${c.variant}`}</span></button>)}</div><p className="presentation-subtle">These are prepared cartoons. The live demonstration makes a separate new draft for review.</p></>}
          {slide.kind==='cartoon'&&slide.cartoon&&<div className="presentation-split">
            <div className="presentation-copy"><p className="presentation-eyebrow">{slide.cartoon.cityLabel||'The Swinging Door collection'}</p><h2 className="presentation-theme">{slide.cartoon.theme||slide.cartoon.title}</h2><blockquote className="presentation-quote">“{slide.cartoon.caption}”</blockquote><p className="presentation-speaker">— {slide.cartoon.speaker}</p><div className="presentation-art-tools"><button onClick={()=>setNotes(n=>!n)} aria-expanded={notes}>{notes?'Hide context':'About this cartoon'}</button><a href={slide.cartoon.src} target="_blank" rel="noreferrer">Open full-resolution art</a></div>{notes&&<aside className="presentation-source"><p>{slide.cartoon.context||`TV: ${slide.cartoon.tv}. Chalkboard: ${slide.cartoon.board.join(' / ')}.`}</p>{slide.cartoon.sourceUrl&&<a href={slide.cartoon.sourceUrl} target="_blank" rel="noreferrer">{slide.cartoon.sourceTitle}</a>}<p>Dialogue and illustration are fictional.</p></aside>}</div>
            <div className="presentation-art-holder"><Image key={slide.cartoon.id} className="presentation-art" src={slide.cartoon.src} width={slide.cartoon.width} height={slide.cartoon.height} alt={`${slide.cartoon.speaker}: ${slide.cartoon.caption}`} unoptimized priority onError={()=>setImageError('This original could not load. Reconnect and reopen this slide; do not substitute a different cartoon.')}/>{imageError&&<p role="alert">{imageError}</p>}</div>
          </div>}
          {slide.kind==='system'&&<><p className="presentation-eyebrow">Consistency in the art. Flexibility in the subject.</p><h2>The system behind the scene.</h2><ol className="presentation-flow"><li><span>01</span><h3>Choose a place</h3><p>City, state, quantity.<br/>Now—or a saved dated or recurring plan.</p></li><li><span>02</span><h3>Find the human angle</h3><p>Dated source context, a caption, and editorial checks for clarity and tone.</p></li><li><span>03</span><h3>Build the panel</h3><p>Fresh monochrome TV art. Matching speaker and listeners. Exact chalk and caption lettering.</p></li><li><span>04</span><h3>Review & use</h3><p>Finished drafts appear automatically, with source records and print options.</p></li></ol><div className="presentation-architecture"><div><strong>Website + saved queue</strong><p>GitHub → Vercel · Supabase</p></div><span aria-hidden="true">↔</span><div><strong>Local production studio</strong><p>RTX 4090 · one job at a time</p></div><span aria-hidden="true">→</span><div><strong>Next: dedicated hosting</strong><p>Replace the PC with an always-on GPU host</p></div></div><p className="presentation-subtle">If the studio is offline or busy, requests wait. Progress reflects confirmed stages, not an estimated countdown. Machine checks support human approval; they do not certify audience response.</p></>}
          <div hidden={slide.kind!=='demo'} className="presentation-live"><p className="presentation-eyebrow">A real request · Not a playback</p>{canManage&&<aside className="showcase-release-note" aria-label="Presenter readiness check"><strong>Presenter check · September 15</strong><p>Activation of the corrected-cast PC worker is pending. Today’s prepared examples use the approved cast; a new live result still needs a trial with the updated worker before the demonstration.</p></aside>}<GenerateStudio canManage={canManage} presentation/><p className="presentation-subtle">Start one cartoon, then continue through the city examples while the studio works. Use “Live demo” below to return. The examples were prepared in advance; this form submits a separate saved job.</p></div>
          {slide.kind==='closing'&&<div className="presentation-closing"><p className="presentation-eyebrow">The idea is bigger than a single cartoon.</p><h2>A reason to pause.<br/>A reason to return.</h2><p className="presentation-lead">A recognizable cast. A locally relevant conversation.<br/>A repeatable way to make the next edition.</p><div className="presentation-closing-cards"><div><h3>On the page</h3><p>Black-and-white originals, common print sizes, and newspaper layout studies.</p></div><div><h3>In the studio</h3><p>Saved requests, visible progress, and source evidence alongside the finished work.</p></div><div><h3>With an editor</h3><p>Keep the warmth. Check the facts. Choose the panels worth publishing.</p></div></div><button className="showcase-primary" onClick={()=>void leave()}>Explore cartoons & print options</button><Link href="/gallery/cast">Meet the cast</Link></div>}
        </div>
        <footer className="presentation-navigation"><div><button aria-label="Previous presentation slide" onClick={()=>move(index-1)} disabled={index===0}>←</button><span aria-live="polite">{index+1} / {slides.length}</span><button aria-label="Next presentation slide" onClick={()=>move(index+1)} disabled={index===slides.length-1}>→</button></div><label className="presentation-jump"><span className="sr-only">Jump to presentation slide</span><select aria-label="Jump to presentation slide" value={index} onChange={e=>move(Number(e.target.value))}>{slides.map((s,i)=><option key={s.title} value={i}>{s.title}</option>)}</select></label><div><button onClick={()=>move(demoIndex)}>Live demo</button><button onClick={()=>void leave()}>Exit presentation</button></div></footer>
      </>}
    </div>
  </>;
}
