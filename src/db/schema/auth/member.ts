import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { user } from "./user";

/**
 * Member table
 * Stores membership information for users in organizations.
 * Tracks roles, join dates, organization associations, and active status.
 * Used by Better Auth for organization membership management.
 *
 * The isActive field replaces the old concierge.isActive - it tracks whether
 * a member (especially owner/admin roles) can actively handle conversations.
 */
export const member = pgTable(
  "member",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(),
    /**
     * Tracks if the member is active (can handle conversations).
     * Primarily used for owner/admin roles acting as concierges.
     */
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("member_organizationId_idx").on(table.organizationId),
    index("member_userId_idx").on(table.userId),
  ]
);
