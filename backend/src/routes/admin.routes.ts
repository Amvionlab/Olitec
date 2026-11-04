import type { FastifyPluginAsync } from "fastify";
import { adminController } from "../controllers/admin.controller.js";
import { requireAdmin } from "../middleware/auth.js";
import type { IdParams } from "../schemas/common.schema.js";
import {
  adminIdSchema,
  approveWarrantySchema,
  listCustomersSchema,
  listWarrantiesSchema,
  rejectWarrantySchema,
  updateWarrantyStatusSchema,
  type ListCustomersQuery,
  type ListWarrantiesQuery,
  type RemarkBody,
  type UpdateWarrantyStatusBody,
} from "../schemas/admin.schema.js";

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.get("/dashboard", { preHandler: requireAdmin() }, adminController.dashboard);

  app.get<{ Querystring: ListCustomersQuery }>(
    "/customers",
    { preHandler: requireAdmin("viewCustomers"), schema: listCustomersSchema },
    adminController.listCustomers,
  );
  app.get<{ Params: IdParams }>(
    "/customers/:id",
    { preHandler: requireAdmin("viewCustomers"), schema: adminIdSchema },
    adminController.getCustomer,
  );

  app.get<{ Querystring: ListWarrantiesQuery }>(
    "/warranties",
    { preHandler: requireAdmin(), schema: listWarrantiesSchema },
    adminController.listWarranties,
  );
  app.get<{ Params: IdParams }>("/warranties/:id", { preHandler: requireAdmin(), schema: adminIdSchema }, adminController.getWarranty);
  app.post<{ Params: IdParams; Body: RemarkBody }>(
    "/warranties/:id/approve",
    { preHandler: requireAdmin("reviewWarranties"), schema: approveWarrantySchema },
    adminController.approveWarranty,
  );
  app.post<{ Params: IdParams; Body: Required<RemarkBody> }>(
    "/warranties/:id/reject",
    { preHandler: requireAdmin("reviewWarranties"), schema: rejectWarrantySchema },
    adminController.rejectWarranty,
  );
  app.patch<{ Params: IdParams; Body: UpdateWarrantyStatusBody }>(
    "/warranties/:id/status",
    { preHandler: requireAdmin("updateWarrantyStatus"), schema: updateWarrantyStatusSchema },
    adminController.updateWarrantyStatus,
  );
};
