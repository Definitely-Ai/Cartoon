import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CAST_EDITION, castPresentation, castPortrait, castPDF } from "@/lib/cast-presentation";
import "./cast.css";

export const metadata: Metadata = {
  title: "The Cast · Drew, Barclay & Abby",
  description: "Meet Drew, Barclay and Abby: character backgrounds, signature details, current acting poses and professional printable dossiers.",
};

export default function CastPage() {
  return (
    <main id="content" className="cast-room">
      <header className="cast-heading">
        <div>
          <p className="cast-kicker">The Swinging Door · {CAST_EDITION}</p>
          <h1>Meet the cast.</h1>
          <p>Two gentlemen. One proprietor. Their stories, signature details and current acting poses.</p>
        </div>
        <div className="cast-actions">
          <a className="cast-button" href={castPDF("all")} download>Complete cast packet · 9-page PDF</a>
          <Link className="cast-text-link" href="/gallery/cast/print/all">Print the cast</Link>
        </div>
      </header>

      <section className="cast-portraits" aria-label="Character portraits">
        {castPresentation.map((member, index) => (
          <article className="cast-card" key={member.id}>
            <Link href={`/gallery/cast/print/${member.id}`} className="cast-art" aria-label={`View and print ${member.name}`}>
              <Image src={castPortrait(member.id)} alt={member.alt} width={1024} height={1536} unoptimized priority={index === 0} />
            </Link>
            <div className="cast-card-copy">
              <p className="cast-kicker">{member.species}</p>
              <h2>{member.name}</h2>
              <p className="cast-role">{member.role}</p>
              <p className="cast-bio">{member.bio}</p>
              <div className="cast-card-actions">
                <Link className="cast-button" href={`/gallery/cast/print/${member.id}`}>Explore {member.name}: story, details &amp; poses</Link>
                <a className="cast-text-link" href={castPDF(member.id)} download>Download {member.name}&rsquo;s 3-page dossier</a>
              </div>
            </div>
          </article>
        ))}
      </section>

      <footer className="cast-notes">
        <div><h2>Made for paper.</h2><p>Each character has a three-page US Letter dossier: a portrait and background, illustrated signature details, and current speaking/listening studies with personality, voice and continuity notes. Print one dossier or the complete nine-page cast packet.</p></div>
        <div><h2>Inside the cartoon.</h2><p>The speaker&rsquo;s mouth is open. The others look toward whoever is speaking. Drew&rsquo;s feathers and the dogs&rsquo; fur remain distinct.</p>
          <Link className="cast-text-link" href="/gallery/best-of">See them in the cartoons</Link>
        </div>
      </footer>
      <details className="cast-working-notes">
        <summary>Character bibles and working notes</summary>
        <p>These detailed working documents include earlier measurements and development notes. The portraits above follow the current cast direction; the published cartoon artwork is unchanged.</p>
        <nav aria-label="Character bibles">{castPresentation.map(member => <Link key={member.id} href={`/models/${member.bibleKey}`}>{member.name}&rsquo;s bible</Link>)}</nav>
      </details>
    </main>
  );
}
