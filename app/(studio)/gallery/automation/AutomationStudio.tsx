"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { locationCoverage, nextPlannedRuns, validateEditionInput,
  type EditionInput, type SavedEditionPlan } from "@/lib/automation-studio-core";

type Example = { id: string; speaker: string; caption: string; tv: string; board: string[]; src: string; previewSrc: string };
type Props = { canManage: boolean; initialNow: string; examples: Example[] };
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const zones = ["America/New_York", "America/Chicago", "America/Denver", "America/Phoenix", "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu", "Europe/London", "Europe/Paris", "Asia/Tokyo", "Australia/Sydney"];
const stages = [
  { title: "Research", heading: "A real place. A supported premise.", text: "Start with attributable local sources and the audience’s everyday money concerns. Keep city, county, and national facts distinct. New places need their sources checked first.", foot: "Local discovery and evidence review are implemented." },
  { title: "Write", heading: "The line must work on its own.", text: "Develop alternatives, check grammar and political balance, and compare past jokes. Pick the clearest comic turn—not the longest explanation. Weak batches go back for revision.", foot: "Local writing and duplicate checks work; editorial judgment is still required." },
  { title: "Coordinate", heading: "Three layers. One conversation.", text: "Match a wordless, human-free black-and-white TV picture and a short chalk menu joke. Select the correct speaking and listening poses. Keep the room fixed and put the caption on the lower image.", foot: "Versioned acting, display planning, and protected composition are implemented." },
  { title: "Review", heading: "A finished proof, not an automatic approval.", text: "Inspect the caption, facts, displays, hands, gaze, and print-size readability together. Keep each revision and the exact final image. The owner decides what is ready to publish.", foot: "Image proofs and reviewed PDF exports exist. Publishing remains separate." },
];
function dateInZone(now: string | Date, timezone: string) {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(now));
  const get = (key: string) => p.find((part) => part.type === key)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
