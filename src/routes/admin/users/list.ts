import type { Context } from "hono";
import z from "zod";
import { listUsers } from "@/operations/users";

export const getUsersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(10),
  search: z.string().trim().optional(),
});
export type ListUsersParams = z.infer<typeof getUsersSchema>;

interface ListUsersHandlerParams extends ListUsersParams {
  organizationId: string;
}

export async function list(c: Context, params: ListUsersHandlerParams) {
  const { organizationId, page, perPage, search } = params;

  const { users, total } = await listUsers(organizationId, {
    page,
    perPage,
    search,
  });

  return c.json({
    data: users,
    pageCount: Math.ceil(total / perPage),
  });
}
