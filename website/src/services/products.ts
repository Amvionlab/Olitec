// Phase 1: reads mock data. Phase 2: replace with GET /api/products and GET /api/products/:slug.
import type { Product, ProductCategory } from "@/lib/types";
import { mockProducts } from "@/mock/data";

export async function getProducts(filter?: { category?: string; q?: string }): Promise<Product[]> {
  const q = filter?.q?.trim().toLowerCase();
  return mockProducts.filter((product) => {
    if (filter?.category && product.category !== filter.category) return false;
    if (q && !`${product.name} ${product.model}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return mockProducts.find((product) => product.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return mockProducts.find((product) => product.id === id);
}

export function getProductCategories(): ProductCategory[] {
  return Array.from(new Set(mockProducts.map((product) => product.category)));
}

/** Synchronous list for client-side form dropdowns. */
export function getProductOptions(): Pick<Product, "id" | "name" | "model">[] {
  return mockProducts.map(({ id, name, model }) => ({ id, name, model }));
}
