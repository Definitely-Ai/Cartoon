"use client";

import { useMemo, useState } from "react";

// Invisible utility: headless tag-filter state for archive pages. Each
// variant renders its own controls (classified links, small caps, rubber
// stamps); this hook only owns the logic, so sharing it doesn't share any
// look. Client-side filtering is fine at this scale — the whole archive is
// already statically in the page.
export function useTagFilter<T extends { tags: string[] }>(items: T[]) {
  const [tag, setTag] = useState<string | null>(null);

  const tags = useMemo(
    () => Array.from(new Set(items.flatMap((item) => item.tags))).sort(),
    [items]
  );

  const filtered = useMemo(
    () => (tag ? items.filter((item) => item.tags.includes(tag)) : items),
    [items, tag]
  );

  return { tag, setTag, tags, filtered };
}
