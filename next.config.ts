import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The artwork is committed B&W PNG served from /public — the on-demand
  // image optimizer would only add moving parts (and a first-hit resize
  // delay) for images that are already the size we drew them. Every
  // <Image> gets explicit width/height, so layout never shifts.
  images: { unoptimized: true },

  // The old /backroom addresses keep working — the studio simply moved to
  // the front of the house when the whole site went private.
  async redirects() {
    return [
      { source: "/backroom", destination: "/", permanent: false },
      { source: "/backroom/login", destination: "/login", permanent: false },
      { source: "/backroom/ledger", destination: "/collection", permanent: false },
      { source: "/backroom/connect", destination: "/connect", permanent: false },
      { source: "/backroom/day/:day", destination: "/day/:day", permanent: false },
    ];
  },
};

export default nextConfig;
