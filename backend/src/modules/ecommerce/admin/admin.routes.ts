import type { FastifyPluginAsync } from "fastify";
import { execute, query, queryOne, withTransaction } from "../../../db/pool.js";
import { BusinessRuleError, ConflictError, ForbiddenError, NotFoundError } from "../../../utils/errors.js";
import { audit } from "../shared/audit.js";
import { adminOf, destroyAllSessions, hashPassword, requireAdmin } from "../shared/auth.js";
import { dbOk, json, pageWindow, sendCsv } from "../shared/http.js";
import { ECOM_PERMISSIONS, ROLE_LABELS, ROLE_PERMISSIONS, type EcomRole } from "../shared/permissions.js";
import { dateBounds, emailSchema, nameSchema, numericIdParams, paginationProperties, passwordSchema, type NumericIdParams } from "../shared/schemas.js";
import { hasPermission } from "../shared/permissions.js";
import { dashboardService } from "./dashboard.service.js";
import { REPORTS } from "./reports.js";

const SHOP_ROLES = ["shop_admin", "product_manager", "order_manager", "inventory_manager", "customer_support"] as const;
type ShopRole = (typeof SHOP_ROLES)[number];

/** /api/ecommerce/admin — dashboard, reports, staff users, audit logs */
export const adminMiscRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: { from?: string; to?: string; granularity?: "day" | "week" | "month" | "year" } }>(
    "/dashboard",
    {
      preValidation: requireAdmin("dashboard.view"),
      schema: {
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: { from: { type: "string", format: "date" }, to: { type: "string", format: "date" }, granularity: { type: "string", enum: ["day", "week", "month", "year"] } },
        },
      },
    },
    async (request) => dbOk(await dashboardService.summary(request.query)),
  );

  app.get("/reports", { preValidation: requireAdmin("reports.view") }, async (request) => {
    const admin = adminOf(request);
    return dbOk(
      Object.entries(REPORTS)
        .filter(([, report]) => hasPermission(admin.role, report.permission))
        .map(([key, report]) => ({ key, title: report.title, dated: report.dated, columns: report.columns.map(([, label]) => label) })),
    );
  });

  app.get<{ Params: { key: string }; Querystring: { from?: string; to?: string; format?: "json" | "csv"; page?: number; pageSize?: number } }>(
    "/reports/:key",
    {
      preValidation: requireAdmin("reports.view"),
      schema: {
        params: { type: "object", required: ["key"], properties: { key: { type: "string", enum: Object.keys(REPORTS) } } },
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: { from: { type: "string", format: "date" }, to: { type: "string", format: "date" }, format: { type: "string", enum: ["json", "csv"] }, ...paginationProperties },
        },
      },
    },
    async (request, reply) => {
      const report = REPORTS[request.params.key];
      // Report data follows the same permission as the underlying records.
      if (!hasPermission(adminOf(request).role, report.permission)) throw new ForbiddenError();
      const { from, to } = dateBounds(request.query);
      if (request.query.format === "csv") {
        const rows = await query<Record<string, unknown>>(`${report.sql} LIMIT 100000`, [from, to]);
        await audit(request, "report.export", "report", request.params.key, { from, to, rows: rows.length });
        return sendCsv(reply, `${request.params.key}-${from.slice(0, 10)}-to-${to.slice(0, 10)}.csv`, report.columns.map(([, label]) => label), rows.map((row) => report.columns.map(([column]) => row[column])));
      }
      const window = pageWindow(request.query);
      const [rows, count] = await Promise.all([
        query<Record<string, unknown>>(`${report.sql} LIMIT ? OFFSET ?`, [from, to, window.limit, window.offset]),
        queryOne<{ total: number }>(`SELECT COUNT(*) AS total FROM (${report.sql}) report`, [from, to]),
      ]);
      return dbOk(
        { title: report.title, dated: report.dated, columns: report.columns.map(([key, label]) => ({ key, label })), rows },
        window.meta(Number(count?.total ?? 0)),
      );
    },
  );

  // ------------------------------------------------------------------ staff users and roles

  app.get("/users/roles", { preValidation: requireAdmin("users.manage") }, async () =>
    dbOk({
      roles: SHOP_ROLES.map((role) => ({ role, label: ROLE_LABELS[role], permissions: ROLE_PERMISSIONS[role] })),
      permissions: ECOM_PERMISSIONS,
    }),
  );

  app.get("/users", { preValidation: requireAdmin("users.manage") }, async () => {
    const rows = await query(
      `SELECT a.id, a.name, a.email, a.role AS admin_role, a.is_active, a.last_login_at, a.created_at, r.role AS ecom_role
         FROM admins a LEFT JOIN ecom_admin_roles r ON r.admin_id = a.id ORDER BY a.name`,
    );
    return dbOk(
      rows.map((row) => {
        const role: EcomRole | null = row.admin_role === "super_admin" ? "super_admin" : (row.ecom_role ?? null);
        return {
          id: Number(row.id),
          name: row.name,
          email: row.email,
          warrantyRole: row.admin_role,
          shopRole: role,
          shopRoleLabel: role ? ROLE_LABELS[role] : "No shop access",
          isActive: Boolean(row.is_active),
          lastLoginAt: row.last_login_at,
          createdAt: row.created_at,
        };
      }),
    );
  });

  app.post<{ Body: { name: string; email: string; password: string; role: ShopRole } }>(
    "/users",
    {
      preValidation: requireAdmin("users.manage"),
      schema: {
        body: {
          type: "object",
          required: ["name", "email", "password", "role"],
          additionalProperties: false,
          properties: { name: nameSchema, email: emailSchema, password: passwordSchema, role: { type: "string", enum: SHOP_ROLES } },
        },
      },
    },
    async (request, reply) => {
      const { name, email, password, role } = request.body;
      const passwordHash = await hashPassword(password);
      const id = await withTransaction(async (db) => {
        try {
          // 'none' = no warranty-panel role; this account is e-commerce staff only.
          const result = await execute("INSERT INTO admins (name, email, password_hash, role) VALUES (?, ?, ?, 'none')", [name, email.toLowerCase(), passwordHash], db);
          await execute("INSERT INTO ecom_admin_roles (admin_id, role) VALUES (?, ?)", [result.insertId, role], db);
          await audit(request, "user.create", "admin", result.insertId, { email, role }, db);
          return result.insertId;
        } catch (error) {
          if ((error as { code?: string }).code === "ER_DUP_ENTRY") throw new ConflictError("An admin account with this email already exists. Assign a shop role to it instead.");
          throw error;
        }
      });
      reply.status(201);
      return dbOk({ id }, { persisted: true });
    },
  );

  app.patch<{ Params: NumericIdParams; Body: { role?: ShopRole | null; isActive?: boolean } }>(
    "/users/:id",
    {
      preValidation: requireAdmin("users.manage"),
      schema: {
        ...numericIdParams,
        body: {
          type: "object",
          minProperties: 1,
          additionalProperties: false,
          properties: { role: { anyOf: [{ type: "string", enum: SHOP_ROLES }, { type: "null" }] }, isActive: { type: "boolean" } },
        },
      },
    },
    async (request) => {
      const id = request.params.id;
      if (id === adminOf(request).id) throw new BusinessRuleError("You cannot change your own role or status.");
      const target = await queryOne<{ role: string }>("SELECT role FROM admins WHERE id = ?", [id]);
      if (!target) throw new NotFoundError("Admin");
      if (target.role === "super_admin") throw new BusinessRuleError("Super Admin access is managed outside the shop panel.");
      await withTransaction(async (db) => {
        if (request.body.role === null) await execute("DELETE FROM ecom_admin_roles WHERE admin_id = ?", [id], db);
        else if (request.body.role) await execute("INSERT INTO ecom_admin_roles (admin_id, role) VALUES (?, ?) ON DUPLICATE KEY UPDATE role = VALUES(role)", [id, request.body.role], db);
        if (request.body.isActive !== undefined) await execute("UPDATE admins SET is_active = ? WHERE id = ?", [request.body.isActive, id], db);
        await audit(request, "user.update", "admin", id, request.body, db);
      });
      // Role changes and deactivation take effect immediately.
      await destroyAllSessions("admin", id);
      return dbOk({ id, updated: true }, { persisted: true });
    },
  );

  // ------------------------------------------------------------------ audit logs

  app.get<{ Querystring: { action?: string; entityType?: string; adminId?: number; from?: string; to?: string; page?: number; pageSize?: number } }>(
    "/audit-logs",
    {
      preValidation: requireAdmin("audit.view"),
      schema: {
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {
            action: { type: "string", maxLength: 60 },
            entityType: { type: "string", maxLength: 40 },
            adminId: { type: "integer", minimum: 1 },
            from: { type: "string", format: "date" },
            to: { type: "string", format: "date" },
            ...paginationProperties,
          },
        },
      },
    },
    async (request) => {
      const where = ["TRUE"];
      const params: unknown[] = [];
      if (request.query.action) {
        where.push("l.action LIKE ?");
        params.push(`${request.query.action}%`);
      }
      if (request.query.entityType) {
        where.push("l.entity_type = ?");
        params.push(request.query.entityType);
      }
      if (request.query.adminId) {
        where.push("l.admin_id = ?");
        params.push(request.query.adminId);
      }
      if (request.query.from || request.query.to) {
        const { from, to } = dateBounds(request.query);
        where.push("l.created_at BETWEEN ? AND ?");
        params.push(from, to);
      }
      const window = pageWindow(request.query);
      const [rows, count] = await Promise.all([
        query(`SELECT l.*, a.name AS admin_name FROM ecom_audit_logs l LEFT JOIN admins a ON a.id = l.admin_id WHERE ${where.join(" AND ")} ORDER BY l.id DESC LIMIT ? OFFSET ?`, [...params, window.limit, window.offset]),
        queryOne<{ total: number }>(`SELECT COUNT(*) AS total FROM ecom_audit_logs l WHERE ${where.join(" AND ")}`, params),
      ]);
      return dbOk(
        rows.map((row) => ({
          id: Number(row.id),
          adminName: row.admin_name,
          action: row.action,
          entityType: row.entity_type,
          entityId: row.entity_id,
          details: json(row.details, null),
          ipAddress: row.ip_address,
          createdAt: row.created_at,
        })),
        window.meta(Number(count?.total ?? 0)),
      );
    },
  );
};
