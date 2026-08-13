"use client";

import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import TransitionLink from "@/components/TransitionLink";
import type { Cartoon } from "@/lib/cartoons";
import { dayOfYear, formatDateAP } from "@/lib/format";
import { useTagFilter } from "@/lib/useTagFilter";

// The archive wall + its rubber-stamp tag filter. Filtering is client-side
// via the shared headless hook; this component only owns the look: stamps
// (white chip, black outline; inked solid with a dense halftone offset when
// pressed) and dated panels at deterministic, slightly imperfect angles.

/** Deterministic tilt from the strip's date — same lean on every visit. */
function tiltFor(date: string): string {
  return (((dayOfYear(date) % 5) - 2) * 0.55).toFixed(2);
}

function Stamp({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <span className={active ? "vc-stamp-slot is-active" : "vc-stamp-slot"}>
      <button type="button" className="vc-stamp" aria-pressed={active} onClick={onClick}>
        {children}
      </button>
    </span>
  );
}

export default function ArchiveWall({ cartoons }: { cartoons: Cartoon[] }) {
  const { tag, setTag, tags, filtered } = useTagFilter(cartoons);

  return (
    <section className="vc-archive" aria-label="Cartoon archive">
      <div className="vc-stamp-row" role="group" aria-label="Filter strips by subject">
        <Stamp active={tag === null} onClick={() => setTag(null)}>
          All strips
        </Stamp>
        {tags.map((t) => (
          <Stamp key={t} active={tag === t} onClick={() => setTag(t)}>
            {t}
          </Stamp>
        ))}
      </div>

      <p className="vc-archive-count" aria-live="polite">
        {tag
          ? `${filtered.length} of ${cartoons.length} strips filed under “${tag}.”`
          : `${cartoons.length} strips on file.`}
      </p>

      <ul className="vc-archive-wall">
        {filtered.map((cartoon) => (
          <li
            key={cartoon.slug}
            className="vc-pin"
            style={{ "--tilt": tiltFor(cartoon.date) } as CSSProperties}
          >
            <TransitionLink href={`/cartoon/${cartoon.slug}?from=c`} className="vc-teaser-link">
              <article className="vc-panel vc-archive-panel">
                <span className="vc-tab">{formatDateAP(cartoon.date)}</span>
                <h2 className="vc-archive-title">{cartoon.title}</h2>
                <figure style={{ viewTransitionName: `panel-${cartoon.slug}` }}>
                  <Image
                    src={cartoon.src}
                    alt={cartoon.alt}
                    width={cartoon.width}
                    height={cartoon.height}
                    sizes="(min-width: 760px) 640px, 94vw"
                    className="vc-art"
                  />
                  <figcaption className="vc-caption">{cartoon.caption}</figcaption>
                </figure>
                {cartoon.tags.length > 0 && (
                  <p className="vc-filed">Filed under: {cartoon.tags.join(", ")}</p>
                )}
              </article>
            </TransitionLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
