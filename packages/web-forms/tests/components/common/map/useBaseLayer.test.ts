import {
  BASE_LAYER_IDS,
  type MapProvider,
} from '@getodk/web-forms/components/common/map/base-layers.ts';
import { useBaseLayer } from '@getodk/web-forms/components/common/map/useBaseLayer.ts';
import { Map as OlMap } from 'ol';
import type TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { afterEach, describe, expect, it, vi } from 'vitest';

const OSM_PROVIDER: MapProvider = { kind: 'osm' };
const GOOGLE_PROVIDER: MapProvider = { kind: 'google', apiKey: 'test-key' };

const getBaseLayer = (mapInstance: OlMap) => mapInstance.getLayers().item(0) as TileLayer;

const getBaseSource = (mapInstance: OlMap) => getBaseLayer(mapInstance).getSource()!;

const sessionResponse = () => {
  // OpenLayers refreshes the session at expiry. Without one it would refresh in a loop.
  const FAR_FUTURE_EXPIRY = '9999999999';
  const body = { session: 'test-session', expiry: FAR_FUTURE_EXPIRY };
  return new Response(JSON.stringify(body), { status: 200 });
};

const deniedResponse = () => {
  const body = { error: { message: 'API key not valid' } };
  return new Response(JSON.stringify(body), { status: 403 });
};

describe('useBaseLayer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('with the OSM provider', () => {
    it('inserts the default layer below the existing layers', () => {
      const featureLayer = new VectorLayer();
      const mapInstance = new OlMap({ layers: [featureLayer] });
      const baseLayer = useBaseLayer(mapInstance, OSM_PROVIDER, vi.fn());

      expect(mapInstance.getLayers().getArray()).toEqual([getBaseLayer(mapInstance), featureLayer]);
      expect(baseLayer.activeLayerId.value).toBe(BASE_LAYER_IDS.ROADMAP);
    });

    it('replaces and disposes the active layer when another one is selected', () => {
      const mapInstance = new OlMap();
      const baseLayer = useBaseLayer(mapInstance, OSM_PROVIDER, vi.fn());
      const previousLayer = getBaseLayer(mapInstance);
      const disposeLayer = vi.spyOn(previousLayer, 'dispose');
      const disposeSource = vi.spyOn(getBaseSource(mapInstance), 'dispose');

      baseLayer.selectBaseLayer(BASE_LAYER_IDS.SATELLITE);

      expect(mapInstance.getLayers().getLength()).toBe(1);
      expect(getBaseLayer(mapInstance)).not.toBe(previousLayer);
      expect(disposeLayer).toHaveBeenCalledOnce();
      expect(disposeSource).toHaveBeenCalledOnce();
      expect(baseLayer.activeLayerId.value).toBe(BASE_LAYER_IDS.SATELLITE);
    });

    it('keeps the active layer when the same id is selected', () => {
      const mapInstance = new OlMap();
      const baseLayer = useBaseLayer(mapInstance, OSM_PROVIDER, vi.fn());
      const activeLayer = getBaseLayer(mapInstance);
      const disposeLayer = vi.spyOn(activeLayer, 'dispose');

      baseLayer.selectBaseLayer(BASE_LAYER_IDS.ROADMAP);

      expect(getBaseLayer(mapInstance)).toBe(activeLayer);
      expect(disposeLayer).not.toHaveBeenCalled();
    });

    it('disposes the active layer on teardown', () => {
      const mapInstance = new OlMap();
      const baseLayer = useBaseLayer(mapInstance, OSM_PROVIDER, vi.fn());
      const disposeLayer = vi.spyOn(getBaseLayer(mapInstance), 'dispose');
      const disposeSource = vi.spyOn(getBaseSource(mapInstance), 'dispose');

      baseLayer.teardown();

      expect(disposeLayer).toHaveBeenCalledOnce();
      expect(disposeSource).toHaveBeenCalledOnce();
    });
  });

  describe('with the Google provider', () => {
    it('does not report an error when the session is created', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(sessionResponse());
      const onProviderError = vi.fn();
      const mapInstance = new OlMap();
      useBaseLayer(mapInstance, GOOGLE_PROVIDER, onProviderError);

      await vi.waitFor(() => expect(getBaseSource(mapInstance).getState()).toBe('ready'));
      expect(onProviderError).not.toHaveBeenCalled();
    });

    it('reports an error when Google rejects the session request', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(deniedResponse());
      const onProviderError = vi.fn();
      useBaseLayer(new OlMap(), GOOGLE_PROVIDER, onProviderError);

      await vi.waitFor(() => expect(onProviderError).toHaveBeenCalledOnce());
    });

    it('reports an error when the session request fails to reach Google', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
      const onProviderError = vi.fn();
      useBaseLayer(new OlMap(), GOOGLE_PROVIDER, onProviderError);

      await vi.waitFor(() => expect(onProviderError).toHaveBeenCalledOnce());
    });

    it('fails a session that arrives after teardown instead of keeping it alive', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(sessionResponse());
      const mapInstance = new OlMap();
      const baseLayer = useBaseLayer(mapInstance, GOOGLE_PROVIDER, vi.fn());
      const source = getBaseSource(mapInstance);

      baseLayer.teardown();

      await vi.waitFor(() => expect(source.getState()).toBe('error'));
    });
  });
});
