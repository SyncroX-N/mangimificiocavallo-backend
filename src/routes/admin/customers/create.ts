import type { Context } from "hono";
import z from "zod";
import { createCustomer } from "@/operations/customers";
import { createCustomerAddressSchema } from "./create-address";

interface CreateCustomerParams {
  organizationId: string;
  input: CreateCustomerInput;
}

export const createCustomerSchema = z
  .object({
    businessName: z.string().trim().min(1),
    domain: z.string().trim().min(1).nullable().optional(),
    contactPhoneNumber: z.string().trim().min(1).nullable().optional(),
    clientCode: z.string().trim().min(1).nullable().optional(),
    taxId: z.string().trim().min(1).nullable().optional(),
    vatNumber: z.string().trim().min(1).nullable().optional(),
    addresses: z
      .array(
        createCustomerAddressSchema.extend({
          isPrimary: z.boolean(),
        })
      )
      .min(1, "At least one customer address is required"),
  })
  .superRefine((input, context) => {
    const primaryAddressesCount = input.addresses.filter(
      (address) => address.isPrimary
    ).length;

    if (primaryAddressesCount === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["addresses"],
        message: "A primary address is required",
      });
    }

    if (primaryAddressesCount > 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["addresses"],
        message: "Only one primary address is allowed",
      });
    }
  });
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export async function createCustomerHandler(
  c: Context,
  params: CreateCustomerParams
) {
  const { organizationId, input } = params;
  const result = await createCustomer(organizationId, input);

  return c.json({ data: result }, 201);
}
