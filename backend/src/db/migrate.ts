/**
 * Minimal SQL migration runner: applies database/migrations/NNN_*.sql in order, once each,
 * recording them in schema_migrations. Usage: `npm run db:migrate` (add `-- --status` to list only).
 *
 * Each file runs in one multi-statement call. MySQL DDL is not transactional, so a failed file can leave
 * partial changes — always back up the database before migrating production (see README).
 */
import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { databaseConfig, isDatabaseConfigured } from "../config/database.js";

const migrationsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../database/migrations");

async function main() {
  if (!isDatabaseConfigured()) {
    console.error("DB_USER and DB_PASSWORD must be set (backend/.env). Nothing was changed.");
    process.exit(1);
  }
  const statusOnly = process.argv.includes("--status");

  const admin = await mysql.createConnection({ ...databaseConfig, database: undefined });
  await admin.query(`CREATE DATABASE IF NOT EXISTS \`${databaseConfig.database.replace(/`/g, "")}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
  await admin.end();

  const connection = await mysql.createConnection({ ...databaseConfig, multipleStatements: true, timezone: "Z" });
  try {
    await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) NOT NULL PRIMARY KEY,
      checksum CHAR(64) NOT NULL,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE = InnoDB`);

    const [appliedRows] = await connection.query<mysql.RowDataPacket[]>("SELECT name, checksum FROM schema_migrations");
    const applied = new Map(appliedRows.map((row) => [row.name as string, row.checksum as string]));
    const files = (await readdir(migrationsDir)).filter((file) => /^\d{3}_.+\.sql$/.test(file)).sort();

    for (const file of files) {
      const sql = await readFile(path.join(migrationsDir, file), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const previous = applied.get(file);
      if (previous) {
        if (previous !== checksum) console.warn(`! ${file} changed after it was applied — create a new migration instead of editing it.`);
        else console.log(`  ${file} (applied)`);
        continue;
      }
      if (statusOnly) {
        console.log(`  ${file} (pending)`);
        continue;
      }
      console.log(`→ applying ${file}`);
      await connection.query(sql);
      await connection.query("INSERT INTO schema_migrations (name, checksum) VALUES (?, ?)", [file, checksum]);
    }
    console.log(statusOnly ? "Status listed." : "Migrations up to date.");
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
