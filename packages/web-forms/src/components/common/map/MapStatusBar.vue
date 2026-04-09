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
import { TRANSLATE } from '@/lib/constants/injection-keys.ts';
import type { Translate } from '@/lib/locale/useLocale.ts';
import { computed, inject } from 'vue';

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

const t: Translate = inject(TRANSLATE)!;

const LINE_ICON = 'mdiVectorPolyline';
const POLYGON_ICON = 'mdiVectorPolygon';

const noSavedStatus = computed<StatusDetails>(() => {
	if (props.singleFeatureType === SINGLE_FEATURE_TYPES.TRACE) {
		return { message: t('map_status_bar.no_trace_saved.label'), icon: LINE_ICON };
	}

	if (props.singleFeatureType === SINGLE_FEATURE_TYPES.SHAPE) {
		return { message: t('map_status_bar.no_shape_saved.label'), icon: POLYGON_ICON };
	}

	return { message: t('map_status_bar.no_point_saved.label'), icon: 'mdiMapMarkerOutline' };
});

const selectedVertexInfo = computed(() => {
	if (!props.selectedVertex || props.selectedVertex.length < 2) {
		return '';
	}

	const [longitude, latitude, altitude, accuracy] = toLonLat(props.selectedVertex);
	const parts = [
		t('map_status_bar.vertex_longitude.label', { longitude }),
		t('map_status_bar.vertex_latitude.label', { latitude }),
	];

	if (altitude != null) {
		parts.push(t('map_status_bar.vertex_altitude.label', { altitude }));
	}

	if (accuracy != null) {
		parts.push(t('map_status_bar.vertex_accuracy.label', { accuracy: truncateDecimals(accuracy, { decimals: 3 }) }));
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
	if (geometryType === 'point') {
		return t('map_status_bar.point_saved.label');
	}

	if (geometryType === 'linestring') {
		return t('map_status_bar.trace_saved.label');
	}

	if (geometryType === 'polygon') {
		return t('map_status_bar.shape_saved.label');
	}

	return t('map_status_bar.feature_saved.label');
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

	const message = t('map_status_bar.points_saved.label', { count });
	if (props.singleFeatureType === SINGLE_FEATURE_TYPES.TRACE) {
		return { message, icon: LINE_ICON };
	}

	if (props.singleFeatureType === SINGLE_FEATURE_TYPES.SHAPE) {
		return { message, icon: POLYGON_ICON };
	}

	return { message: t('map_status_bar.point_saved.label'), icon: 'mdiCheckCircle', highlight: true };
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
		<div class="map-status-container">
			<div v-if="isCapturing" class="map-status">
				<ProgressSpinner class="map-status-spinner" stroke-width="5px" />
				<span>{{ t('map_status_bar.capturing.label') }}</span>
			</div>

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
					<span class="mobile-only">{{ t('odk_web_forms.remove.label') }}</span>
					<span class="desktop-only">{{ t('map_status_bar.remove_point.label') }}</span>
				</Button>
				<Button v-if="canViewDetails" outlined severity="contrast" @click="emit('view-details')">
					<span>{{ t('map_status_bar.view_details.label') }}</span>
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
			<span>{{ t('map_status_bar.advanced.label') }}</span>
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
	padding: var(--odk-spacing-m) 17px;
	min-height: 60px;
	background: var(--odk-light-background-color);
}

.map-status {
	gap: var(--odk-map-controls-spacing);
	-webkit-user-select: text;
	user-select: text;
}

.map-status-container {
	justify-content: space-between;
	width: 100%;
	gap: var(--odk-map-controls-spacing);
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
