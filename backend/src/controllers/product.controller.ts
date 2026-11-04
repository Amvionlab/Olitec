import type { FastifyRequest } from "fastify";
import type { ListProductsQuery, ProductSlugParams } from "../schemas/product.schema.js";
import { productService } from "../services/product.service.js";
import { ok } from "../utils/api-response.js";

export const productController = {
  async list(request: FastifyRequest<{ Querystring: ListProductsQuery }>) {
    const { items, meta } = await productService.list(request.query);
    return ok(items, meta);
  },

  async getBySlug(request: FastifyRequest<{ Params: ProductSlugParams }>) {
    return ok(await productService.getBySlug(request.params.slug));
  },
};
