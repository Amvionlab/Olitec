import type { FastifyPluginAsync } from "fastify";
import { adminController } from "../controllers/admin.controller.js";
import { requireAdmin } from "../middleware/auth.js";

export const adminRoutes: FastifyPluginAsync = async (app) => {
  // All admin routes require admin authentication
  app.addHook("preHandler", requireAdmin());

  // Analytics & Dashboard
  app.get("/dashboard", adminController.dashboard);
  app.get("/analytics", adminController.analytics);

  // User Management
  app.get("/users", adminController.listUsers);
  app.patch("/users/:id/status", adminController.updateUserStatus);

  // Customers & Warranties
  app.get("/customers", adminController.listCustomers);
  app.get("/customers/:id", adminController.getCustomer);

  app.get("/warranties", adminController.listWarranties);
  app.get("/warranties/:id", adminController.getWarranty);
  app.post("/warranties/:id/approve", adminController.approveWarranty);
  app.post("/warranties/:id/reject", adminController.rejectWarranty);
  app.patch("/warranties/:id/status", adminController.updateWarrantyStatus);

  // Product Master
  app.get("/products", adminController.listProducts);
  app.get("/products/:id", adminController.getProduct);
  app.post("/products", adminController.createProduct);
  app.put("/products/:id", adminController.updateProduct);
  app.delete("/products/:id", adminController.deleteProduct);
};
