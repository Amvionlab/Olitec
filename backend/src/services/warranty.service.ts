import { repositories } from "../repositories/index.js";
import type { Warranty, WarrantyStatus } from "../repositories/types.js";
import type { ListMyWarrantiesQuery, RegisterWarrantyBody } from "../schemas/warranty.schema.js";
import { BusinessRuleError, ConflictError, NotFoundError } from "../utils/errors.js";
import { paginate } from "../utils/pagination.js";
import { decodeUpload } from "../utils/uploads.js";

const MAX_PURCHASE_AGE_YEARS = 5;
export const INVOICE_TYPES = ["application/pdf", "image/jpeg", "image/png"];
export const INVOICE_MAX_BYTES = 5 * 1024 * 1024;

/** Manual status changes allowed after review (approve/reject are separate actions on Pending). */
export const allowedStatusTransitions: Record<WarrantyStatus, WarrantyStatus[]> = {
  Pending: [],
  Active: ["Expired"],
  Expired: ["Active"],
  Rejected: ["Pending"],
};

export function calculateEndDate(purchaseDate: string, warrantyMonths: number): string {
  const end = new Date(`${purchaseDate}T00:00:00Z`);
  end.setUTCMonth(end.getUTCMonth() + warrantyMonths);
  end.setUTCDate(end.getUTCDate() - 1);
  return end.toISOString().slice(0, 10);
}

async function withProduct(warranty: Warranty) {
  const product = await repositories.products.findById(warranty.productId);
  return { ...warranty, product };
}

export const warrantyService = {
  async listForCustomer(customerId: string, query: ListMyWarrantiesQuery) {
    const warranties = await repositories.warranties.findAll({ customerId, status: query.status });
    const page = paginate(warranties, query);
    return { items: await Promise.all(page.items.map(withProduct)), meta: page.meta };
  },

  async getForCustomer(customerId: string, id: string) {
    const warranty = await repositories.warranties.findById(id);
    // Same 404 for "missing" and "belongs to someone else" so IDs cannot be probed.
    if (!warranty || warranty.customerId !== customerId) throw new NotFoundError("Warranty");
    return withProduct(warranty);
  },

  /** Validates business rules and saves the registration (Pending) with its invoice. */
  async register(customerId: string, input: RegisterWarrantyBody): Promise<Warranty> {
    if (!(await repositories.customers.findById(customerId))) throw new NotFoundError("Customer account");
    const product = await repositories.products.findById(input.productId);
    if (!product) throw new BusinessRuleError("Selected product does not exist.");

    const purchase = new Date(`${input.purchaseDate}T00:00:00Z`);
    const oldest = new Date();
    oldest.setUTCFullYear(oldest.getUTCFullYear() - MAX_PURCHASE_AGE_YEARS);
    if (purchase > new Date()) throw new BusinessRuleError("Purchase date cannot be in the future.");
    if (purchase < oldest) throw new BusinessRuleError(`Products older than ${MAX_PURCHASE_AGE_YEARS} years cannot be registered.`);

    if (await repositories.warranties.existsBySerial(input.productId, input.serialNumber)) {
      throw new ConflictError("A warranty is already registered for this serial number.");
    }

    return repositories.warranties.create({
      customerId,
      productId: input.productId,
      serialNumber: input.serialNumber.trim(),
      purchaseDate: input.purchaseDate,
      invoiceNumber: input.invoiceNumber.trim(),
      dealerName: input.dealerName.trim(),
      invoice: decodeUpload(input.invoice, "Invoice", INVOICE_MAX_BYTES),
    });
  },
};
