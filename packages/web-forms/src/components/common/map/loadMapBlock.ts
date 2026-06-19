/**
 * IMPORTANT: The dynamic import here keeps MapBlock (and its OpenLayers dependency) in a separate lazy chunk.
 * Do not replace it with a static import.
 *
 * The module-level cache serialises concurrent imports. Safari throws "Cannot access 'default' before initialization"
 * when multiple "import('./MapBlock.vue')" calls are in-flight simultaneously.
 */
import type { DefineComponent } from 'vue';
import type { Mode, SingleFeatureType } from '@/components/common/map/getModeConfig.ts';
import type { Feature } from 'geojson';

export type MapBlockComponent = DefineComponent<{
  featureCollection: { type: string; features: Feature[] };
  disabled: boolean;
  singleFeatureType?: SingleFeatureType;
  mode: Mode;
  orderedExtraProps: Map<string, Array<[key: string, value: string]>>;
  savedFeatureValue: Feature | undefined;
}>;

const cache = { promise: null as Promise<MapBlockComponent> | null };

export const loadMapBlock = (): Promise<MapBlockComponent> => {
  cache.promise ??= (async () =>
    ((await import('./MapBlock.vue')) as { default: MapBlockComponent }).default)();
  return cache.promise;
};
