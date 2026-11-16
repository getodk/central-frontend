import type { TimerID } from '@getodk/common/types/timers.ts';
import type { Extent } from 'ol/extent';
import { computed, ref, shallowRef } from 'vue';

const SEARCH_DELAY_MS = 1000;
const GEOCODING_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const SUCCESS_STATUSES = ['OK', 'ZERO_RESULTS'];
const MAX_PLACE_RESULTS = 4;
const SEARCH_STATUSES = {
  IDLE: 'idle',
  SEARCHING: 'searching',
  RESULTS: 'results',
  ERROR: 'error',
} as const;

type SearchStatus = (typeof SEARCH_STATUSES)[keyof typeof SEARCH_STATUSES];

interface LatLng {
  lat: number;
  lng: number;
}

interface GeocodingResult {
  formatted_address: string;
  geometry: { viewport: { northeast: LatLng; southwest: LatLng } };
}

interface GeocodingResponse {
  status: string;
  results?: GeocodingResult[];
}

export interface PlaceSearchResult {
  label: string;
  lonLatViewport: Extent;
}

const buildPlaceSearchUrl = (query: string, apiKey: string) => {
  const url = new URL(GEOCODING_URL);
  url.searchParams.set('address', query);
  url.searchParams.set('key', apiKey);
  return url.toString();
};

const parsePlaceSearchResponse = (body: GeocodingResponse): PlaceSearchResult[] => {
  if (!SUCCESS_STATUSES.includes(body.status)) {
    throw new Error(`Place search failed with status ${body.status}`);
  }

  return (body.results ?? [])
    .slice(0, MAX_PLACE_RESULTS)
    .map((result: GeocodingResult): PlaceSearchResult => {
      const { southwest, northeast } = result.geometry.viewport;
      return {
        label: result.formatted_address,
        lonLatViewport: [southwest.lng, southwest.lat, northeast.lng, northeast.lat],
      };
    });
};

const searchPlaces = async (
  query: string,
  apiKey: string,
  signal: AbortSignal
): Promise<PlaceSearchResult[]> => {
  const url = buildPlaceSearchUrl(query, apiKey);
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Place search failed with HTTP ${response.status}`);
  }

  return parsePlaceSearchResponse((await response.json()) as GeocodingResponse);
};

export function usePlaceSearch(apiKey: string) {
  const query = ref('');
  const isActive = shallowRef(false);
  const searchTimer = shallowRef<TimerID | undefined>();
  const request = shallowRef<AbortController | undefined>();
  const status = shallowRef<SearchStatus>(SEARCH_STATUSES.IDLE);
  const searchedQuery = shallowRef('');
  const places = shallowRef<PlaceSearchResult[]>([]);

  const trimmedQuery = computed(() => query.value.trim());
  const isSettled = computed(() => {
    return status.value === SEARCH_STATUSES.RESULTS || status.value === SEARCH_STATUSES.ERROR;
  });
  const isOpen = computed(() => {
    return isActive.value && isSettled.value && searchedQuery.value === trimmedQuery.value;
  });
  const hasPlaces = computed(() => places.value.length > 0);
  const hasError = computed(() => status.value === SEARCH_STATUSES.ERROR);

  const isAlreadySearched = (text: string) => {
    const isSearchingOrFound =
      status.value === SEARCH_STATUSES.SEARCHING || status.value === SEARCH_STATUSES.RESULTS;
    return searchedQuery.value === text && isSearchingOrFound;
  };

  const clearSearchTimer = () => clearTimeout(searchTimer.value);

  const abortRequest = () => request.value?.abort();

  const activate = () => {
    isActive.value = true;
  };

  const deactivate = () => {
    isActive.value = false;
  };

  const search = async (text: string): Promise<void> => {
    if (isAlreadySearched(text)) {
      return;
    }

    abortRequest();
    const controller = new AbortController();
    request.value = controller;
    searchedQuery.value = text;
    places.value = [];
    status.value = SEARCH_STATUSES.SEARCHING;

    try {
      places.value = await searchPlaces(text, apiKey, controller.signal);
      status.value = SEARCH_STATUSES.RESULTS;
    } catch {
      if (!controller.signal.aborted) {
        status.value = SEARCH_STATUSES.ERROR;
      }
    }
  };

  const searchNow = () => {
    clearSearchTimer();
    if (!trimmedQuery.value) {
      return;
    }

    activate();
    void search(trimmedQuery.value);
  };

  const dismiss = () => {
    clearSearchTimer();
    deactivate();
  };

  const scheduleSearch = () => {
    dismiss();
    searchTimer.value = setTimeout(() => searchNow(), SEARCH_DELAY_MS);
  };

  const select = (place: PlaceSearchResult) => {
    query.value = place.label;
    searchedQuery.value = place.label;
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
