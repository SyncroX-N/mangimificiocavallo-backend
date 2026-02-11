/**
 * Super Admin Utilities
 *
 * Functions to check if a user is a super admin.
 * Super admins have access to all organizations and bypass organization-based checks.
 */

import { eq } from "drizzle-orm";
import database from "@/db";
import { user } from "@/db/schema/auth/user";

/**
 * Super admin user IDs - configured via environment variable
 * Users with these IDs will have super admin access regardless of role
 */
const SUPER_ADMIN_USER_IDS = process.env.SUPER_ADMIN_USER_IDS
  ? process.env.SUPER_ADMIN_USER_IDS.split(",").map((id) => id.trim())
  : [];

/**
 * Super admin roles - users with these roles are considered super admins
 */
const SUPER_ADMIN_ROLES = ["super-admin", "admin"];

/**
 * Check if a user is a super admin
 * Super admins are identified by:
 * 1. Having their user ID in SUPER_ADMIN_USER_IDS
 * 2. Having role in SUPER_ADMIN_ROLES (super-admin or admin)
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  // Check if user ID is in super admin list
  if (SUPER_ADMIN_USER_IDS.includes(userId)) {
    return true;
  }

  // Check if user has super admin role
  const [userRecord] = await database
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!userRecord?.role) {
    return false;
  }

  return SUPER_ADMIN_ROLES.includes(userRecord.role);
}

/**
 * Check if a user object has super admin role
 * Useful when you already have the user object loaded
 */
export function hasSuperAdminRole(userRecord: {
  role?: string | null;
  id: string;
}): boolean {
  if (SUPER_ADMIN_USER_IDS.includes(userRecord.id)) {
    return true;
  }

  if (!userRecord.role) {
    return false;
  }

  return SUPER_ADMIN_ROLES.includes(userRecord.role);
}
