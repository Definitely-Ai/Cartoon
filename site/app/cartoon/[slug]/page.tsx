import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAdjacent, getAllCartoons, getBySlug } from "@/lib/cartoons";
import { formatDateLong } from "@/lib/format";
import { newsSerif } from "@/app/fonts";
import PermalinkNav from "./PermalinkNav";
import "./permalink.css";

// The permanent address of one cartoon, framed print-neutral (black on
// white, generous margins) so a single permalink page serves visitors from
// all three variants. The variant the reader came from arrives as ?from=a|b|c,
// which is read ONLY in the client-side <PermalinkNav> — the server page
// never touches searchParams, keeping every permalink fully static.

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

  const pick = (c?: { slug: string; title: string }) => (c ? { slug: c.slug, title: c.title } : null);

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
            // Per-slug name: the archive thumbnail that was clicked carries
            // the same name, so the panel itself morphs small → large.
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

        <Suspense fallback={<PermalinkNav newer={pick(newer)} older={pick(older)} staticFallback />}>
          <PermalinkNav newer={pick(newer)} older={pick(older)} />
        </Suspense>
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
