import type { FastifyPluginAsync } from "fastify";
import { warrantyRegistrationController } from "../controllers/warranty-registration.controller.js";
import { rateLimit } from "../modules/ecommerce/shared/rate-limit.js";
import {
  createWarrantyRegistrationSchema,
  warrantyStatusLookupSchema,
  type CreateWarrantyRegistrationBody,
  type WarrantyStatusLookupBody,
} from "../schemas/warranty-registration.schema.js";

// Public: the website's /warranties/register form works without an account, so it is rate limited per IP.
export const warrantyRegistrationRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: CreateWarrantyRegistrationBody }>(
    "/",
    {
      schema: createWarrantyRegistrationSchema,
      preValidation: [rateLimit("warranty-registration", 10, 600_000)],
      // Two documents travel base64-encoded in the JSON body: 2 × 5 MB ≈ 13.4 MB of base64.
      bodyLimit: 14 * 1024 * 1024,
    },
    warrantyRegistrationController.create,
  );

  // Public status check for /warranty-status. POST keeps the mobile number out of URLs and access logs;
  // the rate limit slows down guessing serial/mobile pairs.
  app.post<{ Body: WarrantyStatusLookupBody }>(
    "/status",
    { schema: warrantyStatusLookupSchema, preValidation: [rateLimit("warranty-status", 20, 600_000)] },
    warrantyRegistrationController.lookupStatus,
  );
};
