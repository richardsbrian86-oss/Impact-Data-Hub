import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";

/** Strict limiter for the login endpoint: 10 attempts per 15 minutes per IP. */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Limiter for mutating requests: 60 per minute, keyed by authenticated user
 * when available, otherwise by client IP. Read-only requests are skipped.
 */
export const mutationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) =>
    req.userId != null ? `user:${req.userId}` : ipKeyGenerator(req.ip ?? ""),
  skip: (req: Request) => !MUTATION_METHODS.has(req.method),
  message: { error: "Too many requests. Please slow down." },
});
