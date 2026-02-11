import { count } from "drizzle-orm";
import type { Context } from "hono";
import z from "zod";
import database from "@/db";
import { location } from "@/db/schema";

interface ListLocationsParams {
  page: number;
  perPage: number;
}

export const getLocationsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(10),
});

export async function list(c: Context, params: ListLocationsParams) {
  const { page, perPage } = params;

  const [locations, [{ total }]] = await Promise.all([
    database.query.location.findMany({
      columns: {
        id: true,
        name: true,
        slug: true,
        type: true,
        brandName: true,
        websiteUrl: true,
        googlePlaceId: true,
      },
      with: {
        city: {
          with: { country: true },
        },
      },
      limit: perPage,
      offset: (page - 1) * perPage,
      orderBy: (l, { desc }) => [desc(l.name)],
    }),
    database.select({ total: count() }).from(location),
  ]);

  return c.json({ data: locations, pageCount: Math.ceil(total / perPage) });
}
