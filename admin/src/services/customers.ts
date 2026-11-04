// Phase 1: queries mock data. Phase 2: replace with GET /api/admin/customers and /api/admin/customers/:id.
import type { Customer, CustomerStatus, Paginated } from "@/lib/types";
import { mockCustomers, mockWarranties } from "@/mock/data";
import { paginate } from "./paginate";
import { withRelations } from "./warranties";

export interface CustomerListItem extends Customer {
  productCount: number;
  activeWarranties: number;
}

export interface CustomerQuery {
  q?: string;
  status?: CustomerStatus;
  page?: number;
}

export async function listCustomers(query: CustomerQuery): Promise<Paginated<CustomerListItem>> {
  const q = query.q?.trim().toLowerCase();
  const digits = q?.replace(/\D/g, "");
  const filtered = mockCustomers.filter((customer) => {
    if (query.status && customer.status !== query.status) return false;
    if (!q) return true;
    return (
      customer.name.toLowerCase().includes(q) ||
      customer.email.includes(q) ||
      (digits ? customer.mobile.includes(digits) : false)
    );
  });

  const items = filtered.map((customer) => {
    const warranties = mockWarranties.filter((w) => w.customerId === customer.id);
    return {
      ...customer,
      productCount: warranties.filter((w) => w.status !== "Rejected").length,
      activeWarranties: warranties.filter((w) => w.status === "Active").length,
    };
  });
  return paginate(items, query.page);
}

export async function getCustomerWithWarranties(id: string) {
  const customer = mockCustomers.find((c) => c.id === id);
  if (!customer) return undefined;
  const warranties = mockWarranties.filter((w) => w.customerId === id).map(withRelations);
  return { customer, warranties };
}
