import { emailSchema, mobileSchema, nameSchema } from "./common.schema.js";
import { PHOTO_MAX_BYTES, PHOTO_TYPES } from "../services/service-request.service.js";
import { uploadSchema, type UploadBody } from "../utils/uploads.js";

export const createServiceRequestSchema = {
  body: {
    type: "object",
    required: ["name", "mobile", "email", "model", "serial", "issue", "description", "pincode"],
    additionalProperties: false,
    properties: {
      name: nameSchema,
      mobile: mobileSchema,
      email: emailSchema,
      model: { type: "string", minLength: 1, maxLength: 100 },
      serial: { type: "string", pattern: "^[A-Za-z0-9-]{8,20}$" },
      issue: { type: "string", minLength: 1, maxLength: 100 },
      description: { type: "string", minLength: 1, maxLength: 2000 },
      visitDate: { type: "string", format: "date" },
      pincode: { type: "string", pattern: "^[1-9][0-9]{5}$" },
      photo: uploadSchema(PHOTO_TYPES, PHOTO_MAX_BYTES),
    },
  },
} as const;

export interface CreateServiceRequestBody {
  name: string;
  mobile: string;
  email: string;
  model: string;
  serial: string;
  issue: string;
  description: string;
  visitDate?: string;
  pincode: string;
  photo?: UploadBody;
}
