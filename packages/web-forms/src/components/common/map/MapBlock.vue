<script setup lang="ts">
/**
 * IMPORTANT: Lazy-loaded for OpenLayers isolation.
 * Keep OpenLayers imports/code here only to bundle separately and
 * load on demand. Avoids main bundle bloat.
 */
import IconSVG from '@/components/common/IconSVG.vue';
import { type Mode, type SingleFeatureType } from '@/components/common/map/getModeConfig.ts';
import MapAdvancedPanel from '@/components/common/map/MapAdvancedPanel.vue';
import MapConfirmDialog from '@/components/common/map/MapConfirmDialog.vue';
import MapControls from '@/components/common/map/MapControls.vue';
import MapProperties from '@/components/common/map/MapProperties.vue';
import MapStatusBar from '@/components/common/map/MapStatusBar.vue';
import MapUpdateCoordsDialog from '@/components/common/map/MapUpdateCoordsDialog.vue';
import { STATES, useMapBlock } from '@/components/common/map/useMapBlock.ts';
import { QUESTION_HAS_ERROR } from '@/lib/constants/injection-keys.ts';
import type { Feature, FeatureCollection } from 'geojson';
import type { Coordinate } from 'ol/coordinate';
import { toLonLat } from 'ol/proj';
import Button from 'primevue/button';
import Message from 'primevue/message';
import {
	computed,
	type ComputedRef,
	inject,
	nextTick,
	onMounted,
	onUnmounted,
	ref,
	watch,
} from 'vue';

interface MapBlockProps {
	featureCollection: FeatureCollection;
	disabled: boolean;
	singleFeatureType?: SingleFeatureType;
	mode: Mode;
	orderedExtraProps: Map<string, Array<[string, string]>>;
	savedFeatureValue: Feature | undefined;
}

const props = defineProps<MapBlockProps>();
const emit = defineEmits(['save']);
const mapElement = ref<HTMLElement | undefined>();
const isFullScreen = ref(false);
const isAdvancedPanelOpen = ref(false);
const confirmDeleteAction = ref(false);
const isUpdateCoordsDialogOpen = ref(false);
const pointPlaced = ref(false);
const selectedVertex = ref<Coordinate | undefined>();
const showErrorFullScreen = ref(false);
const showErrorStyle = inject<ComputedRef<boolean>>(
	QUESTION_HAS_ERROR,
	computed(() => false)
);

const mapHandler = useMapBlock(
	{ mode: props.mode, singleFeatureType: props.singleFeatureType },
	{
		onFeaturePlacement: () => onFeaturePlacement(),
		onVertexSelect: (vertex) => (selectedVertex.value = vertex),
	}
);

const advancedPanelCoords = computed<Coordinate | null>(() => {
	if (!mapHandler.canOpenAdvancedPanel()) {
		return null;
	}
	return selectedVertex.value?.length ? toLonLat(selectedVertex.value) : null;
});

const showSecondaryControls = computed(() => {
	return !props.disabled && (mapHandler.canUndoChange() || mapHandler.canDeleteFeatureOrVertex());
});

const instructionMessage = computed(() => {
	if (props.disabled) {
		return null;
	}

	if (mapHandler.canDragFeatureAndVertex()) {
		// TODO: translations
		return {
			placed: 'Press and drag to move a point',
			default: 'Tap to place a point',
		};
	}

	if (mapHandler.canDragFeature()) {
		// TODO: translations
		return {
			placed: 'Tap to move point',
			default: 'Use the location button to center on your current location',
		};
	}

	return null;
});

onMounted(() => {
	if (!mapElement.value || !mapHandler) {
		return;
	}

	mapHandler.initMap(mapElement.value, props.featureCollection, props.savedFeatureValue);
	mapHandler.setupMapInteractions(props.disabled);
	document.addEventListener('keydown', handleEscapeKey);
});

