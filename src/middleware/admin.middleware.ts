import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { hasSuperAdminRole } from "@/lib/super-admin";

declare module "hono" {
  interface ContextVariableMap {
    isSuperAdmin: boolean;
  }
}

/**
 * Admin guard – ensures the user is a super admin or higher level admin.
 * This middleware does NOT require organization membership.
 *
 * Super admins are identified by:
 * - Having their user ID in SUPER_ADMIN_USER_IDS environment variable
 * - Having role === "super-admin" or "admin" in the user table
 *
 * Use this for routes that should be accessible to super admins regardless of organization.
 * For organization-specific admin checks, use requireOrgAdmin instead.
 */
export const requireAdmin = () =>
  createMiddleware(async (c, next) => {
    const user = c.get("user");

    if (!user) {
      throw new HTTPException(401, {
        message: "Unauthorized",
      });
    }

    // Check if user is a super admin
    const isSuperAdmin = hasSuperAdminRole(user);

    if (!isSuperAdmin) {
      throw new HTTPException(403, {
        message: "Access denied. Super admin privileges required.",
      });
    }

    c.set("isSuperAdmin", true);

    await next();
  });
