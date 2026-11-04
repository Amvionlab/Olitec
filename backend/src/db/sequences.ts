import { execute, queryOne, type Queryable } from "./pool.js";

/**
 * Next human-facing number for the warranty platform, e.g. WR-2026-000042 or SR-2026-00042.
 * Uses the same ecom_sequences table and row lock as the e-commerce module, so it must run inside a transaction
 * (pass the connection) and the number rolls back with it.
 */
export async function nextSequenceNumber(name: string, prefix: string, digits: number, db: Queryable): Promise<string> {
  const year = new Date().getUTCFullYear();
  await execute(
    "INSERT INTO ecom_sequences (name, year, next_value) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE next_value = next_value",
    [name, year],
    db,
  );
  const row = await queryOne<{ next_value: number }>("SELECT next_value FROM ecom_sequences WHERE name = ? AND year = ? FOR UPDATE", [name, year], db);
  const value = Number(row?.next_value ?? 1);
  await execute("UPDATE ecom_sequences SET next_value = ? WHERE name = ? AND year = ?", [value + 1, name, year], db);
  return `${prefix}-${year}-${String(value).padStart(digits, "0")}`;
}
