import type { FastifyPluginAsync } from "fastify";
import { serviceRequestController } from "../controllers/service-request.controller.js";
import { rateLimit } from "../modules/ecommerce/shared/rate-limit.js";
import { createServiceRequestSchema, type CreateServiceRequestBody } from "../schemas/service-request.schema.js";

// Public: the website's /service-request form works without an account, so it is rate limited per IP.
export const serviceRequestRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: CreateServiceRequestBody }>(
    "/",
    {
      schema: createServiceRequestSchema,
      preValidation: [rateLimit("service-request", 10, 600_000)],
      // The optional photo travels base64-encoded in the JSON body: 10 MB file ≈ 13.4 MB of base64.
      bodyLimit: 14 * 1024 * 1024,
    },
    serviceRequestController.create,
  );
};
