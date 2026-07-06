import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { ValidationError, HttpError } from "./lib/errors";

const app: Express = express();

// Trust the Replit reverse proxy so client IPs (used for rate limiting) resolve.
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Global error handler — must be registered last and take four arguments.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) return;

  if (err instanceof ValidationError) {
    res.status(400).json({ error: "Validation failed", fields: err.fields });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  // Postgres unique-constraint violation → 409 rather than a leaked 500.
  if (err && typeof err === "object" && (err as { code?: string }).code === "23505") {
    res.status(409).json({ error: "A record with that value already exists" });
    return;
  }

  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
});

export default app;
