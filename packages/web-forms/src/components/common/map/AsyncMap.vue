<script setup lang="ts">
/**
 * IMPORTANT: OpenLayers and MapBlock are not statically imported here to enable bundling them into a separate chunk.
 * This prevents unnecessary bloat in the main application bundle, reducing initial load times and improving performance.
 * Use dynamic imports instead (e.g., `await import(importPath)`) for lazy-loading these dependencies only when required.
 */
import type { SelectItem } from '@getodk/xforms-engine';
import ProgressSpinner from 'primevue/progressspinner';
import { computed, type DefineComponent, onMounted, shallowRef } from 'vue';
import {
	createFeatureCollectionAndProps,
	type Feature,
} from '@/components/common/map/createFeatureCollectionAndProps.ts';

type MapBlockComponent = DefineComponent<{
	featureCollection: { type: string; features: Feature[] };
	disabled: boolean;
	orderedExtraProps: Map<string, Array<[key: string, value: string]>>;
	savedFeatureValue: string | undefined;
}>;

interface AsyncMapProps {
	// ToDo: Expand typing when implementing Geo Point/Shape/Trace question types.
	features: readonly SelectItem[];
	disabled: boolean;
	savedFeatureValue: string | undefined;
}

const props = defineProps<AsyncMapProps>();
const emit = defineEmits(['save']);

const STATES = {
	READY: 'ready',
	LOADING: 'loading',
	ERROR: 'error',
} as const;

const mapComponent = shallowRef<MapBlockComponent | null>(null);
const currentState = shallowRef<(typeof STATES)[keyof typeof STATES]>(STATES.LOADING);
const featureCollectionAndProps = computed(() => createFeatureCollectionAndProps(props.features));

const loadMap = async () => {
	currentState.value = STATES.LOADING;

	try {
		mapComponent.value = (
			(await import('./MapBlock.vue')) as {
				default: MapBlockComponent;
			}
		).default;
		currentState.value = STATES.READY;
	} catch {
		currentState.value = STATES.ERROR;
	}
};

const save = (value: string | undefined) => emit('save', value);

onMounted(loadMap);
</script>

<template>
	<div class="async-map-container">
		<div v-if="currentState === STATES.ERROR" class="map-error">
			<!-- TODO: translations -->
			<p class="map-error-message">
				Unable to load map
			</p>
		</div>

		<ProgressSpinner v-else-if="currentState === STATES.LOADING" class="map-spinner" />

		<component
			:is="mapComponent"
			v-else
			:feature-collection="featureCollectionAndProps.featureCollection"
			:ordered-extra-props="featureCollectionAndProps.orderedExtraPropsMap"
			:saved-feature-value="savedFeatureValue"
			:disabled="disabled"
			@save="save"
		/>
	</div>
</template>

<style scoped lang="scss">
.async-map-container {
	display: flex;
	align-items: center;
	justify-content: center;
	height: fit-content;
	width: 100%;
	min-height: 445px;
	background: var(--odk-light-background-color);
	border-radius: var(--odk-radius);
	color: var(--odk-text-color);
}

.map-error {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 40px;
}

.map-error-message {
	font-size: var(--odk-sub-group-font-size);
	font-weight: 600;
	margin: 0;
}

.map-spinner {
	width: 70px;
	height: 70px;
}

.p-button.p-button-contrast.p-button-outlined.retry-button {
	background: var(--odk-base-background-color);

	&:hover {
		background: var(--odk-muted-background-color);
	}
}
</style>
