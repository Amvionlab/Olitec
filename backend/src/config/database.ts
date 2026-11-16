import "./env.js";

export const databaseConfig = {
  host: process.env.DB_HOST ?? "localhost",
  port: Number.parseInt(process.env.DB_PORT ?? "3306", 10),
  database: process.env.DB_NAME ?? "warranty_db",
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
};

export function isDatabaseConfigured(): boolean {
  return Boolean(databaseConfig.user !== undefined && databaseConfig.user !== "");
}
