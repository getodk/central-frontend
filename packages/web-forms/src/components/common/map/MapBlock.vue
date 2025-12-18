<script setup lang="ts">
/**
 * IMPORTANT: Lazy-loaded for OpenLayers isolation.
 * Keep OpenLayers imports/code here only to bundle separately and
 * load on demand. Avoids main bundle bloat.
 */
import IconSVG from '@/components/common/IconSVG.vue';
import type { Mode } from '@/components/common/map/getModeConfig.ts';
import MapConfirm from '@/components/common/map/MapConfirm.vue';
import MapControls from '@/components/common/map/MapControls.vue';
import MapProperties from '@/components/common/map/MapProperties.vue';
import MapStatusBar from '@/components/common/map/MapStatusBar.vue';
import { STATES, useMapBlock } from '@/components/common/map/useMapBlock.ts';
import { type DrawFeatureType } from '@/components/common/map/useMapInteractions.ts';
import { QUESTION_HAS_ERROR } from '@/lib/constants/injection-keys.ts';
import type { Feature, FeatureCollection } from 'geojson';
import type { Coordinate } from 'ol/coordinate';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { computed, type ComputedRef, inject, onMounted, onUnmounted, ref, watch } from 'vue';

interface MapBlockProps {
	featureCollection: FeatureCollection;
	disabled: boolean;
	drawFeatureType?: DrawFeatureType;
	mode: Mode;
	orderedExtraProps: Map<string, Array<[string, string]>>;
	savedFeatureValue: Feature | undefined;
}

const props = defineProps<MapBlockProps>();
const emit = defineEmits(['save']);
const mapElement = ref<HTMLElement | undefined>();
const isFullScreen = ref(false);
const confirmDeleteAction = ref(false);
const selectedVertex = ref<Coordinate | undefined>();
const showErrorStyle = inject<ComputedRef<boolean>>(
	QUESTION_HAS_ERROR,
	computed(() => false)
);

const mapHandler = useMapBlock(
	{ mode: props.mode, drawFeatureType: props.drawFeatureType },
	{
		onFeaturePlacement: () => emitSavedFeature(),
		onVertexSelect: (vertex) => (selectedVertex.value = vertex),
	}
);

const showSecondaryControls = computed(() => {
	return !props.disabled && (mapHandler.canUndoChange() || mapHandler.canDeleteFeatureOrVertex());
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

const handleEscapeKey = (event: KeyboardEvent) => {
	if (event.key === 'Escape' && isFullScreen.value) {
		isFullScreen.value = false;
	}
};

const emitSavedFeature = () => {
	emit('save', mapHandler.getSavedFeatureValue() ?? '');
};

const saveSelection = () => {
	mapHandler.saveSelectedFeature();
	emitSavedFeature();
};

const saveCurrentLocation = () => {
	mapHandler.saveCurrentLocation();
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
</script>

<template>
	<div class="map-block-component">
		<div :class="{ 'map-container': true, 'map-full-screen': isFullScreen }">
			<div ref="mapElement" class="map-block">
				<div v-if="mapHandler.shouldShowMapOverlay()" class="map-overlay">
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
					@toggle-full-screen="isFullScreen = !isFullScreen"
					@fit-all-features="mapHandler.fitToAllFeatures"
					@watch-current-location="mapHandler.watchCurrentLocation"
					@trigger-delete="triggerDelete"
					@undo-last-change="undoLastChange"
				/>

				<Message
					v-if="!disabled && mapHandler.canLongPressAndDrag()"
					severity="contrast"
					closable
					size="small"
					:class="{ 'map-message': true, 'above-secondary-controls': showSecondaryControls }"
				>
					<!-- TODO: translations -->
					<span v-if="savedFeatureValue">Press and drag to move a point</span>
					<span v-else>Long press to place a point</span>
				</Message>
			</div>

			<MapStatusBar
				:draw-feature-type="drawFeatureType"
				:saved-feature-value="savedFeatureValue"
				:selected-vertex="selectedVertex"
				:is-capturing="mapHandler.currentState.value === STATES.CAPTURING"
				class="map-status-bar-component"
				:can-remove="!disabled && mapHandler.canRemoveCurrentLocation()"
				:can-save="!disabled && mapHandler.canSaveCurrentLocation()"
				:can-view-details="mapHandler.canViewProperties()"
				@discard="discardSavedFeature"
				@save="saveCurrentLocation"
				@view-details="mapHandler.selectSavedFeature"
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
			v-if="mapHandler.errorMessage.value"
			:class="{ 'map-block-error': true, 'stack-errors': showErrorStyle }"
		>
			<strong>{{ mapHandler.errorMessage.value.title }}</strong>
			&nbsp;
			<span>{{ mapHandler.errorMessage.value.message }}</span>
		</div>
	</div>

	<MapConfirm
		v-model:visible="confirmDeleteAction"
		:draw-feature-type="drawFeatureType"
		@delete-feature="deleteFeature"
	/>
</template>

<style scoped lang="scss">
@use 'primeflex/core/_variables.scss' as pf;
@use '../../../assets/styles/map-block' as mb;

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
	// Fixes iPhone select issues on map
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
		background-color: rgba(from var(--odk-muted-background-color) r g b / 0.9);
		z-index: var(--odk-z-index-overlay);

		.p-button.p-button-contrast.p-button-outlined {
			background: var(--odk-base-background-color);

			&:hover {
				background: var(--odk-muted-background-color);
			}
		}
	}
}

.map-container.map-full-screen {
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	position: fixed;
	top: 0;
	left: 0;
	height: 100vh;
	width: 100vw;
	z-index: var(--odk-z-index-topmost);

	.map-block {
		flex-grow: 2;
	}
}

.map-block-component :deep(.ol-zoom) {
	@include mb.map-control-bar-vertical;
	bottom: 35px;

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

	.map-block-component .map-block {
		--map-status-bar-min-height: 60px;
		--map-label-min-height: 60px;
		height: calc(100vh - var(--map-status-bar-min-height) - var(--map-label-min-height));

		:deep(.ol-zoom) {
			top: 195px;
			bottom: unset;
		}
	}

	.map-block-component :deep(.ol-zoom) {
		right: var(--odk-map-controls-spacing);
		bottom: var(--odk-map-controls-spacing);
	}

	.map-message.above-secondary-controls {
		bottom: 61px;
	}
}
</style>
