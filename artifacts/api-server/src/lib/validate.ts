import { ValidationError } from "./errors";

interface SafeParseSuccess<T> {
  success: true;
  data: T;
}

interface SafeParseFailure {
  success: false;
  error: {
    issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>;
  };
}

export interface Parseable<T> {
  safeParse(data: unknown): SafeParseSuccess<T> | SafeParseFailure;
}

/**
 * Validate `data` against a zod schema. On success returns the parsed value.
 * On failure throws a ValidationError carrying a map of field -> message,
 * which the global error handler turns into a 400 response.
 */
export function parseBody<T>(schema: Parseable<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;

  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length ? issue.path.map((p) => String(p)).join(".") : "_root";
    if (!(key in fields)) fields[key] = issue.message;
  }
  throw new ValidationError(fields);
}

/**
 * numeric/decimal columns are represented as strings by drizzle (and its zod
 * schemas), but API clients send them as JSON numbers. Coerce the given keys
 * from number -> string so validation and inserts line up.
 */
export function coerceNumericFields(
  body: unknown,
  keys: readonly string[],
): Record<string, unknown> {
  const source = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const out: Record<string, unknown> = { ...source };
  for (const key of keys) {
    if (typeof out[key] === "number") out[key] = String(out[key]);
  }
  return out;
}
