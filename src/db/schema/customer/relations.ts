import { relations } from "drizzle-orm";
import { organization } from "../auth/organization";
import { customerAddress } from "./address";
import { customer } from "./customer";

export const customerRelations = relations(customer, ({ one, many }) => ({
  organization: one(organization, {
    fields: [customer.organizationId],
    references: [organization.id],
  }),
  addresses: many(customerAddress),
}));

export const customerAddressRelations = relations(
  customerAddress,
  ({ one }) => ({
    customer: one(customer, {
      fields: [customerAddress.customerId],
      references: [customer.id],
    }),
  })
);
