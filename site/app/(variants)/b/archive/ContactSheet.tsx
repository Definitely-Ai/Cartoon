"use client";

import Image from "next/image";
import TransitionLink from "@/components/TransitionLink";
import type { Cartoon } from "@/lib/cartoons";
import { formatDateAP } from "@/lib/format";
import { useTagFilter } from "@/lib/useTagFilter";

// The archive's client half: the tag filter (a quiet letterspaced row of
// buttons) and the contact-sheet grid it filters. Hover lifts a panel 2px
// with a soft shadow-as-ink; the folio line at the foot is styled like a
// page number, and at six panels one page is the truth.

export default function ContactSheet({ cartoons }: { cartoons: Cartoon[] }) {
  const { tag, setTag, tags, filtered } = useTagFilter(cartoons);

  return (
    <>
      <nav className="vb-filter" aria-label="Filter panels by subject">
        <span className="vb-filter-label">Filed under</span>
        <button
          type="button"
          className="vb-filter-btn"
          aria-pressed={tag === null}
          onClick={() => setTag(null)}
        >
          All
        </button>
        {tags.map((t) => (
          <button
            key={t}
            type="button"
            className="vb-filter-btn"
            aria-pressed={tag === t}
            onClick={() => setTag(t)}
          >
            {t}
          </button>
        ))}
      </nav>

      {filtered.length === 0 ? (
        <p className="vb-empty-note">Nothing filed under that heading yet. The founder is on it.</p>
      ) : (
        <ul className="vb-sheet">
          {filtered.map((cartoon) => (
            <li key={cartoon.slug}>
              <TransitionLink href={`/cartoon/${cartoon.slug}?from=b`} className="vb-thumb-link">
                <figure
                  className="vb-thumb"
                  style={{ viewTransitionName: `panel-${cartoon.slug}` }}
                >
                  <span className="vb-thumb-frame">
                    <span className="vb-thumb-window">
                      <Image
                        src={cartoon.src}
                        alt={cartoon.alt}
                        width={cartoon.width}
                        height={cartoon.height}
                        sizes="(max-width: 45rem) 45vw, 220px"
                      />
                    </span>
                  </span>
                  <figcaption className="vb-thumb-date vb-caps-tiny">
                    {formatDateAP(cartoon.date)}
                  </figcaption>
                </figure>
              </TransitionLink>
            </li>
          ))}
        </ul>
      )}

      <p className="vb-folio vb-caps-tiny">Page 1 of 1</p>
    </>
  );
}
