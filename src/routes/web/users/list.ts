import type { Context } from "hono";
import z from "zod";
import { listUsers } from "@/operations/users";

export const getUsersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(10),
  search: z.string().trim().optional(),
});
export type ListUsersParams = z.infer<typeof getUsersSchema>;

export async function list(c: Context, params: ListUsersParams) {
  const { page, perPage, search } = params;

  const { users, total } = await listUsers({ page, perPage, search });

  return c.json({
    data: users,
    pageCount: Math.ceil(total / perPage),
  });
}
