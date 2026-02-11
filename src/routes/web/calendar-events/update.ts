import { eq } from "drizzle-orm";
import { createUpdateSchema } from "drizzle-zod";
import type { Context } from "hono";
import z from "zod";
import database from "@/db";
import { calendarEvent } from "@/db/schema/calendar/calendar-event";

interface UpdateCalendarEventParams {
  id: string;
  input: z.infer<typeof updateSchema>;
}

export const updateCalendarEventParamSchema = z.object({
  id: z.uuid(),
});
export const updateSchema = createUpdateSchema(calendarEvent).extend({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export async function update(c: Context, params: UpdateCalendarEventParams) {
  const { id, input } = params;

  const [updatedEvent] = await database
    .update(calendarEvent)
    .set(input)
    .where(eq(calendarEvent.id, id))
    .returning();

  return c.json({ data: updatedEvent });
}
