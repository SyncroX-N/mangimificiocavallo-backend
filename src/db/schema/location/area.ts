import { sql } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { city } from "./city";

export const area = pgTable(
  "area",
  {
    id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    cityId: uuid("city_id")
      .notNull()
      .references(() => city.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    cityNameUidx: uniqueIndex("area_city_name_uidx").on(
      table.cityId,
      table.name
    ),
    cityIdx: index("area_city_idx").on(table.cityId),
  })
);
