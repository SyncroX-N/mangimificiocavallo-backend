import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getUserById } from "@/operations/users";

export async function me(c: Context) {
  const sessionUser = c.get("user");
  const member = c.get("member") ?? null;

  if (!sessionUser) {
    throw new HTTPException(401, {
      message: "Unauthorized",
    });
  }

  const dbUser = await getUserById(sessionUser.id);

  if (!dbUser) {
    throw new HTTPException(401, {
      message: "Unauthorized",
    });
  }

  return c.json({
    data: {
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      name: dbUser.name,
      email: dbUser.email,
      emailVerified: dbUser.emailVerified,
      image: dbUser.image,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
      role: member?.role,
      isActive: member?.isActive,
      organizationId: member?.organizationId,
    },
  });
}
