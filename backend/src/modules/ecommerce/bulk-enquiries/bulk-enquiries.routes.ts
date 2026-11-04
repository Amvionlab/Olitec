import type { FastifyPluginAsync } from "fastify";
import { adminOf, optionalCustomer, requireAdmin } from "../shared/auth.js";
import { dbOk } from "../shared/http.js";
import { rateLimit } from "../shared/rate-limit.js";
import { emailSchema, gstinSchema, mobileSchema, nameSchema, numericIdParams, paginationProperties, type NumericIdParams } from "../shared/schemas.js";
import { bulkEnquiryService, ENQUIRY_STATUSES, type EnquiryInput, type EnquiryStatus, type QuotationInput } from "./bulk-enquiries.service.js";

const enquiryBody = {
  type: "object",
  additionalProperties: false,
  required: ["contactName", "email", "phone", "products", "deliveryLocation"],
  properties: {
    contactName: nameSchema,
    companyName: { type: "string", maxLength: 150 },
    email: emailSchema,
    phone: mobileSchema,
    products: {
      type: "array",
      minItems: 1,
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "quantity"],
        properties: { productId: { type: "integer", minimum: 1 }, name: { type: "string", minLength: 2, maxLength: 200 }, quantity: { type: "integer", minimum: 1, maximum: 1_000_000 } },
      },
    },
    deliveryLocation: { type: "string", minLength: 3, maxLength: 200 },
    gstin: gstinSchema,
    requirements: { type: "string", maxLength: 2000 },
  },
} as const;

const quotationBody = {
  type: "object",
  additionalProperties: false,
  required: ["items", "validUntil"],
  properties: {
    items: {
      type: "array",
      minItems: 1,
      maxItems: 50,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "quantity", "unitPrice", "taxRate"],
        properties: {
          productId: { type: "integer", minimum: 1 },
          name: { type: "string", minLength: 2, maxLength: 200 },
          sku: { type: "string", maxLength: 64 },
          quantity: { type: "integer", minimum: 1, maximum: 1_000_000 },
          unitPrice: { type: "number", minimum: 0, maximum: 100_000_000 },
          taxRate: { type: "number", minimum: 0, maximum: 40 },
        },
      },
    },
    shippingTotal: { type: "number", minimum: 0 },
    validUntil: { type: "string", format: "date" },
    terms: { type: "string", maxLength: 2000 },
    status: { type: "string", enum: ["draft", "sent"] },
  },
} as const;

/** Public: /api/ecommerce/bulk-enquiries */
export const bulkEnquiryRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: EnquiryInput }>("/", { preHandler: [rateLimit("enquiry", 5, 900_000), optionalCustomer], schema: { body: enquiryBody } }, async (request, reply) => {
    reply.status(201);
    return dbOk(await bulkEnquiryService.create(request, request.body), { persisted: true });
  });
};

/** Admin: /api/ecommerce/admin/bulk-enquiries */
export const adminBulkEnquiryRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preValidation", requireAdmin("enquiries.manage"));

  app.get<{ Querystring: { status?: EnquiryStatus; q?: string; assignedToMe?: boolean; page?: number; pageSize?: number } }>(
    "/",
    {
      schema: {
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: { status: { type: "string", enum: ENQUIRY_STATUSES }, q: { type: "string", maxLength: 100 }, assignedToMe: { type: "boolean" }, ...paginationProperties },
        },
      },
    },
    async (request) => {
      const { items, counts, meta } = await bulkEnquiryService.adminList(request.query, adminOf(request).id);
      return dbOk({ items, counts }, meta);
    },
  );

  app.get<{ Params: NumericIdParams }>("/:id", { schema: numericIdParams }, async (request) => dbOk(await bulkEnquiryService.adminGet(request.params.id)));

  app.patch<{ Params: NumericIdParams; Body: { status?: EnquiryStatus; assignedAdminId?: number | null; convertedOrderNumber?: string } }>(
    "/:id",
    {
      schema: {
        ...numericIdParams,
        body: {
          type: "object",
          additionalProperties: false,
          minProperties: 1,
          properties: {
            status: { type: "string", enum: ENQUIRY_STATUSES },
            assignedAdminId: { anyOf: [{ type: "integer", minimum: 1 }, { type: "null" }] },
            convertedOrderNumber: { type: "string", pattern: "^OL-[0-9]{4}-[0-9]{6}$" },
          },
        },
      },
    },
    async (request) => dbOk(await bulkEnquiryService.adminUpdate(request, request.params.id, request.body), { persisted: true }),
  );

  app.post<{ Params: NumericIdParams; Body: { note: string } }>(
    "/:id/notes",
    { schema: { ...numericIdParams, body: { type: "object", required: ["note"], additionalProperties: false, properties: { note: { type: "string", minLength: 2, maxLength: 1000 } } } } },
    async (request) => dbOk(await bulkEnquiryService.addNote(request, request.params.id, request.body.note), { persisted: true }),
  );

  app.post<{ Params: NumericIdParams; Body: QuotationInput }>("/:id/quotations", { schema: { ...numericIdParams, body: quotationBody } }, async (request) =>
    dbOk(await bulkEnquiryService.createQuotation(request, request.params.id, request.body), { persisted: true }),
  );

  app.patch<{ Params: NumericIdParams; Body: { status: "draft" | "sent" | "accepted" | "rejected" | "expired" } }>(
    "/quotations/:id",
    {
      schema: {
        ...numericIdParams,
        body: { type: "object", required: ["status"], additionalProperties: false, properties: { status: { type: "string", enum: ["draft", "sent", "accepted", "rejected", "expired"] } } },
      },
    },
    async (request) => dbOk(await bulkEnquiryService.setQuotationStatus(request, request.params.id, request.body.status), { persisted: true }),
  );

  app.get<{ Params: NumericIdParams }>("/quotations/:id/document", { schema: numericIdParams }, async (request, reply) =>
    reply.type("text/html; charset=utf-8").send(await bulkEnquiryService.renderQuotation(request.params.id)),
  );
};
