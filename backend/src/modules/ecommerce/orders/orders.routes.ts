import type { FastifyPluginAsync } from "fastify";
import { customerOf, optionalCustomer, requireAdmin, requireCustomer } from "../shared/auth.js";
import { dbOk } from "../shared/http.js";
import { rateLimit } from "../shared/rate-limit.js";
import { addressSchema, emailSchema, gstinSchema, mobileSchema, nameSchema, numericIdParams, paginationProperties, pincodeSchema, type NumericIdParams } from "../shared/schemas.js";
import { checkoutService, type CheckoutInput } from "./checkout.service.js";
import { renderInvoice } from "./invoice.js";
import { ORDER_STATUSES, PAYMENT_STATUSES, type OrderStatus } from "./order-status.js";
import { findOrderById } from "./orders.repository.js";
import { authorizeOrderAccess, orderService, type AdminOrderFilters } from "./orders.service.js";

const orderNumberParams = { type: "object", required: ["orderNumber"], properties: { orderNumber: { type: "string", pattern: "^OL-[0-9]{4}-[0-9]{6}$" } } } as const;
const tokenQuery = { type: "object", additionalProperties: false, properties: { token: { type: "string", minLength: 20, maxLength: 100 } } } as const;
const reasonBody = {
  type: "object",
  required: ["reason"],
  additionalProperties: false,
  properties: { reason: { type: "string", minLength: 5, maxLength: 1000 }, token: { type: "string", minLength: 20, maxLength: 100 } },
} as const;

const checkoutBody = {
  type: "object",
  additionalProperties: false,
  required: ["idempotencyKey", "contact", "billingSameAsShipping", "paymentMethod"],
  properties: {
    idempotencyKey: { type: "string", pattern: "^[A-Za-z0-9-]{16,64}$" },
    contact: {
      type: "object",
      additionalProperties: false,
      required: ["name", "email", "phone"],
      properties: { name: nameSchema, email: emailSchema, phone: mobileSchema },
    },
    shippingAddressId: { type: "integer", minimum: 1 },
    shippingAddress: addressSchema,
    billingSameAsShipping: { type: "boolean" },
    billingAddressId: { type: "integer", minimum: 1 },
    billingAddress: addressSchema,
    billingGstin: gstinSchema,
    paymentMethod: { type: "string", enum: ["online", "cod"] },
    customerNote: { type: "string", maxLength: 500 },
    saveAddress: { type: "boolean" },
    expectedTotal: { type: "number", minimum: 0 },
  },
} as const;

/** Customer checkout and orders: /api/ecommerce/checkout, /api/ecommerce/orders */
export const checkoutRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", optionalCustomer);
  app.addHook("onSend", async (_request, reply) => {
    reply.header("cache-control", "no-store");
  });

  app.get<{ Querystring: { pincode?: string } }>(
    "/preview",
    { schema: { querystring: { type: "object", additionalProperties: false, properties: { pincode: pincodeSchema } } } },
    async (request) => dbOk(await checkoutService.preview(request, request.query)),
  );

  app.post<{ Body: CheckoutInput }>("/orders", { preHandler: rateLimit("checkout", 20, 600_000), schema: { body: checkoutBody } }, async (request, reply) =>
    dbOk(await checkoutService.placeOrder(request, reply, request.body), { persisted: true }),
  );
};

export const orderRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", optionalCustomer);
  app.addHook("onSend", async (_request, reply) => {
    reply.header("cache-control", "no-store");
  });

  app.get<{ Querystring: { page?: number; pageSize?: number } }>(
    "/",
    { preHandler: requireCustomer, schema: { querystring: { type: "object", additionalProperties: false, properties: paginationProperties } } },
    async (request) => {
      const { items, meta } = await orderService.listForCustomer(customerOf(request).id, request.query);
      return dbOk(items, meta);
    },
  );

  app.post<{ Body: { orderNumber: string; email: string } }>(
    "/track",
    {
      preHandler: rateLimit("track", 30, 600_000),
      schema: { body: { type: "object", required: ["orderNumber", "email"], additionalProperties: false, properties: { orderNumber: { type: "string", minLength: 5, maxLength: 24 }, email: emailSchema } } },
    },
    async (request) => dbOk(await orderService.track(request.body.orderNumber, request.body.email)),
  );

  app.get<{ Params: { orderNumber: string }; Querystring: { token?: string } }>(
    "/:orderNumber",
    { schema: { params: orderNumberParams, querystring: tokenQuery } },
    async (request) => dbOk(await orderService.getForCustomer(request, request.params.orderNumber, request.query.token)),
  );

  app.post<{ Params: { orderNumber: string }; Body: { reason: string; token?: string } }>(
    "/:orderNumber/cancel",
    { preHandler: rateLimit("order-request", 10, 600_000), schema: { params: orderNumberParams, body: reasonBody } },
    async (request) => dbOk(await orderService.requestCancellation(request, request.params.orderNumber, request.body.reason, request.body.token), { persisted: true }),
  );

  app.post<{ Params: { orderNumber: string }; Body: { reason: string; token?: string } }>(
    "/:orderNumber/return",
    { preHandler: rateLimit("order-request", 10, 600_000), schema: { params: orderNumberParams, body: reasonBody } },
    async (request) => dbOk(await orderService.requestReturn(request, request.params.orderNumber, request.body.reason, request.body.token), { persisted: true }),
  );

  app.get<{ Params: { orderNumber: string }; Querystring: { token?: string } }>(
    "/:orderNumber/invoice",
    { schema: { params: orderNumberParams, querystring: tokenQuery } },
    async (request, reply) => {
      const order = await authorizeOrderAccess(request, request.params.orderNumber, request.query.token);
      return reply.type("text/html; charset=utf-8").header("x-robots-tag", "noindex").send(await renderInvoice(order));
    },
  );
};

