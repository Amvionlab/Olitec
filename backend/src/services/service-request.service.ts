import { repositories } from "../repositories/index.js";
import type { ServiceRequest } from "../repositories/types.js";
import type { CreateServiceRequestBody } from "../schemas/service-request.schema.js";
import { BusinessRuleError } from "../utils/errors.js";
import { decodeUpload } from "../utils/uploads.js";

export const PHOTO_TYPES = ["image/jpeg", "image/png"];
export const PHOTO_MAX_BYTES = 10 * 1024 * 1024;

export const serviceRequestService = {
  /** Public service request from the website form; saved with the contact details given. */
  async create(input: CreateServiceRequestBody): Promise<ServiceRequest> {
    // Compared in IST so "today" matches what the customer sees in India.
    const todayIst = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (input.visitDate && input.visitDate < todayIst) throw new BusinessRuleError("Preferred visit date cannot be in the past.");

    return repositories.serviceRequests.create({
      name: input.name.trim(),
      mobile: input.mobile,
      email: input.email.trim().toLowerCase(),
      productModel: input.model.trim(),
      serialNumber: input.serial.trim().toUpperCase(),
      issueType: input.issue.trim(),
      description: input.description.trim(),
      preferredVisitDate: input.visitDate ?? null,
      pincode: input.pincode,
      photo: input.photo ? decodeUpload(input.photo, "Photo", PHOTO_MAX_BYTES) : null,
    });
  },
};
