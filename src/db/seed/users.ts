import { faker } from "@faker-js/faker";
import { and, eq } from "drizzle-orm";
import { auth } from "../../../auth";
import database from "..";
import { member } from "../schema/auth/member";
import { organization } from "../schema/auth/organization";
import { user } from "../schema/auth/user";
import { CONFIG } from "./config";

const COMPANY_ROLES = [
  "CEO",
  "CTO",
  "CFO",
  "COO",
  "VP",
  "Director",
  "Manager",
  "Employee",
] as const;

function generateEmail(firstName: string, lastName: string): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@bflexion.com`;
}

export async function createAuthUser(options: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyRole?: string;
  role?: string;
}) {
  const { email, password, firstName, lastName, companyRole, role } = options;
  const existingUserResult = await database
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (existingUserResult[0]) {
    console.log(`   ⚠️  User ${email} already exists`);
    return existingUserResult[0];
  }

  const signUpResponse = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
    },
  });

  if (!signUpResponse?.user) {
    throw new Error(`Failed to create user: ${email}`);
  }

  await database
    .update(user)
    .set({ firstName, lastName, emailVerified: true, companyRole, role })
    .where(eq(user.email, email));

  const [createdUser] = await database
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  console.log(
    `   ✅ Created user: ${email}${companyRole ? ` (${companyRole})` : ""}`
  );
  return createdUser;
}

export async function seedOrganization() {
  console.log("\n🏢 Seeding organization...");

  const [existingOrg] = await database
    .select()
    .from(organization)
    .where(eq(organization.slug, CONFIG.organization.slug))
    .limit(1);

  if (existingOrg) {
    console.log(
      `   ⚠️  Organization "${CONFIG.organization.name}" already exists`
    );
    return existingOrg;
  }

  const [newOrg] = await database
    .insert(organization)
    .values({
      name: CONFIG.organization.name,
      slug: CONFIG.organization.slug,
      createdAt: new Date(),
    })
    .returning();

  console.log(`   ✅ Created organization: ${newOrg.name}`);
  return newOrg;
}

export async function seedOrganizationUsers(
  org: typeof organization.$inferSelect
) {
  console.log("\n👥 Seeding organization users...");

  const orgUsers: {
    user: typeof user.$inferSelect;
    role: "owner" | "admin" | "member";
  }[] = [];

  // Unique roles that must be assigned once each
  const uniqueRoles: (typeof COMPANY_ROLES)[number][] = [
    "CEO",
    "CTO",
    "CFO",
    "COO",
    "VP",
  ];
  const duplicateRoles: (typeof COMPANY_ROLES)[number][] = [
    "Director",
    "Manager",
    "Employee",
  ];
  let uniqueRoleIndex = 0;

  // Create owner - assign CEO
  console.log("\n   Creating owner...");
  const ownerFirstName = faker.person.firstName();
  const ownerLastName = faker.person.lastName();
  const ownerUser = await createAuthUser({
    email: generateEmail(ownerFirstName, ownerLastName),
    password: CONFIG.password,
    firstName: ownerFirstName,
    lastName: ownerLastName,
    companyRole: uniqueRoles[uniqueRoleIndex],
    role: "super-admin",
  });
  uniqueRoleIndex += 1;
  orgUsers.push({ user: ownerUser, role: "owner" });

  // Create admins - assign remaining unique roles (CTO, CFO, COO, VP)
  console.log("\n   Creating admins...");
  for (let i = 1; i <= CONFIG.counts.admins; i += 1) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const companyRole =
      uniqueRoleIndex < uniqueRoles.length
        ? uniqueRoles[uniqueRoleIndex]
        : faker.helpers.arrayElement(duplicateRoles);
    if (uniqueRoleIndex < uniqueRoles.length) {
      uniqueRoleIndex += 1;
    }
    const adminUser = await createAuthUser({
      email: generateEmail(firstName, lastName),
      password: CONFIG.password,
      firstName,
      lastName,
      companyRole,
    });
    orgUsers.push({ user: adminUser, role: "admin" });
  }

  // Create members - assign duplicate roles (Director, Manager, Employee)
  console.log("\n   Creating members...");
  for (let i = 1; i <= CONFIG.counts.members; i += 1) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const companyRole = faker.helpers.arrayElement(duplicateRoles);
    const memberUser = await createAuthUser({
      email: generateEmail(firstName, lastName),
      password: CONFIG.password,
      firstName,
      lastName,
      companyRole,
    });
    orgUsers.push({ user: memberUser, role: "member" });
  }

  // Create member records
  console.log("\n   Creating member records...");
  for (const { user: u, role } of orgUsers) {
    const [existingMember] = await database
      .select()
      .from(member)
      .where(and(eq(member.userId, u.id), eq(member.organizationId, org.id)))
      .limit(1);

    if (!existingMember) {
      await database.insert(member).values({
        userId: u.id,
        organizationId: org.id,
        role,
        isActive: true,
        createdAt: new Date(),
      });
      console.log(`   ✅ Added ${u.email} as ${role}`);
    }
  }

  return orgUsers;
}

export async function seedNormalUsers() {
  console.log("\n👤 Seeding normal users (no organization)...");

  const users: (typeof user.$inferSelect)[] = [];
  const duplicateRoles: (typeof COMPANY_ROLES)[number][] = [
    "Director",
    "Manager",
    "Employee",
  ];

  for (let i = 1; i <= CONFIG.counts.normalUsers; i += 1) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    const companyRole = faker.helpers.arrayElement(duplicateRoles);

    const newUser = await createAuthUser({
      email,
      password: CONFIG.password,
      firstName,
      lastName,
      companyRole,
    });
    users.push(newUser);
  }

  console.log(`   ✅ Created ${users.length} normal users`);
  return users;
}
