import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Payment mode enum
 * Defines the payment method used for a payment.
 * - check: Check
 * - cash: Cash
 * - bank_transfer: Bank transfer
 * - debit_card: Debit card
 */
export const paymentMode = pgEnum("payment_mode", [
  "check",
  "cash",
  "bank_transfer",
  "debit_card",
]);

/**
 * Payment status enum
 * Defines the status of a payment.
 * - pending: Pending
 * - completed: Completed
 * - failed: Failed
 */
export const paymentStatus = pgEnum("payment_status", [
  "pending",
  "completed",
  "failed",
]);

/**
 *
 *
 */
export const documentType = pgEnum("document_type", [
  "transport_document",
  "invoice",
]);
