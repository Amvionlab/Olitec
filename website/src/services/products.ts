
import type { Product, ProductCategory } from "@/lib/types";
import { mockProducts } from "@/mock/data";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"
).replace(/\/$/, "");

export interface ApiProductItem {
  id: string;
  slug: string;
  name: string;
  model: string;
  category: ProductCategory;
  warrantyMonths: number;
  priceInr: number;
  description: string;
  shortDescription?: string;
  features?: string[];
  specs?: {
    label: string;
    value: string;
  }[];
  imageUrl?: string | null;
  capacity?: string;
  isActive?: boolean;
}

function normalizeProduct(item: ApiProductItem): Product {
  return {
    ...item,
    shortDescription: item.shortDescription || item.description || "",
    description: item.description || "",
    features: item.features ?? [],
    specs: item.specs ?? [],
  };
}

export async function fetchActiveProducts(): Promise<ApiProductItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/products?pageSize=100`, {
      cache: "no-store",
    });

    const data = await res.json();

    if (res.ok && data.success && Array.isArray(data.data)) {
      return data.data.map(normalizeProduct);
    }
  } catch (error) {
    console.warn(
      "Failed to fetch products from backend, falling back to local list:",
      error
    );
  }

  return mockProducts;
}

export async function getProducts(
  filter?: { category?: string; q?: string }
): Promise<Product[]> {
  try {
    const query = new URLSearchParams();

    if (filter?.category) query.set("category", filter.category);
    if (filter?.q) query.set("q", filter.q);

    query.set("pageSize", "100");

    const res = await fetch(
      `${API_BASE_URL}/products?${query.toString()}`,
      { cache: "no-store" }
    );

    const data = await res.json();

    if (res.ok && data.success && Array.isArray(data.data)) {
      return data.data.map(normalizeProduct);
    }
  } catch (error) {
    console.error("Failed to fetch products:", error);
  }

  const q = filter?.q?.trim().toLowerCase();

  return mockProducts.filter((product) => {
    if (filter?.category && product.category !== filter.category) {
      return false;
    }

    if (
      q &&
      !`${product.name} ${product.model}`.toLowerCase().includes(q)
    ) {
      return false;
    }

    return true;
  });
}

export interface ServiceProductOption {
  id: string;
  name: string;
  model: string;
  isActive?: boolean;
}

export async function getActiveProductModels(): Promise<
  ServiceProductOption[]
> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/products?pageSize=100`,
      { cache: "no-store" }
    );

    const data = await res.json();

    if (!res.ok || !data.success || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.filter(
      (product: ServiceProductOption) =>
        Boolean(product.model?.trim())
    );
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
}

export async function getProductBySlug(
  slug: string
): Promise<Product | undefined> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/products/${slug}`,
      { cache: "no-store" }
    );

    const data = await res.json();

    if (res.ok && data.success && data.data) {
      return normalizeProduct(data.data);
    }
  } catch (error) {
    console.error("Failed to fetch product by slug:", error);
  }

  return mockProducts.find((product) => product.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return mockProducts.find((product) => product.id === id);
}

export function getProductCategories(): ProductCategory[] {
  return Array.from(
    new Set(mockProducts.map((product) => product.category))
  );
}

/** Synchronous list for client-side form dropdowns. */
export function getProductOptions(): Pick<
  Product,
  "id" | "name" | "model"
>[] {
  return mockProducts.map(({ id, name, model }) => ({
    id,
    name,
    model,
  }));
}
