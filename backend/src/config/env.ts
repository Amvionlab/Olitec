// Load .env when present (Node >= 20.12). Real deployments can inject variables directly instead.
try {
  process.loadEnvFile();
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
  // Localhost by default; set HOST=0.0.0.0 in container/server deployments.
  host: process.env.HOST ?? "127.0.0.1",
  port: toInt(process.env.PORT, 4000),
  logLevel: process.env.LOG_LEVEL ?? "info",
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000,http://localhost:3001,http://localhost:3002")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  /**
   * "database" (MySQL repositories) when DB_USER and DB_PASSWORD are set, otherwise the sample data in repositories/mock.
   * Set DATA_SOURCE=mock to force the sample data even with a database configured.
   */
  dataSource: (process.env.DATA_SOURCE !== "mock" && process.env.DB_USER && process.env.DB_PASSWORD ? "database" : "mock") as
    | "mock"
    | "database",
} as const;
