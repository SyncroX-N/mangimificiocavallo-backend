import { createUpdateSchema } from "drizzle-zod";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type z from "zod";
import { user } from "@/db/schema";
import { updateUser } from "@/operations/users";

interface UpdateUserParams {
  id: string;
  input: UpdateUserInput;
}

export const updateUserSchema = createUpdateSchema(user);
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export async function updateUserHandler(c: Context, params: UpdateUserParams) {
  const { id, input } = params;
  const result = await updateUser(id, input);

  if (!result) {
    throw new HTTPException(404, { message: "User not found" });
  }

  return c.json({ data: result });
}
