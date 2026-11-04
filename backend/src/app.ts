import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env.js";
import { registerErrorHandling } from "./middleware/error-handler.js";
import { healthRoutes } from "./routes/health.routes.js";
import { apiRoutes } from "./routes/index.js";

/** Builds the Fastify app without starting it, so tests can use app.inject(). */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: env.logLevel },
    bodyLimit: 1_048_576, // 1 MB JSON bodies; invoice uploads will use a separate multipart route in Phase 2.
  });

  registerErrorHandling(app);

  await app.register(cors, {
    origin: env.corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });

  await app.register(healthRoutes);
  await app.register(apiRoutes, { prefix: "/api" });

  return app;
}
