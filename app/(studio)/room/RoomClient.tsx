"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { RoomCandidate, RoomImage, RoomPart, StudioRoom } from "@/lib/studio-room";
import PartApproval from "./PartApproval";
import styles from "./room.module.css";

const STATUS = { source: "Source in the library", missing: "Awaiting a source", code: "Drawn by code" };
const CHECKS = [
  ["One coherent perspective", "Wall panels, the window opening and both counter edges agree on the camera and vanishing points."],
  ["A window set into a wall", "A real sill, frame and inner reveal join cleanly to the wall. Corners stay readable, without black wedges or broken mouldings."],
  ["A counter that could be built", "One continuous marble slab sits on believable support. Its thickness, front edge and relationship to the wall make physical sense."],
  ["Construction beyond the frame", "The bartender’s walkway is intentionally out of view. The counter still needs believable depth, support and a clear relationship to the wall."],
  ["One pen and one light direction", "Stroke weight, hatching density and shadows agree across the room. No region looks sharpened, pasted on or lit from a second direction."],
  ["A foundation before the furnishings", "At this stage: wall, window and bar only. Later shelves need credible supports and must fit this established perspective."],
];

function Art({ image, label, outline, frame }: { image: RoomImage; label: string; outline?: number[][]; frame?: { width: number; height: number } }) {
  const canOverlay = frame && image.width === frame.width && image.height === frame.height && outline && outline.length > 2;
  return <figure className={styles.art}>
    <Link href={`/library?image=${image.id}`} className={styles.artLink} aria-label={`Inspect ${label} in the image library`}>
      <Image src={image.imageUrl} alt={label} width={image.viewingWidth || image.width} height={image.viewingHeight || image.height} unoptimized />
      {canOverlay && <svg viewBox={`0 0 ${frame.width} ${frame.height}`} aria-hidden="true" className={styles.outline}><polygon points={outline.map((point) => point.join(",")).join(" ")} /></svg>}
    </Link>
    <figcaption><strong>{label}</strong><span>{image.width} × {image.height} original pixels · open to inspect</span></figcaption>
  </figure>;
}

function CandidateCard({ image, part }: { image: RoomCandidate; part?: RoomPart }) {
  const match = part ? image.matches.find((entry) => entry.partId === part.id) : null;
  return <article className={styles.candidate}>
    <Link href={`/library?image=${image.id}`} aria-label={`Inspect ${image.title}`}><Image src={image.thumbnailUrl} alt={image.title} width={image.width} height={image.height} unoptimized loading="lazy" /></Link>
    <div><h4>{image.path.split("/").pop()}</h4><p>{match ? match.explanation : "Retained work image. No part assignment has been confirmed here."}</p><Link href={`/library?image=${image.id}`}>Inspect this version ↗</Link></div>
  </article>;
}

