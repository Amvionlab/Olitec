import type { NextConfig } from "next";

const mediaBase = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "http://localhost:4000/api/ecommerce/media";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Only product/banner images uploaded through the shop admin can be optimised.
    remotePatterns: [new URL(`${mediaBase.replace(/\/$/, "")}/**`)],
    // The API runs on localhost during development; never allow private addresses in production.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // Private pages are never indexed. Their HTML is a client-rendered shell without personal data; the data
        // itself comes from API responses the backend marks Cache-Control: no-store.
        source: "/:path(account|account/.*|cart|checkout|order/.*|wishlist|login|register|forgot-password|reset-password)",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
