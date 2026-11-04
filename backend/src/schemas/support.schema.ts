import { emailSchema, mobileSchema, nameSchema } from "./common.schema.js";
import type { SupportCategory } from "../repositories/types.js";

export const createSupportRequestSchema = {
  body: {
    type: "object",
    required: ["name", "email", "mobile", "category", "subject", "message"],
    additionalProperties: false,
    properties: {
      name: nameSchema,
      email: emailSchema,
      mobile: mobileSchema,
      category: { type: "string", enum: ["Installation", "Repair", "Warranty Claim", "General Enquiry"] },
      warrantyNumber: { type: "string", pattern: "^WR-[0-9]{4}-[0-9]{6}$" },
      subject: { type: "string", minLength: 5, maxLength: 120 },
      message: { type: "string", minLength: 20, maxLength: 1000 },
    },
  },
} as const;

export interface CreateSupportRequestBody {
  name: string;
  email: string;
  mobile: string;
  category: SupportCategory;
  warrantyNumber?: string;
  subject: string;
  message: string;
}
