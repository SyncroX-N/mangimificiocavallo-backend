/**
 * Custom Access Control for Better Auth Organization Plugin
 *
 * Defines roles and permissions for organization members.
 * - owner: Full system access
 * - admin: Administrative access to manage conversations and resources
 * - member: Limited access (regular users)
 */

import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

/**
 * Custom permission statements
 * Extends the default statements with application-specific resources
 */
const statement = {
  ...defaultStatements,
  // Conversation management permissions
  conversation: ["create", "read", "update", "delete", "assign"],
  // Location management permissions
  location: ["create", "read", "update", "delete"],
  // Event management permissions
  event: ["create", "read", "update", "delete"],
  // City management permissions
  city: ["create", "read", "update", "delete"],
  // Tag management permissions
  tag: ["create", "read", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

/**
 * Owner role - Full system access
 * Can perform all actions on all resources
 */
export const owner = ac.newRole({
  ...ownerAc.statements,
  conversation: ["create", "read", "update", "delete", "assign"],
  location: ["create", "read", "update", "delete"],
  event: ["create", "read", "update", "delete"],
  city: ["create", "read", "update", "delete"],
  tag: ["create", "read", "update", "delete"],
});

/**
 * Admin role - Administrative access
 * Can manage conversations and most resources, but cannot delete organization
 */
export const admin = ac.newRole({
  ...adminAc.statements,
  conversation: ["create", "read", "update", "delete", "assign"],
  location: ["create", "read", "update", "delete"],
  event: ["create", "read", "update", "delete"],
  city: ["create", "read", "update", "delete"],
  tag: ["create", "read", "update", "delete"],
});

/**
 * Member role - Limited access
 * Can only read resources, no administrative capabilities
 */
export const member = ac.newRole({
  ...memberAc.statements,
  conversation: ["read"],
  location: ["read"],
  event: ["read"],
  city: ["read"],
  tag: ["read"],
});
