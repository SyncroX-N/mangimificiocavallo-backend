import { validateEnv } from "@/utils/validate-env";
import type {
  AutocompleteParams,
  PlaceAutocompleteResponse,
  PlaceDetails,
  PlaceDetailsParams,
} from "./types";
import {
  AUTOCOMPLETE_FIELD_MASK,
  buildHeaders,
  buildPlaceDetailsSearchParams,
  GOOGLE_PLACES_BASE_URL,
  parseJsonResponse,
} from "./utils";

const ITALY_REGION_CODE = "it";

class GooglePlacesService {
  private static instance: GooglePlacesService;
  private readonly apiKey: string;

  private constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  static getInstance(): GooglePlacesService {
    if (!GooglePlacesService.instance) {
      const { GOOGLE_PLACES_API_KEY } = validateEnv();
      GooglePlacesService.instance = new GooglePlacesService(
        GOOGLE_PLACES_API_KEY
      );
    }
    return GooglePlacesService.instance;
  }

  async fetchAutocomplete(
    params: AutocompleteParams
  ): Promise<PlaceAutocompleteResponse> {
    const url = `${GOOGLE_PLACES_BASE_URL}/places:autocomplete`;

    const body = {
      input: params.input,
      sessionToken: params.sessionToken,
      languageCode: params.languageCode,
      regionCode: ITALY_REGION_CODE,
      includedRegionCodes: [ITALY_REGION_CODE],
      includedPrimaryTypes: params.includedPrimaryTypes,
      locationBias: params.locationBias
        ? {
            circle: {
              center: {
                latitude: params.locationBias.latitude,
                longitude: params.locationBias.longitude,
              },
              radius: params.locationBias.radiusMeters,
            },
          }
        : undefined,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: buildHeaders(this.apiKey, AUTOCOMPLETE_FIELD_MASK),
      body: JSON.stringify(body),
    });

    return parseJsonResponse<PlaceAutocompleteResponse>(
      response,
      "Failed to fetch place autocomplete suggestions"
    );
  }

  async fetchDetails(params: PlaceDetailsParams): Promise<PlaceDetails> {
    const searchParams = buildPlaceDetailsSearchParams(params);

    const url = `${GOOGLE_PLACES_BASE_URL}/places/${encodeURIComponent(
      params.placeId
    )}?${searchParams.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: buildHeaders(this.apiKey),
    });

    return parseJsonResponse<PlaceDetails>(
      response,
      "Failed to fetch place details"
    );
  }
}

const Service = GooglePlacesService.getInstance();
export { Service as GooglePlacesService };
export const googlePlacesService = Service;
