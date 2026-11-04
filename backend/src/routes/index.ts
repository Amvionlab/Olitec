import type { FastifyPluginAsync } from "fastify";
import { ecommerceModule } from "../modules/ecommerce/index.js";
import { adminRoutes } from "./admin.routes.js";
import { authRoutes } from "./auth.routes.js";
import { customerRoutes } from "./customer.routes.js";
import { productRoutes } from "./product.routes.js";
import { serviceRequestRoutes } from "./service-request.routes.js";
import { supportRoutes } from "./support.routes.js";
import { warrantyRegistrationRoutes } from "./warranty-registration.routes.js";
import { warrantyRoutes } from "./warranty.routes.js";

/** Registers every API group under the /api prefix (set in app.ts). */
export const apiRoutes: FastifyPluginAsync = async (app) => {
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(customerRoutes, { prefix: "/customers" });
  await app.register(productRoutes, { prefix: "/products" });
  await app.register(warrantyRoutes, { prefix: "/warranties" });
  await app.register(adminRoutes, { prefix: "/admin" });
  await app.register(supportRoutes, { prefix: "/support" });
  await app.register(serviceRequestRoutes, { prefix: "/service-requests" });
  await app.register(warrantyRegistrationRoutes, { prefix: "/warranty-registrations" });
  // E-commerce module (MySQL-backed, separate from the warranty routes above).
  await app.register(ecommerceModule, { prefix: "/ecommerce" });
};
