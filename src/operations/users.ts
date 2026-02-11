import type { InferSelectModel } from "drizzle-orm";
import { countDistinct, desc, eq, ilike, or } from "drizzle-orm";
import database from "@/db";
import { member, organization, user } from "@/db/schema";
import type { ListUsersParams } from "@/routes/web/users/list";
import type { UpdateUserInput } from "@/routes/web/users/update";

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
 * @returns The user
 */
export async function getUserById(userId: string) {
  const row = await database.query.user.findFirst({
    where: (u, { eq: equals }) => equals(u.id, userId),
    columns: publicUserColumns,
  });
  return row ?? null;
}

/**
 * List users
 * @param params - The parameters
 * @returns The users
 */
export async function listUsers(params: ListUsersParams) {
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

  const baseUsersQuery = database
    .select({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      companyRole: user.companyRole,
      createdAt: user.createdAt,
      member: {
        id: member.id,
        role: member.role,
        isActive: member.isActive,
        organizationId: member.organizationId,
        organizationName: organization.name,
      },
    })
    .from(user)
    .leftJoin(member, eq(member.userId, user.id))
    .leftJoin(organization, eq(member.organizationId, organization.id))
    .orderBy(desc(user.createdAt))
    .limit(perPage)
    .offset((page - 1) * perPage);

  const usersQuery = searchFilter
    ? baseUsersQuery.where(searchFilter)
    : baseUsersQuery;

  const baseTotalQuery = database
    .select({ total: countDistinct(user.id) })
    .from(user)
    .leftJoin(member, eq(member.userId, user.id));

  const totalQuery = searchFilter
    ? baseTotalQuery.where(searchFilter)
    : baseTotalQuery;

  const [users, [{ total }]] = await Promise.all([usersQuery, totalQuery]);

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
  input: UpdateUserInput
): Promise<InferSelectModel<typeof user> | null> {
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
