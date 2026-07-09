import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error(
    "JWT_SECRET environment variable is required but was not provided.",
  );
}
const jwtSecret: string = secret;

export const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const EXPIRES_IN_SECONDS = TOKEN_MAX_AGE_MS / 1000;

export interface AuthTokenPayload {
  userId: number;
  email: string;
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, jwtSecret, { expiresIn: EXPIRES_IN_SECONDS });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (typeof decoded !== "object" || decoded === null) return null;
    const record = decoded as Record<string, unknown>;
    if (typeof record.userId === "number" && typeof record.email === "string") {
      return { userId: record.userId, email: record.email };
    }
    return null;
  } catch {
    return null;
  }
}
