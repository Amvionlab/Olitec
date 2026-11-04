import { paginationProperties } from "./common.schema.js";

export const listProductsSchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      category: { type: "string", maxLength: 50 },
      q: { type: "string", maxLength: 100 },
      ...paginationProperties,
    },
  },
} as const;

export interface ListProductsQuery {
  category?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export const productSlugSchema = {
  params: {
    type: "object",
    required: ["slug"],
    properties: { slug: { type: "string", pattern: "^[a-z0-9-]{3,120}$" } },
  },
} as const;

export interface ProductSlugParams {
  slug: string;
}
