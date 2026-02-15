import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { deleteCustomerAddressById } from "@/operations/customers";

export async function deleteCustomerAddress(
  c: Context,
  customerId: string,
  addressId: string,
  organizationId: string
) {
  const deleted = await deleteCustomerAddressById(
    customerId,
    addressId,
    organizationId
  );

  if (!deleted) {
    throw new HTTPException(404, {
      message: "Address not found",
    });
  }

  return c.json({ data: deleted });
}
