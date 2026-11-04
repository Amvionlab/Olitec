import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import { execute, query, queryOne } from "../../../db/pool.js";
import { BusinessRuleError, ConflictError, NotFoundError } from "../../../utils/errors.js";
import { audit } from "../shared/audit.js";
import { requireAdmin } from "../shared/auth.js";
import { dbOk, json, pageWindow } from "../shared/http.js";
import { dateTimeOrNull, numericIdParams, paginationProperties, type NumericIdParams } from "../shared/schemas.js";

interface CouponInput {
  code: string;
  description?: string | null;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  usageLimit?: number | null;
  perCustomerLimit?: number | null;
  newCustomersOnly?: boolean;
  appliesTo?: "all" | "products" | "categories";
  applicableIds?: number[];
  isActive?: boolean;
}

const nullableInt = { anyOf: [{ type: "integer", minimum: 1, maximum: 10_000_000 }, { type: "null" }] } as const;
const couponProperties = {
  code: { type: "string", minLength: 3, maxLength: 40, pattern: "^[A-Za-z0-9_-]+$" },
  description: { anyOf: [{ type: "string", maxLength: 255 }, { type: "null" }] },
  discountType: { type: "string", enum: ["percentage", "fixed"] },
  discountValue: { type: "number", exclusiveMinimum: 0, maximum: 10_000_000 },
  minOrderValue: { type: "number", minimum: 0, maximum: 100_000_000 },
  maxDiscount: { anyOf: [{ type: "number", exclusiveMinimum: 0 }, { type: "null" }] },
  startsAt: dateTimeOrNull,
  endsAt: dateTimeOrNull,
  usageLimit: nullableInt,
  perCustomerLimit: nullableInt,
  newCustomersOnly: { type: "boolean" },
  appliesTo: { type: "string", enum: ["all", "products", "categories"] },
  applicableIds: { type: "array", maxItems: 500, items: { type: "integer", minimum: 1 } },
  isActive: { type: "boolean" },
} as const;

function toCoupon(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    code: row.code,
    description: row.description,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    minOrderValue: Number(row.min_order_value),
    maxDiscount: row.max_discount === null ? null : Number(row.max_discount),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    usageLimit: row.usage_limit,
    perCustomerLimit: row.per_customer_limit,
    usedCount: Number(row.used_count),
    newCustomersOnly: Boolean(row.new_customers_only),
    appliesTo: row.applies_to,
    applicableIds: json<number[]>(row.applicable_ids, []),
    isActive: Boolean(row.is_active),
    totalDiscountGiven: Number(row.total_discount ?? 0),
    createdAt: row.created_at,
  };
}

function validate(input: Partial<CouponInput>) {
  if (input.discountType === "percentage" && input.discountValue !== undefined && input.discountValue > 100) throw new BusinessRuleError("A percentage discount cannot exceed 100%.");
  if (input.startsAt && input.endsAt && new Date(input.endsAt) <= new Date(input.startsAt)) throw new BusinessRuleError("The end date must be after the start date.");
  if (input.appliesTo && input.appliesTo !== "all" && !input.applicableIds?.length) throw new BusinessRuleError("Choose at least one product or category for this coupon.");
}

const toSqlDate = (value: string | null | undefined) => (value ? new Date(value).toISOString().slice(0, 19).replace("T", " ") : value);

async function getCoupon(id: number) {
  const row = await queryOne(
    "SELECT c.*, (SELECT SUM(discount) FROM ecom_coupon_usages u WHERE u.coupon_id = c.id) AS total_discount FROM ecom_coupons c WHERE c.id = ?",
    [id],
  );
  if (!row) throw new NotFoundError("Coupon");
  return toCoupon(row);
}