function normalizedDraft(input: EditionInput, now: Date): EditionInput {
  // Keep multiline editing natural without relaxing the strict API contract.
  const current = { ...input, audience: input.audience.replace(/\s+/g, " ").trim() };
  if (current.timing.mode === "now") {
    try { current.timing = { ...current.timing, date: dateInZone(now, current.location.timezone) }; }
    catch { /* The core validator reports an incomplete or invalid timezone. */ }
  }
  return current;
}
function downloadText(name: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2) + "\n"], { type: "application/json" }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function AutomationStudio({ canManage, initialNow, examples }: Props) {
  const [input, setInput] = useState<EditionInput>(() => ({
    location: { name: "Naples", region: "Florida", country: "US", timezone: "America/New_York", coverage: "city" },
    audience: "Local newspaper readers: homeowners, retirees, professionals, and business owners. Everyday money, housing, insurance, travel, family, and golf. Warm and politically middle-of-the-road.",
    quantity: 3, cast: "mixed",
    timing: { mode: "now", date: dateInZone(initialNow, "America/New_York"), time: "08:00", weekdays: [1, 3, 5] },
  }));
  const [clock, setClock] = useState(initialNow);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [stage, setStage] = useState(0);
  const [plans, setPlans] = useState<SavedEditionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(canManage);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [saveError, setSaveError] = useState("");
  const [listError, setListError] = useState("");
  const example = examples[exampleIndex];
  const coverage = locationCoverage(input);
  const preview = useMemo(() => {
    try {
      const now = new Date(clock);
      const clean = validateEditionInput(normalizedDraft(input, now), now);
      return { runs: nextPlannedRuns(clean, now, 5), error: "" };
    }
    catch (error) { return { runs: [], error: error instanceof Error ? error.message : "Check the edition details." }; }
  }, [input, clock]);

  useEffect(() => {
    const interval = setInterval(() => setClock(new Date().toISOString()), 60_000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (!canManage) return;
    const controller = new AbortController();
    fetch("/api/gallery/automation", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw Error("Shared plans are unavailable. You can still download your edition brief.");
      const data = await response.json();
      // A save can finish while this initial snapshot is still in flight.
      setPlans((current) => {
        const known = new Set(current.map((plan) => plan.id));
        return [...current, ...(data.plans as SavedEditionPlan[]).filter((plan) => !known.has(plan.id))];
      });
    }).catch((error) => { if (!controller.signal.aborted) setListError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoadingPlans(false); });
    return () => controller.abort();
  }, [canManage]);

  function change(next: EditionInput) { setInput(next); setNotice(""); setSaveError(""); }
  function location(key: keyof EditionInput["location"], value: string) {
    const next = { ...input, location: { ...input.location, [key]: value } };
    if (key === "timezone" && next.timing.mode === "now") {
      try { next.timing = { ...next.timing, date: dateInZone(new Date(), value) }; } catch { /* Validate on preview. */ }
    }
    change(next);
  }
  function timing(key: keyof EditionInput["timing"], value: string | number[]) {
    const next = { ...input, timing: { ...input.timing, [key]: value } };
    if (key === "mode" && value === "now") {
      try { next.timing.date = dateInZone(new Date(), input.location.timezone); }
      catch { /* Preserve the mode choice; preview reports the invalid timezone. */ }
    }
    change(next);
  }
  function cleanCurrentInput() {
    const now = new Date(); setClock(now.toISOString());
    return validateEditionInput(normalizedDraft(input, now), now);
  }
  function exportBrief() {
    try {
      const clean = cleanCurrentInput();
      downloadText(`swinging-door-${clean.location.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${clean.timing.date}.json`, {
        schema: "swinging-door-edition-plan-v1", createdAt: new Date().toISOString(), status: "planned",
        input: clean, plannedRuns: nextPlannedRuns(clean, new Date(), 5), sourceReadiness: locationCoverage(clean),
        executionEnabled: false, automaticPublication: false,
        constraints: { monochrome: true, tvHumans: false, chalkboard: "simple-hand-chalk", caption: "bottom-on-image", acting: "speaker mouth open; listeners looking at speaker", room: "preserve approved fixed set" },
        handoff: "Planning brief only. Not an executable pipeline configuration or an active schedule. Confirm sources, pin current approved cast, and connect the authenticated local worker before execution.",
      }); setNotice("Edition brief downloaded. No generation or schedule was started.");
    } catch (error) { setSaveError(error instanceof Error ? error.message : "Check the edition details."); }
  }
  async function savePlan(event: React.FormEvent) {
    event.preventDefault(); if (saving || !canManage) return;
    setSaveError(""); setNotice(""); setSaving(true);
    try {
      const clean = cleanCurrentInput();
      const response = await fetch("/api/gallery/automation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(clean) });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || "The save was not confirmed. Keep your brief and try again later.");
      setPlans((previous) => [data.plan, ...previous.filter((plan) => plan.id !== data.plan.id)]);
      setListError(""); setNotice("Plan saved to the studio. It is not active: the website-to-worker connection still needs setup.");
    } catch (error) { setSaveError(error instanceof Error ? error.message : "The save was not confirmed. Download your brief to keep it."); }
    finally { setSaving(false); }
  }

  return <main id="content" className="automation-page">
    <header className="automation-heading">
      <div><p className="automation-kicker">The Swinging Door · Automation Studio</p>
        <h1>Same bar.<br /><em>A new local conversation.</em></h1>
        <p>Plan an edition for a city, a town, or your own patch of the world.</p></div>
      <aside className="automation-readiness"><strong>Edition planner available</strong><span>Generation worker not connected to this website.</span><span>Plans do not run until that connection is enabled.</span></aside>
    </header>

    <div className="automation-workbench">
      <section className="automation-planner" aria-labelledby="edition-heading">
        <div className="automation-section-title"><span>01 / The edition</span><h2 id="edition-heading">Where shall we take the conversation?</h2></div>
        <form onSubmit={savePlan}>
          <div className="automation-fields two">
            <label>Place<input name="place" value={input.location.name} maxLength={80} onChange={(e) => location("name", e.target.value)} required /></label>
            <label>Area type<select name="area-type" value={input.location.coverage} onChange={(e) => location("coverage", e.target.value)}><option value="city">City</option><option value="town">Town</option><option value="county">County</option><option value="area">Custom area</option></select></label>
            <label>State / region<input name="region" value={input.location.region} maxLength={80} onChange={(e) => location("region", e.target.value)} required /></label>
            <label>Country<input name="country" value={input.location.country} maxLength={64} onChange={(e) => location("country", e.target.value)} required /></label>
          </div>
          <label className="automation-wide-label">Local timezone<input list="automation-timezones" name="timezone" value={input.location.timezone} maxLength={80} onChange={(e) => location("timezone", e.target.value)} required /><datalist id="automation-timezones">{zones.map((zone) => <option key={zone} value={zone} />)}</datalist></label>
          <div className="automation-source-note" role="status"><strong>{coverage.label}</strong><p>{coverage.detail}</p></div>
          <label className="automation-wide-label">Who is reading?<textarea name="audience" value={input.audience} maxLength={600} rows={3} onChange={(e) => change({ ...input, audience: e.target.value })} required /></label>
          <div className="automation-fields two">
            <label>Cartoons per edition<select name="quantity" value={input.quantity} onChange={(e) => change({ ...input, quantity: Number(e.target.value) })}>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select></label>
            <label>At the bar<select name="cast" value={input.cast} onChange={(e) => change({ ...input, cast: e.target.value as EditionInput["cast"] })}><option value="mixed">Rotate duos &amp; trios</option><option value="duo">Drew &amp; Barclay</option><option value="trio">Drew, Barclay &amp; Abby</option></select></label>
          </div>
          <fieldset className="automation-timing"><legend>When should an edition run?</legend>
            <div className="automation-mode-options">{([ ["now", "On demand"], ["once", "One date"], ["daily", "Daily"], ["weekly", "Weekly"] ] as const).map(([mode, label]) => <label key={mode}><input type="radio" name="timing-mode" value={mode} checked={input.timing.mode === mode} onChange={() => timing("mode", mode)} /><span>{label}</span></label>)}</div>
            {input.timing.mode !== "now" && <div className="automation-fields two"><label>{input.timing.mode === "once" ? "Edition date" : "Start date"}<input type="date" name="edition-date" value={input.timing.date} onChange={(e) => timing("date", e.target.value)} required /></label><label>Local run time<input type="time" name="run-time" value={input.timing.time} onChange={(e) => timing("time", e.target.value)} required /></label></div>}
            {input.timing.mode === "weekly" && <div className="automation-weekdays" role="group" aria-label="Weekly run days">{weekdays.map((day, index) => <label key={day}><input type="checkbox" checked={input.timing.weekdays.includes(index)} onChange={(e) => timing("weekdays", e.target.checked ? [...input.timing.weekdays, index] : input.timing.weekdays.filter((d) => d !== index))} /><span>{day}</span></label>)}</div>}
          </fieldset>
          <section className="automation-schedule-preview" aria-label="Planned run preview">
            <h3>{input.timing.mode === "now" ? "An on-demand edition" : "Planned dates, in local time"}</h3>
            {preview.error ? <p className="automation-error" role="alert">{preview.error}</p> : input.timing.mode === "now" ? <p>Prepare a current-day edition brief. Downloading or saving does not start the production worker.</p> : <ol>{preview.runs.map((run) => <li key={run.at}><time dateTime={run.at}>{run.label}</time></li>)}</ol>}
            {input.timing.mode !== "now" && <p className="automation-small">Preview only, not an active schedule. Research happens near execution, not in advance of future news. Recurring runs skip a nonexistent daylight-saving time; repeated times run once.</p>}
          </section>
          <div className="automation-actions"><button className="automation-button secondary" type="button" onClick={exportBrief} disabled={saving}>Download edition brief</button><button className="automation-button" type="submit" disabled={!canManage || saving || Boolean(preview.error)}>{saving ? "Saving…" : "Save plan to studio"}</button></div>
          {!canManage && <p className="automation-small"><Link href="/login">Sign in</Link> to save shared plans. Anyone can explore the planner and download a brief.</p>}
          <p className="automation-small">Delivery: review-ready cartoons. No automatic publishing or email. Quantity is a target, not permission to use weak material.</p>
          {notice && <p className="automation-notice" role="status">{notice}</p>}{saveError && <p className="automation-error" role="alert">{saveError}</p>}
        </form>
      </section>

      <aside className="automation-example" aria-labelledby="example-heading">
        <div className="automation-section-title"><span>02 / One consistent cast</span><h2 id="example-heading">The speaker changes.<br />The setting stays.</h2></div>
        <div className="automation-actor-options" role="group" aria-label="Explore speaking poses">{examples.map((item, index) => <button key={item.id} type="button" aria-pressed={exampleIndex === index} onClick={() => setExampleIndex(index)}>{item.speaker} speaks</button>)}</div>
        <a className="automation-art" href={example.src} target="_blank" rel="noreferrer" aria-label={`Open ${example.speaker}'s example cartoon full size`}><Image src={example.previewSrc} alt={`${example.speaker} speaking at The Swinging Door. ${example.caption}`} width={1024} height={1536} sizes="(max-width: 820px) 90vw, 430px" unoptimized priority /></a>
        <p className="automation-small">Existing selected cartoon · acting example, not a newly generated edition.</p>
        <dl className="automation-example-notes"><div><dt>Caption</dt><dd>“{example.caption}”</dd></div><div><dt>On the TV</dt><dd>{example.tv}<span>Monochrome illustration. No humans.</span></dd></div><div><dt>On the chalkboard</dt><dd>{example.board.join(" · ")}</dd></div><div><dt>Acting rule</dt><dd>{example.speaker} speaks; the other two look toward {example.speaker}.</dd></div></dl>
      </aside>
    </div>

    <section className="automation-workflow" aria-labelledby="workflow-heading"><div className="automation-section-title"><span>03 / From local news to the finished panel</span><h2 id="workflow-heading">What happens between the brief and the cartoon?</h2></div>
      <div className="automation-stage-controls" role="group" aria-label="Explore production stages">{stages.map((item, index) => <button type="button" key={item.title} aria-pressed={stage === index} aria-controls="automation-stage-detail" onClick={() => setStage(index)}><span>0{index + 1}</span>{item.title}</button>)}</div>
      <div className="automation-stage-detail" id="automation-stage-detail" aria-live="polite"><h3>{stages[stage].heading}</h3><p>{stages[stage].text}</p><p className="automation-small">{stages[stage].foot}</p></div>
    </section>

    <section className="automation-evidence" aria-labelledby="evidence-heading"><div className="automation-section-title"><span>04 / What is already demonstrated</span><h2 id="evidence-heading">Built on real production work.</h2></div>
      <div className="automation-evidence-columns"><div><h3>The local pipeline</h3><p>Research, local caption writing, matching TV art, chalk lettering, cast selection, and protected image composition have produced real review proofs.</p><p>Retained September 11–12 runs: six jobs, five awaiting owner review, one requiring proof changes. Verified September 14, 2026.</p></div><div><h3>The next connection</h3><p>This website does not yet dispatch jobs to the 4090 workstation. Saved dates are plans, not armed schedules. New areas need source setup, and the worker needs the latest approved cast pinned before a new edition.</p><p>The workstation must be available at run time. Reviews are still required; unattended humor and physical newspaper quality are not guaranteed.</p></div></div>
      <p className="automation-small">Those historical automation proofs used earlier cast studies and editorial revisions. The current gallery shows the visual benchmark, not a claim that all 38 cartoons were produced unattended.</p>
    </section>

    {canManage && <section className="automation-saved" aria-labelledby="plans-heading"><div className="automation-section-title"><span>05 / Shared edition plans</span><h2 id="plans-heading">Saved in the studio.</h2></div>
      {loadingPlans ? <p role="status">Loading shared plans…</p> : listError ? <p className="automation-error" role="alert">{listError}</p> : plans.length === 0 ? <p>No plans saved yet. Start with a place and an edition above.</p> : <ul>{plans.map((plan) => <li key={plan.id}><div><h3>{plan.input.location.name}, {plan.input.location.region}</h3><p>{plan.input.quantity} cartoons · {plan.input.timing.mode === "now" ? "On demand" : plan.input.timing.mode} · {plan.input.location.timezone}</p><p className="automation-small">Start: {plan.input.timing.date} · {plan.status === "archived" ? "Archived" : "Saved plan — not active"}</p></div><button className="automation-button secondary" type="button" onClick={() => downloadText(`swinging-door-plan-${plan.id.slice(0, 12)}.json`, { schema: "swinging-door-edition-plan-v1", ...plan, executionEnabled: false, automaticPublication: false })}>Download plan</button></li>)}</ul>}
    </section>}
    <footer className="automation-footer"><Link href="/gallery/best-of">Explore all 38 selected cartoons →</Link><span>One fixed set. Location-specific ideas. A deliberate quality check.</span></footer>
  </main>;
}
