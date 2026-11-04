import { emailSchema, mobileSchema, nameSchema } from "./common.schema.js";
import { DOCUMENT_MAX_BYTES, DOCUMENT_TYPES } from "../services/warranty-registration.service.js";
import { uploadSchema, type UploadBody } from "../utils/uploads.js";

export const createWarrantyRegistrationSchema = {
  body: {
    type: "object",
    required: [
      "customerName",
      "email",
      "mobile",
      "installationAddress",
      "productModel",
      "serialNumber",
      "purchaseDate",
      "installationDate",
      "dealerName",
      "invoice",
      "installationDocument",
    ],
    additionalProperties: false,
    properties: {
      customerName: nameSchema,
      email: emailSchema,
      mobile: mobileSchema,
      installationAddress: { type: "string", minLength: 10, maxLength: 500 },
      productModel: { type: "string", minLength: 2, maxLength: 100 },
      serialNumber: { type: "string", pattern: "^[A-Za-z0-9-]{6,30}$" },
      purchaseDate: { type: "string", format: "date" },
      installationDate: { type: "string", format: "date" },
      dealerName: { type: "string", minLength: 2, maxLength: 150 },
      dealerContact: { type: "string", maxLength: 20 },
      invoice: uploadSchema(DOCUMENT_TYPES, DOCUMENT_MAX_BYTES),
      installationDocument: uploadSchema(DOCUMENT_TYPES, DOCUMENT_MAX_BYTES),
    },
  },
} as const;

export const warrantyStatusLookupSchema = {
  body: {
    type: "object",
    required: ["serialNumber", "mobile"],
    additionalProperties: false,
    properties: {
      serialNumber: { type: "string", pattern: "^[A-Za-z0-9-]{6,30}$" },
      mobile: mobileSchema,
    },
  },
} as const;

export interface WarrantyStatusLookupBody {
  serialNumber: string;
  mobile: string;
}

export interface CreateWarrantyRegistrationBody {
  customerName: string;
  email: string;
  mobile: string;
  installationAddress: string;
  productModel: string;
  serialNumber: string;
  purchaseDate: string;
  installationDate: string;
  dealerName: string;
  dealerContact?: string;
  invoice: UploadBody;
  installationDocument: UploadBody;
}
