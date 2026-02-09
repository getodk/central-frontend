<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import {
	SINGLE_FEATURE_TYPES,
	type SingleFeatureType,
} from '@/components/common/map/getModeConfig.ts';
import { isCoordsEqual } from '@/components/common/map/vertex-geometry.ts';
import { truncateDecimals } from '@/lib/format/truncate-decimals.ts';
import type { Feature, LineString, Point, Polygon, Position } from 'geojson';
import type { Coordinate } from 'ol/coordinate';
import { toLonLat } from 'ol/proj';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import { computed } from 'vue';

interface StatusDetails {
	message: string;
	icon: string;
	highlight?: boolean;
}

const props = defineProps<{
	savedFeatureValue: Feature | undefined;
	selectedVertex: Coordinate | undefined;
	singleFeatureType?: SingleFeatureType;
	isCapturing: boolean;
	isFullScreen: boolean;
	canRemove: boolean;
	canViewDetails: boolean;
	canOpenAdvancedPanel: boolean;
}>();

const emit = defineEmits(['discard', 'toggle-advanced-panel', 'view-details']);

const LINE_ICON = 'mdiVectorPolyline';
const POLYGON_ICON = 'mdiVectorPolygon';

const noSavedStatus = computed<StatusDetails>(() => {
	// TODO: translations
	if (props.singleFeatureType === SINGLE_FEATURE_TYPES.TRACE) {
		return { message: 'No trace saved', icon: LINE_ICON };
	}

	if (props.singleFeatureType === SINGLE_FEATURE_TYPES.SHAPE) {
		return { message: 'No shape saved', icon: POLYGON_ICON };
	}

	return { message: 'No point saved', icon: 'mdiMapMarkerOutline' };
});

const selectedVertexInfo = computed(() => {
	if (!props.selectedVertex || props.selectedVertex.length < 2) {
		return '';
	}

	const [longitude, latitude, altitude, accuracy] = toLonLat(props.selectedVertex);
	const parts = [`Longitude: ${longitude}`, `Latitude: ${latitude}`];

	if (altitude != null) {
		parts.push(`Altitude: ${altitude} m`);
	}

	if (accuracy != null) {
		parts.push(`Accuracy: ${truncateDecimals(accuracy, { decimals: 3 })}`);
	}

	return parts.join(', ');
});

const countPoints = (coords: Position | Position[] | Position[][] | undefined = []) => {
	if (props.singleFeatureType === SINGLE_FEATURE_TYPES.POINT && coords?.length) {
		return 1;
	}

	if (props.singleFeatureType === SINGLE_FEATURE_TYPES.TRACE) {
		return coords.length;
	}

	const ring = coords[0];
	if (
		props.singleFeatureType === SINGLE_FEATURE_TYPES.SHAPE &&
		Array.isArray(ring) &&
		isCoordsEqual(ring[0] as [number, number], ring[ring.length - 1] as [number, number])
	) {
		return ring.length - 1;
	}

	return 0;
};

const getSavedMessageForMultiFeature = (type: string) => {
	const geometryType = type?.toLowerCase();
	// TODO: translations
	if (geometryType === 'point') {
		return 'Point saved';
	}

	if (geometryType === 'linestring') {
		return 'Trace saved';
	}

	if (geometryType === 'polygon') {
		return 'Shape saved';
	}

	return 'Feature saved';
};

const savedStatus = computed<StatusDetails | null>(() => {
	const geometry = props.savedFeatureValue?.geometry as LineString | Point | Polygon | undefined;
	const expectAnyFeature = !props.singleFeatureType;
	if (expectAnyFeature && geometry) {
		return {
			message: getSavedMessageForMultiFeature(geometry.type),
			icon: 'mdiCheckCircle',
			highlight: true,
		};
	}

	const count = countPoints(geometry?.coordinates);
	if (count === 0) {
		return null;
	}

	// TODO: translations
	const message = `${count} points saved`;
	if (props.singleFeatureType === SINGLE_FEATURE_TYPES.TRACE) {
		return { message, icon: LINE_ICON };
	}

	if (props.singleFeatureType === SINGLE_FEATURE_TYPES.SHAPE) {
		return { message, icon: POLYGON_ICON };
	}

	return { message: 'Point saved', icon: 'mdiCheckCircle', highlight: true };
});

const displayState = computed(() => {
	const baseState = savedStatus.value ?? noSavedStatus.value;
	if (selectedVertexInfo.value.length) {
		return { ...baseState, message: selectedVertexInfo.value };
	}
	return { ...baseState };
});
</script>

<template>
	<div class="map-status-bar" :class="{ 'full-screen-active': isFullScreen }">
		<div v-if="isCapturing" class="map-status-container">
			<div class="map-status">
				<ProgressSpinner class="map-status-spinner" stroke-width="5px" />
				<!-- TODO: translations -->
				<span>Capturing location...</span>
			</div>
		</div>

		<div class="map-status-container">
			<div v-if="!isCapturing && displayState" class="map-status">
				<IconSVG
					:name="displayState.icon"
					:variant="displayState.highlight ? 'success' : 'base'"
				/>
				<span>{{ displayState.message }}</span>
			</div>

			<div v-if="savedStatus" class="map-status-buttons">
				<Button v-if="canRemove" outlined severity="contrast" @click="emit('discard')">
					<span>–</span>
					<!-- TODO: translations -->
					<span class="mobile-only">Remove</span>
					<span class="desktop-only">Remove point</span>
				</Button>
				<Button v-if="canViewDetails" outlined severity="contrast" @click="emit('view-details')">
					<!-- TODO: translations -->
					<span>View details</span>
				</Button>
			</div>
		</div>

		<Button
			v-if="canOpenAdvancedPanel"
			class="advanced-button"
			outlined
			severity="contrast"
			@click="emit('toggle-advanced-panel')"
		>
			<IconSVG name="mdiCogOutline" />
			<!-- TODO: translations -->
			<span>Advanced</span>
		</Button>
	</div>
</template>

<style scoped lang="scss">
@use 'primeflex/core/_variables.scss' as pf;

.map-status-bar,
.map-status-container,
.map-status {
	display: flex;
	align-items: center;
	flex-wrap: nowrap;
}

.map-status-bar {
	padding: 10px 17px;
	min-height: 60px;
	background: var(--odk-light-background-color);
}

.map-status {
	gap: 10px;
}

.map-status-container {
	justify-content: space-between;
	width: 100%;
}

.map-status-bar :deep(.p-button).p-button-contrast.p-button-outlined {
	background: var(--odk-base-background-color);
	-webkit-tap-highlight-color: transparent;
	flex-shrink: 0;

	&:hover {
		background: var(--odk-muted-background-color);
	}

	&:disabled {
		cursor: not-allowed;
	}
}

.map-status-spinner {
	width: 20px;
	height: 20px;
}

.map-status-buttons {
	display: flex;
	gap: var(--odk-map-controls-spacing);
}

@media screen and (max-width: #{pf.$sm}) {
	.map-status-bar:not(.full-screen-active) {
		.advanced-button {
			display: none;
		}
	}

	.advanced-button span {
		display: none;
	}
}
</style>
