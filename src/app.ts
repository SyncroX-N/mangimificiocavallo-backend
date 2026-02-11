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
import { healthRoute } from "./routes/health";
import { sharedRoutes } from "./routes/shared";
import { webRoutes } from "./routes/web";

// Create the base app

// API routes with middleware
const app = new Hono({ strict: false })
  .basePath("/api")
  // Middlewares
  .use("*", logger())
  .use(
    "*",
    cors({
      origin: (origin): string => {
        // Allow requests from localhost:3000 (dashboard) and mobile app origins
        const allowedOrigins = [
          "http://localhost:3000",
          "http://127.0.0.1:3000",
        ];

        // Check if origin matches any allowed pattern
        if (!origin) {
          return allowedOrigins[0]; // Default to first origin if no origin header
        }

        // For development, allow localhost origins
        if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
          return origin;
        }

        // Check if origin matches allowed origins
        if (allowedOrigins.includes(origin)) {
          return origin;
        }

        // For mobile app origins (exp://, trotter-business://)
        if (
          origin.startsWith("exp://") ||
          origin.startsWith("trotter-business://")
        ) {
          return origin;
        }

        return allowedOrigins[0];
      },
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
    return csrf({ origin: "http://localhost:3000" })(c, next);
  })
  .use("*", prettyJSON())
  .use("*", secureHeaders())
  .use("*", timing())
  .use("*", sentry({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.2 }))
  // Routes
  // .route("/app", appRoutes) //@TODO: add app routes
  // .route("/admin", adminRoutes) //@TODO: add admin routes
  .route("/web", webRoutes)
  .route("/shared", sharedRoutes)
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
