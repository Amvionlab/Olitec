import type { Product, ProductCategory } from "@/lib/types";
import { mockProducts } from "@/mock/data";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api").replace(/\/$/, "");

export interface ApiProductItem {
  id: string;
  slug: string;
  name: string;
  model: string;
  category: string;
  warrantyMonths: number;
  priceInr: number;
  description: string;
}

export async function fetchActiveProducts(): Promise<ApiProductItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/products?pageSize=100`, { cache: "no-store" });
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.data)) {
      return data.data;
    }
  } catch (e) {
    console.warn("Failed to fetch products from backend, falling back to local list:", e);
  }
  return mockProducts;
}

export async function getProducts(filter?: { category?: string; q?: string }): Promise<Product[]> {
  try {
    const query = new URLSearchParams();
    if (filter?.category) query.set("category", filter.category);
    if (filter?.q) query.set("q", filter.q);
    query.set("pageSize", "100");

    const res = await fetch(`${API_BASE_URL}/products?${query.toString()}`, { cache: "no-store" });
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.data)) {
      return data.data;
    }
  } catch {
    // fallback
  }

  const q = filter?.q?.trim().toLowerCase();
  return mockProducts.filter((product) => {
    if (filter?.category && product.category !== filter.category) return false;
    if (q && !`${product.name} ${product.model}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${slug}`, { cache: "no-store" });
    const data = await res.json();
    if (res.ok && data.success && data.data) {
      return data.data;
    }
  } catch {
    // fallback
  }
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
