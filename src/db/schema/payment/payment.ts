import { sql } from "drizzle-orm";
import {
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { organization } from "../auth/organization";
import { customer } from "../customer/customer";
import { order } from "../order/order";
import { paymentMode, paymentStatus } from "./enum";

/**
 * Payment table
 * Stores payment information for users to join organizations.
 * Tracks payment status, expiration dates, and organization associations.
 */
export const payment = pgTable(
  "payment",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "set null" }),
    customerId: uuid("customer_id").references(() => customer.id, {
      onDelete: "set null",
    }),
    orderId: uuid("order_id")
      //   .notNull() //@TODO enable this when we have orders
      .references(() => order.id, { onDelete: "set null" }),
    paymentMode: paymentMode("payment_mode"),
    amount: numeric("amount").notNull(),
    currency: text("currency").notNull().default("EUR"),
    status: paymentStatus("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at"),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("payment_organizationId_idx").on(table.organizationId),
    index("payment_customerId_idx").on(table.customerId),
    index("payment_orderId_idx").on(table.orderId),
  ]
);
