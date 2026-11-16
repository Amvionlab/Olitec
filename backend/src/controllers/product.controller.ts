import type { FastifyRequest } from "fastify";
import type { ListProductsQuery, ProductSlugParams } from "../schemas/product.schema.js";
import { productService, type CreateProductInput, type UpdateProductInput } from "../services/product.service.js";
import { ok } from "../utils/api-response.js";

export const productController = {
  async list(request: FastifyRequest<{ Querystring: ListProductsQuery }>) {
    const { items, meta } = await productService.list(request.query);
    return ok(items, meta);
  },

  async listAll(request: FastifyRequest<{ Querystring: { q?: string; category?: string } }>) {
    const products = await productService.listAllForAdmin(request.query);
    return ok(products);
  },

  async getBySlug(request: FastifyRequest<{ Params: ProductSlugParams }>) {
    return ok(await productService.getBySlug(request.params.slug));
  },

  async getById(request: FastifyRequest<{ Params: { id: string } }>) {
    return ok(await productService.getById(request.params.id));
  },

  async create(request: FastifyRequest<{ Body: CreateProductInput }>) {
    const product = await productService.create(request.body);
    return ok(product);
  },

  async update(request: FastifyRequest<{ Params: { id: string }; Body: UpdateProductInput }>) {
    const product = await productService.update(request.params.id, request.body);
    return ok(product);
  },

  async delete(request: FastifyRequest<{ Params: { id: string } }>) {
    const result = await productService.delete(request.params.id);
    return ok(result);
  },
};
