"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The nav has to answer "where am I?" as well as "where can I go?". Without
// a marked link, six identical words in a row leave him counting pages to
// work out which one he is looking at — and a day page or a bible page looked
// like nowhere at all, since neither address is in the list. The marked link
// carries a thicker underline as well as full-strength ink, so the answer
// survives a bad screen or colour-blind eyes.

export type Place = {
  href: string;
  label: string;
  /** Addresses that belong to this place without being it — /day/… is the
   *  Collection, a character's pages are the Cast. */
  under?: string[];
};

function isHere(pathname: string, place: Place): boolean {
  const roots = [place.href, ...(place.under ?? [])];
  return roots.some((root) =>
    root === "/" ? pathname === "/" : pathname === root || pathname.startsWith(`${root}/`)
  );
}

export default function StudioNav({
  places,
  className,
  label,
  children,
}: {
  places: Place[];
  className: string;
  label: string;
  children?: React.ReactNode;
}) {
  const pathname = usePathname() ?? "/";

  return (
    <nav className={className} aria-label={label}>
      {places.map((place) => {
        const here = isHere(pathname, place);
        return (
          <Link key={place.href} href={place.href} aria-current={here ? "page" : undefined}>
            {place.label}
          </Link>
        );
      })}
      {children}
    </nav>
  );
}
