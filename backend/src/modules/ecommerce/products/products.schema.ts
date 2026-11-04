import { paginationProperties, slugSchema, urlOrEmpty } from "../shared/schemas.js";

export const productSorts = ["relevance", "price_asc", "price_desc", "newest", "popularity", "rating"] as const;
export const productFlags = ["featured", "best_seller", "new_arrival", "on_offer"] as const;
export const productStatuses = ["draft", "active", "inactive", "archived"] as const;

export const listProductsSchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      q: { type: "string", maxLength: 100 },
      category: { type: "string", maxLength: 160 },
      brand: { type: "string", maxLength: 500, description: "Comma-separated brand slugs" },
      minPrice: { type: "number", minimum: 0 },
      maxPrice: { type: "number", minimum: 0 },
      inStock: { type: "boolean" },
      flag: { type: "string", enum: productFlags },
      spec: { type: "array", items: { type: "string", maxLength: 200 }, maxItems: 10, description: "Label:Value pairs" },
      ids: { type: "string", maxLength: 500, description: "Comma-separated product ids (recently viewed)" },
      sort: { type: "string", enum: productSorts, default: "relevance" },
      ...paginationProperties,
    },
  },
} as const;

export interface ListProductsQuery {
  q?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  flag?: (typeof productFlags)[number];
  spec?: string[];
  ids?: string;
  sort?: (typeof productSorts)[number];
  page?: number;
  pageSize?: number;
}

export const slugParamsSchema = {
  params: { type: "object", required: ["slug"], properties: { slug: slugSchema } },
} as const;

export interface SlugParams {
  slug: string;
}

const specification = {
  type: "object",
  additionalProperties: false,
  required: ["label", "value"],
  properties: { label: { type: "string", minLength: 1, maxLength: 80 }, value: { type: "string", minLength: 1, maxLength: 200 } },
} as const;

const image = {
  type: "object",
  additionalProperties: false,
  required: ["url"],
  properties: { url: { type: "string", minLength: 1, maxLength: 512, pattern: "^(https://|http://localhost|/)" }, alt: { type: "string", maxLength: 200 } },
} as const;

const productBodyProperties = {
  sku: { type: "string", pattern: "^[A-Za-z0-9][A-Za-z0-9._-]{1,63}$" },
  slug: slugSchema,
  name: { type: "string", minLength: 2, maxLength: 200 },
  categoryId: { type: "integer", minimum: 1 },
  brandId: { anyOf: [{ type: "integer", minimum: 1 }, { type: "null" }] },
  variantOfId: { anyOf: [{ type: "integer", minimum: 1 }, { type: "null" }] },
  attributes: { type: "object", maxProperties: 10, additionalProperties: { type: "string", maxLength: 100 } },
  shortDescription: { type: "string", maxLength: 500 },
  description: { type: "string", maxLength: 20000 },
  features: { type: "array", maxItems: 30, items: { type: "string", minLength: 1, maxLength: 300 } },
  specifications: { type: "array", maxItems: 60, items: specification },
  mrp: { type: "number", exclusiveMinimum: 0, maximum: 99_999_999 },
  sellingPrice: { type: "number", exclusiveMinimum: 0, maximum: 99_999_999 },
  taxRate: { type: "number", minimum: 0, maximum: 40 },
  hsnCode: { type: "string", maxLength: 16 },
  warrantyInfo: { type: "string", maxLength: 500 },
  deliveryInfo: { type: "string", maxLength: 500 },
  lowStockThreshold: { type: "integer", minimum: 0, maximum: 100000 },
  maxOrderQty: { type: "integer", minimum: 1, maximum: 10000 },
  isFeatured: { type: "boolean" },
  isBestSeller: { type: "boolean" },
  isNewArrival: { type: "boolean" },
  isOnOffer: { type: "boolean" },
  status: { type: "string", enum: productStatuses },
  seoTitle: { type: "string", maxLength: 160 },
  seoDescription: { type: "string", maxLength: 320 },
  images: { type: "array", maxItems: 12, items: image },
} as const;

export const createProductSchema = {
  body: {
    type: "object",
    additionalProperties: false,
    required: ["sku", "name", "categoryId", "mrp", "sellingPrice"],
    properties: { ...productBodyProperties, initialStock: { type: "integer", minimum: 0, maximum: 1_000_000 } },
  },
} as const;

export const updateProductSchema = {
  body: { type: "object", additionalProperties: false, minProperties: 1, properties: productBodyProperties },
} as const;

export interface ProductInput {
  sku: string;
  slug?: string;
  name: string;
  categoryId: number;
  brandId?: number | null;
  variantOfId?: number | null;
  attributes?: Record<string, string>;
  shortDescription?: string;
  description?: string;
  features?: string[];
  specifications?: { label: string; value: string }[];
  mrp: number;
  sellingPrice: number;
  taxRate?: number;
  hsnCode?: string;
  warrantyInfo?: string;
  deliveryInfo?: string;
  lowStockThreshold?: number;
  maxOrderQty?: number;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isOnOffer?: boolean;
  status?: (typeof productStatuses)[number];
  seoTitle?: string;
  seoDescription?: string;
  images?: { url: string; alt?: string }[];
  initialStock?: number;
}

export const adminListProductsSchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      q: { type: "string", maxLength: 100 },
      status: { type: "string", enum: productStatuses },
      categoryId: { type: "integer", minimum: 1 },
      stock: { type: "string", enum: ["low", "out", "in"] },
      sort: { type: "string", enum: ["newest", "name", "price_asc", "price_desc", "stock_asc"], default: "newest" },
      ...paginationProperties,
    },
  },
} as const;

export interface AdminListProductsQuery {
  q?: string;
  status?: (typeof productStatuses)[number];
  categoryId?: number;
  stock?: "low" | "out" | "in";
  sort?: "newest" | "name" | "price_asc" | "price_desc" | "stock_asc";
  page?: number;
  pageSize?: number;
}

export const brandBodySchema = {
  body: {
    type: "object",
    additionalProperties: false,
    required: ["name"],
    properties: { name: { type: "string", minLength: 1, maxLength: 100 }, slug: slugSchema, isActive: { type: "boolean" } },
  },
} as const;

export const reviewBodySchema = {
  body: {
    type: "object",
    additionalProperties: false,
    required: ["rating"],
    properties: {
      rating: { type: "integer", minimum: 1, maximum: 5 },
      title: { type: "string", maxLength: 120 },
      body: { type: "string", maxLength: 2000 },
    },
  },
} as const;

export { urlOrEmpty };
