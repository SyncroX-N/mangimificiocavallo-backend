import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";
import { getUser } from "./get";
import { getUsersSchema, list } from "./list";
import { updateUserHandler, updateUserSchema } from "./update";

const usersRoutes = new Hono()
  .get("/", zValidator("query", getUsersSchema), async (c) => {
    const { page, perPage, search } = c.req.valid("query");
    const member = c.get("member");

    return await list(c, {
      organizationId: member.organizationId,
      page,
      perPage,
      search,
    });
  })
  .get("/:id", zValidator("param", z.uuid()), async (c) => {
    const id = c.req.valid("param");
    const member = c.get("member");
    return await getUser(c, id, member.organizationId);
  })
  .patch(
    "/:id",
    zValidator("param", z.uuid()),
    zValidator("json", updateUserSchema),
    async (c) => {
      const id = c.req.valid("param");
      const input = c.req.valid("json");
      const member = c.get("member");
      return await updateUserHandler(c, {
        id,
        organizationId: member.organizationId,
        input,
      });
    }
  );

export { usersRoutes };
