
import type { NextConfig } from "next";

const isExport = process.env.NEXT_EXPORT === "true";

const nextConfig: NextConfig = {
  ...(isExport ? { output: "export", trailingSlash: true } : {}),

  images: {
    unoptimized: true,
  },

  reactStrictMode: true,
  poweredByHeader: false,

  ...(isExport
    ? {}
    : {
        async rewrites() {
          return [
            {
              source: "/3d/:path*",
              destination: "/models/:path*",
            },
            {
              source: "/api/:path*",
              destination: "http://127.0.0.1:4000/api/:path*",
            },
          ];
        },
      }),
};

export default nextConfig;
