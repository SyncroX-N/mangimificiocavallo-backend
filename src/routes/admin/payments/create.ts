import type { Context } from "hono";
import z from "zod";
import { documentType, paymentMode } from "@/db/schema/payment/enum";
import { createPayment } from "@/operations/payments";

interface CreatePaymentParams {
  organizationId: string;
  input: CreatePaymentInput;
}

const createPaymentLineItemSchema = z.object({
  documentType: z.enum(documentType.enumValues),
  documentId: z.string().trim().min(1),
  amount: z.coerce.number().positive(),
  imageUrl: z.string().trim().min(1).nullable().optional(),
});

export const createPaymentSchema = z
  .object({
    customerId: z.uuid(),
    orderId: z.uuid().nullable().optional(),
    lineItems: z.array(createPaymentLineItemSchema).min(1),
    paymentMode: z.enum(paymentMode.enumValues),
    currency: z
      .string()
      .trim()
      .length(3)
      .transform((value) => value.toUpperCase()),
    expiresAt: z.coerce.date().optional(),
    paidAt: z.coerce.date().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.paymentMode === "check" && !value.expiresAt) {
      ctx.addIssue({
        code: "custom",
        message: "expiresAt is required when payment mode is check",
        path: ["expiresAt"],
      });
    }
  });
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export async function createPaymentHandler(
  c: Context,
  params: CreatePaymentParams
) {
  const { organizationId, input } = params;
  const resolvedStatus =
    input.paymentMode === "check" ? "pending" : "completed";
  const result = await createPayment(organizationId, {
    ...input,
    status: resolvedStatus,
  });

  return c.json({ data: result }, 201);
}
