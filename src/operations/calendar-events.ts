import { and } from "drizzle-orm";
import database from "@/db";

interface GetCalendarEventsParams {
  organizationId: string;
  startDate: string;
  endDate: string;
}

export async function getCalendarEvents(params: GetCalendarEventsParams) {
  const { organizationId, startDate, endDate } = params;
  return await database.query.calendarEvent.findMany({
    where: (e, { eq, gte, lte }) =>
      and(
        eq(e.organizationId, organizationId),
        gte(e.startDate, new Date(startDate)),
        lte(e.startDate, new Date(endDate))
      ),
  });
}
