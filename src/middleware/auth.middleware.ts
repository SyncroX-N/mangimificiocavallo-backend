import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { auth } from "../../auth";

declare module "hono" {
  interface ContextVariableMap {
    user: typeof auth.$Infer.Session.user;
    session: typeof auth.$Infer.Session.session & {
      activeOrganizationId: string;
    };
  }
}

export const protect = createMiddleware(async (c, next) => {
  const response = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!response) {
    throw new HTTPException(401, {
      message: "Unauthorized",
    });
  }

  if (!response.session.activeOrganizationId) {
    throw new HTTPException(403, {
      message: "No active organization.",
    });
  }

  c.set("user", response.user);
  c.set("session", {
    ...response.session,
    activeOrganizationId: response.session.activeOrganizationId,
  });

  await next();
});
