<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import {
	DRAW_FEATURE_TYPES,
	type DrawFeatureType,
} from '@/components/common/map/useMapInteractions.ts';
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
	drawFeatureType?: DrawFeatureType;
	isCapturing: boolean;
	canRemove: boolean;
	canSave: boolean;
	canViewDetails: boolean;
}>();

const emit = defineEmits(['view-details', 'save', 'discard']);

const LINE_ICON = 'mdiVectorPolyline';
const POLYGON_ICON = 'mdiVectorPolygon';

const noSavedStatus = computed<StatusDetails>(() => {
	// TODO: translations
	if (props.drawFeatureType === DRAW_FEATURE_TYPES.TRACE) {
		return { message: 'No trace saved', icon: LINE_ICON };
	}

	if (props.drawFeatureType === DRAW_FEATURE_TYPES.SHAPE) {
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
	const isPoint = !props.drawFeatureType && coords?.length;
	if (isPoint) {
		return 1;
	}

	if (props.drawFeatureType === DRAW_FEATURE_TYPES.TRACE) {
		return coords.length;
	}

	const ring = coords[0];
	if (
		props.drawFeatureType === DRAW_FEATURE_TYPES.SHAPE &&
		Array.isArray(ring) &&
		isCoordsEqual(ring[0] as [number, number], ring[ring.length - 1] as [number, number])
	) {
		return ring.length - 1;
	}

	return 0;
};

const savedStatus = computed<StatusDetails | null>(() => {
	const geometry = props.savedFeatureValue?.geometry as LineString | Point | Polygon | undefined;
	const count = countPoints(geometry?.coordinates);
	if (count === 0) {
		return null;
	}

	// TODO: translations
	const message = `${count} points saved`;
	if (props.drawFeatureType === DRAW_FEATURE_TYPES.TRACE) {
		return { message, icon: LINE_ICON };
	}

	if (props.drawFeatureType === DRAW_FEATURE_TYPES.SHAPE) {
		return { message, icon: POLYGON_ICON };
	}

	return { message: 'Point saved', icon: 'mdiCheckCircle', highlight: true };
});
</script>

<template>
	<div class="map-status-bar">
		<div v-if="isCapturing" class="map-status-container">
			<div class="map-status">
				<ProgressSpinner class="map-status-spinner" stroke-width="5px" />
				<!-- TODO: translations -->
				<span>Capturing location...</span>
			</div>
		</div>

		<div v-else-if="savedStatus" class="map-status-container">
			<div v-if="selectedVertexInfo.length" class="map-status">
				<IconSVG :name="savedStatus.icon" :variant="savedStatus.highlight ? 'success' : 'base'" />
				<span>{{ selectedVertexInfo }}</span>
			</div>
			<div v-else class="map-status">
				<IconSVG :name="savedStatus.icon" :variant="savedStatus.highlight ? 'success' : 'base'" />
				<span>{{ savedStatus.message }}</span>
			</div>
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

		<div v-else class="map-status-container">
			<div class="map-status">
				<IconSVG :name="noSavedStatus.icon" />
				<!-- TODO: translations -->
				<span>{{ noSavedStatus.message }}</span>
			</div>
			<Button v-if="canSave" @click="emit('save')">
				<IconSVG name="mdiCheckboxMarkedCircleOutline" size="sm" variant="inverted" />
				<!-- TODO: translations -->
				<span class="mobile-only">Save</span>
				<span class="desktop-only">Save point</span>
			</Button>
		</div>
	</div>
</template>

<style scoped lang="scss">
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
}

.map-status-spinner {
	width: 20px;
	height: 20px;
}
</style>
