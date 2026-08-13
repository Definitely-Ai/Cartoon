import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import { getCharacters } from "@/lib/canon";

// THE CAST: two big pinned cards with thick ink borders and halftone
// drop-shadows. Canon bios and model sheets are still being written with
// the founder, so every missing piece degrades to a framed, honest
// placeholder in the house voice.

export const metadata: Metadata = {
  title: "The Cast",
  description:
    // BRAND: replace when final
    "The regulars of the Swinging Door — Drew, Mango, and Abby — with model sheets and bios as the canon gets written.",
};

const BILLING = ["Top billing", "Top billing", "Behind the bar"];

// Placeholder bios in brand voice, used while canon bios are null.
const PLACEHOLDER_BIOS: Record<string, string> = {
  flamingo:
    "The tall one. Bowtie, martini, three olives, and a raised eyebrow for every institution on the TV. His official biography is still being written with the founder.",
  dog: "The earnest one. Flag on the lapel, old fashioned in paw, and a story about his grandfather queued for every occasion. His official biography is still being written with the founder.",
  abby: "The bartender. Wise, brief, and right. She appears rarely, which is how she likes it. Her official biography is still being written with the founder.",
};

export default function CharactersPage() {
  const cast = getCharacters();

  return (
    <main id="content" className="vc-board">
      <header className="vc-page-head">
        <h1 className="vc-sechead">
          <span>The Cast</span>
        </h1>
        <p className="vc-page-intro">The regulars. Two on stools, one behind the bar.</p>
      </header>

      <ul className="vc-cast-row">
        {cast.map((character, index) => (
          <li
            key={character.id}
            className="vc-pin"
            style={{ "--tilt": index % 2 === 0 ? "-0.6" : "0.8" } as CSSProperties}
          >
            <article className="vc-panel vc-cast-card">
              <p className="vc-billing">{BILLING[index] ?? "Also appearing"}</p>
              <h2 className="vc-cast-name vc-underline">{character.name}</h2>
              <p className="vc-cast-bio">
                {character.bio ??
                  PLACEHOLDER_BIOS[character.id] ??
                  `${character.name} has joined the cast. The official biography is still being written with the founder.`}
              </p>

              <ul className="vc-sheet-row">
                {character.modelSheets.map((sheet) => (
                  <li key={sheet.label}>
                    <div className="vc-sheet-frame">
                      {sheet.src ? (
                        <Image
                          src={sheet.src}
                          alt={`${character.name} — ${sheet.label}`}
                          fill
                          sizes="(min-width: 900px) 320px, 46vw"
                          className="vc-sheet-img"
                        />
                      ) : (
                        <p className="vc-sheet-empty">Model sheet — coming soon</p>
                      )}
                    </div>
                    <p className="vc-sheet-label">{sheet.label}</p>
                  </li>
                ))}
              </ul>
            </article>
          </li>
        ))}
      </ul>
    </main>
  );
}
