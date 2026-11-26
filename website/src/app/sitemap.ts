import type { MetadataRoute } from "next";
import { getProducts } from "@/services/products";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  const baseUrl = siteConfig.url.replace(/\/$/, "");
  const staticRoutes = [
    "",
    "/leadership",
    "/products",
    "/applications",
    "/downloads",
    "/media",
    "/warranties/register",
    "/warranty-status",
    "/service-request",
    "/channel-partners",
    "/homes-and-businesses",
    "/careers",
  ];
  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      changeFrequency: "weekly" as const,
      priority: route ? 0.8 : 1,
    })),
    ...products.map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
  ];
}
