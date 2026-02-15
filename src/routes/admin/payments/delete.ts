import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import z from "zod";
import { deletePaymentById, deletePaymentsByIds } from "@/operations/payments";

export const deletePaymentsSchema = z.object({
  ids: z.array(z.uuid()).min(1),
});

export async function deletePayment(
  c: Context,
  id: string,
  organizationId: string
) {
  const deleted = await deletePaymentById(id, organizationId);

  if (!deleted) {
    throw new HTTPException(404, {
      message: "Payment not found",
    });
  }

  return c.json({ data: deleted });
}

export async function deletePayments(
  c: Context,
  ids: string[],
  organizationId: string
) {
  const deletedPayments = await deletePaymentsByIds(ids, organizationId);

  return c.json({
    data: deletedPayments,
    deletedCount: deletedPayments.length,
  });
}
