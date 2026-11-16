import { existsSync } from "node:fs";
import { resolve } from "node:path";

try {
  if (existsSync(resolve("backend/.env"))) {
    process.loadEnvFile(resolve("backend/.env"));
  } else if (existsSync(resolve(".env"))) {
    process.loadEnvFile(resolve(".env"));
  } else {
    process.loadEnvFile();
  }
} catch {
  // No .env file — fall back to the process environment and defaults below.
}

function toInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const nodeEnv = process.env.NODE_ENV ?? "development";

export const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  host: process.env.HOST ?? "127.0.0.1",
  port: toInt(process.env.PORT, 4000),
  logLevel: process.env.LOG_LEVEL ?? "info",
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://localhost:3002")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  dataSource: (process.env.DATA_SOURCE !== "mock" && process.env.DB_USER ? "database" : "mock") as
    | "mock"
    | "database",
} as const;
