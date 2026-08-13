"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import TransitionLink from "@/components/TransitionLink";

// All ?from= handling lives here, on the client, inside the page's
// <Suspense> boundary — the server page never reads searchParams, which
// would silently opt the route into dynamic rendering and break the
// all-static build. `staticFallback` renders identical markup without
// touching useSearchParams, so the Suspense fallback causes no layout shift.

const HOMES = {
  a: { href: "/a", label: "Back to the paper" },
  b: { href: "/b", label: "Back to the panel" },
  c: { href: "/c", label: "Back to the funny pages" },
} as const;

type Neighbor = { slug: string; title: string } | null;

function Nav({ newer, older, from }: { newer: Neighbor; older: Neighbor; from: string | null }) {
  const known = from === "a" || from === "b" || from === "c" ? from : null;
  const home = known ? HOMES[known] : { href: "/", label: "Back to the front page" };
  const suffix = known ? `?from=${known}` : "";

  return (
    <nav className="permalink-nav" aria-label="Edition navigation">
      <div className="permalink-adjacent">
        {older ? (
          <TransitionLink href={`/cartoon/${older.slug}${suffix}`} className="permalink-prev">
            <span aria-hidden="true">‹ </span>Previous edition<span className="permalink-nav-title">{older.title}</span>
          </TransitionLink>
        ) : (
          <span className="permalink-end">This is the first edition.</span>
        )}
        {newer ? (
          <TransitionLink href={`/cartoon/${newer.slug}${suffix}`} className="permalink-next">
            Next edition<span aria-hidden="true"> ›</span><span className="permalink-nav-title">{newer.title}</span>
          </TransitionLink>
        ) : (
          <span className="permalink-end">This is the latest edition.</span>
        )}
      </div>
      <p className="permalink-back">
        <Link href={home.href}>{home.label}</Link>
      </p>
    </nav>
  );
}

export default function PermalinkNav(props: { newer: Neighbor; older: Neighbor; staticFallback?: boolean }) {
  if (props.staticFallback) {
    return <Nav newer={props.newer} older={props.older} from={null} />;
  }
  return <NavWithParams {...props} />;
}

function NavWithParams({ newer, older }: { newer: Neighbor; older: Neighbor }) {
  const from = useSearchParams().get("from");
  return <Nav newer={newer} older={older} from={from} />;
}
