<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import ActionsInfoDialog, { type ActionInfo } from '@/components/common/ActionsInfoDialog.vue';
import { TRANSLATE } from '@/lib/constants/injection-keys.ts';
import type { Translate } from '@/lib/locale/useLocale.ts';
import { computed, inject, ref } from 'vue';

const props = defineProps<{
	isFullScreen: boolean;
	disableFitAllFeatures: boolean;
	disableUndo: boolean;
	disableDelete: boolean;
	showSecondaryControls: boolean;
}>();

const emit = defineEmits([
	'toggleFullScreen',
	'fitAllFeatures',
	'watchCurrentLocation',
	'triggerDelete',
	'undoLastChange',
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
	openInfo: 'mdiInformationSlabCircleOutline',
} as const;

const showActionsInfo = ref(false);
const processedMapActions = computed((): ActionInfo[] => {
	const actions: ActionInfo[] = props.isFullScreen
		? [{ icon: MAP_ICONS.closeFullScreen, description: t('common_actions.close_full_screen.description') }]
		: [{ icon: MAP_ICONS.openFullScreen, description: t('common_actions.open_full_screen.description') }];

	actions.push(
		{ icon: MAP_ICONS.zoomFitAll, description: t('map_controls.zoom_fit_all.description') },
		{ icon: MAP_ICONS.currentLocation, description: t('map_controls.current_location.description') },
	);

	if (props.showSecondaryControls) {
		actions.push(
			{ icon: MAP_ICONS.undo, description: t('common_actions.undo.description') },
			{ icon: MAP_ICONS.delete, description: t('map_controls.delete.description') },
			{ icon: MAP_ICONS.openAdvanced, infoClasses: ['mobile-only'], description: t('map_controls.open_advanced.description') },
		);
	}

	return actions;
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
			<button
				:aria-label="t('common_actions.open_info.description')"
				class="info-dialog"
				@click="showActionsInfo = true"
			>
				<IconSVG :name="MAP_ICONS.openInfo" />
			</button>
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

	<ActionsInfoDialog v-model:visible="showActionsInfo" :title="t('common_actions.info_dialog.title')" :actions-info="processedMapActions" />
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
	}

	.control-bar-horizontal {
		@include pc.panel-control-bar-horizontal;
	}
}

@media screen and (max-width: #{pf.$sm}) {
	.control-bar {
		top: var(--odk-spacing-m);
		right: var(--odk-spacing-m);
	}

	.control-bar:not(.full-screen-active) {
		.control-bar-horizontal,
		.control-bar-vertical .info-dialog,
		.control-bar-vertical .zoom-fit-all,
		.control-bar-vertical .zoom-current-location {
			display: none;
		}
	}
}

@include pc.panel-control-sm {
	.control-bar-vertical .info-dialog {
		display: none;
	}
}
</style>
