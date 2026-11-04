import type { FastifyPluginAsync } from "fastify";
import { optionalCustomer } from "../shared/auth.js";
import { dbOk } from "../shared/http.js";
import { pincodeSchema } from "../shared/schemas.js";
import { isPincodeServiceable } from "./pricing.js";
import { cartService } from "./cart.service.js";
import { getSettings } from "../shared/settings.js";

const itemIdParams = { type: "object", required: ["itemId"], properties: { itemId: { type: "integer", minimum: 1 } } } as const;
const quantity = { type: "integer", minimum: 1, maximum: 10000 } as const;

/** /api/ecommerce/cart — works for guests (cookie cart) and signed-in customers. */
export const cartRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", optionalCustomer);
  // Carts are personal: never cache them anywhere.
  app.addHook("onSend", async (_request, reply) => {
    reply.header("cache-control", "no-store");
  });

  app.get("/", async (request) => dbOk(await cartService.view(request)));

  app.post<{ Body: { productId: number; quantity: number } }>(
    "/items",
    { schema: { body: { type: "object", required: ["productId", "quantity"], additionalProperties: false, properties: { productId: { type: "integer", minimum: 1 }, quantity } } } },
    async (request, reply) => dbOk(await cartService.add(request, reply, request.body.productId, request.body.quantity), { persisted: true }),
  );

  app.patch<{ Params: { itemId: number }; Body: { quantity: number } }>(
    "/items/:itemId",
    { schema: { params: itemIdParams, body: { type: "object", required: ["quantity"], additionalProperties: false, properties: { quantity } } } },
    async (request) => dbOk(await cartService.update(request, request.params.itemId, request.body.quantity), { persisted: true }),
  );

  app.delete<{ Params: { itemId: number } }>("/items/:itemId", { schema: { params: itemIdParams } }, async (request) =>
    dbOk(await cartService.remove(request, request.params.itemId), { persisted: true }),
  );

  app.post<{ Body: { code: string } }>(
    "/coupon",
    { schema: { body: { type: "object", required: ["code"], additionalProperties: false, properties: { code: { type: "string", minLength: 2, maxLength: 40, pattern: "^[A-Za-z0-9_-]+$" } } } } },
    async (request, reply) => dbOk(await cartService.applyCoupon(request, reply, request.body.code), { persisted: true }),
  );

  app.delete("/coupon", async (request) => dbOk(await cartService.removeCoupon(request), { persisted: true }));

  app.get<{ Querystring: { pincode: string } }>(
    "/delivery-check",
    { schema: { querystring: { type: "object", required: ["pincode"], additionalProperties: false, properties: { pincode: pincodeSchema } } } },
    async (request) => {
      const { shipping } = await getSettings();
      return dbOk({ pincode: request.query.pincode, serviceable: await isPincodeServiceable(request.query.pincode), estimatedDelivery: shipping.estimatedDays || null });
    },
  );
};
