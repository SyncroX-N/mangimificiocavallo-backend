/** biome-ignore-all lint/performance/noBarrelFile: <ok> */
import { account } from "./auth/account";
import { role } from "./auth/enums";
import { invitation } from "./auth/invitation";
import { member } from "./auth/member";
import { organization } from "./auth/organization";
import {
  accountRelations,
  invitationRelations,
  memberRelations,
  organizationRelations,
  sessionRelations,
  userRelations,
} from "./auth/relations";
import { session } from "./auth/session";
import { user } from "./auth/user";
import { verification } from "./auth/verification";
import { customerAddress, customerAddressType } from "./customer/address";
import { customer } from "./customer/customer";
import {
  customerAddressRelations,
  customerRelations,
} from "./customer/relations";
import { order } from "./order/order";
import { documentType, paymentMode, paymentStatus } from "./payment/enum";
import { paymentLineItem } from "./payment/line-item";
import { payment } from "./payment/payment";

export { account } from "./auth/account";
// Named re-exports for drizzle-kit static discovery
export { role } from "./auth/enums";
export { invitation } from "./auth/invitation";
export { member } from "./auth/member";
export { organization } from "./auth/organization";
export {
  accountRelations,
  invitationRelations,
  memberRelations,
  organizationRelations,
  sessionRelations,
  userRelations,
} from "./auth/relations";
export { session } from "./auth/session";
export { user } from "./auth/user";
export { verification } from "./auth/verification";
export {
  customerAddress,
  customerAddressType,
} from "./customer/address";
export { customer } from "./customer/customer";
export {
  customerAddressRelations,
  customerRelations,
} from "./customer/relations";
export { order } from "./order/order";
export { documentType, paymentMode, paymentStatus } from "./payment/enum";
export { paymentLineItem } from "./payment/line-item";
export { payment } from "./payment/payment";

// Default export for drizzle schema
export default {
  // Enums
  role,
  paymentMode,
  paymentStatus,
  customerAddressType,
  documentType,
  // Tables
  organization,
  user,
  session,
  account,
  verification,
  member,
  invitation,
  customer,
  customerAddress,
  order,
  paymentLineItem,
  payment,
  // Relations
  userRelations,
  sessionRelations,
  accountRelations,
  organizationRelations,
  memberRelations,
  invitationRelations,
  customerRelations,
  customerAddressRelations,
};
