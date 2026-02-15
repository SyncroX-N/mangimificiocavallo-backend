import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Role enum
 * Defines the role of a user.
 * - owner: Owner
 * - production_manager: Production Manager
 */
export const role = pgEnum("role", ["owner", "production_manager"]);
