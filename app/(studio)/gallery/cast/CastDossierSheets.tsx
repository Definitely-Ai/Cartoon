import Image from "next/image";
import { castPortrait, castDetail, type CastDossier } from "@/lib/cast-presentation";

function Folio({ name, page }: { name: string; page: number }) {
  return <footer className="dossier-folio"><span>{name} · The Swinging Door</span><span>September 2026 · {page} / 3</span></footer>;
}
export default function CastDossierSheets({ members }: { members: CastDossier[] }) {
  return <div className="cast-print-sheets dossier-sheets">{members.map(m => <div className="dossier-member" key={m.id}>
    <article className="dossier-sheet dossier-profile">
      <header className="dossier-page-heading"><p className="cast-kicker">The cast / Character profile</p><h2>{m.name}</h2><p>{m.premise}</p></header>
      <div className="dossier-hero"><Image src={castPortrait(m.id)} alt={m.alt} width={1024} height={1536} unoptimized loading="eager" /><aside><p className="cast-kicker">At a glance</p><h3>{m.role}</h3><dl><div><dt>Species</dt><dd>{m.species}</dd></div><div><dt>Age</dt><dd>{m.age}</dd></div></dl><h3>Personality</h3><ul>{m.temperament.map(t => <li key={t}>{t}</li>)}</ul><blockquote>{m.voice}</blockquote></aside></div>
      <section className="dossier-background"><h3>Background &amp; place in the story</h3>{m.backstory.map(p => <p key={p}>{p}</p>)}</section>
      <Folio name={m.name} page={1} />
    </article>
    <article className="dossier-sheet dossier-signatures">
      <header className="dossier-page-heading"><p className="cast-kicker">{m.name} / The visual identity</p><h2>Signature details.</h2><p>The small things that make this character unmistakable.</p></header>
      <div className="dossier-details">{m.signature.map(s => <section key={s.key}><div className="dossier-detail-art"><Image src={castDetail(m.id,s.key)} alt={`${m.name}: ${s.title}; crop from the current portrait`} width={s.crop[2]} height={s.crop[3]} unoptimized loading="eager" /></div><div><h3>{s.title}</h3><p>{s.text}</p></div></section>)}</div>
      <aside className="dossier-small-note">These are unretouched details from the current presentation portrait. Enlargement shows the existing marks; it does not add resolution.</aside>
      <Folio name={m.name} page={2} />
    </article>
    <article className="dossier-sheet dossier-acting">
      <header className="dossier-page-heading"><p className="cast-kicker">{m.name} / Performance &amp; continuity</p><h2>In the conversation.</h2><p>One speaker. Every listener knows who has the floor.</p></header>
      <div className="dossier-poses">{m.poses.map(p => <figure key={p.key}><Image src={castDetail(m.id,p.key)} alt={`${m.name}: ${p.title}. ${p.text}`} width={m.poseCrop[2]} height={m.poseCrop[3]} unoptimized loading="eager" /><figcaption><h3>{p.title}</h3><p>{p.text}</p></figcaption></figure>)}</div>
      <p className="dossier-small-note">Current Best Of acting masters: facial speaking/listening studies, not retired concept sheets or newly invented full-body gestures.</p>
      <div className="dossier-performance-copy"><section><h3>How {m.name} speaks</h3><ul>{m.voiceNotes.map(v => <li key={v}>{v}</li>)}</ul><h3>Relationships</h3>{m.relationships.map(r => <p key={r.name}><strong>{r.name}.</strong> {r.text}</p>)}</section><section><h3>Keep consistent</h3><ul>{m.continuity.map(c => <li key={c}>{c}</li>)}</ul></section></div>
      <Folio name={m.name} page={3} />
    </article>
  </div>)}</div>;
}
