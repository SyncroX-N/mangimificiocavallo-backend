import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import z from "zod";
import { customerAddressType } from "@/db/schema";
import { createCustomerAddress } from "@/operations/customers";

interface CreateCustomerAddressParams {
  customerId: string;
  organizationId: string;
  input: CreateCustomerAddressInput;
}

export const createCustomerAddressSchema = z.object({
  type: z.enum(customerAddressType.enumValues).optional(),
  label: z.string().trim().min(1).nullable().optional(),
  line1: z.string().trim().min(1),
  line2: z.string().trim().min(1).nullable().optional(),
  postalCode: z.string().trim().min(1).nullable().optional(),
  city: z.string().trim().min(1),
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
export type CreateCustomerAddressInput = z.infer<
  typeof createCustomerAddressSchema
>;

export async function createCustomerAddressHandler(
  c: Context,
  params: CreateCustomerAddressParams
) {
  const { customerId, organizationId, input } = params;
  const result = await createCustomerAddress(customerId, organizationId, input);

  if (!result) {
    throw new HTTPException(404, {
      message: "Customer not found",
    });
  }

  return c.json({ data: result }, 201);
}
