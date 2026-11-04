import type { FastifyPluginAsync } from "fastify";
import { customerOf, requireAdmin, requireCustomer } from "../shared/auth.js";
import { dbOk } from "../shared/http.js";
import { rateLimit } from "../shared/rate-limit.js";
import { numericIdParams, paginationProperties, type NumericIdParams } from "../shared/schemas.js";
import { productService } from "./products.service.js";
import { reviewService } from "./reviews.service.js";
import {
  adminListProductsSchema,
  brandBodySchema,
  createProductSchema,
  listProductsSchema,
  productStatuses,
  reviewBodySchema,
  slugParamsSchema,
  updateProductSchema,
  type AdminListProductsQuery,
  type ListProductsQuery,
  type ProductInput,
  type SlugParams,
} from "./products.schema.js";

/** Public catalogue: /api/ecommerce/products */
export const productRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: ListProductsQuery }>("/", { schema: listProductsSchema }, async (request) => {
    const { items, meta } = await productService.list(request.query);
    return dbOk(items, meta);
  });

  app.get<{ Querystring: { q?: string; category?: string } }>(
    "/facets",
    { schema: { querystring: { type: "object", additionalProperties: false, properties: { q: { type: "string", maxLength: 100 }, category: { type: "string", maxLength: 160 } } } } },
    async (request) => dbOk(await productService.facets(request.query)),
  );

  app.get<{ Querystring: { q: string } }>(
    "/suggest",
    { schema: { querystring: { type: "object", required: ["q"], additionalProperties: false, properties: { q: { type: "string", minLength: 2, maxLength: 100 } } } } },
    async (request) => dbOk(await productService.suggest(request.query.q)),
  );

  app.get("/sitemap", async () => dbOk(await productService.sitemapEntries()));

  app.get<{ Params: SlugParams }>("/:slug", { schema: slugParamsSchema }, async (request) => dbOk(await productService.getBySlug(request.params.slug)));

  app.get<{ Params: SlugParams; Querystring: { page?: number; pageSize?: number } }>(
    "/:slug/reviews",
    { schema: { ...slugParamsSchema, querystring: { type: "object", additionalProperties: false, properties: paginationProperties } } },
    async (request) => {
      const { items, distribution, meta } = await reviewService.listApproved(request.params.slug, request.query);
      return dbOk({ items, distribution }, meta);
    },
  );

  app.post<{ Params: SlugParams; Body: { rating: number; title?: string; body?: string } }>(
    "/:slug/reviews",
    { preHandler: [rateLimit("review", 10, 3600_000), requireCustomer], schema: { ...slugParamsSchema, ...reviewBodySchema } },
    async (request) => dbOk(await reviewService.submit(customerOf(request).id, request.params.slug, request.body)),
  );
};

/** Public brand list: /api/ecommerce/brands */
export const brandRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => dbOk(await productService.listBrands()));
};

/** Admin catalogue: /api/ecommerce/admin/products, /admin/brands, /admin/reviews */
export const adminProductRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: AdminListProductsQuery }>("/products", { preValidation: requireAdmin("products.view"), schema: adminListProductsSchema }, async (request) => {
    const { items, meta } = await productService.adminList(request.query);
    return dbOk(items, meta);
  });

  app.get<{ Params: NumericIdParams }>("/products/:id", { preValidation: requireAdmin("products.view"), schema: numericIdParams }, async (request) =>
    dbOk(await productService.adminGet(request.params.id)),
  );

  app.post<{ Body: ProductInput }>("/products", { preValidation: requireAdmin("products.manage"), schema: createProductSchema }, async (request, reply) => {
    reply.status(201);
    return dbOk(await productService.create(request, request.body), { persisted: true });
  });

  app.patch<{ Params: NumericIdParams; Body: Partial<ProductInput> }>(
    "/products/:id",
    { preValidation: requireAdmin("products.manage"), schema: { ...numericIdParams, ...updateProductSchema } },
    async (request) => dbOk(await productService.update(request, request.params.id, request.body), { persisted: true }),
  );

  app.patch<{ Params: NumericIdParams; Body: { status: (typeof productStatuses)[number] } }>(
    "/products/:id/status",
    {
      preValidation: requireAdmin("products.manage"),
      schema: { ...numericIdParams, body: { type: "object", required: ["status"], additionalProperties: false, properties: { status: { type: "string", enum: productStatuses } } } },
    },
    async (request) => dbOk(await productService.update(request, request.params.id, { status: request.body.status }), { persisted: true }),
  );

  app.delete<{ Params: NumericIdParams }>("/products/:id", { preValidation: requireAdmin("products.manage"), schema: numericIdParams }, async (request) => {
    await productService.remove(request, request.params.id);
    return dbOk({ deleted: true }, { persisted: true });
  });

  app.get("/brands", { preValidation: requireAdmin("products.view") }, async () => dbOk(await productService.listBrands(true)));

  app.post<{ Body: { name: string; slug?: string; isActive?: boolean } }>(
    "/brands",
    { preValidation: requireAdmin("products.manage"), schema: brandBodySchema },
    async (request) => dbOk(await productService.saveBrand(request, null, request.body), { persisted: true }),
  );

  app.patch<{ Params: NumericIdParams; Body: { name: string; slug?: string; isActive?: boolean } }>(
    "/brands/:id",
    { preValidation: requireAdmin("products.manage"), schema: { ...numericIdParams, ...brandBodySchema } },
    async (request) => dbOk(await productService.saveBrand(request, request.params.id, request.body), { persisted: true }),
  );

  app.get<{ Querystring: { status?: string; page?: number; pageSize?: number } }>(
    "/reviews",
    {
      preValidation: requireAdmin("products.manage"),
      schema: { querystring: { type: "object", additionalProperties: false, properties: { status: { type: "string", enum: ["pending", "approved", "rejected"] }, ...paginationProperties } } },
    },
    async (request) => {
      const { items, meta } = await reviewService.adminList(request.query.status, request.query);
      return dbOk(items, meta);
    },
  );

  app.patch<{ Params: NumericIdParams; Body: { status: "approved" | "rejected" } }>(
    "/reviews/:id",
    {
      preValidation: requireAdmin("products.manage"),
      schema: { ...numericIdParams, body: { type: "object", required: ["status"], additionalProperties: false, properties: { status: { type: "string", enum: ["approved", "rejected"] } } } },
    },
    async (request) => {
      await reviewService.moderate(request, request.params.id, request.body.status);
      return dbOk({ id: request.params.id, status: request.body.status }, { persisted: true });
    },
  );
};
