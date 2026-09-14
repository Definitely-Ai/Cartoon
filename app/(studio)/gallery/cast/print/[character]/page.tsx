import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CAST_EDITION, castPresentation, castPortrait, castPDF } from "@/lib/cast-presentation";
import PrintControl from "../../PrintControl";
import "../../cast.css";

type Props = { params: Promise<{ character: string }> };
export function generateStaticParams() { return [...castPresentation.map(member => ({ character: member.id })), { character: "all" }]; }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { character } = await params;
  return { title: `${character === "all" ? "The Cast" : castPresentation.find(member => member.id === character)?.name || "Character"} · Print portrait` };
}
export default async function CharacterPrintPage({ params }: Props) {
  const { character } = await params;
  const members = character === "all" ? castPresentation : castPresentation.filter(member => member.id === character);
  if (!members.length) notFound();
  return <main id="content" className="cast-print-room">
    <header className="cast-print-toolbar print-hide">
      <Link className="cast-text-link" href="/gallery/cast">← Back to the cast</Link>
      <div className="cast-actions">
        <a className="cast-text-link" href={castPDF(character)} download>Download PDF</a>
        {character !== "all" && <a className="cast-text-link" href={castPortrait(character)} download>Portrait PNG</a>}
        <PrintControl label={character === "all" ? "Print all three" : `Print ${members[0].name}`} />
      </div>
      <p>US Letter · Portrait · Choose “Fit to page” and turn browser headers and footers off. For exact page sizing, use the PDF.</p>
    </header>
    <div className="cast-print-sheets">
      {members.map(member => <article className="cast-sheet" key={member.id}>
        <header><p className="cast-kicker">The Swinging Door · The cast</p><h1>{member.name}</h1><p className="cast-role">{member.role}</p></header>
        <Image className="cast-sheet-art" src={castPortrait(member.id)} alt={member.alt} width={1024} height={1536} unoptimized loading="eager" />
        <div className="cast-sheet-profile"><div><h2>{member.species}</h2><p>{member.bio}</p></div><div><h2>Signature details</h2><ul>{member.details.map(detail => <li key={detail}>{detail}</li>)}</ul></div></div>
        <footer><span>{member.voice}</span><span>{CAST_EDITION}</span></footer>
      </article>)}
    </div>
  </main>;
}
