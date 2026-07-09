import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { asyncHandler } from "../lib/asyncHandler";
import { signToken, TOKEN_MAX_AGE_MS } from "../lib/jwt";
import { requireAuth } from "../middlewares/auth";
import { loginLimiter } from "../middlewares/rateLimit";

const router = Router();

const COOKIE_NAME = "token";
const baseCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
};

router.post(
  "/auth/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const email =
      typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    const fields: Record<string, string> = {};
    if (!email) fields.email = "Email is required";
    if (!password) fields.password = "Password is required";
    if (Object.keys(fields).length > 0) {
      res.status(400).json({ error: "Validation failed", fields });
      return;
    }

    const rows = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email });
    res.cookie(COOKIE_NAME, token, { ...baseCookieOptions, maxAge: TOKEN_MAX_AGE_MS });
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  }),
);

router.post("/auth/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, baseCookieOptions);
  res.json({ success: true });
});

router.get(
  "/auth/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const rows = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.userId as number))
      .limit(1);
    const user = rows[0];
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  }),
);

export default router;
