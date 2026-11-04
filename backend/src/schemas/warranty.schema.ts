import { idParamsSchema, paginationProperties, warrantyStatusEnum } from "./common.schema.js";
import type { WarrantyStatus } from "../repositories/types.js";
import { INVOICE_MAX_BYTES, INVOICE_TYPES } from "../services/warranty.service.js";
import { uploadSchema, type UploadBody } from "../utils/uploads.js";

export const listMyWarrantiesSchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: { status: { type: "string", enum: warrantyStatusEnum }, ...paginationProperties },
  },
} as const;

export interface ListMyWarrantiesQuery {
  status?: WarrantyStatus;
  page?: number;
  pageSize?: number;
}

export const warrantyIdSchema = { params: idParamsSchema } as const;

export const registerWarrantySchema = {
  body: {
    type: "object",
    required: ["productId", "serialNumber", "purchaseDate", "invoiceNumber", "dealerName", "invoice"],
    additionalProperties: false,
    properties: {
      productId: { type: "string", pattern: "^prd_[0-9]+$" },
      serialNumber: { type: "string", pattern: "^[A-Za-z0-9-]{8,20}$" },
      purchaseDate: { type: "string", format: "date" },
      invoiceNumber: { type: "string", minLength: 1, maxLength: 60 },
      dealerName: { type: "string", minLength: 2, maxLength: 150 },
      invoice: uploadSchema(INVOICE_TYPES, INVOICE_MAX_BYTES),
    },
  },
} as const;

export interface RegisterWarrantyBody {
  productId: string;
  serialNumber: string;
  purchaseDate: string;
  invoiceNumber: string;
  dealerName: string;
  invoice: UploadBody;
}
