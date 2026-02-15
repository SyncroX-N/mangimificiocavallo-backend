import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organization } from "../auth/organization";

/**
 * Customer table
 * Stores B2B customers owned by an organization.
 */
export const customer = pgTable(
  "customer",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    businessName: text("business_name").notNull(),
    domain: text("domain"),
    contactPhoneNumber: text("contact_phone_number"),
    clientCode: text("client_code"),
    taxId: text("tax_id"),
    vatNumber: text("vat_number"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("customer_organization_id_idx").on(table.organizationId),
    index("customer_business_name_idx").on(table.businessName),
  ]
);
