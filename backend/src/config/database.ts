/**
 * MySQL connection settings, read from environment variables only.
 * Phase 1 does NOT open a connection — no MySQL driver is installed yet.
 * Phase 2: add `mysql2`, create a pool from this config and implement the repositories against it.
 */
import "./env.js";

export const databaseConfig = {
  host: process.env.DB_HOST ?? "localhost",
  port: Number.parseInt(process.env.DB_PORT ?? "3306", 10),
  database: process.env.DB_NAME ?? "warranty_db",
  user: process.env.DB_USER ?? "",
  // Never log or return this value.
  password: process.env.DB_PASSWORD ?? "",
};

export function isDatabaseConfigured(): boolean {
  return Boolean(databaseConfig.user && databaseConfig.password);
}