onUnmounted(() => {
	document.removeEventListener('keydown', handleEscapeKey);
	mapHandler.teardownMap();
});

watch(
	() => props.featureCollection,
	(newData) => {
		mapHandler.updateFeatureCollection(newData, props.savedFeatureValue);
		emitSavedFeature();
	},
	{ deep: true }
);

watch(
	() => props.savedFeatureValue,
	(newValue) => {
		mapHandler.findAndSaveFeature(newValue);
	}
);

watch(
	() => props.disabled,
	(newValue) => mapHandler.setupMapInteractions(newValue)
);

watch(isFullScreen, async (newValue) => {
	if (!newValue) {
		await nextTick();
		isAdvancedPanelOpen.value = false;
		mapHandler.fitToAllFeatures();
		mapHandler.stopWatchingCurrentLocation();
	}
});

const onFeaturePlacement = () => emitSavedFeature();

watch(
	() => mapHandler.errorMessage.value,
	() => (showErrorFullScreen.value = !!mapHandler.errorMessage.value)
);

const handleEscapeKey = (event: KeyboardEvent) => {
	if (event.key === 'Escape' && isFullScreen.value) {
		isFullScreen.value = false;
	}
};

const emitSavedFeature = () => {
	const value = mapHandler.getSavedFeatureValue() ?? '';
	pointPlaced.value = !!value.length;
	emit('save', value);
};

const saveSelection = () => {
	mapHandler.saveSelectedFeature();
	emitSavedFeature();
};

const discardSavedFeature = () => {
	mapHandler.discardSavedFeature();
	emitSavedFeature();
};

const triggerDelete = () => {
	if (mapHandler.confirmDeleteFeature()) {
		confirmDeleteAction.value = true;
		return;
	}
	mapHandler.deleteVertex();
	emitSavedFeature();
};

const deleteFeature = () => {
	mapHandler.deleteFeature();
	confirmDeleteAction.value = false;
	emitSavedFeature();
};

const undoLastChange = () => {
	mapHandler.undoLastChange();
	emitSavedFeature();
};

const updateFeatureCoords = (newCoords: Coordinate[] | Coordinate[][]) => {
	mapHandler.updateFeatureCoordinates(newCoords);
	emitSavedFeature();
};

const saveAdvancedPanelCoords = (newCoords: Coordinate) => {
	mapHandler.updateVertexCoords(newCoords);
	emitSavedFeature();
};

const enterFullScreen = () => {
	isFullScreen.value = true;
	if (mapHandler.shouldShowMapOverlay()) {
		mapHandler.watchCurrentLocation();
	}
};

const toggleFullScreen = () => {
	isFullScreen.value = !isFullScreen.value;
};
</script>

