import type { TimerID } from '@getodk/common/types/timers.ts';
import type { Extent } from 'ol/extent';
import { computed, ref, shallowRef } from 'vue';

const SEARCH_DELAY_MS = 1000;
const GEOCODING_URL = 'https://geocode.googleapis.com/v4/geocode/address/';
const GEOCODING_FIELDS =
  'results.formattedAddress,results.location,results.viewport,results.granularity';
const ANTIMERIDIAN_LONGITUDE = 180;
const AREA_GRANULARITY = 'APPROXIMATE';
const MIN_QUERY_LENGTH = 3;
const MAX_PLACE_RESULTS = 4;
const SEARCH_STATUSES = {
  IDLE: 'idle',
  SEARCHING: 'searching',
  RESULTS: 'results',
  ERROR: 'error',
} as const;

type SearchStatus = (typeof SEARCH_STATUSES)[keyof typeof SEARCH_STATUSES];

interface LatLng {
  latitude: number;
  longitude: number;
}

interface GeocodingResult {
  formattedAddress: string;
  location: LatLng;
  viewport: { low: LatLng; high: LatLng };
  granularity: string;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

export interface PlaceSearchResult {
  label: string;
  lonLatViewport: Extent;
  isArea: boolean;
}

const buildPlaceSearchUrl = (query: string) => GEOCODING_URL + encodeURIComponent(query);

/**
 * The map doesn't wrap around (wrapping duplicated it), so it can't show a place that crosses
 * the 180° line. We cut the viewport at the line and keep the side where the place is located.
 */
const buildLonLatViewport = (result: GeocodingResult): Extent => {
  const { low, high } = result.viewport;
  if (low.longitude <= high.longitude) {
    return [low.longitude, low.latitude, high.longitude, high.latitude];
  }

  if (result.location.longitude >= low.longitude) {
    return [low.longitude, low.latitude, ANTIMERIDIAN_LONGITUDE, high.latitude];
  }

  return [-ANTIMERIDIAN_LONGITUDE, low.latitude, high.longitude, high.latitude];
};

const parsePlaceSearchResponse = (body: GeocodingResponse): PlaceSearchResult[] => {
  return (
    (body.results ?? [])
      .map((result) => {
        return {
          label: result.formattedAddress,
          lonLatViewport: buildLonLatViewport(result),
          isArea: result.granularity === AREA_GRANULARITY,
        };
      })
      // Google can name two places the same (a city and its province); keep the first.
      .filter((place, index, places) => {
        return places.findIndex((other) => other.label === place.label) === index;
      })
      .slice(0, MAX_PLACE_RESULTS)
  );
};

const searchPlaces = async (
  query: string,
  apiKey: string,
  signal: AbortSignal
): Promise<PlaceSearchResult[]> => {
  const url = buildPlaceSearchUrl(query);
  const headers = { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': GEOCODING_FIELDS };
  const response = await fetch(url, { headers, signal });
  if (!response.ok) {
    throw new Error(`Place search failed with HTTP ${response.status}`);
  }

  return parsePlaceSearchResponse((await response.json()) as GeocodingResponse);
};

export function usePlaceSearch(apiKey: string) {
  const query = ref('');
  const isActive = shallowRef(false);
  const status = shallowRef<SearchStatus>(SEARCH_STATUSES.IDLE);
  const searchedQuery = shallowRef('');
  const places = shallowRef<PlaceSearchResult[]>([]);
  let searchTimer: TimerID | undefined;
  let request: AbortController | undefined;

  const trimmedQuery = computed(() => query.value.trim());
  const normalizedQuery = computed(() => trimmedQuery.value.toLowerCase());
  const isSettled = computed(() => {
    return status.value === SEARCH_STATUSES.RESULTS || status.value === SEARCH_STATUSES.ERROR;
  });
  const isOpen = computed(() => {
    return isActive.value && isSettled.value && searchedQuery.value === normalizedQuery.value;
  });
  const isSearching = computed(() => {
    return isActive.value && status.value === SEARCH_STATUSES.SEARCHING;
  });
  const hasPlaces = computed(() => places.value.length > 0);
  const hasError = computed(() => status.value === SEARCH_STATUSES.ERROR);
  const isAlreadySearched = computed(() => {
    const isSearchingOrFound =
      status.value === SEARCH_STATUSES.SEARCHING || status.value === SEARCH_STATUSES.RESULTS;
    return searchedQuery.value === normalizedQuery.value && isSearchingOrFound;
  });

  const clearSearchTimer = () => clearTimeout(searchTimer);

  const abortRequest = () => request?.abort();

  const activate = () => {
    isActive.value = true;
  };

  const deactivate = () => {
    isActive.value = false;
  };

  const search = async (): Promise<void> => {
    if (isAlreadySearched.value) {
      return;
    }

    abortRequest();
    const controller = new AbortController();
    request = controller;
    searchedQuery.value = normalizedQuery.value;
    places.value = [];
    status.value = SEARCH_STATUSES.SEARCHING;

    try {
      places.value = await searchPlaces(trimmedQuery.value, apiKey, controller.signal);
      status.value = SEARCH_STATUSES.RESULTS;
    } catch {
      if (!controller.signal.aborted) {
        status.value = SEARCH_STATUSES.ERROR;
      }
    }
  };

  const searchNow = () => {
    clearSearchTimer();
    if (trimmedQuery.value.length < MIN_QUERY_LENGTH) {
      return;
    }

    activate();
    void search();
  };

  const dismiss = () => {
    clearSearchTimer();
    deactivate();
  };

  const scheduleSearch = () => {
    dismiss();
    searchTimer = setTimeout(() => searchNow(), SEARCH_DELAY_MS);
  };

  const select = (place: PlaceSearchResult) => {
    query.value = place.label;
    searchedQuery.value = normalizedQuery.value;
    deactivate();
  };

  const cancel = () => {
    dismiss();
    abortRequest();
  };

  return {
    query,
    places,
    isOpen,
    isSearching,
    hasPlaces,
    hasError,
    activate,
    scheduleSearch,
    searchNow,
    select,
    dismiss,
    cancel,
  };
}
