import { repositories } from "../repositories/index.js";
import type { WarrantyRegistration, WarrantyStatusLookup } from "../repositories/types.js";
import type {
  CreateWarrantyRegistrationBody,
  WarrantyStatusLookupBody,
  ValidateSerialNumberBody,
} from "../schemas/warranty-registration.schema.js";
import { BusinessRuleError, ConflictError, NotFoundError } from "../utils/errors.js";
import { decodeUpload } from "../utils/uploads.js";
import { INVOICE_MAX_BYTES } from "./warranty.service.js";

const MAX_PURCHASE_AGE_YEARS = 5;
export const DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png"];
export const DOCUMENT_MAX_BYTES = INVOICE_MAX_BYTES;

export const warrantyRegistrationService = {
  /** Public status check by serial number (and optionally mobile number). */
  async lookupStatus(input: WarrantyStatusLookupBody): Promise<WarrantyStatusLookup> {
    const found = await repositories.warrantyRegistrations.findStatus(input.serialNumber.trim(), input.mobile);
    if (!found) throw new NotFoundError("Warranty");
    return found;
  },
async validateSerialNumber(input: ValidateSerialNumberBody) {
  const serialNumber = input.serialNumber.trim().toUpperCase();

  const serialRecord =
    await repositories.serialNumbers.findBySerial(serialNumber);

  if (!serialRecord) {
    throw new BusinessRuleError("Invalid serial number.");
  }

  if (
    serialRecord.modelNumber.trim().toUpperCase() !==
    input.productModel.trim().toUpperCase()
  ) {
    throw new BusinessRuleError(
      "Serial number does not match the selected product model.",
    );
  }

  if (await repositories.warrantyRegistrations.existsBySerial(serialNumber)) {
    throw new ConflictError("This serial number is already registered.");
  }

  return {
    valid: true,
    message: "Serial number verified successfully.",
    productModel: serialRecord.modelNumber,
  };
},
  /** Public warranty registration from the website form; saved as Pending with both documents. */
  async create(input: CreateWarrantyRegistrationBody): Promise<WarrantyRegistration> {
    
    // Compared in IST so "today" matches what the customer sees in India.
    const todayIst = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const oldest = `${Number(todayIst.slice(0, 4)) - MAX_PURCHASE_AGE_YEARS}${todayIst.slice(4)}`;
    if (input.purchaseDate > todayIst) throw new BusinessRuleError("Purchase date cannot be in the future.");
    if (input.purchaseDate < oldest) throw new BusinessRuleError(`Products older than ${MAX_PURCHASE_AGE_YEARS} years cannot be registered.`);
    if (input.installationDate > todayIst) throw new BusinessRuleError("Installation date cannot be in the future.");
    if (input.installationDate < input.purchaseDate) throw new BusinessRuleError("Installation date cannot be before the purchase date.");

    const serialNumber = input.serialNumber.trim().toUpperCase();
    const serialRecord = await repositories.serialNumbers.findBySerial(serialNumber);

if (!serialRecord) {
  throw new BusinessRuleError("Invalid serial number. Please enter a valid serial number.");
}

if (
  serialRecord.modelNumber.trim().toUpperCase() !==
  input.productModel.trim().toUpperCase()
) {
  throw new BusinessRuleError("Serial number does not match the selected product model.");
}
    if (await repositories.warrantyRegistrations.existsBySerial(serialNumber)) {
      throw new ConflictError("A warranty is already registered for this serial number.");
    }

    const dealerContact = input.dealerContact?.replace(/\D/g, "") || null;
    if (dealerContact && (dealerContact.length < 8 || dealerContact.length > 15)) {
      throw new BusinessRuleError("Dealer contact number must have 8 to 15 digits.");
    }

    return repositories.warrantyRegistrations.create({
      customerName: input.customerName.trim(),
      email: input.email.trim().toLowerCase(),
      mobile: input.mobile,
      installationAddress: input.installationAddress.trim(),
      productModel: input.productModel.trim(),
      serialNumber,
      purchaseDate: input.purchaseDate,
      installationDate: input.installationDate,
      dealerName: input.dealerName.trim(),
      dealerContact,
      invoice: decodeUpload(input.invoice, "Purchase invoice", DOCUMENT_MAX_BYTES),
      installationDocument: decodeUpload(input.installationDocument, "Installation document", DOCUMENT_MAX_BYTES),
    });
  },
};
