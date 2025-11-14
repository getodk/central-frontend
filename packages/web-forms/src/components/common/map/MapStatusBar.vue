<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';

defineProps<{
	isFeatureSaved: boolean;
	isCapturing: boolean;
	canRemove: boolean;
	canSave: boolean;
	canViewDetails: boolean;
}>();
const emit = defineEmits(['view-details', 'save', 'discard']);
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

		<div v-else-if="isFeatureSaved" class="map-status-container">
			<div class="map-status">
				<IconSVG name="mdiCheckCircle" variant="success" />
				<!-- TODO: translations -->
				<span>Point saved</span>
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
				<IconSVG name="mdiMapMarkerOutline" />
				<!-- TODO: translations -->
				<span>No point saved</span>
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
