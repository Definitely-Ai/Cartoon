"use client";

import Image from "next/image";
import type { Cartoon } from "@/lib/cartoons";
import TransitionLink from "@/components/TransitionLink";
import { formatDateAP } from "@/lib/format";
import { useTagFilter } from "@/lib/useTagFilter";

// The morgue's classified columns plus the section index (the tag
// filter). Receives the full, already-validated archive from the
// server page; filtering happens entirely client-side. Each listing
// carries a small printed "cut" of the panel whose <figure> holds the
// per-slug view-transition-name, so clicking through morphs the plate
// up into the permalink page.

export default function MorgueClassifieds({ cartoons }: { cartoons: Cartoon[] }) {
  const { tag, setTag, tags, filtered } = useTagFilter(cartoons);

  const countFor = (t: string) => cartoons.filter((cartoon) => cartoon.tags.includes(t)).length;

  return (
    <>
      <nav className="va-index va-onum" aria-label="Section index">
        <span className="va-index-label">Index of subjects</span>
        <button type="button" aria-pressed={tag === null} onClick={() => setTag(null)}>
          All listings ({cartoons.length})
        </button>
        {tags.map((t) => (
          <button key={t} type="button" aria-pressed={tag === t} onClick={() => setTag(t)}>
            {t} ({countFor(t)})
          </button>
        ))}
      </nav>

      <p className="va-index-status va-onum" role="status">
        Showing {filtered.length} of {cartoons.length} listings
        {tag ? <> filed under &ldquo;{tag}&rdquo;</> : null}.
      </p>

      <ul className="va-classifieds">
        {filtered.map((cartoon) => (
          <li key={cartoon.slug} className="va-listing">
            <TransitionLink href={`/cartoon/${cartoon.slug}?from=a`} className="va-listing-link">
              <span className="va-listing-date va-onum">
                {formatDateAP(cartoon.date)} · No. {cartoon.edition}
              </span>
              <span className="va-listing-title">{cartoon.title}</span>
              <figure className="va-listing-fig" style={{ viewTransitionName: `panel-${cartoon.slug}` }}>
                <Image
                  src={cartoon.src}
                  alt={cartoon.alt}
                  width={cartoon.width}
                  height={cartoon.height}
                  className="va-img va-cut"
                />
                <figcaption className="va-listing-caption">{cartoon.caption}</figcaption>
              </figure>
              {cartoon.tags.length > 0 && (
                <span className="va-listing-tags">{cartoon.tags.join(" · ")}</span>
              )}
            </TransitionLink>
          </li>
        ))}
      </ul>
    </>
  );
}
