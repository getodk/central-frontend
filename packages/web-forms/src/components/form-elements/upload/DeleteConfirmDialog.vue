<script setup lang="ts">
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

defineProps<{
	visible: boolean;
}>();

const emit = defineEmits(['update:visible', 'deleteFile']);
</script>

<template>
	<Dialog
		:visible="visible"
		modal
		:draggable="false"
		@update:visible="emit('update:visible', $event)"
	>
		<template #header>
			<!-- TODO: translations -->
			<strong>Delete uploaded file?</strong>
		</template>

		<template #default>
			<!-- TODO: translations -->
			<p>Are you sure you want to delete this file?</p>
		</template>

		<template #footer>
			<!-- TODO: translations -->
			<Button label="Delete" @click="emit('deleteFile')" />
		</template>
	</Dialog>
</template>
