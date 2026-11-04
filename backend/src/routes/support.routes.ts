import type { FastifyPluginAsync } from "fastify";
import { supportController } from "../controllers/support.controller.js";
import { requireCustomer } from "../middleware/auth.js";
import { createSupportRequestSchema } from "../schemas/support.schema.js";

export const supportRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireCustomer);
  app.get("/", supportController.listMine);
  app.post("/", { schema: createSupportRequestSchema }, supportController.create);
};
