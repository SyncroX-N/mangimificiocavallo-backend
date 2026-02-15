import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getPaymentById } from "@/operations/payments";

export async function getPayment(
  c: Context,
  id: string,
  organizationId: string
) {
  const existing = await getPaymentById(id, organizationId);

  if (!existing) {
    throw new HTTPException(404, {
      message: "Payment not found",
    });
  }

  return c.json({ data: existing });
}
