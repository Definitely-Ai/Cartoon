"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { StudioLibraryImage, StudioLibraryManifest } from "@/lib/studio-library-types";

const PAGE_SIZE = 48;
const dateLabel = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" });
const sizeLabel = (bytes: number) => bytes < 1048576 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

export default function LibraryClient({ manifest, initialImageId }: { manifest: StudioLibraryManifest; initialImageId?: string }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All images");
  const [source, setSource] = useState("all");
  const [character, setCharacter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<string | null>(initialImageId || null);
  const [zoom, setZoom] = useState(false);
  const [originalAvailable, setOriginalAvailable] = useState<boolean | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const categories = useMemo(() => [...new Set(manifest.items.map((item) => item.category))].sort(), [manifest]);
  const filtered = useMemo(() => {
    const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return manifest.items.filter((item) => {
      if (category !== "All images" && item.category !== category) return false;
      if (source !== "all" && !item.origins.some((origin) => origin.source === source)) return false;
      if (character === "multiple" && item.characters.length < 2 || character === "untagged" && item.characters.length > 0 || !["all", "multiple", "untagged"].includes(character) && !item.characters.includes(character)) return false;
      if (from && item.date < from || to && item.date > to) return false;
      const haystack = `${item.title} ${item.category} ${item.date} ${item.origins.map((origin) => `${origin.label} ${origin.path}`).join(" ")}`.toLowerCase();
      return words.every((word) => haystack.includes(word));
    }).sort((a, b) => sort === "name" ? a.title.localeCompare(b.title) : sort === "oldest" ? a.date.localeCompare(b.date) || a.title.localeCompare(b.title) : b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
  }, [manifest, query, category, source, character, sort, from, to]);
  const selected = manifest.items.find((item) => item.id === selectedId);
  const selectedIndex = filtered.findIndex((item) => item.id === selectedId);

  useEffect(() => { setLimit(PAGE_SIZE); }, [query, category, source, character, sort, from, to]);
  useEffect(() => {
    const element = dialog.current;
    if (selected && element) {
      if (!element.open) {
        lastFocused.current = document.activeElement as HTMLElement;
        element.showModal();
      }
      document.body.style.overflow = "hidden";
    } else if (!selected && element?.open) {
      element.close();
      document.body.style.overflow = "";
      lastFocused.current?.focus();
    }
    return () => { document.body.style.overflow = ""; };
  }, [selected]);
  useEffect(() => {
    setZoom(false);
    setOriginalAvailable(null);
    if (!selected) return;
    const controller = new AbortController();
    fetch(`/api/library/${selected.id}?variant=original`, { method: "HEAD", signal: controller.signal }).then((response) => setOriginalAvailable(response.ok)).catch(() => {});
    return () => controller.abort();
  }, [selected]);

  function openImage(item: StudioLibraryImage) {
    setSelectedId(item.id);
    const url = new URL(window.location.href);
    url.searchParams.set("image", item.id);
    window.history.replaceState(null, "", url);
  }
  function closeImage() {
    setSelectedId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("image");
    window.history.replaceState(null, "", url);
  }
  function moveImage(direction: number) {
    if (selectedIndex < 0 || filtered.length < 2) return;
    const next = filtered[(selectedIndex + direction + filtered.length) % filtered.length];
    openImage(next);
  }

  return <main id="content" className="library-page">
    <header className="library-heading">
      <div><p className="library-eyebrow">The studio archive</p><h1>Every version has a place.</h1><p>Rick, this is the whole working collection: finished cartoons, early ideas, character studies and the pieces we are still perfecting.</p></div>
      <a className="library-text-link" href="/gallery">See the selected gallery <span aria-hidden="true">↗</span></a>
    </header>

    <section className="library-summary" aria-label="Library inventory">
      <div><strong>{manifest.summary.uniqueImages.toLocaleString()}</strong><span>unique images to explore</span></div>
      <div><strong>{manifest.summary.sourceFiles.toLocaleString()}</strong><span>source files accounted for</span></div>
      <div><strong>{manifest.summary.duplicateCopies.toLocaleString()}</strong><span>duplicate copies grouped</span></div>
      <div className="library-inventory-date"><span>Last inventory</span><strong>{new Date(manifest.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" })}</strong><a href="#library-coverage">What is included?</a></div>
    </section>

    <div className="library-category-bar" aria-label="Image categories">
      {["All images", ...categories].map((name) => <button key={name} type="button" aria-pressed={category === name} onClick={() => setCategory(name)}>{name}<span>{(name === "All images" ? manifest.items.length : manifest.items.filter((item) => item.category === name).length).toLocaleString()}</span></button>)}
    </div>

    <section className="library-filters" aria-label="Find an image">
      <label className="library-search">Search the collection<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try Abby, shelf, base, golf, or an edition…" /></label>
      <label>Character<select value={character} onChange={(event) => setCharacter(event.target.value)}><option value="all">Everyone & the room</option>{["Drew", "Barclay", "Abby"].map((name) => <option key={name} value={name}>{name} ({manifest.items.filter((item) => item.characters.includes(name)).length})</option>)}<option value="multiple">More than one character</option><option value="untagged">Not yet tagged</option></select></label>
      <label>Source<select value={source} onChange={(event) => setSource(event.target.value)}><option value="all">Every source</option>{manifest.coverage.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select></label>
      <label>Order<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest date first</option><option value="oldest">Oldest date first</option><option value="name">Name A–Z</option></select></label>
      <details className="library-date-filter"><summary>Date range</summary><div><label>From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label>Through<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label></div></details>
    </section>

    <div className="library-results-bar"><p aria-live="polite">{filtered.length.toLocaleString()} {filtered.length === 1 ? "image" : "images"}{category !== "All images" ? ` · ${category}` : " in the collection"}</p><span>Open any image for a closer look</span></div>
    {filtered.length ? <div className="library-grid">{filtered.slice(0, limit).map((item, index) => <button className="library-card" type="button" key={item.id} onClick={() => openImage(item)} aria-label={`View ${item.title}`}>
      <div className="library-card-art"><Image src={item.thumbnailUrl} alt={item.title} width={item.width || 520} height={item.height || 520} unoptimized priority={index === 0} loading={index < 4 ? "eager" : "lazy"} />{item.origins.length > 1 && <span className="library-copy-count">{item.origins.length} locations</span>}</div>
      <div className="library-card-copy"><span>{item.category}</span><h2>{item.title}</h2><p>{dateLabel(item.date)} <span aria-hidden="true">·</span> {item.width.toLocaleString()} × {item.height.toLocaleString()}</p></div>
    </button>)}</div> : <div className="library-empty"><h2>No images match those filters.</h2><p>Try a character name or clear the date range.</p><button type="button" onClick={() => { setQuery(""); setCategory("All images"); setSource("all"); setCharacter("all"); setFrom(""); setTo(""); }}>Clear filters</button></div>}
    {limit < filtered.length && <div className="library-load-more"><button type="button" onClick={() => setLimit((value) => value + PAGE_SIZE)}>Show {Math.min(PAGE_SIZE, filtered.length - limit)} more images</button><p>Showing {Math.min(limit, filtered.length).toLocaleString()} of {filtered.length.toLocaleString()}</p></div>}

    <section id="library-coverage" className="library-coverage"><div><p className="library-eyebrow">A clear record</p><h2>What is in the archive?</h2><p>Matching files are grouped by their exact contents. Each image keeps its source names, so we can trace a version back to the work.</p></div><div>
      <ul className="library-source-list">{manifest.coverage.map((entry) => <li key={entry.id}><div><strong>{entry.label}</strong><span>{entry.status === "scanned" ? "Inventoried" : entry.status === "snapshot" ? "Saved import · source currently offline" : "Source unavailable"}</span></div><b>{entry.files.toLocaleString()} files</b></li>)}</ul>
      <details><summary>Coverage and date notes</summary><ul className="library-notes">{manifest.limits.map((note) => <li key={note}>{note}</li>)}{manifest.historyStatus !== "checked" && <li>Git history could not be checked during this inventory.</li>}</ul></details>
      {!!manifest.unavailable.length && <details><summary>{manifest.unavailable.length.toLocaleString()} removed or unavailable files</summary><p>These are recorded for completeness. Their inclusion here does not bring retired art back into the working collection.</p><ul className="library-unavailable">{manifest.unavailable.map((entry, index) => <li key={`${entry.path}-${index}`}><strong>{entry.path}</strong><span>{entry.label} · {entry.reason}</span></li>)}</ul></details>}
    </div></section>

    <dialog ref={dialog} className="library-dialog" aria-labelledby="library-image-title" onCancel={(event) => { event.preventDefault(); closeImage(); }} onClick={(event) => { if (event.target === dialog.current) closeImage(); }} onKeyDown={(event) => { const target = event.target as HTMLElement; if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return; if (event.key === "ArrowRight") { event.preventDefault(); moveImage(1); } if (event.key === "ArrowLeft") { event.preventDefault(); moveImage(-1); } }}>
      {selected && <div className="library-dialog-content"><div className="library-dialog-toolbar"><span>{selectedIndex >= 0 ? `${selectedIndex + 1} of ${filtered.length.toLocaleString()}` : "Image detail"}</span><div><button type="button" disabled={selectedIndex < 0 || filtered.length < 2} onClick={() => moveImage(-1)} aria-label="Previous image">←</button><button type="button" disabled={selectedIndex < 0 || filtered.length < 2} onClick={() => moveImage(1)} aria-label="Next image">→</button><button type="button" aria-pressed={zoom} onClick={() => setZoom((value) => !value)}>{zoom ? "Fit image" : "Actual pixels"}</button><button type="button" onClick={closeImage} aria-label="Close image">Close ×</button></div></div>
        <div className={`library-dialog-art${zoom ? " is-zoomed" : ""}`}><Image src={selected.imageUrl} alt={selected.title} width={selected.viewingWidth || 1024} height={selected.viewingHeight || 1024} unoptimized /></div>
        <div className="library-image-details"><div><p className="library-eyebrow">{selected.category}</p><h2 id="library-image-title">{selected.title}</h2><p>{selected.characters.length ? `Filed with ${selected.characters.join(" · ")}` : "Room, asset, or cast not yet identified"}</p><p>{dateLabel(selected.date)} · {selected.dateBasis.toLowerCase()}<br />{selected.width.toLocaleString()} × {selected.height.toLocaleString()} pixels · {selected.format.toUpperCase()} original · {sizeLabel(selected.bytes)}</p>{selected.animated && <p>This viewing copy shows the first frame or page.</p>}<details><summary>Find this version in the project ({selected.origins.length})</summary><ul className="library-origin-list">{selected.origins.map((origin) => <li key={`${origin.source}:${origin.path}`}><strong>{origin.label}</strong><span>{origin.path}</span></li>)}</ul></details></div>
          <div className="library-downloads"><a className="library-secondary-button" href={`/notes?image=${selected.id}`}>Discuss this image</a><a className="library-primary-button" href={selected.imageUrl} download={`${selected.title}-viewing-copy.webp`}>Download viewing copy</a>{originalAvailable && <a className="library-secondary-button" href={`/api/library/${selected.id}?variant=original`} download>Download exact original</a>}<p>Viewing copy: {selected.viewingWidth.toLocaleString()} × {selected.viewingHeight.toLocaleString()} pixels, compressed for easy review. Use the original for print work.</p>{originalAvailable === false && <p>The exact original is unavailable for download here. Open the local studio to retrieve it; its source location is listed alongside this image.</p>}{originalAvailable === null && <p>Checking original availability…</p>}<p className="library-keyboard-note">← → to browse · Esc to close</p></div></div>
      </div>}
    </dialog>
  </main>;
}