export default function RoomClient({ room, localApprovalEnabled = false }: { room: StudioRoom; localApprovalEnabled?: boolean }) {
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [showOutlines, setShowOutlines] = useState(false);
  const [candidateQuery, setCandidateQuery] = useState("");
  const [candidateLimit, setCandidateLimit] = useState(12);
  const parts = useMemo(() => room.parts.filter((part) => {
    if (status === "enabled" && !part.enabled || status === "disabled" && part.enabled) return false;
    if (["source", "missing", "code"].includes(status) && part.status !== status) return false;
    const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return words.every((word) => `${part.id} ${part.title} ${part.note}`.toLowerCase().includes(word));
  }), [room.parts, query, status]);
  const candidates = useMemo(() => {
    const words = candidateQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return room.candidates.filter((candidate) => words.every((word) => `${candidate.title} ${candidate.path}`.toLowerCase().includes(word)));
  }, [room.candidates, candidateQuery]);
  const architectureCandidates = room.architectureStudies.filter((study) => study.stage === "render");
  const architectureExperiments = room.architectureStudies.filter((study) => study.stage === "history");
  const stages = [
    { title: "01 · Construction", stage: "geometry", note: "Set the proportions and perspective." },
    { title: "02 · Light and shade", stage: "values", note: "Give every surface a shared tonal target." },
    { title: "03 · Rendered candidate", stage: "render", note: "Judge materials, line work and fidelity to those targets." },
  ].map((entry) => ({ ...entry, image: room.architectureStudies.find((study) => study.stage === entry.stage) }));
  const inventoryLabel = new Date(room.inventoryAt).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

  return <main id="content" className={`workspace-main ${styles.page}`}>
    <header className="desk-heading"><p className="desk-eyebrow">The drawing room</p><h1>Build the room.<br /><em>Then bring it to life.</em></h1><p className="desk-intro">Rick, the next drawing starts with three things: the wall, the window and the bar. We need that architecture to feel real before anything is added to it.</p></header>

    <section className={styles.foundation} aria-labelledby="foundation-title">
      <div className={styles.foundationIntro}><span className={styles.current}>Current direction · structure first</span><h2 id="foundation-title">Wall. Window. Bar.</h2><p>A new bare structure is being developed. No replacement is presented here as approved. The existing furnished plate and the rejected study are preserved below as history.</p><a href="#construction-review">What the next drawing must solve ↓</a></div>
      <div className={styles.foundationSteps}><div><span>01</span><h3>The wall</h3><p>Believable construction, clean corners and consistent perspective.</p></div><div><span>02</span><h3>The window</h3><p>A frame, sill and recess that belong in that wall.</p></div><div><span>03</span><h3>The bar</h3><p>One supported slab with sensible depth and a convincing front edge.</p></div></div>
      <p className={styles.scope}>Shelves, television, chalkboard, lamps, props and characters come later. The modern New York street, hot-dog stand and indistinct passersby belong to a later window-view layer.</p>
    </section>

    <section className={styles.architecture} aria-labelledby="architecture-title">
      <div className={styles.sectionHead}><div><p className="desk-eyebrow">The new bare-room studies</p><h2 id="architecture-title">Draw it. Light it. Then render it.</h2></div><p>{architectureCandidates.length} rendered candidates in this snapshot · all unapproved</p></div>
      <p className={styles.architectureIntro}>The current approach begins with a construction drawing, then a flat map of light and shade. These give the rendering a shared target. The counter depth and window return still need review; the walkway is intentionally outside the frame.</p>
      <div className={styles.architectureGrid}>{stages.map((entry) => <article className={styles.architectureCard} key={entry.stage}><div className={styles.architectureTags}><span>{entry.title}</span><span>{entry.stage === "render" ? "Unapproved candidate" : "Working reference · awaiting review"}</span></div>{entry.image ? <><Art image={entry.image} label={entry.image.label} /><p>{entry.image.artistNote || entry.note}</p><div className={styles.architectureLinks}><a href={`/api/library/${entry.image.id}?variant=view`} target="_blank" rel="noreferrer">Open large viewing copy ↗</a><Link href={`/library?image=${entry.image.id}`}>Inspect in the library ↗</Link></div></> : <p>This stage has not reached the library snapshot yet.</p>}</article>)}</div>
      <h3 className={styles.renderHeading}>Compare the rendered candidates</h3>
      {architectureCandidates.length ? <div className={styles.architectureGrid}>{architectureCandidates.map((study) => <article className={styles.architectureCard} key={study.id}>
        <div className={styles.architectureTags}><span>Unapproved candidate</span>{study.startingPoint && <span>Claude’s starting point · needs revision</span>}</div>
        <Art image={study} label={study.label} />
        <p>{study.artistNote || "No individual artist review is recorded here. Compare the window return, counter depth, panel construction and lighting against the shared drawings before making a choice."}</p>
        <div className={styles.architectureLinks}><a href={`/api/library/${study.id}?variant=view`} target="_blank" rel="noreferrer">Open large viewing copy ↗</a><Link href={`/library?image=${study.id}`}>Inspect in the library ↗</Link></div>
        <small>{study.path.split("/").pop()} · viewing copy {study.viewingWidth} × {study.viewingHeight}</small>
      </article>)}</div> : <p className={styles.empty}>The latest v2 studies have not reached this image-library snapshot yet. They will appear here when the library inventory is refreshed.</p>}
      {architectureExperiments.length > 0 && <details className={styles.architectureExperiments}><summary>Earlier strip, scratch and panelling studies ({architectureExperiments.length})</summary><p>Retained to show what was tried. These are process history, not proposed approved bases.</p><div className={styles.architectureGrid}>{architectureExperiments.map((study) => <article className={styles.architectureCard} key={study.id}><Art image={study} label={`Historical experiment · ${study.label}`} /><p>{study.artistNote}</p><Link href={`/library?image=${study.id}`}>Inspect this experiment ↗</Link></article>)}</div></details>}
      <p className={styles.architectureFootnote}>This follows Claude’s September 3, 4:20 p.m. review. Seed 1 is the current rendered starting point; it is not approved. The drawings set targets, and each render still needs inspection for geometry, lighting and stroke drift. Original files remain available through the library wherever this server can access them.</p>
    </section>

    <section id="construction-review" className={styles.construction} aria-labelledby="construction-title"><div className={styles.sectionHead}><div><p className="desk-eyebrow">An artist’s inspection</p><h2 id="construction-title">Make the construction convincing.</h2></div><p>These are review questions, not completed checks.</p></div><div className={styles.checks}>{CHECKS.map(([title, text], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></section>

    <section id="parts" className={styles.parts} aria-labelledby="parts-title"><div className={styles.sectionHead}><div><p className="desk-eyebrow">The existing parts system</p><h2 id="parts-title">Every piece, with its own record.</h2></div><p>{room.parts.length} manifest parts · {room.width} × {room.height} canvas</p></div>
      <div className={styles.legacyNote}><strong>These records belong to the older furnished plate.</strong><p>They show how individual changes are organized today. Their cut lines and sources must be reviewed for the new bare structure. “Enabled” means included by the existing build instructions; it does not mean newly approved by Rick.</p></div>
      <div className={styles.filters}><label className={styles.search}>Find a part<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try window, shelf or Barclay…" /></label><label>Show<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All parts ({room.parts.length})</option><option value="enabled">Enabled in the old build ({room.parts.filter((part) => part.enabled).length})</option><option value="disabled">Not enabled ({room.parts.filter((part) => !part.enabled).length})</option><option value="source">Source in the library ({room.parts.filter((part) => part.status === "source").length})</option><option value="missing">Awaiting a source ({room.parts.filter((part) => part.status === "missing").length})</option><option value="code">Drawn by code ({room.parts.filter((part) => part.status === "code").length})</option></select></label><label className={styles.checkbox}><input type="checkbox" checked={showOutlines} onChange={(event) => setShowOutlines(event.target.checked)} />Show saved cut lines</label></div>
      <p className={styles.results} aria-live="polite">{parts.length} {parts.length === 1 ? "part" : "parts"} shown. Source availability reflects the image inventory from {inventoryLabel} Eastern.</p>
      {!parts.length && <p className={styles.empty}>No parts match these filters. Try another name or choose “All parts.”</p>}
      <div className={styles.partList}>{parts.map((part) => {
        const matches = room.candidates.filter((image) => image.matches.some((match) => match.partId === part.id));
        return <article id={`part-${part.id}`} key={part.id} className={styles.part}>
          <div className={styles.partSource}>{part.source ? <Art image={part.source} label={`Recorded source · ${part.title}`} /> : <div className={styles.noSource}><span>{part.mode === "code" ? "Aa" : "—"}</span><h3>{part.mode === "code" ? "Lettering is drawn by code" : "No source image in this inventory"}</h3><p>{part.mode === "code" ? "This part uses recorded lettering settings instead of a generated image." : "An outlined area is a plan. It becomes a usable part after a source is reviewed and recorded."}</p></div>}{showOutlines && part.outline.length > 2 && room.base && <div className={styles.cutGuide}><Art image={room.base} label={`Saved cut on the old base · ${part.title}`} outline={part.outline} frame={{ width: room.width, height: room.height }} /><p>Guide only. The outline is displayed on the correctly sized older base; no image file is changed.</p></div>}</div>
          <div className={styles.partInfo}><div className={styles.partTags}><span className={part.enabled ? styles.enabled : styles.disabled}>{part.enabled ? "Enabled in old build" : "Not enabled"}</span><span>{STATUS[part.status]}</span></div><h3>{part.title}</h3><p className={styles.partId}>{part.id} · build order {part.order}</p><p className={styles.partNote}>{part.note}</p>
            <dl className={styles.specs}><div><dt>Drawing mode</dt><dd>{part.mode}</dd></div><div><dt>Protected figures</dt><dd>{part.respectsCast === null ? "Not applicable" : part.respectsCast ? "Excluded from this cut" : "Not excluded by this part"}</dd></div><div><dt>Match surrounding tone</dt><dd>{part.toneMatch === null ? "Not applicable" : part.toneMatch ? "Yes" : "No"}</dd></div>{part.feather !== null && <div><dt>Soft edge</dt><dd>{part.feather} pixels</dd></div>}</dl>
            {part.sourcePath && <details className={styles.fileDetails}><summary>Recorded source path</summary><p>{part.sourcePath}</p>{part.source && <p>Source identity: {part.source.id.slice(0, 12)}…</p>}</details>}
            {part.source && (part.source.width !== room.width || part.source.height !== room.height) && <p className={styles.mismatch}>This source’s dimensions differ from the {room.width} × {room.height} manifest canvas. Inspect its alignment before reuse. Cut-line guides use the older base, not this differently sized source.</p>}
            <details className={styles.matches}><summary>{matches.length ? `${matches.length} related work ${matches.length === 1 ? "image" : "images"} to inspect` : "No matching candidate filenames recorded"}</summary><p>Matches below come from filenames only. They do not establish the subject, the correct part or approval.</p>{matches.length > 0 && <div className={styles.relatedGrid}>{matches.map((image) => <CandidateCard key={image.id} image={image} part={part} />)}</div>}</details>
            <PartApproval part={part} candidates={room.candidates} manifestHash={room.manifestHash} enabled={localApprovalEnabled} />
          </div>
        </article>;
      })}</div>
      <aside id="approval-status" className={styles.approvalNote}><h3>{localApprovalEnabled ? "Local source saving is enabled." : "Review here. Save from the local studio."}</h3><p>{localApprovalEnabled ? "Choose a candidate and explicitly confirm its part before saving. This updates only that part’s source on this computer. Base studies cannot be approved here, and rebuilding remains a separate art-pipeline step." : "Approval controls stay off on the hosted website and by default on this computer. The local studio can be explicitly enabled to save a selected parts-work image. A shared remote approval connection is still needed. Browsing never changes a source."}</p></aside>
    </section>

    <section className={styles.work} aria-labelledby="work-title"><div className={styles.sectionHead}><div><p className="desk-eyebrow">Nothing thrown away</p><h2 id="work-title">Work images to compare.</h2></div><p>{room.candidates.length} unique images from the parts work folder</p></div><p className={styles.workIntro}>Speaker studies, trial renders and assembled versions are kept together here. A filename can help us find a picture; only visual inspection can tell us whether it solves the right problem.</p><label className={styles.workSearch}>Search retained work<input type="search" value={candidateQuery} onChange={(event) => { setCandidateQuery(event.target.value); setCandidateLimit(12); }} placeholder="Try duo, raw, Drew or Barclay…" /></label><p className={styles.results} aria-live="polite">{candidates.length} matching images</p><div className={styles.candidateGrid}>{candidates.slice(0, candidateLimit).map((image) => <CandidateCard key={image.id} image={image} />)}</div>{candidates.length > candidateLimit && <button className={styles.more} type="button" onClick={() => setCandidateLimit((count) => count + 12)}>Show 12 more images</button>}{!candidates.length && <p className={styles.empty}>No work images match this search.</p>}</section>

    <details className={styles.history}><summary>Earlier plates & rejected study · historical comparison</summary><p>These images are records of previous directions. The rejected structure is shown only to make the comparison clear; the new room is still awaiting review.</p><div className={styles.historyGrid}>{room.history.map((entry) => <article key={entry.path}>{entry.image ? <Art image={entry.image} label={entry.label} /> : <p>{entry.label}: not present in the current image inventory.</p>}<p>{entry.note}</p></article>)}</div></details>

    <details className={styles.manifest}><summary>How the pieces fit together</summary><p>Each proposed part is drawn with the whole room in view. The saved outline selects the intended area when the art pipeline builds the scene. This helps keep the room’s perspective and pen style consistent, but every replacement still needs a close inspection.</p><p><strong>Current manifest base:</strong> {room.basePath}. This is the older furnished plate.</p>{room.base && <Link href={`/library?image=${room.base.id}`}>Inspect the recorded base in the library ↗</Link>}<p><strong>Recorded light instruction for that older plate:</strong> {room.lighting}</p><p>The new structural base must establish its own clean geometry before these older cut lines, lighting instructions or furnishings are reused.</p><p className={styles.hash}>Manifest snapshot {room.manifestHash.slice(0, 16)}… · library inventory {inventoryLabel} Eastern</p></details>
  </main>;
}
