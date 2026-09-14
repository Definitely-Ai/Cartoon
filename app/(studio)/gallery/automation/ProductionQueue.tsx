"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { validateEditionInput, type EditionInput } from "@/lib/automation-studio-core";
import type { AutomationJob, WorkerHealth } from "@/lib/automation-queue-core";
import type { EditionSchedule } from "@/lib/automation-schedules-core";

const pendingKey = "swinging-door-pending-production-v1";
type Pending = { requestId: string; input: EditionInput; recordedAt: string };
const statusLabel = { queued: "Waiting in queue", running: "In production", succeeded: "Ready for your review", failed: "Needs attention" };
function decodePending(raw: string | null): Pending | null {
  if (raw === null) return null;
  const value = JSON.parse(raw) as Pending;
  if (!value || typeof value.requestId !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value.requestId) ||
      typeof value.recordedAt !== "string" || !Number.isFinite(Date.parse(value.recordedAt))) throw Error("Invalid saved retry.");
  return { ...value, input: validateEditionInput(value.input, new Date(value.recordedAt)) };
}

export default function ProductionQueue({ canManage, mode, getInput }: {
  canManage: boolean; mode: EditionInput["timing"]["mode"]; getInput: () => EditionInput;
}) {
  const [jobs, setJobs] = useState<AutomationJob[]>([]);
  const [workers, setWorkers] = useState<WorkerHealth[]>([]);
  const [schedules, setSchedules] = useState<EditionSchedule[]>([]);
  const [checkedAt, setCheckedAt] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const pendingRef = useRef<Pending | null>(null);
  const sendingRef = useRef(false);
  const refreshSequence = useRef(0);
  const [sending, setSending] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [listError, setListError] = useState("");
  const [notice, setNotice] = useState("");
  const recurring = mode === "daily" || mode === "weekly";

  function forgetPending(requestId: string) {
    const current = decodePending(localStorage.getItem(pendingKey));
    if (current && current.requestId !== requestId) return;
    localStorage.removeItem(pendingKey);
    pendingRef.current = null; setPending(null);
  }

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const sequence = ++refreshSequence.current;
    try {
      const [response, schedulesResponse] = await Promise.all([
        fetch("/api/gallery/automation/jobs", { cache: "no-store", signal }),
        fetch("/api/gallery/automation/schedules", { cache: "no-store", signal }),
      ]);
      if (!response.ok) throw Error("The queue could not be checked. Previously saved requests remain in the database.");
      const data = await response.json();
      if (!schedulesResponse.ok) throw Error("Schedule status could not be checked. Saved requests remain in the database.");
      const scheduleData = await schedulesResponse.json();
      if (signal?.aborted || sequence !== refreshSequence.current) return;
      setJobs(data.jobs); setWorkers(data.workers); setSchedules(scheduleData.schedules); setCheckedAt(data.checkedAt); setListError("");
      const saved = pendingRef.current;
      if (saved && [...data.jobs, ...scheduleData.schedules].some((job: {requestId:string}) => job.requestId === saved.requestId)) {
        forgetPending(saved.requestId); setNotice("Your request is confirmed in the queue.");
      }
    } catch (failure) {
      if (!signal?.aborted && sequence === refreshSequence.current) setListError(failure instanceof Error ? failure.message : "The queue is temporarily unavailable.");
    }
  }, []);

  useEffect(() => {
    if (!canManage) return;
    function restore() {
      try {
        const value = decodePending(localStorage.getItem(pendingKey));
        pendingRef.current = value; setPending(value);
        if (!navigator.locks) throw Error("Browser locking is unavailable.");
        setReady(true);
      } catch { setReady(false); setError("Browser storage or locking is unavailable, or a saved retry is damaged. Do not resubmit until it is checked; duplicate prevention needs that receipt."); }
    }
    restore();
    const storageChanged = (event: StorageEvent) => { if (event.key === pendingKey || event.key === null) restore(); };
    window.addEventListener("storage", storageChanged);
    const controller = new AbortController();
    void refresh(controller.signal);
    const interval = setInterval(() => { if (!document.hidden) void refresh(controller.signal); }, 15_000);
    return () => { controller.abort(); clearInterval(interval); window.removeEventListener("storage", storageChanged); };
  }, [canManage, refresh]);

  async function enqueue() {
    if (sendingRef.current || !canManage || !ready) return;
    sendingRef.current = true; setSending(true); setError(""); setNotice("");
    try {
      await navigator.locks.request(pendingKey, { ifAvailable: true }, async lock => {
      if (!lock) throw Error("Another studio tab is confirming a request. Wait for its result before submitting here.");
      const request = decodePending(localStorage.getItem(pendingKey)) ?? { requestId: crypto.randomUUID(), input: getInput(), recordedAt: new Date().toISOString() };
      // Save the exact request before network I/O. A lost response is retried with
      // the same identity and payload, even after a browser/Windows restart.
      localStorage.setItem(pendingKey, JSON.stringify(request));
      pendingRef.current = request; setPending(request);
      const isSchedule = request.input.timing.mode === "daily" || request.input.timing.mode === "weekly";
      const response = await fetch(`/api/gallery/automation/${isSchedule ? "schedules" : "jobs"}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(30_000), body: JSON.stringify({ requestId: request.requestId, input: request.input }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 400 || response.status === 422) forgetPending(request.requestId);
        throw Error(data.error || "The request was not confirmed. Retry the saved request; do not create another.");
      }
      forgetPending(request.requestId);
      refreshSequence.current += 1;
      if (isSchedule) setSchedules(current => [data.schedule, ...current.filter(item => item.id !== data.schedule.id)]);
      else setJobs(current => [data.job, ...current.filter(job => job.id !== data.job.id)]);
      setNotice(isSchedule ? "Recurring production activated. The cloud queues dated editions ahead of time; the workstation runs them when due and online. Nothing is published automatically." : "Request saved. The workstation will pick it up when it is online and the edition is due. Nothing has been published.");
      void refresh();
      });
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Request not confirmed. Retry uses the same receipt."); }
    finally { sendingRef.current = false; setSending(false); }
  }

  async function toggleSchedule(item: EditionSchedule) {
    if (sendingRef.current) return;
    sendingRef.current = true; setSending(true); setError("");
    try {
      const response = await fetch("/api/gallery/automation/schedules", {method:"PATCH",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({id:item.id,status:item.status === "active" ? "paused" : "active"})});
      const data = await response.json();
      if (!response.ok) throw Error(data.error || "Schedule change not confirmed. Refresh before trying again.");
      refreshSequence.current += 1;
      setSchedules(current => current.map(row => row.id === item.id ? data.schedule : row));
      setNotice(data.schedule.status === "paused" ? "Schedule paused. A job already running may finish; waiting dates are retained." : "Schedule resumed. Retained waiting dates can now run.");
      void refresh();
    } catch (failure) {setError(failure instanceof Error ? failure.message : "Schedule change was not confirmed.");}
    finally {sendingRef.current = false; setSending(false);}
  }

  return <section className="automation-production" aria-labelledby="production-heading">
    <div className="automation-section-title"><span>03 / The production desk</span><h2 id="production-heading">A saved request. A recoverable job.</h2></div>
    <p>The website holds your request in the database. Your 4090 workstation checks for due work, saves progress, and returns private proofs here. Closing this page does not cancel a confirmed request.</p>
    {!canManage ? <p><Link href="/login">Sign in</Link> to start production, check the workstation, and open private proofs.</p> : <>
      <div className="automation-worker-health" aria-live="polite">
        <strong>{!checkedAt ? "Checking workstation…" : workers.some(worker => worker.connected) ? "Workstation connected" : "Workstation offline or not yet connected"}</strong>
        <span>Offline requests stay queued. Generation needs the PC powered on, Windows running, and internet available.</span>
        {workers.map(worker => <span key={worker.id}>{worker.name} · {worker.enabled ? worker.connected ? "checking in" : "no recent heartbeat" : "disabled"}{worker.lastSeenAt && <> · last seen <time dateTime={worker.lastSeenAt}>{new Date(worker.lastSeenAt).toLocaleString()}</time></>}</span>)}
        {checkedAt && <small>Queue checked <time dateTime={checkedAt}>{new Date(checkedAt).toLocaleTimeString()}</time></small>}
      </div>
      {recurring && !pending && <p className="automation-source-note">Activating this schedule queues editions seven days ahead. The cloud refreshes those dates daily; the worker also checks for missed dates. A start time is the earliest production time, not a guaranteed delivery deadline.</p>}
      {pending && <p className="automation-notice">Unconfirmed request retained for {pending.input.location.name}: {pending.input.quantity} cartoon(s). Retry sends that exact request, not the edited form.</p>}
      <div className="automation-actions"><button type="button" className="automation-button" disabled={sending || !ready} onClick={enqueue}>{sending ? "Confirming request…" : pending ? "Retry saved request" : recurring ? "Activate recurring production" : mode === "once" ? "Queue this dated edition" : "Generate this edition"}</button><button type="button" className="automation-button secondary" onClick={() => void refresh()}>Refresh queue</button></div>
      <p className="automation-small">Private drafts only. Automated checks do not replace your editorial approval. A job that cannot meet the factual or visual checks is held for attention, not published.</p>
      {notice && <p className="automation-notice" role="status">{notice}</p>}{error && <p className="automation-error" role="alert">{error}</p>}{listError && <p className="automation-error" role="alert">{listError}</p>}
      {schedules.length > 0 && <section aria-label="Recurring production schedules"><h3>Recurring editions</h3><p className="automation-small">Pausing stops new starts, not work already running. Waiting dates are retained and can catch up when resumed.</p><ul className="automation-job-list">{schedules.map(item => <li key={item.id}><div className="automation-job-title"><h3>{item.input.location.name} · {item.input.timing.mode}</h3><strong>{item.status === "active" ? "Active" : "Paused"}</strong></div><p>{item.input.timing.time} · {item.input.location.timezone} · {item.input.quantity} cartoons per edition</p><button type="button" className="automation-button secondary" disabled={sending} onClick={() => void toggleSchedule(item)}>{item.status === "active" ? "Pause" : "Resume"} {item.input.location.name} schedule</button></li>)}</ul></section>}
      {!jobs.length ? <p>No production requests in the current queue view.</p> : <ul className="automation-job-list">{jobs.map(job => <li key={job.id}>
        <div className="automation-job-title"><h3>{job.input.location.name}, {job.input.location.region}</h3><strong>{statusLabel[job.status]}</strong></div>
        <p>{job.input.quantity} cartoon(s) requested · {job.input.cast} · Due <time dateTime={job.dueAt}>{new Date(job.dueAt).toLocaleString("en-US", { timeZone: job.input.location.timezone, timeZoneName: "short" })}</time></p>
        <p className="automation-small">{job.progress.stage || "Waiting"}{job.progress.total > 0 ? ` · ${job.progress.completed}/${job.progress.total}` : ""} · Attempt {job.attempt} · Receipt {job.id.slice(0, 8)}</p>
        {job.lastError && <p className="automation-error">{job.lastError}</p>}
        {job.status === "queued" && job.attempt > 0 && <p className="automation-small">Recovery retry is saved for <time dateTime={job.availableAt}>{new Date(job.availableAt).toLocaleString()}</time>.</p>}
        {job.artifacts.length > 0 && <div className="automation-artifact-links">{job.artifacts.map(item => <a key={item.name} href={`/api/gallery/automation/assets?jobId=${encodeURIComponent(job.id)}&name=${encodeURIComponent(item.name)}`} target="_blank" rel="noreferrer">{item.kind === "image" ? "Open cartoon" : "Production report"}: {item.name}</a>)}</div>}
      </li>)}</ul>}
    </>}
  </section>;
}
