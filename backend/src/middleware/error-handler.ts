import type { FastifyError, FastifyInstance } from "fastify";
import { AppError } from "../utils/errors.js";
import { fail } from "../utils/api-response.js";

export function registerErrorHandling(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError | AppError, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(fail(error.code, error.message, error.details));
    }

    if ("validation" in error && error.validation) {
      return reply.status(400).send(
        fail(
          "VALIDATION_ERROR",
          "The request contains invalid fields.",
          error.validation.map((issue) => ({
            field: issue.instancePath.replace(/^\//, "").replace(/\//g, ".") || (issue.params as { missingProperty?: string }).missingProperty,
            message: issue.message,
          })),
        ),
      );
    }

    const statusCode = error.statusCode && error.statusCode < 500 ? error.statusCode : 500;
    if (statusCode >= 500) {
      request.log.error({ err: error }, "Unhandled error");
      return reply.status(500).send(fail("INTERNAL_ERROR", "Something went wrong. Please try again later."));
    }
    return reply.status(statusCode).send(fail(error.code ?? "BAD_REQUEST", error.message));
  });

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send(fail("ROUTE_NOT_FOUND", `Route ${request.method} ${request.url} does not exist.`));
  });
}
