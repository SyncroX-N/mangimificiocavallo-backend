import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Unity measure unit enum
 * Defines the unity measure unit of a product.
 * - kg: Kilogram
 * - l: Liter
 * - ml: Milliliter
 * - cl: Centiliter
 * - dl: Deciliter
 * - hl: Hectoliter
 */
export const unityMeasureUnit = pgEnum("unity_measure_unit", [
  "kg",
  "l",
  "ml",
  "cl",
  "dl",
  "hl",
]);

/**
 * Feed type enum
 * Defines the feed type of a product.
 * - cereal: Cereal
 * - forage: Forage
 * - concentrate: Concentrate
 * - supplement: Supplement
 * - other: Other
 */
export const feedType = pgEnum("feed_type", [
  "cereal",
  "forage",
  "concentrate",
  "supplement",
  "other",
]);

/**
 * Delivery type enum
 * Defines the delivery type of a product.
 * - pickup: Pickup
 * - delivery: Delivery
 * - other: Other
 */
export const deliveryType = pgEnum("delivery_type", [
  "pickup",
  "delivery",
  "other",
]);

/**
 * Order status enum
 * Defines the status of an order.
 * - pending: Pending
 * - in_progress: In progress
 * - cancelled: Cancelled
 * - completed: Completed
 */
export const orderStatus = pgEnum("order_status", [
  "pending",
  "in_progress",
  "cancelled",
  "completed",
]);

/**
 * Order priority enum
 * Defines the priority of an order.
 * - low: Low
 * - medium: Medium
 * - high: High
 */
export const orderPriority = pgEnum("order_priority", [
  "low",
  "medium",
  "high",
]);
