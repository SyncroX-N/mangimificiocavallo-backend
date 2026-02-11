import { relations } from "drizzle-orm";
import { area } from "./area";
import { city } from "./city";
import { country } from "./country";
import { location } from "./location";

export const countryRelations = relations(country, ({ many }) => ({
  cities: many(city),
}));

export const cityRelations = relations(city, ({ one, many }) => ({
  country: one(country, {
    fields: [city.countryId],
    references: [country.id],
  }),
  areas: many(area),
  locations: many(location),
}));

export const areaRelations = relations(area, ({ one, many }) => ({
  city: one(city, {
    fields: [area.cityId],
    references: [city.id],
  }),
  locations: many(location),
}));

export const locationRelations = relations(location, ({ one }) => ({
  city: one(city, {
    fields: [location.cityId],
    references: [city.id],
  }),
  area: one(area, {
    fields: [location.areaId],
    references: [area.id],
  }),
}));
