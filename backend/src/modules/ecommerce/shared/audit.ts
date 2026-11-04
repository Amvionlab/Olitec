import type { FastifyRequest } from "fastify";
import { execute, type Queryable } from "../../../db/pool.js";

/** Appends an audit log entry for an administrative or financial operation. Never include secrets in `details`. */
export async function audit(
  request: FastifyRequest,
  action: string,
  entityType: string,
  entityId: string | number | null,
  details?: Record<string, unknown>,
  db?: Queryable,
): Promise<void> {
  await execute(
    "INSERT INTO ecom_audit_logs (admin_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
    [request.ecomAdmin?.id ?? null, action, entityType, entityId === null ? null : String(entityId), details ? JSON.stringify(details) : null, request.ip],
    db,
  );
}
