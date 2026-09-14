import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { castDossiers, castPresentation, castPortrait, castPDF } from "@/lib/cast-presentation";
import PrintControl from "../../PrintControl";
import CastDossierSheets from "../../CastDossierSheets";
import "../../cast.css";
import "../../dossiers.css";

type Props = { params: Promise<{ character: string }> };
export function generateStaticParams() { return [...castPresentation.map(member => ({ character: member.id })), { character: "all" }]; }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { character } = await params;
  return { title: `${character === "all" ? "The Cast" : castPresentation.find(member => member.id === character)?.name || "Character"} · Character dossier` };
}
export default async function CharacterPrintPage({ params }: Props) {
  const { character } = await params;
  const members = character === "all" ? castDossiers : castDossiers.filter(member => member.id === character);
  if (!members.length) notFound();
  return <main id="content" className="cast-print-room dossier-room">
    <header className="cast-print-toolbar print-hide">
      <Link className="cast-text-link" href="/gallery/cast">← Back to the cast</Link>
      <div className="cast-actions">
        <a className="cast-text-link" href={castPDF(character)} download>Download {members.length * 3}-page PDF</a>
        {character !== "all" && <a className="cast-text-link" href={castPortrait(character)} download>Portrait PNG</a>}
        <PrintControl label={character === "all" ? "Print complete cast packet" : `Print ${members[0].name}’s dossier`} />
      </div>
      <h1>{character === "all" ? "The complete cast" : members[0].name} · Character dossier</h1>
      <p>Three pages per character: background, signature details, and current speaking/listening poses. US Letter · Portrait · 100% scale · Browser headers and footers off. Use the typeset PDF for the most predictable result.</p>
      <p>Portraits retain their original 1024 × 1536 pixels. Detail and pose crops are reference enlargements, not new high-resolution masters. Backgrounds follow the character bibles; current owner corrections govern the visual notes.</p>
    </header>
    <CastDossierSheets members={members} />
  </main>;
}
