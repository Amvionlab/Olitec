import { mobileSchema, nameSchema } from "./common.schema.js";

export const updateProfileSchema = {
  body: {
    type: "object",
    additionalProperties: false,
    minProperties: 1,
    properties: {
      name: nameSchema,
      mobile: mobileSchema,
      addressLine: { type: "string", minLength: 3, maxLength: 255 },
      city: { type: "string", minLength: 2, maxLength: 100 },
      state: { type: "string", minLength: 2, maxLength: 100 },
      pincode: { type: "string", pattern: "^[0-9]{6}$" },
    },
  },
} as const;

export interface UpdateProfileBody {
  name?: string;
  mobile?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
}
