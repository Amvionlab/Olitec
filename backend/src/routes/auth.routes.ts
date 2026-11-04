import type { FastifyPluginAsync } from "fastify";
import { authController } from "../controllers/auth.controller.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/register", { schema: registerSchema }, authController.register);
  app.post("/login", { schema: loginSchema }, authController.login);
  app.post("/admin/login", { schema: loginSchema }, authController.adminLogin);
  app.post("/logout", authController.logout);
};
