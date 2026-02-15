import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import z from "zod";
import { customerAddressType } from "@/db/schema";
import { updateCustomerAddress } from "@/operations/customers";

interface UpdateCustomerAddressParams {
  customerId: string;
  addressId: string;
  organizationId: string;
  input: UpdateCustomerAddressInput;
}

export const updateCustomerAddressSchema = z.object({
  type: z.enum(customerAddressType.enumValues).optional(),
  label: z.string().trim().min(1).nullable().optional(),
  line1: z.string().trim().min(1).optional(),
  line2: z.string().trim().min(1).nullable().optional(),
  postalCode: z.string().trim().min(1).nullable().optional(),
  city: z.string().trim().min(1).optional(),
  stateProvince: z.string().trim().min(1).nullable().optional(),
  countryCode: z
    .string()
    .trim()
    .length(2)
    .transform((value) => value.toUpperCase())
    .nullable()
    .optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  googlePlaceId: z.string().trim().min(1).nullable().optional(),
  isPrimary: z.boolean().optional(),
});
export type UpdateCustomerAddressInput = z.infer<
  typeof updateCustomerAddressSchema
>;

export async function updateCustomerAddressHandler(
  c: Context,
  params: UpdateCustomerAddressParams
) {
  const { customerId, addressId, organizationId, input } = params;
  const result = await updateCustomerAddress(
    customerId,
    addressId,
    organizationId,
    input
  );

  if (!result) {
    throw new HTTPException(404, {
      message: "Address not found",
    });
  }

  return c.json({ data: result });
}
