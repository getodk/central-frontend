<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import MapInfoDialog from '@/components/common/map/MapInfoDialog.vue';
import { computed, ref } from 'vue';

interface MapAction {
	readonly icon: string;
	readonly description: string;
	infoClasses?: string[];
}

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

// TODO translations
const MAP_PRIMARY_ACTIONS = {
	zoomFitAll: {
		icon: 'mdiFullscreen',
		description: 'Show all features on the map',
	},
	currentLocation: {
		icon: 'mdiCrosshairsGps',
		description: 'Find your location',
	},
};
const MAP_SECONDARY_ACTIONS = {
	undo: {
		icon: 'mdiArrowULeftTop',
		description: 'Undo last action',
	},
	delete: {
		icon: 'mdiTrashCanOutline',
		description: 'Delete one vertex or all vertices',
	},
	openAdvanced: {
		icon: 'mdiCogOutline',
		infoClasses: ['mobile-only'],
		description: 'Advanced manual edits',
	},
};
const MAP_FULLSCREEN_ACTIONS = {
	openFullScreen: {
		icon: 'mdiArrowExpand',
		description: 'Expand to full screen',
	},
	closeFullScreen: {
		icon: 'mdiArrowCollapse',
		description: 'Exit full screen',
	},
};
const INFO_ACTION = {
	openInfo: {
		icon: 'mdiInformationSlabCircleOutline',
		description: 'Show information of map actions',
	}
};

const showActionsInfo = ref(false);
const processedMapActions = computed<MapAction[]>(() => {
	const actions: MapAction[] = props.isFullScreen
		? [MAP_FULLSCREEN_ACTIONS.closeFullScreen]
		: [MAP_FULLSCREEN_ACTIONS.openFullScreen];
	actions.push(...Object.values(MAP_PRIMARY_ACTIONS));

	if (props.showSecondaryControls) {
		actions.push(...Object.values(MAP_SECONDARY_ACTIONS));
	}

	return actions;
});
</script>

<template>
	<div class="control-bar" :class="{ 'full-screen-active': isFullScreen }">
		<div class="control-bar-vertical">
			<button
				:aria-label="isFullScreen ? MAP_FULLSCREEN_ACTIONS.closeFullScreen.description : MAP_FULLSCREEN_ACTIONS.openFullScreen.description"
				class="fullscreen"
				@click="emit('toggleFullScreen')"
			>
				<IconSVG v-if="isFullScreen" :name="MAP_FULLSCREEN_ACTIONS.closeFullScreen.icon" />
				<IconSVG v-else :name="MAP_FULLSCREEN_ACTIONS.openFullScreen.icon" />
			</button>
			<button
				:aria-label="MAP_PRIMARY_ACTIONS.zoomFitAll.description"
				class="zoom-fit-all"
				:disabled="disableFitAllFeatures"
				@click="emit('fitAllFeatures')"
			>
				<IconSVG :name="MAP_PRIMARY_ACTIONS.zoomFitAll.icon" />
			</button>
			<button
				:aria-label="MAP_PRIMARY_ACTIONS.currentLocation.description"
				class="zoom-current-location"
				@click="emit('watchCurrentLocation')"
			>
				<IconSVG :name="MAP_PRIMARY_ACTIONS.currentLocation.icon" size="sm" />
			</button>
			<button
				:aria-label="INFO_ACTION.openInfo.description"
				class="info-dialog"
				@click="showActionsInfo = true"
			>
				<IconSVG :name="INFO_ACTION.openInfo.icon" />
			</button>
		</div>

		<div v-if="showSecondaryControls" class="control-bar-horizontal">
			<button
				:aria-label="MAP_SECONDARY_ACTIONS.delete.description"
				:disabled="disableDelete"
				@click="emit('triggerDelete')"
			>
				<IconSVG :name="MAP_SECONDARY_ACTIONS.delete.icon" />
			</button>
			<button
				:aria-label="MAP_SECONDARY_ACTIONS.undo.description"
				:disabled="disableUndo"
				@click="emit('undoLastChange')"
			>
				<IconSVG :name="MAP_SECONDARY_ACTIONS.undo.icon" />
			</button>
		</div>
	</div>

	<MapInfoDialog v-model:visible="showActionsInfo" :actions-info="processedMapActions" />
</template>

<style scoped lang="scss">
@use 'primeflex/core/_variables.scss' as pf;
@use '../../../assets/styles/map-block' as mb;

.control-bar {
	button {
		@include mb.map-control-button;
	}

	.control-bar-vertical {
		@include mb.map-control-bar-vertical;
		top: var(--odk-map-controls-spacing);
	}

	.control-bar-horizontal {
		@include mb.map-control-bar;
		flex-direction: row;
		left: var(--odk-map-controls-spacing);
		bottom: var(--odk-map-controls-spacing);
		background: var(--odk-base-background-color);
		border: 1px solid var(--odk-border-color);
		border-radius: var(--odk-spacing-m);
		gap: 4px;
		padding: 7px;

		button {
			height: 48px;
			width: 48px;
			border: none;
		}
	}
}

@media screen and (max-width: #{pf.$sm}) {
	.control-bar {
		top: var(--odk-map-controls-spacing);
		right: var(--odk-map-controls-spacing);
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

@include mb.map-block-sm {
	.control-bar-vertical .info-dialog {
		display: none;
	}
}
</style>
