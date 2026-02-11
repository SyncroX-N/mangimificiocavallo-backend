import { sql } from "drizzle-orm";
import {
  doublePrecision,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { locationTypeEnum } from "../enums";
import { area } from "./area";
import { city } from "./city";

/**
 * Location table
 * Stores location information including name, address, contact information, and more.
 */
export const location = pgTable(
  "location",
  {
    id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),

    // Identity
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    type: locationTypeEnum("type").notNull(),

    // Optional brand/chain info
    brandName: text("brand_name"),

    // Address / geo
    addressLine1: text("address_line_1"),
    addressLine2: text("address_line_2"),
    neighborhood: text("neighborhood"),
    cityId: uuid("city_id")
      .notNull()
      .references(() => city.id, { onDelete: "restrict" }),
    areaId: uuid("area_id").references(() => area.id, {
      onDelete: "set null",
    }),
    postalCode: text("postal_code"),

    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),

    // Contact / presence
    phoneNumber: text("phone_number"),
    email: text("email"),
    websiteUrl: text("website_url"),
    googlePlaceId: text("google_place_id"),

    // Copy (used for UI & to build search_text for embeddings)
    shortDescription: text("short_description"), // 1–2 lines
    detailedDescription: text("detailed_description"), // full narrative
    // Audit
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    cityTypeIdx: index("location_city_type_idx").on(table.cityId, table.type),
    areaTypeIdx: index("location_area_type_idx").on(table.areaId, table.type),
    latLngIdx: index("location_lat_lng_idx").on(
      table.latitude,
      table.longitude
    ),
  })
);
