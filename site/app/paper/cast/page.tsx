import type { Metadata } from "next";
import Image from "next/image";
import { getCharacters } from "@/lib/canon";

// The cast, done as a feature spread: one profile per character,
// separated by column rules, each with its model-sheet plates and a
// bio from the canon data layer. Anything the canon has not written
// yet (a null bio, a null sheet source) degrades to a placeholder in
// house voice; nothing here needs touching as the canon fills in.

export const metadata: Metadata = {
  title: "Meet the Cast",
  // BRAND: replace when final
  description: "The regulars of the Swinging Door: Drew, Mango, and Abby behind the bar.",
};

// Masthead titles for the feature spread, drawn from the series bible.
// Anyone the canon adds later gets the general-assignment line.
const POSITIONS: Record<string, string> = {
  flamingo: "First Billing — Markets & Opinions",
  dog: "First Billing — Stories & Loyalty",
  abby: "Behind the Bar — Appears Sparingly",
};

export default function CharactersPage() {
  const cast = getCharacters();

  return (
    <main id="content" className="va-shell">
      <header className="va-page-head">
        <p className="va-eyebrow">The Feature Spread</p>
        <h1 className="va-page-title va-ink-spread">Meet the Cast</h1>
        <p className="va-standfirst">The staff, in order of billing.</p>
      </header>

      <div className="va-cast">
        {cast.map((character) => (
          <article className="va-profile" key={character.id}>
            <p className="va-profile-kicker">{POSITIONS[character.id] ?? "General Assignment"}</p>
            <h2 className="va-profile-name va-ink-spread">{character.name}</h2>

            <div className="va-sheets">
              {character.modelSheets.map((sheet) => (
                <div className="va-sheet" key={sheet.label}>
                  <div className="va-sheet-frame">
                    {sheet.src ? (
                      <Image
                        src={sheet.src}
                        alt={`${character.name} — ${sheet.label}`}
                        fill
                        sizes="(min-width: 900px) 18rem, 45vw"
                        className="va-sheet-img"
                      />
                    ) : (
                      <span className="va-sheet-pending">Model sheet — coming soon</span>
                    )}
                  </div>
                  <p className="va-sheet-label">{sheet.label}</p>
                </div>
              ))}
            </div>

            {character.bio ? (
              <p className="va-profile-bio">{character.bio}</p>
            ) : (
              <p className="va-profile-bio va-profile-bio-pending">
                The official biography is still being taken down at the founder&rsquo;s desk. Until it
                clears review, the record shows only that {character.name} appears daily, works
                strictly in black and white, and has never once apologized in print.
              </p>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
