import Image from "next/image";
import Link from "next/link";
import { getKeepers } from "@/lib/options";

// Keepers: everything he starred, in one gallery — the strip's best-of,
// assembled one tap at a time.

export const metadata = {
  title: "Keepers",
};

export default function KeepersPage() {
  const keepers = getKeepers();

  return (
    <main id="content" className="br-main">
      <header className="br-table-head">
        <h1 className="br-date">Keepers</h1>
        <p className="br-status">
          {keepers.length === 0
            ? "Nothing starred yet — the good ones end up here."
            : `${keepers.length} starred cartoon${keepers.length === 1 ? "" : "s"}, newest first.`}
        </p>
      </header>

      <ul className="br-proofs">
        {keepers.map((option) => (
          <li key={`${option.day}-${option.n}`} className="br-proof">
            <p className="br-proof-no" aria-hidden="true">
              {option.day} · № {option.n}
            </p>
            <figure className="br-proof-card">
              <span className="br-proof-tape" aria-hidden="true" />
              <a
                href={option.src}
                target="_blank"
                rel="noopener"
                className="br-proof-zoom"
                aria-label={`Open this keeper full size`}
              >
                <Image
                  src={option.src}
                  alt={`${option.title ?? "Keeper"}${option.caption ? ` — ${option.caption}` : ""}`}
                  width={option.width}
                  height={option.height}
                  sizes="(min-width: 700px) 620px, 94vw"
                  className="br-proof-img"
                />
              </a>
              <figcaption className="br-proof-cap">
                {option.title && <strong>{option.title}</strong>}
                {option.title && option.caption ? " — " : ""}
                {option.caption ?? ""}
              </figcaption>
            </figure>
            <p className="br-more-days">
              <Link href={`/day/${option.day}`}>See that day&rsquo;s batch</Link>
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
