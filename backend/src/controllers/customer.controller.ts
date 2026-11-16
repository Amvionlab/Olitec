import type { FastifyRequest, FastifyReply } from "fastify";
import { customerService } from "../services/customer.service.js";
import { ok, fail } from "../utils/api-response.js";

export const customerController = {
  async getMe(request: FastifyRequest) {
    const user = (request as any).user;
    if (!user) {
      throw new Error("Unauthorized");
    }
    const profile = await customerService.getProfile(user.id);
    return ok(profile);
  },

  async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      if (!user) {
        return reply.status(401).send(fail("UNAUTHORIZED", "Customer authentication required"));
      }
      const data = await customerService.getDashboard(user.id, user.email, user.mobile);
      return ok(data);
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send(fail("DASHBOARD_FAILED", error.message || "Failed to load dashboard data"));
    }
  },

  async updateMe(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      if (!user) {
        return reply.status(401).send(fail("UNAUTHORIZED", "Customer authentication required"));
      }
      const updated = await customerService.updateProfile(user.id, request.body as any);
      return ok(updated);
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send(fail("UPDATE_FAILED", error.message || "Failed to update profile"));
    }
  },
};
