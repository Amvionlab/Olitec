import { repositories } from "../repositories/index.js";
import type { ListProductsQuery } from "../schemas/product.schema.js";
import { NotFoundError } from "../utils/errors.js";
import { paginate } from "../utils/pagination.js";

export const productService = {
  async list(query: ListProductsQuery) {
    const products = await repositories.products.findAll({ category: query.category, q: query.q });
    return paginate(products, query);
  },

  async getBySlug(slug: string) {
    const product = await repositories.products.findBySlug(slug);
    if (!product) throw new NotFoundError("Product");
    return product;
  },
};
