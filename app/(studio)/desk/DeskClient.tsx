"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  APPROVAL_STATES, DESK_AUTHORS, DESK_MESSAGE_KEY, summarizeDecision,
  type ApprovalState, type DeskApproval, type DeskAuthor, type DeskDecision, type DeskLayer,
} from "@/lib/studio-desk-core";
import styles from "./desk.module.css";

// THE STICKER DESK, in the browser. The same interaction as
// scripts/sticker-desk.mjs on the studio machine — drag, nudge, hide, swap a
// version — but this one cannot draw anything. It ends in a DECISION that the
// GPU picks up (scripts/desk-pull.py). Every image here is the web copy built
// by scripts/build-desk-web-assets.py and copied into public/ by
// scripts/prebuild.mjs.

const WEB = "/canon/room-kit/v2/web";
const REPO = "Definitely-Ai/Cartoon";

type Sticker = { part: string; file: string; x: number; y: number; w: number; h: number; layerOrder: number; enabled: boolean };
type Manifest = { plate: { w: number; h: number }; base: string; generated?: string; sign?: { note?: string }; stickers: Sticker[] };
type HistoryEntry = { version: string; date: string; label: string; note: string; verdict: string; thumb: string };
type ReportEntry = { num: string; title: string; verdict: string | null; thumb: string | null };
type ReportDay = { date: string; pdf: string | null; show?: string | null; entries: ReportEntry[] };
type ReportIndex = { dates: { date: string; entries: number; pdf: string | null; show: string | null }[] };

const time = (value: string) => new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
const dayLabel = (day: string) => new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "long", month: "long", day: "numeric" }).format(new Date(`${day}T12:00:00Z`));
const readable = (part: string) => part.replaceAll("-", " ");
const STATE_LABEL: Record<ApprovalState, string> = { approved: "Approved", "needs-work": "Needs work", comment: "Comment" };

