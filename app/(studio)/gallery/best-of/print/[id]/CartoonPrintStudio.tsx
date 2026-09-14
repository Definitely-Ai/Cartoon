"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, type CSSProperties } from "react";
import { PRINT_SIZES, PRINT_PAPERS, printMetrics, type PrintSizeId, type PrintPaperId } from "@/lib/cartoon-print";
type Cartoon = { id: string; title: string; src: string; width: number; height: number; sha256: string; cityLabel?: string };

export default function CartoonPrintStudio({ cartoon }: { cartoon: Cartoon }) {
  const [size, setSize] = useState<PrintSizeId>("fine");
  const [paper, setPaper] = useState<PrintPaperId>("letter");
  const [busy, setBusy] = useState<"pdf" | "print" | null>(null);
  const [error, setError] = useState("");
  const imageRef = useRef<HTMLImageElement>(null);
  const m = printMetrics(cartoon.width, cartoon.height, size, paper);
  const variables = { "--paper-width": `${m.paper.width}in`, "--paper-height": `${m.paper.height}in`, "--paper-aspect": `${m.paper.width} / ${m.paper.height}`, "--art-preview-width": `${m.width / m.paper.width * 100}%`, "--art-width": `${m.width}in`, "--art-height": `${m.height}in` } as CSSProperties;
  async function downloadPDF() {
    if (busy) return;
    setBusy("pdf"); setError("");
    try {
      const response = await fetch(cartoon.src, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error("Image unavailable");
      const bytes = new Uint8Array(await response.arrayBuffer());
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
      if (hash !== cartoon.sha256) throw new Error("Image changed");
      const { cartoonPrintPDF } = await import("@/lib/cartoon-print-pdf");
      const result = await cartoonPrintPDF(bytes, cartoon.title, cartoon.width, cartoon.height, size, paper);
      const blob = new Blob([new Uint8Array(result)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = `swinging-door-${cartoon.id}-${size}-${paper}.pdf`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      setError("The print PDF could not be prepared. Please retry, or download the original PNG below.");
    } finally { setBusy(null); }
  }
  async function print() {
    if (busy) return;
    setBusy("print"); setError("");
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!imageRef.current) throw new Error("Image missing");
      await Promise.race([Promise.all([imageRef.current.decode(), document.fonts.ready]), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("loading")), 15000); })]);
      window.print();
    } catch { setError("The artwork is not ready to print. Please retry or download the PDF."); }
    finally { clearTimeout(timer); setBusy(null); }
  }
  return <main id="content" className="cartoon-print-studio" style={variables}>
    <style>{`@page { size: ${paper === "letter" ? "8.5in 11in" : "210mm 297mm"}; margin: 0; }`}</style>
    <header className="cartoon-print-toolbar">
      <Link href="/gallery/best-of">← Back to cartoons</Link>
      <p className="print-kicker">The Swinging Door / Print studio</p>
      <h1>{cartoon.title}</h1>
      {cartoon.cityLabel ? <p>{cartoon.cityLabel}</p> : null}
      <div className="cartoon-print-options">
        <label>Artwork size<select value={size} disabled={busy !== null} onChange={e => setSize(e.target.value as PrintSizeId)}>{PRINT_SIZES.map(s => <option key={s.id} value={s.id}>{s.width} × {s.height} in — {s.label}</option>)}</select></label>
        <label>Paper<select value={paper} disabled={busy !== null} onChange={e => setPaper(e.target.value as PrintPaperId)}>{PRINT_PAPERS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
      </div>
      <p className={`print-resolution ${m.ppi < 240 ? "print-resolution-caution" : ""}`} role="status" aria-live="polite"><strong>{m.ppi} PPI at this size</strong> · {cartoon.width} × {cartoon.height} source pixels<br />{m.ppi >= 300 ? "Recommended starting point for fine detail." : m.ppi >= 240 ? "Good everyday print size; proof fine linework before publication." : "Enlarged review print. Fine feathers, fur and lettering will look softer."}</p>
      <div className="cartoon-print-buttons"><button onClick={downloadPDF} disabled={busy !== null}>{busy === "pdf" ? "Preparing PDF…" : "Download exact-size PDF"}</button><button onClick={print} disabled={busy !== null}>{busy === "print" ? "Preparing print…" : "Print this cartoon"}</button><a href={cartoon.src} download>Original PNG</a></div>
      {error ? <p role="alert" className="print-error">{error}</p> : null}
      <p className="print-instructions">Print at <strong>Actual size / 100%</strong>, portrait, on the selected paper. Turn browser headers and footers off. “Fit to page” changes the artwork size and its effective PPI. The PDF is the most predictable option.</p>
      <details className="print-explainer"><summary>What PPI and DPI mean for this artwork</summary><p>PPI is the number of image pixels printed per inch. Printer DPI describes the printer’s ink dots; changing a file’s DPI label does not create new detail. These exports retain the original pixels, aspect ratio and full caption without cropping or AI upscaling.</p><p>A 1024-pixel-wide image provides about 300 PPI at 3.4 inches wide, 256 PPI at 4 inches, 205 PPI at 5 inches and 171 PPI at 6 inches. Your newspaper or print shop may require different specifications; request a physical proof before a press run.</p><a href="https://helpx.adobe.com/photoshop/desktop/crop-resize-transform/resize-adjust-resolution/set-image-size-and-resolution.html" target="_blank" rel="noopener noreferrer">Adobe’s guide to image size and resolution ↗</a></details>
    </header>
    <div className="cartoon-paper-scroll"><div className="cartoon-print-paper" aria-label={`${m.paper.label} preview; artwork ${m.width} by ${m.height} inches`}><Image ref={imageRef} className="cartoon-print-image" src={cartoon.src} alt={`Full ${cartoon.title} cartoon, including the caption`} width={cartoon.width} height={cartoon.height} unoptimized priority /></div></div>
  </main>;
}
