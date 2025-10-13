<script setup lang="ts">
/**
 * IMPORTANT: OpenLayers and MapBlock are not statically imported here to enable bundling them into a separate chunk.
 * This prevents unnecessary bloat in the main application bundle, reducing initial load times and improving performance.
 * Use dynamic imports instead (e.g., `await import(importPath)`) for lazy-loading these dependencies only when required.
 */
import type { SelectItem } from '@getodk/xforms-engine';
import ProgressSpinner from 'primevue/progressspinner';
import { computed, type DefineComponent, onMounted, shallowRef, ref } from 'vue';

type Coordinates = [longitude: number, latitude: number];

interface Geometry {
	type: 'LineString' | 'Point' | 'Polygon';
	coordinates: Coordinates | Coordinates[] | Coordinates[][];
}

interface Feature {
	type: 'Feature';
	geometry: Geometry;
	properties: Record<string, string>;
}

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

const PROPERTY_PREFIX = 'odk_'; // Avoids conflicts with OpenLayers (for example, geometry).
const RESERVED_MAP_PROPERTIES = [
	'itextId',
	'geometry',
	'marker-color',
	'marker-symbol',
	'stroke',
	'stroke-width',
	'fill',
];

const mapComponent = shallowRef<MapBlockComponent | null>(null);
const currentState = shallowRef<(typeof STATES)[keyof typeof STATES]>(STATES.LOADING);
const orderedExtraPropsMap = ref<Map<string, Array<[key: string, value: string]>>>(new Map());

const featureCollection = computed(() => {
	orderedExtraPropsMap.value.clear();
	const features: Feature[] = [];

	props.features?.forEach((option) => {
		const orderedProps: Array<[string, string]> = [];
		const reservedProps: Record<string, string> = {
			[PROPERTY_PREFIX + 'label']: option.label?.asString,
			[PROPERTY_PREFIX + 'value']: option.value,
		};

		option.properties.forEach(([key, value]) => {
			if (RESERVED_MAP_PROPERTIES.includes(key)) {
				reservedProps[PROPERTY_PREFIX + key] = value.trim();
			} else {
				orderedProps.push([key, value.trim()]);
			}
		});

		orderedExtraPropsMap.value.set(option.value, orderedProps);

		const geometry = reservedProps[PROPERTY_PREFIX + 'geometry'];
		if (!geometry?.length) {
			// eslint-disable-next-line no-console -- Skip silently to match Collect behaviour.
			console.warn(`Missing or empty geometry for option: ${option.value}`);
			return;
		}

		const geoJSONCoords = getGeoJSONCoordinates(geometry);
		if (!geoJSONCoords?.length) {
			// eslint-disable-next-line no-console -- Skip silently to match Collect behaviour.
			console.warn(`Missing geo points for option: ${option.value}`);
			return;
		}

		features.push({
			type: 'Feature',
			geometry: getGeoJSONGeometry(geoJSONCoords),
			properties: reservedProps,
		});
	});

	return { type: 'FeatureCollection', features };
});

const getGeoJSONCoordinates = (geometry: string) => {
	const coordinates: Coordinates[] = [];
	for (const coord of geometry.split(';')) {
		const [lat, lon] = coord.trim().split(/\s+/).map(Number);

		const isNullLocation = lat === 0 && lon === 0;
		const isValidLatitude = lat != null && !Number.isNaN(lat) && Math.abs(lat) <= 90;
		const isValidLongitude = lon != null && !Number.isNaN(lon) && Math.abs(lon) <= 180;

		if (isNullLocation || !isValidLatitude || !isValidLongitude) {
			// eslint-disable-next-line no-console -- Skip silently to match Collect behaviour.
			console.warn(`Invalid geo point coordinates: ${geometry}`);
			return;
		}

		coordinates.push([lon, lat]);
	}

	return coordinates;
};

const getGeoJSONGeometry = (coords: Coordinates[]): Geometry => {
	if (coords.length === 1) {
		return { type: 'Point', coordinates: coords[0] };
	}

	const [firstLongitude, firstLatitude] = coords[0];
	const [lastLongitude, lastLatitude] = coords[coords.length - 1];

	if (firstLongitude === lastLongitude && firstLatitude === lastLatitude) {
		return { type: 'Polygon', coordinates: [coords] };
	}

	return { type: 'LineString', coordinates: coords };
};

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
			:feature-collection="featureCollection"
			:ordered-extra-props="orderedExtraPropsMap"
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
