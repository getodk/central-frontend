<script setup lang="ts">
/**
 * IMPORTANT: Lazy-loaded for OpenLayers isolation.
 * Keep OpenLayers imports/code here only to bundle separately and
 * load on demand. Avoids main bundle bloat.
 */
import IconSVG from '@/components/common/IconSVG.vue';
import MapProperties from '@/components/common/map/MapProperties.vue';
import MapStatusBar from '@/components/common/map/MapStatusBar.vue';
import { useMapBlock } from '@/components/common/map/useMapBlock.ts';
import { QUESTION_HAS_ERROR } from '@/lib/constants/injection-keys.ts';
import type { FeatureCollection } from 'geojson';
import { computed, type ComputedRef, inject, onMounted, onUnmounted, ref, watch } from 'vue';

interface MapBlockProps {
	featureCollection: FeatureCollection;
	disabled: boolean;
	orderedExtraProps: Map<string, Array<[string, string]>>;
	savedFeatureValue: string | undefined;
}

const props = defineProps<MapBlockProps>();
const emit = defineEmits(['save']);
const mapElement = ref<HTMLElement | undefined>();
const isFullScreen = ref(false);
const showErrorStyle = inject<ComputedRef<boolean>>(
	QUESTION_HAS_ERROR,
	computed(() => false)
);

const mapHandler = useMapBlock();

onMounted(() => {
	if (!mapElement.value || !mapHandler) {
		return;
	}

	mapHandler.initializeMap(mapElement.value, props.featureCollection);
	mapHandler.toggleClickBinding(!props.disabled);
	mapHandler.setSavedByValueProp(props.savedFeatureValue);
	document.addEventListener('keydown', handleEscapeKey);
});

onUnmounted(() => {
	document.removeEventListener('keydown', handleEscapeKey);
});

watch(
	() => props.featureCollection,
	(newData) => {
		mapHandler.loadGeometries(newData);
		mapHandler.setSavedByValueProp(props.savedFeatureValue);
	},
	{ deep: true }
);

watch(
	() => props.savedFeatureValue,
	(newSaved) => mapHandler.setSavedByValueProp(newSaved)
);

watch(
	() => props.disabled,
	(newValue) => mapHandler.toggleClickBinding(!newValue)
);

const handleEscapeKey = (event: KeyboardEvent) => {
	if (event.key === 'Escape' && isFullScreen.value) {
		isFullScreen.value = false;
	}
};

const saveSelection = () => {
	mapHandler.saveFeature();
	emit('save', mapHandler.savedFeature.value?.getProperties()?.odk_value);
};

const discardSavedFeature = () => {
	mapHandler.discardSavedFeature();
	emit('save', null);
};
</script>

<template>
	<div class="map-block-component">
		<div :class="{ 'map-container': true, 'map-full-screen': isFullScreen }">
			<div class="control-bar">
				<!-- TODO: translations -->
				<button :class="{ 'control-active': isFullScreen }" title="Full Screen" @click="isFullScreen = !isFullScreen">
					<IconSVG name="mdiArrowExpandAll" size="sm" />
				</button>
				<!-- TODO: translations -->
				<button title="Zoom to fit all options" @click="mapHandler.fitToAllFeatures">
					<IconSVG name="mdiFullscreen" />
				</button>
				<!-- TODO: translations -->
				<button title="Zoom to current location" @click="mapHandler.centerCurrentLocation">
					<IconSVG name="mdiCrosshairsGps" size="sm" />
				</button>
			</div>

			<div ref="mapElement" class="map-block" />

			<MapStatusBar
				:has-saved-feature="!!mapHandler.savedFeature.value"
				class="map-status-bar-component"
				@view-details="mapHandler.selectSavedFeature()"
			/>

			<MapProperties
				v-if="mapHandler.selectedFeatureProperties.value"
				:reserved-props="mapHandler.selectedFeatureProperties.value"
				:ordered-extra-props="orderedExtraProps"
				:has-saved-feature="mapHandler.isSelectedFeatureSaved()"
				:disabled="disabled"
				@close="mapHandler.unselectFeature()"
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
</template>

<style scoped lang="scss">
@use 'primeflex/core/_variables.scss' as pf;

.map-block-component {
	--odk-map-spacing: 10px;
}

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

	.map-block {
		background: var(--odk-base-background-color);
		width: 100%;
		height: 445px;
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

.control-bar {
	position: absolute;
	display: flex;
	flex-direction: column;
	top: var(--odk-map-spacing);
	right: var(--odk-map-spacing);
	z-index: var(--odk-z-index-form-floating);
	gap: 4px;

	button {
		background: var(--odk-base-background-color);
		padding: 8px;
		border-radius: var(--odk-radius);
		border: 1px solid var(--odk-border-color);
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;

		&:hover {
			background: var(--odk-muted-background-color);
		}
	}
}

.map-block-component :deep(.ol-zoom) {
	position: absolute;
	right: var(--odk-map-spacing);
	bottom: var(--odk-map-spacing);
	display: flex;
	flex-direction: column;
	flex-wrap: nowrap;
	align-items: center;
	box-shadow: none;
	background: var(--odk-base-background-color);
	border-radius: var(--odk-radius);
	overflow: hidden;
	border: 1px solid var(--odk-border-color);

	button,
	button:hover,
	button:focus,
	button:active {
		height: 37px;
		width: 36px;
		border: none;
		background: var(--odk-base-background-color);
		-webkit-tap-highlight-color: transparent;
		font-size: 24px;
		font-weight: 300;
		cursor: pointer;

		&:first-child {
			border-bottom: 1px solid var(--odk-border-color);
		}

		&:hover {
			background: var(--odk-muted-background-color);
		}
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

@media screen and (max-width: #{pf.$sm}) {
	.map-block-component {
		--odk-map-spacing: 5px;
	}

	.map-block-component {
		height: fit-content;
	}

	.map-block-component .map-block {
		--map-status-bar-min-height: 60px;
		--map-label-min-height: 60px;
		height: calc(100vh - var(--map-status-bar-min-height) - var(--map-label-min-height));

		:deep(.ol-zoom) {
			top: 165px;
			bottom: unset;
		}
	}

	.control-bar {
		top: var(--odk-map-spacing);
		right: var(--odk-map-spacing);
	}

	.map-block-component :deep(.ol-zoom) {
		right: var(--odk-map-spacing);
		bottom: var(--odk-map-spacing);
	}
}
</style>
