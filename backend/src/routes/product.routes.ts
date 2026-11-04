import type { FastifyPluginAsync } from "fastify";
import { productController } from "../controllers/product.controller.js";
import { listProductsSchema, productSlugSchema } from "../schemas/product.schema.js";

// Public catalogue — no authentication required.
export const productRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { schema: listProductsSchema }, productController.list);
  app.get("/:slug", { schema: productSlugSchema }, productController.getBySlug);
};
