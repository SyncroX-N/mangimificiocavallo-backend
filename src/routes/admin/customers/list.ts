import type { Context } from "hono";
import z from "zod";
import { listCustomers } from "@/operations/customers";

interface ListCustomersHandlerParams {
  organizationId: string;
  page: number;
  perPage: number;
  search?: string;
}

export const getCustomersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(10),
  search: z.string().trim().optional(),
});
export type ListCustomersParams = z.infer<typeof getCustomersSchema>;

export async function listCustomersHandler(
  c: Context,
  params: ListCustomersHandlerParams
) {
  const { organizationId, page, perPage, search } = params;
  const { customers, total } = await listCustomers(organizationId, {
    page,
    perPage,
    search,
  });

  return c.json({
    data: customers,
    pageCount: Math.ceil(total / perPage),
  });
}
