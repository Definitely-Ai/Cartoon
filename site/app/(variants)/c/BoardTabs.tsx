"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The section tabs standing on the masthead rule. Client-side only so the
// current tab can be inked in (aria-current + inverted chip); plain <Link>
// throughout — TransitionLink is reserved for permalink and prev/next flows.

const TABS = [
  { href: "/c", label: "Today’s Strip" },
  { href: "/c/archive", label: "Archive" },
  { href: "/c/characters", label: "The Cast" },
  { href: "/c/about", label: "About" },
  // The way back to the chooser — every variant carries one.
  { href: "/", label: "All Editions" },
];

export default function BoardTabs() {
  const pathname = usePathname();

  return (
    <nav className="vc-tabs" aria-label="Sections">
      <ul>
        {TABS.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={active ? "vc-tab-link is-active" : "vc-tab-link"}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
