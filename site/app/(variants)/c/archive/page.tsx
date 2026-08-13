import type { Metadata } from "next";
import { getAllCartoons } from "@/lib/cartoons";
import ArchiveWall from "./ArchiveWall";

// The archive: a wall of dated, thick-bordered panels you scroll through,
// newest first. The server page hands the whole (already static) archive to
// the client wall, which owns the rubber-stamp tag filter.

export const metadata: Metadata = {
  title: "The Archive",
  description:
    "Every strip so far — single-panel barroom cartoons filed by date, with rubber-stamp filters by subject.",
};

export default function ArchivePage() {
  const cartoons = getAllCartoons();

  return (
    <main id="content" className="vc-board">
      <header className="vc-page-head">
        <h1 className="vc-sechead">
          <span>The Archive</span>
        </h1>
        <p className="vc-page-intro">
          Every strip we’ve run, pinned newest first. Use the stamps to file by subject.
        </p>
      </header>
      <ArchiveWall cartoons={cartoons} />
    </main>
  );
}
