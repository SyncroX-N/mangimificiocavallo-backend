/** biome-ignore-all lint/performance/noBarrelFile: <ok> */
import { account } from "./auth/account";
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

import { locationTypeEnum, roleEnum } from "./enums";

import { area } from "./location/area";
import { city } from "./location/city";
import { country } from "./location/country";
import { location } from "./location/location";
import {
  areaRelations,
  cityRelations,
  countryRelations,
  locationRelations,
} from "./location/relations";

export { account } from "./auth/account";
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

// Named re-exports for drizzle-kit static discovery
export { locationTypeEnum, roleEnum } from "./enums";

export { area } from "./location/area";
export { city } from "./location/city";
export { country } from "./location/country";
export { location } from "./location/location";
export {
  areaRelations,
  cityRelations,
  countryRelations,
  locationRelations,
} from "./location/relations";

// Default export for drizzle schema
export default {
  // Enums
  locationTypeEnum,
  roleEnum,
  // Tables
  organization,
  user,
  session,
  account,
  verification,
  member,
  invitation,
  country,
  city,
  area,
  location,
  // Relations
  userRelations,
  sessionRelations,
  accountRelations,
  organizationRelations,
  memberRelations,
  invitationRelations,
  countryRelations,
  cityRelations,
  areaRelations,
  locationRelations,
};
