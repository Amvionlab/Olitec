import { repositories } from "../repositories/index.js";
import type { UpdateProfileBody } from "../schemas/customer.schema.js";
import { NotFoundError } from "../utils/errors.js";

export const customerService = {
  async getProfile(customerId: string) {
    const customer = await repositories.customers.findById(customerId);
    if (!customer) throw new NotFoundError("Customer");
    return customer;
  },

  /** MOCK: returns the merged profile without saving it. */
  async updateProfile(customerId: string, changes: UpdateProfileBody) {
    const customer = await this.getProfile(customerId);
    return { ...customer, ...changes };
  },
};
