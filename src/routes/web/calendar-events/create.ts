import { createInsertSchema } from "drizzle-zod";
import type { Context } from "hono";
import z from "zod";
import database from "@/db";
import { calendarEvent } from "@/db/schema/calendar/calendar-event";

interface CreateCalendarEventParams {
  input: z.infer<typeof createCalendarEventSchema>;
}

export const createCalendarEventSchema = createInsertSchema(calendarEvent)
  .omit({
    id: true,
    organizationId: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional().nullable(),
  });

export async function createCalendarEvent(
  c: Context,
  params: CreateCalendarEventParams
) {
  const { input } = params;

  const [newCalendarEvent] = await database
    .insert(calendarEvent)
    .values({
      ...input,
      organizationId: c.get("session").activeOrganizationId,
      userId: c.get("user").id,
    })
    .returning();

  return c.json({ data: newCalendarEvent }, 201);
}
