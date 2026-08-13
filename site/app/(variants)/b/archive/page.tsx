import type { Metadata } from "next";
import { getAllCartoons } from "@/lib/cartoons";
import ContactSheet from "./ContactSheet";

// The archive as a contact sheet: uniform small panels in hairline frames,
// dates in letterspaced small caps, a quiet tag-filter row, and a folio line
// at the foot. The full archive is static in the page; filtering happens
// client-side in <ContactSheet>.

export const metadata: Metadata = {
  title: "The Archive",
  description: "Every panel to date, laid out as a contact sheet and filed by subject.",
};

export default function ArchivePage() {
  const cartoons = getAllCartoons();

  return (
    <main id="content">
      <header className="vb-page-head">
        <h1 className="vb-page-title">The Archive</h1>
        <p className="vb-page-sub vb-caps-tiny">Every panel, in order of publication</p>
      </header>
      <ContactSheet cartoons={cartoons} />
    </main>
  );
}
