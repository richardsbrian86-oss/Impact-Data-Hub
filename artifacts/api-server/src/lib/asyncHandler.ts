import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wrap an async route handler so that any rejected promise is forwarded to
 * Express's error-handling middleware via `next(err)`.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
