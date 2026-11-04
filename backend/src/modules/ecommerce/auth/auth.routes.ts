import type { FastifyPluginAsync } from "fastify";
import { adminOf, customerOf, destroySession, optionalCustomer, requireAdmin, requireCustomer } from "../shared/auth.js";
import { audit } from "../shared/audit.js";
import { dbOk } from "../shared/http.js";
import { rateLimit } from "../shared/rate-limit.js";
import { emailSchema, mobileSchema, nameSchema, passwordSchema } from "../shared/schemas.js";
import { authService } from "./auth.service.js";

const loginBody = {
  type: "object",
  required: ["email", "password"],
  additionalProperties: false,
  properties: { email: emailSchema, password: { type: "string", minLength: 1, maxLength: 128 } },
} as const;
const forgotBody = { type: "object", required: ["email"], additionalProperties: false, properties: { email: emailSchema } } as const;
const resetBody = {
  type: "object",
  required: ["token", "password"],
  additionalProperties: false,
  properties: { token: { type: "string", minLength: 20, maxLength: 100 }, password: passwordSchema },
} as const;
const changePasswordBody = {
  type: "object",
  required: ["currentPassword", "newPassword"],
  additionalProperties: false,
  properties: { currentPassword: { type: "string", minLength: 1, maxLength: 128 }, newPassword: passwordSchema },
} as const;

const noStore = async (_request: unknown, reply: { header: (key: string, value: string) => unknown }) => {
  reply.header("cache-control", "no-store");
};

/** Customer auth: /api/ecommerce/auth */
export const authRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("onSend", noStore);

  app.post<{ Body: { name: string; email: string; mobile: string; password: string } }>(
    "/register",
    {
      preHandler: rateLimit("register", 10, 3600_000),
      schema: {
        body: {
          type: "object",
          required: ["name", "email", "mobile", "password"],
          additionalProperties: false,
          properties: { name: nameSchema, email: emailSchema, mobile: mobileSchema, password: passwordSchema },
        },
      },
    },
    async (request, reply) => {
      reply.status(201);
      return dbOk(await authService.register(request, reply, request.body), { persisted: true });
    },
  );

  app.post<{ Body: { email: string; password: string } }>("/login", { preHandler: rateLimit("login", 10, 900_000), schema: { body: loginBody } }, async (request, reply) =>
    dbOk(await authService.login(request, reply, request.body)),
  );

  app.post("/logout", async (request, reply) => {
    await authService.logout(request, reply);
    return dbOk({ signedOut: true });
  });

  /** Returns the signed-in customer, or null (200) for guests so the storefront can render either state. */
  app.get("/me", { preHandler: optionalCustomer }, async (request) => dbOk(request.ecomCustomer ?? null));

  app.patch<{ Body: { name?: string; mobile?: string } }>(
    "/me",
    {
      preHandler: requireCustomer,
      schema: { body: { type: "object", minProperties: 1, additionalProperties: false, properties: { name: nameSchema, mobile: mobileSchema } } },
    },
    async (request) => dbOk(await authService.updateProfile(customerOf(request).id, request.body), { persisted: true }),
  );

  app.post<{ Body: { currentPassword: string; newPassword: string } }>(
    "/change-password",
    { preHandler: [rateLimit("change-password", 10, 900_000), requireCustomer], schema: { body: changePasswordBody } },
    async (request, reply) => {
      await authService.changePassword(request, reply, "customer", customerOf(request).id, request.body.currentPassword, request.body.newPassword);
      return dbOk({ changed: true }, { persisted: true });
    },
  );

  app.post<{ Body: { email: string } }>("/forgot-password", { preHandler: rateLimit("forgot", 5, 900_000), schema: { body: forgotBody } }, async (request) =>
    dbOk(await authService.forgotPassword(request, "customer", request.body.email)),
  );

  app.post<{ Body: { token: string; password: string } }>("/reset-password", { preHandler: rateLimit("reset", 10, 900_000), schema: { body: resetBody } }, async (request) =>
    dbOk(await authService.resetPassword("customer", request.body.token, request.body.password), { persisted: true }),
  );
};

/** Admin auth: /api/ecommerce/admin/auth */
export const adminAuthRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("onSend", noStore);

  app.post<{ Body: { email: string; password: string } }>("/login", { preHandler: rateLimit("admin-login", 5, 900_000), schema: { body: loginBody } }, async (request, reply) =>
    dbOk(await authService.adminLogin(request, reply, request.body)),
  );

  app.post("/logout", async (request, reply) => {
    await destroySession(request, reply, "admin");
    return dbOk({ signedOut: true });
  });

  app.get("/me", { preValidation: requireAdmin() }, async (request) => dbOk(authService.adminView(adminOf(request))));

  app.post<{ Body: { currentPassword: string; newPassword: string } }>(
    "/change-password",
    { preValidation: [rateLimit("admin-change-password", 5, 900_000), requireAdmin()], schema: { body: changePasswordBody } },
    async (request, reply) => {
      await authService.changePassword(request, reply, "admin", adminOf(request).id, request.body.currentPassword, request.body.newPassword);
      return dbOk({ changed: true }, { persisted: true });
    },
  );

  app.post<{ Body: { email: string } }>("/forgot-password", { preHandler: rateLimit("admin-forgot", 5, 900_000), schema: { body: forgotBody } }, async (request) =>
    dbOk(await authService.forgotPassword(request, "admin", request.body.email)),
  );

  app.post<{ Body: { token: string; password: string } }>("/reset-password", { preHandler: rateLimit("admin-reset", 5, 900_000), schema: { body: resetBody } }, async (request) => {
    const result = await authService.resetPassword("admin", request.body.token, request.body.password);
    await audit(request, "admin.password_reset", "admin", null);
    return dbOk(result, { persisted: true });
  });
};
