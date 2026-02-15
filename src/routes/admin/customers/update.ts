import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import z from "zod";
import { updateCustomer } from "@/operations/customers";

interface UpdateCustomerParams {
  id: string;
  organizationId: string;
  input: UpdateCustomerInput;
}

export const updateCustomerSchema = z.object({
  businessName: z.string().trim().min(1).optional(),
  taxId: z.string().trim().min(1).nullable().optional(),
  vatNumber: z.string().trim().min(1).nullable().optional(),
});
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export async function updateCustomerHandler(
  c: Context,
  params: UpdateCustomerParams
) {
  const { id, organizationId, input } = params;
  const result = await updateCustomer(id, organizationId, input);

  if (!result) {
    throw new HTTPException(404, {
      message: "Customer not found",
    });
  }

  return c.json({ data: result });
}
