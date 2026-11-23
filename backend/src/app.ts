import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env.js";
import { registerErrorHandling } from "./middleware/error-handler.js";
import { healthRoutes } from "./routes/health.routes.js";
import { apiRoutes } from "./routes/index.js";
import { migrateAuthTables } from "./db/migrate-auth.js";
import multipart from "@fastify/multipart";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
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
  const uploadsRoot = path.resolve(process.cwd(), "uploads");
  app.get<{ Params: { "*": string } }>("/uploads/*", async (request, reply) => {
    let relativePath: string;
    try {
      relativePath = decodeURIComponent(request.params["*"]);
    } catch {
      return reply.code(400).send({ message: "Invalid file path" });
    }

    const filePath = path.resolve(uploadsRoot, relativePath);
    if (!filePath.startsWith(`${uploadsRoot}${path.sep}`)) {
      return reply.code(403).send({ message: "Forbidden" });
    }

    try {
      if (!(await stat(filePath)).isFile()) {
        return reply.code(404).send({ message: "Not found" });
      }
    } catch {
      return reply.code(404).send({ message: "Not found" });
    }

    return reply.send(createReadStream(filePath));
  });
  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB
      files: 1,
    },
  });

  registerErrorHandling(app);

  await app.register(cors, {
    origin: (origin, cb) => cb(null, true),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  await app.register(healthRoutes);
  await app.register(apiRoutes, { prefix: "/api" });

  const publicRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../public",
  );
  app.get<{ Params: { "*": string } }>("/public/*", async (request, reply) => {
    let relativePath: string;
    try {
      relativePath = decodeURIComponent(request.params["*"]);
    } catch {
      return reply.code(400).send({ message: "Invalid file path" });
    }

    const filePath = path.resolve(publicRoot, relativePath);
    if (!filePath.startsWith(`${publicRoot}${path.sep}`)) {
      return reply.code(403).send({ message: "Forbidden" });
    }

    try {
      if (!(await stat(filePath)).isFile()) {
        return reply.code(404).send({ message: "Not found" });
      }
    } catch {
      return reply.code(404).send({ message: "Not found" });
    }

    const contentTypes: Record<string, string> = {
      ".css": "text/css; charset=utf-8",
      ".gif": "image/gif",
      ".html": "text/html; charset=utf-8",
      ".jpeg": "image/jpeg",
      ".jpg": "image/jpeg",
      ".js": "text/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".png": "image/png",
      ".svg": "image/svg+xml",
      ".txt": "text/plain; charset=utf-8",
      ".webp": "image/webp",
    };
    const contentType = contentTypes[path.extname(filePath).toLowerCase()];
    if (contentType) reply.type(contentType);
    return reply.send(createReadStream(filePath));
  });

  return app;
}
