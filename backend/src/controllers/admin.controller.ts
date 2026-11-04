import type { FastifyRequest } from "fastify";
import { getAdminName } from "../middleware/auth.js";
import type { IdParams } from "../schemas/common.schema.js";
import type { ListCustomersQuery, ListWarrantiesQuery, RemarkBody, UpdateWarrantyStatusBody } from "../schemas/admin.schema.js";
import { adminService } from "../services/admin.service.js";
import { ok, okNotPersisted } from "../utils/api-response.js";

export const adminController = {
  async dashboard() {
    return ok(await adminService.getDashboard());
  },

  async listCustomers(request: FastifyRequest<{ Querystring: ListCustomersQuery }>) {
    const { items, meta } = await adminService.listCustomers(request.query);
    return ok(items, meta);
  },

  async getCustomer(request: FastifyRequest<{ Params: IdParams }>) {
    return ok(await adminService.getCustomer(request.params.id));
  },

  async listWarranties(request: FastifyRequest<{ Querystring: ListWarrantiesQuery }>) {
    const { items, meta } = await adminService.listWarranties(request.query);
    return ok(items, meta);
  },

  async getWarranty(request: FastifyRequest<{ Params: IdParams }>) {
    return ok(await adminService.getWarranty(request.params.id));
  },

  async approveWarranty(request: FastifyRequest<{ Params: IdParams; Body: RemarkBody }>) {
    const remark = request.body?.remark?.trim() || undefined;
    return okNotPersisted(await adminService.approve(request.params.id, getAdminName(request.principal), remark));
  },

  async rejectWarranty(request: FastifyRequest<{ Params: IdParams; Body: Required<RemarkBody> }>) {
    return okNotPersisted(await adminService.reject(request.params.id, getAdminName(request.principal), request.body.remark.trim()));
  },

  async updateWarrantyStatus(request: FastifyRequest<{ Params: IdParams; Body: UpdateWarrantyStatusBody }>) {
    const { status, remark } = request.body;
    return okNotPersisted(await adminService.updateStatus(request.params.id, getAdminName(request.principal), status, remark.trim()));
  },
};
