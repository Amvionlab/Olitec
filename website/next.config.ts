
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    agentUpgrade: "security",
  },
};

export default nextConfig;
