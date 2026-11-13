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

/**
 * If the map is disposed while the session request is in flight, OpenLayers would still
 * schedule its refresh timer. Failing the response instead stops the source without a timer.
 */
export class DisposableGoogleSource extends Google {
  override async fetchSessionToken(url: string, config: RequestInit): Promise<Response> {
    const response = await super.fetchSessionToken(url, config);
    return this.disposed ? new Response(null, { status: 410 }) : response;
  }
}

const createOsmLayer = () => new TileLayer({ source: new OSM() });

const createGoogleLayer = (layerId: BaseLayerId, apiKey: string) => {
  const source = new DisposableGoogleSource({ key: apiKey, ...GOOGLE_LAYER_OPTIONS[layerId] });
  return new TileLayer({ source });
};

export const createBaseLayer = (layerId: BaseLayerId, provider: MapProvider) => {
  if (provider.kind === 'google') {
    return createGoogleLayer(layerId, provider.apiKey);
  }

  return createOsmLayer();
};
