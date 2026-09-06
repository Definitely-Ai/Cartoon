import Image from "next/image";
import Link from "next/link";
import { getStudioKeepers, type StudioCartoon } from "@/lib/db";
import { PublishError } from "@/lib/githubPublish";
import { formatDateAP } from "@/lib/format";

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
        {/* Same two voices as the rest of the room: what he can do about it,
            then what the operator needs to read. */}
        {setupNote ? (
          <>
            <p className="br-status">
              Saved keeper selections are unavailable right now. You can still browse the{" "}
              <Link href="/library">image library</Link>.
            </p>
            <details className="legacy-connection"><summary>Connection details</summary><p className="br-hint">{setupNote}</p></details>
          </>
        ) : (
          <p className="br-status">
            {keepers.length === 0 ? (
              <>
                No cartoons have been starred in the daily batches yet. When a batch is filed,
                choose <strong>Keep this one</strong> under a cartoon to collect it here. Browse{" "}
                <Link href="/collection">daily batches</Link> or the <Link href="/library">full image library</Link>.
              </>
            ) : (
              `${keepers.length} starred cartoon${keepers.length === 1 ? "" : "s"}, newest first.`
            )}
          </p>
        )}
      </header>

      {keepers.length > 0 && (
      <ul className="br-proofs">
        {keepers.map((c) => (
          <li key={c.id} className="br-proof">
            <p className="br-proof-no" aria-hidden="true">
              {formatDateAP(c.day)} · № {c.n}
            </p>
            <figure className="br-proof-card">
              <span className="br-proof-tape" aria-hidden="true" />
              <a
                href={c.src}
                target="_blank"
                rel="noopener"
                className="br-proof-zoom"
                aria-label="Open this keeper full size"
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
              <Link href={`/day/${c.day}`}>See the rest of that day</Link>
            </p>
          </li>
        ))}
      </ul>
      )}
    </main>
  );
}
