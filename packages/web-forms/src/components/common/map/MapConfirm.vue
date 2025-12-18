<script setup lang="ts">
import {
	DRAW_FEATURE_TYPES,
	type DrawFeatureType,
} from '@/components/common/map/useMapInteractions.ts';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

defineProps<{
	drawFeatureType: DrawFeatureType | undefined;
	visible: boolean;
}>();

const emit = defineEmits(['update:visible', 'deleteFeature']);
</script>

<template>
	<Dialog :visible="visible" modal class="map-block-dialog" :draggable="false" @update:visible="emit('update:visible', $event)">
		<template #header>
			<!-- TODO: translations -->
			<strong v-if="drawFeatureType === DRAW_FEATURE_TYPES.SHAPE">Delete entire shape?</strong>
			<strong v-else>Delete entire trace?</strong>
		</template>

		<template #default>
			<!-- TODO: translations -->
			<p v-if="drawFeatureType === DRAW_FEATURE_TYPES.SHAPE">
				Are you sure you want to delete this entire shape and start over?
			</p>
			<p v-else>
				Are you sure you want to delete this entire trace and start over?
			</p>
		</template>

		<template #footer>
			<!-- TODO: translations -->
			<Button label="Delete" @click="emit('deleteFeature')" />
		</template>
	</Dialog>
</template>

<style lang="scss">
// Override PrimeVue dialog style that is outside scoped (rendered outside the component)
.p-dialog.map-block-dialog {
	background: var(--odk-base-background-color);
	border-radius: var(--odk-radius);
	margin: 0 24px;

	.p-dialog-header {
		padding: 15px 20px;
		font-size: var(--odk-dialog-title-font-size);
	}

	.p-dialog-content p,
	.p-dialog-footer button {
		font-size: var(--odk-base-font-size);
	}

	button.p-button-secondary:focus-visible {
		outline: none;
		outline-offset: unset;
	}
}
</style>
