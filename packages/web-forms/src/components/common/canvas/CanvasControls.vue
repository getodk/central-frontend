<script setup lang="ts">
import ActionsInfoDialog, { type ActionInfo } from '@/components/common/ActionsInfoDialog.vue';
import IconSVG from '@/components/common/IconSVG.vue';
import { TRANSLATE } from '@/lib/constants/injection-keys.ts';
import type { Translate } from '@/lib/locale/useLocale.ts';
import ColorPicker, { type ColorPickerChangeEvent } from 'primevue/colorpicker';
import { computed, inject, onBeforeUnmount, ref, watch } from 'vue';
import { DEFAULT_STROKE_COLOR } from '@/components/common/canvas/useCanvasDrawing.ts';
import type { CanvasModeConfig } from '@/components/common/canvas/getModeConfig.ts';

const CONTROL_ICONS = {
	clearAll: 'mdiTrashCanOutline',
	closeFullScreen: 'mdiArrowCollapse',
	colorPicker: 'mdiPalette',
	exitAfterSave: 'mdiCheck',
	openInfo: 'mdiInformationSlabCircleOutline',
	pan: 'mdiHandBackRightOutline',
	undo: 'mdiArrowULeftTop',
	zoomIn: 'mdiPlus',
	zoomOut: 'mdiMinus',
} as const;

const props = defineProps<{
	modeConfig: CanvasModeConfig;
	disableClearAll: boolean;
	disableUndo: boolean;
	disableZoomIn: boolean;
	disableZoomOut: boolean;
	isBlankCanvas: boolean;
	isFullScreen: boolean;
	isPanActive: boolean;
}>();

const emit = defineEmits([
	'changePan',
	'changeColor',
	'clearAll',
	'closeFullScreen',
	'undo',
	'zoomIn',
	'zoomOut',
]);

const t: Translate = inject(TRANSLATE)!;

const colorPickerPanel = ref<HTMLElement>();
const isColorPickerVisible = ref(false);
const selectedColor = ref(DEFAULT_STROKE_COLOR);
const showActionsInfo = ref(false);
const exitFullScreenControl = computed(() => {
	if (props.isBlankCanvas) {
		return {
			icon: CONTROL_ICONS.closeFullScreen,
			description: t('common_actions.close_full_screen.description'),
			infoClasses: ['mobile-only'],
		};
	}
	return {
		icon: CONTROL_ICONS.exitAfterSave,
		description: t('canvas_controls.exit_after_save.description'),
		infoClasses: ['mobile-only'],
	};
});
const processedCanvasActions = computed<ActionInfo[]>(() => [
	exitFullScreenControl.value,
	{ icon: CONTROL_ICONS.colorPicker, description: t('canvas_controls.color_picker.description') },
	{ icon: CONTROL_ICONS.pan, description: t('canvas_controls.pan.description') },
	{ icon: CONTROL_ICONS.zoomIn, description: t('common_actions.zoom_in.description') },
	{ icon: CONTROL_ICONS.zoomOut, description: t('common_actions.zoom_out.description') },
	{ icon: CONTROL_ICONS.clearAll, description: t('canvas_controls.clear_all.description') },
	{ icon: CONTROL_ICONS.undo, description: t('common_actions.undo.description') },
]);

const onColorChange = (event: ColorPickerChangeEvent) => {
	emit('changePan', false);
	selectedColor.value = event.value as string;
	emit('changeColor', `#${selectedColor.value}`);
};

const onClickOutside = (event: PointerEvent) => {
	if (colorPickerPanel.value && !colorPickerPanel.value.contains(event.target as Node)) {
		isColorPickerVisible.value = false;
	}
};

watch(isColorPickerVisible, (visible) => {
	if (visible) {
		document.addEventListener('pointerdown', onClickOutside);
		return;
	}
	document.removeEventListener('pointerdown', onClickOutside);
});

onBeforeUnmount(() => {
	document.removeEventListener('pointerdown', onClickOutside);
});
</script>

