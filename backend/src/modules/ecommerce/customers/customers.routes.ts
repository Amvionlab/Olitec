import type { FastifyPluginAsync } from "fastify";
import { customerOf, optionalCustomer, requireAdmin, requireCustomer } from "../shared/auth.js";
import { dbOk } from "../shared/http.js";
import { rateLimit } from "../shared/rate-limit.js";
import { addressSchema, emailSchema, mobileSchema, nameSchema, numericIdParams, paginationProperties, type NumericIdParams } from "../shared/schemas.js";
import { customerService, type AddressBody } from "./customers.service.js";

const addressBody = {
  ...addressSchema,
  properties: {
    ...addressSchema.properties,
    label: { type: "string", maxLength: 40 },
    isDefaultShipping: { type: "boolean" },
    isDefaultBilling: { type: "boolean" },
  },
} as const;
const productIdParams = { type: "object", required: ["productId"], properties: { productId: { type: "integer", minimum: 1 } } } as const;

/** Signed-in customer data: /api/ecommerce/account */
export const accountRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("onSend", async (_request, reply) => {
    reply.header("cache-control", "no-store");
  });

  app.get("/addresses", { preHandler: requireCustomer }, async (request) => dbOk(await customerService.listAddresses(customerOf(request).id)));

  app.post<{ Body: AddressBody }>("/addresses", { preHandler: requireCustomer, schema: { body: addressBody } }, async (request) =>
    dbOk(await customerService.saveAddress(customerOf(request).id, null, request.body), { persisted: true }),
  );

  app.patch<{ Params: NumericIdParams; Body: AddressBody }>("/addresses/:id", { preHandler: requireCustomer, schema: { ...numericIdParams, body: addressBody } }, async (request) =>
    dbOk(await customerService.saveAddress(customerOf(request).id, request.params.id, request.body), { persisted: true }),
  );

  app.delete<{ Params: NumericIdParams }>("/addresses/:id", { preHandler: requireCustomer, schema: numericIdParams }, async (request) =>
    dbOk(await customerService.deleteAddress(customerOf(request).id, request.params.id), { persisted: true }),
  );

  app.get("/wishlist", { preHandler: requireCustomer }, async (request) => dbOk(await customerService.wishlist(customerOf(request).id)));

  app.get("/wishlist/ids", { preHandler: optionalCustomer }, async (request) =>
    dbOk(request.ecomCustomer ? await customerService.wishlistIds(request.ecomCustomer.id) : []),
  );

  app.post<{ Params: { productId: number } }>("/wishlist/:productId", { preHandler: requireCustomer, schema: { params: productIdParams } }, async (request) =>
    dbOk(await customerService.addToWishlist(customerOf(request).id, request.params.productId), { persisted: true }),
  );

  app.delete<{ Params: { productId: number } }>("/wishlist/:productId", { preHandler: requireCustomer, schema: { params: productIdParams } }, async (request) =>
    dbOk(await customerService.removeFromWishlist(customerOf(request).id, request.params.productId), { persisted: true }),
  );

  app.get("/support", { preHandler: requireCustomer }, async (request) => dbOk(await customerService.listTickets(customerOf(request).id)));
};

/** Public contact/support form: /api/ecommerce/support */
export const supportRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: { name: string; email: string; phone?: string; subject: string; message: string; orderNumber?: string } }>(
    "/",
    {
      preHandler: [rateLimit("support", 5, 900_000), optionalCustomer],
      schema: {
        body: {
          type: "object",
          required: ["name", "email", "subject", "message"],
          additionalProperties: false,
          properties: {
            name: nameSchema,
            email: emailSchema,
            phone: mobileSchema,
            subject: { type: "string", minLength: 3, maxLength: 150 },
            message: { type: "string", minLength: 10, maxLength: 4000 },
            orderNumber: { type: "string", maxLength: 24 },
          },
        },
      },
    },
    async (request, reply) => {
      reply.status(201);
      return dbOk(await customerService.createTicket(request, request.body), { persisted: true });
    },
  );
};

/** /api/ecommerce/admin/customers and /admin/support */
export const adminCustomerRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: { q?: string; status?: "active" | "inactive"; page?: number; pageSize?: number } }>(
    "/customers",
    {
      preValidation: requireAdmin("customers.view"),
      schema: { querystring: { type: "object", additionalProperties: false, properties: { q: { type: "string", maxLength: 100 }, status: { type: "string", enum: ["active", "inactive"] }, ...paginationProperties } } },
    },
    async (request) => {
      const { items, meta } = await customerService.adminList(request.query);
      return dbOk(items, meta);
    },
  );

  app.get<{ Params: NumericIdParams }>("/customers/:id", { preValidation: requireAdmin("customers.view"), schema: numericIdParams }, async (request) =>
    dbOk(await customerService.adminGet(request.params.id)),
  );

  app.patch<{ Params: NumericIdParams; Body: { status: "active" | "inactive"; reason: string } }>(
    "/customers/:id/status",
    {
      preValidation: requireAdmin("customers.manage"),
      schema: {
        ...numericIdParams,
        body: { type: "object", required: ["status", "reason"], additionalProperties: false, properties: { status: { type: "string", enum: ["active", "inactive"] }, reason: { type: "string", minLength: 3, maxLength: 300 } } },
      },
    },
    async (request) => dbOk(await customerService.adminSetStatus(request, request.params.id, request.body.status, request.body.reason), { persisted: true }),
  );

  app.get<{ Querystring: { status?: string; q?: string; page?: number; pageSize?: number } }>(
    "/support",
    {
      preValidation: requireAdmin("support.manage"),
      schema: {
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: { status: { type: "string", enum: ["open", "in_progress", "resolved", "closed"] }, q: { type: "string", maxLength: 100 }, ...paginationProperties },
        },
      },
    },
    async (request) => {
      const { items, meta } = await customerService.adminTickets(request.query);
      return dbOk(items, meta);
    },
  );

  app.patch<{ Params: NumericIdParams; Body: { status?: string; response?: string; assignToMe?: boolean } }>(
    "/support/:id",
    {
      preValidation: requireAdmin("support.manage"),
      schema: {
        ...numericIdParams,
        body: {
          type: "object",
          minProperties: 1,
          additionalProperties: false,
          properties: { status: { type: "string", enum: ["open", "in_progress", "resolved", "closed"] }, response: { type: "string", minLength: 2, maxLength: 4000 }, assignToMe: { type: "boolean" } },
        },
      },
    },
    async (request) => dbOk(await customerService.adminUpdateTicket(request, request.params.id, request.body), { persisted: true }),
  );
};
