import type { Metadata } from "next";
import { getCharacters } from "@/lib/canon";

// Dramatis Personae — the cast presented like the front matter of a nice
// book: names in display serif, one short paragraph each, and framed slots
// for the model sheets (empty and honest about it until the canon exists).

export const metadata: Metadata = {
  title: "Dramatis Personae",
  description: "The cast of the panel — Drew, Mango, and Abby — in order of billing.",
};

const ORDINALS = ["First", "Second", "Third", "Fourth", "Fifth"];

// The canonical bios are being written with the founder; until they arrive,
// each character gets a placeholder line in the house voice. Known cast
// members get a tailored line; anyone added later gets the general notice.
const PLACEHOLDER_BIOS: Record<string, string> = {
  flamingo:
    "Drew's formal biography is still being taken down at the founder's desk, where it is reportedly running long. Until the wording is settled, the record shows one flamingo, one bowtie, one martini with three olives, and a standing interest in the absurdity of institutions.",
  dog: "Mango's formal biography awaits the founder's sign-off, and Mango is in no hurry — he is mid-story. For now the file holds a single note: golden retriever, flag on the lapel, old fashioned in hand, believes in the country and reads the fine print anyway.",
  abby: "Abby's formal biography is short by design: westie, bartender, wise. She appears rarely, pours precisely, and has already heard the end of whatever argument is currently underway.",
};

function placeholderBio(id: string): string {
  return (
    PLACEHOLDER_BIOS[id] ??
    "A formal biography is being prepared with the founder and will appear here once the wording survives review."
  );
}

export default function CharactersPage() {
  const characters = getCharacters();

  return (
    <main id="content">
      <header className="vb-page-head">
        <h1 className="vb-page-title">Dramatis Personae</h1>
        <p className="vb-page-sub vb-caps-tiny">In order of billing</p>
      </header>

      <ul className="vb-cast">
        {characters.map((character, index) => (
          <li key={character.id} className="vb-cast-member">
            <article aria-label={character.name}>
              <h2 className="vb-cast-name">{character.name}</h2>
              <p className="vb-cast-billing vb-caps-tiny">
                {ORDINALS[index] ? `${ORDINALS[index]} billing` : `Billing no. ${index + 1}`}
              </p>
              <p className="vb-cast-bio">{character.bio ?? placeholderBio(character.id)}</p>

              <div className="vb-sheets">
                {character.modelSheets.map((sheet) => (
                  <figure key={sheet.label} className="vb-sheet-slot">
                    <span className="vb-sheet-slot-frame">
                      <span className="vb-sheet-slot-window">
                        {sheet.src ? (
                          // Plain <img>: the canon data layer carries no pixel
                          // dimensions for model sheets, so next/image has
                          // nothing to size from.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={sheet.src}
                            alt={`${character.name} — ${sheet.label}`}
                            loading="lazy"
                          />
                        ) : (
                          <span className="vb-sheet-slot-empty vb-caps-tiny">
                            Model sheet — coming soon
                          </span>
                        )}
                      </span>
                    </span>
                    <figcaption className="vb-caps-tiny">{sheet.label}</figcaption>
                  </figure>
                ))}
              </div>
            </article>
          </li>
        ))}
      </ul>
    </main>
  );
}
