import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep chromium unbundled so it finds its own bin/ folder at runtime
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  // The .br binaries are not imported anywhere, so file tracing misses them
  outputFileTracingIncludes: {
    "/api/scrape": ["./node_modules/@sparticuz/chromium/bin/**"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "eu.store.bambulab.com",
      },
      {
        protocol: "https",
        hostname: "store.bblcdn.eu",
      },
      {
        protocol: "https",
        hostname: "makerworld.bblmw.com",
      },
    ],
  },
};

export default nextConfig;
