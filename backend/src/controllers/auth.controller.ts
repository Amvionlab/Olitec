import type { FastifyRequest } from "fastify";
import type { LoginBody, RegisterBody } from "../schemas/auth.schema.js";
import { authService } from "../services/auth.service.js";

// All handlers respond 501 NOT_IMPLEMENTED (via the service) until Phase 2.
export const authController = {
  register: (request: FastifyRequest<{ Body: RegisterBody }>) => authService.registerCustomer(request.body),
  login: (request: FastifyRequest<{ Body: LoginBody }>) => authService.loginCustomer(request.body),
  adminLogin: (request: FastifyRequest<{ Body: LoginBody }>) => authService.loginAdmin(request.body),
  logout: () => authService.logout(),
};
