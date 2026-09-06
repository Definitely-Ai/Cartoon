"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { RoomCandidate, RoomPart } from "@/lib/studio-room";
import styles from "./room.module.css";

export default function PartApproval({ part, candidates, manifestHash, enabled }: {
  part: RoomPart; candidates: RoomCandidate[]; manifestHash: string; enabled: boolean;
}) {
  const router = useRouter();
  const [candidateId, setCandidateId] = useState("");
  const [selectionHash, setSelectionHash] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const candidate = candidates.find((image) => image.id === candidateId);
  if (!enabled || part.mode === "code") return <div className={styles.approval}><button type="button" disabled aria-describedby="approval-status">Approve replacement</button><span>{part.mode === "code" ? "Lettering is managed by the art pipeline." : "Saving is available only in an enabled local studio."}</span></div>;
  async function approve() {
    if (!candidate || !confirmed || busy || saved) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/room/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ partId: part.id, candidateId: candidate.id, expectedManifestHash: selectionHash, confirmed: true }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The replacement was not saved.");
      setSaved(true); setConfirmed(false);
      setMessage(`${result.message}${result.sizeWarning ? ` ${result.sizeWarning}` : ""}`);
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "The replacement could not be saved."); }
    finally { setBusy(false); }
  }
  return <details className={styles.localApproval}>
    <summary>Choose a local replacement for {part.title}</summary>
    <p>This saves one source in the older parts manifest. The scene stays as it is until the art pipeline rebuilds it.</p>
    <label>Candidate from the parts work folder<select value={candidateId} disabled={busy} onChange={(event) => { setCandidateId(event.target.value); setSelectionHash(manifestHash); setConfirmed(false); setSaved(false); setMessage(""); }}><option value="">Choose an image after inspecting it…</option>{candidates.filter((image) => /\.png$/i.test(image.path)).map((image) => <option key={image.id} value={image.id}>{image.path.replace("canon/plates/work/", "")} · {image.id.slice(0, 8)}</option>)}</select></label>
    {candidate && <div className={styles.approvalChoice}><Image src={candidate.imageUrl} alt={`Selected candidate for ${part.title}`} width={candidate.viewingWidth || candidate.width} height={candidate.viewingHeight || candidate.height} unoptimized /><p><strong>{part.title}</strong><br />{candidate.path}<br /><a href={`/api/library/${candidate.id}?variant=view`} target="_blank" rel="noreferrer">Inspect the selected image ↗</a></p></div>}
    {candidate && <label className={styles.approvalConfirm}><input type="checkbox" checked={confirmed} disabled={busy || saved} onChange={(event) => setConfirmed(event.target.checked)} /><span>I reviewed this image and want it to replace the source for <strong>{part.title}</strong>.</span></label>}
    <button type="button" disabled={!candidate || !confirmed || busy || saved} onClick={approve}>{busy ? "Saving selected source…" : saved ? "Source saved locally" : "Save this part replacement"}</button>
    <p role="status" aria-live="polite">{message}</p>
  </details>;
}
