import type { FastifyPluginAsync } from "fastify";
import { requireAdmin } from "../shared/auth.js";
import { dbOk } from "../shared/http.js";
import { numericIdParams, paginationProperties, type NumericIdParams } from "../shared/schemas.js";
import { inventoryService } from "./inventory.service.js";

const MOVEMENT_TYPES = ["stock_in", "stock_out", "adjustment", "reservation", "release", "sale", "return"] as const;

/** /api/ecommerce/admin/inventory */
export const adminInventoryRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: { q?: string; stock?: "low" | "out" | "in"; categoryId?: number; page?: number; pageSize?: number } }>(
    "/",
    {
      preValidation: requireAdmin("inventory.view"),
      schema: {
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: { q: { type: "string", maxLength: 100 }, stock: { type: "string", enum: ["low", "out", "in"] }, categoryId: { type: "integer", minimum: 1 }, ...paginationProperties },
        },
      },
    },
    async (request) => {
      const { items, summary, meta } = await inventoryService.list(request.query);
      return dbOk({ items, summary }, meta);
    },
  );

  app.get<{ Querystring: { productId?: number; type?: (typeof MOVEMENT_TYPES)[number]; from?: string; to?: string; page?: number; pageSize?: number } }>(
    "/movements",
    {
      preValidation: requireAdmin("inventory.view"),
      schema: {
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {
            productId: { type: "integer", minimum: 1 },
            type: { type: "string", enum: MOVEMENT_TYPES },
            from: { type: "string", format: "date" },
            to: { type: "string", format: "date" },
            ...paginationProperties,
          },
        },
      },
    },
    async (request) => {
      const { items, meta } = await inventoryService.movements(request.query);
      return dbOk(items, meta);
    },
  );

  app.post<{ Params: NumericIdParams; Body: { type: "stock_in" | "stock_out" | "adjustment"; quantity: number; note?: string; lowStockThreshold?: number } }>(
    "/:id/adjust",
    {
      preValidation: requireAdmin("inventory.manage"),
      schema: {
        ...numericIdParams,
        body: {
          type: "object",
          required: ["type", "quantity"],
          additionalProperties: false,
          properties: {
            type: { type: "string", enum: ["stock_in", "stock_out", "adjustment"] },
            quantity: { type: "integer", minimum: 0, maximum: 1_000_000 },
            note: { type: "string", maxLength: 500 },
            lowStockThreshold: { type: "integer", minimum: 0, maximum: 100000 },
          },
        },
      },
    },
    async (request) => dbOk(await inventoryService.adjust(request, request.params.id, request.body), { persisted: true }),
  );

  app.post<{ Body: { apply?: boolean } }>(
    "/reconcile",
    { preValidation: requireAdmin("inventory.manage"), schema: { body: { type: "object", additionalProperties: false, properties: { apply: { type: "boolean" } } } } },
    async (request) => dbOk(await inventoryService.reconcile(request, request.body?.apply ?? false), { persisted: Boolean(request.body?.apply) }),
  );
};