<template>
	<div class="control-bar" :class="{ 'full-screen-active': isFullScreen }">
		<div class="control-bar-vertical">
			<button
				v-if="isFullScreen"
				:aria-label="exitFullScreenControl.description"
				class="close-fullscreen"
				@click="emit('closeFullScreen')"
			>
				<IconSVG :name="exitFullScreenControl.icon" />
			</button>

			<button
				v-if="modeConfig.hasColorPicker"
				:aria-label="t('canvas_controls.color_picker.description')"
				class="color-picker-btn"
				@click="isColorPickerVisible = !isColorPickerVisible"
			>
				<span
					v-if="selectedColor !== DEFAULT_STROKE_COLOR"
					class="color-swatch"
					:style="{ background: `#${selectedColor}` }"
				/>
				<IconSVG v-else :name="CONTROL_ICONS.colorPicker" />
			</button>

			<button
				v-if="modeConfig.hasPanToggle"
				:aria-label="t('canvas_controls.pan.description')"
				class="pan-btn"
				:class="{ 'pan-active-btn': isPanActive }"
				@click="emit('changePan', !isPanActive)"
			>
				<IconSVG :name="CONTROL_ICONS.pan" />
			</button>

			<button
				v-if="modeConfig.hasInfoDialog"
				:aria-label="t('common_actions.open_info.description')"
				class="info-dialog"
				@click="showActionsInfo = true"
			>
				<IconSVG :name="CONTROL_ICONS.openInfo" />
			</button>
		</div>

		<div v-if="modeConfig.hasZoom" class="control-bar-zoom">
			<button
				:aria-label="t('common_actions.zoom_in.description')"
				:disabled="disableZoomIn"
				@click="emit('zoomIn')"
			>
				<IconSVG :name="CONTROL_ICONS.zoomIn" />
			</button>

			<button
				:aria-label="t('common_actions.zoom_out.description')"
				:disabled="disableZoomOut"
				@click="emit('zoomOut')"
			>
				<IconSVG :name="CONTROL_ICONS.zoomOut" />
			</button>
		</div>

		<div v-if="modeConfig.hasDelete || modeConfig.hasUndo" class="control-bar-horizontal">
			<button
				v-if="modeConfig.hasDelete"
				:aria-label="t('canvas_controls.clear_all.description')"
				:disabled="disableClearAll"
				@click="emit('clearAll')"
			>
				<IconSVG :name="CONTROL_ICONS.clearAll" />
			</button>

			<button
				v-if="modeConfig.hasUndo"
				:aria-label="t('common_actions.undo.description')"
				:disabled="disableUndo"
				@click="emit('undo')"
			>
				<IconSVG :name="CONTROL_ICONS.undo" />
			</button>
		</div>
	</div>

	<div v-if="isColorPickerVisible" ref="colorPickerPanel" class="color-picker-panel">
		<ColorPicker :model-value="selectedColor" inline @change="onColorChange" />
	</div>

	<ActionsInfoDialog
		v-model:visible="showActionsInfo"
		:title="t('common_actions.info_dialog.title')"
		:actions-info="processedCanvasActions"
	/>
</template>

<style scoped lang="scss">
@use '../../../assets/styles/panel-controls' as pc;
@use '../../../assets/styles/style' as odk;

.control-bar {
	button {
		@include pc.panel-control-button;
	}

	.control-bar-vertical {
		@include pc.panel-control-bar-vertical;
		top: var(--odk-spacing-m);
	}

	.control-bar-zoom {
		@include pc.panel-control-bar-vertical;
		bottom: var(--odk-spacing-m);
	}

	.control-bar-horizontal {
		@include pc.panel-control-bar-horizontal;
	}

	.pan-active-btn,
	.pan-active-btn:hover {
		background: var(--odk-primary-light-background-color);
		border-color: var(--odk-primary-border-color);
	}
}

.color-swatch {
	display: block;
	width: var(--odk-icon-m);
	height: var(--odk-icon-m);
	border-radius: var(--odk-radius);
}

.color-picker-panel {
	position: absolute;
	right: 60px;
	top: var(--odk-spacing-m);
	z-index: var(--odk-z-index-form-floating);
}

button.close-fullscreen {
	display: none;
}

@include odk.sm-constrained {
	// No inline controls when in mobile view
	.control-bar:not(.full-screen-active) {
		display: none;
	}

	button.close-fullscreen {
		display: block;
	}
}
</style>
