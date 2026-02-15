import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import z from "zod";
import {
  documentType,
  paymentMode,
  paymentStatus,
} from "@/db/schema/payment/enum";
import { updatePayment } from "@/operations/payments";

interface UpdatePaymentParams {
  id: string;
  organizationId: string;
  input: UpdatePaymentInput;
}

export const updatePaymentSchema = z.object({
  customerId: z.uuid().nullable().optional(),
  orderId: z.uuid().nullable().optional(),
  paymentMode: z.enum(paymentMode.enumValues).optional(),
  status: z.enum(paymentStatus.enumValues).optional(),
  lineItems: z
    .array(
      z.object({
        documentType: z.enum(documentType.enumValues),
        documentId: z.string().trim().min(1),
        amount: z.coerce.number().positive(),
        imageUrl: z.string().trim().min(1).nullable().optional(),
      })
    )
    .min(1)
    .optional(),
});
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;

export async function updatePaymentHandler(
  c: Context,
  params: UpdatePaymentParams
) {
  const { id, organizationId, input } = params;
  const result = await updatePayment(id, organizationId, input);

  if (!result) {
    throw new HTTPException(404, { message: "Payment not found" });
  }

  return c.json({ data: result });
}
