import { idParamsSchema, paginationProperties, warrantyStatusEnum } from "./common.schema.js";
import type { CustomerStatus, WarrantyStatus } from "../repositories/types.js";

export const listCustomersSchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      q: { type: "string", maxLength: 100 },
      status: { type: "string", enum: ["Active", "Inactive"] },
      ...paginationProperties,
    },
  },
} as const;

export interface ListCustomersQuery {
  q?: string;
  status?: CustomerStatus;
  page?: number;
  pageSize?: number;
}

export const listWarrantiesSchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      q: { type: "string", maxLength: 100 },
      status: { type: "string", enum: warrantyStatusEnum },
      productId: { type: "string", pattern: "^prd_[0-9]+$" },
      ...paginationProperties,
    },
  },
} as const;

export interface ListWarrantiesQuery {
  q?: string;
  status?: WarrantyStatus;
  productId?: string;
  page?: number;
  pageSize?: number;
}

export const adminIdSchema = { params: idParamsSchema } as const;

export const approveWarrantySchema = {
  params: idParamsSchema,
  body: {
    type: "object",
    additionalProperties: false,
    properties: { remark: { type: "string", maxLength: 500 } },
  },
} as const;

export const rejectWarrantySchema = {
  params: idParamsSchema,
  body: {
    type: "object",
    required: ["remark"],
    additionalProperties: false,
    properties: { remark: { type: "string", minLength: 10, maxLength: 500 } },
  },
} as const;

export interface RemarkBody {
  remark?: string;
}

export const updateWarrantyStatusSchema = {
  params: idParamsSchema,
  body: {
    type: "object",
    required: ["status", "remark"],
    additionalProperties: false,
    properties: {
      status: { type: "string", enum: warrantyStatusEnum },
      remark: { type: "string", minLength: 10, maxLength: 500 },
    },
  },
} as const;

export interface UpdateWarrantyStatusBody {
  status: WarrantyStatus;
  remark: string;
}
