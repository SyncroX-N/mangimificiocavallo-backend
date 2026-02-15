import type { InferSelectModel } from "drizzle-orm";
import { and, countDistinct, desc, eq, ilike, or } from "drizzle-orm";
import database from "@/db";
import { member, organization, user } from "@/db/schema";
import type { ListUsersParams } from "@/routes/admin/users/list";
import type { UpdateUserInput } from "@/routes/admin/users/update";

const publicUserColumns = {
  id: true,
  firstName: true,
  lastName: true,
  name: true,
  email: true,
  emailVerified: true,
  image: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * Get a user by id
 * @param userId - The id of the user
 * @param organizationId - Optional organization scope
 * @returns The user
 */
export async function getUserById(userId: string, organizationId?: string) {
  if (organizationId) {
    const [row] = await database
      .select({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .innerJoin(member, eq(member.userId, user.id))
      .where(
        and(eq(user.id, userId), eq(member.organizationId, organizationId))
      )
      .limit(1);

    return row ?? null;
  }

  const row = await database.query.user.findFirst({
    where: (u, { eq: equals }) => equals(u.id, userId),
    columns: publicUserColumns,
  });
  return row ?? null;
}

/**
 * List users
 * @param params - The parameters
 * @param organizationId - Organization scope
 * @returns The users
 */
export async function listUsers(
  organizationId: string,
  params: ListUsersParams
) {
  const { page, perPage, search } = params;
  const sanitizedSearch = search?.trim() || undefined;

  const searchFilter =
    sanitizedSearch && sanitizedSearch.length > 0
      ? or(
          ilike(user.email, `%${sanitizedSearch}%`),
          ilike(user.name, `%${sanitizedSearch}%`),
          ilike(user.firstName, `%${sanitizedSearch}%`),
          ilike(user.lastName, `%${sanitizedSearch}%`)
        )
      : undefined;

  const whereClause = and(
    eq(member.organizationId, organizationId),
    searchFilter
  );

  const baseUsersQuery = database
    .select({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
      member: {
        id: member.id,
        role: member.role,
        isActive: member.isActive,
        organizationId: member.organizationId,
        organizationName: organization.name,
      },
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .leftJoin(organization, eq(member.organizationId, organization.id))
    .where(whereClause)
    .orderBy(desc(user.createdAt))
    .limit(perPage)
    .offset((page - 1) * perPage);

  const totalQuery = database
    .select({ total: countDistinct(user.id) })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(whereClause);

  const [users, [{ total }]] = await Promise.all([baseUsersQuery, totalQuery]);

  return { users, total };
}

/**
 * Update a user
 * @param id - The id of the user
 * @param input - The input
 * @returns The updated user
 */
export async function updateUser(
  id: string,
  organizationId: string,
  input: UpdateUserInput
): Promise<InferSelectModel<typeof user> | null> {
  const [isOrganizationMember] = await database
    .select({ id: member.id })
    .from(member)
    .where(
      and(eq(member.userId, id), eq(member.organizationId, organizationId))
    )
    .limit(1);

  if (!isOrganizationMember) {
    return null;
  }

  const existing = await database.query.user.findFirst({
    where: (u, { eq: equals }) => equals(u.id, id),
  });

  if (!existing) {
    return null;
  }

  const updates: Partial<InferSelectModel<typeof user>> = {
    ...(input.firstName !== undefined && { firstName: input.firstName }),
    ...(input.lastName !== undefined && { lastName: input.lastName }),
    ...(input.email !== undefined && {
      email: input.email.toLowerCase(),
    }),
    ...(input.image !== undefined && {
      image: input.image?.trim() ? input.image.trim() : null,
    }),
  };

  if ("firstName" in updates || "lastName" in updates) {
    const updatedFirst = updates.firstName ?? existing.firstName ?? "";
    const updatedLast = updates.lastName ?? existing.lastName ?? "";
    const fullName = [updatedFirst, updatedLast]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (fullName.length > 0) {
      updates.name = fullName;
    }
  }

  if (Object.keys(updates).length === 0) {
    return existing;
  }

  const [updated] = await database
    .update(user)
    .set(updates)
    .where(eq(user.id, id))
    .returning();

  return updated ?? null;
}
