import type { Metadata } from "next";
import { ViewTransitionCompleter } from "@/components/TransitionLink";
import "./globals.css";

// Absolute URLs for OG tags: Vercel provides the production hostname at
// build time; locally we fall back to localhost so builds stay clean.
const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(productionUrl),
  title: {
    default: "Flamingo & Dog", // BRAND: replace when final
    template: "%s · Flamingo & Dog", // BRAND: replace when final
  },
  description: "Single-panel business cartoons, strictly black and white.",
  openGraph: {
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <ViewTransitionCompleter />
        {children}
      </body>
    </html>
  );
}
