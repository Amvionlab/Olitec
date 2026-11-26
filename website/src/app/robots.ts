import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const disallow = ["/profile", "/warranties$", "/warranties/detail", "/admin", "/login", "/register"];
  const allow = ["/", "/warranties/register"];

  return {
    rules: [
      { userAgent: "GPTBot", allow, disallow },
      { userAgent: "OAI-SearchBot", allow, disallow },
      { userAgent: "ClaudeBot", allow, disallow },
      { userAgent: "PerplexityBot", allow, disallow },
      { userAgent: "Google-Extended", allow, disallow },
      { userAgent: "*", allow, disallow },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
