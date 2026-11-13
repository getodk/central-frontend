import type { ClientOptions } from '@getodk/web-forms/lib/client-options.ts';
import TileLayer from 'ol/layer/Tile';
import { OSM } from 'ol/source';
import Google, { type Options as GoogleSourceOptions } from 'ol/source/Google';

export const BASE_LAYER_IDS = {
  ROADMAP: 'roadmap',
  SATELLITE: 'satellite',
  TERRAIN: 'terrain',
} as const;

export type BaseLayerId = (typeof BASE_LAYER_IDS)[keyof typeof BASE_LAYER_IDS];

export const DEFAULT_BASE_LAYER_ID: BaseLayerId = BASE_LAYER_IDS.ROADMAP;

const GOOGLE_LAYER_OPTIONS: Record<BaseLayerId, Omit<GoogleSourceOptions, 'key'>> = {
  [BASE_LAYER_IDS.ROADMAP]: { mapType: 'roadmap' },
  [BASE_LAYER_IDS.SATELLITE]: { mapType: 'satellite', layerTypes: ['layerRoadmap'] },
  [BASE_LAYER_IDS.TERRAIN]: { mapType: 'terrain', layerTypes: ['layerRoadmap'] },
};

export type MapProvider = { kind: 'google'; apiKey: string } | { kind: 'osm' };

export const resolveMapProvider = (clientOptions: ClientOptions | undefined): MapProvider => {
  const apiKey = clientOptions?.googleMapsKey;
  return apiKey ? { kind: 'google', apiKey } : { kind: 'osm' };
};

const FAILED_SESSION_STATUS = 410;

const failedSessionResponse = () => new Response(null, { status: FAILED_SESSION_STATUS });

/**
 * OpenLayers only handles a non-ok response. A rejected fetch (offline) would leave the
 * source loading forever, and a response after dispose would schedule a refresh timer.
 */
class GuardedGoogleSource extends Google {
  override async fetchSessionToken(url: string, config: RequestInit): Promise<Response> {
    const response = await super.fetchSessionToken(url, config).catch(failedSessionResponse);
    return this.disposed ? failedSessionResponse() : response;
  }
}

const createOsmLayer = () => new TileLayer({ source: new OSM() });

const createGoogleLayer = (layerId: BaseLayerId, apiKey: string) => {
  const source = new GuardedGoogleSource({ key: apiKey, ...GOOGLE_LAYER_OPTIONS[layerId] });
  return new TileLayer({ source });
};

export const createBaseLayer = (layerId: BaseLayerId, provider: MapProvider) => {
  if (provider.kind === 'google') {
    return createGoogleLayer(layerId, provider.apiKey);
  }

  return createOsmLayer();
};
