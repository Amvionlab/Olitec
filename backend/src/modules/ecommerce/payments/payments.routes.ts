import type { FastifyPluginAsync } from "fastify";
import { optionalCustomer, requireAdmin } from "../shared/auth.js";
import { dbOk, sendCsv } from "../shared/http.js";
import { rateLimit } from "../shared/rate-limit.js";
import { numericIdParams, paginationProperties, type NumericIdParams } from "../shared/schemas.js";
import { paymentService } from "./payments.service.js";

const orderNumber = { type: "string", pattern: "^OL-[0-9]{4}-[0-9]{6}$" } as const;
const token = { type: "string", minLength: 20, maxLength: 100 } as const;
const providerId = { type: "string", minLength: 5, maxLength: 64, pattern: "^[A-Za-z0-9_]+$" } as const;

/** /api/ecommerce/payments */
export const paymentRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: { orderNumber: string; token?: string } }>(
    "/initiate",
    {
      preHandler: [rateLimit("pay-initiate", 30, 600_000), optionalCustomer],
      schema: { body: { type: "object", required: ["orderNumber"], additionalProperties: false, properties: { orderNumber, token } } },
    },
    async (request) => dbOk(await paymentService.initiate(request, request.body.orderNumber, request.body.token)),
  );

  app.post<{ Body: { orderNumber: string; token?: string; providerOrderId: string; providerPaymentId: string; signature: string } }>(
    "/verify",
    {
      preHandler: [rateLimit("pay-verify", 30, 600_000), optionalCustomer],
      schema: {
        body: {
          type: "object",
          required: ["orderNumber", "providerOrderId", "providerPaymentId", "signature"],
          additionalProperties: false,
          properties: { orderNumber, token, providerOrderId: providerId, providerPaymentId: providerId, signature: { type: "string", pattern: "^[a-fA-F0-9]{64}$" } },
        },
      },
    },
    async (request) => dbOk(await paymentService.verify(request, request.body), { persisted: true }),
  );

  app.post<{ Body: { orderNumber: string; token?: string; providerOrderId: string; code?: string; description?: string } }>(
    "/failure",
    {
      preHandler: [rateLimit("pay-failure", 30, 600_000), optionalCustomer],
      schema: {
        body: {
          type: "object",
          required: ["orderNumber", "providerOrderId"],
          additionalProperties: false,
          properties: { orderNumber, token, providerOrderId: providerId, code: { type: "string", maxLength: 100 }, description: { type: "string", maxLength: 500 } },
        },
      },
    },
    async (request) => dbOk(await paymentService.reportFailure(request, request.body), { persisted: true }),
  );

  app.post<{ Body: { orderNumber: string; token?: string; providerOrderId: string; outcome: "success" | "failure" } }>(
    "/mock/complete",
    {
      preHandler: optionalCustomer,
      schema: {
        body: {
          type: "object",
          required: ["orderNumber", "providerOrderId", "outcome"],
          additionalProperties: false,
          properties: { orderNumber, token, providerOrderId: providerId, outcome: { type: "string", enum: ["success", "failure"] } },
        },
      },
    },
    async (request) => dbOk(await paymentService.completeMock(request, request.body), { persisted: true }),
  );
};

/**
 * Gateway webhooks: /api/ecommerce/payments/webhooks. Registered in its own encapsulated context so the
 * raw-body JSON parser below applies to these routes only.
 */
export const paymentWebhookRoutes: FastifyPluginAsync = async (app) => {
  app.addContentTypeParser("application/json", { parseAs: "string", bodyLimit: 1_048_576 }, (_request, body, done) => done(null, body));

  app.post("/razorpay", async (request, reply) => {
    const result = await paymentService.handleWebhook(request, String(request.body ?? ""));
    return reply.status(200).send(dbOk(result));
  });
};

/** /api/ecommerce/admin/payments and /admin/refunds */
export const adminPaymentRoutes: FastifyPluginAsync = async (app) => {
  const listQuery = {
    type: "object",
    additionalProperties: false,
    properties: {
      status: { type: "string", enum: ["created", "captured", "failed"] },
      q: { type: "string", maxLength: 100 },
      from: { type: "string", format: "date" },
      to: { type: "string", format: "date" },
      format: { type: "string", enum: ["json", "csv"] },
      ...paginationProperties,
    },
  } as const;

  app.get<{ Querystring: { status?: string; q?: string; from?: string; to?: string; format?: "json" | "csv"; page?: number; pageSize?: number } }>(
    "/payments",
    { preValidation: requireAdmin("payments.view"), schema: { querystring: listQuery } },
    async (request, reply) => {
      if (request.query.format === "csv") {
        const { items } = await paymentService.adminListPayments({ ...request.query, page: 1, pageSize: 100_000 });
        return sendCsv(
          reply,
          "payments.csv",
          ["Date", "Order", "Customer", "Email", "Provider", "Gateway order", "Gateway payment", "Method", "Amount", "Status", "Error"],
          items.map((item) => [item.createdAt, item.orderNumber, item.customerName, item.customerEmail, item.provider, item.providerOrderId, item.providerPaymentId, item.method, item.amount, item.status, item.errorDescription]),
        );
      }
      const { items, summary, meta } = await paymentService.adminListPayments(request.query);
      return dbOk({ items, summary }, meta);
    },
  );

  app.get<{ Querystring: { status?: string; page?: number; pageSize?: number } }>(
    "/refunds",
    {
      preValidation: requireAdmin("payments.view"),
      schema: { querystring: { type: "object", additionalProperties: false, properties: { status: { type: "string", enum: ["pending", "processing", "processed", "failed", "rejected"] }, ...paginationProperties } } },
    },
    async (request) => {
      const { items, meta } = await paymentService.adminListRefunds(request.query);
      return dbOk(items, meta);
    },
  );

  app.post<{ Body: { orderId: number; amount: number; reason: string } }>(
    "/refunds",
    {
      preValidation: requireAdmin("refunds.manage"),
      schema: {
        body: {
          type: "object",
          required: ["orderId", "amount", "reason"],
          additionalProperties: false,
          properties: { orderId: { type: "integer", minimum: 1 }, amount: { type: "number", exclusiveMinimum: 0 }, reason: { type: "string", minLength: 3, maxLength: 500 } },
        },
      },
    },
    async (request) => dbOk(await paymentService.adminCreateRefund(request, request.body.orderId, request.body.amount, request.body.reason), { persisted: true }),
  );

  app.post<{ Params: NumericIdParams; Body: { offlineReference?: string } }>(
    "/refunds/:id/process",
    {
      preValidation: requireAdmin("refunds.manage"),
      schema: { ...numericIdParams, body: { type: "object", additionalProperties: false, properties: { offlineReference: { type: "string", minLength: 3, maxLength: 60 } } } },
    },
    async (request) => dbOk(await paymentService.adminProcessRefund(request, request.params.id, request.body ?? {}), { persisted: true }),
  );

  app.post<{ Params: NumericIdParams; Body: { reason: string } }>(
    "/refunds/:id/reject",
    {
      preValidation: requireAdmin("refunds.manage"),
      schema: { ...numericIdParams, body: { type: "object", required: ["reason"], additionalProperties: false, properties: { reason: { type: "string", minLength: 3, maxLength: 500 } } } },
    },
    async (request) => {
      await paymentService.adminRejectRefund(request, request.params.id, request.body.reason);
      return dbOk({ id: request.params.id, status: "rejected" }, { persisted: true });
    },
  );
};
