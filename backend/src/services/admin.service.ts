import { repositories } from "../repositories/index.js";
import type { Warranty, WarrantyStatus } from "../repositories/types.js";
import type { ListCustomersQuery, ListWarrantiesQuery } from "../schemas/admin.schema.js";
import { BusinessRuleError, NotFoundError } from "../utils/errors.js";
import { paginate } from "../utils/pagination.js";
import { allowedStatusTransitions, calculateEndDate } from "./warranty.service.js";

async function getWarrantyOrThrow(id: string): Promise<Warranty> {
  const warranty = await repositories.warranties.findById(id);
  if (!warranty) throw new NotFoundError("Warranty");
  return warranty;
}

function appendHistory(warranty: Warranty, action: string, by: string, remark?: string): Warranty["history"] {
  return [...warranty.history, { at: new Date().toISOString(), action, by, ...(remark ? { remark } : {}) }];
}

export const adminService = {
  async getDashboard() {
    const [totalCustomers, byStatus] = await Promise.all([
      repositories.customers.count(),
      repositories.warranties.countByStatus(),
    ]);
    return {
      totalCustomers,
      totalRegisteredProducts: byStatus.Pending + byStatus.Active + byStatus.Expired,
      activeWarranties: byStatus.Active,
      expiredWarranties: byStatus.Expired,
      pendingWarrantyRequests: byStatus.Pending,
      warrantiesByStatus: byStatus,
    };
  },

  async listCustomers(query: ListCustomersQuery) {
    const customers = await repositories.customers.findAll({ q: query.q, status: query.status });
    return paginate(customers, query);
  },

  async getCustomer(id: string) {
    const customer = await repositories.customers.findById(id);
    if (!customer) throw new NotFoundError("Customer");
    const warranties = await repositories.warranties.findAll({ customerId: id });
    return { ...customer, warranties };
  },

  async listWarranties(query: ListWarrantiesQuery) {
    const warranties = await repositories.warranties.findAll({ q: query.q, status: query.status, productId: query.productId });
    return paginate(warranties, query);
  },

  async getWarranty(id: string) {
    const warranty = await getWarrantyOrThrow(id);
    const [customer, product] = await Promise.all([
      repositories.customers.findById(warranty.customerId),
      repositories.products.findById(warranty.productId),
    ]);
    return { ...warranty, customer, product };
  },

  /** MOCK: returns the approved warranty without saving it. */
  async approve(id: string, adminName: string, remark?: string): Promise<Warranty> {
    const warranty = await getWarrantyOrThrow(id);
    if (warranty.status !== "Pending") throw new BusinessRuleError(`Only pending warranties can be approved (current: ${warranty.status}).`);
    const product = await repositories.products.findById(warranty.productId);
    if (!product) throw new NotFoundError("Product");

    const endDate = calculateEndDate(warranty.purchaseDate, product.warrantyMonths);
    const today = new Date().toISOString().slice(0, 10);
    return {
      ...warranty,
      status: endDate < today ? "Expired" : "Active",
      startDate: warranty.purchaseDate,
      endDate,
      adminRemark: remark ?? null,
      history: appendHistory(warranty, "Approved", adminName, remark),
    };
  },

  /** MOCK: returns the rejected warranty without saving it. */
  async reject(id: string, adminName: string, remark: string): Promise<Warranty> {
    const warranty = await getWarrantyOrThrow(id);
    if (warranty.status !== "Pending") throw new BusinessRuleError(`Only pending warranties can be rejected (current: ${warranty.status}).`);
    return { ...warranty, status: "Rejected", adminRemark: remark, history: appendHistory(warranty, "Rejected", adminName, remark) };
  },

  /** MOCK: validates the transition and returns the updated warranty without saving it. */
  async updateStatus(id: string, adminName: string, status: WarrantyStatus, remark: string): Promise<Warranty> {
    const warranty = await getWarrantyOrThrow(id);
    if (!allowedStatusTransitions[warranty.status].includes(status)) {
      throw new BusinessRuleError(`Status cannot change from ${warranty.status} to ${status}.`);
    }
    return {
      ...warranty,
      status,
      adminRemark: remark,
      history: appendHistory(warranty, `Status changed to ${status}`, adminName, remark),
    };
  },
};
