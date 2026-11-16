import type { FastifyRequest, FastifyReply } from "fastify";
import {
  createInquiry,
  listInquiries,
  getInquiryById,
  updateInquiry,
  deleteInquiry,
  getInquiryStats,
  type InquiryKind,
} from "../services/inquiry.service.js";
import { getSmtpSettings, updateSmtpSettings, sendTestEmail } from "../services/mail.service.js";
import { ok, fail } from "../utils/api-response.js";

export const inquiryController = {
  // Public endpoint for submitting any website form
  async submit(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      if (!body) {
        return reply.status(400).send(fail("MISSING_BODY", "Request body is required"));
      }

      const { kind, name, email, mobile, city, details, fileUrl } = body;

      if (!kind || !name || !email || !mobile) {
        return reply.status(400).send(fail("VALIDATION_ERROR", "Kind, name, email and mobile are required"));
      }

      const validKinds: InquiryKind[] = ["service", "career", "partner", "consultation"];
      if (!validKinds.includes(kind)) {
        return reply.status(400).send(fail("INVALID_KIND", `Kind must be one of: ${validKinds.join(", ")}`));
      }

      const result = await createInquiry({
        kind,
        name: String(name),
        email: String(email),
        mobile: String(mobile),
        city: city ? String(city) : undefined,
        details: details || body,
        fileUrl: fileUrl ? String(fileUrl) : undefined,
      });

      return reply.status(201).send(ok(result));
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send(fail("SUBMIT_FAILED", error.message || "Failed to submit inquiry"));
    }
  },

  // Admin: List all inquiries with filters & search
  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const result = await listInquiries({
        kind: query.kind,
        status: query.status,
        search: query.search,
        page: query.page ? Number(query.page) : 1,
        limit: query.limit ? Number(query.limit) : 20,
      });
      return ok(result);
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send(fail("LIST_FAILED", error.message || "Failed to retrieve inquiries"));
    }
  },

  // Admin: Get single inquiry
  async getOne(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const inquiry = await getInquiryById(Number(id));
      if (!inquiry) {
        return reply.status(404).send(fail("NOT_FOUND", "Inquiry not found"));
      }
      return ok(inquiry);
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send(fail("FETCH_FAILED", error.message || "Failed to fetch inquiry"));
    }
  },

  // Admin: Update inquiry status and notes
  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { status, adminNotes } = request.body as any;

      const updated = await updateInquiry(Number(id), {
        status,
        adminNotes,
      });

      if (!updated) {
        return reply.status(404).send(fail("NOT_FOUND", "Inquiry not found"));
      }

      return ok(updated);
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send(fail("UPDATE_FAILED", error.message || "Failed to update inquiry"));
    }
  },

  // Admin: Delete inquiry
  async remove(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const deleted = await deleteInquiry(Number(id));
      if (!deleted) {
        return reply.status(404).send(fail("NOT_FOUND", "Inquiry not found"));
      }
      return ok({ deleted: true });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send(fail("DELETE_FAILED", error.message || "Failed to delete inquiry"));
    }
  },

  // Admin: Get summary counts
  async stats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await getInquiryStats();
      return ok(stats);
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send(fail("STATS_FAILED", error.message || "Failed to fetch stats"));
    }
  },

  // Admin: Get SMTP configuration
  async getSmtp(request: FastifyRequest, reply: FastifyReply) {
    try {
      const smtp = await getSmtpSettings();
      // Mask password for safety
      return ok({
        ...smtp,
        hasPassword: Boolean(smtp.password),
        password: smtp.password ? "••••••••" : "",
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send(fail("FETCH_SMTP_FAILED", error.message || "Failed to get SMTP settings"));
    }
  },

  // Admin: Update SMTP configuration
  async updateSmtp(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const updated = await updateSmtpSettings(body);
      return ok({
        ...updated,
        hasPassword: Boolean(updated.password),
        password: updated.password ? "••••••••" : "",
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send(fail("UPDATE_SMTP_FAILED", error.message || "Failed to update SMTP settings"));
    }
  },

  // Admin: Send test email
  async testSmtp(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = (request.body as any) || {};
      const result = await sendTestEmail(body.targetEmail);
      if (!result.success) {
        return reply.status(400).send(fail("SMTP_TEST_FAILED", result.message));
      }
      return ok(result);
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send(fail("TEST_FAILED", error.message || "Error testing SMTP"));
    }
  },
};
