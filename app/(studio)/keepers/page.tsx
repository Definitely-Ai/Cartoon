import Image from "next/image";
import Link from "next/link";
import { getStudioKeepers, type StudioCartoon } from "@/lib/db";
import { PublishError } from "@/lib/githubPublish";

// Keepers: everything he starred, in one gallery — the strip's best-of,
// assembled one tap at a time, live from the studio database.

export const metadata = {
  title: "Keepers",
};

export const dynamic = "force-dynamic";

export default async function KeepersPage() {
  let keepers: StudioCartoon[] = [];
  let setupNote: string | null = null;
  try {
    keepers = await getStudioKeepers();
  } catch (err) {
    setupNote = err instanceof PublishError ? err.message : "The studio database isn't answering.";
  }

  return (
    <main id="content" className="br-main">
      <header className="br-table-head">
        <h1 className="br-date">Keepers</h1>
        <p className="br-status">
          {keepers.length === 0
            ? setupNote ?? "Nothing starred yet — the good ones end up here."
            : `${keepers.length} starred cartoon${keepers.length === 1 ? "" : "s"}, newest first.`}
        </p>
      </header>

      <ul className="br-proofs">
        {keepers.map((c) => (
          <li key={c.id} className="br-proof">
            <p className="br-proof-no" aria-hidden="true">
              {c.day} · № {c.n}
            </p>
            <figure className="br-proof-card">
              <span className="br-proof-tape" aria-hidden="true" />
              <a
                href={c.src}
                target="_blank"
                rel="noopener"
                className="br-proof-zoom"
                aria-label={`Open this keeper full size`}
              >
                <Image
                  src={c.src}
                  alt={`${c.title ?? "Keeper"}${c.caption ? ` — ${c.caption}` : ""}`}
                  width={c.width}
                  height={c.height}
                  sizes="(min-width: 700px) 620px, 94vw"
                  className="br-proof-img"
                />
              </a>
              <figcaption className="br-proof-cap">
                {c.title && <strong>{c.title}</strong>}
                {c.caption && <span className="sr-only"> — {c.caption}</span>}
              </figcaption>
            </figure>
            <p className="br-more-days">
              <Link href={`/day/${c.day}`}>See that day&rsquo;s batches</Link>
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
