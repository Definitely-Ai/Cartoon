import type { Metadata } from "next";
import "./globals.css";

// Absolute URLs for OG tags: Vercel provides the production hostname at
// build time; locally we fall back to localhost so builds stay clean.
const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(productionUrl),
  // The whole site is private now — keep it out of every index.
  robots: { index: false, follow: false },
  title: {
    default: "The Swinging Door", // BRAND: replace when final
    template: "%s · The Swinging Door", // BRAND: replace when final
  },
  description:
    "A single-panel barroom cartoon about politics, markets, and American life — strictly black and white.",
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
        {children}
      </body>
    </html>
  );
}
