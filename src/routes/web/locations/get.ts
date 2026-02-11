import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import z from "zod";
import database from "@/db";

interface GetLocationParams {
  id: string;
}

export const getLocationSchema = z.object({
  id: z.uuid(),
});

export async function get(c: Context, params: GetLocationParams) {
  const { id } = params;
  const locationData = await database.query.location.findFirst({
    where: (l, { eq }) => eq(l.id, id),
  });
  if (!locationData) {
    throw new HTTPException(404, {
      message: "Location not found",
    });
  }
  return c.json({ data: locationData });
}
