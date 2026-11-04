import type { FastifyReply, FastifyRequest } from "fastify";
import { getCustomerId } from "../middleware/auth.js";
import type { CreateSupportRequestBody } from "../schemas/support.schema.js";
import { supportService } from "../services/support.service.js";
import { ok, okWritten } from "../utils/api-response.js";

export const supportController = {
  async listMine(request: FastifyRequest) {
    return ok(await supportService.listForCustomer(getCustomerId(request.principal)));
  },

  async create(request: FastifyRequest<{ Body: CreateSupportRequestBody }>, reply: FastifyReply) {
    const ticket = await supportService.create(getCustomerId(request.principal), request.body);
    return reply.status(201).send(okWritten(ticket));
  },
};
