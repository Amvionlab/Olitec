import type { FastifyPluginAsync } from "fastify";
import { env } from "../config/env.js";
import { isDatabaseConfigured } from "../config/database.js";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/health", async () => ({
    success: true,
    data: {
      status: "ok",
      uptimeSeconds: Math.round(process.uptime()),
      environment: env.nodeEnv,
      dataSource: env.dataSource,
      // Only reports whether credentials are present; it does not open a connection.
      database: isDatabaseConfigured() ? "configured" : "not_configured",
      timestamp: new Date().toISOString(),
    },
  }));
};
