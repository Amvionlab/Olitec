import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env.js";
import { registerErrorHandling } from "./middleware/error-handler.js";
import { healthRoutes } from "./routes/health.routes.js";
import { apiRoutes } from "./routes/index.js";
import { migrateAuthTables } from "./db/migrate-auth.js";

/** Builds the Fastify app without starting it, so tests can use app.inject(). */
export async function buildApp(): Promise<FastifyInstance> {
  // Ensure OTP and verification tables exist
  await migrateAuthTables().catch((err) => {
    console.error("Migration error:", err);
  });

  const app = Fastify({
    logger: { level: env.logLevel },
    bodyLimit: 15 * 1024 * 1024, // 15 MB for base64 files
  });

  registerErrorHandling(app);

  await app.register(cors, {
    origin: env.corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  await app.register(healthRoutes);
  await app.register(apiRoutes, { prefix: "/api" });

  return app;
}
