"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ComponentProps, type MouseEvent } from "react";

// Invisible utility, shared by all variants. Wraps next/link so same-tab
// left-clicks navigate inside document.startViewTransition when the browser
// supports it AND the user allows motion. Used for exactly the two flows
// the design calls for — archive/teaser thumbnail → permalink (the panel
// morphs, via per-slug view-transition-names on the <figure>), and
// prev/next edition (a quick cross-fade that reads as a page turn).
// Everywhere else uses plain <Link>. Unsupported browsers and
// prefers-reduced-motion fall straight through to a normal navigation.

type DocumentWithViewTransition = Document & {
  startViewTransition?: (update: () => Promise<void> | void) => unknown;
};

// The view transition's DOM-update promise must resolve only after the new
// route has committed, or the "new" snapshot is taken too early. The
// completer below (mounted once in the root layout) resolves it when the
// pathname actually changes.
let pendingNavigation: (() => void) | null = null;

export function ViewTransitionCompleter() {
  const pathname = usePathname();
  useEffect(() => {
    pendingNavigation?.();
    pendingNavigation = null;
  }, [pathname]);
  return null;
}

export default function TransitionLink({ onClick, ...rest }: ComponentProps<typeof Link>) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (rest.target && rest.target !== "_self") return;

    const doc = document as DocumentWithViewTransition;
    if (!doc.startViewTransition) return; // no-op cleanly: plain navigation
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    event.preventDefault();
    const href = typeof rest.href === "string" ? rest.href : String(rest.href);
    doc.startViewTransition(
      () =>
        new Promise<void>((resolve) => {
          pendingNavigation = resolve;
          router.push(href);
        })
    );
  }

  return <Link {...rest} onClick={handleClick} />;
}
