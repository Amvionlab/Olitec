import { repositories } from "../repositories/index.js";
import type { SupportRequest } from "../repositories/types.js";
import type { CreateSupportRequestBody } from "../schemas/support.schema.js";
import { BusinessRuleError } from "../utils/errors.js";

export const supportService = {
  async listForCustomer(customerId: string) {
    return repositories.support.findByCustomer(customerId);
  },

  async create(customerId: string, input: CreateSupportRequestBody): Promise<SupportRequest> {
    let warrantyId: string | null = null;
    if (input.warrantyNumber) {
      const owned = await repositories.warranties.findAll({ customerId, q: input.warrantyNumber });
      const match = owned.find((w) => w.warrantyNumber === input.warrantyNumber);
      if (!match) throw new BusinessRuleError("The warranty number does not belong to your account.");
      warrantyId = match.id;
    }
    return repositories.support.create({
      customerId,
      warrantyId,
      category: input.category,
      subject: input.subject.trim(),
      message: input.message.trim(),
      contactName: input.name.trim(),
      contactEmail: input.email.trim().toLowerCase(),
      contactMobile: input.mobile,
    });
  },
};