export default function DeskClient({ initialDecisions, storeNote, decisionsError, repo = REPO }: {
  initialDecisions: DeskDecision[]; storeNote: string; decisionsError: string; repo?: string;
}) {
  const [tab, setTab] = useState<"desk" | "today">("desk");

  // ---------------------------------------------------------------- assets
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [assetError, setAssetError] = useState("");
  const [history, setHistory] = useState<Record<string, HistoryEntry[]>>({});
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const response = await fetch(`${WEB}/stickers/manifest.json`, { cache: "no-store" });
        if (!response.ok) throw new Error("missing");
        const loaded: Manifest = await response.json();
        if (!live) return;
        setManifest(loaded);
        setLayers(Object.fromEntries(loaded.stickers.map((sticker) => [sticker.part, { dx: 0, dy: 0, visible: sticker.enabled, version: null } as DeskLayer])));
        const entries = await Promise.all(loaded.stickers.map(async (sticker) => {
          try {
            const versions = await fetch(`${WEB}/history/${sticker.part}/index.json`, { cache: "no-store" });
            return [sticker.part, versions.ok ? ((await versions.json()) as HistoryEntry[]) : []] as const;
          } catch { return [sticker.part, [] as HistoryEntry[]] as const; }
        }));
        if (live) setHistory(Object.fromEntries(entries));
      } catch {
        if (live) setAssetError("The room kit has not been built for the website yet. On the studio machine run: python scripts/build-desk-web-assets.py, then rebuild the site.");
      }
    })();
    return () => { live = false; };
  }, []);

  // ------------------------------------------------------------ the layout
  const [layers, setLayers] = useState<Record<string, DeskLayer>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [snap, setSnap] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [approvals, setApprovals] = useState<Record<string, DeskApproval>>({});
  const [author, setAuthor] = useState<DeskAuthor | "">("");
  const [message, setMessage] = useState("");
  const [log, setLog] = useState("Drag a layer, or pick one on the right. Arrow keys nudge by one pixel, shift by ten.");

  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !manifest) return;
    const fit = () => {
      const box = stage.getBoundingClientRect();
      if (!box.width || !box.height) return;
      setScale(Math.max(0.05, Math.min((box.width - 32) / manifest.plate.w, (box.height - 32) / manifest.plate.h)));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [manifest, tab]);

  const layerOf = useCallback((part: string): DeskLayer => layers[part] ?? { dx: 0, dy: 0, visible: true, version: null }, [layers]);
  // The drag handlers read the layer they have just written, so they read a ref
  // rather than the render's copy of state.
  const layersRef = useRef(layers);
  useEffect(() => { layersRef.current = layers; }, [layers]);
  const nudge = useCallback((part: string, dx: number, dy: number) => {
    setLayers((current) => {
      const layer = current[part] ?? { dx: 0, dy: 0, visible: true, version: null };
      return { ...current, [part]: { ...layer, dx: layer.dx + dx, dy: layer.dy + dy } };
    });
  }, []);

  // Keyboard nudging, the way the local desk does it: only when a layer is
  // chosen and the writer is not typing into a field.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!selected || tab !== "desk") return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) return;
      const step = ({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] } as Record<string, number[]>)[event.key];
      if (!step) return;
      const size = event.shiftKey ? 10 : 1;
      nudge(selected, step[0] * size, step[1] * size);
      setLog(`${readable(selected)} nudged. Nothing is saved until you send it to the studio.`);
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, nudge, tab]);

  const drag = useRef<{ part: string; x: number; y: number; dx: number; dy: number } | null>(null);
  const onPointerDown = (event: React.PointerEvent) => {
    const element = (event.target as HTMLElement).closest<HTMLElement>("[data-part]");
    if (!element) { setSelected(null); return; }
    const part = element.dataset.part as string;
    const layer = layerOf(part);
    setSelected(part);
    drag.current = { part, x: event.clientX, y: event.clientY, dx: layer.dx, dy: layer.dy };
    element.setPointerCapture(event.pointerId);
    event.preventDefault();
  };
  const onPointerMove = (event: React.PointerEvent) => {
    const held = drag.current;
    if (!held) return;
    const grid = snap ? 8 : 1;
    const round = (value: number) => Math.round(value / grid) * grid;
    const dx = round(held.dx + (event.clientX - held.x) / scale);
    const dy = round(held.dy + (event.clientY - held.y) / scale);
    setLayers((current) => ({ ...current, [held.part]: { ...(current[held.part] ?? { dx: 0, dy: 0, visible: true, version: null }), dx, dy } }));
  };
  const endDrag = () => {
    const held = drag.current;
    if (!held) return;
    drag.current = null;
    const layer = layersRef.current[held.part] ?? { dx: 0, dy: 0, visible: true, version: null };
    setLog(`${readable(held.part)} at dx ${layer.dx}, dy ${layer.dy}. Nothing is saved until you send it to the studio.`);
  };

  const setVerdict = (part: string, state: ApprovalState) => {
    if (!author) { setLog("Choose your name at the bottom of the panel before recording a verdict."); return; }
    setApprovals((current) => {
      const existing = current[part];
      if (existing && existing.state === state && existing.author === author) {
        const next = { ...current };
        delete next[part];
        return next;
      }
      return { ...current, [part]: { state, author, at: new Date().toISOString() } };
    });
    setLog(`${STATE_LABEL[state]} recorded for ${readable(part)} by ${author}.`);
  };

  const resetAll = () => {
    if (!manifest) return;
    setLayers(Object.fromEntries(manifest.stickers.map((sticker) => [sticker.part, { dx: 0, dy: 0, visible: sticker.enabled, version: null } as DeskLayer])));
    setNotes({});
    setApprovals({});
    setMessage("");
    setLog("Back to the kit as it was cut: every layer where room-part.py put it, every flag from parts.json.");
  };

  // ------------------------------------------------------------- decisions
  const [decisions, setDecisions] = useState<DeskDecision[]>(initialDecisions);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(decisionsError);
  const [sent, setSent] = useState("");
  const [note, setNote] = useState(storeNote);
  const sendingRef = useRef(false);

  async function send() {
    if (sendingRef.current || !manifest || !author) return;
    sendingRef.current = true;
    setSending(true); setSent(""); setSendError("");
    try {
      const body = {
        author,
        layout: Object.fromEntries(manifest.stickers.map((sticker) => [sticker.part, layerOf(sticker.part)])),
        notes: { ...notes, ...(message.trim() ? { [DESK_MESSAGE_KEY]: message } : {}) },
        approvals,
        status: "sent" as const,
      };
      const response = await fetch("/api/desk/decisions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (response.redirected || !response.headers.get("content-type")?.includes("application/json")) throw new Error("Sign in again before sending. The arrangement is still on this page.");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We could not confirm the send. The arrangement is still on this page.");
      setDecisions((current) => [result.decision, ...current].slice(0, 100));
      if (result.storeNote) setNote(result.storeNote);
      setSent("Sent to the studio. The studio machine picks it up with scripts/desk-pull.py.");
      setLog("Decision sent. Keep arranging — the next send is a new record; nothing is overwritten.");
    } catch (caught) {
      setSendError(caught instanceof Error && !(caught instanceof TypeError) ? caught.message : "We could not confirm the send. The arrangement is still on this page.");
    } finally { sendingRef.current = false; setSending(false); }
  }
  async function refreshDecisions() {
    setSendError("");
    try {
      const response = await fetch("/api/desk/decisions", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The studio decisions could not be refreshed.");
      setDecisions(result.decisions);
      if (result.storeNote) setNote(result.storeNote);
      setLog(`${result.decisions.length} decision${result.decisions.length === 1 ? "" : "s"} on record.`);
    } catch (caught) { setSendError(caught instanceof Error ? caught.message : "The studio decisions could not be refreshed."); }
  }

  // ----------------------------------------------------------- today's work
  const [reportIndex, setReportIndex] = useState<ReportIndex | null>(null);
  const [day, setDay] = useState("");
  const [report, setReport] = useState<ReportDay | null>(null);
  const [reportError, setReportError] = useState("");
  useEffect(() => {
    if (tab !== "today" || reportIndex) return;
    (async () => {
      try {
        const response = await fetch(`${WEB}/reports/index.json`, { cache: "no-store" });
        if (!response.ok) throw new Error("missing");
        const loaded: ReportIndex = await response.json();
        setReportIndex(loaded);
        setDay(loaded.dates[0]?.date || "");
      } catch { setReportError("No report days have been built for the website yet. On the studio machine run: python scripts/build-desk-web-assets.py"); }
    })();
  }, [tab, reportIndex]);
  useEffect(() => {
    if (!day) return;
    let live = true;
    (async () => {
      try {
        const response = await fetch(`${WEB}/reports/${day}.json`, { cache: "no-store" });
        if (!response.ok) throw new Error("missing");
        const loaded: ReportDay = await response.json();
        if (live) { setReport(loaded); setReportError(""); }
      } catch { if (live) { setReport(null); setReportError(`The record for ${day} has not been built for the website.`); } }
    })();
    return () => { live = false; };
  }, [day]);

  const ordered = useMemo(() => (manifest ? [...manifest.stickers].sort((a, b) => b.layerOrder - a.layerOrder) : []), [manifest]);
  const moved = Object.values(layers).filter((layer) => layer.dx || layer.dy).length;
  const swapped = Object.values(layers).filter((layer) => layer.version).length;

  return <main id="content" className={`workspace-main ${styles.page}`}>
    <header className="desk-heading">
      <p className="desk-eyebrow">The sticker desk</p>
      <h1>Arrange the room.<br /><em>Then send it to the studio.</em></h1>
      <p className="desk-intro">Every object in the room is its own layer. Move it, hide it, choose an earlier version of it, say what you think of it — then send the whole arrangement to the studio machine, which is the only place that can draw.</p>
    </header>

    <div className={styles.tabs} role="tablist" aria-label="Sticker desk sections">
      <button role="tab" type="button" aria-selected={tab === "desk"} className={tab === "desk" ? styles.tabOn : ""} onClick={() => setTab("desk")}>Arrange the room</button>
      <button role="tab" type="button" aria-selected={tab === "today"} className={tab === "today" ? styles.tabOn : ""} onClick={() => setTab("today")}>Today’s work</button>
    </div>

    {tab === "desk" ? <>
      {assetError && <p className={styles.banner} role="alert">{assetError}</p>}
      <div className={styles.desk}>
        <div className={styles.stage} ref={stageRef}>
          {manifest ? <div
            className={styles.room}
            style={{ width: manifest.plate.w, height: manifest.plate.h, transform: `scale(${scale})` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <img className={styles.base} src={`${WEB}/stickers/${manifest.base}`} alt="The room as it is built now" width={manifest.plate.w} height={manifest.plate.h} draggable={false} />
            {manifest.stickers.map((sticker) => {
              const layer = layerOf(sticker.part);
              if (!layer.visible) return null;
              const chosen = layer.version ? history[sticker.part]?.find((entry) => entry.version === layer.version) : undefined;
              return <div
                key={sticker.part}
                data-part={sticker.part}
                className={`${styles.layer} ${selected === sticker.part ? styles.layerOn : ""} ${chosen ? styles.layerSwapped : ""}`}
                style={{ left: sticker.x + layer.dx, top: sticker.y + layer.dy, width: sticker.w, height: sticker.h, zIndex: sticker.layerOrder }}
                title={sticker.part}
              >
                {chosen
                  ? <span className={styles.crop} style={{ backgroundImage: `url(${WEB}/history/${sticker.part}/${chosen.thumb})`, backgroundSize: `${manifest.plate.w}px ${manifest.plate.h}px`, backgroundPosition: `-${sticker.x}px -${sticker.y}px` }} />
                  : <img src={`${WEB}/stickers/${sticker.file}`} alt="" width={sticker.w} height={sticker.h} draggable={false} />}
              </div>;
            })}
          </div> : !assetError && <p className={styles.loading}>Bringing the room in…</p>}
          <p className={styles.hint}>Drag a layer · arrows nudge 1px, shift 10px · click the room to deselect</p>
        </div>

        <aside className={styles.panel} aria-label="The layers">
          <div className={styles.panelHead}>
            <h2>Layers</h2>
            <p>{manifest ? `${manifest.stickers.length} layers over ${manifest.plate.w} × ${manifest.plate.h}${manifest.generated ? ` · cut ${manifest.generated.slice(0, 10)}` : ""}` : "…"}</p>
            <p>{moved} moved · {swapped} on an earlier version</p>
          </div>
          <div className={styles.rows}>
            {ordered.map((sticker) => {
              const layer = layerOf(sticker.part);
              const versions = history[sticker.part] || [];
              const verdict = approvals[sticker.part];
              const open = selected === sticker.part;
              return <div key={sticker.part} className={`${styles.row} ${open ? styles.rowOn : ""} ${layer.visible ? "" : styles.rowOff}`} onClick={() => setSelected(sticker.part)}>
                <label className={styles.see} onClick={(event) => event.stopPropagation()}>
                  <input type="checkbox" checked={layer.visible} onChange={(event) => setLayers((current) => ({ ...current, [sticker.part]: { ...layer, visible: event.target.checked } }))} />
                  <span className={styles.srOnly}>Show {readable(sticker.part)}</span>
                </label>
                <span className={styles.name}>{readable(sticker.part)}</span>
                <span className={styles.order}>#{sticker.layerOrder}</span>
                <span className={styles.meta}>{sticker.w} × {sticker.h} · dx <b>{layer.dx}</b> dy <b>{layer.dy}</b> · {sticker.enabled ? "on" : "off"} in parts.json</span>
                <select
                  className={styles.version}
                  value={layer.version || ""}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => {
                    const version = event.target.value || null;
                    setLayers((current) => ({ ...current, [sticker.part]: { ...layer, version } }));
                    setLog(version
                      ? `${readable(sticker.part)} → ${version}. The desk shows that version’s thumbnail cropped to this layer’s box; the studio re-cuts it at full quality through the layer’s own alpha.`
                      : `${readable(sticker.part)} → the approved cut in the kit.`);
                  }}
                >
                  <option value="">Approved cut, as it is in the kit</option>
                  {versions.map((entry) => <option key={entry.version} value={entry.version}>{entry.version} · {entry.label}{entry.verdict && entry.verdict !== entry.label ? ` · ${entry.verdict}` : ""}</option>)}
                </select>
                <div className={styles.strip} onClick={(event) => event.stopPropagation()}>
                  {APPROVAL_STATES.map((state) => <button
                    key={state}
                    type="button"
                    className={`${styles.verdict} ${verdict?.state === state ? styles[state === "needs-work" ? "needsWork" : state] : ""}`}
                    aria-pressed={verdict?.state === state}
                    onClick={() => setVerdict(sticker.part, state)}
                  >{STATE_LABEL[state]}</button>)}
                  {verdict && <span className={styles.by}>{verdict.author}, {time(verdict.at)}</span>}
                </div>
                {open && <div className={styles.open} onClick={(event) => event.stopPropagation()}>
                  {layer.version && <p className={styles.swapNote}>Showing {layer.version}{versions.find((entry) => entry.version === layer.version)?.label ? ` · ${versions.find((entry) => entry.version === layer.version)?.label}` : ""} as a rectangular crop of that version’s thumbnail. It is a preview, not the cut: the studio re-cuts this object at full quality through this layer’s own alpha before it goes back into the room.</p>}
                  <label className={styles.noteBox}>Note on this layer
                    <textarea rows={3} maxLength={2000} value={notes[sticker.part] || ""} placeholder="What is right, what is wrong, what to try next…" onChange={(event) => setNotes((current) => ({ ...current, [sticker.part]: event.target.value }))} />
                  </label>
                  {versions.length > 0 && <div className={styles.thumbs}>
                    <button type="button" className={versions.every((entry) => entry.version !== layer.version) ? styles.thumbOn : ""} onClick={() => setLayers((current) => ({ ...current, [sticker.part]: { ...layer, version: null } }))}>
                      <img src={`${WEB}/stickers/${sticker.file}`} alt={`The approved cut of ${readable(sticker.part)}`} loading="lazy" />
                      <span>in the kit</span>
                    </button>
                    {versions.map((entry) => <button key={entry.version} type="button" className={layer.version === entry.version ? styles.thumbOn : ""} title={entry.note} onClick={() => setLayers((current) => ({ ...current, [sticker.part]: { ...layer, version: entry.version } }))}>
                      <img src={`${WEB}/history/${sticker.part}/${entry.thumb}`} alt={`${entry.version} of ${readable(sticker.part)}`} loading="lazy" />
                      <span>{entry.version} · {entry.label}</span>
                    </button>)}
                  </div>}
                  {!versions.length && <p className={styles.swapNote}>No archived versions of this object yet. The studio writes them to canon/room-kit/v2/history/{sticker.part}/ as it makes them.</p>}
                </div>}
              </div>;
            })}
          </div>

          <div className={styles.send}>
            <div className={styles.sendRow}>
              <label>Your name
                <select value={author} onChange={(event) => setAuthor(event.target.value as DeskAuthor)}>
                  <option value="">Choose your name</option>
                  {DESK_AUTHORS.map((name) => <option key={name}>{name}</option>)}
                </select>
              </label>
              <label className={styles.snap}><input type="checkbox" checked={snap} onChange={(event) => setSnap(event.target.checked)} /> snap 8px</label>
            </div>
            <label className={styles.noteBox}>A message with this decision
              <textarea rows={2} maxLength={2000} value={message} placeholder="What the studio should do with this arrangement…" onChange={(event) => setMessage(event.target.value)} />
            </label>
            <div className={styles.sendRow}>
              <button className="desk-button" type="button" disabled={!manifest || !author || sending} onClick={send}>{sending ? "Sending…" : "Send to the studio"}</button>
              <button type="button" onClick={resetAll} disabled={!manifest}>Reset</button>
              <button type="button" onClick={refreshDecisions}>Refresh ↻</button>
            </div>
            {!author && <p className={styles.small}>Choose a name first — the studio needs to know whose decision this is.</p>}
            {sent && <p className={styles.ok} role="status">{sent}</p>}
            {sendError && <p className={styles.bad} role="alert">{sendError}</p>}
            <p className={styles.log} aria-live="polite">{log}</p>
          </div>
        </aside>
      </div>

      <section className={styles.record} aria-labelledby="record-title">
        <div className={styles.sectionHead}>
          <div><p className="desk-eyebrow">What has been sent</p><h2 id="record-title">Decisions waiting for the studio.</h2></div>
          <p>{decisions.length} on record</p>
        </div>
        <p className={styles.storeNote}>{note}</p>
        <p className={styles.storeNote}>On the studio machine: <code>python scripts/desk-pull.py</code> writes each new decision into canon/room-kit/v2/decisions/ and prints it. Then the local sticker desk (<code>node scripts/sticker-desk.mjs</code>) and <code>scripts/compose-layers.py</code> do the work the website cannot.</p>
        {decisions.length === 0
          ? <p className={styles.empty}>Nothing has been sent yet. Arrange the room above and send the first one.</p>
          : <ol className={styles.decisions}>{decisions.map((decision) => <li key={decision.id}>
            <article>
              <header><strong>{decision.author}</strong><span>{decision.status}</span><time dateTime={decision.createdAt}>{time(decision.createdAt)} ET</time></header>
              <p className={styles.small}>{summarizeDecision(decision)}</p>
              {decision.notes[DESK_MESSAGE_KEY] && <p className={styles.said}>{decision.notes[DESK_MESSAGE_KEY]}</p>}
              <ul className={styles.verdicts}>
                {Object.entries(decision.approvals).map(([part, verdict]) => <li key={part}><b>{readable(part)}</b> {STATE_LABEL[verdict.state].toLowerCase()} · {verdict.author}</li>)}
                {Object.entries(decision.notes).filter(([key]) => key !== DESK_MESSAGE_KEY).map(([part, text]) => <li key={`n-${part}`}><b>{readable(part)}</b> {text}</li>)}
              </ul>
              <p className={styles.small}>Record {decision.id.slice(0, 8)}…</p>
            </article>
          </li>)}</ol>}
      </section>
    </> : <section className={styles.today} aria-label="Today’s work">
      {reportError && <p className={styles.banner}>{reportError}</p>}
      {reportIndex && <div className={styles.todayHead}>
        <label>Day
          <select value={day} onChange={(event) => setDay(event.target.value)}>
            {reportIndex.dates.map((entry) => <option key={entry.date} value={entry.date}>{dayLabel(entry.date)} · {entry.entries} images</option>)}
          </select>
        </label>
        {report?.pdf && <a className="desk-button" href={`https://github.com/${repo}/blob/main/${report.pdf}`} target="_blank" rel="noreferrer">Open the day’s PDF ↗</a>}
        <Link href="/reports">The written daily report →</Link>
      </div>}
      {report && <>
        <p className={styles.storeNote}>
          {report.entries.length} images logged on {dayLabel(report.date)}, each with the ask, the thinking and the prompt in reports/{report.date}/REPORT.md on the studio machine.
          {report.show ? <> The picture show for that day is published locally at <code>{report.show}</code> — open it on the studio machine.</> : <> No local picture show has been published for that day.</>}
        </p>
        <div className={styles.grid}>{report.entries.map((entry) => <figure key={entry.num}>
          {entry.thumb
            ? <img src={`${WEB}/reports/${entry.thumb}`} alt={entry.title.replaceAll("-", " ")} loading="lazy" />
            : <span className={styles.noThumb}>No picture was kept for this entry.</span>}
          <figcaption><strong>{entry.num}</strong> {entry.title.replaceAll("-", " ")}{entry.verdict ? <em> — {entry.verdict}</em> : null}</figcaption>
        </figure>)}</div>
      </>}
    </section>}
  </main>;
}
