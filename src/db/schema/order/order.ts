import { sql } from "drizzle-orm";
import { index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { organization } from "../auth/organization";
import { customer } from "../customer/customer";

/**
 * Order table
 * Stores order information for users to join organizations.
 * Tracks order status, expiration dates, and organization associations.
 */
export const order = pgTable(
  "order",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "set null" }),
    customerId: uuid("customer_id").references(() => customer.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("order_organizationId_idx").on(table.organizationId),
    index("order_customerId_idx").on(table.customerId),
  ]
);
