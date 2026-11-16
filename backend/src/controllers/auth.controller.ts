import type { FastifyReply, FastifyRequest } from "fastify";
import type { LoginBody, RegisterBody } from "../schemas/auth.schema.js";
import { authService } from "../services/auth.service.js";
import { otpService } from "../services/otp.service.js";
import { extractBearerToken } from "../middleware/auth.js";
import { verifyToken } from "../utils/crypto.js";
import { UnauthorizedError } from "../utils/errors.js";
import { ok } from "../utils/api-response.js";

export const authController = {
  register: async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
    const result = await authService.registerCustomer(request.body);
    reply.header("Set-Cookie", `olitec_token=${result.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 86400}`);
    return ok(result);
  },

  login: async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    const result = await authService.loginCustomer(request.body);
    reply.header("Set-Cookie", `olitec_token=${result.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 86400}`);
    return ok(result);
  },

  adminLogin: async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    const result = await authService.loginAdmin(request.body);
    reply.header("Set-Cookie", `olitec_token=${result.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 86400}`);
    return ok(result);
  },

  me: async (request: FastifyRequest) => {
    const token = extractBearerToken(request);
    if (!token) throw new UnauthorizedError("Session expired or invalid.");
    const payload = verifyToken(token);
    if (!payload) throw new UnauthorizedError("Session expired or invalid.");
    return ok(await authService.getCurrentUser(payload.id));
  },

  logout: async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.header(
      "Set-Cookie",
      "olitec_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
    );
    return ok(await authService.logout());
  },

  sendRegistrationOtp: async (
    request: FastifyRequest<{ Body: { email: string; name?: string; mobile?: string } }>
  ) => {
    const result = await otpService.sendRegistrationOtp(request.body.email, request.body.name);
    return ok(result);
  },

  sendVerificationOtp: async (request: FastifyRequest<{ Body: { email: string } }>) => {
    const result = await otpService.sendVerificationOtp(request.body.email);
    return ok(result);
  },

  verifyEmailOtp: async (request: FastifyRequest<{ Body: { email: string; otp: string } }>) => {
    const result = await otpService.verifyEmailOtp(request.body.email, request.body.otp);
    return ok(result);
  },

  sendForgotPasswordOtp: async (request: FastifyRequest<{ Body: { email: string } }>) => {
    const result = await otpService.sendForgotPasswordOtp(request.body.email);
    return ok(result);
  },

  resetPasswordWithOtp: async (
    request: FastifyRequest<{ Body: { email: string; otp: string; newPassword: string } }>
  ) => {
    const result = await otpService.resetPasswordWithOtp(
      request.body.email,
      request.body.otp,
      request.body.newPassword
    );
    return ok(result);
  },
};
