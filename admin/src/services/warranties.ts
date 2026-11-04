// Phase 1: queries mock data. Phase 2: replace with /api/admin/warranties endpoints.
import type { Paginated, Warranty, WarrantyStatus, WarrantyWithRelations } from "@/lib/types";
import { mockCustomers, mockProducts, mockWarranties } from "@/mock/data";
import { paginate } from "./paginate";

export const warrantyStatuses: WarrantyStatus[] = ["Pending", "Active", "Expired", "Rejected"];

export function withRelations(warranty: Warranty): WarrantyWithRelations {
  const customer = mockCustomers.find((c) => c.id === warranty.customerId);
  const product = mockProducts.find((p) => p.id === warranty.productId);
  if (!customer || !product) throw new Error(`Mock data error: broken relation on ${warranty.id}`);
  return { ...warranty, customer, product };
}

export interface WarrantyQuery {
  q?: string;
  status?: WarrantyStatus;
  productId?: string;
  page?: number;
}

export async function listWarranties(query: WarrantyQuery): Promise<Paginated<WarrantyWithRelations>> {
  const q = query.q?.trim().toLowerCase();
  const filtered = mockWarranties.map(withRelations).filter((w) => {
    if (query.status && w.status !== query.status) return false;
    if (query.productId && w.productId !== query.productId) return false;
    if (!q) return true;
    return [w.warrantyNumber, w.serialNumber, w.customer.name, w.customer.email, w.customer.mobile, w.invoiceNumber]
      .some((value) => value.toLowerCase().includes(q));
  });
  return paginate(filtered, query.page);
}

export async function getWarranty(id: string): Promise<WarrantyWithRelations | undefined> {
  const warranty = mockWarranties.find((w) => w.id === id);
  return warranty ? withRelations(warranty) : undefined;
}

export async function getProductOptions() {
  return mockProducts.map(({ id, name }) => ({ id, name }));
}

export async function getDashboardStats() {
  const count = (status: WarrantyStatus) => mockWarranties.filter((w) => w.status === status).length;
  return {
    totalCustomers: mockCustomers.length,
    totalRegisteredProducts: mockWarranties.filter((w) => w.status !== "Rejected").length,
    activeWarranties: count("Active"),
    expiredWarranties: count("Expired"),
    pendingRequests: count("Pending"),
    rejectedWarranties: count("Rejected"),
  };
}

/** Registrations per month for the last `months` months, oldest first. */
export async function getMonthlyRegistrations(reference: Date, months = 6) {
  const buckets = Array.from({ length: months }, (_, i) => {
    const date = new Date(reference.getFullYear(), reference.getMonth() - (months - 1 - i), 1);
    return { key: `${date.getFullYear()}-${date.getMonth()}`, label: date.toLocaleString("en-IN", { month: "short" }), count: 0 };
  });
  for (const warranty of mockWarranties) {
    const submitted = new Date(warranty.submittedAt);
    const bucket = buckets.find((b) => b.key === `${submitted.getFullYear()}-${submitted.getMonth()}`);
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

export interface ReviewInput {
  action: "approve" | "reject" | "status";
  status?: WarrantyStatus;
  remark: string;
  adminName: string;
}

/**
 * MOCK review action: returns the warranty as the API would after the change, without saving anything.
 * Approval sets the coverage period from the purchase date.
 */
export async function reviewWarranty(warranty: WarrantyWithRelations, input: ReviewInput): Promise<WarrantyWithRelations> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  const now = new Date().toISOString();
  const remark = input.remark.trim() || undefined;

  let next: WarrantyWithRelations;
  if (input.action === "approve") {
    const end = new Date(warranty.purchaseDate);
    end.setMonth(end.getMonth() + warranty.product.warrantyMonths);
    end.setDate(end.getDate() - 1);
    const endDate = end.toISOString().slice(0, 10);
    next = {
      ...warranty,
      startDate: warranty.purchaseDate,
      endDate,
      status: endDate < now.slice(0, 10) ? "Expired" : "Active",
      remark,
    };
  } else if (input.action === "reject") {
    next = { ...warranty, status: "Rejected", startDate: null, endDate: null, remark };
  } else {
    next = { ...warranty, status: input.status!, remark };
  }

  const action =
    input.action === "approve" ? "Approved" : input.action === "reject" ? "Rejected" : `Status changed to ${input.status}`;
  return { ...next, history: [...warranty.history, { at: now, action, by: input.adminName, remark }] };
}
