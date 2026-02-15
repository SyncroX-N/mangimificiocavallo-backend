import { sql } from "drizzle-orm";
import {
  boolean,
  char,
  doublePrecision,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { customer } from "./customer";

export const customerAddressType = pgEnum("customer_address_type", [
  "billing",
  "shipping",
  "hq",
  "other",
]);

/**
 * Customer address table
 * Stores one or more structured addresses for a customer.
 */
export const customerAddress = pgTable(
  "customer_address",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "cascade" }),
    type: customerAddressType("type").default("billing").notNull(),
    label: text("label"),
    line1: text("line_1").notNull(),
    line2: text("line_2"),
    postalCode: text("postal_code"),
    city: text("city").notNull(),
    stateProvince: text("state_province"),
    countryCode: char("country_code", { length: 2 }),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    googlePlaceId: text("google_place_id"),
    isPrimary: boolean("is_primary").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("customer_address_customer_id_idx").on(table.customerId),
    index("customer_address_customer_type_idx").on(
      table.customerId,
      table.type
    ),
    index("customer_address_lat_lng_idx").on(table.latitude, table.longitude),
  ]
);
