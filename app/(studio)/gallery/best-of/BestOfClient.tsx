"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { BestOfCartoon } from "@/lib/best-of-cartoons";

type SpeakerFilter = "all" | BestOfCartoon["speaker"];
type CastFilter = "all" | BestOfCartoon["variant"];

type BestOfClientProps = {
  cartoons: Omit<BestOfCartoon, "sha256">[];
  edition: { title: string; count: number; archiveCount: number; zipUrl: string };
  canManage?:boolean;
  hiddenIds?:string[];
};

const speakers: { value: SpeakerFilter; label: string }[] = [
  { value: "all", label: "Everyone" },
  { value: "Drew", label: "Drew" },
  { value: "Barclay", label: "Barclay" },
  { value: "Abby", label: "Abby" },
];

const casts: { value: CastFilter; label: string }[] = [
  { value: "all", label: "Both" },
  { value: "duo", label: "Duo" },
  { value: "trio", label: "Trio" },
];

export default function BestOfClient({ cartoons, edition,canManage=false,hiddenIds=[] }: BestOfClientProps) {
  const [hidden,setHidden]=useState(hiddenIds),[managing,setManaging]=useState(false),[removedView,setRemovedView]=useState(false);
  const [confirmId,setConfirmId]=useState(''),[busy,setBusy]=useState(''),[message,setMessage]=useState(''),[error,setError]=useState('');
  const publishedCount=cartoons.filter(c=>!hidden.includes(c.id)).length;
  const removedCount=cartoons.filter(c=>hidden.includes(c.id)).length;
  async function changeVisibility(id:string,remove:boolean){
    if(busy)return;setBusy(id);setError('');setMessage('');
    try{
      const response=await fetch('/api/gallery/visibility',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,hidden:remove}),signal:AbortSignal.timeout(20000)});
      const body=await response.json();if(!response.ok)throw Error(body.error||'The change is not confirmed. Retry the same action safely.');
      if(body.id!==id||body.hidden!==remove)throw Error('The gallery change is not confirmed yet.');
      setHidden(old=>remove?[...new Set([...old,id])]:old.filter(x=>x!==id));setConfirmId('');
      setMessage(remove?'Removed from the gallery and presentation. You can restore it under Removed.':'Restored to the gallery and presentation.');
    }catch(e){setError(e instanceof Error?e.message:'Connection interrupted. Retry the same action safely.');}finally{setBusy('');}
  }
  const [speaker, setSpeaker] = useState<SpeakerFilter>("all");
  const [cast, setCast] = useState<CastFilter>("all");
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = Number(speaker !== "all") + Number(cast !== "all");
  const searchWords = query.trim().toLocaleLowerCase("en-US").split(/\s+/).filter(Boolean);
  const hasFilters = speaker !== "all" || cast !== "all" || searchWords.length > 0;

  const visibleCartoons = cartoons.filter((cartoon) => {
    if(hidden.includes(cartoon.id)!==(canManage&&removedView))return false;
    if (speaker !== "all" && cartoon.speaker !== speaker) return false;
    if (cast !== "all" && cartoon.variant !== cast) return false;

    const searchableText = [
      cartoon.title,
      cartoon.cityLabel ?? "",
      cartoon.caption,
      cartoon.speaker,
      cartoon.variant,
      cartoon.tv,
      ...cartoon.board,
    ].join(" ").toLocaleLowerCase("en-US");

    return searchWords.every((word) => searchableText.includes(word));
  });

  function clearFilters() {
    setSpeaker("all");
    setCast("all");
    setQuery("");
  }

  return (
    <main className="best-of-page" id="content">
      <header className="best-of-intro" aria-labelledby="best-of-heading">
        <div className="best-of-intro-copy">
          <p className="best-of-eyebrow">The collection · {publishedCount} cartoons</p>
          <h1 id="best-of-heading">Cartoons.</h1>
          <p className="best-of-deck">
            Money, modern life, and the occasional martini. Browse the collection,
            find a favorite, and make it ready for print.
          </p>
        </div>
        <div className="best-of-primary-actions">
          <Link className="best-of-download-all" href="/gallery/automation">Generate cartoons <span aria-hidden="true">→</span></Link>
          <Link href="/gallery/presentation">Present &amp; print the collection</Link>
        </div>
      </header>

      <section className="best-of-collection" aria-label="Browse the cartoon collection">
        {canManage&&<section className="gallery-management" aria-label="Gallery management"><div><button type="button" onClick={()=>{setManaging(v=>!v);setRemovedView(false);setConfirmId('');}} aria-expanded={managing}>{managing?'Finish managing':'Manage gallery'}</button>{managing&&<button type="button" aria-pressed={removedView} onClick={()=>{setRemovedView(v=>!v);setConfirmId('');}}>{removedView?'Back to published cartoons':`Removed (${removedCount})`}</button>}</div>{managing&&<p>Remove cartoons from the gallery and presentation, or restore them here. Original image files and earlier ZIP archives are kept; this does not make those files private.</p>}{message&&<p role="status">{message}</p>}{error&&<p role="alert">{error}</p>}</section>}
        <div className="best-of-controls">
          <div className="best-of-search">
            <label htmlFor="best-of-search">Find a cartoon</label>
            <div className="best-of-search-box">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m15.5 15.5 5 5" />
              </svg>
              <input
                id="best-of-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Golf, groceries, retirement…"
                autoComplete="off"
                aria-controls="best-of-results"
              />
            </div>
          </div>

          <button className="best-of-filter-toggle" type="button" aria-expanded={filtersOpen} aria-controls="best-of-filter-fields" onClick={() => setFiltersOpen(open => !open)}>
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""} <span aria-hidden="true">{filtersOpen ? "−" : "+"}</span>
          </button>
          <div id="best-of-filter-fields" className="best-of-filter-fields" hidden={!filtersOpen}>
          <fieldset className="best-of-filter">
            <legend>Who’s speaking?</legend>
            <div className="best-of-filter-options">
              {speakers.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={speaker === option.value}
                  aria-controls="best-of-results"
                  onClick={() => setSpeaker(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="best-of-filter">
            <legend>At the bar</legend>
            <div className="best-of-filter-options">
              {casts.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={cast === option.value}
                  aria-controls="best-of-results"
                  onClick={() => setCast(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
          </div>
        </div>

        <div className="best-of-results-heading">
          <p role="status" aria-live="polite" aria-atomic="true">
            <strong>{visibleCartoons.length}</strong>
            {hasFilters ? ` of ${removedView?removedCount:publishedCount}` : ""}
            {visibleCartoons.length === 1 ? " cartoon" : " cartoons"}
          </p>
          {hasFilters ? (
            <button className="best-of-reset" type="button" onClick={clearFilters}>Clear filters</button>
          ) : (
            <p className="best-of-reading-hint">Select an image to read it full size.</p>
          )}
        </div>

        <div id="best-of-results">
          {visibleCartoons.length === 0 ? (
            <div className="best-of-empty">
              <h2>{removedView?'No removed cartoons.':'No cartoons at this table.'}</h2>
              <p>Try another subject, speaker, or cast—or bring everyone back.</p>
              <button type="button" className="best-of-download-all" onClick={clearFilters}>
                Show all {cartoons.length} cartoons <span aria-hidden="true">↗</span>
              </button>
            </div>
          ) : (
            <ul className="best-of-grid" aria-label="Cartoons">
              {visibleCartoons.map((cartoon, index) => (
                <li key={cartoon.id}>
                  <article className="best-of-card" aria-labelledby={`cartoon-${cartoon.id}`}>
                    <header className="best-of-card-heading">
                      {cartoon.cityLabel ? <div className="best-of-city-label"><strong>{cartoon.cityLabel}</strong><span>{cartoon.editionDate} · Local edition</span></div> : null}
                      <p>{cartoon.speaker} <span aria-hidden="true">·</span> {cartoon.variant === "duo" ? "Duo" : "Trio"}</p>
                      <h2 id={`cartoon-${cartoon.id}`}>{cartoon.title}</h2>
                    </header>

                    <figure>
                      <a
                        className="best-of-artwork"
                        href={cartoon.src}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${cartoon.title} at full size in a new tab`}
                      >
                        <Image
                          src={cartoon.previewSrc}
                          alt={`Black-and-white cartoon: ${cartoon.speaker} speaks while ${cartoon.variant === "trio" ? "the other two characters listen" : "the other character listens"} at The Swinging Door.`}
                          width={cartoon.width}
                          height={cartoon.height}
                          sizes="(max-width: 620px) calc(100vw - 40px), (max-width: 1080px) calc((100vw - 80px) / 2), 380px"
                          priority={index === 0}
                          unoptimized
                        />
                        <span className="best-of-open-label" aria-hidden="true">Read full size ↗</span>
                      </a>
                      <figcaption className="best-of-caption">
                        <span className="best-of-caption-speaker">{cartoon.speaker}:</span>{" "}
                        “{cartoon.caption}”
                      </figcaption>
                    </figure>

                    <div className="best-of-card-bottom">
                      {canManage&&managing&&<div className="gallery-card-management">{removedView?<button type="button" disabled={!!busy} onClick={()=>void changeVisibility(cartoon.id,false)}>{busy===cartoon.id?'Restoring…':'Restore to gallery'}</button>:confirmId===cartoon.id?<div role="group" aria-label={`Confirm removal of ${cartoon.title}`}><p>Remove “{cartoon.title}” from the gallery? You can restore it later.</p><button type="button" disabled={!!busy} onClick={()=>void changeVisibility(cartoon.id,true)}>{busy===cartoon.id?'Removing…':'Confirm removal'}</button><button type="button" disabled={!!busy} onClick={()=>setConfirmId('')}>Cancel</button></div>:<button type="button" onClick={()=>setConfirmId(cartoon.id)}>Remove from gallery<span className="sr-only">: {cartoon.title}</span></button>}</div>}
                      <Link className="best-of-print-link" href={`/gallery/best-of/print/${cartoon.id}`}>Print &amp; size options <span aria-hidden="true">↗</span><span className="sr-only">: {cartoon.title}</span></Link>
                      <details className="best-of-scene-details">
                        <summary>On the TV &amp; chalkboard</summary>
                        <dl>
                          <div><dt>TV</dt><dd>{cartoon.tv}</dd></div>
                          <div>
                            <dt>Chalkboard</dt>
                            <dd>{cartoon.board.map((line, lineIndex) => <span key={`${lineIndex}-${line}`}>{line}</span>)}</dd>
                          </div>
                          {cartoon.sourceUrl ? <div><dt>Local context</dt><dd><a href={cartoon.sourceUrl} target="_blank" rel="noopener noreferrer">{cartoon.sourceTitle} ↗</a><br />Fictional dialogue and illustrated footage; editorially reviewed.</dd></div> : null}
                        </dl>
                      </details>
                      <a className="best-of-save" href={cartoon.src} download={`the-swinging-door-${cartoon.id}.png`}>
                        Download PNG <span aria-hidden="true">↓</span>
                        <span className="sr-only">: {cartoon.title}</span>
                      </a>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <footer className="best-of-note">
        <div>
          <a className="best-of-archive-download" href={edition.zipUrl} download>Download the original {edition.archiveCount}-cartoon archive · ZIP</a>
          <p className="best-of-eyebrow">A familiar setting. A fresh conversation.</p>
          <p>
            These cartoons are fiction. Dialogue, menu prices, and illustrated TV scenes are
            part of the joke—not quotations, live news, or financial advice.
          </p>
        </div>
        <a href="#content">Back to the top <span aria-hidden="true">↑</span></a>
      </footer>
    </main>
  );
}
