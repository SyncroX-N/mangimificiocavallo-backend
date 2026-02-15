import z from "zod";

export const placesAutocompleteSchema = z.object({
  input: z.string().min(2, "Input must include at least 2 characters"),
  sessionToken: z.string().optional(),
  languageCode: z.string().optional(),
  regionCode: z.string().length(2, "Use the 2-letter region code").optional(),
  includedPrimaryTypes: z.array(z.string()).min(1).max(10).optional(),
  locationBias: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      radiusMeters: z.number().int().min(1).max(50_000),
    })
    .optional(),
});

export const placeDetailsParamsSchema = z.object({
  placeId: z.string().min(1, "Place ID is required"),
});

export const placeDetailsQuerySchema = z.object({
  sessionToken: z.string().optional(),
  languageCode: z.string().optional(),
  regionCode: z.string().length(2, "Use the 2-letter region code").optional(),
  fields: z.string().optional(),
});

export type PlacesAutocompleteInput = z.infer<typeof placesAutocompleteSchema>;
export type PlaceDetailsParams = z.infer<typeof placeDetailsParamsSchema>;
export type PlaceDetailsQuery = z.infer<typeof placeDetailsQuerySchema>;
