import { sentry } from "@hono/sentry";

import { Hono } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { timing } from "hono/timing";
import { auth } from "../auth";
import { errorHandler, notFound } from "./middleware/error.middleware";
import { adminRoutes } from "./routes/admin";
import { healthRoute } from "./routes/health";
import { getAllowedOrigins, resolveCorsOrigin } from "./utils/allowed-origins";

// Create the base app
const allowedOrigins = getAllowedOrigins();

// API routes with middleware
const app = new Hono({ strict: false })
  .basePath("/api")
  // Middlewares
  .use("*", logger())
  .use(
    "*",
    cors({
      origin: (origin): string => resolveCorsOrigin(origin),
      credentials: true,
      allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
      ],
    })
  )
  .use("*", async (c, next) => {
    // Exclude auth routes from CSRF protection (better-auth handles its own security)
    if (c.req.path.startsWith("/api/auth")) {
      await next();
      return;
    }
    return csrf({ origin: allowedOrigins })(c, next);
  })
  .use("*", prettyJSON())
  .use("*", secureHeaders())
  .use("*", timing())
  .use(
    "*",
    sentry({
      dsn: process.env.SENTRY_DSN ?? process.env.SENTRY_DNS,
      tracesSampleRate: 0.2,
    })
  )
  // Routes
  // .route("/app", appRoutes) //@TODO: add app routes
  // .route("/admin", adminRoutes) //@TODO: add admin routes
  .route("/admin", adminRoutes)
  .route("/health", healthRoute)
  .onError(errorHandler)
  .notFound(notFound);

app.on(["POST", "GET", "PUT", "DELETE", "PATCH"], "/auth/*", async (c) => {
  console.log("auth", auth);
  const response = await auth.handler(c.req.raw);
  return response;
});

// Export types for RPC mode
export type AppType = typeof app;

export default app;
