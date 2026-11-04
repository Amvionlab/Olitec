import type { FastifyReply, FastifyRequest } from "fastify";
import type { CreateServiceRequestBody } from "../schemas/service-request.schema.js";
import { serviceRequestService } from "../services/service-request.service.js";
import { okWritten } from "../utils/api-response.js";

export const serviceRequestController = {
  async create(request: FastifyRequest<{ Body: CreateServiceRequestBody }>, reply: FastifyReply) {
    const ticket = await serviceRequestService.create(request.body);
    return reply.status(201).send(okWritten(ticket));
  },
};
