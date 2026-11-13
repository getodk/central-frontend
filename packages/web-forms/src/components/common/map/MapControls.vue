<script setup lang="ts">
import IconSVG from '@getodk/web-forms/components/common/IconSVG.vue';
import type { BaseLayerId } from '@getodk/web-forms/components/common/map/base-layers.ts';
import MapBaseLayerPanel from '@getodk/web-forms/components/common/map/MapBaseLayerPanel.vue';
import { TRANSLATE } from '@getodk/web-forms/lib/constants/injection-keys.ts';
import type { Translate } from '@getodk/web-forms/lib/locale/useLocale.ts';
import { inject, onBeforeUnmount, ref, watch } from 'vue';

defineProps<{
	isFullScreen: boolean;
	disableFitAllFeatures: boolean;
	disableUndo: boolean;
	disableDelete: boolean;
	showSecondaryControls: boolean;
	showBaseLayerPicker: boolean;
	activeBaseLayerId: BaseLayerId;
}>();

const emit = defineEmits([
	'toggleFullScreen',
	'fitAllFeatures',
	'watchCurrentLocation',
	'triggerDelete',
	'undoLastChange',
	'selectBaseLayer',
]);

const t: Translate = inject(TRANSLATE)!;

const MAP_ICONS = {
	zoomFitAll: 'mdiFullscreen',
	currentLocation: 'mdiCrosshairsGps',
	undo: 'mdiArrowULeftTop',
	delete: 'mdiTrashCanOutline',
	openAdvanced: 'mdiCogOutline',
	openFullScreen: 'mdiArrowExpand',
	closeFullScreen: 'mdiArrowCollapse',
	baseLayers: 'mdiLayersOutline',
} as const;

const baseLayerPicker = ref<HTMLElement>();
const isBaseLayerPanelOpen = ref(false);

const closeLayerPicker = (event: PointerEvent) => {
	if (!baseLayerPicker.value?.contains(event.target as Node)) {
		isBaseLayerPanelOpen.value = false;
	}
};

watch(isBaseLayerPanelOpen, (isOpen) => {
	if (isOpen) {
		document.addEventListener('pointerdown', closeLayerPicker);
		return;
	}
	document.removeEventListener('pointerdown', closeLayerPicker);
});

onBeforeUnmount(() => {
	document.removeEventListener('pointerdown', closeLayerPicker);
});
</script>

<template>
	<div class="control-bar" :class="{ 'full-screen-active': isFullScreen }">
		<div class="control-bar-vertical">
			<button
				:aria-label="isFullScreen ? t('common_actions.close_full_screen.description') : t('common_actions.open_full_screen.description')"
				class="fullscreen"
				@click="emit('toggleFullScreen')"
			>
				<IconSVG v-if="isFullScreen" :name="MAP_ICONS.closeFullScreen" />
				<IconSVG v-else :name="MAP_ICONS.openFullScreen" />
			</button>
			<button
				:aria-label="t('map_controls.zoom_fit_all.description')"
				class="zoom-fit-all"
				:disabled="disableFitAllFeatures"
				@click="emit('fitAllFeatures')"
			>
				<IconSVG :name="MAP_ICONS.zoomFitAll" />
			</button>
			<button
				:aria-label="t('map_controls.current_location.description')"
				class="zoom-current-location"
				@click="emit('watchCurrentLocation')"
			>
				<IconSVG :name="MAP_ICONS.currentLocation" size="sm" />
			</button>
			<div v-if="showBaseLayerPicker" ref="baseLayerPicker" class="base-layer-picker">
				<button
					:aria-label="t('map_base_layer_picker.open.description')"
					:aria-expanded="isBaseLayerPanelOpen"
					@click="isBaseLayerPanelOpen = !isBaseLayerPanelOpen"
				>
					<IconSVG :name="MAP_ICONS.baseLayers" />
				</button>
				<MapBaseLayerPanel
					v-if="isBaseLayerPanelOpen"
					class="base-layer-panel"
					:active-layer-id="activeBaseLayerId"
					@select-base-layer="emit('selectBaseLayer', $event)"
				/>
			</div>
		</div>

		<div v-if="showSecondaryControls" class="control-bar-horizontal">
			<button
				:aria-label="t('map_controls.delete.description')"
				:disabled="disableDelete"
				@click="emit('triggerDelete')"
			>
				<IconSVG :name="MAP_ICONS.delete" />
			</button>
			<button
				:aria-label="t('common_actions.undo.description')"
				:disabled="disableUndo"
				@click="emit('undoLastChange')"
			>
				<IconSVG :name="MAP_ICONS.undo" />
			</button>
		</div>
	</div>
</template>

<style scoped lang="scss">
@use 'primeflex/core/_variables.scss' as pf;
@use '../../../assets/styles/panel-controls' as pc;

.control-bar {
	button {
		@include pc.panel-control-button;
	}

	.control-bar-vertical {
		@include pc.panel-control-bar-vertical;
		top: var(--odk-spacing-m);
		overflow: visible;
	}

	.control-bar-horizontal {
		@include pc.panel-control-bar-horizontal;
	}
}

.base-layer-picker {
	position: relative;
	display: flex;
}

.base-layer-panel {
	position: absolute;
	top: 0;
	right: calc(100% + var(--odk-spacing-m));
}

@media screen and (max-width: #{pf.$sm}) {
	.control-bar {
		top: var(--odk-spacing-m);
		right: var(--odk-spacing-m);
	}

	.control-bar:not(.full-screen-active) {
		.control-bar-horizontal,
		.control-bar-vertical .base-layer-picker,
		.control-bar-vertical .zoom-fit-all,
		.control-bar-vertical .zoom-current-location {
			display: none;
		}
	}
}

@include pc.panel-control-sm {
	.control-bar-vertical .base-layer-picker {
		display: none;
	}
}
</style>
