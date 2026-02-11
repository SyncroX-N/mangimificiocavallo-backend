import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createCalendarEvent, createCalendarEventSchema } from "./create";
import { list, listCalendarEventsSchema } from "./list";
import { update, updateCalendarEventParamSchema, updateSchema } from "./update";

const calendarEventsRoutes = new Hono()
  .get(
    "/",
    zValidator("query", listCalendarEventsSchema),
    async (c) => await list(c, c.req.valid("query"))
  )
  .post(
    "/",
    zValidator("json", createCalendarEventSchema),
    async (c) => await createCalendarEvent(c, { input: c.req.valid("json") })
  )
  .patch(
    "/:id",
    zValidator("param", updateCalendarEventParamSchema),
    zValidator("json", updateSchema),
    async (c) =>
      await update(c, {
        id: c.req.valid("param").id,
        input: c.req.valid("json"),
      })
  );
export { calendarEventsRoutes };
