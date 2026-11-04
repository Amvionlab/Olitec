/** JSON Schema fragments shared by e-commerce routes (validated by Fastify/Ajv before handlers run). */
import { emailSchema, mobileSchema, nameSchema, paginationProperties } from "../../../schemas/common.schema.js";

export { emailSchema, mobileSchema, nameSchema, paginationProperties };

export const numericIdParams = {
  params: {
    type: "object",
    required: ["id"],
    properties: { id: { type: "integer", minimum: 1 } },
  },
} as const;

export interface NumericIdParams {
  id: number;
}

export const slugSchema = { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", minLength: 2, maxLength: 160 } as const;
export const pincodeSchema = { type: "string", pattern: "^[1-9][0-9]{5}$" } as const;
export const gstinSchema = { type: "string", pattern: "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$" } as const;
export const passwordSchema = { type: "string", minLength: 8, maxLength: 128 } as const;
export const moneySchema = { type: "number", minimum: 0, maximum: 99_999_999 } as const;
export const urlOrEmpty = { type: "string", maxLength: 512, pattern: "^(https?://|/|$)" } as const;
export const dateTimeOrNull = { anyOf: [{ type: "string", format: "date-time" }, { type: "null" }] } as const;

export const addressSchema = {
  type: "object",
  additionalProperties: false,
  required: ["fullName", "phone", "line1", "city", "state", "pincode"],
  properties: {
    fullName: nameSchema,
    phone: mobileSchema,
    line1: { type: "string", minLength: 3, maxLength: 200 },
    line2: { type: "string", maxLength: 200 },
    city: { type: "string", minLength: 2, maxLength: 100 },
    state: { type: "string", minLength: 2, maxLength: 100 },
    pincode: pincodeSchema,
  },
} as const;

export interface AddressInput {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export const dateRangeProperties = {
  from: { type: "string", format: "date" },
  to: { type: "string", format: "date" },
} as const;

export interface DateRangeQuery {
  from?: string;
  to?: string;
}

/** Inclusive UTC date range → SQL bounds. Defaults to the last 30 days. */
export function dateBounds(query: DateRangeQuery): { from: string; to: string } {
  const to = query.to ?? new Date().toISOString().slice(0, 10);
  const from = query.from ?? new Date(Date.parse(to) - 29 * 86400_000).toISOString().slice(0, 10);
  return { from: `${from} 00:00:00`, to: `${to} 23:59:59` };
}
