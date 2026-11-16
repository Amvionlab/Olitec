import type { FastifyPluginAsync } from "fastify";
import { authController } from "../controllers/auth.controller.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/register", { schema: registerSchema }, authController.register);
  app.post("/login", { schema: loginSchema }, authController.login);
  app.post("/admin/login", { schema: loginSchema }, authController.adminLogin);
  app.get("/me", authController.me);
  app.post("/logout", authController.logout);

  // Email verification OTP routes
  app.post("/send-verification-otp", authController.sendVerificationOtp);
  app.post("/verify-email-otp", authController.verifyEmailOtp);

  // Forgot password OTP routes
  app.post("/forgot-password/send-otp", authController.sendForgotPasswordOtp);
  app.post("/forgot-password/reset", authController.resetPasswordWithOtp);
};
