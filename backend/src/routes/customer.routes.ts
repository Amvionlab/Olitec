import type { FastifyPluginAsync } from "fastify";
import { customerController } from "../controllers/customer.controller.js";
import { requireCustomer } from "../middleware/auth.js";
import { updateProfileSchema } from "../schemas/customer.schema.js";

export const customerRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireCustomer);
  app.get("/me", customerController.getMe);
  app.patch("/me", { schema: updateProfileSchema }, customerController.updateMe);
};
