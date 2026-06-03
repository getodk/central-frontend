<script setup lang="ts">
/**
 * IMPORTANT: OpenLayers and MapBlock are not statically imported here to enable bundling them into a separate chunk.
 * This prevents unnecessary bloat in the main application bundle, reducing initial load times and improving performance.
 * Use dynamic imports instead (e.g., `await import(importPath)`) for lazy-loading these dependencies only when required.
 */
import { createFeatureCollectionAndProps } from '@/components/common/map/geojson-parsers.ts';
import type { Mode, SingleFeatureType } from '@/components/common/map/getModeConfig.ts';
import AsyncLoader from '@/components/common/AsyncLoader.vue';
import { TRANSLATE } from '@/lib/constants/injection-keys.ts';
import type { Translate } from '@/lib/locale/useLocale.ts';
import type { SelectItem } from '@getodk/xforms-engine';
import type { Feature } from 'geojson';
import { computed, type DefineComponent, inject, shallowRef } from 'vue';

type MapBlockComponent = DefineComponent<{
	featureCollection: { type: string; features: Feature[] };
	disabled: boolean;
	singleFeatureType?: SingleFeatureType;
	mode: Mode;
	orderedExtraProps: Map<string, Array<[key: string, value: string]>>;
	savedFeatureValue: Feature | undefined;
}>;

interface AsyncMapProps {
	features?: readonly SelectItem[];
	disabled: boolean;
	singleFeatureType?: SingleFeatureType;
	mode: Mode;
	savedFeatureValue: SelectItem | string | undefined;
}

const props = defineProps<AsyncMapProps>();
const emit = defineEmits(['save']);

const t: Translate = inject(TRANSLATE)!;

const mapComponent = shallowRef<MapBlockComponent | null>(null);
const featureCollectionAndProps = computed(() => createFeatureCollectionAndProps(props.features));
const savedFeatureValue = computed(() => {
	if (!props.savedFeatureValue) {
		return;
	}
	const { featureCollection } = createFeatureCollectionAndProps([props.savedFeatureValue]);
	return featureCollection.features?.[0];
});

const loadMap = async () => {
	mapComponent.value = (
		(await import('./MapBlock.vue')) as {
			default: MapBlockComponent;
		}
	).default;
};

const save = (value: string | undefined) => emit('save', value);
</script>

<template>
	<AsyncLoader :load="loadMap" :error-message="t('map_async.load_error.message')">
		<component
			:is="mapComponent"
			:single-feature-type="singleFeatureType"
			:feature-collection="featureCollectionAndProps.featureCollection"
			:mode="mode"
			:ordered-extra-props="featureCollectionAndProps.orderedExtraPropsMap"
			:saved-feature-value="savedFeatureValue"
			:disabled="disabled"
			@save="save"
		/>
	</AsyncLoader>
</template>
