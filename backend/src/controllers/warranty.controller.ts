import type { FastifyReply, FastifyRequest } from "fastify";
import { getCustomerId } from "../middleware/auth.js";
import type { IdParams } from "../schemas/common.schema.js";
import type { ListMyWarrantiesQuery, RegisterWarrantyBody } from "../schemas/warranty.schema.js";
import { warrantyService } from "../services/warranty.service.js";
import { ok, okWritten } from "../utils/api-response.js";

export const warrantyController = {
  async listMine(request: FastifyRequest<{ Querystring: ListMyWarrantiesQuery }>) {
    const { items, meta } = await warrantyService.listForCustomer(getCustomerId(request.principal), request.query);
    return ok(items, meta);
  },

  async getMine(request: FastifyRequest<{ Params: IdParams }>) {
    return ok(await warrantyService.getForCustomer(getCustomerId(request.principal), request.params.id));
  },

  async register(request: FastifyRequest<{ Body: RegisterWarrantyBody }>, reply: FastifyReply) {
    const warranty = await warrantyService.register(getCustomerId(request.principal), request.body);
    return reply.status(201).send(okWritten(warranty));
  },
};
