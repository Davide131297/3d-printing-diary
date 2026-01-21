import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ],
  },
};

export default nextConfig;