/** Admin orders: /api/ecommerce/admin/orders */
export const adminOrderRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: AdminOrderFilters }>(
    "/",
    {
      preValidation: requireAdmin("orders.view"),
      schema: {
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {
            q: { type: "string", maxLength: 100 },
            status: { type: "string", enum: ORDER_STATUSES },
            paymentStatus: { type: "string", enum: PAYMENT_STATUSES },
            from: { type: "string", format: "date" },
            to: { type: "string", format: "date" },
            assignedToMe: { type: "boolean" },
            hasOpenRequest: { type: "boolean" },
            ...paginationProperties,
          },
        },
      },
    },
    async (request) => {
      const { items, meta } = await orderService.adminList(request, request.query);
      return dbOk(items, meta);
    },
  );

  app.get("/staff", { preValidation: requireAdmin("orders.view") }, async () => dbOk(await orderService.staffList()));

  app.get<{ Params: NumericIdParams }>("/:id", { preValidation: requireAdmin("orders.view"), schema: numericIdParams }, async (request) => dbOk(await orderService.adminGet(request.params.id)));

  app.patch<{ Params: NumericIdParams; Body: { status: OrderStatus; note?: string } }>(
    "/:id/status",
    {
      preValidation: requireAdmin("orders.manage"),
      schema: {
        ...numericIdParams,
        body: { type: "object", required: ["status"], additionalProperties: false, properties: { status: { type: "string", enum: ORDER_STATUSES }, note: { type: "string", maxLength: 500 } } },
      },
    },
    async (request) => dbOk(await orderService.adminUpdateStatus(request, request.params.id, request.body.status, request.body.note), { persisted: true }),
  );

  app.patch<{ Params: NumericIdParams; Body: { courierName?: string; trackingNumber?: string; trackingUrl?: string } }>(
    "/:id/shipping",
    {
      preValidation: requireAdmin("orders.manage"),
      schema: {
        ...numericIdParams,
        body: {
          type: "object",
          additionalProperties: false,
          minProperties: 1,
          properties: {
            courierName: { type: "string", minLength: 2, maxLength: 100 },
            trackingNumber: { type: "string", minLength: 3, maxLength: 100 },
            trackingUrl: { type: "string", maxLength: 512, pattern: "^https://" },
          },
        },
      },
    },
    async (request) => dbOk(await orderService.adminUpdateShipping(request, request.params.id, request.body), { persisted: true }),
  );

  app.patch<{ Params: NumericIdParams; Body: { adminId: number | null } }>(
    "/:id/assign",
    {
      preValidation: requireAdmin("orders.manage"),
      schema: { ...numericIdParams, body: { type: "object", required: ["adminId"], additionalProperties: false, properties: { adminId: { anyOf: [{ type: "integer", minimum: 1 }, { type: "null" }] } } } },
    },
    async (request) => dbOk(await orderService.adminAssign(request, request.params.id, request.body.adminId), { persisted: true }),
  );

  app.post<{ Params: NumericIdParams; Body: { note: string } }>(
    "/:id/notes",
    {
      preValidation: requireAdmin("orders.view"),
      schema: { ...numericIdParams, body: { type: "object", required: ["note"], additionalProperties: false, properties: { note: { type: "string", minLength: 2, maxLength: 1000 } } } },
    },
    async (request) => dbOk(await orderService.adminAddNote(request, request.params.id, request.body.note), { persisted: true }),
  );

  app.post<{ Params: { id: number; requestId: number }; Body: { decision: "approved" | "rejected"; remark: string } }>(
    "/:id/requests/:requestId",
    {
      preValidation: requireAdmin("orders.manage"),
      schema: {
        params: { type: "object", required: ["id", "requestId"], properties: { id: { type: "integer", minimum: 1 }, requestId: { type: "integer", minimum: 1 } } },
        body: {
          type: "object",
          required: ["decision", "remark"],
          additionalProperties: false,
          properties: { decision: { type: "string", enum: ["approved", "rejected"] }, remark: { type: "string", minLength: 3, maxLength: 500 } },
        },
      },
    },
    async (request) =>
      dbOk(await orderService.adminDecideRequest(request, request.params.id, request.params.requestId, request.body.decision, request.body.remark), { persisted: true }),
  );

  app.get<{ Params: NumericIdParams }>("/:id/invoice", { preValidation: requireAdmin("orders.view"), schema: numericIdParams }, async (request, reply) => {
    const order = await findOrderById(request.params.id);
    if (!order) return reply.status(404).send();
    return reply.type("text/html; charset=utf-8").send(await renderInvoice(order));
  });
};
