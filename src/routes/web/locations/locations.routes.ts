import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { get, getLocationSchema } from "./get";
import { getLocationsSchema, list } from "./list";

const locationsRoutes = new Hono()
  .get("/", zValidator("query", getLocationsSchema), async (c) => {
    const { page, perPage } = c.req.valid("query");
    return await list(c, { page, perPage });
  })
  .get("/:id", zValidator("param", getLocationSchema), async (c) => {
    const { id } = c.req.valid("param");
    return await get(c, { id });
  });

export { locationsRoutes };
