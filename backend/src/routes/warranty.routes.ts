import type { FastifyPluginAsync } from "fastify";
import { warrantyController } from "../controllers/warranty.controller.js";
import { requireCustomer } from "../middleware/auth.js";
import { listMyWarrantiesSchema, registerWarrantySchema, warrantyIdSchema } from "../schemas/warranty.schema.js";

// Customer-scoped warranties. Admin review endpoints live under /api/admin/warranties.
export const warrantyRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireCustomer);
  app.get("/", { schema: listMyWarrantiesSchema }, warrantyController.listMine);
  app.get("/:id", { schema: warrantyIdSchema }, warrantyController.getMine);
  // The invoice travels base64-encoded in the JSON body: 5 MB file ≈ 6.7 MB of base64.
  app.post("/", { schema: registerWarrantySchema, bodyLimit: 7 * 1024 * 1024 }, warrantyController.register);
};
