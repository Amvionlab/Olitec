import type { FastifyPluginAsync } from "fastify";
import { inquiryController } from "../controllers/inquiry.controller.js";
import { requireAdmin } from "../middleware/auth.js";

// Public inquiry submission route
export const publicInquiryRoutes: FastifyPluginAsync = async (app) => {
  app.post("/", inquiryController.submit);
};

// Admin inquiry & SMTP management routes
export const adminInquiryRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireAdmin());

  // Inquiries
  app.get("/inquiries", inquiryController.list);
  app.get("/inquiries/stats", inquiryController.stats);
  app.get("/inquiries/:id", inquiryController.getOne);
  app.patch("/inquiries/:id", inquiryController.update);
  app.post(
  "/inquiries/:id/assign-engineer",
  inquiryController.assignEngineer
);
  app.delete("/inquiries/:id", inquiryController.remove);

  // SMTP Settings
  app.get("/smtp", inquiryController.getSmtp);
  app.put("/smtp", inquiryController.updateSmtp);
  app.post("/smtp/test", inquiryController.testSmtp);
};
