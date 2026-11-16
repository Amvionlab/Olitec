import type { FastifyPluginAsync } from "fastify";
import { customerController } from "../controllers/customer.controller.js";
import { requireCustomer } from "../middleware/auth.js";

export const customerRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireCustomer);
  app.get("/me", customerController.getMe);
  app.get("/dashboard", customerController.getDashboard);
  app.patch("/me", customerController.updateMe);
};
