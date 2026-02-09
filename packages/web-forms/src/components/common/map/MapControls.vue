<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';

defineProps<{
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
</script>

<template>
	<div class="control-bar" :class="{ 'full-screen-active': isFullScreen }">
		<div class="control-bar-vertical">
			<!-- TODO: translations -->
			<button title="Full Screen" @click="emit('toggleFullScreen')">
				<IconSVG v-if="isFullScreen" name="mdiArrowCollapse" />
				<IconSVG v-else name="mdiArrowExpand" />
			</button>
			<!-- TODO: translations -->
			<button
				class="zoom-fit-all"
				title="Zoom to fit all options"
				:disabled="disableFitAllFeatures"
				@click="emit('fitAllFeatures')"
			>
				<IconSVG name="mdiFullscreen" />
			</button>
			<!-- TODO: translations -->
			<button class="zoom-current-location" title="Zoom to current location" @click="emit('watchCurrentLocation')">
				<IconSVG name="mdiCrosshairsGps" size="sm" />
			</button>
		</div>

		<div
			v-if="showSecondaryControls"
			class="control-bar-horizontal"
		>
			<!-- TODO: translations -->
			<button title="Delete" :disabled="disableDelete" @click="emit('triggerDelete')">
				<IconSVG name="mdiTrashCanOutline" />
			</button>
			<!-- TODO: translations -->
			<button
				title="Undo last change"
				:disabled="disableUndo"
				@click="emit('undoLastChange')"
			>
				<IconSVG name="mdiArrowULeftTop" />
			</button>
		</div>
	</div>
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
		border-radius: 10px;
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
		.control-bar-vertical .zoom-fit-all,
		.control-bar-vertical .zoom-current-location {
			display: none;
		}
	}
}
</style>
