import { emailSchema, mobileSchema, nameSchema } from "./common.schema.js";

export const registerSchema = {
  body: {
    type: "object",
    required: ["name", "email", "mobile", "password"],
    additionalProperties: false,
    properties: {
      name: nameSchema,
      email: emailSchema,
      mobile: mobileSchema,
      // Policy: 8+ characters with at least one letter and one number. Hashing happens in Phase 2 (argon2id/bcrypt).
      password: { type: "string", minLength: 8, maxLength: 128, pattern: "^(?=.*[A-Za-z])(?=.*[0-9]).+$" },
    },
  },
} as const;

export interface RegisterBody {
  name: string;
  email: string;
  mobile: string;
  password: string;
}

export const loginSchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    additionalProperties: false,
    properties: {
      email: emailSchema,
      password: { type: "string", minLength: 1, maxLength: 128 },
    },
  },
} as const;

export interface LoginBody {
  email: string;
  password: string;
}
