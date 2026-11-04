import { buildApp } from "./app.js";
import { env } from "./config/env.js";

const app = await buildApp();

const shutdown = async (signal: string) => {
  app.log.info(`${signal} received, shutting down`);
  await app.close();
  process.exit(0);
};
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await app.listen({ host: env.host, port: env.port });
  app.log.warn("Phase 1 build: all /api responses use MOCK data and authentication is NOT implemented.");
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
