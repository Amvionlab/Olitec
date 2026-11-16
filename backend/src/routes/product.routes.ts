import type { FastifyPluginAsync } from "fastify";
import { productController } from "../controllers/product.controller.js";
import { requireAdmin } from "../middleware/auth.js";
import { listProductsSchema, productSlugSchema } from "../schemas/product.schema.js";
import type { CreateProductInput, UpdateProductInput } from "../services/product.service.js";

export const productRoutes: FastifyPluginAsync = async (app) => {
  // Public catalogue
  app.get("/", { schema: listProductsSchema }, productController.list);
  app.get("/:slug", { schema: productSlugSchema }, productController.getBySlug);

  // Admin Product Master endpoints
  app.post<{ Body: CreateProductInput }>("/", { preHandler: requireAdmin() }, productController.create);
  app.put<{ Params: { id: string }; Body: UpdateProductInput }>("/:id", { preHandler: requireAdmin() }, productController.update);
  app.delete<{ Params: { id: string } }>("/:id", { preHandler: requireAdmin() }, productController.delete);
};
