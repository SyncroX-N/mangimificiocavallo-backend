import type { Context } from "hono";
import z from "zod";
import { getCalendarEvents } from "@/operations/calendar-events";

interface ListCalendarEventsParams {
  startDate: string;
  endDate: string;
}

export const listCalendarEventsSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

export async function list(c: Context, params: ListCalendarEventsParams) {
  const { startDate, endDate } = params;

  const events = await getCalendarEvents({
    organizationId: c.get("session")?.activeOrganizationId,
    startDate,
    endDate,
  });

  return c.json({ data: events });
}
