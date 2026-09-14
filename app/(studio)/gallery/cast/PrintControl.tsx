"use client";

import { useState } from "react";

export default function PrintControl({ label }: { label: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function print() {
    if (busy) return;
    setBusy(true);
    setError("");
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        Promise.all([
          document.fonts.ready,
          ...Array.from(document.querySelectorAll<HTMLImageElement>(".cast-print-sheets img")).map(image => image.decode()),
        ]),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("loading")), 15000); }),
      ]);
      window.print();
    } catch {
      setError("The portrait hasn’t finished loading. Please try again or download the PDF.");
    } finally {
      clearTimeout(timer);
      setBusy(false);
    }
  }
  return <div className="cast-print-control"><button className="cast-button" type="button" disabled={busy} onClick={print}>{busy ? "Preparing artwork…" : label}</button>{error && <p role="alert">{error}</p>}</div>;
}
