import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The artwork is committed B&W PNG served from /public — the on-demand
  // image optimizer would only add moving parts (and a first-hit resize
  // delay) for images that are already the size we drew them. Every
  // <Image> gets explicit width/height, so layout never shifts.
  images: { unoptimized: true },
};

export default nextConfig;
