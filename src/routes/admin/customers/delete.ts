import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import z from "zod";
import {
  deleteCustomerById,
  deleteCustomersByIds,
} from "@/operations/customers";

export const deleteCustomersSchema = z.object({
  ids: z.array(z.uuid()).min(1),
});

export async function deleteCustomer(
  c: Context,
  id: string,
  organizationId: string
) {
  const deleted = await deleteCustomerById(id, organizationId);

  if (!deleted) {
    throw new HTTPException(404, {
      message: "Customer not found",
    });
  }

  return c.json({ data: deleted });
}

export async function deleteCustomers(
  c: Context,
  ids: string[],
  organizationId: string
) {
  const deletedCustomers = await deleteCustomersByIds(ids, organizationId);

  return c.json({
    data: deletedCustomers,
    deletedCount: deletedCustomers.length,
  });
}