async function save(request: FastifyRequest, id: number | null, input: Partial<CouponInput>) {
  validate(input);
  const columns: Record<string, unknown> = {
    code: input.code?.toUpperCase(),
    description: input.description,
    discount_type: input.discountType,
    discount_value: input.discountValue,
    min_order_value: input.minOrderValue,
    max_discount: input.maxDiscount,
    starts_at: toSqlDate(input.startsAt),
    ends_at: toSqlDate(input.endsAt),
    usage_limit: input.usageLimit,
    per_customer_limit: input.perCustomerLimit,
    new_customers_only: input.newCustomersOnly,
    applies_to: input.appliesTo,
    applicable_ids: input.applicableIds && JSON.stringify(input.applicableIds),
    is_active: input.isActive,
  };
  const entries = Object.entries(columns).filter(([, value]) => value !== undefined);
  try {
    if (id) {
      if (!entries.length) return getCoupon(id);
      const result = await execute(`UPDATE ecom_coupons SET ${entries.map(([column]) => `${column} = ?`).join(", ")} WHERE id = ?`, [...entries.map(([, value]) => value), id]);
      if (!result.affectedRows) throw new NotFoundError("Coupon");
    } else {
      id = (await execute(`INSERT INTO ecom_coupons (${entries.map(([column]) => column).join(", ")}) VALUES (${entries.map(() => "?").join(", ")})`, entries.map(([, value]) => value))).insertId;
    }
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") throw new ConflictError("A coupon with this code already exists.");
    if ((error as { code?: string }).code === "ER_CHECK_CONSTRAINT_VIOLATED") throw new BusinessRuleError("The coupon values are not valid (check the discount and dates).");
    throw error;
  }
  await audit(request, id ? "coupon.save" : "coupon.create", "coupon", id, { code: input.code, fields: Object.keys(input) });
  return getCoupon(id);
}

/** /api/ecommerce/admin/coupons */
export const adminCouponRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: { q?: string; status?: "active" | "inactive" | "expired"; page?: number; pageSize?: number } }>(
    "/",
    {
      preValidation: requireAdmin("coupons.manage"),
      schema: {
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: { q: { type: "string", maxLength: 40 }, status: { type: "string", enum: ["active", "inactive", "expired"] }, ...paginationProperties },
        },
      },
    },
    async (request) => {
      const where = ["TRUE"];
      const params: unknown[] = [];
      if (request.query.q) {
        where.push("c.code LIKE ?");
        params.push(`%${request.query.q.toUpperCase()}%`);
      }
      if (request.query.status === "active") where.push("c.is_active = TRUE AND (c.ends_at IS NULL OR c.ends_at > UTC_TIMESTAMP())");
      if (request.query.status === "inactive") where.push("c.is_active = FALSE");
      if (request.query.status === "expired") where.push("c.ends_at <= UTC_TIMESTAMP()");
      const window = pageWindow(request.query);
      const [rows, count] = await Promise.all([
        query(
          `SELECT c.*, (SELECT SUM(discount) FROM ecom_coupon_usages u WHERE u.coupon_id = c.id) AS total_discount FROM ecom_coupons c
            WHERE ${where.join(" AND ")} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
          [...params, window.limit, window.offset],
        ),
        queryOne<{ total: number }>(`SELECT COUNT(*) AS total FROM ecom_coupons c WHERE ${where.join(" AND ")}`, params),
      ]);
      return dbOk(rows.map(toCoupon), window.meta(Number(count?.total ?? 0)));
    },
  );

  app.get<{ Params: NumericIdParams }>("/:id", { preValidation: requireAdmin("coupons.manage"), schema: numericIdParams }, async (request) => dbOk(await getCoupon(request.params.id)));

  app.post<{ Body: CouponInput }>(
    "/",
    {
      preValidation: requireAdmin("coupons.manage"),
      schema: { body: { type: "object", additionalProperties: false, required: ["code", "discountType", "discountValue"], properties: couponProperties } },
    },
    async (request, reply) => {
      reply.status(201);
      return dbOk(await save(request, null, request.body), { persisted: true });
    },
  );

  app.patch<{ Params: NumericIdParams; Body: Partial<CouponInput> }>(
    "/:id",
    { preValidation: requireAdmin("coupons.manage"), schema: { ...numericIdParams, body: { type: "object", additionalProperties: false, minProperties: 1, properties: couponProperties } } },
    async (request) => {
      const current = await getCoupon(request.params.id);
      // Validate against the merged result so partial updates cannot create an invalid combination.
      validate({ ...current, ...request.body } as Partial<CouponInput>);
      return dbOk(await save(request, request.params.id, request.body), { persisted: true });
    },
  );
};
