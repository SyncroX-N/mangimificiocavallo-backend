import { and, eq } from "drizzle-orm";
import { auth } from "../../../auth";
import database from "..";
import type { role as roleEnum } from "../schema/auth/enums";
import { member } from "../schema/auth/member";
import { organization } from "../schema/auth/organization";
import { user } from "../schema/auth/user";
import { CONFIG } from "./config";

type Role = (typeof roleEnum.enumValues)[number];

export async function createAuthUser(options: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Role;
}) {
  const { password, firstName, lastName, role } = options;
  const email = options.email.toLowerCase();

  const existingUserResult = await database
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (existingUserResult[0]) {
    await database
      .update(user)
      .set({ firstName, lastName, emailVerified: true, role })
      .where(eq(user.id, existingUserResult[0].id));

    const [updatedUser] = await database
      .select()
      .from(user)
      .where(eq(user.id, existingUserResult[0].id))
      .limit(1);

    console.log(`   ⚠️  User ${email} already exists, updated profile`);
    return updatedUser ?? existingUserResult[0];
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
    .set({ firstName, lastName, emailVerified: true, role })
    .where(eq(user.email, email));

  const [createdUser] = await database
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  console.log(`   ✅ Created user: ${email}`);
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

export async function seedOrganizationOwner(
  org: typeof organization.$inferSelect
) {
  console.log("\n👤 Seeding organization owner...");

  console.log("\n   Creating owner...");
  const ownerUser = await createAuthUser({
    email: CONFIG.owner.email,
    password: CONFIG.password,
    firstName: CONFIG.owner.firstName,
    lastName: CONFIG.owner.lastName,
    role: CONFIG.owner.role,
  });

  const [existingMember] = await database
    .select()
    .from(member)
    .where(
      and(eq(member.userId, ownerUser.id), eq(member.organizationId, org.id))
    )
    .limit(1);

  if (!existingMember) {
    await database.insert(member).values({
      userId: ownerUser.id,
      organizationId: org.id,
      role: "owner",
      isActive: true,
      createdAt: new Date(),
    });
    console.log(`   ✅ Added ${ownerUser.email} as owner`);
    return ownerUser;
  }

  if (existingMember.role !== "owner") {
    await database
      .update(member)
      .set({ role: "owner", isActive: true })
      .where(
        and(eq(member.userId, ownerUser.id), eq(member.organizationId, org.id))
      );
    console.log(`   ✅ Updated ${ownerUser.email} to owner`);
    return ownerUser;
  }

  console.log(`   ⚠️  ${ownerUser.email} is already owner in this organization`);
  return ownerUser;
}
