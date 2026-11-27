
import type { NextConfig } from "next";

const isExport = process.env.NEXT_EXPORT === "true";

const nextConfig: NextConfig = {
  ...(isExport ? { output: "export", trailingSlash: true } : {}),

  images: {
    unoptimized: true,
  },

  reactStrictMode: true,

  // Search, social, AI crawlers (Item M17) and PageSpeed/Lighthouse get the page's title and
  // description in <head> straight away instead of streamed later (dynamic product pages).
  htmlLimitedBots:
    /Googlebot|Google-|AdsBot|Mediapartners|bingbot|Bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|Applebot|Twitterbot|Slackbot|facebookexternalhit|LinkedInBot|WhatsApp|GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-User|PerplexityBot|Lighthouse/i,

  // Lets a local production copy be built next to a running dev server (perf testing).
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
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
