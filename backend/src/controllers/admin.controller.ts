import type { FastifyRequest } from "fastify";
import type { IdParams } from "../schemas/common.schema.js";
import type { ListCustomersQuery, ListWarrantiesQuery, RemarkBody, UpdateWarrantyStatusBody } from "../schemas/admin.schema.js";
import { adminService } from "../services/admin.service.js";
import { productService, type CreateProductInput, type UpdateProductInput } from "../services/product.service.js";
import { ok } from "../utils/api-response.js";

export const adminController = {
  async dashboard() {
    return ok(await adminService.getDashboard());
  },

  async analytics() {
    return ok(await adminService.getAnalytics());
  },

  async listUsers(
    request: FastifyRequest<{
      Querystring: { q?: string; role?: string; status?: string; page?: number; limit?: number };
    }>,
  ) {
    const { items, meta } = await adminService.listUsers(request.query);
    return ok(items, meta);
  },

  async updateUserStatus(
    request: FastifyRequest<{ Params: IdParams; Body: { status: "active" | "inactive" } }>,
  ) {
    const result = await adminService.updateUserStatus(request.params.id, request.body.status);
    return ok(result);
  },

  async listCustomers(request: FastifyRequest<{ Querystring: ListCustomersQuery }>) {
    const customers = await adminService.listCustomers(request.query);
    return ok(customers);
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
    const adminId = request.principal?.id || 1;
    return ok(await adminService.approveWarranty(request.params.id, adminId, remark));
  },

  async rejectWarranty(request: FastifyRequest<{ Params: IdParams; Body: Required<RemarkBody> }>) {
    const adminId = request.principal?.id || 1;
    return ok(await adminService.rejectWarranty(request.params.id, adminId, request.body.remark?.trim() || "Rejected"));
  },

  async updateWarrantyStatus(request: FastifyRequest<{ Params: IdParams; Body: UpdateWarrantyStatusBody }>) {
    const { status, remark } = request.body;
    const adminId = request.principal?.id || 1;
    return ok(await adminService.updateWarrantyStatus(request.params.id, adminId, status, remark?.trim()));
  },

  // Product Master routes under /api/admin/products
  async listProducts(request: FastifyRequest<{ Querystring: { q?: string; category?: string } }>) {
    const products = await productService.listAllForAdmin(request.query);
    return ok(products);
  },

  async getProduct(request: FastifyRequest<{ Params: IdParams }>) {
    return ok(await productService.getById(request.params.id));
  },

  async createProduct(request: FastifyRequest<{ Body: CreateProductInput }>) {
    return ok(await productService.create(request.body));
  },

  async updateProduct(request: FastifyRequest<{ Params: IdParams; Body: UpdateProductInput }>) {
    return ok(await productService.update(request.params.id, request.body));
  },

  async deleteProduct(request: FastifyRequest<{ Params: IdParams }>) {
    return ok(await productService.delete(request.params.id));
  },
};
