import type { MetadataRoute } from "next";
import { api } from "@/services/api";
import { getCategories, listPages } from "@/services/catalog";
import type { Category } from "@/types";
import { SITE_URL } from "@/utils/format";

export const revalidate = 3600;

/** Public pages only — account, cart and checkout are never listed. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, pages] = await Promise.all([
    api.get<{ slug: string; updated_at: string }[]>("/products/sitemap", { revalidate: 3600 }).catch(() => []),
    getCategories().catch(() => [] as Category[]),
    listPages(),
  ]);
  const flatten = (list: Category[]): Category[] => list.flatMap((category) => [category, ...flatten(category.children)]);
  const staticPaths = ["", "/products", "/categories", "/bulk-purchase", "/contact", "/faqs", "/track-order"];
  return [
    ...staticPaths.map((path) => ({ url: `${SITE_URL}${path}`, changeFrequency: "daily" as const, priority: path === "" ? 1 : 0.6 })),
    ...flatten(categories).map((category) => ({ url: `${SITE_URL}/categories/${category.slug}`, changeFrequency: "daily" as const, priority: 0.7 })),
    ...products.map((product) => ({ url: `${SITE_URL}/products/${product.slug}`, lastModified: new Date(product.updated_at), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...pages.map((page) => ({ url: `${SITE_URL}/policies/${page.slug}`, changeFrequency: "monthly" as const, priority: 0.3 })),
  ];
}
