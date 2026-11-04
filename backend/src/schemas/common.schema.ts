export const idParamsSchema = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string", pattern: "^[a-z]+_[0-9]+$" } },
} as const;

export interface IdParams {
  id: string;
}

export const paginationProperties = {
  page: { type: "integer", minimum: 1, default: 1 },
  pageSize: { type: "integer", minimum: 1, maximum: 100, default: 10 },
} as const;

export const warrantyStatusEnum = ["Pending", "Active", "Expired", "Rejected"] as const;

export const emailSchema = { type: "string", format: "email", maxLength: 254 } as const;
/** 10-digit Indian mobile number starting with 6–9. */
export const mobileSchema = { type: "string", pattern: "^[6-9][0-9]{9}$" } as const;
export const nameSchema = { type: "string", minLength: 2, maxLength: 100 } as const;