<template>
	<div class="map-block-component">
		<div :class="{ 'map-container': true, 'map-full-screen': isFullScreen }">
			<div ref="mapElement" class="map-block">
				<div
					v-if="!isFullScreen"
					class="map-overlay full-screen-overlay"
					@click="enterFullScreen"
				/>
				<div v-if="mapHandler.shouldShowMapOverlay()" class="map-overlay get-location-overlay">
					<Button
						severity="secondary"
						outlined
						class="close-full-screen"
						@click="isFullScreen = false"
					>
						<IconSVG name="mdiClose" size="sm" />
					</Button>
					<Button outlined severity="contrast" @click="mapHandler.watchCurrentLocation">
						<IconSVG name="mdiCrosshairsGps" />
						<!-- TODO: translations -->
						<span>Get location</span>
					</Button>
				</div>

				<MapControls
					:is-full-screen="isFullScreen"
					:disable-fit-all-features="mapHandler.isMapEmpty()"
					:disable-undo="!mapHandler.canUndoChange()"
					:disable-delete="!mapHandler.isFeatureSelected()"
					:show-secondary-controls="showSecondaryControls"
					@toggle-full-screen="toggleFullScreen"
					@fit-all-features="mapHandler.fitToAllFeatures"
					@watch-current-location="mapHandler.watchCurrentLocation"
					@trigger-delete="triggerDelete"
					@undo-last-change="undoLastChange"
				/>

				<Message
					v-if="instructionMessage"
					severity="contrast"
					closable
					size="small"
					:class="{ 'map-message': true, 'above-secondary-controls': isFullScreen && showSecondaryControls }"
				>
					<span v-if="pointPlaced">{{ instructionMessage.placed }}</span>
					<span v-else>{{ instructionMessage.default }}</span>
				</Message>
			</div>

			<MapStatusBar
				:can-open-advanced-panel="!disabled && mapHandler.canOpenAdvancedPanel()"
				:can-remove="!disabled && mapHandler.canRemoveCurrentLocation()"
				:can-view-details="mapHandler.canViewProperties()"
				:single-feature-type="singleFeatureType"
				:is-capturing="mapHandler.currentState.value === STATES.CAPTURING"
				:is-full-screen="isFullScreen"
				:saved-feature-value="savedFeatureValue"
				:selected-vertex="selectedVertex"
				class="map-status-bar-component"
				@discard="discardSavedFeature"
				@view-details="mapHandler.selectSavedFeature"
				@toggle-advanced-panel="isAdvancedPanelOpen = !isAdvancedPanelOpen"
			/>

			<MapAdvancedPanel
				v-if="!disabled && mapHandler.canOpenAdvancedPanel()"
				:is-open="isAdvancedPanelOpen"
				:coordinates="advancedPanelCoords"
				@open-paste-dialog="isUpdateCoordsDialogOpen = true"
				@save="saveAdvancedPanelCoords"
			/>

			<MapProperties
				v-if="mapHandler.canViewProperties()"
				:can-remove="!disabled"
				:can-save="!disabled"
				:is-saved-feature-selected="mapHandler.isSavedFeatureSelected()"
				:ordered-extra-props="orderedExtraProps"
				:reserved-props="mapHandler.getSelectedFeatureProperties()"
				@close="mapHandler.unselectFeature"
				@discard="discardSavedFeature"
				@save="saveSelection"
			/>
		</div>

		<div
			v-if="mapHandler.errorMessage.value && (!isFullScreen || showErrorFullScreen)"
			class="map-block-error"
			:class="{ 'stack-errors': showErrorStyle && !isFullScreen, 'top-position': isFullScreen }"
		>
			<div class="error-message">
				<strong>{{ mapHandler.errorMessage.value.title }}</strong>
				&nbsp;
				<span>{{ mapHandler.errorMessage.value.message }}</span>
			</div>
			<IconSVG
				v-if="isFullScreen"
				class="clear-error"
				name="mdiClose"
				variant="error"
				size="sm"
				@click="showErrorFullScreen = false"
			/>
		</div>
	</div>

	<MapConfirmDialog
		v-model:visible="confirmDeleteAction"
		:single-feature-type="singleFeatureType"
		@delete-feature="deleteFeature"
	/>

	<MapUpdateCoordsDialog
		v-model:visible="isUpdateCoordsDialogOpen"
		:single-feature-type="singleFeatureType"
		@save="updateFeatureCoords"
	/>
</template>

<style scoped lang="scss">
@use 'primeflex/core/_variables.scss' as pf;
@use '../../../assets/styles/map-block' as mb;
@use '../../../assets/styles/buttons' as btn;

.map-block-component {
	position: relative;
	width: 100%;
	height: fit-content;
	background: var(--odk-base-background-color);
	border-radius: var(--odk-radius);
}

