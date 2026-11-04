import type { FastifyPluginAsync } from "fastify";
import { requireAdmin } from "../shared/auth.js";
import { dbOk } from "../shared/http.js";
import { numericIdParams, slugSchema, urlOrEmpty, type NumericIdParams } from "../shared/schemas.js";
import { categoryService, type CategoryInput } from "./categories.service.js";

const categoryProperties = {
  parentId: { anyOf: [{ type: "integer", minimum: 1 }, { type: "null" }] },
  name: { type: "string", minLength: 2, maxLength: 100 },
  slug: slugSchema,
  description: { type: "string", maxLength: 1000 },
  imageUrl: urlOrEmpty,
  displayOrder: { type: "integer", minimum: -10000, maximum: 10000 },
  isActive: { type: "boolean" },
  seoTitle: { type: "string", maxLength: 160 },
  seoDescription: { type: "string", maxLength: 320 },
} as const;

/** Public: /api/ecommerce/categories */
export const categoryRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => dbOk(await categoryService.tree()));
  app.get<{ Params: { slug: string } }>(
    "/:slug",
    { schema: { params: { type: "object", required: ["slug"], properties: { slug: slugSchema } } } },
    async (request) => dbOk(await categoryService.getBySlug(request.params.slug)),
  );
};

/** Admin: /api/ecommerce/admin/categories */
export const adminCategoryRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preValidation: requireAdmin("products.view") }, async () => dbOk(await categoryService.adminList()));

  app.post<{ Body: CategoryInput }>(
    "/",
    { preValidation: requireAdmin("categories.manage"), schema: { body: { type: "object", additionalProperties: false, required: ["name"], properties: categoryProperties } } },
    async (request, reply) => {
      reply.status(201);
      return dbOk(await categoryService.create(request, request.body), { persisted: true });
    },
  );

  app.patch<{ Params: NumericIdParams; Body: Partial<CategoryInput> }>(
    "/:id",
    { preValidation: requireAdmin("categories.manage"), schema: { ...numericIdParams, body: { type: "object", additionalProperties: false, minProperties: 1, properties: categoryProperties } } },
    async (request) => dbOk(await categoryService.update(request, request.params.id, request.body), { persisted: true }),
  );

  app.post<{ Body: { order: { id: number; displayOrder: number }[] } }>(
    "/reorder",
    {
      preValidation: requireAdmin("categories.manage"),
      schema: {
        body: {
          type: "object",
          required: ["order"],
          additionalProperties: false,
          properties: {
            order: {
              type: "array",
              maxItems: 500,
              items: { type: "object", required: ["id", "displayOrder"], additionalProperties: false, properties: { id: { type: "integer", minimum: 1 }, displayOrder: { type: "integer" } } },
            },
          },
        },
      },
    },
    async (request) => dbOk(await categoryService.reorder(request, request.body.order), { persisted: true }),
  );

  app.delete<{ Params: NumericIdParams }>("/:id", { preValidation: requireAdmin("categories.manage"), schema: numericIdParams }, async (request) => {
    await categoryService.remove(request, request.params.id);
    return dbOk({ deleted: true }, { persisted: true });
  });
};
