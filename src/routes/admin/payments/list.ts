import type { Context } from "hono";
import z from "zod";
import { listPayments } from "@/operations/payments";

export const getPaymentsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(10),
  // Search is applied on customer business name and payment line-item document id.
  search: z.string().trim().optional(),
});
export type ListPaymentsParams = z.infer<typeof getPaymentsSchema>;

interface ListPaymentsHandlerParams extends ListPaymentsParams {
  organizationId: string;
}

export async function list(c: Context, params: ListPaymentsHandlerParams) {
  const { organizationId, page, perPage, search } = params;

  const { payments, total } = await listPayments(organizationId, {
    page,
    perPage,
    search,
  });

  return c.json({
    data: payments,
    pageCount: Math.ceil(total / perPage),
  });
}