.map-container {
	position: relative;
	border: 1px solid var(--odk-border-color);
	border-radius: var(--odk-radius);
	overflow: hidden;
	// iPhone - fixes select issues on map
	-webkit-user-select: none;
	user-select: none;
	-webkit-touch-callout: none;

	.map-block {
		position: relative;
		background: var(--odk-base-background-color);
		width: 100%;
		height: 445px;
	}

	.map-overlay {
		position: absolute;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100%;
	}

	.map-overlay.get-location-overlay {
		background-color: rgba(from var(--odk-muted-background-color) r g b / 0.9);
		z-index: var(--odk-z-index-overlay);

		.close-full-screen {
			@include btn.clear-button;
			display: none;
			top: var(--odk-map-controls-spacing);
			left: var(--odk-map-controls-spacing);
		}

		.p-button.p-button-contrast.p-button-outlined {
			background: var(--odk-base-background-color);

			&:hover {
				background: var(--odk-muted-background-color);
			}
		}
	}

	.map-overlay.full-screen-overlay {
		display: none;
		z-index: var(--odk-z-index-top-overlay);
	}
}

.map-container.map-full-screen {
	position: fixed;
	inset: 0;
	display: flex;
	flex-direction: column;
	width: 100vw;
	height: 100dvh;
	z-index: var(--odk-z-index-topmost);
	background: var(--odk-base-background-color);
	border-radius: 0;

	// Prevent background scroll-chaining
	overscroll-behavior: none;
	// Hand touch gestures (zoom/pan) exclusively to the map engine
	touch-action: none;

	.map-block {
		flex: 1 1 0;
		width: 100%;
		min-height: 0;
		height: auto;
	}

	:deep(.map-status-bar),
	:deep(.advanced-panel) {
		flex-shrink: 0;
	}

	.map-overlay.get-location-overlay .close-full-screen {
		display: block;
	}
}

.map-block-component :deep(.ol-zoom) {
	@include mb.map-control-bar-vertical;
	bottom: 35px;
	height: fit-content;

	button,
	button:hover,
	button:focus,
	button:active {
		@include mb.map-control-button;
	}
}

.map-block-component :deep(.ol-attribution) {
	position: absolute;
	right: 0;
	bottom: 0;
	background: rgba(245, 245, 245, 0.8);

	button {
		display: none;
	}

	ul {
		margin: 0;
		padding: 5px;
	}

	li {
		list-style: none;
	}

	li,
	a {
		font-size: 10px;
		line-height: 14px;
		color: var(--odk-muted-text-color);
	}
}

.map-block-error {
	font-size: var(--odk-base-font-size);
	color: var(--odk-error-text-color);
	background-color: var(--odk-error-background-color);
	border-radius: var(--odk-radius);
	margin-top: 20px;
	padding: 20px;

	&.stack-errors {
		padding: 20px 0 5px 0;
		margin-top: 0;
		border-radius: 0;
	}

	&.top-position {
		display: flex;
		align-items: center;
		justify-content: space-between;
		position: fixed;
		top: var(--odk-map-controls-spacing);
		left: var(--odk-map-controls-spacing);
		right: var(--odk-map-controls-spacing);
		z-index: var(--odk-z-index-topmost);
		margin-top: 0;
	}

	.clear-error {
		cursor: pointer;
	}
}

.map-message {
	width: max-content;
	max-width: calc(100% - (var(--odk-map-controls-spacing) * 2));
	position: absolute;
	z-index: var(--odk-z-index-form-floating);
	bottom: -11px;
	left: 50%;
	transform: translate(-50%, -50%);
}

@media screen and (max-width: #{pf.$sm}) {
	.map-block-component {
		height: fit-content;
	}

	.map-container {
		:deep(.ol-zoom) {
			display: none;
		}

		.map-overlay.full-screen-overlay {
			display: flex;
		}
	}

	.map-container.map-full-screen {
		:deep(.ol-zoom) {
			display: flex;
			top: 195px;
			right: var(--odk-map-controls-spacing);
			bottom: var(--odk-map-controls-spacing);
			height: fit-content;
		}
	}

	.map-message.above-secondary-controls {
		bottom: 61px;
	}
}
</style>
