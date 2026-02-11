import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getUserById } from "@/operations/users";

export async function getUser(c: Context, id: string) {
  const existing = await getUserById(id);

  if (!existing) {
    throw new HTTPException(404, {
      message: "User not found",
    });
  }

  return c.json({ data: existing });
}
