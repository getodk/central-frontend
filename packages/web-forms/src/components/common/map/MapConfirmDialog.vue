<script setup lang="ts">
import {
	SINGLE_FEATURE_TYPES,
	type SingleFeatureType,
} from '@/components/common/map/getModeConfig.ts';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

defineProps<{
	singleFeatureType: SingleFeatureType | undefined;
	visible: boolean;
}>();

const emit = defineEmits(['update:visible', 'deleteFeature']);
</script>

<template>
	<Dialog
		:visible="visible"
		modal
		class="map-block-dialog"
		:draggable="false"
		@update:visible="emit('update:visible', $event)"
	>
		<template #header>
			<!-- TODO: translations -->
			<strong v-if="singleFeatureType === SINGLE_FEATURE_TYPES.SHAPE">Delete entire shape?</strong>
			<strong v-else>Delete entire trace?</strong>
		</template>

		<template #default>
			<!-- TODO: translations -->
			<p v-if="singleFeatureType === SINGLE_FEATURE_TYPES.SHAPE">
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
