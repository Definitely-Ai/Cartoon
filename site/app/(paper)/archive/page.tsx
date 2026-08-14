import type { Metadata } from "next";
import { getAllCartoons } from "@/lib/cartoons";
import MorgueClassifieds from "./MorgueClassifieds";

// The archive, done as the paper's morgue: a classified section with
// ruled columns, a section index for filing tags, and one listing per
// edition. The archive itself is static; only the index filter is a
// client component.

export const metadata: Metadata = {
  title: "The Morgue",
  description: "Every edition we've ever printed, filed by date and subject.",
};

export default function ArchivePage() {
  const cartoons = getAllCartoons();

  return (
    <main id="content" className="va-shell">
      <header className="va-page-head">
        <p className="va-eyebrow">Classified Section</p>
        <h1 className="va-page-title va-ink-spread">The Morgue</h1>
        <p className="va-standfirst">Every edition we&rsquo;ve ever printed.</p>
      </header>
      <MorgueClassifieds cartoons={cartoons} />
    </main>
  );
}
