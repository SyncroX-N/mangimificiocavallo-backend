/**
 * Database Enums
 * Shared enum types used across multiple tables.
 */

import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Location type enum
 * Defines the type of location.
 * - restaurant: Restaurant
 * - bar: Bar
 * - cafe: Cafe
 * - hotel: Hotel
 * - club: Club
 */
export const locationTypeEnum = pgEnum("location_type", [
  "restaurant",
  "bar",
  "cafe",
  "bakery",
  "pub",
  "lounge",
  "food_hall",
  "hotel",
  "club",
  "other",
]);

/**
 * Role enum
 * Defines the role of a user.
 * - super-admin: Super admin
 * - admin: Admin
 */
export const roleEnum = pgEnum("role", ["super-admin", "admin"]);
