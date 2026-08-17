"use client";

import { useRef, useState } from "react";

// One-tap copy for the connector address — with a fallback selection hint
// for browsers that refuse the clipboard API.

export default function CopyButton({ value, label = "Copy the address" }: { value: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2500);
  }

  return (
    <p className="br-copy-row">
      <button type="button" className="br-copy-btn" onClick={copy}>
        {state === "copied" ? "Copied" : label}
      </button>
      {state === "failed" && (
        <span className="br-copy-hint">Copying was blocked — select the text and copy it by hand.</span>
      )}
    </p>
  );
}
