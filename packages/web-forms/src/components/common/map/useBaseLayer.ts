import {
  type BaseLayerId,
  createBaseLayer,
  DEFAULT_BASE_LAYER_ID,
  type MapProvider,
} from '@getodk/web-forms/components/common/map/base-layers.ts';
import type { Map as OlMap } from 'ol';
import type TileLayer from 'ol/layer/Tile';
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

const getActiveLayer = (mapInstance: OlMap) => {
  return mapInstance.getLayers().item(BASE_LAYER_INDEX) as TileLayer;
};

// Disposing the source also removes its listeners.
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

  const watchSessionErrors = (layer: TileLayer) => {
    const source = layer.getSource();
    if (provider.kind === 'google' && source) {
      source.on('change', () => reportSessionError(source, onProviderError));
    }
  };

  const createLayer = (layerId: BaseLayerId): TileLayer => {
    const layer = createBaseLayer(layerId, provider);
    watchSessionErrors(layer);
    return layer;
  };

  mapInstance
    .getLayers()
    .insertAt(BASE_LAYER_INDEX, createLayer(activeLayerId.value));

  const teardown = () => {
    disposeLayerAndSource(getActiveLayer(mapInstance));
  };

  // Recreating a layer is cheap. A hidden layer would keep refreshing its Google session.
  const selectBaseLayer = (layerId: BaseLayerId) => {
    if (layerId === activeLayerId.value) {
      return;
    }

    teardown();
    mapInstance.getLayers().setAt(BASE_LAYER_INDEX, createLayer(layerId));
    activeLayerId.value = layerId;
  };

  return {
    activeLayerId,
    selectBaseLayer,
    teardown,
  };
}
