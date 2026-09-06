"use client";

import Image from "next/image";
import { useState } from "react";

export default function ReportPreview({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="report-preview-unavailable">Preview unavailable.<br />Open the saved original.</span>;
  // The sources are already resized. A direct browser request also preserves
  // the sign-in cookie needed by the historical-image route.
  return <Image src={src} alt={alt} fill unoptimized sizes="(max-width: 800px) 45vw, 23vw" onError={() => setFailed(true)} style={{ objectFit: "contain", padding: 10 }} />;
}
