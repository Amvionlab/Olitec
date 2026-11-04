/**
 * Fixed-window, in-memory rate limiter for sensitive endpoints (login, registration, checkout, enquiries).
 * Per process only — when running several backend instances, put a shared limiter (e.g. at the reverse proxy
 * or Redis-backed) in front as well.
 */
import type { preHandlerAsyncHookHandler } from "fastify";
import { AppError } from "../../../utils/errors.js";

class TooManyRequestsError extends AppError {
  constructor(retryAfterSeconds: number) {
    super(429, "TOO_MANY_REQUESTS", `Too many attempts. Please try again in ${retryAfterSeconds} seconds.`);
  }
}

const buckets = new Map<string, { count: number; resetAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
}, 60_000).unref();

export function rateLimit(name: string, max: number, windowMs: number): preHandlerAsyncHookHandler {
  return async (request, reply) => {
    const key = `${name}:${request.ip}`;
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      reply.header("retry-after", retryAfter);
      throw new TooManyRequestsError(retryAfter);
    }
  };
}

/** Test helper. */
export function resetRateLimits(): void {
  buckets.clear();
}
