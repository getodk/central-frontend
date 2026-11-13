import {
  type BaseLayerId,
  createBaseLayer,
  DEFAULT_BASE_LAYER_ID,
  type MapProvider,
} from '@getodk/web-forms/components/common/map/base-layers.ts';
import type { Map as OlMap } from 'ol';
import type { EventsKey } from 'ol/events';
import type TileLayer from 'ol/layer/Tile';
import { unByKey } from 'ol/Observable';
import type TileSource from 'ol/source/Tile';
import { shallowRef, type ShallowRef } from 'vue';

export interface UseBaseLayer {
  activeLayerId: ShallowRef<BaseLayerId>;
  selectBaseLayer: (layerId: BaseLayerId) => void;
  teardown: () => void;
}

const BASE_LAYER_INDEX = 0;

const reportSessionError = (source: TileSource, onProviderError: () => void) => {
  if (source.getState() === 'error') {
    onProviderError();
  }
};

const disposeLayerAndSource = (layer: TileLayer) => {
  layer.getSource()?.dispose();
  layer.dispose();
};

export function useBaseLayer(
  mapInstance: OlMap,
  provider: MapProvider,
  onProviderError: () => void
): UseBaseLayer {
  const activeLayerId = shallowRef<BaseLayerId>(DEFAULT_BASE_LAYER_ID);
  const layerCache = new Map<BaseLayerId, TileLayer>();
  const listenerKeys: EventsKey[] = [];

  const watchSessionErrors = (layer: TileLayer) => {
    const source = layer.getSource();
    if (provider.kind === 'google' && source) {
      listenerKeys.push(source.on('change', () => reportSessionError(source, onProviderError)));
    }
  };

  const getOrCreateLayer = (layerId: BaseLayerId): TileLayer => {
    const cachedLayer = layerCache.get(layerId);
    if (cachedLayer) {
      return cachedLayer;
    }

    const layer = createBaseLayer(layerId, provider);
    layerCache.set(layerId, layer);
    watchSessionErrors(layer);
    return layer;
  };

  mapInstance.getLayers().insertAt(BASE_LAYER_INDEX, getOrCreateLayer(activeLayerId.value));

  const selectBaseLayer = (layerId: BaseLayerId) => {
    if (layerId === activeLayerId.value) {
      return;
    }

    mapInstance.getLayers().setAt(BASE_LAYER_INDEX, getOrCreateLayer(layerId));
    activeLayerId.value = layerId;
  };

  const teardown = () => {
    unByKey(listenerKeys);
    listenerKeys.length = 0;
    layerCache.forEach((layer) => disposeLayerAndSource(layer));
    layerCache.clear();
  };

  return {
    activeLayerId,
    selectBaseLayer,
    teardown,
  };
}
