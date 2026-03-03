import { relations } from "drizzle-orm";
import { organization } from "../auth/organization";
import { customerAddress } from "./address";
import { customerContact } from "./contact";
import { customer } from "./customer";

export const customerRelations = relations(customer, ({ one, many }) => ({
  organization: one(organization, {
    fields: [customer.organizationId],
    references: [organization.id],
  }),
  addresses: many(customerAddress),
  contacts: many(customerContact),
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

export const customerContactRelations = relations(
  customerContact,
  ({ one }) => ({
    customer: one(customer, {
      fields: [customerContact.customerId],
      references: [customer.id],
    }),
  })
);
