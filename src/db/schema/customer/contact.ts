import { sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { customer } from "./customer";

export const customerContactType = pgEnum("customer_contact_type", [
  "telephone",
  "mobile",
  "fax",
]);

/**
 * Customer contacts table
 * Stores one or more phone/fax contacts for each customer.
 */
export const customerContact = pgTable(
  "customer_contact",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "cascade" }),
    type: customerContactType("type").notNull(),
    value: text("value").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("customer_contact_customer_id_idx").on(table.customerId),
    index("customer_contact_customer_type_idx").on(
      table.customerId,
      table.type
    ),
  ]
);
