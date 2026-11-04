import type { FastifyRequest } from "fastify";
import { getCustomerId } from "../middleware/auth.js";
import type { UpdateProfileBody } from "../schemas/customer.schema.js";
import { customerService } from "../services/customer.service.js";
import { ok, okNotPersisted } from "../utils/api-response.js";

export const customerController = {
  async getMe(request: FastifyRequest) {
    return ok(await customerService.getProfile(getCustomerId(request.principal)));
  },

  async updateMe(request: FastifyRequest<{ Body: UpdateProfileBody }>) {
    return okNotPersisted(await customerService.updateProfile(getCustomerId(request.principal), request.body));
  },
};
