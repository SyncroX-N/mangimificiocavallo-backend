import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { googlePlacesService } from "@/services/GooglePlaces";
import {
  placeDetailsParamsSchema,
  placeDetailsQuerySchema,
  placesAutocompleteSchema,
} from "./places.schema";

const ITALIAN_LANGUAGE_CODE = "it";
const ITALY_REGION_CODE = "it";

const placesRoutes = new Hono()
  .post(
    "/autocomplete",
    zValidator("json", placesAutocompleteSchema),
    async (c) => {
      const payload = c.req.valid("json");

      const data = await googlePlacesService.fetchAutocomplete({
        input: payload.input,
        sessionToken: payload.sessionToken,
        languageCode: payload.languageCode ?? ITALIAN_LANGUAGE_CODE,
        regionCode: payload.regionCode ?? ITALY_REGION_CODE,
        includedPrimaryTypes: payload.includedPrimaryTypes,
        locationBias: payload.locationBias,
      });

      return c.json({ data });
    }
  )
  .get(
    "/:placeId",
    zValidator("param", placeDetailsParamsSchema),
    zValidator("query", placeDetailsQuerySchema),
    async (c) => {
      const { placeId } = c.req.valid("param");
      const query = c.req.valid("query");
      const fields = query.fields
        ? query.fields
            .split(",")
            .map((field) => field.trim())
            .filter(Boolean)
        : undefined;

      const data = await googlePlacesService.fetchDetails({
        placeId,
        sessionToken: query.sessionToken,
        languageCode: query.languageCode,
        regionCode: query.regionCode,
        fields,
      });

      return c.json({ data });
    }
  );

export { placesRoutes };
