import type { MetadataRoute } from "next";
import { SITE_URL } from "@/utils/format";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/account", "/cart", "/checkout", "/order/", "/wishlist", "/login", "/register", "/forgot-password", "/reset-password"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
