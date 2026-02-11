import { and, eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import database from "@/db";
import { member } from "@/db/schema/auth/member";

declare module "hono" {
  interface ContextVariableMap {
    member: typeof member.$inferSelect;
  }
}

/**
 * Organization Admin guard – ensures the user is an active organization member
 * with the required role(s).
 *
 * Uses Better Auth's organization member table instead of the old concierge table.
 * By default, allows both "owner" and "admin" roles.
 *
 * This middleware requires organization membership. For super admin checks
 * that bypass organization requirements, use requireAdmin from admin.middleware.
 */
export const requireOrgAdmin = (
  allowedRoles: Array<"owner" | "admin"> = ["owner", "admin"]
) =>
  createMiddleware(async (c, next) => {
    const user = c.get("user");
    const session = c.get("session");

    if (!user) {
      throw new HTTPException(401, {
        message: "Unauthorized",
      });
    }

    // Get the active organization from the session
    const activeOrgId = session?.activeOrganizationId;

    if (!activeOrgId) {
      throw new HTTPException(403, {
        message: "No active organization. Please select an organization.",
      });
    }

    // Look up member record for this user in the active organization
    const [memberRow] = await database
      .select()
      .from(member)
      .where(
        and(eq(member.userId, user.id), eq(member.organizationId, activeOrgId))
      )
      .limit(1);

    if (!memberRow) {
      throw new HTTPException(403, {
        message: "User is not a member of this organization",
      });
    }

    if (!memberRow.isActive) {
      throw new HTTPException(403, {
        message: "Member is inactive",
      });
    }

    if (!allowedRoles.includes(memberRow.role as "owner" | "admin")) {
      throw new HTTPException(403, {
        message: `Insufficient role. Required: ${allowedRoles.join(", ")}. Got: ${memberRow.role}`,
      });
    }

    c.set("member", memberRow);

    await next();
  });
