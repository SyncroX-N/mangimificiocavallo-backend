import { sql } from "drizzle-orm";
import {
  char,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const country = pgTable(
  "country",
  {
    id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
    code: char("code", { length: 2 }).notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    codeUidx: uniqueIndex("country_code_uidx").on(table.code),
    nameUidx: uniqueIndex("country_name_uidx").on(table.name),
  })
);
