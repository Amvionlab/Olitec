/** Mock repositories backed by ./data.ts. Writes return the record that would be created but never store it. */
import type {
  CustomerRepository,
  ProductRepository,
  ServiceRequestRepository,
  SupportRepository,
  WarrantyRegistrationRepository,
  WarrantyRepository,
  WarrantyStatus,
} from "../types.js";
import { customers, products, supportRequests, warranties } from "./data.js";

const contains = (value: string, q: string) => value.toLowerCase().includes(q);

export const mockProductRepository: ProductRepository = {
  async findAll({ category, q }) {
    const query = q?.trim().toLowerCase();
    return products.filter(
      (p) => (!category || p.category === category) && (!query || contains(`${p.name} ${p.model}`, query)),
    );
  },
  async findById(id) {
    return products.find((p) => p.id === id);
  },
  async findBySlug(slug) {
    return products.find((p) => p.slug === slug);
  },
};

export const mockCustomerRepository: CustomerRepository = {
  async findAll({ q, status }) {
    const query = q?.trim().toLowerCase();
    return customers.filter(
      (c) =>
        (!status || c.status === status) &&
        (!query || contains(c.name, query) || contains(c.email, query) || c.mobile.includes(query)),
    );
  },
  async findById(id) {
    return customers.find((c) => c.id === id);
  },
  async count() {
    return customers.length;
  },
};

export const mockWarrantyRepository: WarrantyRepository = {
  async findAll({ customerId, status, productId, q }) {
    const query = q?.trim().toLowerCase();
    return warranties
      .filter(
        (w) =>
          (!customerId || w.customerId === customerId) &&
          (!status || w.status === status) &&
          (!productId || w.productId === productId) &&
          (!query || contains(w.warrantyNumber, query) || contains(w.serialNumber, query) || contains(w.invoiceNumber, query)),
      )
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  },
  async findById(id) {
    return warranties.find((w) => w.id === id);
  },
  async existsBySerial(productId, serialNumber) {
    return warranties.some((w) => w.productId === productId && w.serialNumber.toUpperCase() === serialNumber.toUpperCase());
  },
  async countByStatus() {
    const counts: Record<WarrantyStatus, number> = { Pending: 0, Active: 0, Expired: 0, Rejected: 0 };
    for (const w of warranties) counts[w.status] += 1;
    return counts;
  },
  async create({ invoice: _invoice, ...input }) {
    const now = new Date().toISOString();
    return {
      ...input,
      id: `war_${Date.now()}`,
      warrantyNumber: `WR-${new Date().getFullYear()}-${String(Date.now() % 1_000_000).padStart(6, "0")}`,
      serialNumber: input.serialNumber.toUpperCase(),
      startDate: null,
      endDate: null,
      status: "Pending",
      adminRemark: null,
      submittedAt: now,
      history: [{ at: now, action: "Registration submitted", by: input.customerId }],
    };
  },
};

export const mockSupportRepository: SupportRepository = {
  async findByCustomer(customerId) {
    return supportRequests
      .filter((r) => r.customerId === customerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async create({ customerId, warrantyId, category, subject, message }) {
    const now = new Date().toISOString();
    return {
      id: `sup_${Date.now()}`,
      ticketNumber: `SR-${new Date().getFullYear()}-${String(Date.now() % 100_000).padStart(5, "0")}`,
      customerId,
      warrantyId,
      category,
      subject,
      message,
      status: "Open",
      createdAt: now,
      updatedAt: now,
    };
  },
};

export const mockServiceRequestRepository: ServiceRequestRepository = {
  async create({ photo, ...input }) {
    return {
      ...input,
      id: `srv_${Date.now()}`,
      ticketNumber: `SR-${new Date().getFullYear()}-${String(Date.now() % 100_000).padStart(5, "0")}`,
      photoFileName: photo?.originalFileName ?? null,
      status: "Open",
      createdAt: new Date().toISOString(),
    };
  },
};

export const mockWarrantyRegistrationRepository: WarrantyRegistrationRepository = {
  async existsBySerial(serialNumber) {
    return warranties.some((w) => w.serialNumber.toUpperCase() === serialNumber.toUpperCase());
  },
  async findStatus(serialNumber, mobile) {
    const warranty = warranties.find(
      (w) => w.serialNumber.toUpperCase() === serialNumber.toUpperCase() && customers.find((c) => c.id === w.customerId)?.mobile === mobile,
    );
    if (!warranty) return undefined;
    return {
      model: products.find((p) => p.id === warranty.productId)?.model ?? "",
      serialNumber: warranty.serialNumber,
      registeredOn: warranty.submittedAt,
      validUntil: warranty.endDate,
      status: warranty.status,
    };
  },
  async create({ invoice, installationDocument, ...input }) {
    return {
      ...input,
      id: `wrg_${Date.now()}`,
      registrationNumber: `WR-${new Date().getFullYear()}-${String(Date.now() % 1_000_000).padStart(6, "0")}`,
      serialNumber: input.serialNumber.toUpperCase(),
      invoiceFileName: invoice.originalFileName,
      installationDocumentFileName: installationDocument.originalFileName,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };
  },
};
