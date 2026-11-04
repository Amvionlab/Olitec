import { execute, queryOne, withTransaction, type Queryable } from "../../../db/pool.js";

const PREFIX = { order: "OL", refund: "RF", enquiry: "BQ", quotation: "QT", ticket: "TK" } as const;

/**
 * Next human-facing document number, e.g. OL-2026-000042. Gap-free per year and safe under concurrency
 * (row lock on ecom_sequences). Pass the caller's transaction connection so the number rolls back with it.
 */
export async function nextNumber(kind: keyof typeof PREFIX, db?: Queryable): Promise<string> {
  const run = async (connection: Queryable) => {
    const year = new Date().getUTCFullYear();
    await execute(
      "INSERT INTO ecom_sequences (name, year, next_value) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE next_value = next_value",
      [kind, year],
      connection,
    );
    const row = await queryOne<{ next_value: number }>("SELECT next_value FROM ecom_sequences WHERE name = ? AND year = ? FOR UPDATE", [kind, year], connection);
    const value = Number(row?.next_value ?? 1);
    await execute("UPDATE ecom_sequences SET next_value = ? WHERE name = ? AND year = ?", [value + 1, kind, year], connection);
    return `${PREFIX[kind]}-${year}-${String(value).padStart(6, "0")}`;
  };
  return db ? run(db) : withTransaction(run);
}
