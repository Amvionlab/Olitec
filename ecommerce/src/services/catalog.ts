/** Server-side catalogue reads for server-rendered pages (cached for 60 s, so admin changes appear within a minute). */
import { ApiError, api, toQuery } from "./api";
import type { Category, Facets, HomeContent, PageMeta, ProductDetail, ProductSummary, PublicSettings } from "@/types";

export interface ListingParams {
  q?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  flag?: string;
  spec?: string[];
  sort?: string;
  page?: number;
  pageSize?: number;
}

export async function getHome(): Promise<HomeContent> {
  return api.get<HomeContent>("/content/home");
}

export async function getSettings(): Promise<PublicSettings> {
  return api.get<PublicSettings>("/content/settings", { revalidate: 300 });
}

export async function getCategories(): Promise<Category[]> {
  return api.get<Category[]>("/categories", { revalidate: 300 });
}

export async function getCategory(slug: string): Promise<Category | null> {
  return notFoundToNull(() => api.get<Category>(`/categories/${encodeURIComponent(slug)}`));
}

export async function listProducts(params: ListingParams): Promise<{ items: ProductSummary[]; meta: PageMeta }> {
  const { data, meta } = await api.page<ProductSummary[]>(`/products${toQuery({ ...params, pageSize: params.pageSize ?? 24 })}`);
  return { items: data, meta };
}

export async function getFacets(params: { q?: string; category?: string }): Promise<Facets> {
  return api.get<Facets>(`/products/facets${toQuery(params)}`);
}

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  return notFoundToNull(() => api.get<ProductDetail>(`/products/${encodeURIComponent(slug)}`));
}

export async function getPage(slug: string) {
  return notFoundToNull(() => api.get<{ slug: string; title: string; body: string; seoTitle: string | null; seoDescription: string | null; updatedAt: string }>(`/pages/${encodeURIComponent(slug)}`));
}

export async function listPages() {
  return api.get<{ slug: string; title: string }[]>("/pages", { revalidate: 300 }).catch(() => []);
}

async function notFoundToNull<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
}
