import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdjacent, getAllCartoons, getBySlug } from "@/lib/cartoons";
import { formatDateLong } from "@/lib/format";
import { newsSerif } from "@/app/fonts";
import TransitionLink from "@/components/TransitionLink";
import "./permalink.css";

// The permanent address of one cartoon: a clean print frame (black on
// white, generous margins) with prev/next edition navigation and the way
// back to the front page. Fully static; Ctrl+P produces the corkboard
// artifact this audience actually makes.

export function generateStaticParams() {
  return getAllCartoons().map(({ slug }) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cartoon = getBySlug(slug);
  if (!cartoon) return {};
  return {
    title: cartoon.title,
    description: cartoon.caption,
  };
}

export default async function CartoonPermalink({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cartoon = getBySlug(slug);
  if (!cartoon) notFound();
  const { newer, older } = getAdjacent(slug);

  return (
    <div className={`permalink ${newsSerif.variable}`}>
      <header className="permalink-masthead">
        {/* BRAND: replace when final */}
        <p className="permalink-brand">The Swinging Door</p>
        <p className="permalink-tagline">A single-panel barroom cartoon — politics, markets, and American life</p>
      </header>

      <main id="content">
        <article className="permalink-plate">
          <h1 className="permalink-title">{cartoon.title}</h1>
          <p className="permalink-dateline">
            {formatDateLong(cartoon.date)} · Edition No.&nbsp;{cartoon.edition}
          </p>
          <figure
            className="permalink-figure"
            // Same per-slug name as the archive thumbnail that was clicked,
            // so the panel itself morphs small → large.
            style={{ viewTransitionName: `panel-${cartoon.slug}` }}
          >
            <Image
              src={cartoon.src}
              alt={cartoon.alt}
              width={cartoon.width}
              height={cartoon.height}
              priority
              className="permalink-image"
            />
            <figcaption className="permalink-caption">{cartoon.caption}</figcaption>
          </figure>
          {cartoon.tags.length > 0 && (
            <p className="permalink-tags">
              Filed under: {cartoon.tags.join(", ")}
            </p>
          )}
        </article>

        <nav className="permalink-nav" aria-label="Edition navigation">
          <div className="permalink-adjacent">
            {older ? (
              <TransitionLink href={`/cartoon/${older.slug}`} className="permalink-prev">
                <span aria-hidden="true">‹ </span>Previous edition
                <span className="permalink-nav-title">{older.title}</span>
              </TransitionLink>
            ) : (
              <span className="permalink-end">This is the first edition.</span>
            )}
            {newer ? (
              <TransitionLink href={`/cartoon/${newer.slug}`} className="permalink-next">
                Next edition<span aria-hidden="true"> ›</span>
                <span className="permalink-nav-title">{newer.title}</span>
              </TransitionLink>
            ) : (
              <span className="permalink-end">This is the latest edition.</span>
            )}
          </div>
          <p className="permalink-back">
            <Link href="/">Back to the front page</Link>
          </p>
        </nav>
      </main>

      <footer className="permalink-footer">
        {/* BRAND: replace when final */}
        <p>© {new Date().getFullYear()} The Swinging Door · All characters and cartoons are property of the company.</p>
        <p className="permalink-desk">Published from the desk of the founder</p>
        <p className="permalink-credit">
          Site built by <a href="https://aidreambuilders.com">aidreambuilders.com</a>
        </p>
      </footer>
    </div>
  );
}
