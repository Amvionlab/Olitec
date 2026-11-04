import type { MetadataRoute } from "next";
import { getProducts } from "@/services/products";
import { siteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  const staticRoutes = [
    "",
    "/leadership",
    "/products",
    "/applications",
    "/downloads",
    "/warranties/register",
    "/warranty-status",
    "/service-request",
    "/channel-partners",
    "/homes-and-businesses",
    "/careers",
    "/support",
    "/register",
    "/login",
  ];
  return [
    ...staticRoutes.map((route) => ({ url: `${siteConfig.url}${route}`, changeFrequency: "weekly" as const, priority: route ? 0.7 : 1 })),
    ...products.map((product) => ({
      url: `${siteConfig.url}/products/${product.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
