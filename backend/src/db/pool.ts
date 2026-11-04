/**
 * MySQL connection pool, created lazily from config/database.ts (environment variables only).
 * Used by the e-commerce module. Warranty routes still use their mock repositories and never touch this pool.
 */
import mysql, { type Pool, type PoolConnection, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { databaseConfig, isDatabaseConfigured } from "../config/database.js";
import { AppError } from "../utils/errors.js";

let pool: Pool | undefined;

export class DatabaseUnavailableError extends AppError {
  constructor() {
    super(503, "DATABASE_UNAVAILABLE", "The store is temporarily unavailable. Please try again shortly.");
  }
}

export function getPool(): Pool {
  if (!isDatabaseConfigured()) throw new DatabaseUnavailableError();
  if (!pool) {
    pool = mysql.createPool({
      ...databaseConfig,
      connectionLimit: Number.parseInt(process.env.DB_POOL_SIZE ?? "10", 10),
      timezone: "Z",
      dateStrings: false,
      decimalNumbers: true,
      supportBigNumbers: true,
      bigNumberStrings: false,
      charset: "utf8mb4",
    });
    // Timestamps are stored in UTC. Without this, DEFAULT CURRENT_TIMESTAMP / NOW() use the server's time zone
    // (e.g. IST) while the driver reads them as UTC, shifting every time by the server's offset.
    pool.pool.on("connection", (connection) => {
      connection.query("SET time_zone = '+00:00'");
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  await pool?.end();
  pool = undefined;
}

/** Anything that can run a query: the pool or a connection inside a transaction. */
export type Queryable = Pick<Pool, "query" | "execute"> | PoolConnection;

export async function query<T = RowDataPacket>(sql: string, params: unknown[] = [], db: Queryable = getPool()): Promise<T[]> {
  const [rows] = await db.query<RowDataPacket[]>(sql, params);
  return rows as T[];
}

export async function queryOne<T = RowDataPacket>(sql: string, params: unknown[] = [], db: Queryable = getPool()): Promise<T | undefined> {
  return (await query<T>(sql, params, db))[0];
}

export async function execute(sql: string, params: unknown[] = [], db: Queryable = getPool()): Promise<ResultSetHeader> {
  const [result] = await db.query<ResultSetHeader>(sql, params);
  return result;
}

/**
 * Runs `work` inside a transaction. Commits on success, rolls back on any error.
 * Use SELECT ... FOR UPDATE inside `work` to lock rows (stock, coupons, orders) against concurrent checkouts.
 */
export async function withTransaction<T>(work: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback().catch(() => undefined);
    throw error;
  } finally {
    connection.release();
  }
}
