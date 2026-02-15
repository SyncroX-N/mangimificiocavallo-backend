import { sql } from "drizzle-orm";
import {
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { documentType } from "./enum";
import { payment } from "./payment";

/**
 * Payment line item table
 * Stores one or more payable document rows attached to a payment.
 */
export const paymentLineItem = pgTable(
  "payment_line_item",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payment.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    documentType: documentType("document_type").notNull(),
    documentId: text("document_id").notNull(),
    amount: numeric("amount").notNull(),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("payment_line_item_payment_id_idx").on(table.paymentId),
    index("payment_line_item_payment_id_position_idx").on(
      table.paymentId,
      table.position
    ),
    index("payment_line_item_document_id_idx").on(table.documentId),
  ]
);
