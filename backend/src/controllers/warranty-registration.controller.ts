import type { FastifyReply, FastifyRequest } from "fastify";
import type { CreateWarrantyRegistrationBody, WarrantyStatusLookupBody } from "../schemas/warranty-registration.schema.js";
import { warrantyRegistrationService } from "../services/warranty-registration.service.js";
import { ok, okWritten } from "../utils/api-response.js";

export const warrantyRegistrationController = {
  async lookupStatus(request: FastifyRequest<{ Body: WarrantyStatusLookupBody }>) {
    return ok(await warrantyRegistrationService.lookupStatus(request.body));
  },

  async create(request: FastifyRequest<{ Body: CreateWarrantyRegistrationBody }>, reply: FastifyReply) {
    const registration = await warrantyRegistrationService.create(request.body);
    return reply.status(201).send(okWritten(registration));
  },
};
